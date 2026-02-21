import os
from mcp.server.fastmcp import FastMCP
from apps.api.database import db
from apps.api.auth import AgentJWTHandler

mcp = FastMCP("aris-registry")

@mcp.tool()
async def find_agent(
    capability: str,
    min_reputation: float = 0.7,
    caller_did: str = "did:aris:caller_default" # Typically from context
) -> dict:
    """MCP tool that agents can call to discover other agents"""
    
    database = db.get_db()
    
    # Find best agent
    agent = await database.agents.find_one({
        "status": "active",
        "capabilities": capability,
        "reputation.success_rate": {"$gte": min_reputation}
    }, sort=[("reputation.avg_rating", -1)])
    
    if not agent:
        return {"error": "No agent found"}
    
    private_key = os.getenv("ARIS_PRIVATE_KEY", "mock_private_key")
    public_key = os.getenv("ARIS_PUBLIC_KEY", "mock_public_key")
    
    handler = AgentJWTHandler(private_key, public_key)
    
    # Create session token
    token = handler.create_agent_token(
        from_did=caller_did, 
        to_did=agent["did"],
        capability=capability,
        expiry=300
    )
    
    return {
        "agent": {
            "did": agent["did"],
            "endpoint": agent["endpoint"],
            "public_key": agent["public_key"]
        },
        "token": token,
        "expires_in": 300
    }
