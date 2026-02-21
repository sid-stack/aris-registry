from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime
import time

class User(BaseModel):
    id: str = Field(..., alias="_id")
    email: Optional[str] = None
    clerk_id: str
    credits_balance: float = 0.0
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    
    # AX (Agent Experience) Footprint
    is_autonomous: bool = False
    last_agent_cid: Optional[str] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "user_123",
                "email": "customer@example.com",
                "clerk_id": "user_2aa...",
                "credits_balance": 10.0
            }
        }

class CreditTransaction(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    clerk_id: str
    type: str  # 'purchase' or 'deduction'
    amount: float
    stripe_session_id: Optional[str] = None
    description: str
    status: str = "completed"
    timestamp: float = Field(default_factory=time.time)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "tx_123",
                "user_id": "user_123",
                "clerk_id": "user_2aa...",
                "type": "purchase",
                "amount": 25.0,
                "stripe_session_id": "cs_test_..."
            }
        }

class AnalysisResult(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    filename: str
    content_summary: str
    ai_analysis: str
    compliance_report: Optional[dict] = None
    timestamp: float = Field(default_factory=time.time)

    class Config:
        populate_by_name = True

class AgentPricing(BaseModel):
    amount: float
    currency: str = "USD"
    model: str = "fixed" # "fixed", "per_token", "per_minute"

class AgentReputation(BaseModel):
    total_txs: int = 0
    successful_txs: int = 0
    avg_rating: float = 0.0
    success_rate: float = 0.0

class AgentHealth(BaseModel):
    status: str = "unhealthy" # "healthy", "unhealthy"
    latency_ms: float = 0.0
    last_check: float = Field(default_factory=time.time)
    uptime_24h: float = 0.0

class Agent(BaseModel):
    id: str = Field(..., alias="_id") # internal mongo id
    did: str # did:aris:agent:123
    name: str
    description: str
    public_key: str # PEM format Base64 encoded for JWT validation
    endpoint: str # https://agent.com/mcp
    capabilities: List[str] # ["math.add", "video.encode"]
    category: str = "general"
    provider: str
    status: str = "active"
    verified: bool = False
    pricing: AgentPricing = Field(default_factory=lambda: AgentPricing(amount=0.0))
    reputation: AgentReputation = Field(default_factory=AgentReputation)
    health: AgentHealth = Field(default_factory=AgentHealth)
    agent_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

    class Config:
        populate_by_name = True

class AgentRegistration(BaseModel):
    did: str
    name: str
    description: str
    public_key: str
    endpoint: str
    capabilities: List[str]
    category: str = "general"
    provider: str
    pricing: AgentPricing


class Proposal(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    intent_id: str
    proposal_text: str
    pdf_url: Optional[str] = None
    status: str = "AUTHORIZED"  # AUTHORIZED, DELIVERED, CANCELLED, CANCELLED_TIMEOUT
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "prop_123",
                "user_id": "user_123",
                "intent_id": "pi_123",
                "proposal_text": "Bid proposal content...",
                "status": "AUTHORIZED"
            }
        }

