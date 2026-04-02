"""
BidSmith DAMN Report — CLI Demo Runner
Usage: python run_demo.py
"""

import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from engines.mercury2 import shred
from engines.scorer import score
from engines.gap_analyzer import analyze
from engines.compliance_linter import lint
from report.damn_generator import generate


def main():
    demo_dir = os.path.dirname(__file__)
    rfp_path = os.path.join(demo_dir, "sample_rfp.txt")
    company_path = os.path.join(demo_dir, "sample_company.json")

    with open(rfp_path) as f:
        rfp_text = f.read()

    with open(company_path) as f:
        company = json.load(f)

    rfp_metadata = {
        "title": "IT Infrastructure Support Services",
        "agency": "Army Corps of Engineers",
        "solicitation_number": "W912EE-26-R-0042",
        "naics_code": "541512",
        "set_aside_type": "Small Business",
        "contract_type": "IDIQ",
        "value_min": 10000000,
        "value_max": 12400000,
        "due_date": "2026-04-14",
        "response_window_days": 11,
    }

    print("[1/5] Shredding requirements...")
    shred_result = shred(rfp_text)
    print(f"  → {shred_result.total_count} requirements extracted ({shred_result.disqualifier_count} disqualifiers)")

    req_text = " ".join(r.text for r in shred_result.requirements)

    print("[2/5] Scoring against company profile...")
    score_result = score(
        company_profile=company,
        rfp_metadata=rfp_metadata,
        requirements_text=req_text,
        incumbent_signal_score=4,
    )
    print(f"  → BidSmith Score: {score_result.total}/100 ({score_result.match_label})")
    for w in score_result.why_matches:
        print(f"     ✓ {w}")
    for g in score_result.gaps:
        print(f"     ⚠ {g}")

    print("[3/5] Analyzing gaps...")
    gap_result = analyze(
        scorer_gaps=score_result.gaps,
        incumbent_score=4,
        set_aside_type=rfp_metadata["set_aside_type"],
    )
    print(f"  → Recommendation: {gap_result.go_recommendation}")
    print(f"  → Win theme: {gap_result.win_theme}")

    print("[4/5] Linting FAR/DFARS...")
    compliance_flags = lint(rfp_text, company)
    print(f"  → {len(compliance_flags)} compliance flags")
    for f in compliance_flags:
        print(f"     {f.clause} ({f.risk}) — {f.company_status}")

    print("[5/5] Generating PDF...")
    win_prob = min(90, max(10, score_result.total + gap_result.win_probability_adjustment))

    report_data = {
        "rfp": rfp_metadata,
        "company": {"name": company["name"]},
        "score": {
            "total": score_result.total,
            "match_label": score_result.match_label,
            "naics_match": score_result.naics_match,
            "agency_familiarity": score_result.agency_familiarity,
            "set_aside_fit": score_result.set_aside_fit,
            "cert_match": score_result.cert_match,
            "value_fit": score_result.value_fit,
            "timeline_fit": score_result.timeline_fit,
            "incumbent_penalty": score_result.incumbent_penalty,
            "why_matches": score_result.why_matches,
            "gaps": score_result.gaps,
        },
        "gap_analysis": {
            "go_recommendation": gap_result.go_recommendation,
            "win_probability_adjustment": gap_result.win_probability_adjustment,
            "hard_gaps": [g.__dict__ for g in gap_result.hard_gaps],
            "soft_gaps": [g.__dict__ for g in gap_result.soft_gaps],
            "teaming_required": gap_result.teaming_required,
            "teaming_rationale": gap_result.teaming_rationale,
            "win_theme": gap_result.win_theme,
        },
        "requirements": [
            {"id": r.id, "text": r.text, "section": r.section,
             "category": r.category, "is_disqualifier": r.is_disqualifier, "action_required": ""}
            for r in shred_result.requirements
        ],
        "compliance_flags": [f.__dict__ for f in compliance_flags],
        "incumbent_signal": {
            "score": 4, "label": "LOW",
            "signals_detected": [], "explanation": "Two moderate signals — not wired."
        },
        "proposal_roadmap": [],
        "evaluation_type": "Best Value — Technical-Led",
        "evaluation_reality": "Technical Approach is most important per Section M. Price is least important.",
        "summary": f"Score {score_result.total}/100 ({score_result.match_label}). {gap_result.win_theme}",
        "recommendation": gap_result.go_recommendation,
        "win_probability": win_prob,
    }

    pdf_bytes = generate(report_data)
    output_path = os.path.join(demo_dir, "output_report.pdf")
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    print(f"\n✓ Report generated: {output_path} ({len(pdf_bytes):,} bytes)")
    print(f"  Score: {score_result.total}/100 | Win Prob: {win_prob}% | Rec: {gap_result.go_recommendation}")


if __name__ == "__main__":
    main()
