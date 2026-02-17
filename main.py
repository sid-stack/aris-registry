from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="BidSmith API", version="1.0.0")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class ResearchRequest(BaseModel):
    rfp_url: str

class WriteRequest(BaseModel):
    # Define payload as needed, placeholder for now
    data: dict

# --- Endpoints ---
@app.get("/health")
async def health_check():
    return {"status": "BidSmith API is live", "version": "1.0.0"}

@app.post("/api/v1/research")
async def research(request: ResearchRequest):
    # Placeholder for Aris Agent A (RFP Research)
    return {"status": "Research started", "rfp_url": request.rfp_url}

@app.post("/api/v1/write")
async def write(request: WriteRequest):
    # Placeholder for Aris Agent B (Proposal Writing)
    return {"status": "Writing started", "data": request.data}
