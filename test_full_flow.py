import asyncio
import httpx
from aris.client import ArisClient

async def main():
    print("--- 🌍 STARTING LIVE SYSTEM MONITOR TEST ---")
    
    client = ArisClient()
    
    # 1. Register the Worker (System Monitor)
    worker_did = "did:aris:sys_monitor_01"
    print(f"\n[1] Registering System Monitor Node...")
    await client.register(
        did=worker_did,
        endpoint="http://localhost:9001",
        capabilities=["system.monitor", "cpu.stats"],
        price=5.0
    )

    # 2. Discovery
    print(f"\n[2] Searching for 'system.monitor'...")
    agents = await client.discover("system.monitor")
    target = agents[0]
    print(f"✅ Found Target: {target.endpoint}")

    # 3. Buy Token
    print(f"\n[3] Buying Access Token...")
    handshake = await client.handshake("did:aris:me", target.did)
    token = handshake["session_token"]

    # 4. P2P Request (Real Hardware Check)
    print(f"\n[4] Requesting Real-Time CPU Stats...")
    
    async with httpx.AsyncClient() as agent_b:
        resp = await agent_b.post(
            f"{target.endpoint}/process_job",
            json={
                "command": "get_system_health",
                "session_token": token
            },
            timeout=10.0 # Give psutil time to measure CPU
        )
        
        result = resp.json()
        print("\n📊 --- LIVE NODE STATUS ---")
        print(f"CPU Load:  {result['data']['cpu_load']}")
        print(f"RAM Usage: {result['data']['ram_usage']}")
        print(f"Free RAM:  {result['data']['ram_free']}")
        print("-------------------------")

    await client.close()

if __name__ == "__main__":
    asyncio.run(main())