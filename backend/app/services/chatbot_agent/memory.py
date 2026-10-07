"""
KrishiVaani — Chat Session Memory & Persistence Manager
Stores conversation turns per session and farmer in MongoDB collection `chat_history`,
with an in-memory session cache for fast retrieval and offline fallback.
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from backend.app.db.session import db_manager

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'model'")
    content: str = Field(..., description="Message text")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# In-memory session store: { session_id: List[ChatMessage] }
_session_store: Dict[str, List[ChatMessage]] = {}
MAX_SESSIONS = 500


def get_history(session_id: str) -> List[ChatMessage]:
    """Return in-memory message history for session_id."""
    if session_id not in _session_store:
        if len(_session_store) >= MAX_SESSIONS:
            oldest = next(iter(_session_store))
            del _session_store[oldest]
        _session_store[session_id] = []
    return _session_store[session_id]


async def load_history_async(session_id: str, farmer_id: Optional[str] = None, limit: int = 10) -> List[ChatMessage]:
    """
    Load message history from MongoDB if connected, otherwise fallback to in-memory store.
    Returns the most recent `limit` messages in chronological order.
    """
    if db_manager.is_connected and db_manager.db is not None:
        try:
            query: Dict[str, Any] = {}
            if session_id:
                query["session_id"] = session_id
            elif farmer_id:
                query["farmer_id"] = farmer_id

            if query:
                cursor = db_manager.db["chat_history"].find(query).sort("timestamp", -1).limit(limit)
                docs = await cursor.to_list(length=limit)
                # Reverse to get chronological order (oldest to newest)
                docs.reverse()
                messages = [
                    ChatMessage(
                        role=d.get("role", "user"),
                        content=d.get("content", ""),
                        timestamp=d.get("timestamp", "")
                    )
                    for d in docs
                ]
                # Sync into in-memory store
                if session_id:
                    _session_store[session_id] = messages
                return messages
        except Exception:
            pass

    # Fallback to in-memory
    history = get_history(session_id)
    return history[-limit:]


def get_messages(session_id: str) -> List[ChatMessage]:
    """Synchronous accessor for in-memory messages."""
    return list(get_history(session_id))


async def save_exchange_async(session_id: str, human_msg: str, ai_msg: str, farmer_id: Optional[str] = None) -> None:
    """Save user and AI turns to both in-memory cache and MongoDB."""
    now_iso = datetime.now(timezone.utc).isoformat()
    u_msg = ChatMessage(role="user", content=human_msg, timestamp=now_iso)
    m_msg = ChatMessage(role="model", content=ai_msg, timestamp=now_iso)

    history = get_history(session_id)
    history.append(u_msg)
    history.append(m_msg)

    if db_manager.is_connected and db_manager.db is not None:
        try:
            await db_manager.db["chat_history"].insert_many([
                {
                    "session_id": session_id,
                    "farmer_id": farmer_id,
                    "role": "user",
                    "content": human_msg,
                    "timestamp": now_iso
                },
                {
                    "session_id": session_id,
                    "farmer_id": farmer_id,
                    "role": "model",
                    "content": ai_msg,
                    "timestamp": now_iso
                }
            ])
        except Exception:
            pass


def save_exchange(session_id: str, human_msg: str, ai_msg: str, farmer_id: Optional[str] = None) -> None:
    """Synchronous save to in-memory cache."""
    now_iso = datetime.now(timezone.utc).isoformat()
    history = get_history(session_id)
    history.append(ChatMessage(role="user", content=human_msg, timestamp=now_iso))
    history.append(ChatMessage(role="model", content=ai_msg, timestamp=now_iso))


def clear_memory(session_id: str) -> None:
    """Clear conversation history for a session."""
    if session_id in _session_store:
        del _session_store[session_id]


def list_sessions() -> List[str]:
    return list(_session_store.keys())
