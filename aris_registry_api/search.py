import os
import logging
from typing import List, Optional

logger = logging.getLogger("aris.search")

# ── Redis is optional — if no REDIS_URL is set, SearchEngine silently no-ops ──
REDIS_URL = os.getenv("REDIS_URL", "")
redis_client = None

if REDIS_URL:
    try:
        import redis.asyncio as redis
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        logger.info(f"✅ Redis connected: {REDIS_URL[:30]}...")
    except Exception as e:
        logger.warning(f"⚠️  Redis import failed — search disabled: {e}")
else:
    logger.info("ℹ️  No REDIS_URL set — SearchEngine running in no-op mode")


class SearchEngine:
    """
    Inverted-index agent search backed by Redis.
    Gracefully no-ops if Redis is unavailable so the rest of the
    app continues to function without a cache layer.
    """

    @staticmethod
    async def index_agent(did: str, capabilities: List[str]):
        if not redis_client:
            return
        try:
            async with redis_client.pipeline() as pipe:
                pipe.hset(f"agent:{did}", mapping={"last_seen": "now"})
                for cap in capabilities:
                    pipe.sadd(f"idx:{cap.lower()}", did)
                await pipe.execute()
        except Exception as e:
            logger.warning(f"⚠️  Redis index_agent failed: {e}")

    @staticmethod
    async def search(capability: str, limit: int = 10) -> List[dict]:
        if not redis_client:
            return []
        try:
            dids = await redis_client.smembers(f"idx:{capability.lower()}")
            if not dids:
                return []
            results = []
            for did in list(dids)[:limit]:
                data = await redis_client.hgetall(f"agent:{did}")
                if data:
                    data["did"] = did
                    results.append(data)
            return results
        except Exception as e:
            logger.warning(f"⚠️  Redis search failed: {e}")
            return []

    @staticmethod
    async def remove_agent(did: str, capabilities: List[str]):
        if not redis_client:
            return
        try:
            for cap in capabilities:
                await redis_client.srem(f"idx:{cap.lower()}", did)
        except Exception as e:
            logger.warning(f"⚠️  Redis remove_agent failed: {e}")
