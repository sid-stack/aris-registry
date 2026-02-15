import os
import requests
import logging
from typing import Optional, Dict, Any

# Configure library logging (NullHandler by default so we don't spam unless configured)
logger = logging.getLogger("aris")
logger.addHandler(logging.NullHandler())

# --- Custom Exceptions (The Professional Way) ---
class ArisError(Exception):
    """Base exception for all Aris SDK errors."""
    pass

class ArisPaymentError(ArisError):
    """Raised when payment fails or balance is insufficient."""
    pass

class ArisNodeError(ArisError):
    """Raised when the worker node fails to respond."""
    pass

# --- The Main Client ---
class Aris:
    def __init__(self, api_key: Optional[str] = None, registry_url: Optional[str] = None):
        """
        Initialize the Aris Client.
        
        Args:
            api_key: Your Aris API Key (starts with sk-). Defaults to ARIS_API_KEY env var.
            registry_url: URL of the Aris Registry. Defaults to ARIS_REGISTRY_URL env var or localhost.
        """
        self.api_key = api_key or os.getenv("ARIS_API_KEY")
        if not self.api_key:
            raise ArisError("❌ Missing API Key. Pass it to Aris() or set ARIS_API_KEY.")
            
        self.registry_url = registry_url or os.getenv("ARIS_REGISTRY_URL", "http://localhost:8000")
        self.session_token: Optional[str] = None
        self.target_endpoint: Optional[str] = None

    def generate(self, prompt: str, model: str = "tinyllama") -> str:
        """
        Generate text using the decentralized Aris network.
        
        Args:
            prompt: The text prompt to send.
            model: The model to use (default: tinyllama).
            
        Returns:
            The generated text string.
        """
        # Auto-connect if not connected
        if not self.session_token:
            self._connect_to_swarm()

        try:
            return self._execute_request(prompt, model)
        except ArisError as e:
            # If token expired, try one refresh
            logger.warning(f"⚠️ Request failed ({e}). Attempting to refresh session...")
            self.session_token = None
            self._connect_to_swarm()
            return self._execute_request(prompt, model)

    def _connect_to_swarm(self):
        """Handles Discovery (finding nodes) and Handshake (payment)."""
        logger.info("🔎 Discovering best available node...")
        
        try:
            # 1. Discover
            resp = requests.get(f"{self.registry_url}/discover", params={"capability": "ai.generate"}, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get("agents"):
                raise ArisNodeError("No active worker nodes found in the network.")
            
            # Simple routing: Pick the first one (Future: pick based on latency/price)
            target = data["agents"][0]
            self.target_endpoint = target["endpoint"]
            target_did = target["did"]

            # 2. Handshake (The Transaction)
            logger.info(f"💳 Negotiating contract with {target_did}...")
            
            pay_resp = requests.post(
                f"{self.registry_url}/handshake",
                json={
                    "payer_did": "did:aris:customer-sdk", # In future, derive this from key
                    "target_did": target_did,
                    "capability": "ai.generate"
                },
                headers={"x-api-key": self.api_key},
                timeout=10
            )

            if pay_resp.status_code == 402:
                raise ArisPaymentError("Insufficient Balance. Please top up your Aris account.")
            elif pay_resp.status_code != 200:
                raise ArisError(f"Handshake failed: {pay_resp.text}")

            session_data = pay_resp.json()
            self.session_token = session_data["session_token"]
            
            logger.info(f"✅ Session Established. Balance remaining: ₹{session_data.get('remaining_balance', '???')}")

        except requests.RequestException as e:
            raise ArisError(f"Network error connecting to Registry: {e}")

    def _execute_request(self, prompt: str, model: str) -> str:
        """Direct Peer-to-Peer execution with the Worker Node."""
        if not self.target_endpoint:
            raise ArisError("No target endpoint configured.")

        try:
            response = requests.post(
                f"{self.target_endpoint}/generate",
                json={"model": model, "prompt": prompt},
                headers={"x-aris-token": self.session_token},
                timeout=60 # AI can be slow
            )

            if response.status_code == 200:
                return response.json().get("result", "")
            elif response.status_code in [401, 403]:
                raise ArisError("Session Token Expired or Invalid")
            else:
                raise ArisNodeError(f"Worker Node Error: {response.text}")
                
        except requests.RequestException as e:
            raise ArisNodeError(f"Failed to communicate with Worker Node: {e}")

# --- Helper for quick scripts ---
def generate(prompt: str, api_key: Optional[str] = None) -> str:
    """Quick helper function for one-off generations."""
    client = Aris(api_key=api_key)
    return client.generate(prompt)