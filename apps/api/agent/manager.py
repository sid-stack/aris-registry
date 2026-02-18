
import asyncio
import logging
from typing import Optional, Dict, Any, List

from apps.api.agent.mcp_client import MCPClient
from apps.api.agent.tools.firecrawl_tool import FirecrawlTool

logger = logging.getLogger("aris.agent.manager")

class AgentManager:
    """
    Manages the lifecycle of the agent's tools and connections.
    Includes MCP clients and local tools like Firecrawl.
    """
    def __init__(self):
        self.mcp_client = MCPClient()
        self.firecrawl = FirecrawlTool()
        self.is_initialized = False

    async def initialize(self, mcp_server_command: Optional[List[str]] = None):
        """
        Initialize the agent manager.
        Optionally connects to an MCP server if a command is provided.
        """
        if self.is_initialized:
            return

        logger.info("🤖 Initializing Agent Manager...")

        # Initialize MCP if a server is configured
        if mcp_server_command:
            cmd = mcp_server_command[0]
            args = mcp_server_command[1:]
            try:
                await self.mcp_client.connect_stdio(cmd, args)
            except Exception as e:
                logger.error(f"⚠️  Could not connect to MCP server: {e}")
        
        self.is_initialized = True

    async def shutdown(self):
        """
        Cleanup and shutdown.
        """
        await self.mcp_client.cleanup()
        logger.info("💤 Agent Manager shut down")

    async def execute_task(self, task_description: str):
        """
        Placeholder for executing a task using the available tools.
        Real implementation would use an LLM to decide which tool to call.
        """
        logger.info(f"🚀 Received task: {task_description}")
        return {"status": "Task execution not implemented yet. Tools are ready."}

    # --- Tool Accessors ---

    async def list_available_tools(self) -> List[Dict[str, Any]]:
        tools = []
        
        # Add Firecrawl if available
        if self.firecrawl.app:
            tools.append({
                "name": "firecrawl_scrape",
                "description": "Scrape a web page and return markdown content.",
                "parameters": {"type": "object", "properties": {"url": {"type": "string"}}}
            })
            tools.append({
                "name": "firecrawl_crawl",
                "description": "Crawl a website and extract content from multiple pages.",
                "parameters": {"type": "object", "properties": {"url": {"type": "string"}}}
            })

        # Add MCP tools
        if self.mcp_client.session:
            try:
                mcp_tools = await self.mcp_client.list_tools()
                for tool in mcp_tools.tools:
                    tools.append({
                        "name": f"mcp::{tool.name}",
                        "description": tool.description,
                        "parameters": tool.inputSchema
                    })
            except Exception as e:
                logger.error(f"⚠️  Failed to list MCP tools: {e}")

        return tools

# Global Singleton
agent_manager = AgentManager()
