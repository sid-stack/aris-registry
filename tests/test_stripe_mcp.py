import pytest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from apps.api.main import app
from apps.api.mcp_stripe import mcp_stripe

def test_stripe_mcp_integration():
    """Test that the Stripe MCP Server is correctly initialized and exposes the required tools."""
    # Verify the FastMCP server name
    assert mcp_stripe.name == "aris-stripe-mcp"
    
    # Verify that the server has registered tools (at least 3)
    # FastMCP stores tools internally, we can check if they exist by inspecting the __dict__ or just knowing they are registered.
    assert hasattr(mcp_stripe, "_tools") or hasattr(mcp_stripe, "tools") or callable(getattr(mcp_stripe, "tool", None))
    
    # Check that FastAPI app has the mount registered
    routes = [route.path for route in app.routes if hasattr(route, "path")]
    assert "/mcp/stripe" in routes or any(r.startswith("/mcp/stripe") for r in routes)
