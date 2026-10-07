import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.chatbot_agent.schema import ChatRequest
from backend.app.services.chatbot_agent.agent import chatbot_agent
from backend.app.services.gemini_chat import GeminiChatService

client = TestClient(app)

@pytest.mark.anyio
async def test_chatbot_context_enrichment():
    """Verify context assembly (weather, RAG guidelines, farmer profile)."""
    service = GeminiChatService()
    req = ChatRequest(
        message="What is the recommended fertilizer for wheat in alluvial soil?",
        district="Ludhiana",
        state="Punjab",
        soil_type="Alluvial"
    )
    farmer_ctx = await service._gather_farmer_context(req)
    assert farmer_ctx["state"] == "Punjab"
    assert farmer_ctx["district"] == "Ludhiana"
    assert farmer_ctx["soil_type"] == "Alluvial"

    rag_snippets = service._retrieve_rag_context(req.message, district="Ludhiana")
    assert isinstance(rag_snippets, list)

    block = service._format_context_block(farmer_ctx, "Sunny 25C", rag_snippets)
    assert "FARMER PROFILE & SOIL CONTEXT" in block
    assert "CURRENT WEATHER ADVISORY" in block

@pytest.mark.anyio
async def test_chatbot_direct_gemini_generation():
    """Verify direct Gemini generation produces genuine response."""
    req = ChatRequest(
        message="Which crop is suitable for clay soil in summer?",
        district="Cuttack",
        state="Odisha"
    )
    res = await chatbot_agent.process_chat(req)
    assert res.reply is not None
    assert len(res.reply) > 20
    assert res.session_id is not None
    # Ensure it's not the old static template
    assert "Best crop: **Jute** (99.3% confidence)" not in res.reply

@pytest.mark.anyio
async def test_chatbot_conversation_memory():
    """Verify multi-turn history continuity."""
    session_id = "test_memory_session_01"
    req1 = ChatRequest(message="I grow wheat in Karnal.", session_id=session_id)
    res1 = await chatbot_agent.process_chat(req1)
    assert res1.reply is not None

    req2 = ChatRequest(message="What pest should I look out for?", session_id=session_id)
    res2 = await chatbot_agent.process_chat(req2)
    assert res2.reply is not None
    # Must refer to wheat or agricultural pests
    assert any(term in res2.reply.lower() for term in ["wheat", "aphid", "rust", "pest", "termite", "armyworm", "crop"])

@pytest.mark.anyio
async def test_chatbot_invalid_key_raises_error():
    """Verify invalid key raises an explicit error and NEVER returns a fake answer."""
    service = GeminiChatService()
    with patch.object(service, "_get_api_keys", return_value=["INVALID_KEY_12345"]):
        with pytest.raises(Exception):
            await service.generate_response(
                user_message="Tell me about rice",
                history=[],
                context_block=""
            )

def test_chatbot_api_endpoint_success():
    """Verify POST /api/v1/chatbot/chat returns dynamic response with session_id."""
    payload = {
        "message": "What is the best sowing time for mustard?",
        "district": "Jaipur",
        "state": "Rajasthan",
        "language": "en"
    }
    response = client.post("/api/v1/chatbot/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 20
    assert "session_id" in data
    assert data["session_id"] is not None
