import asyncio
import redis.asyncio as redis
import os
import secrets

# CONNECT TO REDIS
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
r = redis.from_url(REDIS_URL, decode_responses=True)

GOLD_11_AGENTS = [
    {"name": "GitHub Master", "cap": "dev.git.manage", "provider": "GitHub"},
    {"name": "Stripe Billing", "cap": "fin.pay.billing", "provider": "Stripe"},
    {"name": "Tavily Search", "cap": "web.search.realtime", "provider": "Tavily"},
    {"name": "Supabase DB", "cap": "data.sql.postgres", "provider": "Supabase"},
    {"name": "Mem0 Memory", "cap": "agent.memory.session", "provider": "Mem0"},
    {"name": "Linear PM", "cap": "dev.pm.linear", "provider": "Linear"},
    {"name": "Slack Bot", "cap": "comms.chat.slack", "provider": "Slack"},
    {"name": "Notion Wiki", "cap": "data.wiki.notion", "provider": "Notion"},
    {"name": "Vercel Deploy", "cap": "dev.ops.vercel", "provider": "Vercel"},
    {"name": "OpenAI LLM", "cap": "ai.generate.text", "provider": "OpenAI"},
    # The New Addition:
    {"name": "RFP Bidder A", "cap": "gov.rfp.bidder", "provider": "ArisGov"},
    {"name": "RFP Bidder B", "cap": "gov.rfp.bidder", "provider": "ArisGov"}, 
]

async def seed():
    print("🚀 Seeding Gold 11 Agents into Aris Registry (Redis Async)...")
    
    # Optional: Clear existing for fresh state
    # await r.flushdb() 
    
    for i, agent in enumerate(GOLD_11_AGENTS):
        did = f"did:aris:agent:{secrets.token_hex(4)}"
        endpoint = f"http://localhost:900{i+1}" # Fake endpoints for now
        
        # 1. Store Agent Metadata
        await r.hset(f"agent:{did}", mapping={
            "name": agent['name'],
            "provider": agent['provider'],
            "endpoint": endpoint,
            "status": "active"
        })
        
        # 2. Index by Capability
        await r.sadd(f"idx:{agent['cap']}", did)
        
        print(f"✅ Registered: {agent['name']} [{agent['cap']}] -> {did}")

    print("\n🎉 Seeding Complete. The Registry is Live.")

if __name__ == "__main__":
    asyncio.run(seed())
