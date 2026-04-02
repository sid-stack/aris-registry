"""
Gap Analyzer — Win-gap identification and teaming strategy.
Converts scorer gaps into actionable remediation playbooks.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Gap:
    category: str           # Clearance | Certification | NAICS | Set-Aside | Capacity
    description: str
    severity: str           # HARD | SOFT
    time_to_close: str      # e.g. "6-18 months", "30 days"
    cost_to_close: str      # e.g. "$50K-$200K", "None"
    teaming_strategy: Optional[str]
    go_no_go_factor: bool   # True = this alone could be a NO-BID signal


@dataclass
class GapAnalysis:
    go_recommendation: str  # BID | NO-BID | CONDITIONAL
    win_probability_adjustment: int  # +/- points on top of base score
    hard_gaps: List[Gap]
    soft_gaps: List[Gap]
    teaming_required: bool
    teaming_rationale: str
    win_theme: str


PLAYBOOKS = {
    "cmmc level 2": Gap(
        category="Certification",
        description="CMMC Level 2 certification not in company profile",
        severity="HARD",
        time_to_close="6-18 months",
        cost_to_close="$50K–$200K (C3PAO assessment)",
        teaming_strategy="Partner with CMMC Level 2 certified firm as prime or major sub",
        go_no_go_factor=True,
    ),
    "cmmc level 3": Gap(
        category="Certification",
        description="CMMC Level 3 / DIBCAC assessment required",
        severity="HARD",
        time_to_close="12-24 months",
        cost_to_close="$200K–$500K",
        teaming_strategy="Prime must hold CMMC L3 — consider teaming or walking away",
        go_no_go_factor=True,
    ),
    "secret clearance": Gap(
        category="Clearance",
        description="Secret-cleared personnel required on Day 1",
        severity="HARD",
        time_to_close="6-12 months (new clearance)",
        cost_to_close="$5K–$15K per person for sponsorship",
        teaming_strategy="Partner with firm that has cleared staff in the required location",
        go_no_go_factor=True,
    ),
    "top secret": Gap(
        category="Clearance",
        description="TS or TS/SCI cleared personnel required",
        severity="HARD",
        time_to_close="12-24 months (new TS/SCI)",
        cost_to_close="$20K–$50K per person",
        teaming_strategy="Subcontract key personnel roles to cleared firm; prime can hold cleared facility",
        go_no_go_factor=True,
    ),
    "fedramp": Gap(
        category="Certification",
        description="FedRAMP authorization required for hosted solution",
        severity="HARD",
        time_to_close="12-24 months",
        cost_to_close="$500K–$2M (full FedRAMP path)",
        teaming_strategy="Use FedRAMP-authorized platform (AWS GovCloud, Azure Gov) — not self-built",
        go_no_go_factor=False,
    ),
    "naics mismatch": Gap(
        category="NAICS",
        description="Primary NAICS code does not match solicitation",
        severity="SOFT",
        time_to_close="None required — NAICS is informational",
        cost_to_close="None",
        teaming_strategy="Bid under your closest NAICS; document adjacent capabilities clearly",
        go_no_go_factor=False,
    ),
    "set-aside ineligible": Gap(
        category="Set-Aside",
        description="Company does not hold required set-aside certification",
        severity="HARD",
        time_to_close="3-12 months (depending on certification type)",
        cost_to_close="$5K–$30K (SBA certification fees and process)",
        teaming_strategy="Team as sub with eligible prime; or wait for re-compete at full-open",
        go_no_go_factor=True,
    ),
}


def analyze(scorer_gaps: List[str], incumbent_score: int, set_aside_type: str) -> GapAnalysis:
    hard_gaps = []
    soft_gaps = []
    teaming_required = False
    win_prob_adjustment = 0

    gaps_lower = [g.lower() for g in scorer_gaps]

    for gap_text in gaps_lower:
        matched = False
        for key, playbook in PLAYBOOKS.items():
            if key in gap_text:
                gap = Gap(
                    category=playbook.category,
                    description=playbook.description,
                    severity=playbook.severity,
                    time_to_close=playbook.time_to_close,
                    cost_to_close=playbook.cost_to_close,
                    teaming_strategy=playbook.teaming_strategy,
                    go_no_go_factor=playbook.go_no_go_factor,
                )
                if playbook.severity == "HARD":
                    hard_gaps.append(gap)
                    win_prob_adjustment -= 10
                    if playbook.teaming_strategy:
                        teaming_required = True
                else:
                    soft_gaps.append(gap)
                    win_prob_adjustment -= 3
                matched = True
                break
        if not matched and gap_text.strip():
            soft_gaps.append(Gap(
                category="Other",
                description=gap_text,
                severity="SOFT",
                time_to_close="Varies",
                cost_to_close="Varies",
                teaming_strategy=None,
                go_no_go_factor=False,
            ))

    # Incumbent signal adjustment
    if incumbent_score >= 7:
        win_prob_adjustment -= 15
    elif incumbent_score >= 4:
        win_prob_adjustment -= 5

    # Go/No-Go decision
    disqualifying_hard = [g for g in hard_gaps if g.go_no_go_factor]
    if len(disqualifying_hard) >= 2:
        recommendation = "NO-BID"
    elif len(disqualifying_hard) == 1:
        recommendation = "CONDITIONAL"
    elif incumbent_score >= 8:
        recommendation = "CONDITIONAL"
    else:
        recommendation = "BID"

    # Win theme
    if recommendation == "BID":
        theme = "Position on demonstrated capabilities and agency familiarity. Lead with past performance and certifications."
    elif recommendation == "CONDITIONAL":
        issue = disqualifying_hard[0].description if disqualifying_hard else "moderate incumbent risk"
        theme = f"Resolve: {issue}. If resolved, this is a winnable opportunity."
    else:
        theme = "Multiple hard blockers detected. Teaming or deferral recommended."

    teaming_rationale = ""
    if teaming_required:
        strategies = [g.teaming_strategy for g in hard_gaps if g.teaming_strategy]
        teaming_rationale = " | ".join(strategies[:2]) if strategies else "Teaming required to address qualification gaps."

    return GapAnalysis(
        go_recommendation=recommendation,
        win_probability_adjustment=win_prob_adjustment,
        hard_gaps=hard_gaps,
        soft_gaps=soft_gaps,
        teaming_required=teaming_required,
        teaming_rationale=teaming_rationale,
        win_theme=theme,
    )
