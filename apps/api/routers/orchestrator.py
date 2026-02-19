from fastapi import APIRouter
import time
from apps.api.database import redis_client

router = APIRouter()

@router.get("/status")
async def get_orchestrator_status():
    if not redis_client.client:
        return {"status": "Error", "detail": "Redis not connected"}

    last_patrol_time = await redis_client.client.get("orchestrator:last_patrol")
    agent_count = await redis_client.client.get("orchestrator:agent_count")
    
    return {
        "status": "Active",
        "role": "Lead Orchestrator",
        "policy": "No Idle Policy Enforced",
        "last_patrol": last_patrol_time or "Never",
        "agents_monitored": int(agent_count) if agent_count else 0,
        "llm_config": {
            "primary": "gemini-1.5-pro",
            "fallback": "gemini-1.5-flash",
            "condition": "on_quota_exceeded"
        }
    }

@router.post("/update")
async def update_status(count: int, timestamp: str):
    if not redis_client.client:
        return {"status": "Error", "detail": "Redis not connected"}

    # Use pipeline for atomic update if needed, but simple set is fine here
    await redis_client.client.set("orchestrator:last_patrol", timestamp)
    await redis_client.client.set("orchestrator:agent_count", count)
    
    return {"status": "updated"}
