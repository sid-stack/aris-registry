import uvicorn
import jwt
import os
import httpx 
import asyncio
import argparse
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

app = FastAPI(title="Aris Node: LLM Specialist")

# --- CONFIG ---
# 1. We read these from Environment Variables so the CLI can override them
REGISTRY_URL = os.getenv("ARIS_REGISTRY", "http://localhost:8000/register")
NODE_PORT = int(os.getenv("ARIS_NODE_PORT", 9006))  # Dynamic Port!
MY_DID = "did:aris:llm-node-01"
# 2. Dynamic Endpoint based on the actual running port
MY_ENDPOINT = os.getenv("ARIS_NODE_ENDPOINT", f"http://localhost:{NODE_PORT}")
ARIS_PUBLIC_KEY = "s3cret_k3y_for_signing_tokens" 
OLLAMA_URL = "http://localhost:11434/api/generate"

# --- AUTO-REGISTER ON STARTUP ---
@app.on_event("startup")
async def start_heartbeat():
    print(f"🌍 Node starting at {MY_ENDPOINT}")
    print(f"🔗 Connecting to Registry at {REGISTRY_URL}")
    
    async def heartbeat():
        while True:
            async with httpx.AsyncClient() as client:
                try:
                    await client.post(REGISTRY_URL, json={
                        "did": MY_DID,
                        "endpoint": MY_ENDPOINT,
                        "capabilities": ["ai.generate"]
                    })
                    print(f"💓 Heartbeat sent for port {NODE_PORT}")
                except Exception as e:
                    print(f"⚠️ Registry unreachable: {e}")
            await asyncio.sleep(30) 
            
    asyncio.create_task(heartbeat())

# --- MODELS & ENDPOINTS ---
class PromptRequest(BaseModel):
    model: str = "tinyllama"
    prompt: str

@app.post("/generate")
async def generate_text(job: PromptRequest, x_aris_token: str = Header(...)):
    try:
        # Verify the session token
        payload = jwt.decode(x_aris_token, ARIS_PUBLIC_KEY, algorithms=["HS256"], audience=MY_DID)
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid or Expired Token")

    print(f"🧠 [LLM Node] Processing for {payload.get('sub', 'unknown')}...")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(OLLAMA_URL, json={
                "model": job.model, "prompt": job.prompt, "stream": False
            }, timeout=60.0)
            return {"result": resp.json().get("response", ""), "status": "success"}
        except Exception as e:
             return {"result": f"LLM Error: {str(e)}", "status": "error"}

# --- ENTRY POINT ---
def start():
    """Entry point used by setup.py console_scripts"""
    parser = argparse.ArgumentParser(description="Aris Worker Node")
    parser.add_argument("--port", type=int, default=9006, help="Port to run the node on")
    parser.add_argument("--registry", type=str, default="http://localhost:8000/register", help="Registry URL")
    args = parser.parse_args()
    
    # 3. SET ENVIRONMENT VARIABLES BEFORE STARTING APP
    # This allows the 'app' instance above to read the correct port!
    os.environ["ARIS_NODE_PORT"] = str(args.port)
    os.environ["ARIS_REGISTRY"] = args.registry
    
    # Run Uvicorn
    # Note: We pass 'app' directly here since we are in the same file, 
    # but using the string syntax is safer for some reload scenarios.
    uvicorn.run(app, host="0.0.0.0", port=args.port)

if __name__ == "__main__":
    start()