import redis.asyncio as redis
from typing import List, Optional

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

class SearchEngine:
    """
    The 'Google' of Aris.
    Uses Inverted Indices in Redis to find agents by capability instantly.
    """

    @staticmethod
    async def index_agent(did: str, capabilities: List[str]):
        """
        Updates the Inverted Index.
        If Agent A has 'video', we add Agent A to the 'idx:video' set.
        """
        async with redis_client.pipeline() as pipe:
            # 1. Update the 'Last Seen' timestamp
            pipe.hset(f"agent:{did}", mapping={"last_seen": "now"})
            
            # 2. Index each capability
            for cap in capabilities:
                # Key: idx:media.video -> Set{did:agent:1, did:agent:2}
                pipe.sadd(f"idx:{cap.lower()}", did)
            
            await pipe.execute()

    @staticmethod
    async def search(capability: str, limit: int = 10) -> List[dict]:
        """
        Finds agents that match the capability.
        Returns full agent details.
        """
        # 1. Get all DIDs from the index (0ms latency)
        dids = await redis_client.smembers(f"idx:{capability.lower()}")
        
        if not dids:
            return []

        # 2. Fetch details for all found agents in parallel
        results = []
        for did in list(dids)[:limit]:
            # In a real app, use mget for even more speed
            data = await redis_client.hgetall(f"agent:{did}")
            if data:
                # Add the DID to the response object since it's the key
                data['did'] = did
                results.append(data)
                
        return results

    @staticmethod
    async def remove_agent(did: str, capabilities: List[str]):
        """
        Removes an agent from the index (e.g., if they go offline).
        """
        for cap in capabilities:
            await redis_client.srem(f"idx:{cap.lower()}", did)