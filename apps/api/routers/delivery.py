from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import stripe
import logging
import time
from fpdf import FPDF
from apps.api.database import db
from apps.api.models import User, Proposal
from apps.api.dependencies import get_current_user

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
CRON_SECRET = os.getenv("CRON_SECRET")
if not CRON_SECRET:
    # We don't raise error here to allow other routes to work, but cron will fail
    logging.warning("CRON_SECRET is not set. Admin routes disabled.")

router = APIRouter()

class DeliveryRequest(BaseModel):
    intent_id: str
    proposal_text: str

async def process_delivery_and_capture(intent_id: str, proposal_text: str, user_id: str):
    """
    Atomic Delivery: Storage before Capture.
    """
    logging.info(f"🚀 Starting atomic delivery for intent={intent_id}")
    database = db.get_db()

    try:
        # 1. Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 10, proposal_text)
        
        # In a real system, we'd save to a temp file or memory buffer
        # For this demo, we'll simulate the "Cloud Storage" path
        storage_path = f"final_bids/{user_id}/{intent_id}.pdf"
        
        # MOCK STORAGE UPLOAD
        # In production: s3.upload_file(...) or similar
        logging.info(f"📦 PDF generated. Simulating cloud upload to: {storage_path}")
        time.sleep(1) # Simulate network latency
        
        # Mocking a signed URL (24h)
        signed_url = f"https://storage.aris.io/{storage_path}?token=mock_signed_token"

        # 2. Capture Stripe Payment
        # Only if storage "succeeded"
        intent = stripe.PaymentIntent.capture(intent_id)
        logging.info(f"💰 Stripe capture successful for intent={intent_id}")

        # 3. Update DB
        await database.proposals.update_one(
            {"intent_id": intent_id},
            {
                "$set": {
                    "status": "DELIVERED",
                    "pdf_url": signed_url,
                    "updated_at": time.time()
                }
            },
            upsert=True # If the record wasn't created yet during auth
        )
        
        return {"status": "success", "pdf_url": signed_url, "intent_id": intent_id}

    except stripe.error.StripeError as e:
        logging.error(f"❌ Stripe Capture Failed: {str(e)}")
        # If capture fails, we still have the PDF in storage (potentially)
        raise HTTPException(status_code=500, detail=f"Payment capture failed: {str(e)}")
    except Exception as e:
        logging.error(f"❌ Atomic Delivery Failure: {str(e)}")
        # Fail-safe: No capture if storage/PDF fails
        raise HTTPException(status_code=500, detail="Delivery pipeline failed. Payment not captured.")

@router.post("/deliver")
async def deliver_bid(
    body: DeliveryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Client-triggered delivery after agent success handshake.
    """
    return await process_delivery_and_capture(
        intent_id=body.intent_id,
        proposal_text=body.proposal_text,
        user_id=current_user.id
    )

# ─── DEAD MAN'S SWITCH (72-HOUR TTL) ──────────────────────────────────────────

async def verify_cron_secret(x_cron_secret: Optional[str] = Header(None, alias="X-Cron-Secret")):
    if not CRON_SECRET or x_cron_secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@router.post("/admin/cleanup-stale-bids")
async def cleanup_stale_bids(authenticated: bool = Depends(verify_cron_secret)):
    """
    Garbage collection for stale Stripe authorizations (>72 hours).
    """
    database = db.get_db()
    cutoff_time = time.time() - (72 * 3600)
    
    stale_proposals = await database.proposals.find({
        "status": "AUTHORIZED",
        "created_at": {"$lt": cutoff_time}
    }).to_list(length=100)
    
    released_count = 0
    errors = []
    
    for prop in stale_proposals:
        intent_id = prop["intent_id"]
        try:
            stripe.PaymentIntent.cancel(intent_id)
            await database.proposals.update_one(
                {"_id": prop["_id"]},
                {"$set": {
                    "status": "CANCELLED_TIMEOUT",
                    "updated_at": time.time()
                }}
            )
            released_count += 1
            logging.info(f"Released stale hold for intent={intent_id}")
        except Exception as e:
            error_msg = f"Failed to release {intent_id}: {str(e)}"
            logging.error(error_msg)
            errors.append(error_msg)
            
    return {
        "status": "success",
        "released_count": released_count,
        "errors": errors if errors else None
    }
