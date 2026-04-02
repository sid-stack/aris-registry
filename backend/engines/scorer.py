"""
BidSmith Scoring Engine — Weighted bipartite match.
Maps RFP requirements against company profile.
No LLM. Deterministic. Fast.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
import re


@dataclass
class ScoreBreakdown:
    naics_match: int        # 0-25
    agency_familiarity: int # 0-15
    set_aside_fit: int      # 0-15
    cert_match: int         # 0-15
    value_fit: int          # 0-10
    timeline_fit: int       # 0-10
    incumbent_penalty: int  # 0 or negative
    total: int
    match_label: str        # STRONG | GOOD | MODERATE | WEAK
    why_matches: List[str]
    gaps: List[str]


def _token_overlap(a: str, b: str) -> float:
    """Soft Jaccard — partial word overlap, not strict set equality."""
    stop = {"the", "and", "for", "with", "from", "that", "this", "are", "was", "is", "of", "in", "to", "a", "an"}
    ta = set(w.lower() for w in re.split(r"\W+", a) if len(w) > 3 and w.lower() not in stop)
    tb = set(w.lower() for w in re.split(r"\W+", b) if len(w) > 3 and w.lower() not in stop)
    if not ta or not tb:
        return 0.0
    intersection = ta & tb
    union = ta | tb
    # Soft: reward recall heavily (does company text cover RFP terms?)
    recall = len(intersection) / len(tb) if tb else 0.0
    jaccard = len(intersection) / len(union) if union else 0.0
    return 0.7 * recall + 0.3 * jaccard


def _naics_score(company_naics: List[str], rfp_naics: str) -> tuple[int, str]:
    if not rfp_naics:
        return 10, "NAICS not specified"
    if rfp_naics in company_naics[:1]:
        return 25, f"NAICS {rfp_naics} exact match (primary)"
    if rfp_naics in company_naics:
        return 18, f"NAICS {rfp_naics} secondary match"
    # Adjacent: same first 4 digits
    for c in company_naics:
        if rfp_naics[:4] == c[:4]:
            return 10, f"Adjacent NAICS (same subsector)"
    return 3, f"NAICS {rfp_naics} — no match in profile"


def _agency_score(agency_history: List[Dict], rfp_agency: str) -> tuple[int, str]:
    if not rfp_agency or not agency_history:
        return 0, "No agency history on file"
    rfp_lower = rfp_agency.lower()
    for record in agency_history:
        agency_lower = record.get("agency", "").lower()
        if agency_lower and agency_lower in rfp_lower:
            return 15, f"Prior award at {record['agency']} — strong familiarity"
        # Same branch (Army/Navy/Air Force under DoD)
        dod_branches = {"army", "navy", "air force", "marines", "coast guard", "space force"}
        if any(b in agency_lower and b in rfp_lower for b in dod_branches):
            return 7, "Same DoD branch — transferable relationships"
    if "dod" in rfp_lower or "defense" in rfp_lower:
        if any("dod" in r.get("agency", "").lower() or "defense" in r.get("agency", "").lower() for r in agency_history):
            return 5, "Prior DoD work — applicable experience"
    return 0, "No prior work at this agency"


def _set_aside_score(company_eligibility: List[str], rfp_set_aside: str) -> tuple[int, str]:
    if not rfp_set_aside or rfp_set_aside.lower() in ("unrestricted", "full and open", "not stated", "none"):
        return 7, "Full & open competition — no eligibility advantage"
    eligibility_lower = [e.lower() for e in company_eligibility]
    rfp_lower = rfp_set_aside.lower()
    if any(e in rfp_lower or rfp_lower in e for e in eligibility_lower):
        return 15, f"Eligible for {rfp_set_aside} set-aside"
    return 0, f"NOT eligible for {rfp_set_aside} set-aside — disqualifying"


def _cert_score(company_certs: List[str], requirements_text: str) -> tuple[int, List[str], List[str]]:
    """Returns (score, matched_certs, missing_certs)"""
    CERT_SIGNALS = {
        "cmmc level 2": ["cmmc level 2", "cmmc l2", "252.204-7021"],
        "cmmc level 3": ["cmmc level 3", "cmmc l3"],
        "fedramp":       ["fedramp", "federal risk and authorization"],
        "secret":        ["secret clearance", "top secret", "ts/sci", "secret-cleared"],
        "top secret":    ["top secret", "ts/sci", "tssci"],
        "iso 9001":      ["iso 9001", "iso9001"],
        "cmmi level 3":  ["cmmi level 3", "cmmi-dev/3", "cmmi 3"],
        "itar":          ["itar", "international traffic in arms"],
        "sam.gov":       ["sam.gov", "uei", "cage code"],
    }

    req_lower = requirements_text.lower()
    company_lower = [c.lower() for c in company_certs]
    matched = []
    missing = []

    for cert_key, signals in CERT_SIGNALS.items():
        if any(s in req_lower for s in signals):
            # RFP requires this cert
            if any(s in " ".join(company_lower) for s in signals):
                matched.append(cert_key)
            else:
                missing.append(cert_key)

    if not matched and not missing:
        return 10, [], []  # no special certs required

    total_required = len(matched) + len(missing)
    if total_required == 0:
        return 10, [], []

    ratio = len(matched) / total_required
    score = round(15 * ratio)
    return score, matched, missing


def _value_score(company_min: int, company_max: int, rfp_value_min: int, rfp_value_max: int) -> tuple[int, str]:
    if rfp_value_max == 0:
        return 5, "Contract value not stated"
    mid = (rfp_value_min + rfp_value_max) / 2
    if company_min <= mid <= company_max:
        return 10, f"Contract value within target range"
    if mid < company_min:
        ratio = company_min / mid if mid > 0 else 99
        if ratio < 2:
            return 7, "Slightly below target floor — still viable"
        return 3, "Below minimum viable contract size"
    if mid > company_max:
        ratio = mid / company_max if company_max > 0 else 99
        if ratio < 2:
            return 6, "Slightly above target ceiling — consider teaming"
        return 2, "Significantly above capacity — teaming required"
    return 5, "Value assessment inconclusive"


def _timeline_score(response_window_days: Optional[int], min_response_days: int) -> tuple[int, str]:
    if response_window_days is None:
        return 7, "Response window not specified"
    if response_window_days >= 14:
        return 10, f"{response_window_days} days — comfortable response window"
    if response_window_days >= min_response_days:
        return 5, f"{response_window_days} days — tight but manageable"
    return 2, f"{response_window_days} days — below your minimum ({min_response_days}d threshold)"


def _incumbent_penalty(incumbent_score: int) -> tuple[int, str]:
    if incumbent_score <= 3:
        return 0, "Low incumbent risk"
    if incumbent_score <= 6:
        return -5, f"Moderate incumbent risk (score {incumbent_score}/10)"
    if incumbent_score <= 8:
        return -10, f"High incumbent risk (score {incumbent_score}/10) — carefully evaluate"
    return -15, f"CRITICAL incumbent risk (score {incumbent_score}/10) — likely wired"


def score(company_profile: dict, rfp_metadata: dict, requirements_text: str, incumbent_signal_score: int = 0) -> ScoreBreakdown:
    """
    Compute BidSmith score for one opportunity against one company profile.

    company_profile keys:
      naics_codes, agency_history, set_aside_eligibility, certifications,
      value_min, value_max, min_response_days, capabilities_text

    rfp_metadata keys:
      naics_code, agency, set_aside_type, value_min, value_max, response_window_days
    """
    why = []
    gaps = []

    naics_pts, naics_why = _naics_score(
        company_profile.get("naics_codes", []),
        rfp_metadata.get("naics_code", "")
    )
    if naics_pts >= 18:
        why.append(naics_why)
    elif naics_pts < 10:
        gaps.append(naics_why)

    agency_pts, agency_why = _agency_score(
        company_profile.get("agency_history", []),
        rfp_metadata.get("agency", "")
    )
    if agency_pts >= 10:
        why.append(agency_why)

    set_aside_pts, set_aside_why = _set_aside_score(
        company_profile.get("set_aside_eligibility", []),
        rfp_metadata.get("set_aside_type", "")
    )
    if set_aside_pts == 0:
        gaps.append(set_aside_why)
    elif set_aside_pts == 15:
        why.append(set_aside_why)

    cert_pts, matched_certs, missing_certs = _cert_score(
        company_profile.get("certifications", []),
        requirements_text
    )
    for c in matched_certs:
        why.append(f"{c.upper()} required — you have it")
    for c in missing_certs:
        gaps.append(f"{c.upper()} required — not in company profile")

    value_pts, value_why = _value_score(
        company_profile.get("value_min", 0),
        company_profile.get("value_max", 50_000_000),
        rfp_metadata.get("value_min", 0),
        rfp_metadata.get("value_max", 0)
    )

    timeline_pts, timeline_why = _timeline_score(
        rfp_metadata.get("response_window_days"),
        company_profile.get("min_response_days", 5)
    )

    penalty, penalty_why = _incumbent_penalty(incumbent_signal_score)
    if penalty < -5:
        gaps.append(penalty_why)

    raw = naics_pts + agency_pts + set_aside_pts + cert_pts + value_pts + timeline_pts + penalty
    total = max(0, min(100, raw))

    if total >= 75:
        label = "STRONG"
    elif total >= 55:
        label = "GOOD"
    elif total >= 35:
        label = "MODERATE"
    else:
        label = "WEAK"

    return ScoreBreakdown(
        naics_match=naics_pts,
        agency_familiarity=agency_pts,
        set_aside_fit=set_aside_pts,
        cert_match=cert_pts,
        value_fit=value_pts,
        timeline_fit=timeline_pts,
        incumbent_penalty=penalty,
        total=total,
        match_label=label,
        why_matches=why,
        gaps=gaps,
    )
