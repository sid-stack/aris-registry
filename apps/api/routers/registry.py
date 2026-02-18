from fastapi import APIRouter
from typing import List

# Mock data or integration with aris-sdk if available
# For MVP, we can return static list or call aris-sdk if installed

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_registry():
    # Placeholder for aris-sdk integration
    # from aris_sdk import Registry
    # return Registry.list_agents()
    
    return [
        {
            "id": "agent_1",
            "name": "Legal Review Bot",
            "description": "Analyzes contracts for risks.",
            "price": 0.99,
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
