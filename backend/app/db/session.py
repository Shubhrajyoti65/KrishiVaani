import logging
from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
            # Ping connection to check availability
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.warning(f"Could not connect to live MongoDB at {settings.MONGODB_URL}: {e}")
            self.is_connected = False

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection.")

db_manager = DatabaseManager()
