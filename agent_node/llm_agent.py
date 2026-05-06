import uvicorn
import jwt
import os
import httpx
import asyncio
import argparse
import contextlib
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional

from aris.session_defaults import DEFAULT_SESSION_HS256_SECRET

logger = logging.getLogger(__name__)

# --- CONFIG (read before lifespan — imported app startup uses these) ---
REGISTRY_URL   = os.getenv("ARIS_REGISTRY",      "http://localhost:8000/register")
NODE_PORT      = int(os.getenv("ARIS_NODE_PORT",  9006))
MY_DID         = "did:aris:llm-node-01"
MY_ENDPOINT    = os.getenv("ARIS_NODE_ENDPOINT",  f"http://localhost:{NODE_PORT}")
ARIS_PUBLIC_KEY = os.getenv("ARIS_PUBLIC_KEY", DEFAULT_SESSION_HS256_SECRET)
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
OLLAMA_CHAT_URL     = "http://localhost:11434/api/chat"
NODE_CAPABILITIES   = ["ai.generate", "ai.chat"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Worker node listening at %s", MY_ENDPOINT)
    logger.info("Registry registration URL: %s", REGISTRY_URL)

    async def heartbeat():
        while True:
            async with httpx.AsyncClient() as client:
                try:
                    await client.post(REGISTRY_URL, json={
                        "did":          MY_DID,
                        "endpoint":     MY_ENDPOINT,
                        "capabilities": NODE_CAPABILITIES,
                    })
                    logger.debug(
                        "Registry heartbeat ok (capabilities=%s, port=%s)",
                        ",".join(NODE_CAPABILITIES),
                        NODE_PORT,
                    )
                except Exception as e:
                    logger.warning("Registry unreachable: %s", e)
            await asyncio.sleep(30)

    task = asyncio.create_task(heartbeat())
    yield
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task


app = FastAPI(title="Aris Node: LLM Specialist", lifespan=lifespan)


# ── Shared JWT verification ───────────────────────────────────────────────────

def _verify_token(token: str) -> dict:
    """Decode and validate an Aris session token. Raises HTTPException on failure."""
    try:
        return jwt.decode(token, ARIS_PUBLIC_KEY, algorithms=["HS256"], audience=MY_DID)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session token has expired.")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


# ── Models ───────────────────────────────────────────────────────────────────

class PromptRequest(BaseModel):
    model: str = "tinyllama"
    prompt: str


class ChatMessage(BaseModel):
    role: str    # "system" | "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    model: str = "tinyllama"
    messages: List[ChatMessage]


# ── /generate — single-turn text generation (unchanged) ──────────────────────

@app.post("/generate")
async def generate_text(job: PromptRequest, x_aris_token: str = Header(...)):
    payload = _verify_token(x_aris_token)
    logger.info(
        "generate request caller=%s model=%s",
        payload.get("sub", "unknown"),
        job.model,
    )

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                OLLAMA_GENERATE_URL,
                json={"model": job.model, "prompt": job.prompt, "stream": False},
                timeout=60.0,
            )
            resp.raise_for_status()
            return {"result": resp.json().get("response", ""), "status": "success"}
        except Exception as e:
            return {"result": f"LLM Error: {str(e)}", "status": "error"}


# ── /chat — multi-turn conversation ──────────────────────────────────────────

@app.post("/chat")
async def chat(req: ChatRequest, x_aris_token: str = Header(...)):
    """
    Multi-turn chat endpoint.

    Accepts an OpenAI-style messages array and returns the next assistant turn.
    Delegates to Ollama's /api/chat which natively handles message history.

    Request body::

        {
          "model": "tinyllama",
          "messages": [
            {"role": "user",      "content": "Hello, who are you?"},
            {"role": "assistant", "content": "I am Aris, your AI."},
            {"role": "user",      "content": "What can you do?"}
          ]
        }

    Returns::

        {
          "role":    "assistant",
          "content": "I can answer questions, write code ...",
          "model":   "tinyllama",
          "status":  "success"
        }
    """
    payload = _verify_token(x_aris_token)
    logger.info(
        "chat request caller=%s turns=%s model=%s",
        payload.get("sub", "unknown"),
        len(req.messages),
        req.model,
    )

    # Validate: messages must not be empty and must end with a user turn
    if not req.messages:
        raise HTTPException(status_code=422, detail="messages list must not be empty.")
    if req.messages[-1].role != "user":
        raise HTTPException(status_code=422, detail="Last message must have role='user'.")

    ollama_messages = [{"role": m.role, "content": m.content} for m in req.messages]

    async with httpx.AsyncClient() as http:
        try:
            resp = await http.post(
                OLLAMA_CHAT_URL,
                json={"model": req.model, "messages": ollama_messages, "stream": False},
                timeout=90.0,
            )
            resp.raise_for_status()
            data     = resp.json()
            msg      = data.get("message", {})
            content  = msg.get("content", "")
            return {
                "role":    "assistant",
                "content": content,
                "model":   req.model,
                "status":  "success",
            }
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Ollama error: {e.response.text}")
        except Exception as e:
            return {
                "role":    "assistant",
                "content": f"LLM Error: {str(e)}",
                "model":   req.model,
                "status":  "error",
            }


# --- ENTRY POINT ---
def start():
    """Entry point used by setup.py console_scripts."""
    parser = argparse.ArgumentParser(description="Aris Worker Node")
    parser.add_argument("--port",     type=int, default=9006,                        help="Port to run the node on")
    parser.add_argument("--registry", type=str, default="http://localhost:8000/register", help="Registry URL")
    args = parser.parse_args()

    os.environ["ARIS_NODE_PORT"] = str(args.port)
    os.environ["ARIS_REGISTRY"]  = args.registry

    uvicorn.run(app, host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    start()