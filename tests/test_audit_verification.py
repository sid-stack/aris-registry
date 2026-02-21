import asyncio
import httpx
import jwt
import os
import time

BASE_URL = "http://localhost:8000"

# Mock settings for local testing of dependencies (if needed to simulate tokens)
# In actual local test, we assume the server is running and we can't easily forge Clerk tokens without PEM.
# However, we can test Rate Limiting and CORS easily.

async def test_rate_limiting():
    print("\n🛡️ Testing Rate Limiting on /api/analyze...")
    async with httpx.AsyncClient() as client:
        # We need a valid user to even get past 'get_current_user' if we hit the actual logic.
        # But Rate Limiting middleware (slowapi) often triggers before or during dependency resolution.
        # Let's see if we can trigger 429 even with 401/403 (depends on key_func).
        # Key func is get_remote_address, so it should trigger.
        
        status_codes = []
        for i in range(10):
            try:
                # Firing requests at the protected endpoint
                resp = await client.post(f"{BASE_URL}/api/analyze/")
                status_codes.append(resp.status_code)
            except Exception as e:
                print(f"Request failed: {e}")
        
        rate_limited = status_codes.count(429)
        print(f"Results: {status_codes}")
        if rate_limited > 0:
            print(f"✅ PASSED: {rate_limited} requests were rate limited (429).")
        else:
            print("❌ FAILED: Rate limiting not triggered.")

async def test_cors_lockdown():
    print("\n🛡️ Testing CORS Lockdown...")
    async with httpx.AsyncClient() as client:
        # Simulate unauthorized origin
        headers = {"Origin": "https://evil.com"}
        resp = await client.options(f"{BASE_URL}/api/analyze/", headers=headers)
        
        # In FastAPI, if origin is not allowed, it might either 403 or just not return CORS headers.
        # Check for access-control-allow-origin
        allow_origin = resp.headers.get("access-control-allow-origin")
        if allow_origin == "https://evil.com" or allow_origin == "*":
            print(f"❌ FAILED: Origin https://evil.com was allowed! (Header: {allow_origin})")
        else:
            print(f"✅ PASSED: Origin https://evil.com was rejected or restricted.")

async def main():
    print("=== ARIS Labs Pre-Production Security Audit Verification ===")
    
    # Check if server is up
    try:
        async with httpx.AsyncClient() as client:
            await client.get(BASE_URL)
    except Exception:
        print(f"❌ ERROR: Backend server is not running on {BASE_URL}. Please start it first.")
        return

    await test_rate_limiting()
    await test_cors_lockdown()

if __name__ == "__main__":
    asyncio.run(main())
