import asyncio
import os
import sys
import random
import secrets
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# specific logic to find the root folder
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR.parent / ".env"
load_dotenv(dotenv_path=env_path)

MONGO_URI = os.getenv("MONGODB_URI")

# Strict validation check
if not MONGO_URI or "localhost" in MONGO_URI:
    raise ValueError("CRITICAL: MONGODB_URI is missing or set to localhost! Please check your .env file.")

# Pass correct URI into client, adding tls=True if needed
kwargs = {}
if "mongodb+srv" in MONGO_URI:
    kwargs["tls"] = True

client = AsyncIOMotorClient(MONGO_URI, **kwargs)
db = client.aris_registry
agents_collection = db.agents

AGENTS_DATA = [
    {
        "name": "GitHub Repo Master",
        "capabilities": ["dev.git.manage", "dev.code.review"],
        "endpoint": "http://localhost:8001/manage",
        "status": "live"
    },
    {
        "name": "Gov RFP Bidder",
        "capabilities": ["gov.rfp.bidder", "gov.compliance.check"],
        "endpoint": "http://localhost:8002/bid",
        "status": "live"
    },
    {
        "name": "DeFi Arbitrage Node",
        "capabilities": ["fin.defi.trade", "fin.market.analyze"],
        "endpoint": "http://localhost:8003/trade",
        "status": "live"
    },
    {
        "name": "Linear Task Automator",
        "capabilities": ["prod.linear.manage", "prod.scrum.master"],
        "endpoint": "http://localhost:8004/tasks",
        "status": "live"
    },
    {
        "name": "AWS Infra Scout",
        "capabilities": ["cloud.aws.monitor", "cloud.cost.optimize"],
        "endpoint": "http://localhost:8005/scout",
        "status": "live"
    },
    {
        "name": "Discord Comm Manager",
        "capabilities": ["social.discord.moderate", "social.community.response"],
        "endpoint": "http://localhost:8006/chat",
        "status": "live"
    },
    {
        "name": "Solana Validator Proxy",
        "capabilities": ["chain.solana.validate", "chain.tx.sign"],
        "endpoint": "http://localhost:8007/sign",
        "status": "live"
    },
    {
        "name": "Design System Guard",
        "capabilities": ["design.figma.audit", "dev.css.lint"],
        "endpoint": "http://localhost:8008/audit",
        "status": "live"
    },
    {
        "name": "Notion Knowledge Base",
        "capabilities": ["knowledge.notion.sync", "knowledge.search"],
        "endpoint": "http://localhost:8009/sync",
        "status": "live"
    },
    {
        "name": "Vercel Deployment Bot",
        "capabilities": ["devops.vercel.deploy", "devops.ci.monitor"],
        "endpoint": "http://localhost:8010/deploy",
        "status": "live"
    }
]

async def seed_agents():
    print(f"\033[94mChecking database connection...\033[0m")
    
    # Check connection
    try:
        await client.server_info()
    except Exception as e:
        print(f"\033[91mFailed to connect to MongoDB: {e}\033[0m")
        return

    print(f"\033[93mClearing existing agents...\033[0m")
    await agents_collection.delete_many({})

    print(f"\033[96mSeeding {len(AGENTS_DATA)} agents...\033[0m")
    
    agent_docs = []
    for agent in AGENTS_DATA:
        did = f"did:aris:agent:{secrets.token_hex(4)}"
        agent_docs.append({
            "did": did,
            "name": agent["name"],
            "capabilities": agent["capabilities"],
            "endpoint": agent["endpoint"],
            "status": agent["status"]
        })

    if agent_docs:
        await agents_collection.insert_many(agent_docs)

    print(f"\033[92m✨ Success! 10 Agents successfully injected into Aris Registry.\033[0m")
    print(f"\033[90mRefresh your dashboard to see them live.\033[0m")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_agents())
