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

    def close(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB Atlas")

    def get_db(self):
        return self.client[DB_NAME]

db = Database()

async def get_database():
    return db.get_db()
