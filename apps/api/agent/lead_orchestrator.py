import asyncio
import httpx
import logging
import os
import time
from typing import List, Dict, Any
from apps.api.core.llm_utils import call_gemini_with_fallback

logger = logging.getLogger("aris.orchestrator")
logging.basicConfig(level=logging.INFO)

class LeadOrchestrator:
    """
    The Lead Orchestrator ensures all agents in the Aris ecosystem are active,
    monitored, and optimized. It implements the 'No Idle' policy.
    """
    def __init__(self, registry_url: str = "http://localhost:8000/api/registry/"):
        self.registry_url = registry_url
        self.active_agents = []

    async def patrol(self):
        """
        Scan the registry and check agent health.
        """
        logger.info("🔍 Lead Orchestrator starting patrol...")
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                resp = await client.get(self.registry_url)
                if resp.status_code == 200:
                    self.active_agents = resp.json()
                    logger.info(f"✅ Found {len(self.active_agents)} agents in registry.")
                else:
                    logger.error(f"❌ Failed to fetch registry: {resp.status_code}")
                    return
            except Exception as e:
                logger.error(f"❌ Registry connection error: {e}")
                return

        tasks = [self._check_agent_status(agent) for agent in self.active_agents]
        await asyncio.gather(*tasks)
        
        # Report status back to API
        try:
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            async with httpx.AsyncClient() as client:
                await client.post(
                    "http://localhost:8000/api/orchestrator/update",
                    params={"count": len(self.active_agents), "timestamp": timestamp}
                )
        except Exception as e:
            logger.error(f"❌ Failed to report status: {e}")

    async def _check_agent_status(self, agent: Dict[str, Any]):
        """
        Checks if an agent is responsive and gives it a warm-up task if idle.
        """
        agent_id = agent.get("id") or agent.get("did")
        name = agent.get("name")
        endpoint = agent.get("endpoint")

        if not endpoint:
            logger.warning(f"⚠️ Agent {name} ({agent_id}) has no endpoint. Skipping.")
            return

        logger.info(f"📡 Pinging {name} at {endpoint}...")
        async with httpx.AsyncClient() as client:
            try:
                # Check /bid or /generate depending on type
                ping_resp = await client.post(f"{endpoint}/bid", json={"requirements": "healthcheck"}, timeout=5.0)
                if ping_resp.status_code == 200:
                    logger.info(f"🟢 Agent {name} is active and ready.")
                else:
                    logger.warning(f"🟡 Agent {name} responded with {ping_resp.status_code}.")
            except Exception as e:
                logger.error(f"🔴 Agent {name} is unreachable: {e}")

    async def optimize_workload(self, task_description: str):
        """
        Uses Gemini (Pro -> Flash fallback) to decide how to break down a task.
        """
        prompt = f"Lead Orchestrator: Decision required. Task: {task_description}. " \
                 f"Available agents: {[a['name'] for a in self.active_agents]}. " \
                 f"How should I distribute this work for maximum efficiency?"
        
        decision = await call_gemini_with_fallback(prompt)
        logger.info(f"🧠 Orchestration Decision: {decision}")
        return decision

async def run_orchestration_loop():
    orchestrator = LeadOrchestrator()
    while True:
        await orchestrator.patrol()
        await asyncio.sleep(60) # Patrol every minute

if __name__ == "__main__":
    asyncio.run(run_orchestration_loop())
