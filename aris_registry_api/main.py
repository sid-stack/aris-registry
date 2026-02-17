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
from .search import SearchEngine
from .models import Transaction
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
        
    return {"status": "seeded", "count": len(agent_docs), "message": "Database successfully populated with default agents."}

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
            new_api_key = f"aris_live_{secrets.token_urlsafe(32)}"
            await accounts_collection.update_one(
                filter_query,
                {
                    "$inc":         {"credits_balance": amount_paid},
                    "$setOnInsert": {
                        "api_key":                 new_api_key,
                        "hashed_key":              hash_api_key(new_api_key),
                        "created_at":              time.time(),
                        "processed_stripe_events": [],
                        "email": customer_email # ensure email is set if using ID
                    },
                    "$set": {"updated_at": time.time()},
                },
                upsert=True,
            )
            print(f"✅ Webhook: {customer_email} +${amount_paid}")

    return {"status": "success"}

@app.post("/api/internal/charge")
async def internal_charge(req: ChargeRequest):
    """
    Atomic credit deduction endpoint for internal services.
    Returns 200 if successful, 402 if insufficient funds.
    """
    # 1. Verify API Key
    hashed_input = hash_api_key(req.api_key)
    # Check if key exists (either direct api_key field or hashed_key)
    # For now, let's assume hashed_key logic from verify_security_context
    key_record = await api_keys_collection.find_one({"hashed_key": hashed_input})
    
    user_filter = {}
    if key_record:
        user_filter = {"email": key_record["user_email"]}
    else:
         # Fallback for unhashed legacy keys or direct check
        user_filter = {"api_key": req.api_key}
    
    # 2. Atomic Find and Update
    # Condition: credits_balance >= amount
    updated_user = await accounts_collection.find_one_and_update(
        {
            **user_filter,
            "credits_balance": {"$gte": req.amount} # ATOMIC CONDITION
        },
        {"$inc": {"credits_balance": -req.amount}},
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
        "status": "success", 
        "charged": req.amount, 
        "remaining": updated_user["credits_balance"]
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
