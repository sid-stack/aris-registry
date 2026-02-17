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

# ── ENV LOADING FIRST ──
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(PROJECT_ROOT / ".env")

from fastapi import FastAPI, HTTPException, Header, Request, Security, Depends, status, UploadFile, File
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.security import APIKeyHeader
from .search import SearchEngine
from .models import Transaction
import base64
import hmac
import pypdf
import io
import google.generativeai as genai
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from . import auth

STRIPE_SECRET_KEY       = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET   = os.getenv("STRIPE_WEBHOOK_SECRET")
MONGO_URI               = os.getenv("MONGODB_URI")
ARIS_PRIVATE_KEY        = os.getenv("ARIS_PRIVATE_KEY")
GEMINI_API_KEY          = os.getenv("GEMINI_API_KEY")
DOCS_URL                = os.getenv("DOCS_URL", "https://docs.arislabs.ai")
HANDSHAKE_COST_USD      = 0.10
GEMINI_MODEL            = "gemini-2.5-flash"

ANALYZE_COST_USD = float(os.getenv("ANALYZE_COST_USD", "0.99"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

stripe.api_key = STRIPE_SECRET_KEY

# ... (rest of config)

# ─────────────────────────────────────────────
#  APP
# ─────────────────────────────────────────────

# ... (app setup)


if not ARIS_PRIVATE_KEY:
    raise ValueError("ARIS_PRIVATE_KEY is not set in environment variables")

# ─────────────────────────────────────────────
#  DATABASE
# ─────────────────────────────────────────────
# Auto-detect if we need TLS (Atlas uses srv, local doesn't usually)
use_tls = "mongodb+srv://" in (MONGO_URI or "")
mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000, tls=use_tls)
db                      = mongo_client.aris_registry
accounts_collection     = db.accounts
agents_collection       = db.agents
api_keys_collection     = db.api_keys
transactions_collection = db.transactions

# ─────────────────────────────────────────────
#  APP
# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
#  APP
# ─────────────────────────────────────────────
# ... (app setup)
app = FastAPI(title="Aris Registry — BidSmith Backend", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://bidsmith-web.onrender.com",
        "https://bidsmith-frontend.onrender.com",
        "https://bidsmith-frontend.vercel.app",
    ],
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

class ChargeRequest(BaseModel):
    api_key: str
    amount: float
    description: str = "Service Charge"

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
#  AUTH DEPENDENCIES & ROUTES
# ─────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

async def get_current_user_from_cookie(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        # Also check Authorization header for flexibility
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = await accounts_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/auth/signup")
async def signup(user_data: UserCreate, request: Request):
    existing = await accounts_collection.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new API Key
    new_api_key = f"aris_live_{secrets.token_urlsafe(32)}"
    hashed_key = hash_api_key(new_api_key)
    password_hash = auth.get_password_hash(user_data.password)
    
    new_user = {
        "email": user_data.email,
        "password_hash": password_hash,
        "api_key": new_api_key,
        "hashed_key": hashed_key,
        "credits_balance": 0.0,
        "free_reports_remaining": 5,
        "is_paid_user": False,
        "total_reports_generated": 0,
        "created_at": time.time(),
        "updated_at": time.time(),
        "status": "active"
    }
    
    await accounts_collection.insert_one(new_user)
    
    # Create JWT
    access_token = auth.create_access_token(data={"sub": user_data.email})
    
    # Store key separately in api_keys collection for fast lookup (hashed)
    await api_keys_collection.insert_one({
        "hashed_key": hashed_key,
        "user_email": user_data.email,
        "status": "active"
    })
    
    resp = JSONResponse(content={"status": "success", "message": "User created"})
    # Match secure status to request scheme for local dev support
    is_secure = request.url.scheme == "https" or "localhost" in request.url.hostname or "127.0.0.1" in request.url.hostname
    
    resp.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=is_secure, 
        samesite="lax" if not is_secure else "none"
    )
    return resp

@app.post("/auth/login")
async def login(user_data: UserLogin, request: Request):
    user = await accounts_collection.find_one({"email": user_data.email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not auth.verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token = auth.create_access_token(data={"sub": user.get("email")})
    
    # Set cookie for browser flow
    is_secure = request.url.scheme == "https" or "localhost" in request.url.hostname or "127.0.0.1" in request.url.hostname
    
    resp = JSONResponse(content={"status": "success", "access_token": access_token})
    resp.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=is_secure, 
        samesite="lax" if not is_secure else "none"
    )
    return resp

@app.post("/auth/logout")
async def logout():
    resp = JSONResponse(content={"status": "success"})
    resp.delete_cookie("access_token")
    return resp

@app.get("/auth/me")
async def read_users_me(current_user: dict = Depends(get_current_user_from_cookie)):
    return {
        "email": current_user["email"],
        "credits_balance": current_user.get("credits_balance", 0.0),
        "api_key": current_user.get("api_key"),
        "is_paid_user": current_user.get("is_paid_user", False),
        "free_reports_remaining": current_user.get("free_reports_remaining", 0),
        "total_reports_generated": current_user.get("total_reports_generated", 0),
        "stripe_customer_id": current_user.get("stripe_customer_id")
    }

@app.post("/api/keys/regenerate")
async def regenerate_api_key(current_user: dict = Depends(get_current_user_from_cookie)):
    new_key = f"aris_live_{secrets.token_urlsafe(32)}"
    new_hash = hash_api_key(new_key)
    
    # Invalidate old keys in api_keys_collection?
    # Ideally yes, or just update the one entry if 1:1.
    # We'll just update the user's entry in api_keys_collection
    await api_keys_collection.update_many(
        {"user_email": current_user["email"]},
        {"$set": {"status": "revoked"}}
    )
    
    await api_keys_collection.insert_one({
        "hashed_key": new_hash,
        "user_email": current_user["email"],
        "status": "active"
    })
    
    await accounts_collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"api_key": new_key, "hashed_key": new_hash}}
    )
    
    return {"api_key": new_key}

# ─────────────────────────────────────────────
#  BIDSMITH HELPERS
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

# ─────────────────────────────────────────────
#  SEED DATA & UTILS
# ─────────────────────────────────────────────
AGENTS_DATA = [
    {
        "name": "GitHub Repo Master",
        "capabilities": ["dev.git.manage", "dev.code.review"],
        "endpoint": "http://localhost:8001/manage",
        "status": "live"
    },
    {
        "name": "Gov RFP Bidder",
        "capabilities": ["gov.rfp.bidder", "gov.compliance.check"],
        "endpoint": "http://localhost:8002/bid",
        "status": "live"
    },
    {
        "name": "DeFi Arbitrage Node",
        "capabilities": ["fin.defi.trade", "fin.market.analyze"],
        "endpoint": "http://localhost:8003/trade",
        "status": "live"
    },
    {
        "name": "Linear Task Automator",
        "capabilities": ["prod.linear.manage", "prod.scrum.master"],
        "endpoint": "http://localhost:8004/tasks",
        "status": "live"
    },
    {
        "name": "AWS Infra Scout",
        "capabilities": ["cloud.aws.monitor", "cloud.cost.optimize"],
        "endpoint": "http://localhost:8005/scout",
        "status": "live"
    },
    {
        "name": "Discord Comm Manager",
        "capabilities": ["social.discord.moderate", "social.community.response"],
        "endpoint": "http://localhost:8006/chat",
        "status": "live"
    },
    {
        "name": "Solana Validator Proxy",
        "capabilities": ["chain.solana.validate", "chain.tx.sign"],
        "endpoint": "http://localhost:8007/sign",
        "status": "live"
    },
    {
        "name": "Design System Guard",
        "capabilities": ["design.figma.audit", "dev.css.lint"],
        "endpoint": "http://localhost:8008/audit",
        "status": "live"
    },
    {
        "name": "Notion Knowledge Base",
        "capabilities": ["knowledge.notion.sync", "knowledge.search"],
        "endpoint": "http://localhost:8009/sync",
        "status": "live"
    },
    {
        "name": "Vercel Deployment Bot",
        "capabilities": ["devops.vercel.deploy", "devops.ci.monitor"],
        "endpoint": "http://localhost:8010/deploy",
        "status": "live"
    }
]

@app.get("/seed_db")
async def seed_database(secret: str = ""):
    """
    Emergency endpoint to seed the database if shell access is unavailable.
    Protected by simple secret check.
    """
    if secret != "aris_admin_seed":
        raise HTTPException(status_code=403, detail="Invalid seed secret")
    
    # Clear existing
    await agents_collection.delete_many({})
    
    # Insert new
    agent_docs = []
    for agent in AGENTS_DATA:
        did = f"did:aris:agent:{secrets.token_hex(4)}"
        agent_docs.append({
            "did": did,
            "name": agent["name"],
            "capabilities": agent["capabilities"],
            "endpoint": agent["endpoint"],
            "status": agent["status"]
        })
    
    if agent_docs:
        await agents_collection.insert_many(agent_docs)
    
    # Seed Demo User for Dashboard
    demo_key = "aris_demo_key_2025"
    await accounts_collection.update_one(
        {"email": "demo@arislabs.ai"},
        {
            "$set": {
                "api_key": demo_key,
                "hashed_key": hash_api_key(demo_key),
                "credits_balance": 100.00,
                "status": "active"
            }
        },
        upsert=True
    )
        
    return {"status": "seeded", "count": len(agent_docs), "message": "Database populated with agents and demo user."}

# ─────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "Active", "version": "1.1.0", "model": GEMINI_MODEL}

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
    # In a real app, authenticated user should be passed here contextually
    # For now, we trust the email or look it up. Better to require auth.
    user = await accounts_collection.find_one({"email": req.email})
    client_ref_id = str(user["_id"]) if user else None
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": os.getenv("STRIPE_PRICE_ID", "price_1T0KV1GYLlqVJEwwk2cYSGv0"), "quantity": 1}],
            mode="payment",
            customer_email=req.email,
            client_reference_id=client_ref_id, # Link Stripe Session to MongoDB User ID
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
        customer_email = session.get("customer_details", {}).get("email")
        # primary key to link user
        client_ref_id  = session.get("client_reference_id") 
        amount_paid    = session.get("amount_total", 0) / 100
        
        # If we have client_ref_id (MongoDB _id), use it. Fallback to email.
        filter_query = {}
        if client_ref_id:
             try:
                 from bson import ObjectId
                 filter_query = {"_id": ObjectId(client_ref_id)}
             except:
                 pass
        
        if not filter_query and customer_email:
             filter_query = {"email": customer_email}

        if filter_query:
            event_id = event["id"]
            new_api_key = f"aris_live_{secrets.token_urlsafe(32)}"
            
            # Atomic idempotent update: only if event_id not already processed
            result = await accounts_collection.update_one(
                {
                    **filter_query,
                    "processed_stripe_events": {"$ne": event_id}
                },
                {
                    "$inc": {"credits_balance": amount_paid},
                    "$push": {"processed_stripe_events": event_id},
                    "$set": {
                        "is_paid_user": True,
                        "upgraded_at": time.time(),
                        "updated_at": time.time()
                    },
                    "$setOnInsert": {
                        "api_key":                 new_api_key,
                        "hashed_key":              hash_api_key(new_api_key),
                        "created_at":              time.time(),
                        "status":                  "active",
                        "free_reports_remaining":  0,
                        "total_reports_generated": 0,
                        "processed_stripe_events": [event_id], # Init with the current event
                        "email": customer_email
                    }
                },
                upsert=True,
            )
            
            if result.modified_count > 0 or result.upserted_id:
                print(f"✅ Webhook processed: {customer_email} +${amount_paid}")
            else:
                print(f"⚠️ Webhook skipped (already processed): {event_id}")

    return {"status": "success"}

async def deduct_credits(api_key: str, amount: float) -> dict:
    """
    Shared logic to atomically deduct credits.
    Returns dict with {charged, remaining} or raises HTTPException.
    """
    hashed_input = hash_api_key(api_key)
    # Check if key exists (either direct api_key field or hashed_key)
    key_record = await api_keys_collection.find_one({"hashed_key": hashed_input})
    
    user_filter = {}
    if key_record:
        user_filter = {"email": key_record["user_email"]}
    else:
        # Fallback for unhashed legacy keys or direct check
        user_filter = {"api_key": api_key}
    
    # Atomic Find and Update
    updated_user = await accounts_collection.find_one_and_update(
        {
            **user_filter,
            "credits_balance": {"$gte": amount} # ATOMIC CONDITION
        },
        {"$inc": {"credits_balance": -amount}},
        projection={"credits_balance": 1, "email": 1}
    )

    if not updated_user:
        # Check if user exists but just low balance, or invalid key
        user_exists = await accounts_collection.find_one(user_filter)
        if not user_exists:
             raise HTTPException(status_code=403, detail="Invalid API Key")
        
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient funds. Balance: ${user_exists.get('credits_balance', 0):.2f}"
        )

    return {
        "charged": amount,
        "remaining": updated_user["credits_balance"]
    }

@app.post("/api/internal/charge")
async def internal_charge(req: ChargeRequest):
    """
    Atomic credit deduction endpoint for internal services.
    Returns 200 if successful, 402 if insufficient funds.
    """
    result = await deduct_credits(req.api_key, req.amount)
    return {"status": "success", **result}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_rfp(
    file: UploadFile = File(...),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    # 1. Resolve User from API Key
    hashed_input = hash_api_key(x_api_key)
    key_record = await api_keys_collection.find_one({"hashed_key": hashed_input})
    user_filter = {"email": key_record["user_email"]} if key_record else {"api_key": x_api_key}
    
    user_doc = await accounts_collection.find_one(user_filter)
    if not user_doc:
         raise HTTPException(status_code=403, detail="Invalid API Key")

    # 2. Tier-based Deduction
    is_paid = user_doc.get("is_paid_user", False)
    if is_paid:
        # Atomic credit deduction
        await deduct_credits(x_api_key, ANALYZE_COST_USD)
        await accounts_collection.update_one({"_id": user_doc["_id"]}, {"$inc": {"total_reports_generated": 1}})
    else:
        # ATOMIC FREE REPORT CONSUMPTION
        res = await accounts_collection.find_one_and_update(
            {
                "_id": user_doc["_id"],
                "free_reports_remaining": {"$gt": 0}
            },
            {"$inc": {"free_reports_remaining": -1, "total_reports_generated": 1}}
        )
        if not res:
            raise HTTPException(
                status_code=402, 
                detail="Free trial exhausted. Upgrade to Pro to continue RFP analysis."
            )
    
    # 3. Process File
    analysis = get_mock_analysis()
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
             raise HTTPException(status_code=413, detail="File too large")
        
        extracted = extract_pdf_text(content)
        if extracted:
            analysis = analyze_text_with_gemini(extracted)
            
    except HTTPException:
        raise 
    except Exception as e:
        print(f"Analysis failed: {e}")
        return AnalysisResponse(**analysis)

    # 4. Mask results for free users
    if not is_paid:
        analysis["exec_summary"] = "🔒 Upgrade to Pro to unlock the full executive summary and bid strategy."
        analysis["win_probability"] = "🔒 Locked"

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

class BidRequest(BaseModel):
    requirements: str

@app.post("/bid")
async def create_bid(req: BidRequest):
    """
    Returns a bid/quote for the given requirements.
    No payment required for this specific endpoint (Free Tier / Pre-Sales).
    """
    return {
        "bid": "I can build this in Python. Here is my approach...",
        "price": 5.00
    }

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
