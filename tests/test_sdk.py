import asyncio
import json
from aris.client import ArisClient

async def main():
    print("--- 🚀 Starting Aris SDK Test ---")
    
    # 1. Initialize the Client
    client = ArisClient()
    
    # 2. Register a NEW agent ("Agent Python")
    # We use a random DID so we don't conflict if you run this twice
    import random
    suffix = random.randint(1000, 9999)
    my_did = f"did:aris:python_expert_{suffix}"
    
    print(f"\n[1] Registering {my_did}...")
    
    try:
        # Note: We are sending the data exactly as the server expects
        resp = await client.register(
            did=my_did, 
            endpoint="http://localhost:9001", 
            capabilities=["code.audit", "python.debug"],
            price=50.0
        )
        print(f"✅ Registration Response: {resp}")
    except Exception as e:
        print(f"❌ Registration Failed: {e}")

    # 3. Search for the agent we just added
    print("\n[2] Searching for 'code.audit' capability...")
    try:
        # We access the raw client to see the exact JSON coming back
        # This helps us debug if our Pydantic models are slightly off
        resp = await client.client.get("/discover", params={"capability": "code.audit"})
        data = resp.json()
        
        print(f"✅ Raw Server Response: {json.dumps(data, indent=2)}")
        
        agents = data.get("agents", [])
        if agents:
            print(f"   -> Success! Found {len(agents)} agents.")
        else:
            print("   -> No agents found (Index might be empty).")
            
    except Exception as e:
        print(f"❌ Search Failed: {e}")

    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
