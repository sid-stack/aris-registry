from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.database import db
from apps.api.routers import users, registry, analyze
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="BidSmith API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "https://bidsmith-frontend.vercel.app", # Adjust as needed
    os.getenv("FRONTEND_URL", "*")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
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

@app.get("/")
def read_root():
    return {"message": "BidSmith API is running"}
