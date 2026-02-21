import asyncio
import httpx
import os

async def register_bidsmith_agents():
    """Register all BidSmith specialized agents in Aris network"""
    
    agents = [
        {
            "did": "did:aris:bidsmith-analyzer-v1",
            "name": "RFP Analyzer Pro",
            "description": "Analyzes government RFP documents to extract key opportunities and win themes",
            "capabilities": ["rfp.analyze", "text.analyze.government"],
            "endpoint": "http://bidsmith-analyzer:8001",
            "provider": "BidSmith",
            "pricing": {"amount": 0.05, "currency": "USD", "model": "per_token"}
        },
        {
            "did": "did:aris:bidsmith-extractor-v1",
            "name": "Requirements Extractor",
            "description": "Extracts mandatory and desired requirements from RFP documents",
            "capabilities": ["rfp.extract.requirements", "text.extract"],
            "endpoint": "http://bidsmith-extractor:8002",
            "provider": "BidSmith",
            "pricing": {"amount": 0.03, "currency": "USD", "model": "per_token"}
        },
        {
            "did": "did:aris:bidsmith-writer-v1",
            "name": "Proposal Writer",
            "description": "Writes compelling proposal sections based on RFP requirements",
            "capabilities": ["proposal.write", "text.generate"],
            "endpoint": "http://bidsmith-writer:8003",
            "provider": "BidSmith",
            "pricing": {"amount": 0.08, "currency": "USD", "model": "per_token"}
        },
        {
            "did": "did:aris:bidsmith-pricing-v1",
            "name": "Pricing Strategist",
            "description": "Develops competitive pricing strategies for government contracts",
            "capabilities": ["pricing.strategy", "financial.analyze"],
            "endpoint": "http://bidsmith-pricing:8004",
            "provider": "BidSmith",
            "pricing": {"amount": 0.06, "currency": "USD", "model": "per_token"}
        },
        {
            "did": "did:aris:bidsmith-compliance-v1",
            "name": "Compliance Checker",
            "description": "Ensures proposals meet all government compliance requirements",
            "capabilities": ["compliance.check", "regulation.analyze"],
            "endpoint": "http://bidsmith-compliance:8005",
            "provider": "BidSmith",
            "pricing": {"amount": 0.04, "currency": "USD", "model": "per_token"}
        },
        {
            "did": "did:aris:bidsmith-past-perf-v1",
            "name": "Past Performance Analyzer",
            "description": "Analyzes past performance to highlight relevant experience",
            "capabilities": ["performance.analyze", "text.summarize"],
            "endpoint": "http://bidsmith-past-perf:8006",
            "provider": "BidSmith",
            "pricing": {"amount": 0.04, "currency": "USD", "model": "per_token"}
        },
        {
            "did": "did:aris:bidsmith-tech-v1",
            "name": "Technical Writer",
            "description": "Writes technical approach and methodology sections",
            "capabilities": ["technical.write", "text.generate.technical"],
            "endpoint": "http://bidsmith-tech:8007",
            "provider": "BidSmith",
            "pricing": {"amount": 0.07, "currency": "USD", "model": "per_token"}
        },
        {
            "did": "did:aris:bidsmith-exec-v1",
            "name": "Executive Summary Writer",
            "description": "Creates compelling executive summaries that win",
            "capabilities": ["executive.summarize", "text.summarize"],
            "endpoint": "http://bidsmith-exec:8008",
            "provider": "BidSmith",
            "pricing": {"amount": 0.05, "currency": "USD", "model": "per_token"}
        }
    ]
    
    async with httpx.AsyncClient() as client:
        for agent in agents:
            print(f"Registering {agent['name']}...")
            try:
                response = await client.post(
                    "http://localhost:8000/api/registry/register",
                    json=agent
                )
                if response.status_code == 200:
                    print(f"✅ {agent['name']} registered")
                else:
                    print(f"❌ Failed: {response.text}")
            except Exception as e:
                print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(register_bidsmith_agents())
