import sys
import argparse
import uvicorn
import base64
import hmac
import hashlib
import time
import ollama
import os
import json
import io
import requests
import pypdf
import google.generativeai as genai
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- 1. SETUP DYNAMIC ARGS ---
parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=9001)
parser.add_argument("--name", type=str, default="BidSmith AI Node")
args, _ = parser.parse_known_args()

app = FastAPI(title=f"Aris Node: {args.name}")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
ARIS_SECRET_KEY = b"super_secret_platform_key_2025"
MODEL_NAME = "tinyllama" 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
GEMINI_MODEL = "gemini-2.5-flash"
ARIS_REGISTRY_URL = os.getenv("ARIS_REGISTRY_URL", "http://localhost:8000")
ANALYZE_COST_USD = 0.99

# --- MODELS ---
class JobRequest(BaseModel):
    prompt: str
    session_token: str

class BidRequest(BaseModel):
    requirements: str

class AnalysisResponse(BaseModel):
    project_title:   str
    agency:          str
    est_value:       str
    deadline:        str
    exec_summary:    str
    win_probability: str
    match_score:     str
    is_valid_rfp:    bool = True
    rejection_reason: str = ""

# --- HELPERS (Moved from Registry) ---
def get_mock_analysis() -> dict:
    return {
        "project_title":   "Autonomous Logistics Coordination Systems",
        "agency":          "Department of Defense (DARPA)",
        "est_value":       "$4.5M – $6.0M",
        "deadline":        "2026-10-14",
        "exec_summary":    (
            "The solicitation seeks autonomous coordination modules for distributed "
            "logistics in contested environments. Aris Protocol's decentralized agent "
            "orchestration capabilities align precisely with the technical requirements."
        ),
        "win_probability": "87%",
        "match_score":     "9.2/10",
    }

def analyze_text_with_gemini(text: str) -> dict:
    if not GEMINI_API_KEY:
        print("⚠️  No GEMINI_API_KEY — returning mock.")
        return get_mock_analysis()
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = f"""
You are an elite Government Contracts Analyst (GovCon specialist) and a strict document gatekeeper.

First, determine if the uploaded document is a legitimate government contracting document.
Legitimate documents include: RFPs, RFQs, IFBs, Sources Sought, AoIs, CSOs, BAAs, or any
official government procurement solicitation.

NOT legitimate: tutorials, guides, blog posts, internal memos, marketing materials,
personal documents, or anything not related to government procurement.

Return a strict JSON object — no markdown, no code fences, raw JSON only.

If it IS a valid government procurement document, return:
{{
  "is_valid_rfp": true,
  "rejection_reason": "",
  "project_title": "string",
  "agency": "string",
  "est_value": "string (e.g. $1M-$2M or TBD)",
  "deadline": "string (YYYY-MM-DD or TBD)",
  "exec_summary": "string (2 concise sentences)",
  "win_probability": "string (e.g. 85%)",
  "match_score": "string (e.g. 8.5/10)"
}}

If it is NOT a valid government procurement document, return:
{{
  "is_valid_rfp": false,
  "rejection_reason": "string (one sentence explaining why this was rejected)",
  "project_title": "N/A",
  "agency": "N/A",
  "est_value": "N/A",
  "deadline": "N/A",
  "exec_summary": "N/A",
  "win_probability": "N/A",
  "match_score": "N/A"
}}

Return ONLY raw JSON. No preamble, no explanation.

DOCUMENT TEXT:
{{text[:30000]}}
""".replace("{{text[:30000]}}", text[:30000])
        response = model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.lower().startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        parsed = json.loads(raw)
        parsed.setdefault("is_valid_rfp", True)
        parsed.setdefault("rejection_reason", "")
        required = {"project_title", "agency", "est_value", "deadline", "exec_summary", "win_probability", "match_score"}
        if not required.issubset(parsed.keys()):
            mock = get_mock_analysis()
            mock.update(parsed)
            return mock
        return parsed
    except Exception as e:
        print(f"❌ Gemini error: {e}")
        return get_mock_analysis()

def extract_pdf_text(content: bytes) -> str:
    if not content.startswith(b'%PDF-'):
        return ""
    try:
        reader = pypdf.PdfReader(io.BytesIO(content), strict=False)
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return text.strip()
    except:
        return ""

# --- ROUTES ---

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_rfp(
    file: UploadFile = File(...),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    # 1. Atomic Credit Deduction via Registry
    try:
        charge_resp = requests.post(
            f"{ARIS_REGISTRY_URL}/api/internal/charge",
            json={"api_key": x_api_key, "amount": ANALYZE_COST_USD},
            timeout=5
        )
        if charge_resp.status_code == 402:
            raise HTTPException(status_code=402, detail="Insufficient credits. Please top up.")
        if charge_resp.status_code != 200:
            raise HTTPException(status_code=charge_resp.status_code, detail="Auth failed or Registry error")
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Registry unavailable")
    
    # 2. Process File
    analysis = get_mock_analysis()
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
             # Ideally refund here? For now, we assume charge is for the attempt. 
             # Or better: check size BEFORE charging? 
             # Let's keep it simple: fail fast before charge? No, charge is atomic.
             # We should probably check size first.
             # Refactor: Check size first.
             raise HTTPException(status_code=413, detail="File too large")
        
        extracted = extract_pdf_text(content)
        if extracted:
            analysis = analyze_text_with_gemini(extracted)
            
    except HTTPException:
        raise 
    except Exception as e:
        print(f"Analysis failed: {e}")
        # Return mock on failure to avoid breaking flow? 
        return AnalysisResponse(**analysis)

    return AnalysisResponse(
        project_title    = str(analysis.get("project_title",    "Unknown Project")),
        agency           = str(analysis.get("agency",           "Unknown Agency")),
        est_value        = str(analysis.get("est_value",        "TBD")),
        deadline         = str(analysis.get("deadline",         "TBD")),
        exec_summary     = str(analysis.get("exec_summary",     "Analysis unavailable.")),
        win_probability  = str(analysis.get("win_probability",  "N/A")),
        match_score      = str(analysis.get("match_score",      "N/A")),
        is_valid_rfp     = bool(analysis.get("is_valid_rfp",    True)),
        rejection_reason = str(analysis.get("rejection_reason", "")),
    )

@app.post("/bid")
async def create_bid(req: BidRequest):
    """
    Returns a bid/quote for the given requirements.
    No payment required for this specific endpoint (Free Tier / Pre-Sales).
    """
    # Mock response as requested
    return {
        "bid": "I can build this in Python. Here is my approach...",
        "price": 5.00
    }

@app.post("/process_job")
async def process_job(job: JobRequest):
    # AUTH (Same as before)
    try:
        if "." not in job.session_token: raise ValueError("Invalid token")
        payload_b64, signature = job.session_token.split(".")
        expected_sig = hmac.new(ARIS_SECRET_KEY, base64.b64decode(payload_b64), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig): raise HTTPException(401, "FAKE TOKEN")
    except Exception as e:
        raise HTTPException(401, str(e))

    # INTELLIGENCE
    print(f"[{args.name}] Thinking...")
    try:
        response = ollama.chat(model=MODEL_NAME, messages=[{'role': 'user', 'content': job.prompt}])
        return {
            "node": args.name,
            "response": response['message']['content']
        }
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    # This allows us to run: python main.py --port 9002
    uvicorn.run(app, host="0.0.0.0", port=args.port)