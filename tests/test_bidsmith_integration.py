import pytest
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from apps.api.main import app

def test_bidsmith_conversation_flow():
    """Test complete BidSmith conversation flow"""
    # Needs mock token verification in auth since the endpoint is secured.
    from apps.api.models import User
    from apps.api.dependencies import get_current_user
    
    app.dependency_overrides[get_current_user] = lambda: User(
        id="test-user-id", clerk_id="test-clerk-id", email="test@test.com", created_at=0.0
    )
    
    # Disable transport security checks for test environment
    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        # 1. Create conversation
        response = client.post(
            "/api/bidsmith/conversations",
            headers={"Authorization": "Bearer test-token"},
            json={"title": "Test RFP", "rfp_id": None}
        )
        assert response.status_code == 200, f"Error: {response.text}"
        conv_id = response.json()["id"]
        
        # 2. Upload test RFP (mocking pdf file correctly)
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
            f.write(b"dummy pdf content")
            f.seek(0)
            response = client.post(
                f"/api/bidsmith/conversations/{conv_id}/upload-rfp",
                headers={"Authorization": "Bearer test-token"},
                files={"file": ("sample-rfp.pdf", f, "application/pdf")}
            )
        assert response.status_code == 200
        
        # 3. Test chat
        response = client.post(
            f"/api/bidsmith/conversations/{conv_id}/chat",
            headers={"Authorization": "Bearer test-token"},
            json={"message": "What are the key requirements?"}
        )
        assert response.status_code == 200
        assert "response" in response.json()
        
    # Cleanup overrides
    app.dependency_overrides.clear()
