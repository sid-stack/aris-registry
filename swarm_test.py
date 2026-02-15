import asyncio
import httpx
from aris.client import ArisClient

async def main():
    print("--- 🐝 STARTING SWARM SEQUENCE ---")
    client = ArisClient()
    
    # 1. Register Both Agents
    print("[1] Registering Swarm Nodes...")
    await client.register("did:aris:writer", "http://localhost:9001", ["ai.writer"], 5.0)
    await client.register("did:aris:editor", "http://localhost:9002", ["ai.editor"], 5.0)

    # 2. Define the Workflow
    topic = "Why is the sky blue?"
    print(f"\n🎯 GOAL: Write a polished explanation about: '{topic}'")

    async with httpx.AsyncClient(timeout=60.0) as http:
        
        # --- PHASE A: DRAFTING (Writer) ---
        writer_node = (await client.discover("ai.writer"))[0]
        token_a = (await client.handshake("did:aris:me", writer_node.did))["session_token"]
        
        print(f"\n📝 [Step A] Asking Writer ({writer_node.endpoint})...")
        resp_a = await http.post(f"{writer_node.endpoint}/process_job", json={
            "prompt": f"Write a short, creative draft about: {topic}",
            "session_token": token_a
        })
        draft = resp_a.json()["response"]
        print(f"   > Draft:\n   {draft[:100]}...")

        # --- PHASE B: REFINING (Editor) ---
        editor_node = (await client.discover("ai.editor"))[0]
        token_b = (await client.handshake("did:aris:me", editor_node.did))["session_token"]

        print(f"\n🔍 [Step B] Sending to Editor ({editor_node.endpoint})...")
        resp_b = await http.post(f"{editor_node.endpoint}/process_job", json={
            "prompt": f"Fix grammar and make this text punchy: {draft}",
            "session_token": token_b
        })
        final = resp_b.json()["response"]

    print("\n✨ --- FINAL POLISHED RESULT --- ✨")
    print(final)
    print("-----------------------------------")
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())