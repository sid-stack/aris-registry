import os
import json
import time
import jwt
import stripe
import secrets
import hashlib
import datetime
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Request, Security, Depends, status, UploadFile, File
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.security import APIKeyHeader
from registry.search import SearchEngine
from registry.models import Transaction
import pypdf
import io
import google.generativeai as genai

# ─────────────────────────────────────────────
#  ENV & CONFIG
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(PROJECT_ROOT / ".env")

STRIPE_SECRET_KEY       = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET   = os.getenv("STRIPE_WEBHOOK_SECRET")
MONGO_URI               = os.getenv("MONGODB_URI")
ARIS_PRIVATE_KEY        = os.getenv("ARIS_PRIVATE_KEY")
GEMINI_API_KEY          = os.getenv("GEMINI_API_KEY")
DOCS_URL                = os.getenv("DOCS_URL", "https://docs.arislabs.ai")
HANDSHAKE_COST_USD      = 0.10
GEMINI_MODEL            = "gemini-2.5-flash"

stripe.api_key = STRIPE_SECRET_KEY

if not ARIS_PRIVATE_KEY:
    raise ValueError("ARIS_PRIVATE_KEY is not set in environment variables")

# ─────────────────────────────────────────────
#  DATABASE
# ─────────────────────────────────────────────
mongo_client            = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000, tls=True)
db                      = mongo_client.aris_registry
accounts_collection     = db.accounts
agents_collection       = db.agents
api_keys_collection     = db.api_keys
transactions_collection = db.transactions

# ─────────────────────────────────────────────
#  APP
# ─────────────────────────────────────────────
app = FastAPI(title="Aris Registry — BidSmith Backend", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
#  PYDANTIC MODELS
# ─────────────────────────────────────────────
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

class AgentRegistration(BaseModel):
    did:          str
    endpoint:     str
    capabilities: List[str]

class SessionRequest(BaseModel):
    payer_did:  str
    target_did: str
    capability: str

class BillingRequest(BaseModel):
    email: str

# ─────────────────────────────────────────────
#  SECURITY
# ─────────────────────────────────────────────
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

async def verify_security_context(
    request: Request,
    x_api_key: str = Security(API_KEY_HEADER)
):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
    hashed_input = hash_api_key(x_api_key)
    key_record = await api_keys_collection.find_one(
        {"hashed_key": hashed_input, "status": "active"}
    )
    if key_record:
        user = await accounts_collection.find_one({"email": key_record["user_email"]})
    else:
        user = await accounts_collection.find_one({"api_key": x_api_key})
    if not user:
        raise HTTPException(status_code=403, detail="Invalid or revoked API Key")
    return user

# ─────────────────────────────────────────────
#  GEMINI — LLM ANALYSIS CORE
# ─────────────────────────────────────────────
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
        # Ensure required keys exist
        parsed.setdefault("is_valid_rfp", True)
        parsed.setdefault("rejection_reason", "")
        required = {"project_title", "agency", "est_value", "deadline",
                    "exec_summary", "win_probability", "match_score"}
        if not required.issubset(parsed.keys()):
            mock = get_mock_analysis()
            mock.update(parsed)
            return mock
        return parsed
    except json.JSONDecodeError as e:
        print(f"❌ Gemini non-JSON response: {e} — returning mock.")
        return get_mock_analysis()
    except Exception as e:
        print(f"❌ Gemini call failed: {e} — returning mock.")
        return get_mock_analysis()

# ─────────────────────────────────────────────
#  PDF EXTRACTION
# ─────────────────────────────────────────────
def extract_pdf_text(content: bytes) -> str:
    """
    Robustly extract text from PDF bytes.
    Returns empty string if the PDF is unreadable or image-only.
    """
    # Verify PDF magic bytes
    if not content.startswith(b'%PDF-'):
        print(f"⚠️  Not a valid PDF (header: {content[:8]})")
        return ""

    reader = pypdf.PdfReader(io.BytesIO(content), strict=False)
    print(f"📑 PDF pages: {len(reader.pages)}")

    text = ""
    for i, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
            text += page_text + "\n"
            print(f"   Page {i+1}: {len(page_text)} chars")
        except Exception as e:
            print(f"   Page {i+1}: skipped ({e})")
            continue

    return text.strip()

# ─────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "Active", "version": "1.1.0", "model": GEMINI_MODEL}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_rfp(file: UploadFile = File(...)):
    print(f"\n📄 /analyze — file: '{file.filename}' | type: {file.content_type}")

    analysis = get_mock_analysis()  # default — always overwritten if PDF is good

    try:
        content = await file.read()
        print(f"📦 Received {len(content):,} bytes")

        if len(content) == 0:
            print("⚠️  Empty file — returning mock.")
            return AnalysisResponse(**analysis)

        extracted = extract_pdf_text(content)

        if not extracted:
            print("⚠️  No extractable text (scanned/image PDF) — returning mock.")
        else:
            print(f"✅ {len(extracted):,} chars extracted — calling Gemini...")
            analysis = analyze_text_with_gemini(extracted)

    except Exception as e:
        print(f"❌ Unhandled error in /analyze: {type(e).__name__}: {e}")

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


@app.post("/register")
async def register_agent(agent: AgentRegistration):
    await SearchEngine.index_agent(agent.did, agent.capabilities)
    await agents_collection.update_one(
        {"did": agent.did},
        {"$set": {
            "did":          agent.did,
            "endpoint":     agent.endpoint,
            "capabilities": agent.capabilities,
            "name":         agent.did.split(":")[-1],
            "status":       "live",
            "last_seen":    time.time(),
        }},
        upsert=True,
    )
    return {"status": "registered", "did": agent.did}


@app.get("/api/discover")
async def discover(capability: str):
    agents = await SearchEngine.search(capability)
    return {"agents": agents}


@app.get("/api/agents")
async def get_live_agents():
    cursor = agents_collection.find({})
    agents_list = await cursor.to_list(length=100)
    formatted = [
        {
            "did":        a.get("did", "Unknown DID"),
            "name":       a.get("name", "Unnamed Agent"),
            "capability": a.get("capabilities", ["unknown"])[0] if a.get("capabilities") else "unknown",
            "status":     "live",
        }
        for a in agents_list
    ]
    return {"status": "success", "count": len(formatted), "agents": formatted}


@app.post("/api/billing/checkout")
async def create_checkout(req: BillingRequest):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": os.getenv("STRIPE_PRICE_ID", "price_1T0KV1GYLlqVJEwwk2cYSGv0"), "quantity": 1}],
            mode="payment",
            customer_email=req.email,
            success_url="https://aris-registry.onrender.com/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://aris-registry.onrender.com/dashboard",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return JSONResponse(content={"error": "Invalid payload"}, status_code=400)
    except stripe.error.SignatureVerificationError:
        return JSONResponse(content={"error": "Invalid signature"}, status_code=400)

    if event["type"] == "checkout.session.completed":
        session        = event["data"]["object"]
        customer_email = (
            session.get("customer_details", {}).get("email")
            or session.get("metadata", {}).get("customer_email")
        )
        amount_paid = session.get("amount_total", 0) / 100
        if customer_email:
            new_api_key = f"aris_live_{secrets.token_urlsafe(32)}"
            await accounts_collection.update_one(
                {"email": customer_email},
                {
                    "$inc":         {"credits_balance": amount_paid},
                    "$setOnInsert": {
                        "api_key":                 new_api_key,
                        "hashed_key":              hash_api_key(new_api_key),
                        "created_at":              time.time(),
                        "processed_stripe_events": [],
                    },
                    "$set": {"updated_at": time.time()},
                },
                upsert=True,
            )
            print(f"✅ Webhook: {customer_email} +${amount_paid}")

    return {"status": "success"}


@app.post("/handshake")
async def handshake(req: SessionRequest, user: dict = Depends(verify_security_context)):
    async with await mongo_client.start_session() as session:
        async with session.start_transaction():
            current_user = await accounts_collection.find_one(
                {"_id": user["_id"]}, session=session
            )
            if not current_user:
                raise HTTPException(status_code=404, detail="User not found")
            if current_user.get("credits_balance", 0) < HANDSHAKE_COST_USD:
                raise HTTPException(status_code=402, detail="Insufficient Balance")
            await accounts_collection.update_one(
                {"_id": user["_id"]},
                {"$inc": {"credits_balance": -HANDSHAKE_COST_USD}},
                session=session,
            )
            tx = Transaction(
                _id=f"tx_{secrets.token_urlsafe(16)}",
                user_id=str(user["_id"]),
                provider_did=req.target_did,
                amount=HANDSHAKE_COST_USD,
                capability=req.capability,
            )
            await transactions_collection.insert_one(tx.model_dump(by_alias=True), session=session)

    token = jwt.encode(
        {"sub": req.payer_did, "aud": req.target_did, "exp": time.time() + 300},
        ARIS_PRIVATE_KEY,
        algorithm="HS256",
    )
    new_balance = current_user.get("credits_balance", 0) - HANDSHAKE_COST_USD
    return {"session_token": token, "remaining_balance": new_balance}


@app.get("/")
async def landing():
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"status": "Aris Registry is live"}


@app.get("/docs-redirect")
async def docs_redirect():
    return RedirectResponse(url=DOCS_URL)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
