from fastapi import APIRouter, Request, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
from apps.api.database import db
from apps.api.models import User, Proposal
from apps.api.dependencies import get_current_user
import stripe
import os
import logging
import uuid
import time
import io
from fpdf import FPDF
from supabase import create_client, Client
import boto3

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "")

# Storage Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "bidsmith")

S3_BUCKET = os.getenv("AWS_BUCKET")
s3_client = None
if os.getenv("AWS_ACCESS_KEY_ID"):
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION", "us-east-1")
    )

router = APIRouter()

# Prefer explicit frontend URL config and avoid localhost defaults in production paths
FRONTEND_URL = os.getenv("FRONTEND_URL") or os.getenv("NEXT_PUBLIC_APP_URL") or "https://arislabs.ai"

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
    "outcome_bid": {
        "name": "Outcome-Based Bid Proposal",
        "unit_amount": 50000,  # $500.00
        "credits": 0.0,
    }
}

class CheckoutRequest(BaseModel):
    plan_id: Optional[str] = "credits"  # default: legacy credits top-up

class AuthorizeRequest(BaseModel):
    plan_id: str = "outcome_bid"

class CaptureRequest(BaseModel):
    payment_intent_id: str

class CancelRequest(BaseModel):
    payment_intent_id: str

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
    if not endpoint_secret:
        raise HTTPException(status_code=500, detail="STRIPE_WEBHOOK_SECRET is not configured")

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

    elif event['type'] == 'payment_intent.amount_capturable_updated':
        intent = event['data']['object']
        database = db.get_db()
        await database.proposals.update_one(
            {"intent_id": intent['id']},
            {"$set": {"status": "AUTHORIZED", "updated_at": time.time()}}
        )
        logging.info(f"💰 Funds authorized for intent {intent['id']}")

    elif event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        # Final capture confirmation
        database = db.get_db()
        await database.proposals.update_one(
            {"intent_id": intent['id']},
            {"$set": {"status": "PAID", "updated_at": time.time()}}
        )
        logging.info(f"✅ Payment succeeded for intent {intent['id']}")

    return {"status": "success"}

async def upload_to_cloud(buffer: io.BytesIO, file_path: str) -> str:
    """
    Upload buffer to Supabase or S3 depending on env.
    Returns a 30-day signed URL.
    """
    buffer.seek(0)
    
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            file_path, 
            buffer.getvalue(),
            {"content-type": "application/pdf"}
        )
        res = supabase.storage.from_(SUPABASE_BUCKET).create_signed_url(file_path, 30 * 24 * 3600)
        return res['signedURL']
    
    if s3_client and S3_BUCKET:
        s3_client.upload_fileobj(buffer, S3_BUCKET, file_path)
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': file_path},
            ExpiresIn=30 * 24 * 3600
        )
        return url
    
    raise Exception("No cloud storage configured")

async def finalize_proposal(intent_id: str, proposal_text: str, user_id: str):
    """
    Atomic Delivery Sequence: PDF -> Storage -> DB -> Stripe Capture
    """
    database = db.get_db()
    
    try:
        # 1. PDF Generation (in-memory)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 10, proposal_text)
        
        pdf_buffer = io.BytesIO()
        pdf_output = pdf.output(dest='S')
        pdf_buffer.write(pdf_output.encode('latin-1') if isinstance(pdf_output, str) else pdf_output)
        
        # 2. Upload to Cloud Storage
        file_path = f"bidsmith_final/{user_id}/{intent_id}.pdf"
        signed_url = await upload_to_cloud(pdf_buffer, file_path)
        
        # 3. Update DB
        await database.proposals.update_one(
            {"intent_id": intent_id},
            {
                "$set": {
                    "pdf_url": signed_url,
                    "status": "DELIVERED",
                    "updated_at": time.time()
                }
            }
        )
        
        # 4. Stripe Capture
        stripe.PaymentIntent.capture(intent_id)
        logging.info(f"✅ Proposal finalized and payment captured for intent={intent_id}")
        return {"status": "success", "pdf_url": signed_url}

    except Exception as e:
        logging.error(f"❌ Atomic Delivery Failed for {intent_id}: {str(e)}")
        # Fail-safe: Release funds
        try:
            stripe.PaymentIntent.cancel(intent_id)
            await database.proposals.update_one(
                {"intent_id": intent_id},
                {"$set": {"status": "CANCELLED_ERROR", "updated_at": time.time()}}
            )
        except Exception as stripe_err:
            logging.error(f"Failed to cancel Stripe intent after delivery error: {str(stripe_err)}")
        
        raise HTTPException(status_code=500, detail=f"Delivery failure: {str(e)}")

# ─── Outcome-Based Billing (Auth & Capture) ───────────────────────────────────

@router.post("/authorize")
async def authorize_payment(
    body: AuthorizeRequest,
    current_user: User = Depends(get_current_user)
):
    plan = PLANS.get(body.plan_id, PLANS["outcome_bid"])
    database = db.get_db()
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=plan["unit_amount"],
            currency="usd",
            capture_method="manual",
            metadata={
                "user_id": current_user.id,
                "clerk_id": current_user.clerk_id,
                "plan_id": body.plan_id,
                "type": "outcome_based"
            }
        )

        capture_method = getattr(intent, "capture_method", None)
        if capture_method != "manual":
            logging.error(
                f"PaymentIntent capture_method mismatch for intent={getattr(intent, 'id', 'unknown')}: "
                f"expected 'manual', got '{capture_method}'"
            )
            intent_id = getattr(intent, "id", None)
            if intent_id:
                try:
                    stripe.PaymentIntent.cancel(intent_id)
                except Exception as cancel_error:
                    logging.error(
                        f"Failed to cancel PaymentIntent {intent_id} after capture_method mismatch: {cancel_error}"
                    )
            raise HTTPException(status_code=500, detail="PaymentIntent capture_method must be 'manual'")

        # Create Proposal Record for tracking
        proposal = {
            "_id": f"prop_{uuid.uuid4().hex[:8]}",
            "user_id": current_user.id,
            "intent_id": intent.id,
            "proposal_text": "", # Will be filled later
            "status": "AUTHORIZED",
            "created_at": time.time(),
            "updated_at": time.time()
        }
        await database.proposals.insert_one(proposal)
        
        return {"client_secret": intent.client_secret, "id": intent.id}
    except Exception as e:
        logging.error(f"Stripe Auth Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/finalize/{intent_id}")
async def finalize_proposal_endpoint(
    intent_id: str,
    proposal_text: str,
    current_user: User = Depends(get_current_user)
):
    # Security: Ensure the intent belongs to this user
    database = db.get_db()
    proposal = await database.proposals.find_one({"intent_id": intent_id, "user_id": current_user.id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal session not found or unauthorized")
    
    return await finalize_proposal(intent_id, proposal_text, current_user.id)

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

@router.post("/capture")
async def capture_payment(
    body: CaptureRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Captures an authorized PaymentIntent.
    Should be called after the Aris agent confirms SUCCESS.
    """
    try:
        intent = stripe.PaymentIntent.capture(body.payment_intent_id)
        return {"status": "success", "intent_id": intent.id}
    except Exception as e:
        logging.error(f"Stripe Capture Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel")
async def cancel_payment(
    body: CancelRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Cancels an authorized PaymentIntent (releases the hold).
    Should be called if the Aris agent fails.
    """
    try:
        intent = stripe.PaymentIntent.cancel(body.payment_intent_id)
        return {"status": "cancelled", "intent_id": intent.id}
    except Exception as e:
        logging.error(f"Stripe Cancel Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Usage-Based SaaS (Micro-transactions for SDK) ───────────────────────────

class UsageRequest(BaseModel):
    action: str
    agent_id: str
    metadata: Dict[str, Any] = {}

@router.post("/sdk/verify-usage")
async def verify_usage_charge(
    body: UsageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Placeholder for the hybrid Usage-Based model.
    Charges the user a micro-transaction (e.g. $0.05) per verified API call via SDK.
    """
    # STRATEGIC ACTION: Establish the "Stair Step" monetization
    # In production, this would trigger an atomic credit deduction 
    # or create a Stripe metered usage record.
    
    logging.info(f"📊 [SDK_USAGE] User={current_user.id} Agent={body.agent_id} Action={body.action}")
    
    return {
        "status": "verified",
        "charge_mode": "usage_based",
        "action_recorded": body.action,
        "note": "Micro-transaction pending in next billing cycle"
    }
