"""
Quick demo showing two agents communicating via Aris Registry.
"""
import asyncio
import httpx
import os
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from typing import Dict, Any

# Mock Agent Endpoints
MATH_AGENT_PORT = 8001
CLIENT_AGENT_PORT = 8002
REGISTRY_URL = "http://localhost:8000/api/registry"

# ─── MATH AGENT (Provider) ───────────────────────────────────────────────

math_app = FastAPI(title="Math Agent")
security = HTTPBearer()

async def verify_token(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth.split(" ")[1]
    
    # In a real scenario, the agent would verify the JWT signature locally 
    # using the Aris Public Key. Here we just mock verify it.
    if len(token) < 20: 
        raise HTTPException(status_code=401, detail="Invalid token signature")
    return token

@math_app.post("/execute")
async def execute_math(payload: Dict[str, Any], token: str = Depends(verify_token)):
    """Protected endpoint requiring an Aris capability token"""
    a = payload.get("a", 0)
    b = payload.get("b", 0)
    return {"result": a + b, "provider": "math_agent_pro"}

@math_app.get("/health")
async def health():
    return {"status": "healthy"}

async def start_math_agent():
    config = uvicorn.Config(math_app, host="127.0.0.1", port=MATH_AGENT_PORT, log_level="error")
    server = uvicorn.Server(config)
    print(f"🧮 Math Agent started on port {MATH_AGENT_PORT}")
    await server.serve()

# ─── CLIENT SCENARIO ───────────────────────────────────────────────────

async def run_demo_scenario():
    # Wait a second for the math server to start
    await asyncio.sleep(1)
    
    async with httpx.AsyncClient() as client:
        print("\n🚀 Starting Aris Registry Flow Demonstration...")
        
        # 1. Register the Math Agent
        print("\n1️⃣ Registering Math Agent...")
        reg_payload = {
            "did": "did:aris:math001",
            "name": "Math Pro",
            "description": "Enterprise grade addition.",
            "public_key": "mock_pem_key_data",
            "endpoint": f"http://localhost:{MATH_AGENT_PORT}",
            "capabilities": ["math.add"],
            "category": "utility",
            "provider": "MathCo",
            "pricing": {"amount": 0.5, "currency": "USD", "model": "per_call"}
        }
        
        res = await client.post(f"{REGISTRY_URL}/register", json=reg_payload)
        print(f"Registry Response: {res.status_code}")
        
        # 2. Discover the Math Agent
        print("\n2️⃣ Client Agent discovering 'math.add' capability...")
        res = await client.get(f"{REGISTRY_URL}/discover", params={"capability": "math.add"})
        agents = res.json().get("agents", [])
        
        if not agents:
            print("❌ No agents found!")
            return
            
        target_agent = agents[0]
        print(f"✅ Found Agent: {target_agent['name']} (DID: {target_agent['did']})")
        
        # 3. Init Transaction (Get Token)
        print("\n3️⃣ Requesting translation token...")
        tx_payload = {
            "from_did": "did:aris:client001",
            "to_did": target_agent["did"],
            "capability": "math.add",
            "expiry_minutes": 5
        }
        res = await client.post(f"{REGISTRY_URL}/transactions/init", json=tx_payload)
        token_data = res.json()
        token = token_data.get("token")
        print(f"🪙 Received JWT Token (Expires in {token_data.get('expires_in')}s)")
        
        # 4. Use the Agent
        print("\n4️⃣ Calling Math Agent with Token...")
        res = await client.post(
            f"{target_agent['endpoint']}/execute",
            json={"a": 15, "b": 27},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"🎉 Result: 15 + 27 = {res.json().get('result')}")

async def main():
    # Start the provider mock server in the background
    asyncio.create_task(start_math_agent())
    # Run the client scenario
    await run_demo_scenario()

if __name__ == "__main__":
    # Ensure Aris Registry is running on port 8000 before running this!
    asyncio.run(main())
