import asyncio
import httpx
import os
from typing import List, Dict, Any
from dotenv import load_dotenv, find_dotenv
from aris.client import Aris

# 1. This tells Python to climb up your folders to find the .env file in aris-core/
load_dotenv(find_dotenv())

class RFPOrchestrator:
    def __init__(self, api_key: str = None):
        self.client = Aris(api_key=api_key)
        self.headers = {"X-API-Key": self.client.api_key}

    async def broadcast_rfp(self, requirements: str, capability: str = "gov.rfp.bidder") -> Dict[str, Any]:
        """
        1. Discover agents with 'gov.rfp.bidder' capability.
        2. Solicit Bids from all of them (No Payment).
        3. Select Winner.
        4. Handshake (Payment) only with Winner.
        5. Execute Job.
        """
        print(f"📡 Broadcasting RFP: '{requirements}' to capability [{capability}]...")

        # 1. Discover
        async with httpx.AsyncClient() as http:
            try:
                resp = await http.get(
                    f"{self.client.registry_url}/api/discover", 
                    params={"capability": capability}
                )
                resp.raise_for_status()
                agents = resp.json().get("agents", [])
            except Exception as e:
                print(f"❌ Discovery Failed: {e}")
                return {"error": str(e)}

        if not agents:
            print("⚠️ No agents found.")
            return {"error": "No agents found"}

        # Limit to 3 agents to prevent spam
        agents = agents[:3]
        print(f"✅ Found {len(agents)} agents. Requesting bids...")

        # 2. Parallel Solicitation (Get Quotes)
        tasks = [self._get_quote(agent, requirements) for agent in agents]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 3. Filter Valid Bids
        valid_bids = [r for r in results if isinstance(r, dict) and "bid" in r]
        
        if not valid_bids:
            return {"status": "failed", "reason": "No valid bids received"}

        # 4. Selection Logic (Longest Bid Wins)
        winner_bid = max(valid_bids, key=lambda x: len(x["bid"]))
        winning_agent = next(a for a in agents if a["did"] == winner_bid["agent_did"])
        
        print(f"🏆 Winner Selected: {winning_agent['name']} ({winning_agent['did']})")
        print(f"💰 Quote: {winner_bid['bid']}")

        # 5. Settlement & Execution (Pay the Winner)
        final_result = await self._execute_winner(winning_agent, requirements)
        
        return {
            "status": "success",
            "winner": winning_agent,
            "final_project": final_result
        }

    async def _get_quote(self, agent: Dict, requirements: str) -> Dict:
        """
        Asks an agent for a free quote/bid.
        """
        endpoint = agent["endpoint"]
        async with httpx.AsyncClient() as http:
            try:
                resp = await http.post(
                    f"{endpoint}/bid",
                    json={"requirements": requirements},
                    timeout=5
                )
                resp.raise_for_status()
                data = resp.json()
                return {
                    "agent_did": agent["did"],
                    "bid": data.get("bid"),
                    "price": data.get("price")
                }
            except Exception as e:
                return {"agent_did": agent["did"], "error": str(e)}

    async def _execute_winner(self, agent: Dict, requirements: str) -> Dict:
        """
        Pays the winner and gets the final work.
        """
        print(f"💳 Initiating Handshake with {agent['did']}...")
        
        async with httpx.AsyncClient() as http:
            # A. Handshake (Payment)
            try:
                hs_resp = await http.post(
                    f"{self.client.registry_url}/handshake",
                    json={
                        "payer_did": "did:aris:rfp-orchestrator",
                        "target_did": agent["did"],
                        "capability": "gov.rfp.bidder"
                    },
                    headers=self.headers
                )
                hs_resp.raise_for_status()
                session_token = hs_resp.json()["session_token"]
            except Exception as e:
                return {"error": f"Handshake Failed: {e}"}

            print("✅ Payment Successful. Executing Job...")

            # B. Execute Job
            try:
                job_resp = await http.post(
                    f"{agent['endpoint']}/process_job",
                    json={
                        "prompt": f"RFP WON. Execute full project: {requirements}",
                        "session_token": session_token
                    },
                    timeout=30
                )
                job_resp.raise_for_status()
                return job_resp.json()
            except Exception as e:
                return {"error": f"Execution Failed: {e}"}

if __name__ == "__main__":
    # Test Run
    async def main():
        # 2. Grab the API key from the environment
        api_key = os.getenv("ARIS_API_KEY")
        
        # Quick safety check
        if not api_key:
            print("❌ ERROR: ARIS_API_KEY is not loaded. Make sure it is saved in your .env file!")
            return
            
        # 3. Pass the key into the orchestrator
        orchestrator = RFPOrchestrator(api_key=api_key)
        
        result = await orchestrator.broadcast_rfp("Need a Python script to scrape Twitter.")
        print("\n--- FINAL RESULT ---")
        print(result)

    asyncio.run(main())