"""
Feature 2: /chat endpoint (node) + chat() / Conversation (SDK)
==============================================================
Test structure
--------------
NODE UNIT TESTS  (FastAPI TestClient, Ollama fully mocked)
    test_chat_returns_assistant_message
    test_chat_invalid_token_returns_401
    test_chat_empty_messages_returns_422
    test_chat_last_message_not_user_returns_422
    test_chat_ollama_error_returns_error_status
    test_chat_multi_turn_messages_forwarded_correctly
    test_chat_system_message_accepted
    test_generate_still_works_after_chat_added  (regression)
    test_node_advertises_ai_chat_capability

SDK UNIT TESTS  (HTTP mocked — no real node)
    test_client_chat_success
    test_client_chat_empty_messages_raises_value_error
    test_client_chat_last_not_user_raises_value_error
    test_client_chat_node_401_retries_once
    test_client_chat_node_error_raises_node_error
    test_client_chat_network_error_raises_node_error
    test_module_level_chat_helper

CONVERSATION UNIT TESTS
    test_conversation_say_returns_string
    test_conversation_history_grows_correctly
    test_conversation_system_prompt_prepended
    test_conversation_reset_keeps_system_prompt
    test_conversation_reset_full_wipe
    test_conversation_len
    test_conversation_repr
    test_conversation_multi_turn_history_sent_each_time

E2E TESTS  (node TestClient + SDK HTTP mock chained)
    test_e2e_single_turn_chat_flow
    test_e2e_multi_turn_conversation_flow
"""

import jwt
import time
import contextlib
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
from fastapi.testclient import TestClient

from aris.session_defaults import DEFAULT_SESSION_HS256_SECRET

# ──────────────────────────────────────────────────────────────────────────────
# Constants & helpers
# ──────────────────────────────────────────────────────────────────────────────

VALID_KEY   = "aris_live_testkey123"
NODE_SECRET = DEFAULT_SESSION_HS256_SECRET
MY_DID      = "did:aris:llm-node-01"


def _make_node_token(did: str = "did:aris:customer", expired: bool = False) -> str:
    """Mint a real JWT that the node will accept."""
    exp = time.time() + (-10 if expired else 300)
    payload = {
        "iss":   "aris-registry",
        "sub":   did,
        "aud":   MY_DID,
        "scope": "ai.chat",
        "exp":   exp,
    }
    return jwt.encode(payload, NODE_SECRET, algorithm="HS256")


def _ollama_chat_response(content: str = "Hello, I am Aris!") -> dict:
    return {"message": {"role": "assistant", "content": content}}


@contextlib.contextmanager
def _node_client(ollama_response=None, ollama_raises=None):
    """TestClient for the agent node with Ollama mocked."""
    import agent_node.llm_agent as node

    mock_http_response = MagicMock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = ollama_response or _ollama_chat_response()
    mock_http_response.raise_for_status = MagicMock()

    mock_generate_response = MagicMock()
    mock_generate_response.status_code = 200
    mock_generate_response.json.return_value = {"response": "42"}
    mock_generate_response.raise_for_status = MagicMock()

    async def fake_post(url, **kwargs):
        if ollama_raises:
            raise ollama_raises
        if "api/chat" in url:
            return mock_http_response
        return mock_generate_response

    mock_async_client = AsyncMock()
    mock_async_client.__aenter__ = AsyncMock(return_value=mock_async_client)
    mock_async_client.__aexit__  = AsyncMock(return_value=False)
    mock_async_client.post = fake_post

    with patch("agent_node.llm_agent.httpx.AsyncClient", return_value=mock_async_client):
        with TestClient(node.app, raise_server_exceptions=True) as tc:
            yield tc


# ──────────────────────────────────────────────────────────────────────────────
# Node unit tests
# ──────────────────────────────────────────────────────────────────────────────

class TestNodeChat:

    def test_chat_returns_assistant_message(self):
        token = _make_node_token()
        with _node_client(_ollama_chat_response("Paris is the capital of France.")) as tc:
            resp = tc.post("/chat", json={
                "model":    "tinyllama",
                "messages": [{"role": "user", "content": "What is the capital of France?"}],
            }, headers={"x-aris-token": token})

        assert resp.status_code == 200
        body = resp.json()
        assert body["role"]    == "assistant"
        assert body["status"]  == "success"
        assert "Paris" in body["content"]
        assert body["model"]   == "tinyllama"

    def test_chat_invalid_token_returns_401(self):
        with _node_client() as tc:
            resp = tc.post("/chat", json={
                "model":    "tinyllama",
                "messages": [{"role": "user", "content": "hi"}],
            }, headers={"x-aris-token": "this-is-not-a-valid-jwt"})

        assert resp.status_code == 401

    def test_chat_expired_token_returns_401(self):
        token = _make_node_token(expired=True)
        with _node_client() as tc:
            resp = tc.post("/chat", json={
                "model":    "tinyllama",
                "messages": [{"role": "user", "content": "hi"}],
            }, headers={"x-aris-token": token})

        assert resp.status_code == 401

    def test_chat_empty_messages_returns_422(self):
        token = _make_node_token()
        with _node_client() as tc:
            resp = tc.post("/chat", json={
                "model": "tinyllama", "messages": []
            }, headers={"x-aris-token": token})

        assert resp.status_code == 422

    def test_chat_last_message_not_user_returns_422(self):
        token = _make_node_token()
        with _node_client() as tc:
            resp = tc.post("/chat", json={
                "model": "tinyllama",
                "messages": [
                    {"role": "user",      "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"},  # last = assistant ❌
                ],
            }, headers={"x-aris-token": token})

        assert resp.status_code == 422

    def test_chat_system_message_accepted(self):
        """A system message before user messages should be valid."""
        token = _make_node_token()
        with _node_client(_ollama_chat_response("Understood.")) as tc:
            resp = tc.post("/chat", json={
                "model": "tinyllama",
                "messages": [
                    {"role": "system", "content": "You are a pirate."},
                    {"role": "user",   "content": "Greet me."},
                ],
            }, headers={"x-aris-token": token})

        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

    def test_chat_multi_turn_messages_forwarded_correctly(self):
        """All messages in history must reach Ollama."""
        token = _make_node_token()
        captured = {}

        async def capturing_post(url, **kwargs):
            captured["json"] = kwargs.get("json", {})
            mock = MagicMock()
            mock.status_code = 200
            mock.json.return_value = _ollama_chat_response("Your name is Sid.")
            mock.raise_for_status = MagicMock()
            return mock

        import agent_node.llm_agent as node
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__  = AsyncMock(return_value=False)
        mock_client.post = capturing_post

        messages = [
            {"role": "user",      "content": "My name is Sid."},
            {"role": "assistant", "content": "Nice to meet you, Sid!"},
            {"role": "user",      "content": "What's my name?"},
        ]

        with patch("agent_node.llm_agent.httpx.AsyncClient", return_value=mock_client):
            with TestClient(node.app) as tc:
                tc.post("/chat",
                    json={"model": "tinyllama", "messages": messages},
                    headers={"x-aris-token": token})

        assert captured["json"]["messages"] == messages

    def test_chat_ollama_error_returns_error_status(self):
        """When Ollama is unreachable, /chat should return status=error not crash."""
        import httpx as httpx_lib
        token = _make_node_token()
        with _node_client(ollama_raises=Exception("connection refused")) as tc:
            resp = tc.post("/chat", json={
                "model": "tinyllama",
                "messages": [{"role": "user", "content": "hello"}],
            }, headers={"x-aris-token": token})

        assert resp.status_code == 200
        assert resp.json()["status"] == "error"

    def test_generate_still_works_after_chat_added(self):
        """Regression: /generate must not be broken by the addition of /chat."""
        token = _make_node_token()
        with _node_client() as tc:
            resp = tc.post("/generate", json={
                "model": "tinyllama", "prompt": "2+2="
            }, headers={"x-aris-token": token})

        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

    def test_node_advertises_ai_chat_capability(self):
        """NODE_CAPABILITIES must include 'ai.chat'."""
        from agent_node.llm_agent import NODE_CAPABILITIES
        assert "ai.chat" in NODE_CAPABILITIES
        assert "ai.generate" in NODE_CAPABILITIES


# ──────────────────────────────────────────────────────────────────────────────
# SDK client unit tests
# ──────────────────────────────────────────────────────────────────────────────

from aris.client import Aris, ArisAuthError, ArisError, ArisNodeError, Conversation
from aris.client import chat as sdk_chat


def _mock_http(status: int, body: dict) -> MagicMock:
    m = MagicMock()
    m.status_code = status
    m.json.return_value = body
    m.text = str(body)
    return m


def _connected_client(capability: str = "ai.chat") -> Aris:
    """Return an Aris client that's already 'connected' (skip _connect_to_swarm)."""
    client = Aris(api_key=VALID_KEY)
    client.session_token = "fake-session-token"
    client.target_endpoint = "http://localhost:9006"
    client._session_capability = capability
    return client


class TestClientChat:

    def test_client_chat_success(self):
        payload = {"role": "assistant", "content": "Paris.", "model": "tinyllama", "status": "success"}
        with patch("requests.post", return_value=_mock_http(200, payload)) as mock_post:
            client = _connected_client()
            result = client.chat([{"role": "user", "content": "Capital of France?"}])

        assert result["content"] == "Paris."
        assert result["role"]    == "assistant"
        url = mock_post.call_args[0][0]
        assert url.endswith("/chat")

    def test_client_chat_empty_messages_raises_value_error(self):
        client = _connected_client()
        with pytest.raises(ValueError, match="empty"):
            client.chat([])

    def test_client_chat_last_not_user_raises_value_error(self):
        client = _connected_client()
        with pytest.raises(ValueError, match="role='user'"):
            client.chat([
                {"role": "user",      "content": "hi"},
                {"role": "assistant", "content": "hello"},
            ])

    def test_client_chat_node_401_retries_once(self):
        """On a 401 from the node, the client drops the token, reconnects, and retries."""
        success_payload = {"role": "assistant", "content": "ok", "model": "tinyllama", "status": "success"}

        def fake_connect(self_inner, capability="ai.chat"):
            self_inner.session_token = "new-session-token"
            self_inner.target_endpoint = "http://localhost:9006"
            self_inner._session_capability = capability

        with patch.object(Aris, "_connect_to_swarm", fake_connect):
            with patch("requests.post", side_effect=[
                _mock_http(401, {"detail": "expired"}),   # first call → _TokenExpiredError
                _mock_http(200, success_payload),          # retry succeeds
            ]) as mock_post:
                client = _connected_client()
                result = client.chat([{"role": "user", "content": "hi"}])

        assert result["content"] == "ok"
        assert mock_post.call_count == 2

    def test_client_chat_500_does_not_retry(self):
        """A 500 from the node should raise ArisNodeError immediately, not retry."""
        def fake_connect(self_inner, capability="ai.chat"):
            self_inner.session_token = "tok"
            self_inner.target_endpoint = "http://localhost:9006"
            self_inner._session_capability = capability

        with patch.object(Aris, "_connect_to_swarm", fake_connect):
            with patch("requests.post", return_value=_mock_http(500, {"detail": "server error"})) as mock_post:
                client = _connected_client()
                with pytest.raises(ArisNodeError):
                    client.chat([{"role": "user", "content": "hi"}])

        # Should only be called once — no retry on 500
        assert mock_post.call_count == 1

    def test_client_chat_node_error_raises_node_error(self):
        with patch("requests.post", return_value=_mock_http(500, {"detail": "kaboom"})):
            client = _connected_client()
            with pytest.raises(ArisNodeError):
                client.chat([{"role": "user", "content": "hi"}])

    def test_client_chat_network_error_raises_node_error(self):
        import requests as req_lib
        with patch("requests.post", side_effect=req_lib.RequestException("refused")):
            client = _connected_client()
            with pytest.raises(ArisNodeError):
                client.chat([{"role": "user", "content": "hi"}])

    def test_module_level_chat_helper(self):
        payload = {"role": "assistant", "content": "4", "model": "tinyllama", "status": "success"}

        def _stub_connect(self, capability):
            self.session_token = "tok"
            self.target_endpoint = "http://localhost:9006"
            self._session_capability = capability

        with patch("requests.post", return_value=_mock_http(200, payload)):
            with patch.object(Aris, "_connect_to_swarm", _stub_connect):
                result = sdk_chat([{"role": "user", "content": "2+2?"}], api_key=VALID_KEY)

        assert result["content"] == "4"


class TestHandshakeCapabilityRouting:
    """Discover + handshake must pass the same capability as the inference API."""

    @staticmethod
    def _discover_ok():
        m = MagicMock()
        m.status_code = 200
        m.json.return_value = {"agents": [{"did": "did:aris:n1", "endpoint": "http://localhost:9006"}]}
        m.raise_for_status = MagicMock()
        return m

    @staticmethod
    def _handshake_ok():
        m = MagicMock()
        m.status_code = 200
        m.json.return_value = {"session_token": "sess-tok", "remaining_balance": 5.0}
        return m

    def test_chat_handshake_and_discover_use_ai_chat(self):
        node_payload = {"role": "assistant", "content": "hi", "model": "tinyllama", "status": "success"}
        caps = []

        def route_post(url, json=None, headers=None, timeout=None):
            if "/handshake" in url:
                caps.append(json.get("capability"))
                return self._handshake_ok()
            if url.endswith("/chat"):
                return _mock_http(200, node_payload)
            raise AssertionError(f"unexpected POST {url}")

        with patch("requests.get", return_value=self._discover_ok()) as mock_get:
            with patch("requests.post", side_effect=route_post):
                client = Aris(api_key=VALID_KEY)
                client.chat([{"role": "user", "content": "hello"}])

        assert mock_get.call_args[1]["params"]["capability"] == "ai.chat"
        assert caps == ["ai.chat"]

    def test_generate_handshake_and_discover_use_ai_generate(self):
        caps = []

        def route_post(url, json=None, headers=None, timeout=None):
            if "/handshake" in url:
                caps.append(json.get("capability"))
                return self._handshake_ok()
            if "/generate" in url:
                return _mock_http(200, {"result": "OK", "status": "success"})
            raise AssertionError(f"unexpected POST {url}")

        with patch("requests.get", return_value=self._discover_ok()):
            with patch("requests.post", side_effect=route_post):
                client = Aris(api_key=VALID_KEY)
                assert client.generate("ping") == "OK"

        assert caps == ["ai.generate"]


# ──────────────────────────────────────────────────────────────────────────────
# Conversation unit tests
# ──────────────────────────────────────────────────────────────────────────────

def _make_conversation(system_prompt=None, model="tinyllama") -> Conversation:
    client = _connected_client()
    return client.conversation(system_prompt=system_prompt, model=model)


def _stub_chat(client_obj, replies):
    """Replace client.chat with one that pops from a replies list."""
    iter_replies = iter(replies)

    def fake_chat(messages, model="tinyllama"):
        content = next(iter_replies)
        return {"role": "assistant", "content": content, "model": model, "status": "success"}

    client_obj.chat = fake_chat


class TestConversation:

    def test_conversation_say_returns_string(self):
        conv = _make_conversation()
        _stub_chat(conv._client, ["Paris."])
        reply = conv.say("What is the capital of France?")
        assert reply == "Paris."

    def test_conversation_history_grows_correctly(self):
        conv = _make_conversation()
        _stub_chat(conv._client, ["Paris.", "The Eiffel Tower."])

        conv.say("Capital of France?")
        conv.say("Famous landmark?")

        history = conv.history
        assert len(history) == 4  # user, assistant, user, assistant
        assert history[0]["role"] == "user"
        assert history[1]["role"] == "assistant"
        assert history[1]["content"] == "Paris."
        assert history[2]["role"] == "user"
        assert history[3]["content"] == "The Eiffel Tower."

    def test_conversation_system_prompt_prepended(self):
        conv = _make_conversation(system_prompt="You are a pirate.")
        _stub_chat(conv._client, ["Arrr!"])

        conv.say("Greet me.")
        history = conv.history

        assert history[0]["role"]    == "system"
        assert history[0]["content"] == "You are a pirate."
        assert len(history) == 3  # system + user + assistant

    def test_conversation_reset_keeps_system_prompt(self):
        conv = _make_conversation(system_prompt="Be concise.")
        _stub_chat(conv._client, ["Yes.", "Sure."])

        conv.say("Understood?")
        assert len(conv) == 3

        conv.reset(keep_system=True)
        assert len(conv) == 1
        assert conv.history[0]["role"] == "system"

    def test_conversation_reset_full_wipe(self):
        conv = _make_conversation(system_prompt="Be concise.")
        _stub_chat(conv._client, ["Yes."])

        conv.say("Understood?")
        conv.reset(keep_system=False)
        assert len(conv) == 0
        assert conv.history == []

    def test_conversation_reset_no_system(self):
        conv = _make_conversation()
        _stub_chat(conv._client, ["Hi."])
        conv.say("Hello.")
        conv.reset()
        assert len(conv) == 0

    def test_conversation_len(self):
        conv = _make_conversation()
        assert len(conv) == 0
        _stub_chat(conv._client, ["hello"])
        conv.say("hi")
        assert len(conv) == 2

    def test_conversation_repr(self):
        conv = _make_conversation(model="llama3")
        assert "Conversation" in repr(conv)
        assert "llama3" in repr(conv)

    def test_conversation_history_is_copy(self):
        """Mutating the returned history should not affect internal state."""
        conv = _make_conversation()
        _stub_chat(conv._client, ["hi"])
        conv.say("hello")

        h = conv.history
        h.clear()  # mutate the copy
        assert len(conv) == 2  # internal state unchanged

    def test_conversation_multi_turn_history_sent_each_time(self):
        """Every call to say() must send the FULL accumulated history."""
        conv = _make_conversation()
        sent_messages = []

        def capturing_chat(messages, model="tinyllama"):
            sent_messages.append(list(messages))
            return {"role": "assistant", "content": f"reply-{len(messages)}", "status": "success"}

        conv._client.chat = capturing_chat

        conv.say("msg-1")
        conv.say("msg-2")

        # First call: 1 user msg
        assert len(sent_messages[0]) == 1
        # Second call: 1 user + 1 assistant + 1 user = 3 messages
        assert len(sent_messages[1]) == 3
        assert sent_messages[1][-1]["content"] == "msg-2"


# ──────────────────────────────────────────────────────────────────────────────
# E2E / Functional tests
# ──────────────────────────────────────────────────────────────────────────────

class TestE2EChatFlow:
    """
    Chain: SDK client → node TestClient (Ollama mocked).
    The SDK posts directly to the node's TestClient via a patched requests.post.
    """

    @contextlib.contextmanager
    def _make_e2e_setup(self, ollama_replies):
        """
        Returns a configured (client, node_tc) pair where requests.post on the
        SDK is redirected into the node's TestClient.
        """
        import agent_node.llm_agent as node

        reply_iter = iter(ollama_replies)

        async def fake_ollama_post(url, **kwargs):
            # Only pop a reply for actual Ollama calls, not registry heartbeats
            if "11434" in url or "api/chat" in url or "api/generate" in url:
                content = next(reply_iter, "...")
                m = MagicMock()
                m.status_code = 200
                m.json.return_value = _ollama_chat_response(content)
                m.raise_for_status = MagicMock()
                return m
            # Registry heartbeat or other — return a silent 200
            m = MagicMock()
            m.status_code = 200
            m.json.return_value = {"status": "registered"}
            m.raise_for_status = MagicMock()
            return m

        mock_http = AsyncMock()
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__  = AsyncMock(return_value=False)
        mock_http.post = fake_ollama_post

        sdk_client = _connected_client()
        token = _make_node_token()
        sdk_client.session_token = token

        with patch("agent_node.llm_agent.httpx.AsyncClient", return_value=mock_http):
            with TestClient(node.app) as node_tc:

                # Redirect requests.post on the SDK into the node's TestClient
                def sdk_post(url, json=None, headers=None, timeout=None):
                    path = "/" + url.split("/", 3)[-1]
                    r = node_tc.post(path, json=json, headers={
                        k.lower(): v for k, v in (headers or {}).items()
                    })
                    mock_r = MagicMock()
                    mock_r.status_code = r.status_code
                    mock_r.json.return_value = r.json()
                    mock_r.text = r.text
                    return mock_r

                yield sdk_client, sdk_post

    def test_e2e_single_turn_chat_flow(self):
        with self._make_e2e_setup(["4"]) as (client, sdk_post):
            with patch("requests.post", side_effect=sdk_post):
                result = client.chat([{"role": "user", "content": "What is 2+2?"}])

        assert result["role"]    == "assistant"
        assert result["content"] == "4"
        assert result["status"]  == "success"

    def test_e2e_multi_turn_conversation_flow(self):
        replies = ["Nice to meet you, Sid!", "Your name is Sid."]
        with self._make_e2e_setup(replies) as (client, sdk_post):
            with patch("requests.post", side_effect=sdk_post):
                conv = client.conversation()
                r1 = conv.say("My name is Sid.")
                r2 = conv.say("What is my name?")

        assert "Sid" in r1
        assert "Sid" in r2
        # Full history: 2 user + 2 assistant = 4 turns
        assert len(conv.history) == 4
        assert conv.history[-1]["role"] == "assistant"

    def test_e2e_system_prompt_preserved_across_turns(self):
        replies = ["Arrr, ahoy!", "Arrr, your name be Sid, matey!"]
        with self._make_e2e_setup(replies) as (client, sdk_post):
            with patch("requests.post", side_effect=sdk_post):
                conv = client.conversation(system_prompt="You are a pirate.")
                conv.say("Greet me.")
                conv.say("What is my name? My name is Sid.")

        history = conv.history
        assert history[0]["role"]    == "system"
        assert history[0]["content"] == "You are a pirate."
        assert len(history) == 5  # system + 2*user + 2*assistant
