import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "aris_registry"

GOLD_11_AGENTS = [
    {"name": "Legal Review Bot", "desc": "Analyzes contracts for risks.", "price": 1.00, "cat": "legal", "provider": "Aris", "cap": "legal.review"},
    {"name": "RFP Analyzer", "desc": "Extracts requirements from RFPs.", "price": 1.50, "cat": "procurement", "provider": "Aris", "cap": "procurement.analyze"},
    {"name": "Pricing Strategist", "desc": "Optimizes bid pricing based on market data.", "price": 2.99, "cat": "finance", "provider": "Aris", "cap": "fin.bid.price"},
    {"name": "Compliance Auditor", "desc": "Checks proposals against FAR clauses.", "price": 1.00, "cat": "compliance", "provider": "Aris", "cap": "gov.compliance.check"},
    {"name": "Tavily Search", "desc": "Real-time web research for bid context.", "price": 0.50, "cat": "search", "provider": "Tavily", "cap": "web.search.realtime"},
    {"name": "GitHub Master", "desc": "Manages technical repo artifacts for bids.", "price": 0.99, "cat": "dev", "provider": "GitHub", "cap": "dev.git.manage"},
    {"name": "Stripe Billing", "desc": "Handles payment processing and credits.", "price": 0.00, "cat": "fin", "provider": "Stripe", "cap": "fin.pay.billing"},
    {"name": "Aris Metadata", "desc": "High-performance metadata store for bid artifacts.", "price": 0.99, "cat": "data", "provider": "Aris", "cap": "data.metadata.store"},
    {"name": "Mem0 Memory", "desc": "Long-term memory for agent sessions.", "price": 0.99, "cat": "memory", "provider": "Mem0", "cap": "agent.memory.session"},
    {"name": "Linear PM", "desc": "Project management for bid teams.", "price": 0.99, "cat": "pm", "provider": "Linear", "cap": "dev.pm.linear"},
    {"name": "Slack Bot", "desc": "Notifies team of bid updates.", "price": 0.50, "cat": "comms", "provider": "Slack", "cap": "comms.chat.slack"},
]

async def seed():
    if not MONGODB_URI:
        print("❌ MONGODB_URI not found")
        return

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print(f"🚀 Seeding {len(GOLD_11_AGENTS)} Agents into MongoDB...")
    
    # We use name as a simple unique key for seeding, or just clear
    await db.agents.delete_many({}) # Clear existing
    
    for agent in GOLD_11_AGENTS:
        agent_doc = {
            "_id": agent['name'].lower().replace(" ", "_"),
            "name": agent['name'],
            "description": agent['desc'],
            "price": agent['price'],
            "category": agent['cat'],
            "provider": agent['provider'],
            "capability": agent['cap'],
            "status": "active"
        }
        await db.agents.insert_one(agent_doc)
        print(f"✅ Seeded: {agent['name']}")

    print("🎉 Seeding Complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
