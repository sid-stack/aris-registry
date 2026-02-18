from fastapi import APIRouter
import time

router = APIRouter()

# Simple shared state for demo purposes
# In a real system, this would come from a database or Redis
last_patrol_time = None
agent_count = 0

@router.get("/status")
async def get_orchestrator_status():
    global last_patrol_time, agent_count
    return {
        "status": "Active",
        "role": "Lead Orchestrator",
        "policy": "No Idle Policy Enforced",
        "last_patrol": last_patrol_time or "Never",
        "agents_monitored": agent_count,
        "llm_config": {
            "primary": "gemini-1.5-pro",
            "fallback": "gemini-1.5-flash",
            "condition": "on_quota_exceeded"
        }
    }

@router.post("/update")
async def update_status(count: int, timestamp: str):
    global last_patrol_time, agent_count
    last_patrol_time = timestamp
    agent_count = count
    return {"status": "updated"}

def update_orchestrator_metrics(count: int):
    global last_patrol_time, agent_count
    last_patrol_time = time.strftime("%Y-%m-%d %H:%M:%S")
    agent_count = count
