import asyncio
import os
import sys
import unittest
import time
from unittest.mock import MagicMock, patch

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from apps.api.routers.cron import release_stale_holds

class TestDeadMansSwitch(unittest.IsolatedAsyncioTestCase):
    
    @patch('apps.api.routers.cron.db.get_db')
    @patch('stripe.PaymentIntent.cancel')
    async def test_cleanup_stale_holds(self, mock_cancel, mock_db):
        # Setup mocks
        mock_proposals_coll = MagicMock()
        mock_db.return_value.proposals = mock_proposals_coll
        
        # Mock finding stale proposals
        stale_list = [
            {"_id": "1", "intent_id": "pi_old_1", "status": "AUTHORIZED"},
            {"_id": "2", "intent_id": "pi_old_2", "status": "AUTHORIZED"},
        ]
        
        # Mock motor's to_list
        mock_cursor = MagicMock()
        mock_cursor.to_list = MagicMock(return_value=asyncio.Future())
        mock_cursor.to_list.return_value.set_result(stale_list)
        mock_proposals_coll.find.return_value = mock_cursor
        
        # Execute
        result = await release_stale_holds(authenticated=True)
        
        # Assertions
        self.assertEqual(result["released_count"], 2)
        self.assertEqual(mock_cancel.call_count, 2)
        self.assertEqual(mock_proposals_coll.update_one.call_count, 2)
        
        # Check if status was updated correctly
        args, kwargs = mock_proposals_coll.update_one.call_args
        self.assertEqual(kwargs["$set"]["status"], "CANCELLED_TIMEOUT")

if __name__ == "__main__":
    unittest.main()
