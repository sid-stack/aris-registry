import os
import time
import jwt
import stripe
import secrets
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient

from aris.session_defaults import DEFAULT_SESSION_HS256_SECRET

logger = logging.getLogger(__name__)

# --- CONFIG ---
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
MONGO_URI = os.getenv("MONGO_URI")
ARIS_PRIVATE_KEY = os.getenv("ARIS_PRIVATE_KEY", DEFAULT_SESSION_HS256_SECRET)
BASE_DIR = Path(__file__).resolve().parent

# Logic: $0.10 cost per agent-to-agent handshake
HANDSHAKE_COST_USD = 0.10

stripe.api_key = STRIPE_SECRET_KEY

# --- MONGODB SETUP ---
client = AsyncIOMotorClient(MONGO_URI)
db = client.aris_registry
accounts_collection = db.accounts
agents_collection = db.agents
usage_collection = db.usage_logs

app = FastAPI(title="Aris Registry (Production)", version="1.0")

# --- MODELS ---
class AgentRegistration(BaseModel):
    did: str
    endpoint: str
    capabilities: List[str]

class SessionRequest(BaseModel):
    payer_did: str
    target_did: str
    capability: str

# --- 1. STOREFRONT & CHECKOUT ---

@app.get("/")
async def serve_landing_page():
    """Serves the main storefront index.html"""
    return FileResponse(BASE_DIR / "index.html")

@app.get("/docs")
async def serve_docs():
    """Serves the Aris SDK Documentation."""
    return FileResponse(BASE_DIR / "docs.html")


@app.get("/buy-credits")
async def create_checkout(price_id: str):
    """
    Redirects user to Stripe. 
    price_id should be one of your Aris Starter, Builder, or Pro IDs.
    """
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='payment',
            customer_creation="always",
            success_url="https://aris-registry.onrender.com/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://aris-registry.onrender.com/",
        )
        return RedirectResponse(url=session.url, status_code=303)
    except Exception as e:
        return {"error": str(e)}

@app.get("/success", response_class=HTMLResponse)
async def success_page(session_id: str):
    """Simple confirmation page that pulls the key from DB after payment."""
    session = stripe.checkout.Session.retrieve(session_id)
    email = session.get("customer_details", {}).get("email")
    
    # Attempt to find the newly created key
    user_data = await accounts_collection.find_one({"email": email})
    api_key = user_data.get("api_key") if user_data else "Processing... check your email."

    return f"""
    <html>
        <body style="background:#000; color:#fff; font-family:monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center;">
            <h1>Payment Successful</h1>
            <p style="color: #888;">Account: {email}</p>
            <div style="background: #111; padding: 20px; border: 1px solid #333; border-radius: 8px; margin: 20px 0;">
                <p style="margin:0 0 10px 0; font-size: 0.8em; color: #555;">YOUR API KEY</p>
                <code style="color: #00ff00; font-size: 1.2em;">{api_key}</code>
            </div>
            <a href="/" style="color: #0070f3; text-decoration: none;">Return to Documentation</a>
        </body>
    </html>
    """

# --- 2. THE VENDING MACHINE (WEBHOOK) ---

@app.post("/webhook")
async def stripe_webhook(request: Request):
    """
    The only place where API keys are generated.
    Triggered by Stripe after successful payment.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Webhook Signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        customer_email = session.get("customer_details", {}).get("email")
        amount_paid = session.get("amount_total") / 100 
        
        # GENERATE KEY ONLY AFTER PAYMENT
        new_api_key = f"aris_live_{secrets.token_urlsafe(32)}"
        
        # Upsert: If email exists, add balance. If not, create and set key.
        await accounts_collection.update_one(
            {"email": customer_email},
            {
                "$setOnInsert": {"api_key": new_api_key, "created_at": time.time()},
                "$inc": {"balance": amount_paid}
            },
            upsert=True
        )
        logger.info("Stripe checkout completed; API key issued for %s", customer_email)

    return {"status": "success"}

# --- 3. CORE REGISTRY & HANDSHAKE ---

@app.post("/register")
async def register_agent(agent: AgentRegistration):
    await agents_collection.update_one(
        {"did": agent.did},
        {"$set": agent.model_dump()},
        upsert=True
    )
    return {"status": "registered"}

@app.get("/discover")
async def discover(capability: str):
    cursor = agents_collection.find({"capabilities": capability})
    agents = await cursor.to_list(length=100)
    for a in agents: a.pop("_id", None)
    return {"agents": agents}

@app.post("/handshake")
async def handshake(req: SessionRequest, x_api_key: Optional[str] = Header(None)):
    """Verifies balance, deducts cost, logs usage, and issues a ZK-session token."""
    if not x_api_key:
        raise HTTPException(401, "Missing API Key")

    user_account = await accounts_collection.find_one({"api_key": x_api_key})
    if not user_account:
        raise HTTPException(403, "Invalid API Key")

    # Check and Deduct Balance
    current_balance = user_account.get("balance", 0)
    if current_balance < HANDSHAKE_COST_USD:
        raise HTTPException(402, "Insufficient Balance")

    await accounts_collection.update_one(
        {"api_key": x_api_key},
        {"$inc": {"balance": -HANDSHAKE_COST_USD}}
    )

    # --- Log Usage ---
    await usage_collection.insert_one({
        "api_key": x_api_key,
        "email": user_account.get("email"),
        "payer_did": req.payer_did,
        "target_did": req.target_did,
        "capability": req.capability,
        "cost_usd": HANDSHAKE_COST_USD,
        "balance_before": current_balance,
        "balance_after": round(current_balance - HANDSHAKE_COST_USD, 6),
        "timestamp": time.time(),
    })

    # Issue ZK-Token
    payload = {
        "iss": "aris-registry",
        "sub": req.payer_did,
        "aud": req.target_did,
        "scope": req.capability,
        "exp": time.time() + 300
    }
    token = jwt.encode(payload, ARIS_PRIVATE_KEY, algorithm="HS256")

    return {
        "session_token": token,
        "remaining_balance": round(current_balance - HANDSHAKE_COST_USD, 6)
    }


# --- 4. ACCOUNT APIs ---

@app.get("/balance")
async def get_balance(x_api_key: Optional[str] = Header(None)):
    """
    Returns the current credit balance for the authenticated account.

    Headers:
        x-api-key: Your Aris API key (sk-aris-... or aris_live_...)

    Returns:
        email, balance (USD), and account creation time.
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API Key. Pass x-api-key header.")

    user_account = await accounts_collection.find_one({"api_key": x_api_key})
    if not user_account:
        raise HTTPException(status_code=403, detail="Invalid API Key.")

    return {
        "email": user_account.get("email"),
        "balance_usd": round(user_account.get("balance", 0), 6),
        "created_at": user_account.get("created_at"),
    }


@app.get("/usage")
async def get_usage(
    limit: int = 50,
    x_api_key: Optional[str] = Header(None)
):
    """
    Returns the usage history (handshake log) for the authenticated account.

    Headers:
        x-api-key: Your Aris API key

    Query params:
        limit: Max number of records to return (default 50, max 200)

    Returns:
        List of usage events with timestamp, capability, cost, and balance snapshots.
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API Key. Pass x-api-key header.")

    user_account = await accounts_collection.find_one({"api_key": x_api_key})
    if not user_account:
        raise HTTPException(status_code=403, detail="Invalid API Key.")

    limit = min(limit, 200)  # Hard cap

    cursor = usage_collection.find(
        {"api_key": x_api_key},
        {"_id": 0, "api_key": 0}  # Strip internal fields
    ).sort("timestamp", -1).limit(limit)

    records = await cursor.to_list(length=limit)

    total_spent = sum(r.get("cost_usd", 0) for r in records)

    return {
        "email": user_account.get("email"),
        "records_returned": len(records),
        "total_spent_usd": round(total_spent, 6),
        "usage": records,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)