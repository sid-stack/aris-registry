import os
import sys
from dotenv import load_dotenv

# Load env before importing other modules that might rely on env vars at module level
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid

# Add project root to sys.path to allow imports from apps.api
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from apps.api.database import db
from apps.api.routers import users, registry, analyze, checkout, orchestrator, delivery, cron, documents
from apps.api.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# app initialized after limiter imports to avoid ciruclarity
app = FastAPI(title="ARIS Labs API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration - STRICT LOCKDOWN
production_origins = [
    "https://bidsmith-frontend.vercel.app",
    "https://aris-registry.vercel.app",
    "https://bidsmith.ai",
    "https://aris.io",
    "https://bidsmith.pro",
    "https://www.bidsmith.pro",
]
local_origins = [
    "http://127.0.0.1:3000"
]

origins = [o for o in (production_origins + [os.getenv("FRONTEND_URL")]) if o]
if os.getenv("ENV") != "production":
    origins += local_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://(www\.)?bidsmith-frontend-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─── AGENT EXPERIENCE (AX) MIDDLEWARE ─────────────────────────────────────────

@app.middleware("http")
async def add_agent_tracing_headers(request: Request, call_next):
    """
    Weaponizing the Agent Request: Trace and identify autonomous traffic.
    """
    start_time = time.time()
    correlation_id = request.headers.get("X-Agent-Correlation-ID", str(uuid.uuid4()))
    is_agent = request.headers.get("X-Agent-Request", "false").lower() == "true"
    
    # Inject tracing into request state for downstream use
    request.state.is_agent = is_agent
    request.state.correlation_id = correlation_id
    
    response = await call_next(request)
    
    # Add tracing to response for machine-machine traceability
    response.headers["X-Agent-Correlation-ID"] = correlation_id
    response.headers["X-Agent-Request-Processed"] = "true"
    
    process_time = time.time() - start_time
    if is_agent:
        print(f"🤖 [AGENT_TRACE] id={correlation_id} path={request.url.path} time={process_time:.4f}s")
    
    return response

# ─── MACHINE-READABLE ERROR RECOVERY ──────────────────────────────────────────

@app.exception_handler(HTTPException)
async def machine_readable_exception_handler(request: Request, exc: HTTPException):
    """
    Ensure AI agents receive precise error recovery paths, not just status codes.
    """
    is_agent = getattr(request.state, "is_agent", False)
    
    error_payload = {
        "detail": exc.detail,
        "status_code": exc.status_code,
    }
    
    if is_agent:
        # Inject "AX Recovery Path" for autonomous agents
        error_payload["recovery"] = {
            401: "REFRESH_JWT_HANDSHAKE",
            403: "VERIFY_REGISTRY_PERMISSIONS",
            402: "TOP_UP_CREDITS_REQUIRED",
            429: "RETRY_AFTER_RATE_LIMIT_COOLDOWN"
        }.get(exc.status_code, "CONTACT_ARIS_REGISTRY_SUPPORT")
        
    return JSONResponse(status_code=exc.status_code, content=error_payload)

# Database Connection Events
@app.on_event("startup")
async def startup_db_client():
    db.connect()
    
    # Initialize necessary MongoDB indices for fast queries
    database = db.get_db()
    await database.agents.create_index("capabilities")
    await database.agents.create_index("did", unique=True, sparse=True)
    
    # Start the background background health checker
    from apps.api.health import health_check_loop
    import asyncio
    asyncio.create_task(health_check_loop())

@app.on_event("shutdown")
async def shutdown_db_client():
    await db.close()

# Include Routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(registry.router, prefix="/api/registry", tags=["Registry"])
app.include_router(checkout.router, prefix="/api/checkout", tags=["Checkout"])
app.include_router(orchestrator.router, prefix="/api/orchestrator", tags=["Orchestrator"])
app.include_router(delivery.router, prefix="/api/delivery", tags=["Delivery"])
app.include_router(cron.router, prefix="/api/cron", tags=["Cron"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analyze"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])

from apps.api.routers.bidsmith import chat as bidsmith_router
app.include_router(bidsmith_router.router, prefix="/api", tags=["BidSmith"])

@app.get("/")
def read_root():
    return {"message": "BidSmith API is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Attach MCP Server to FastAPI
from apps.api.mcp_server import mcp
app.mount("/mcp", mcp.sse_app())
