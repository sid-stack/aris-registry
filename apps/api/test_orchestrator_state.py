import pytest
import sys
import os
from unittest.mock import MagicMock, AsyncMock, patch

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from apps.api.routers.orchestrator import update_status, get_orchestrator_status

@pytest.mark.asyncio
async def test_orchestrator_redis_flow():
    # Mock the Redis client in apps.api.database
    with patch('apps.api.routers.orchestrator.redis_client') as mock_redis_wrapper:
        # Setup the mock client
        mock_client = AsyncMock()
        mock_redis_wrapper.client = mock_client
        
        # Test Update
        await update_status(5, "2023-10-27T10:00:00Z")
        
        # Verify calls
        mock_client.set.assert_any_call("orchestrator:last_patrol", "2023-10-27T10:00:00Z")
        mock_client.set.assert_any_call("orchestrator:agent_count", 5)
        
        # Test Get Status (Mock return values)
        mock_client.get.side_effect = lambda key: "2023-10-27T10:00:00Z" if key == "orchestrator:last_patrol" else "5"
        
        status = await get_orchestrator_status()
        
        assert status["last_patrol"] == "2023-10-27T10:00:00Z"
        assert status["agents_monitored"] == 5
