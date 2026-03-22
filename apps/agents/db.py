"""MongoDB client for Pact agents backend."""

from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

_client: AsyncIOMotorClient | None = None
_db = None


def get_db():
    """Get the MongoDB database instance."""
    global _client, _db
    if _db is not None:
        return _db

    if not settings.mongodb_uri:
        return None

    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _db = _client.pact
    print(f"[MongoDB] Connected to pact database")
    return _db


async def close_db():
    """Close the MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        print("[MongoDB] Connection closed")
