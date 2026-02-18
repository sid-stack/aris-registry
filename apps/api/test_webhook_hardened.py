import asyncio
import os
import sys
import httpx
import uuid
import time
from dotenv import load_dotenv

# Add apps/api to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Load env from absolute path
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(env_path)

async def test_webhook_idempotency():
    url = "http://localhost:8000/api/checkout/webhook"
    session_id = f"cs_test_{uuid.uuid4().hex[:8]}"
    
    # We'll try to find a real user_id from the DB or use a known one.
    user_id = "user_2shS9fEID3vov7D02QY1iYidD1S" 
    
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        print("Error: STRIPE_WEBHOOK_SECRET not found in .env")
        return

    payload = {
        "id": "evt_test",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
                "metadata": {
                    "user_id": user_id,
                    "clerk_id": user_id
                }
            }
        }
    }
    
    headers = {
        "x-test-bypass": webhook_secret,
        "stripe-signature": "dummy"
    }
    
    async with httpx.AsyncClient() as client:
        print(f"\n--- Testing Session ID: {session_id} ---")
        
        # Call 1: Should succeed and add credits
        print("Executing Call 1 (Expected: Success)...")
        try:
            res1 = await client.post(url, json=payload, headers=headers)
            print(f"Call 1 Result: {res1.status_code} - {res1.json()}")
        except Exception as e:
            print(f"Call 1 Failed to connect: {e}")
            return
        
        # Call 2: Should be skipped due to idempotency
        print("\nExecuting Call 2 (Expected: Idempotent Skip)...")
        res2 = await client.post(url, json=payload, headers=headers)
        print(f"Call 2 Result: {res2.status_code} - {res2.json()}")
        
        if res2.json().get("note") == "idempotent_skip":
            print("\n✅ IDEMPOTENCY VERIFIED: Second call was ignored.")
        else:
            print("\n❌ IDEMPOTENCY FAILED: Second call was not skipped.")

if __name__ == "__main__":
    asyncio.run(test_webhook_idempotency())
