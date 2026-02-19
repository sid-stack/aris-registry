import asyncio
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from apps.api.routers.checkout import finalize_proposal

class TestAtomicDelivery(unittest.IsolatedAsyncioTestCase):
    
    @patch('apps.api.routers.checkout.upload_to_cloud')
    @patch('apps.api.routers.checkout.db.get_db')
    @patch('stripe.PaymentIntent.capture')
    @patch('stripe.PaymentIntent.cancel')
    async def test_successful_delivery(self, mock_cancel, mock_capture, mock_db, mock_upload):
        # Setup mocks
        mock_upload.return_value = "https://example.com/proposal.pdf"
        mock_proposals = MagicMock()
        mock_db.return_value.proposals = mock_proposals
        
        # Execute
        result = await finalize_proposal("pi_123", "Test Proposal", "user_123")
        
        # Assertions
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["pdf_url"], "https://example.com/proposal.pdf")
        mock_capture.assert_called_once_with("pi_123")
        mock_proposals.update_one.assert_called_once()
        mock_cancel.assert_not_called()

    @patch('apps.api.routers.checkout.upload_to_cloud')
    @patch('apps.api.routers.checkout.db.get_db')
    @patch('stripe.PaymentIntent.cancel')
    async def test_failed_delivery_triggers_cancel(self, mock_cancel, mock_db, mock_upload):
        # Setup mocks to fail during upload
        mock_upload.side_effect = Exception("Storage Error")
        mock_proposals = MagicMock()
        mock_db.return_value.proposals = mock_proposals
        
        # Execute (expecting HTTPException)
        from fastapi import HTTPException
        with self.assertRaises(HTTPException):
            await finalize_proposal("pi_123", "Test Proposal", "user_123")
        
        # Assertions
        mock_cancel.assert_called_once_with("pi_123")
        # Ensure status was updated to CANCELLED_ERROR
        args, kwargs = mock_proposals.update_one.call_args_list[0]
        self.assertEqual(args[1]["$set"]["status"], "CANCELLED_ERROR")

if __name__ == "__main__":
    unittest.main()
