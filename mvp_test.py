import requests
import time

REGISTRY_URL = "http://localhost:8000"
AGENT_URL = "http://localhost:9005"
AGENT_DID = "did:aris:math-node-01"
CLIENT_DID = "did:aris:client-user-01"

def main():
    print("--- 🚀 STARTING ARIS MVP TEST (Section 5) ---")

    # 1. BOOTSTRAP: Register the Math Agent
    print("\n[1] Registering Agent...")
    try:
        requests.post(f"{REGISTRY_URL}/register", json={
            "did": AGENT_DID,
            "endpoint": AGENT_URL,
            "capabilities": ["math.add"]
        })
    except requests.exceptions.ConnectionError:
        print(f"❌ ERROR: Could not connect to Registry at {REGISTRY_URL}")
        print("   -> Did you run: uvicorn registry.main:app --port 8000 --reload")
        return

    # 2. DISCOVERY: "I need to add numbers"
    print("\n[2] Client: Looking for 'math.add'...")
    discovery_resp = requests.get(f"{REGISTRY_URL}/discover?capability=math.add")
    
    if discovery_resp.status_code != 200:
        print(f"❌ Discovery Failed: {discovery_resp.text}")
        return

    discovery = discovery_resp.json()
    if not discovery.get("agents"):
        print("❌ No agents found! Did registration fail?")
        return

    target = discovery["agents"][0]
    print(f"   > Found Agent: {target['did']} at {target['endpoint']}")

    # 3. HANDSHAKE: "I want to hire this agent"
    print(f"\n[3] Client: Requesting Session Token (₹20.00)...")
    handshake_resp = requests.post(f"{REGISTRY_URL}/handshake", json={
        "payer_did": CLIENT_DID,
        "target_did": target["did"],
        "capability": "math.add"
    })
    
    # --- DEBUG SECTION ---
    if handshake_resp.status_code != 200:
        print(f"❌ Handshake Failed! Status: {handshake_resp.status_code}")
        print(f"Response Body: {handshake_resp.text}")
        return
    # ---------------------

    handshake = handshake_resp.json()
    if "session_token" not in handshake:
        print(f"❌ Error: Registry returned JSON but no token: {handshake}")
        return

    token = handshake["session_token"]
    print(f"   > Token Received: {token[:15]}...")

    # 4. EXECUTION: "Here is the job + the token"
    print(f"\n[4] Client: Sending '2 + 2' to Agent...")
    try:
        response = requests.post(
            f"{target['endpoint']}/execute", 
            json={"a": 2, "b": 2, "operation": "add"},
            headers={"x-aris-token": token}
        )
        print(f"\n🎉 RESULT: {response.json()}")
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Could not connect to Agent at {target['endpoint']}")
        print("   -> Did you run: python3 agent_node/math_agent.py")

    print("---------------------------------------------")

if __name__ == "__main__":
    main()