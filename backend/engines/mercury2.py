"""
Mercury 2 — Section L/M Shredder
Deterministic requirement extraction from federal solicitation text.
Runs in < 5ms on a 100KB solicitation.
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional

SECTION_PATTERNS = {
    "L": re.compile(r"section\s+l\b", re.IGNORECASE),
    "M": re.compile(r"section\s+m\b", re.IGNORECASE),
    "C": re.compile(r"section\s+c\b|statement\s+of\s+work|performance\s+work\s+statement", re.IGNORECASE),
    "H": re.compile(r"section\s+h\b|special\s+contract\s+requirements", re.IGNORECASE),
}

SHALL_PATTERN = re.compile(r"\b(shall|must|required|mandatory|will\s+be\s+required|is\s+required)\b", re.IGNORECASE)
FAR_PATTERN = re.compile(r"\b(FAR|DFARS)\s+(\d{2}\.\d{3}(?:-\d+)?)", re.IGNORECASE)
DISQUALIFIER_PATTERN = re.compile(r"\b(will\s+be\s+(rejected|disqualified|deemed\s+non-?responsive)|not\s+acceptable|automatic\s+(rejection|disqualification))\b", re.IGNORECASE)

CATEGORY_SIGNALS = {
    "Clearance":      re.compile(r"\b(secret|top\s*secret|ts\/sci|sci|clearance|cleared\s+personnel)\b", re.IGNORECASE),
    "Cybersecurity":  re.compile(r"\b(cmmc|nist\s+sp\s+800|sprs|ato|fedramp|il[2-6]|disa|stig)\b", re.IGNORECASE),
    "Certification":  re.compile(r"\b(iso\s*\d{4,5}|cmmi|pmp|cissp|itar|cage\s+code|uei|sam\.gov)\b", re.IGNORECASE),
    "Past Performance": re.compile(r"\b(past\s+performance|relevant\s+experience|prior\s+contract|reference)\b", re.IGNORECASE),
    "Personnel":      re.compile(r"\b(key\s+personnel|program\s+manager|project\s+manager|on-?site|named\s+individual)\b", re.IGNORECASE),
    "Formatting":     re.compile(r"\b(page\s+limit|font|margin|single\s+spaced|double\s+spaced|file\s+format|pdf)\b", re.IGNORECASE),
    "Financial":      re.compile(r"\b(bid\s+bond|performance\s+bond|cost\s+volume|price\s+volume|lpta|rate\s+card)\b", re.IGNORECASE),
    "Compliance":     re.compile(r"\b(far|dfars|subcontracting\s+plan|small\s+business|set-?aside|naics)\b", re.IGNORECASE),
}


@dataclass
class Requirement:
    id: str
    text: str
    section: str
    category: str
    is_shall: bool
    is_disqualifier: bool
    far_refs: List[str] = field(default_factory=list)
    source_excerpt: str = ""


@dataclass
class ShredResult:
    requirements: List[Requirement]
    sections_found: List[str]
    total_count: int
    disqualifier_count: int
    high_risk_count: int


def _detect_section(line: str, context_section: str) -> str:
    for sec, pattern in SECTION_PATTERNS.items():
        if pattern.search(line):
            return sec
    return context_section


def _classify_category(text: str) -> str:
    for category, pattern in CATEGORY_SIGNALS.items():
        if pattern.search(text):
            return category
    return "Technical"


def _extract_far_refs(text: str) -> List[str]:
    return [f"{m.group(1).upper()} {m.group(2)}" for m in FAR_PATTERN.finditer(text)]


def shred(text: str) -> ShredResult:
    """
    Split solicitation text into discrete requirements.
    Returns structured ShredResult.
    """
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    requirements = []
    current_section = "Other"
    sections_found = set()
    req_counter = 0

    for line in lines:
        # Update current section context
        detected = _detect_section(line, current_section)
        if detected != current_section:
            current_section = detected
            sections_found.add(current_section)

        # Only extract lines with obligation language
        if not SHALL_PATTERN.search(line):
            continue

        # Skip very short or header-like lines
        if len(line) < 30 or line.isupper():
            continue

        req_counter += 1
        rid = f"REQ-{req_counter:03d}"

        requirements.append(Requirement(
            id=rid,
            text=line[:280],
            section=current_section,
            category=_classify_category(line),
            is_shall=True,
            is_disqualifier=bool(DISQUALIFIER_PATTERN.search(line)),
            far_refs=_extract_far_refs(line),
            source_excerpt=line[:150],
        ))

    high_risk = sum(1 for r in requirements if r.category in ("Clearance", "Cybersecurity"))

    return ShredResult(
        requirements=requirements,
        sections_found=list(sections_found),
        total_count=len(requirements),
        disqualifier_count=sum(1 for r in requirements if r.is_disqualifier),
        high_risk_count=high_risk,
    )
