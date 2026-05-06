import os
import requests
import logging
from typing import Optional, Dict, Any, List

# Configure library logging (NullHandler by default so we don't spam unless configured)
logger = logging.getLogger("aris")
logger.addHandler(logging.NullHandler())

class ArisError(Exception):
    """Base exception for all Aris SDK errors."""
    pass

class ArisAuthError(ArisError):
    """Raised when the API key is missing or invalid."""
    pass

class ArisPaymentError(ArisError):
    """Raised when payment fails or balance is insufficient."""
    pass

class ArisNodeError(ArisError):
    """Raised when the worker node fails to respond."""
    pass

class _TokenExpiredError(ArisError):
    """Internal: session token is expired or invalid — triggers one reconnect."""
    pass

# --- The Main Client ---
class Aris:
    def __init__(self, api_key: Optional[str] = None, registry_url: Optional[str] = None):
        """
        Initialize the Aris Client.

        Args:
            api_key: Your Aris API Key (starts with sk-aris- or aris_live_).
                     Defaults to ARIS_API_KEY env var.
            registry_url: URL of the Aris Registry.
                          Defaults to ARIS_REGISTRY_URL env var or localhost:8000.
        """
        self.api_key = api_key or os.getenv("ARIS_API_KEY")
        if not self.api_key:
            raise ArisAuthError("Missing API Key. Pass it to Aris() or set ARIS_API_KEY env var.")

        self.registry_url = (registry_url or os.getenv("ARIS_REGISTRY_URL", "http://localhost:8000")).rstrip("/")
        self.session_token: Optional[str] = None
        self.target_endpoint: Optional[str] = None
        # Must match the capability negotiated in the last successful handshake.
        self._session_capability: Optional[str] = None

    # ------------------------------------------------------------------ #
    #  Account APIs                                                        #
    # ------------------------------------------------------------------ #

    def balance(self) -> Dict[str, Any]:
        """
        Fetch the current credit balance for this API key.

        Returns:
            dict with keys: email, balance_usd (float), created_at (float unix ts)

        Raises:
            ArisAuthError: If the API key is invalid.
            ArisError: On network / unexpected errors.

        Example::

            client = Aris(api_key="aris_live_...")
            info = client.balance()
            print(f"Balance: ${info['balance_usd']:.4f}")
        """
        try:
            resp = requests.get(
                f"{self.registry_url}/balance",
                headers={"x-api-key": self.api_key},
                timeout=10,
            )
        except requests.RequestException as e:
            raise ArisError(f"Network error fetching balance: {e}")

        if resp.status_code == 401:
            raise ArisAuthError("Missing API Key in request.")
        if resp.status_code == 403:
            raise ArisAuthError("Invalid API Key.")
        if resp.status_code != 200:
            raise ArisError(f"Unexpected error from registry: {resp.text}")

        return resp.json()

    def usage(self, limit: int = 50) -> Dict[str, Any]:
        """
        Fetch usage history (handshake log) for this API key.

        Args:
            limit: Max records to return (1–200, default 50).

        Returns:
            dict with keys:
                email (str),
                records_returned (int),
                total_spent_usd (float),
                usage (list of dicts, newest first)

        Raises:
            ArisAuthError: If the API key is invalid.
            ArisError: On network / unexpected errors.

        Example::

            client = Aris(api_key="aris_live_...")
            report = client.usage(limit=10)
            for event in report["usage"]:
                print(event["capability"], event["cost_usd"], event["timestamp"])
        """
        if not isinstance(limit, int) or limit < 1:
            raise ValueError("limit must be a positive integer.")

        try:
            resp = requests.get(
                f"{self.registry_url}/usage",
                headers={"x-api-key": self.api_key},
                params={"limit": min(limit, 200)},
                timeout=10,
            )
        except requests.RequestException as e:
            raise ArisError(f"Network error fetching usage: {e}")

        if resp.status_code == 401:
            raise ArisAuthError("Missing API Key in request.")
        if resp.status_code == 403:
            raise ArisAuthError("Invalid API Key.")
        if resp.status_code != 200:
            raise ArisError(f"Unexpected error from registry: {resp.text}")

        return resp.json()

    # ------------------------------------------------------------------ #
    #  Inference APIs                                                      #
    # ------------------------------------------------------------------ #

    def generate(self, prompt: str, model: str = "tinyllama") -> str:
        """
        Generate text using the decentralized Aris network.
        
        Args:
            prompt: The text prompt to send.
            model: The model to use (default: tinyllama).
            
        Returns:
            The generated text string.
        """
        self._ensure_session("ai.generate")

        try:
            return self._execute_request(prompt, model)
        except ArisError as e:
            # If token expired, try one refresh
            logger.warning("Request failed (%s); refreshing session and retrying once.", e)
            self._invalidate_session()
            self._ensure_session("ai.generate")
            return self._execute_request(prompt, model)

    def _invalidate_session(self) -> None:
        self.session_token = None
        self.target_endpoint = None
        self._session_capability = None

    def _ensure_session(self, capability: str) -> None:
        """Ensure we hold a session token obtained for *capability* (fresh handshake if mismatch)."""
        if self.session_token and self._session_capability != capability:
            self._invalidate_session()
        if not self.session_token:
            self._connect_to_swarm(capability)

    def _connect_to_swarm(self, capability: str) -> None:
        """Discover a node that exposes *capability* and complete handshake (billing)."""
        logger.info("Discovering worker node for capability=%s", capability)

        try:
            # 1. Discover
            resp = requests.get(
                f"{self.registry_url}/discover",
                params={"capability": capability},
                timeout=5,
            )
            resp.raise_for_status()
            data = resp.json()

            if not data.get("agents"):
                raise ArisNodeError("No active worker nodes found in the network.")

            # Simple routing: Pick the first one (Future: pick based on latency/price)
            target = data["agents"][0]
            self.target_endpoint = target["endpoint"]
            target_did = target["did"]

            # 2. Handshake (The Transaction)
            logger.info(
                "Handshake target_did=%s capability=%s",
                target_did,
                capability,
            )

            pay_resp = requests.post(
                f"{self.registry_url}/handshake",
                json={
                    "payer_did": "did:aris:customer-sdk",
                    "target_did": target_did,
                    "capability": capability,
                },
                headers={"x-api-key": self.api_key},
                timeout=10,
            )

            if pay_resp.status_code == 402:
                raise ArisPaymentError("Insufficient Balance. Please top up your Aris account.")
            elif pay_resp.status_code != 200:
                raise ArisError(f"Handshake failed: {pay_resp.text}")

            session_data = pay_resp.json()
            self.session_token = session_data["session_token"]
            self._session_capability = capability

            logger.info(
                "Session established; remaining_balance_usd=%s",
                session_data.get("remaining_balance"),
            )

        except requests.RequestException as e:
            raise ArisError(f"Network error connecting to Registry: {e}")

    def _execute_request(self, prompt: str, model: str) -> str:
        """Direct Peer-to-Peer text generation with the Worker Node."""
        if not self.target_endpoint:
            raise ArisError("No target endpoint configured.")

        try:
            response = requests.post(
                f"{self.target_endpoint}/generate",
                json={"model": model, "prompt": prompt},
                headers={"x-aris-token": self.session_token},
                timeout=60,
            )
            if response.status_code == 200:
                return response.json().get("result", "")
            elif response.status_code in [401, 403]:
                raise ArisError("Session Token Expired or Invalid")
            else:
                raise ArisNodeError(f"Worker Node Error: {response.text}")
        except requests.RequestException as e:
            raise ArisNodeError(f"Failed to communicate with Worker Node: {e}")

    # ── chat ───────────────────────────────────────────────────────────── #

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "tinyllama",
    ) -> Dict[str, str]:
        """
        Send a multi-turn conversation to the Aris network.

        Args:
            messages: OpenAI-style list of message dicts, e.g.
                      [{"role": "user", "content": "Hello"}]
                      Roles: "system" | "user" | "assistant".
                      The final message must have role="user".
            model:    Model name to use on the worker node (default: tinyllama).

        Returns:
            dict with keys: role ("assistant"), content (str), model (str), status (str)

        Raises:
            ValueError:       If messages is empty or last message is not from "user".
            ArisPaymentError: If the account has insufficient balance.
            ArisNodeError:    If the worker node returns an error.
            ArisError:        On any other network or registry error.

        Example::

            client = Aris(api_key="aris_live_...")
            reply = client.chat([
                {"role": "user", "content": "What is the capital of France?"}
            ])
            print(reply["content"])   # → "Paris."

            # Multi-turn
            history = [
                {"role": "user",      "content": "My name is Sid."},
                {"role": "assistant", "content": "Nice to meet you, Sid!"},
                {"role": "user",      "content": "What's my name?"},
            ]
            reply = client.chat(history)
            print(reply["content"])   # → "Your name is Sid."
        """
        if not messages:
            raise ValueError("messages must not be empty.")
        if messages[-1].get("role") != "user":
            raise ValueError("The last message must have role='user'.")

        self._ensure_session("ai.chat")

        try:
            return self._execute_chat(messages, model)
        except _TokenExpiredError:
            logger.warning("Chat request failed: session expired; reconnecting.")
            self._invalidate_session()
            self._ensure_session("ai.chat")
            return self._execute_chat(messages, model)

    def _execute_chat(self, messages: List[Dict[str, str]], model: str) -> Dict[str, str]:
        """Direct P2P chat execution with the Worker Node."""
        if not self.target_endpoint:
            raise ArisError("No target endpoint configured.")

        try:
            response = requests.post(
                f"{self.target_endpoint}/chat",
                json={"model": model, "messages": messages},
                headers={"x-aris-token": self.session_token},
                timeout=90,
            )
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 422:
                raise ValueError(f"Invalid chat request: {response.json().get('detail', response.text)}")
            elif response.status_code in [401, 403]:
                raise _TokenExpiredError("Session Token Expired or Invalid")
            else:
                raise ArisNodeError(f"Worker Node Error {response.status_code}: {response.text}")
        except requests.RequestException as e:
            raise ArisNodeError(f"Failed to communicate with Worker Node: {e}")

    def conversation(self, system_prompt: Optional[str] = None, model: str = "tinyllama") -> "Conversation":
        """
        Start a stateful multi-turn conversation.

        Args:
            system_prompt: Optional system message prepended to every request.
            model:         Model to use for all turns in this conversation.

        Returns:
            A :class:`Conversation` bound to this client.

        Example::

            conv = client.conversation(system_prompt="You are a helpful coding assistant.")
            print(conv.say("How do I reverse a list in Python?"))
            print(conv.say("Show me a one-liner version."))
            print(conv.history)  # full message list
        """
        return Conversation(client=self, system_prompt=system_prompt, model=model)


# ------------------------------------------------------------------ #
#  Conversation — stateful multi-turn helper                          #
# ------------------------------------------------------------------ #

class Conversation:
    """
    Stateful wrapper around :meth:`Aris.chat` that maintains message history.

    Don't instantiate directly — use :meth:`Aris.conversation` instead.
    """

    def __init__(self, client: "Aris", system_prompt: Optional[str] = None, model: str = "tinyllama"):
        self._client = client
        self._model  = model
        self._history: List[Dict[str, str]] = []

        if system_prompt:
            self._history.append({"role": "system", "content": system_prompt})

    # ── Public interface ──────────────────────────────────────────────── #

    def say(self, text: str) -> str:
        """
        Send a user message, get the assistant's reply, and advance history.

        Args:
            text: The user's message text.

        Returns:
            The assistant's reply as a plain string.
        """
        self._history.append({"role": "user", "content": text})
        reply = self._client.chat(self._history, model=self._model)
        assistant_text = reply.get("content", "")
        self._history.append({"role": "assistant", "content": assistant_text})
        return assistant_text

    def reset(self, keep_system: bool = True) -> None:
        """
        Clear conversation history.

        Args:
            keep_system: If True (default), preserve the system prompt if one
                         was set. Set to False to wipe everything.
        """
        if keep_system and self._history and self._history[0]["role"] == "system":
            self._history = [self._history[0]]
        else:
            self._history = []

    @property
    def history(self) -> List[Dict[str, str]]:
        """Read-only view of the full message history."""
        return list(self._history)

    def __len__(self) -> int:
        """Number of messages in the conversation (including system prompt)."""
        return len(self._history)

    def __repr__(self) -> str:
        return f"<Conversation turns={len(self._history)} model={self._model}>"


# ------------------------------------------------------------------ #
#  Module-level helpers for quick scripts                              #
# ------------------------------------------------------------------ #

def generate(prompt: str, api_key: Optional[str] = None) -> str:
    """Quick helper for one-off text generation."""
    client = Aris(api_key=api_key)
    return client.generate(prompt)


def balance(api_key: Optional[str] = None) -> Dict[str, Any]:
    """Quick helper to check balance without instantiating a client."""
    client = Aris(api_key=api_key)
    return client.balance()


def usage(limit: int = 50, api_key: Optional[str] = None) -> Dict[str, Any]:
    """Quick helper to fetch usage history without instantiating a client."""
    client = Aris(api_key=api_key)
    return client.usage(limit=limit)


def chat(
    messages: List[Dict[str, str]],
    api_key: Optional[str] = None,
    model: str = "tinyllama",
) -> Dict[str, str]:
    """Quick helper for a one-shot multi-turn chat request."""
    client = Aris(api_key=api_key)
    return client.chat(messages, model=model)