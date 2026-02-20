import asyncio
import os

import httpx


async def check_health() -> None:
    base_url = os.getenv("API_HEALTH_URL", "http://localhost:8000")
    url = f"{base_url.rstrip('/')}/health"

    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(url)

    print(f"GET {url} -> {response.status_code}")
    response.raise_for_status()
    try:
        body = response.json()
    except ValueError:
        body = response.text
    print(f"Response body: {body}")


if __name__ == "__main__":
    asyncio.run(check_health())

