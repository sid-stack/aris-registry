from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
import time

class User(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
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
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    amount: float
    description: str
    timestamp: float = Field(default_factory=time.time)
    
    class Config:
        populate_by_name = True

class AnalysisResult(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    filename: str
    content_summary: str
    ai_analysis: str
    timestamp: float = Field(default_factory=time.time)

    class Config:
        populate_by_name = True
