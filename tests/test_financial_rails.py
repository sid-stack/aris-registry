import pytest
import time
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.models import User
from apps.api.dependencies import get_current_user

# Setup simple mock user for dependency override
mock_user = User(
    _id="test_user_123",
    clerk_id="clerk_test_123",
    email="test@example.com",
    credits_balance=100.0
)

# Helpers
@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: mock_user
    return TestClient(app)

@pytest.fixture
def mock_db_fixture():
    with patch("apps.api.database.db.get_db") as mock_get_db:
        mock_db = MagicMock() # DB object itself is synchronous usually, or async client? 
        # In code: database = db.get_db(). getting it is sync.
        mock_get_db.return_value = mock_db
        
        # Mock collections
        # insert_one, update_one ARE async
        mock_db.proposals.insert_one = AsyncMock()
        mock_db.proposals.update_one = AsyncMock()
        mock_db.users.update_one = AsyncMock()
        mock_db.credit_transactions.insert_one = AsyncMock()
        
        # find is SYNCHRONOUS, returns a cursor
        mock_db.proposals.find = MagicMock()
        mock_db.credit_transactions.find_one = AsyncMock()
        mock_db.users.find_one = AsyncMock()
        mock_db.proposals.find_one = AsyncMock()
        
        yield mock_db

@pytest.fixture
def mock_stripe():
    with patch("stripe.PaymentIntent") as mock_pi:
        mock_pi.create = MagicMock()
        mock_pi.capture = MagicMock()
        mock_pi.cancel = MagicMock()
        yield mock_pi

@pytest.fixture
def mock_stripe_webhook():
    with patch("stripe.Webhook.construct_event") as mock_webhook:
        yield mock_webhook

@pytest.fixture
def mock_upload():
    with patch("apps.api.routers.checkout.upload_to_cloud", new_callable=AsyncMock) as mock_up:
        mock_up.return_value = "https://mock-storage.com/signed-url.pdf"
        yield mock_up

# ─────────────────────────────────────────────────────────────────────────────
# 1. TEST WEBHOOK STATUS UPDATE (amount_capturable_updated)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_webhook_amount_capturable_updated(client, mock_db_fixture, mock_stripe_webhook):
    """
    Mock construct_event and assert the database status updates to FUNDS_HELD.
    """
    # Payload simulating Stripe event
    mock_event = {
        'type': 'payment_intent.amount_capturable_updated',
        'data': {
            'object': {'id': 'pi_held_123'}
        }
    }
    mock_stripe_webhook.return_value = mock_event

    headers = {'stripe-signature': 'test_sig'}
    response = client.post("/api/checkout/webhook", json={}, headers=headers)

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # Assert DB update
    mock_db_fixture.proposals.update_one.assert_called_once()
    call_args = mock_db_fixture.proposals.update_one.call_args
    query, update = call_args[0]
    
    assert query == {"intent_id": "pi_held_123"}
    assert update["$set"]["status"] == "FUNDS_HELD"

# ─────────────────────────────────────────────────────────────────────────────
# 2. TEST ATOMIC DELIVERY SUCCESS (finalize_proposal)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_finalize_proposal_success(client, mock_db_fixture, mock_stripe, mock_upload):
    """
    Mock successful PDF upload/storage and assert stripe.PaymentIntent.capture is called exactly once.
    """
    # Setup: Mock proposal finding in DB
    mock_db_fixture.proposals.find_one.return_value = {
        "intent_id": "pi_success_123",
        "user_id": mock_user.id,
        "status": "AUTHORIZED"
    }

    intent_id = "pi_success_123"
    response = client.post(f"/api/checkout/finalize/{intent_id}?proposal_text=Valid+Job")

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["pdf_url"] == "https://mock-storage.com/signed-url.pdf"

    # Assert Capture
    mock_stripe.capture.assert_called_once_with(intent_id)

    # Assert DB Update to DELIVERED
    capture_update_call = mock_db_fixture.proposals.update_one.call_args
    # We might have multiple updates? optimize check.
    # In finalize_proposal code: one update call.
    query, update_doc = capture_update_call[0]
    assert query == {"intent_id": intent_id}
    assert update_doc["$set"]["status"] == "DELIVERED"
    assert update_doc["$set"]["pdf_url"] == "https://mock-storage.com/signed-url.pdf"

# ─────────────────────────────────────────────────────────────────────────────
# 3. TEST ATOMIC DELIVERY ROLLBACK (finalize_proposal failure)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_finalize_proposal_failure(client, mock_db_fixture, mock_stripe, mock_upload):
    """
    Mock an upload failure and assert stripe.PaymentIntent.cancel is called.
    """
    # Setup: Mock proposal finding
    mock_db_fixture.proposals.find_one.return_value = {
        "intent_id": "pi_fail_123",
        "user_id": mock_user.id,
        "status": "AUTHORIZED"
    }
    
    # Mock Upload Failure
    mock_upload.side_effect = Exception("S3 Service Unavailable")

    intent_id = "pi_fail_123"
    response = client.post(f"/api/checkout/finalize/{intent_id}?proposal_text=Fail+Job")

    # Expect 500 error
    assert response.status_code == 500
    assert "Delivery failure" in response.json()["detail"]

    # Assert NO capture
    mock_stripe.capture.assert_not_called()

    # Assert CANCEL (Rollback)
    mock_stripe.cancel.assert_called_once_with(intent_id)

    # Assert DB Update to CANCELLED_ERROR
    # Note: verify that DB update calls happened. 
    # Logic: update status -> CANCELLED_ERROR
    # Check the call args logic for 'CANCELLED_ERROR'
    calls = mock_db_fixture.proposals.update_one.call_args_list
    # Logic in code: await database.proposals.update_one(..., {"$set": {"status": "CANCELLED_ERROR"...}})
    
    found_cancel_update = False
    for call in calls:
        args, _ = call
        if "$set" in args[1] and args[1]["$set"].get("status") == "CANCELLED_ERROR":
            found_cancel_update = True
            break
            
    assert found_cancel_update, "Database should have been updated to CANCELLED_ERROR"

# ─────────────────────────────────────────────────────────────────────────────
# 4. TEST CRON TTL RELEASE (release_stale_holds)
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_cron_release_stale_holds(client, mock_db_fixture, mock_stripe):
    """
    Mock a DB record that is 73 hours old and assert cancellation.
    """
    # Cron needs authentication via header
    # We also need to mount Cron router or test it directly? 
    # It is mounted at /api/cron in main.py (based on previous task).
    # We need to simulate CRON_SECRET if it's set, or mock verify_cron_secret dependency.
    
    # Let's import CRON_SECRET from cron.py context or just mock the dependency.
    # Actually, let's mock the internal logic query return.
    
    from apps.api.routers.cron import verify_cron_secret
    app.dependency_overrides[verify_cron_secret] = lambda: True

    # Mock DB find to return a stale proposal
    # .to_list() is common in Motor, mocking it on the cursor
    mock_cursor = AsyncMock()
    mock_cursor.to_list.return_value = [{
        "_id": "prop_old_123", 
        "intent_id": "pi_stale_73h",
        "status": "AUTHORIZED",
        "created_at": time.time() - (73 * 3600) # 73 hours old
    }]
    mock_db_fixture.proposals.find.return_value = mock_cursor

    response = client.get("/api/cron/release-stale-holds")

    assert response.status_code == 200
    data = response.json()
    assert data["released_count"] == 1
    
    # Assert Stripe Cancel called
    mock_stripe.cancel.assert_called_once_with("pi_stale_73h")
    
    # Assert DB Update to CANCELLED_TIMEOUT
    # Logic: update_one called with status=CANCELLED_TIMEOUT
    mock_db_fixture.proposals.update_one.assert_called()
    call_args = mock_db_fixture.proposals.update_one.call_args
    # query, update
    assert call_args[0][0]["_id"] == "prop_old_123"
    assert call_args[0][1]["$set"]["status"] == "CANCELLED_TIMEOUT"

