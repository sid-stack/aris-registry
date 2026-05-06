import os
import uvicorn
import jwt
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import logging

from aris.session_defaults import DEFAULT_SESSION_HS256_SECRET

logger = logging.getLogger(__name__)

app = FastAPI(title="Aris Node: Math Specialist")

ARIS_PUBLIC_KEY = os.getenv("ARIS_PUBLIC_KEY", DEFAULT_SESSION_HS256_SECRET)

class JobRequest(BaseModel):
    a: int
    b: int
    operation: str # "add"

@app.post("/execute")
async def execute_task(job: JobRequest, x_aris_token: str = Header(...)):
    """
    Section 3C: Agent verifies the token before working.
    """
    try:
        # 1. Verify the signature (Did Aris sign this?)
        payload = jwt.decode(x_aris_token, ARIS_PUBLIC_KEY, algorithms=["HS256"], audience="did:aris:math-node-01")
        
        # 2. Check Scope
        if "math.add" not in payload.get("scope", ""):
            raise HTTPException(403, "Token not valid for math.add")
            
        logger.info("Token verified for subject=%s", payload.get("sub"))

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token Expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(401, f"Invalid Token: {str(e)}")

    # 3. Do the Work (The Capability)
    if job.operation == "add":
        return {"result": job.a + job.b, "status": "success"}
    
    return {"error": "Unsupported operation"}

if __name__ == "__main__":
    # Runs on Port 9005 (Math Node)
    uvicorn.run(app, host="0.0.0.0", port=9005)