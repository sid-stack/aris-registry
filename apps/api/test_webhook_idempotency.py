import asyncio
import os
import sys
import httpx
import uuid
import time

# Add apps/api to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

async def test_webhook_idempotency():
    url = "http://localhost:8000/api/checkout/webhook"
    session_id = f"cs_test_{uuid.uuid4().hex[:8]}"
    user_id = "user_2shS9fEID3vov7D02QY1iYidD1S" # Example user_id from previous logs if possible, or common ID
    
    # We'll need a real user_id or one that exists in the DB.
    # Let's try to find one first in the script or just use a dummy and see it fail gracefully.
    
    payload = {
        "id": "evt_test",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
                "metadata": {
                    "user_id": user_id,
                    "clerk_id": "user_2shS..."
                }
            }
        }
    }
    
    # Note: Signature verification will FAIL unless we disable it or use the secret to sign.
    # For testing, I'll temporarily comment out signature verification in checkout.py 
    # OR mock the construct_event.
    print(f"Testing session_id: {session_id}")
    
    # First call
    print("Call 1...")
    async with httpx.AsyncClient() as client:
        # We can't easily bypass signature without editing checkout.py
        pass

if __name__ == "__main__":
    # This is just a draft. I'll edit checkout.py to allow a 'test' header or similar.
    pass
