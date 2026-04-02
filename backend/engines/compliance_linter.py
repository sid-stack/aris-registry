"""
Compliance Linter — FAR/DFARS regulatory scan.
Cross-references company posture against known federal mandates.
"""

from dataclasses import dataclass
from typing import List
import re


@dataclass
class ComplianceFlag:
    clause: str
    title: str
    risk: str           # HIGH | MED | LOW
    plain_english: str
    company_status: str # COMPLIANT | AT-RISK | UNKNOWN
    action: str


FAR_KNOWLEDGE_BASE = {
    "52.204-7": {
        "title": "System for Award Management",
        "risk": "HIGH",
        "plain_english": "Must be registered in SAM.gov at time of submission. Unregistered offerors are automatically disqualified. Verify registration is active and not expired.",
        "trigger_patterns": [r"sam\.gov", r"system for award management", r"uei", r"cage code"],
        "company_field": "sam_registered",
    },
    "52.204-21": {
        "title": "Basic Safeguarding of Covered Contractor Information Systems",
        "risk": "HIGH",
        "plain_english": "15 basic cybersecurity controls required for any system that processes federal contract information. Must be documented in your System Security Plan.",
        "trigger_patterns": [r"covered contractor", r"basic safeguarding", r"52\.204-21"],
        "company_field": "cybersecurity_compliant",
    },
    "252.204-7012": {
        "title": "Safeguarding Covered Defense Information (CDI) — DFARS",
        "risk": "HIGH",
        "plain_english": "Requires NIST SP 800-171 implementation, SPRS score posting, and 72-hour cyber incident reporting to DoD. Non-compliance is grounds for contract termination.",
        "trigger_patterns": [r"covered defense information", r"cdi", r"dfars\s+252\.204-7012", r"nist\s+sp\s+800-171"],
        "company_field": "sprs_posted",
    },
    "252.204-7021": {
        "title": "Contractor Compliance with CMMC Level Requirements",
        "risk": "HIGH",
        "plain_english": "CMMC Level 2 or 3 required. Must be assessed by a C3PAO (Level 2) or DIBCAC (Level 3). Self-attestation no longer sufficient for Level 2+. Verification happens before award.",
        "trigger_patterns": [r"cmmc", r"cybersecurity maturity model", r"252\.204-7021"],
        "company_field": "cmmc_level",
    },
    "52.219-6": {
        "title": "Notice of Total Small Business Set-Aside",
        "risk": "HIGH",
        "plain_english": "Only small businesses under the NAICS size standard may submit. Verify your SBA certification and size standard compliance before bidding.",
        "trigger_patterns": [r"small business set-?aside", r"52\.219-6", r"total small business"],
        "company_field": "small_business_certified",
    },
    "52.222-41": {
        "title": "Service Contract Labor Standards (SCA)",
        "risk": "MED",
        "plain_english": "If any workers perform service contract work, you must pay SCA wage rates. Must include wage determinations in your pricing. Common on IT services and facilities contracts.",
        "trigger_patterns": [r"service contract act", r"sca", r"52\.222-41", r"wage determination"],
        "company_field": None,
    },
    "52.227-14": {
        "title": "Rights in Data — General",
        "risk": "MED",
        "plain_english": "Government gets license to use, reproduce, and disclose data produced under the contract. If you have proprietary tools or IP, assert Limited Rights early in the proposal.",
        "trigger_patterns": [r"rights in data", r"52\.227-14", r"intellectual property"],
        "company_field": None,
    },
    "52.246-25": {
        "title": "Limitation of Liability — Services",
        "risk": "LOW",
        "plain_english": "Limits contractor liability to the greater of $500K or the contract value. Standard on service contracts. Review with legal counsel if contract value is large.",
        "trigger_patterns": [r"limitation of liability", r"52\.246-25"],
        "company_field": None,
    },
}


def lint(solicitation_text: str, company_profile: dict) -> List[ComplianceFlag]:
    """
    Scan solicitation text for FAR/DFARS clauses.
    Cross-reference against company profile posture.
    Returns list of ComplianceFlags.
    """
    text_lower = solicitation_text.lower()
    flags = []

    for clause_num, meta in FAR_KNOWLEDGE_BASE.items():
        triggered = any(re.search(p, text_lower) for p in meta["trigger_patterns"])
        if not triggered:
            # Also check if clause number appears literally
            if clause_num.lower() not in text_lower:
                continue

        # Determine company status
        field = meta.get("company_field")
        if field is None:
            status = "UNKNOWN"
        elif company_profile.get(field):
            status = "COMPLIANT"
        else:
            status = "AT-RISK"

        # Build action
        if status == "AT-RISK":
            action = f"Address {meta['title']} gap before submission. See plain_english for details."
        elif status == "COMPLIANT":
            action = "Document compliance in proposal. Keep evidence ready for evaluation."
        else:
            action = "Verify compliance status. Include documentation in proposal if applicable."

        flags.append(ComplianceFlag(
            clause=clause_num,
            title=meta["title"],
            risk=meta["risk"],
            plain_english=meta["plain_english"],
            company_status=status,
            action=action,
        ))

    return flags
