import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.chatbot_agent.schema import ChatRequest
from backend.app.services.chatbot_agent.agent import chatbot_agent

client = TestClient(app)

@pytest.mark.anyio
async def test_chatbot_weather_tool_trigger():
    req = ChatRequest(message="What is the weather forecast and temperature in Cuttack?", district="Cuttack", state="Odisha")
    res = await chatbot_agent.process_chat(req)
    assert "Weather Update" in res.reply
    tool_names = [t.tool_name for t in res.tools_invoked]
    assert "get_weather_advisory_tool" in tool_names

@pytest.mark.anyio
async def test_chatbot_crop_recommendation_tool_trigger():
    req = ChatRequest(message="What crop should I grow in my soil with high rainfall?")
    res = await chatbot_agent.process_chat(req)
    assert "Crop Recommendation" in res.reply
    tool_names = [t.tool_name for t in res.tools_invoked]
    assert "recommend_crop_tool" in tool_names

@pytest.mark.anyio
async def test_chatbot_yield_prediction_tool_trigger():
    req = ChatRequest(message="How much yield and revenue can I expect from rice harvest?")
    res = await chatbot_agent.process_chat(req)
    assert "Yield & Revenue Estimate" in res.reply
    tool_names = [t.tool_name for t in res.tools_invoked]
    assert "predict_yield_tool" in tool_names

@pytest.mark.anyio
async def test_chatbot_satellite_tool_trigger():
    req = ChatRequest(message="Show me the satellite ndvi canopy health index for my plot")
    res = await chatbot_agent.process_chat(req)
    assert "Satellite Field Monitoring" in res.reply
    tool_names = [t.tool_name for t in res.tools_invoked]
    assert "get_satellite_ndvi_tool" in tool_names

def test_chatbot_api_endpoint_success():
    payload = {
        "message": "Can you give me weather forecast and recommend crops for Odisha?",
        "district": "Cuttack",
        "state": "Odisha",
        "language": "en"
    }
    response = client.post("/api/v1/chatbot/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "tools_invoked" in data
    assert len(data["tools_invoked"]) > 0
