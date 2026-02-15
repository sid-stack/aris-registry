import requests

REGISTRY_URL = "http://localhost:8000"
AGENT_URL = "http://localhost:9006" # New Port
AGENT_DID = "did:aris:llm-node-01"  # New Identity
CLIENT_DID = "did:aris:client-user-01"

def main():
    print("--- 🧠 STARTING ARIS INTELLIGENCE TEST ---")

    # 1. REGISTER the LLM Node
    print("\n[1] Registering LLM Agent...")
    requests.post(f"{REGISTRY_URL}/register", json={
        "did": AGENT_DID,
        "endpoint": AGENT_URL,
        "capabilities": ["ai.generate"]
    })

    # 2. DISCOVER
    print("\n[2] Client: Looking for 'ai.generate'...")
    discovery = requests.get(f"{REGISTRY_URL}/discover?capability=ai.generate").json()
    target = discovery["agents"][0]

    # 3. PAY & HANDSHAKE
    print(f"\n[3] Client: Buying Session Token from Registry...")
    handshake = requests.post(f"{REGISTRY_URL}/handshake", json={
        "payer_did": CLIENT_DID,
        "target_did": target["did"],
        "capability": "ai.generate"
    }).json()
    token = handshake["session_token"]

    # 4. EXECUTE (The "Product")
    prompt = "Explain in one sentence why privacy matters."
    print(f"\n[4] Client: Sending Prompt: '{prompt}'")
    
    response = requests.post(
        f"{target['endpoint']}/generate", 
        json={"model": "tinyllama", "prompt": prompt},
        headers={"x-aris-token": token}
    )
    
    print(f"\n🤖 AGENT REPLY:\n{response.json().get('result')}")
    print("---------------------------------------------")

if __name__ == "__main__":
    main()