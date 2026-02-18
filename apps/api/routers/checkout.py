from fastapi import APIRouter, Request, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from apps.api.database import db
from apps.api.models import User
from apps.api.dependencies import get_current_user
import stripe
import os
import logging
import uuid
import time

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "")

router = APIRouter()

# Live URL or localhost
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Plan definitions: plan_id -> (display_name, unit_amount_cents, credits_to_add)
PLANS = {
    "starter": {
        "name": "Starter Plan — 25 Analysis Credits",
        "unit_amount": 1900,   # $19.00
        "credits": 25.0,
    },
    "pro": {
        "name": "Professional Plan — 150 Analysis Credits",
        "unit_amount": 9900,   # $99.00
        "credits": 150.0,
    },
    "credits": {
        "name": "25 Analysis Credits",
        "unit_amount": 2000,   # $20.00
        "credits": 25.0,
    },
}

class CheckoutRequest(BaseModel):
    plan_id: Optional[str] = "credits"  # default: legacy credits top-up

@router.post("/create-session")
async def create_checkout_session(
    body: CheckoutRequest = CheckoutRequest(),
    current_user: User = Depends(get_current_user)
):
    plan_id = body.plan_id if body.plan_id in PLANS else "credits"
    plan = PLANS[plan_id]

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': plan["name"],
                            'images': [f"{FRONTEND_URL}/logo.png"],
                        },
                        'unit_amount': plan["unit_amount"],
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=FRONTEND_URL + '/dashboard?success=true',
            cancel_url=FRONTEND_URL + '/dashboard/billing?canceled=true',
            metadata={
                "user_id": current_user.id,
                "clerk_id": current_user.clerk_id,
                "credits_to_add": str(plan["credits"]),
                "plan_id": plan_id,
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        logging.error(f"Stripe Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session.get("id")
        user_id = session.get("metadata", {}).get("user_id")
        clerk_id = session.get("metadata", {}).get("clerk_id")
        
        if not user_id:
            logging.error("No user_id in session metadata")
            return {"status": "ignored", "reason": "no_user_id"}

        # IDEMPOTENCY CHECK & ATOMIC UPDATE
        database = db.get_db()
        client = db.client # Get underlying Motor client for session

        async with await client.start_session() as mongo_session:
            async with mongo_session.start_transaction():
                # 1. Check if this session was already processed
                existing = await database.credit_transactions.find_one(
                    {"stripe_session_id": session_id},
                    session=mongo_session
                )
                if existing:
                    logging.info(f"Session {session_id} already processed. Skipping.")
                    return {"status": "success", "note": "idempotent_skip"}

                # 2. Read credits from metadata (set at checkout time per plan)
                metadata = session.get("metadata", {})
                plan_id = metadata.get("plan_id", "credits")
                try:
                    amount_to_add = float(metadata.get("credits_to_add", "25.0"))
                except (ValueError, TypeError):
                    amount_to_add = 25.0  # safe fallback

                # 3. Create Audit Log
                import uuid
                import time
                tx = {
                    "_id": f"tx_{uuid.uuid4().hex[:8]}",
                    "user_id": user_id,
                    "clerk_id": clerk_id or "",
                    "type": "purchase",
                    "amount": amount_to_add,
                    "stripe_session_id": session_id,
                    "description": f"Purchase {int(amount_to_add)} Analysis Credits ({plan_id} plan)",
                    "status": "completed",
                    "timestamp": time.time()
                }

                # 4. Perform Updates
                await database.users.update_one(
                    {"_id": user_id},
                    {"$inc": {"credits_balance": amount_to_add}},
                    session=mongo_session
                )
                await database.credit_transactions.insert_one(tx, session=mongo_session)
                
                logging.info(f"Credits added and logged for user {user_id}")

    return {"status": "success"}


# ─── Internal Endpoint (called by Next.js webhook) ────────────────────────────

class AddCreditsRequest(BaseModel):
    clerk_id: str
    credits_to_add: float
    stripe_session_id: str
    plan_id: str = "unknown"

@router.post("/internal/add-credits")
async def internal_add_credits(
    body: AddCreditsRequest,
    x_internal_secret: Optional[str] = Header(None, alias="x-internal-secret"),
):
    """
    Secure internal endpoint called by the Next.js Stripe webhook.
    Updates credits_balance in the Python API's MongoDB by clerk_id.
    Protected by INTERNAL_API_SECRET header.
    """
    # Validate internal secret
    if not INTERNAL_API_SECRET or x_internal_secret != INTERNAL_API_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    if body.credits_to_add <= 0:
        raise HTTPException(status_code=400, detail="credits_to_add must be positive")

    database = db.get_db()
    client = db.client

    async with await client.start_session() as mongo_session:
        async with mongo_session.start_transaction():
            # IDEMPOTENCY: check if this Stripe session was already processed
            existing = await database.credit_transactions.find_one(
                {"stripe_session_id": body.stripe_session_id},
                session=mongo_session
            )
            if existing:
                logging.info(f"[internal] Session {body.stripe_session_id} already processed. Skipping.")
                return {"status": "success", "note": "idempotent_skip"}

            # Find user by clerk_id
            user = await database.users.find_one(
                {"clerk_id": body.clerk_id},
                session=mongo_session
            )
            
            # Robust fallback: Try finding by email if clerk_id lookup fails (rare edge case)
            if not user:
                 # Try to decode clerk_id as maybe it's actually an email? (Unlikely but safe)
                 if "@" in body.clerk_id:
                     user = await database.users.find_one({"email": body.clerk_id}, session=mongo_session)
            
            if not user:
                logging.error(f"[internal] User not found for clerk_id: {body.clerk_id}")
                raise HTTPException(status_code=404, detail=f"User not found: {body.clerk_id}")

            user_id = user["_id"]

            # Audit log entry
            tx = {
                "_id": f"tx_{uuid.uuid4().hex[:8]}",
                "user_id": user_id,
                "clerk_id": body.clerk_id,
                "type": "purchase",
                "amount": body.credits_to_add,
                "stripe_session_id": body.stripe_session_id,
                "description": f"Purchase {int(body.credits_to_add)} credits ({body.plan_id} plan)",
                "status": "completed",
                "timestamp": time.time(),
            }

            # Atomic credit increment + audit log
            await database.users.update_one(
                {"_id": user_id},
                {"$inc": {"credits_balance": body.credits_to_add}},
                session=mongo_session
            )
            await database.credit_transactions.insert_one(tx, session=mongo_session)

            logging.info(
                f"[internal] Added {body.credits_to_add} credits to clerk_id={body.clerk_id} "
                f"(user_id={user_id}), session={body.stripe_session_id}"
            )

    return {"status": "success", "credits_added": body.credits_to_add}
