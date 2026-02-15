from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import time

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    api_key: Optional[str] = None
    hashed_api_key: Optional[str] = None
    credits_balance: float = 0.0
    stripe_customer_id: Optional[str] = None
    role: str = "customer"  # 'customer', 'admin'
    
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
