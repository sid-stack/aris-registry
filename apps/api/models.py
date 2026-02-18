from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
import time

class User(BaseModel):
    id: str = Field(..., alias="_id")
    email: Optional[str] = None
    clerk_id: str
    credits_balance: float = 0.0
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

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

class Agent(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: str
    price: float
    category: str
    provider: str
    capability: str
    status: str = "active"

    class Config:
        populate_by_name = True

