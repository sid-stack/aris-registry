from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
import os
import stripe
import logging
import time
from datetime import datetime, timedelta
from apps.api.database import db

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
CRON_SECRET = os.getenv("CRON_SECRET")

router = APIRouter()

async def verify_cron_secret(x_cron_secret: Optional[str] = Header(None, alias="X-Cron-Secret")):
    if not CRON_SECRET or x_cron_secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@router.get("/release-stale-holds")
async def release_stale_holds(authenticated: bool = Depends(verify_cron_secret)):
    """
    Garbage collection for stale Stripe authorizations (>72 hours).
    """
    database = db.get_db()
    
    # 72 hours ago
    cutoff_time = time.time() - (72 * 3600)
    
    # Query for stale AUTHORIZED proposals
    stale_proposals = await database.proposals.find({
        "status": "AUTHORIZED",
        "created_at": {"$lt": cutoff_time}
    }).to_list(length=100)
    
    released_count = 0
    errors = []
    
    for prop in stale_proposals:
        intent_id = prop["intent_id"]
        try:
            # Release funds in Stripe
            stripe.PaymentIntent.cancel(intent_id)
            
            # Update DB status
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
            error_msg = f"Failed to release hold for {intent_id}: {str(e)}"
            logging.error(error_msg)
            errors.append(error_msg)
            
    return {
        "status": "success",
        "released_count": released_count,
        "errors": errors if errors else None
    }
