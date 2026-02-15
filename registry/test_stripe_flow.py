import os
import sys
import asyncio
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Add local directory to path so we can import main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Check for Stripe Key
from dotenv import load_dotenv
load_dotenv()

stripe_key = os.getenv("STRIPE_SECRET_KEY")
using_mock = False

if not stripe_key:
    print("⚠️  STRIPE_SECRET_KEY not found in environment.")
    print("   Switching to MOCK mode to verify code logic only.")
    using_mock = True
    # Mock stripe before importing main if possible, or patch it after
    # main.py imports stripe at top level
    
try:
    from main import app
except ImportError:
    # Try importing from registry provided we are running from root
    from registry.main import app

client = TestClient(app)

def test_stripe_checkout_flow():
    print("\n🚀 Starting Stripe Checkout Flow Test...")
    
    # Mock payload
    payload = {"email": "test_user@example.com"}
    
    if using_mock:
        with patch("stripe.checkout.Session.create") as mock_create:
            mock_create.return_value = MagicMock(url="https://checkout.stripe.com/mock/session_123")
            
            print(f"👉 Sending POST to /api/billing/checkout with {payload}")
            response = client.post("/api/billing/checkout", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success! Response:", data)
                if "url" in data and data["url"].startswith("https://checkout.stripe.com"):
                    print("✅ Valid Stripe URL format received (Mocked).")
                else:
                    print("❌ Invalid URL format.")
            else:
                print(f"❌ Failed. Status: {response.status_code}, Body: {response.text}")
    else:
        print(f"👉 Sending REAL request to /api/billing/checkout with {payload}")
        try:
            response = client.post("/api/billing/checkout", json=payload)
            if response.status_code == 200:
                data = response.json()
                print("✅ Success! Response:", data)
                print(f"🔗 VISUAL VERIFICATION REQUIRED: Open this URL to see payment page:\n{data['url']}")
            else:
                print(f"❌ Failed. Status: {response.status_code}, Body: {response.text}")
        except Exception as e:
            print(f"❌ Exception during request: {e}")

if __name__ == "__main__":
    test_stripe_checkout_flow()
