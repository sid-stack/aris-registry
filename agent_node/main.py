import sys
import argparse
import uvicorn
import base64
import hmac
import hashlib
import time
import ollama
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# --- 1. SETUP DYNAMIC ARGS ---
parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=9001)
parser.add_argument("--name", type=str, default="Unknown Agent")
args, _ = parser.parse_known_args()

app = FastAPI(title=f"Aris Node: {args.name}")

# --- CONFIG ---
ARIS_SECRET_KEY = b"super_secret_platform_key_2025"
MODEL_NAME = "tinyllama" 

class JobRequest(BaseModel):
    prompt: str
    session_token: str

@app.post("/process_job")
async def process_job(job: JobRequest):
    # AUTH (Same as before)
    try:
        if "." not in job.session_token: raise ValueError("Invalid token")
        payload_b64, signature = job.session_token.split(".")
        expected_sig = hmac.new(ARIS_SECRET_KEY, base64.b64decode(payload_b64), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig): raise HTTPException(401, "FAKE TOKEN")
    except Exception as e:
        raise HTTPException(401, str(e))

    # INTELLIGENCE
    print(f"[{args.name}] Thinking...")
    try:
        response = ollama.chat(model=MODEL_NAME, messages=[{'role': 'user', 'content': job.prompt}])
        return {
            "node": args.name,
            "response": response['message']['content']
        }
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    # This allows us to run: python main.py --port 9002
    uvicorn.run(app, host="0.0.0.0", port=args.port)