"""
BidSmith DAMN Report API — FastAPI
Railway-ready. 3 endpoints.

POST /analyze  → JSON intelligence summary
POST /extract  → raw requirements JSON (HITL review layer)
POST /report   → full DAMN Report PDF
"""

import os
import json
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from engines.mercury2 import shred
from engines.scorer import score
from engines.gap_analyzer import analyze
from engines.compliance_linter import lint
from report.damn_generator import generate

app = FastAPI(
    title="BidSmith DAMN Report API",
    description="Deterministic Audit + Match + Narrative — Federal Solicitation Intelligence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bidsmith.pro", "https://www.bidsmith.pro", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# ─── Request models ───────────────────────────────────────────────────────────

class CompanyProfile(BaseModel):
    name: str = "Your Company"
    naics_codes: List[str] = []
    capabilities_text: str = ""
    certifications: List[str] = []
    clearances: List[str] = []
    set_aside_eligibility: List[str] = []
    agency_history: List[dict] = []
    value_min: int = 0
    value_max: int = 50_000_000
    min_response_days: int = 5
    sam_registered: bool = True
    sprs_posted: bool = False
    cmmc_level: Optional[str] = None
    small_business_certified: bool = False
    cybersecurity_compliant: bool = False


class RFPMetadata(BaseModel):
    title: str = "Federal Solicitation"
    agency: str = "Federal Agency"
    solicitation_number: Optional[str] = None
    naics_code: str = ""
    set_aside_type: str = "Unrestricted"
    contract_type: str = "FFP"
    value_min: int = 0
    value_max: int = 0
    due_date: Optional[str] = None
    response_window_days: Optional[int] = None


class AnalyzeRequest(BaseModel):
    solicitation_text: str
    rfp_metadata: Optional[RFPMetadata] = None
    company_profile: Optional[CompanyProfile] = None
    incumbent_signal_score: int = 0


# ─── Shared pipeline ──────────────────────────────────────────────────────────

def _run_pipeline(solicitation_text: str, rfp_metadata: dict, company_profile: dict, incumbent_signal_score: int):
    # 1. Shred requirements
    shred_result = shred(solicitation_text)

    # 2. Build requirements text for cert scoring
    req_text = " ".join(r.text for r in shred_result.requirements)

    # 3. Score against company profile
    score_result = score(
        company_profile=company_profile,
        rfp_metadata=rfp_metadata,
        requirements_text=req_text,
        incumbent_signal_score=incumbent_signal_score,
    )

    # 4. Analyze gaps
    gap_result = analyze(
        scorer_gaps=score_result.gaps,
        incumbent_score=incumbent_signal_score,
        set_aside_type=rfp_metadata.get("set_aside_type", ""),
    )

    # 5. Lint FAR/DFARS
    compliance_flags = lint(solicitation_text, company_profile)

    # Adjust win probability: base score + gap adjustment, capped
    win_prob = min(90, max(10, score_result.total + gap_result.win_probability_adjustment))

    return {
        "shred_result": shred_result,
        "score_result": score_result,
        "gap_result": gap_result,
        "compliance_flags": compliance_flags,
        "win_probability": win_prob,
        "recommendation": gap_result.go_recommendation,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "BidSmith DAMN Report API"}


@app.post("/extract")
async def extract(req: AnalyzeRequest):
    """Extract raw requirements — for HITL review."""
    try:
        shred_result = shred(req.solicitation_text)
        return {
            "requirements": [
                {
                    "id": r.id, "text": r.text, "section": r.section,
                    "category": r.category, "is_shall": r.is_shall,
                    "is_disqualifier": r.is_disqualifier,
                    "far_refs": r.far_refs, "source_excerpt": r.source_excerpt,
                }
                for r in shred_result.requirements
            ],
            "sections_found": shred_result.sections_found,
            "total_count": shred_result.total_count,
            "disqualifier_count": shred_result.disqualifier_count,
            "high_risk_count": shred_result.high_risk_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze_rfp(req: AnalyzeRequest):
    """Full intelligence analysis — JSON output."""
    try:
        rfp_meta = req.rfp_metadata.model_dump() if req.rfp_metadata else {}
        company = req.company_profile.model_dump() if req.company_profile else {}

        result = _run_pipeline(
            req.solicitation_text, rfp_meta, company, req.incumbent_signal_score
        )

        sr = result["score_result"]
        gr = result["gap_result"]
        shred_r = result["shred_result"]

        return {
            "recommendation": result["recommendation"],
            "win_probability": result["win_probability"],
            "score": {
                "total": sr.total,
                "match_label": sr.match_label,
                "naics_match": sr.naics_match,
                "agency_familiarity": sr.agency_familiarity,
                "set_aside_fit": sr.set_aside_fit,
                "cert_match": sr.cert_match,
                "value_fit": sr.value_fit,
                "timeline_fit": sr.timeline_fit,
                "incumbent_penalty": sr.incumbent_penalty,
                "why_matches": sr.why_matches,
                "gaps": sr.gaps,
            },
            "gap_analysis": {
                "go_recommendation": gr.go_recommendation,
                "win_probability_adjustment": gr.win_probability_adjustment,
                "hard_gaps": [g.__dict__ for g in gr.hard_gaps],
                "soft_gaps": [g.__dict__ for g in gr.soft_gaps],
                "teaming_required": gr.teaming_required,
                "teaming_rationale": gr.teaming_rationale,
                "win_theme": gr.win_theme,
            },
            "requirements": {
                "total": shred_r.total_count,
                "disqualifiers": shred_r.disqualifier_count,
                "high_risk": shred_r.high_risk_count,
            },
            "compliance_flags": [f.__dict__ for f in result["compliance_flags"]],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/report")
async def generate_report(req: AnalyzeRequest):
    """Generate full DAMN Report PDF. Returns binary PDF."""
    try:
        rfp_meta = req.rfp_metadata.model_dump() if req.rfp_metadata else {}
        company = req.company_profile.model_dump() if req.company_profile else {}

        result = _run_pipeline(
            req.solicitation_text, rfp_meta, company, req.incumbent_signal_score
        )

        sr = result["score_result"]
        gr = result["gap_result"]
        shred_r = result["shred_result"]

        report_data = {
            "rfp": rfp_meta,
            "company": {"name": company.get("name", "Your Company")},
            "score": {
                "total": sr.total,
                "match_label": sr.match_label,
                "naics_match": sr.naics_match,
                "agency_familiarity": sr.agency_familiarity,
                "set_aside_fit": sr.set_aside_fit,
                "cert_match": sr.cert_match,
                "value_fit": sr.value_fit,
                "timeline_fit": sr.timeline_fit,
                "incumbent_penalty": sr.incumbent_penalty,
                "why_matches": sr.why_matches,
                "gaps": sr.gaps,
            },
            "gap_analysis": {
                "go_recommendation": gr.go_recommendation,
                "win_probability_adjustment": gr.win_probability_adjustment,
                "hard_gaps": [g.__dict__ for g in gr.hard_gaps],
                "soft_gaps": [g.__dict__ for g in gr.soft_gaps],
                "teaming_required": gr.teaming_required,
                "teaming_rationale": gr.teaming_rationale,
                "win_theme": gr.win_theme,
            },
            "requirements": [
                {
                    "id": r.id, "text": r.text, "section": r.section,
                    "category": r.category, "is_disqualifier": r.is_disqualifier,
                    "action_required": "",
                }
                for r in shred_r.requirements
            ],
            "compliance_flags": [f.__dict__ for f in result["compliance_flags"]],
            "incumbent_signal": {
                "score": req.incumbent_signal_score,
                "label": "LOW" if req.incumbent_signal_score <= 3 else "MODERATE" if req.incumbent_signal_score <= 6 else "HIGH",
                "signals_detected": [],
                "explanation": "",
            },
            "proposal_roadmap": rfp_meta.get("proposal_roadmap", []),
            "evaluation_type": rfp_meta.get("evaluation_type", "Unknown"),
            "evaluation_reality": rfp_meta.get("evaluation_reality", ""),
            "summary": f"BidSmith Score: {sr.total}/100 ({sr.match_label}). Recommendation: {gr.go_recommendation}. {gr.win_theme}",
            "recommendation": result["recommendation"],
            "win_probability": result["win_probability"],
        }

        pdf_bytes = generate(report_data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="BidSmith_Intelligence_Brief.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
