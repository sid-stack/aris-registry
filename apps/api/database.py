import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "aris_registry"

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        if not MONGODB_URI:
             raise ValueError("MONGODB_URI is not set in environment variables")
        self.client = AsyncIOMotorClient(MONGODB_URI)
        print("Connected to MongoDB Atlas")
        redis_client.connect()

    async def close(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB Atlas")
            await redis_client.close()

    def get_db(self):
        return self.client[DB_NAME]

db = Database()

async def get_database():
    return db.get_db()

import redis.asyncio as redis

class RedisClient:
    client: redis.Redis = None

    def connect(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client = redis.from_url(redis_url, decode_responses=True)
        print(f"Connected to Redis at {redis_url}")

    async def close(self):
        if self.client:
            await self.client.close()
            print("Disconnected from Redis")

redis_client = RedisClient()

