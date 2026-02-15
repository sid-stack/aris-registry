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
from fastapi import FastAPI, HTTPException, Header, Request, Security, Depends, status
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse, JSONResponse
from typing import List, Optional, Dict
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.security import APIKeyHeader

load_dotenv()

# --- CONFIG & SECRETS ---
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
MONGO_URI = os.getenv("MONGODB_URI") 
ARIS_PRIVATE_KEY = os.getenv("ARIS_PRIVATE_KEY")
BASE_DIR = Path(__file__).resolve().parent
DOCS_URL = os.getenv("DOCS_URL", "https://docs.arislabs.ai") # Updated default

stripe.api_key = STRIPE_SECRET_KEY
HANDSHAKE_COST_USD = 0.10

if not ARIS_PRIVATE_KEY:
    raise ValueError("ARIS_PRIVATE_KEY is not set in environment variables")

# --- DATABASE SETUP ---
client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000, tls=True)
db = client.aris_registry
accounts_collection = db.accounts
agents_collection = db.agents 
api_keys_collection = db.api_keys

app = FastAPI(title="Aris Registry", version="1.0")

# --- MODELS ---
class BillingRequest(BaseModel):
    email: str

class AgentRegistration(BaseModel):
    did: str
    endpoint: str
    capabilities: List[str]

class SessionRequest(BaseModel):
    payer_did: str
    target_did: str
    capability: str

# --- SECURITY & UTILS ---
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

async def verify_security_context(request: Request, x_api_key: str = Security(API_KEY_HEADER)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
    
    hashed_input = hash_api_key(x_api_key)
    # Check new API keys collection first, then fallback to accounts
    key_record = await api_keys_collection.find_one({"hashed_key": hashed_input, "status": "active"})
    
    if key_record:
        user = await accounts_collection.find_one({"email": key_record["user_email"]})
    else:
        user = await accounts_collection.find_one({"api_key": x_api_key})

    if not user:
        raise HTTPException(status_code=403, detail="Invalid or revoked API Key")
    return user

# --- STRIPE WEBHOOK (THE FIX) ---
@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()  # Get raw bytes
    sig_header = request.headers.get("stripe-signature")

    try:
        # Construct the event using the raw bytes and the secret
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return JSONResponse(content={"error": "Invalid payload"}, status_code=400)
    except stripe.error.SignatureVerificationError:
        return JSONResponse(content={"error": "Invalid signature"}, status_code=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        customer_email = session.get("customer_details", {}).get("email") or session.get("metadata", {}).get("customer_email")
        amount_paid = session.get("amount_total") / 100 

        if customer_email:
            # Atomic update: Create user if missing, increment balance if exists
            new_api_key = f"aris_live_{secrets.token_urlsafe(32)}"
            await accounts_collection.update_one(
                {"email": customer_email},
                {
                    "$inc": {"credits_balance": amount_paid},
                    "$setOnInsert": {
                        "api_key": new_api_key,
                        "hashed_key": hash_api_key(new_api_key),
                        "created_at": time.time(),
                        "processed_stripe_events": []
                    },
                    "$set": {"updated_at": time.time()}
                },
                upsert=True
            )
            print(f"✅ Webhook Success: {customer_email} +${amount_paid}")

    return {"status": "success"}

# --- ROUTES ---
@app.get("/")
async def landing():
    return FileResponse(BASE_DIR / "index.html")

@app.get("/docs")
async def docs():
    return RedirectResponse(url=DOCS_URL)

@app.post("/api/billing/checkout")
async def create_checkout(req: BillingRequest):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price': 'price_1T0KV1GYLlqVJEwwk2cYSGv0', 'quantity': 1}],
            mode='payment',
            customer_email=req.email,
            success_url="https://aris-registry.onrender.com/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://aris-registry.onrender.com/dashboard",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/handshake")
async def handshake(req: SessionRequest, user: dict = Depends(verify_security_context)):
    if user.get("credits_balance", 0) < HANDSHAKE_COST_USD:
        raise HTTPException(status_code=402, detail="Insufficient Balance")

    await accounts_collection.update_one(
        {"_id": user["_id"]},
        {"$inc": {"credits_balance": -HANDSHAKE_COST_USD}}
    )
    
    token = jwt.encode({
        "sub": req.payer_did,
        "aud": req.target_did,
        "exp": time.time() + 300 
    }, ARIS_PRIVATE_KEY, algorithm="HS256")

    return {"session_token": token, "remaining_balance": user.get("credits_balance", 0) - HANDSHAKE_COST_USD}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))