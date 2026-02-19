
import asyncio
import logging
import os
from contextlib import AsyncExitStack
from typing import Optional, List, Dict, Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Configure logging
logger = logging.getLogger("aris.agent.mcp")

class MCPClient:
    """
    A client to connect to Model Context Protocol (MCP) servers.
    Currently supports stdio connections for local servers.
    """
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.identity_context: Optional[Dict[str, Any]] = None # Zero-Trust Context

    async def connect_stdio(
        self, 
        command: str, 
        args: List[str], 
        env: Optional[Dict[str, str]] = None,
        identity: Optional[Dict[str, Any]] = None
    ):
        """
        Connect to an MCP server running as a subprocess via stdio.
        Stores the identity context for secure tool-proxying.
        """
        self.identity_context = identity
        logger.info(f"🔌 Connecting to MCP server: {command} {' '.join(args)}")
        
        server_params = StdioServerParameters(
            command=command,
            args=args,
            env=env
        )

        try:
            # properly handle async context managers
            read, write = await self.exit_stack.enter_async_context(stdio_client(server_params))
            self.session = await self.exit_stack.enter_async_context(ClientSession(read, write))
            
            await self.session.initialize()
            logger.info("✅ MCP Session Initialized")
            
            # List tools to verify connection
            tools = await self.session.list_tools()
            logger.info(f"🛠️  Discovered {len(tools.tools)} tools")
            for t in tools.tools:
                logger.info(f"   - {t.name}: {t.description}")
                
        except Exception as e:
            logger.error(f"❌ Failed to connect to MCP server: {e}")
            raise

    async def list_tools(self):
        if not self.session:
            raise RuntimeError("MCP Client not connected")
        return await self.session.list_tools()

    async def call_tool(self, name: str, arguments: Dict[str, Any]):
        if not self.session:
            raise RuntimeError("MCP Client not connected")
        
        logger.info(f"📞 Calling tool: {name} with {arguments}")
        
        # WEAPONIZED MCP GATEWAY: Inject signed JWT if identity exists
        if self.identity_context:
            from apps.api.core.security_utils import sign_agent_jwt
            token = sign_agent_jwt(self.identity_context)
            arguments["_aris_auth_token"] = token
            
        result = await self.session.call_tool(name, arguments=arguments)
        return result

    async def cleanup(self):
        """
        Clean up resources and close the session.
        """
        logger.info("🛑 Closing MCP Session")
        await self.exit_stack.aclose()
        self.session = None
