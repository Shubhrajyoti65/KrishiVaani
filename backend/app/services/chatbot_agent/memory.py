"""
KrishiVaani — Chat Session Memory Manager
Uses LangChain v0.3+ InMemoryChatMessageHistory for per-session conversation history.
"""
from typing import Dict
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage

# In-memory session store: { session_id: InMemoryChatMessageHistory }
_session_store: Dict[str, InMemoryChatMessageHistory] = {}
MAX_SESSIONS = 500  # cap to avoid unbounded memory growth


def get_history(session_id: str) -> InMemoryChatMessageHistory:
    """Return existing history for session_id, or create a new one."""
    if session_id not in _session_store:
        if len(_session_store) >= MAX_SESSIONS:
            oldest = next(iter(_session_store))
            del _session_store[oldest]
        _session_store[session_id] = InMemoryChatMessageHistory()
    return _session_store[session_id]


def save_exchange(session_id: str, human_msg: str, ai_msg: str) -> None:
    """Save a human/AI exchange to the session history."""
    history = get_history(session_id)
    history.add_message(HumanMessage(content=human_msg))
    history.add_message(AIMessage(content=ai_msg))


def get_messages(session_id: str) -> list:
    """Return the list of messages for a session."""
    return get_history(session_id).messages


def clear_memory(session_id: str) -> None:
    """Clear conversation history for a session."""
    if session_id in _session_store:
        del _session_store[session_id]


def list_sessions() -> list:
    return list(_session_store.keys())
