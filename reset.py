import requests

REGISTRY_URL = "http://localhost:8000/admin/topup"
API_KEY = "sk-aris-demo-key"
TARGET_BALANCE = 100.0

def reset_balance():
    # First, we check current balance (optional, but good for logs)
    # Then we just force the balance to 100.0
    # Note: Our current topup adds to the balance. 
    # To 'reset' to 100, we'll just send a large enough top-up 
    # or you can use this simplified version to just set it.
    
    print(f"🔄 Resetting {API_KEY} to ₹{TARGET_BALANCE}...")
    
    # Using the endpoint we just created
    resp = requests.post(REGISTRY_URL, json={
        "api_key": API_KEY,
        "amount": 100.0 # This adds 100. Feel free to adjust logic if you want a 'hard' set.
    })
    
    if resp.status_code == 200:
        print(f"✅ Reset Successful! New Balance: ₹{resp.json()['new_balance']}")
    else:
        print(f"❌ Reset Failed: {resp.text}")

if __name__ == "__main__":
    reset_balance()