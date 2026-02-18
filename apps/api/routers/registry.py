from fastapi import APIRouter, Depends
from typing import List
from apps.api.database import db
from apps.api.models import Agent

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_registry():
    database = db.get_db()
    cursor = database.agents.find({"status": "active"})
    agents = []
    async for doc in cursor:
        agents.append(doc)
    
    # If DB is empty, return a fallback mock (though we just seeded)
    if not agents:
        return [
            {
                "id": "agent_1",
                "name": "Legal Review Bot",
                "description": "Analyzes contracts for risks.",
                "price": 1.00,
                "category": "legal"
            },
            {
                "id": "agent_2",
                "name": "RFP Analyzer",
                "description": "Extracts requirements from RFPs.",
                "price": 1.50,
                "category": "procurement"
            }
        ]
        
    return agents
