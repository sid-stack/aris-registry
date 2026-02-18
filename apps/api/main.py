import os
import sys
from dotenv import load_dotenv

# Load env before importing other modules that might rely on env vars at module level
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add project root to sys.path to allow imports from apps.api
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from apps.api.database import db
from apps.api.routers import users, registry, analyze, checkout, orchestrator
from apps.api.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# app initialized after limiter imports to avoid ciruclarity
app = FastAPI(title="BidSmith API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration - STRICT LOCKDOWN
production_origins = [
    "https://bidsmith-frontend.vercel.app",
    "https://aris.io"
]
local_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

origins = [o for o in (production_origins + [os.getenv("FRONTEND_URL")]) if o]
if os.getenv("ENV") != "production":
    origins += local_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://bidsmith-frontend-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Database Connection Events
@app.on_event("startup")
def startup_db_client():
    db.connect()

@app.on_event("shutdown")
def shutdown_db_client():
    db.close()

# Include Routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(registry.router, prefix="/api/registry", tags=["Registry"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(checkout.router, prefix="/api/checkout", tags=["Checkout"])
app.include_router(orchestrator.router, prefix="/api/orchestrator", tags=["Orchestrator"])

@app.get("/")
def read_root():
    return {"message": "BidSmith API is running"}
