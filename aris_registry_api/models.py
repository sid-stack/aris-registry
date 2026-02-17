from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import time

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    api_key: Optional[str] = None
    hashed_api_key: Optional[str] = None
    password_hash: Optional[str] = None  # New field for auth
    credits_balance: float = 0.0
    stripe_customer_id: Optional[str] = None
    role: str = "customer"  # 'customer', 'admin'
    
    # Freemium Tier Fields
    free_reports_remaining: int = 5
    is_paid_user: bool = False
    total_reports_generated: int = 0
    
    # Security Context
    allowed_origins: List[str] = []
    allowed_ips: List[str] = []
    
    # Metadata
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "email": "customer@example.com",
                "credits_balance": 10.0,
                "stripe_customer_id": "cus_12345"
            }
        }

class Transaction(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    provider_did: str
    capability: str
    amount: float
    status: str = "success"
    timestamp: float = Field(default_factory=time.time)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "tx_1234567890",
                "user_id": "user_123",
                "provider_did": "did:aris:agent:123",
                "capability": "ai.generate",
                "amount": 0.10,
                "status": "success",
                "timestamp": 1700000000.0
            }
        }
