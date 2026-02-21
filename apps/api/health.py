import asyncio
import aiohttp
import time
from datetime import datetime
from apps.api.database import db

async def health_check_loop():
    """Run every minute to check agent health and update DB"""
    while True:
        try:
            database = db.get_db()
            agents = await database.agents.find({"status": "active"}).to_list(length=100)
            
            for agent in agents:
                endpoint = agent.get("endpoint")
                if not endpoint:
                    continue
                    
                did = agent.get("did")
                try:
                    async with aiohttp.ClientSession() as session:
                        start_time = time.time()
                        # Appending /health to basic endpoint
                        health_url = f"{endpoint}/health" if not endpoint.endswith("/") else f"{endpoint}health"
                        
                        async with session.get(health_url, timeout=5) as resp:
                            latency = (time.time() - start_time) * 1000
                            if resp.status == 200:
                                await database.agents.update_one(
                                    {"did": did},
                                    {"$set": {
                                        "health.status": "healthy",
                                        "health.latency_ms": latency,
                                        "health.last_check": time.time()
                                    }}
                                )
                            else:
                                await database.agents.update_one(
                                    {"did": did},
                                    {"$set": {"health.status": "unhealthy"}}
                                )
                except Exception as e:
                    # Connection error or timeout
                    await database.agents.update_one(
                        {"did": did},
                        {"$set": {"health.status": "unhealthy"}}
                    )
                    
        except Exception as e:
            print(f"Health check loop encountered an error: {e}")
            
        # Poll every 60 seconds
        await asyncio.sleep(60)
