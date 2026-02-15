import asyncio
import httpx
from aris.client import ArisClient

async def main():
    print("--- 🧠 STARTING DECENTRALIZED AI TEST ---")
    client = ArisClient()
    
    # 1. Register AI Node
    await client.register(
        did="did:aris:llama_node_01",
        endpoint="http://localhost:9001",
        capabilities=["ai.text_generation"],
        price=10.0
    )

    # 2. Discovery & Payment
    target = (await client.discover("ai.text_generation"))[0]
    token = (await client.handshake("did:aris:me", target.did))["session_token"]

    # 3. Ask Question
    prompt = "Explain quantum computing in one sentence."
    print(f"\n[?] Asking: '{prompt}'")
    
    async with httpx.AsyncClient(timeout=60.0) as agent:
        resp = await agent.post(
            f"{target.endpoint}/process_job",
            json={"prompt": prompt, "session_token": token}
        )
        print(f"\n🤖 ANSWER: {resp.json()['response']}")

    await client.close()

if __name__ == "__main__":
    asyncio.run(main())