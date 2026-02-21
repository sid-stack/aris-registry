import pytest
import sys
import os
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from apps.api.main import app
from apps.api.database import db
from apps.api.main import app
from apps.api.database import db

client = TestClient(app, base_url="http://127.0.0.1:8000")

# We use autouse fixtures or direct imports in tests for isolation in deeper test suites
# This is a functional smoke test assuming db is mockable or isolated

def test_registry_missing_fields_fail():
    """Verify validation layers are strict on MVP schemas"""
    response = client.post("/api/registry/register", json={
        "did": "did:aris:test001",
        "name": "Test Agent"
        # Missing payload parameters
    })
    # FastAPI automatically rejects schema mismatches with 422
    assert response.status_code == 422 

def test_health_check():
    """Verify the primary API is alive"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    
# def test_mcp_sse_exposed():
#     """Verify the FastMCP server is mounted and exposed"""
#     # Added Host: 127.0.0.1:8000 to avoid FastMCP's DNS rebinding transport security checks
#     # Using stream() to avoid blocking indefinitely on the continuous SSE stream
#     # with client.stream("GET", "/mcp/sse", headers={"Host": "127.0.0.1:8000"}) as response:
#         # Normally returns 200 with text/event-stream, or 405 depending on framework mount
#         # assert response.status_code in [200, 405]
