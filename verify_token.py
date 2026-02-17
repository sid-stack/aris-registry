import jwt
import os
from dotenv import load_dotenv

load_dotenv()

# The same key used in your registry main.py
ARIS_PRIVATE_KEY = os.getenv("ARIS_PRIVATE_KEY")

def verify_session_token(token: str):
    try:
        # This checks the signature and the expiration (exp) automatically
        payload = jwt.decode(token, ARIS_PRIVATE_KEY, algorithms=["HS256"])
        print("✅ Token Verified!")
        print(f"User: {payload.get('owner')}")
        print(f"Capability: {payload.get('scope')}")
        return payload
    except jwt.ExpiredSignatureError:
        print("❌ Token has expired.")
    except jwt.InvalidTokenError:
        print("❌ Invalid token signature.")
    return None

# Test with your terminal output token
# verify_session_token("eyJhbGciOiJIUzI1NiI...")