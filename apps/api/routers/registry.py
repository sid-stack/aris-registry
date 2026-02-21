from fastapi import APIRouter, Depends, HTTPException
from typing import List
from apps.api.database import db
from apps.api.models import Agent, AgentRegistration, AgentReputation, AgentHealth
import time
import os

router = APIRouter()

@router.post("/register")
async def register_agent(agent: AgentRegistration):
    """Register new agent with DID and capabilities"""
    database = db.get_db()
    
    # Check if agent exists
    existing = await database.agents.find_one({"did": agent.did})
    if existing:
        raise HTTPException(status_code=400, detail="Agent with this DID already registered")
        
    new_agent_data = agent.model_dump()
    new_agent_data["_id"] = agent.did
    new_agent_data["status"] = "active"
    new_agent_data["verified"] = False
    new_agent_data["reputation"] = AgentReputation().model_dump()
    new_agent_data["health"] = AgentHealth().model_dump()
    new_agent_data["created_at"] = time.time()
    new_agent_data["updated_at"] = time.time()
    
    await database.agents.insert_one(new_agent_data)
    
    return {"status": "success", "message": f"Agent {agent.name} registered"}

@router.get("/discover")
async def discover_agents(
    capability: str, 
    limit: int = 10,
    min_reputation: float = 0.0
):
    """Find agents by capability with reputation filtering"""
    database = db.get_db()
    
    # Needs index on capabilities
    cursor = database.agents.find({
        "status": "active",
        "capabilities": capability,
        "reputation.success_rate": {"$gte": min_reputation}
    }).sort("reputation.avg_rating", -1).limit(limit)
    
    agents = []
    async for doc in cursor:
        doc["id"] = doc.pop("_id", None)
        agents.append(doc)
        
    return {"agents": agents}

@router.post("/transactions/init")
async def init_transaction(
    from_did: str,
    to_did: str,
    capability: str,
    expiry_minutes: int = 5
):
    """Start transaction, issue JWT"""
    database = db.get_db()
    agent = await database.agents.find_one({"did": to_did})
    
    if not agent:
        raise HTTPException(status_code=404, detail="Target agent not found")
        
    if capability not in agent.get("capabilities", []):
        raise HTTPException(400, "Target agent does not support this capability")
        
    # In a real system, you would grab keys securely
    private_key = os.getenv("ARIS_PRIVATE_KEY", "mock_private_key")
    public_key = os.getenv("ARIS_PUBLIC_KEY", "mock_public_key")
    
    from apps.api.auth import AgentJWTHandler
    
    handler = AgentJWTHandler(private_key, public_key)
    token = handler.create_agent_token(
        from_did=from_did,
        to_did=to_did,
        capability=capability,
        expiry=expiry_minutes * 60
    )
    
    return {
        "status": "success",
        "token": token,
        "expires_in": expiry_minutes * 60
    }

@router.get("/", response_model=List[dict])
async def get_registry():
    database = db.get_db()
    cursor = database.agents.find({"status": "active"})
    agents = []
    async for doc in cursor:
        doc["id"] = doc.pop("_id", None)
        agents.append(doc)
    
    # If DB is empty, return a fallback mock
    if not agents:
        return [
            {
                "id": "agent_1",
                "name": "Legal Review Bot",
                "description": "Analyzes contracts for risks.",
                "price": 1.00,
                "category": "legal",
                "provider": "Mock",
                "capabilities": ["text.analyze.legal"]
            }
        ]
        
    return agents
