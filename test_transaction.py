import asyncio
from aris.client import ArisClient

async def main():
    client = ArisClient()
    
    # 1. Setup: Register a target
    target_did = "did:aris:expensive_gpu_agent"
    await client.register(target_did, "http://gpu-box:8080", ["gpu.render"], price=100.0)
    print(f"✅ Registered Target: {target_did}")

    # 2. Attempt Handshake (The "Payment")
    print("\n💳 Attempting to hire agent...")
    try:
        receipt = await client.handshake(
            requester_did="did:aris:me", 
            target_did=target_did
        )
        
        print("✅ PAYMENT SUCCESSFUL!")
        print(f"   -> Fee: ₹{receipt['fee_charged']}")
        print(f"   -> Token: {receipt['session_token'][:30]}...") # Print first 30 chars
        print(f"   -> Expires: {receipt['expires_at']}")
        
    except Exception as e:
        print(f"❌ Payment Failed: {e}")

    await client.close()

if __name__ == "__main__":
    asyncio.run(main())