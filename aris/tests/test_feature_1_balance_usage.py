"""
Feature 1: /balance & /usage endpoints + SDK client.balance() / client.usage()
==============================================================================
Test structure
--------------
UNIT TESTS  (no real network, no real DB — all mocked)
    Registry layer:
        test_balance_returns_correct_data
        test_balance_missing_key_returns_401
        test_balance_invalid_key_returns_403
        test_usage_returns_records
        test_usage_missing_key_returns_401
        test_usage_invalid_key_returns_403
        test_usage_limit_capped_at_200
        test_handshake_logs_usage

    SDK client layer:
        test_client_balance_success
        test_client_balance_invalid_key_raises_auth_error
        test_client_balance_network_error_raises_aris_error
        test_client_usage_success
        test_client_usage_invalid_key_raises_auth_error
        test_client_usage_bad_limit_raises_value_error
        test_module_level_balance_helper
        test_module_level_usage_helper

E2E / FUNCTIONAL TESTS  (FastAPI TestClient, MongoDB fully mocked)
    test_e2e_balance_and_usage_full_flow
    test_e2e_handshake_then_usage_reflects_event
"""

import time
import pytest
import contextlib
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

VALID_KEY   = "aris_live_testkey123"
INVALID_KEY = "aris_live_badkey999"
TEST_EMAIL  = "test@aris.ai"
TEST_BALANCE = 9.50

def _make_account(balance=TEST_BALANCE):
    return {
        "api_key":    VALID_KEY,
        "email":      TEST_EMAIL,
        "balance":    balance,
        "created_at": 1700000000.0,
    }

def _make_usage_record(n=1):
    now = time.time()
    return [
        {
            "email":          TEST_EMAIL,
            "payer_did":      "did:aris:customer-sdk",
            "target_did":     f"did:aris:node-{i}",
            "capability":     "ai.generate",
            "cost_usd":       0.10,
            "balance_before": TEST_BALANCE + (n - i) * 0.10,
            "balance_after":  TEST_BALANCE + (n - i - 1) * 0.10,
            "timestamp":      now - i * 60,
        }
        for i in range(n)
    ]


# ──────────────────────────────────────────────────────────────────────────────
# Registry unit tests (FastAPI TestClient + mocked motor collections)
# ──────────────────────────────────────────────────────────────────────────────

@contextlib.contextmanager
def _make_registry_client(account_doc, usage_docs=None):
    """
    Patch the three MongoDB collection globals in registry.main and return a
    synchronous TestClient so we can call endpoints directly.
    """
    import registry.main as reg

    usage_docs = usage_docs or []

    # Build async mock collections
    mock_accounts = MagicMock()
    mock_accounts.find_one = AsyncMock(
        side_effect=lambda q, *a, **kw: account_doc if account_doc and q.get("api_key") == account_doc.get("api_key") else None
    )
    mock_accounts.update_one = AsyncMock(return_value=None)

    # Usage collection — find() returns a cursor-like object
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=usage_docs)

    mock_usage = MagicMock()
    mock_usage.find = MagicMock(return_value=mock_cursor)
    mock_usage.insert_one = AsyncMock(return_value=None)

    with (
        patch.object(reg, "accounts_collection", mock_accounts),
        patch.object(reg, "usage_collection",    mock_usage),
    ):
        with TestClient(reg.app, raise_server_exceptions=True) as tc:
            yield tc, mock_accounts, mock_usage


# ── /balance ──────────────────────────────────────────────────────────────────

class TestRegistryBalance:

    def test_balance_returns_correct_data(self):
        account = _make_account()
        with _make_registry_client(account) as (tc, *_):
            resp = tc.get("/balance", headers={"x-api-key": VALID_KEY})
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"]       == TEST_EMAIL
        assert data["balance_usd"] == round(TEST_BALANCE, 6)
        assert "created_at" in data

    def test_balance_missing_key_returns_401(self):
        with _make_registry_client(None) as (tc, *_):
            resp = tc.get("/balance")
        assert resp.status_code == 401

    def test_balance_invalid_key_returns_403(self):
        account = _make_account()
        with _make_registry_client(account) as (tc, *_):
            resp = tc.get("/balance", headers={"x-api-key": INVALID_KEY})
        assert resp.status_code == 403

    def test_balance_zero_balance(self):
        account = _make_account(balance=0.0)
        with _make_registry_client(account) as (tc, *_):
            resp = tc.get("/balance", headers={"x-api-key": VALID_KEY})
        assert resp.status_code == 200
        assert resp.json()["balance_usd"] == 0.0


# ── /usage ────────────────────────────────────────────────────────────────────

class TestRegistryUsage:

    def test_usage_returns_records(self):
        records = _make_usage_record(3)
        with _make_registry_client(_make_account(), records) as (tc, *_):
            resp = tc.get("/usage", headers={"x-api-key": VALID_KEY})
        assert resp.status_code == 200
        body = resp.json()
        assert body["records_returned"]  == 3
        assert body["email"]             == TEST_EMAIL
        assert round(body["total_spent_usd"], 6) == round(3 * 0.10, 6)
        assert len(body["usage"])        == 3

    def test_usage_empty_history(self):
        with _make_registry_client(_make_account(), []) as (tc, *_):
            resp = tc.get("/usage", headers={"x-api-key": VALID_KEY})
        assert resp.status_code == 200
        body = resp.json()
        assert body["records_returned"] == 0
        assert body["total_spent_usd"]  == 0.0
        assert body["usage"]            == []

    def test_usage_missing_key_returns_401(self):
        with _make_registry_client(None) as (tc, *_):
            resp = tc.get("/usage")
        assert resp.status_code == 401

    def test_usage_invalid_key_returns_403(self):
        with _make_registry_client(_make_account(), []) as (tc, *_):
            resp = tc.get("/usage", headers={"x-api-key": INVALID_KEY})
        assert resp.status_code == 403

    def test_usage_limit_param_forwarded(self):
        """Confirm the limit query param is accepted (cursor mock honours it)."""
        records = _make_usage_record(5)
        with _make_registry_client(_make_account(), records) as (tc, *_):
            resp = tc.get("/usage", headers={"x-api-key": VALID_KEY}, params={"limit": 5})
        assert resp.status_code == 200
        assert resp.json()["records_returned"] == 5


# ── /handshake logs usage ─────────────────────────────────────────────────────

class TestHandshakeLogsUsage:

    def test_handshake_logs_usage(self):
        """After a successful handshake, usage_collection.insert_one must be called."""
        import registry.main as reg

        account = _make_account(balance=5.0)
        mock_accounts = MagicMock()
        mock_accounts.find_one  = AsyncMock(return_value=account)
        mock_accounts.update_one = AsyncMock(return_value=None)

        mock_usage = MagicMock()
        mock_usage.insert_one = AsyncMock(return_value=None)

        mock_agents = MagicMock()

        with (
            patch.object(reg, "accounts_collection", mock_accounts),
            patch.object(reg, "usage_collection",    mock_usage),
            patch.object(reg, "agents_collection",   mock_agents),
        ):
            with TestClient(reg.app) as tc:
                resp = tc.post(
                    "/handshake",
                    json={
                        "payer_did":  "did:aris:test-payer",
                        "target_did": "did:aris:test-node",
                        "capability": "ai.generate",
                    },
                    headers={"x-api-key": VALID_KEY},
                )

        assert resp.status_code == 200
        mock_usage.insert_one.assert_awaited_once()

        call_args = mock_usage.insert_one.call_args[0][0]
        assert call_args["api_key"]    == VALID_KEY
        assert call_args["capability"] == "ai.generate"
        assert call_args["cost_usd"]   == 0.10
        assert "timestamp" in call_args

    def test_handshake_insufficient_balance_does_not_log(self):
        """If balance is too low, /handshake must NOT log a usage event."""
        import registry.main as reg

        account = _make_account(balance=0.05)  # below $0.10 threshold
        mock_accounts = MagicMock()
        mock_accounts.find_one   = AsyncMock(return_value=account)
        mock_accounts.update_one = AsyncMock(return_value=None)

        mock_usage = MagicMock()
        mock_usage.insert_one = AsyncMock(return_value=None)

        with (
            patch.object(reg, "accounts_collection", mock_accounts),
            patch.object(reg, "usage_collection",    mock_usage),
        ):
            with TestClient(reg.app) as tc:
                resp = tc.post(
                    "/handshake",
                    json={"payer_did": "x", "target_did": "y", "capability": "ai.generate"},
                    headers={"x-api-key": VALID_KEY},
                )

        assert resp.status_code == 402
        mock_usage.insert_one.assert_not_awaited()


# ──────────────────────────────────────────────────────────────────────────────
# SDK client unit tests  (pure HTTP mock — no registry process needed)
# ──────────────────────────────────────────────────────────────────────────────

from aris.client import Aris, ArisAuthError, ArisError, balance as sdk_balance, usage as sdk_usage


def _mock_response(status_code: int, json_data: dict):
    mock = MagicMock()
    mock.status_code = status_code
    mock.json.return_value = json_data
    mock.text = str(json_data)
    return mock


class TestClientBalance:

    def test_client_balance_success(self):
        payload = {"email": TEST_EMAIL, "balance_usd": 9.50, "created_at": 1700000000.0}
        with patch("requests.get", return_value=_mock_response(200, payload)) as mock_get:
            client = Aris(api_key=VALID_KEY)
            result = client.balance()

        assert result["balance_usd"] == 9.50
        assert result["email"]       == TEST_EMAIL
        mock_get.assert_called_once()
        _, kwargs = mock_get.call_args
        assert kwargs["headers"]["x-api-key"] == VALID_KEY

    def test_client_balance_missing_key_raises_auth_error(self):
        with patch("requests.get", return_value=_mock_response(401, {"detail": "Missing API Key"})):
            client = Aris(api_key=VALID_KEY)
            with pytest.raises(ArisAuthError):
                client.balance()

    def test_client_balance_invalid_key_raises_auth_error(self):
        with patch("requests.get", return_value=_mock_response(403, {"detail": "Invalid API Key"})):
            client = Aris(api_key=INVALID_KEY)
            with pytest.raises(ArisAuthError):
                client.balance()

    def test_client_balance_network_error_raises_aris_error(self):
        import requests as req_lib
        with patch("requests.get", side_effect=req_lib.RequestException("timeout")):
            client = Aris(api_key=VALID_KEY)
            with pytest.raises(ArisError):
                client.balance()

    def test_client_balance_unexpected_status_raises_aris_error(self):
        with patch("requests.get", return_value=_mock_response(500, {"detail": "Internal server error"})):
            client = Aris(api_key=VALID_KEY)
            with pytest.raises(ArisError):
                client.balance()

    def test_client_missing_api_key_raises_auth_error_on_init(self):
        with patch.dict("os.environ", {}, clear=True):
            # No key in env or arg
            import os
            os.environ.pop("ARIS_API_KEY", None)
            with pytest.raises(ArisAuthError):
                Aris()


class TestClientUsage:

    def _usage_payload(self, n=2):
        records = _make_usage_record(n)
        return {
            "email":           TEST_EMAIL,
            "records_returned": n,
            "total_spent_usd": round(n * 0.10, 6),
            "usage":           records,
        }

    def test_client_usage_success(self):
        payload = self._usage_payload(3)
        with patch("requests.get", return_value=_mock_response(200, payload)) as mock_get:
            client = Aris(api_key=VALID_KEY)
            result = client.usage(limit=10)

        assert result["records_returned"] == 3
        assert len(result["usage"])       == 3
        _, kwargs = mock_get.call_args
        assert kwargs["params"]["limit"]  == 10

    def test_client_usage_limit_capped_at_200(self):
        payload = self._usage_payload(1)
        with patch("requests.get", return_value=_mock_response(200, payload)) as mock_get:
            client = Aris(api_key=VALID_KEY)
            client.usage(limit=9999)

        _, kwargs = mock_get.call_args
        assert kwargs["params"]["limit"] == 200

    def test_client_usage_bad_limit_raises_value_error(self):
        client = Aris(api_key=VALID_KEY)
        with pytest.raises(ValueError):
            client.usage(limit=0)
        with pytest.raises(ValueError):
            client.usage(limit=-5)

    def test_client_usage_invalid_key_raises_auth_error(self):
        with patch("requests.get", return_value=_mock_response(403, {"detail": "Invalid"})):
            client = Aris(api_key=INVALID_KEY)
            with pytest.raises(ArisAuthError):
                client.usage()

    def test_client_usage_network_error_raises_aris_error(self):
        import requests as req_lib
        with patch("requests.get", side_effect=req_lib.RequestException("connection refused")):
            client = Aris(api_key=VALID_KEY)
            with pytest.raises(ArisError):
                client.usage()


class TestModuleLevelHelpers:

    def test_module_level_balance_helper(self):
        payload = {"email": TEST_EMAIL, "balance_usd": 5.0, "created_at": 1700000000.0}
        with patch("requests.get", return_value=_mock_response(200, payload)):
            result = sdk_balance(api_key=VALID_KEY)
        assert result["balance_usd"] == 5.0

    def test_module_level_usage_helper(self):
        payload = {"email": TEST_EMAIL, "records_returned": 0, "total_spent_usd": 0.0, "usage": []}
        with patch("requests.get", return_value=_mock_response(200, payload)):
            result = sdk_usage(api_key=VALID_KEY)
        assert result["records_returned"] == 0


# ──────────────────────────────────────────────────────────────────────────────
# E2E / Functional tests  (full registry app, mocked DB)
# ──────────────────────────────────────────────────────────────────────────────

class TestE2EBalanceUsageFlow:
    """
    Simulates a realistic developer journey:
      1. Check balance → see initial credits.
      2. Call /handshake → balance decrements, usage logged.
      3. Call /usage → event appears in history.
      4. Call /balance again → matches post-deduct value.
    """

    def test_e2e_full_flow(self):
        import registry.main as reg

        initial_balance = 5.00
        account = _make_account(balance=initial_balance)

        # We'll mutate the "DB" state across calls to simulate real behaviour
        db_account = dict(account)
        usage_log: list = []

        # --- Mock accounts collection ---
        mock_accounts = MagicMock()

        async def fake_find_one(query, *a, **kw):
            if query.get("api_key") == VALID_KEY:
                return dict(db_account)
            return None

        async def fake_update_one(query, update, *a, **kw):
            if "$inc" in update:
                for field, delta in update["$inc"].items():
                    db_account[field] = round(db_account.get(field, 0) + delta, 6)

        mock_accounts.find_one  = AsyncMock(side_effect=fake_find_one)
        mock_accounts.update_one = AsyncMock(side_effect=fake_update_one)

        # --- Mock usage collection ---
        mock_cursor = MagicMock()
        mock_cursor.sort  = MagicMock(return_value=mock_cursor)
        mock_cursor.limit = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(side_effect=lambda length: usage_log[:length])

        mock_usage = MagicMock()
        mock_usage.find      = MagicMock(return_value=mock_cursor)
        mock_usage.insert_one = AsyncMock(side_effect=lambda doc: usage_log.insert(0, doc))

        mock_agents = MagicMock()

        with (
            patch.object(reg, "accounts_collection", mock_accounts),
            patch.object(reg, "usage_collection",    mock_usage),
            patch.object(reg, "agents_collection",   mock_agents),
        ):
            with TestClient(reg.app) as tc:

                # Step 1: Check initial balance
                r = tc.get("/balance", headers={"x-api-key": VALID_KEY})
                assert r.status_code == 200
                assert r.json()["balance_usd"] == initial_balance

                # Step 2: Handshake (triggers deduction + usage log)
                r = tc.post(
                    "/handshake",
                    json={
                        "payer_did":  "did:aris:dev",
                        "target_did": "did:aris:llm-node-01",
                        "capability": "ai.generate",
                    },
                    headers={"x-api-key": VALID_KEY},
                )
                assert r.status_code == 200
                handshake_data = r.json()
                expected_after = round(initial_balance - 0.10, 6)
                assert handshake_data["remaining_balance"] == expected_after

                # Step 3: Usage endpoint reflects the event
                r = tc.get("/usage", headers={"x-api-key": VALID_KEY})
                assert r.status_code == 200
                usage_data = r.json()
                assert usage_data["records_returned"]       == 1
                assert usage_data["total_spent_usd"]        == 0.10
                event = usage_data["usage"][0]
                assert event["capability"]  == "ai.generate"
                assert event["cost_usd"]    == 0.10
                assert event["payer_did"]   == "did:aris:dev"
                assert event["target_did"]  == "did:aris:llm-node-01"

                # Step 4: Balance now reflects deduction
                r = tc.get("/balance", headers={"x-api-key": VALID_KEY})
                assert r.status_code == 200
                assert r.json()["balance_usd"] == expected_after

    def test_e2e_multiple_handshakes_accumulate_usage(self):
        import registry.main as reg

        db_account = _make_account(balance=10.0)
        usage_log: list = []

        mock_accounts = MagicMock()

        async def fake_find_one(query, *a, **kw):
            return dict(db_account) if query.get("api_key") == VALID_KEY else None

        async def fake_update_one(query, update, *a, **kw):
            if "$inc" in update:
                for field, delta in update["$inc"].items():
                    db_account[field] = round(db_account.get(field, 0) + delta, 6)

        mock_accounts.find_one   = AsyncMock(side_effect=fake_find_one)
        mock_accounts.update_one = AsyncMock(side_effect=fake_update_one)

        mock_cursor = MagicMock()
        mock_cursor.sort  = MagicMock(return_value=mock_cursor)
        mock_cursor.limit = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(side_effect=lambda length: usage_log[:length])

        mock_usage = MagicMock()
        mock_usage.find       = MagicMock(return_value=mock_cursor)
        mock_usage.insert_one = AsyncMock(side_effect=lambda doc: usage_log.insert(0, doc))

        with (
            patch.object(reg, "accounts_collection", mock_accounts),
            patch.object(reg, "usage_collection",    mock_usage),
        ):
            with TestClient(reg.app) as tc:
                for i in range(3):
                    r = tc.post(
                        "/handshake",
                        json={"payer_did": "did:aris:dev", "target_did": f"did:aris:node-{i}", "capability": "ai.generate"},
                        headers={"x-api-key": VALID_KEY},
                    )
                    assert r.status_code == 200

                r = tc.get("/usage", headers={"x-api-key": VALID_KEY})
                body = r.json()
                assert body["records_returned"]  == 3
                assert round(body["total_spent_usd"], 6) == round(3 * 0.10, 6)

                r = tc.get("/balance", headers={"x-api-key": VALID_KEY})
                assert round(r.json()["balance_usd"], 6) == round(10.0 - 3 * 0.10, 6)
