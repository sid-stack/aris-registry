import asyncio
import httpx
import json

BASE_URL = "http://localhost:8081"

async def test_endpoints():
    print(f"🚀 Starting API tests against {BASE_URL}...\n")
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Test GET /health
        try:
            response = await client.get("/health")
            if response.status_code == 200:
                print(f"✅ GET /health passed: {response.json()}")
            else:
                print(f"❌ GET /health failed: Status {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ GET /health error: {str(e)}")

        print("-" * 40)

        # 2. Test POST /api/v1/research
        payload_research = {"rfp_url": "https://example.com/rfp"}
        try:
            response = await client.post("/api/v1/research", json=payload_research)
            if response.status_code == 200:
                print(f"✅ POST /api/v1/research passed: {response.json()}")
            else:
                print(f"❌ POST /api/v1/research failed: Status {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ POST /api/v1/research error: {str(e)}")

        print("-" * 40)

        # 3. Test POST /api/v1/write
        payload_write = {"data": {"key": "value"}}
        try:
            response = await client.post("/api/v1/write", json=payload_write)
            if response.status_code == 200:
                print(f"✅ POST /api/v1/write passed: {response.json()}")
            else:
                print(f"❌ POST /api/v1/write failed: Status {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ POST /api/v1/write error: {str(e)}")
            
    print("\n🏁 API tests completed.")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
