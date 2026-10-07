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
    assert any(term in res.reply.lower() for term in ["weather", "temperature", "cuttack", "humidity"])
    tool_names = [t.tool_name for t in res.tools_invoked]
    assert "get_weather_advisory_tool" in tool_names

@pytest.mark.anyio
async def test_chatbot_crop_recommendation_tool_trigger():
    req = ChatRequest(message="Recommend a crop for soil with 90 N, 45 P, 45 K, 25 temp, 80 humidity, 6.5 pH, 200 rainfall.")
    res = await chatbot_agent.process_chat(req)
    assert any(term in res.reply.lower() for term in ["crop", "recommend", "soil", "rice", "grow"])
    tool_names = [t.tool_name for t in res.tools_invoked]
    assert "recommend_crop_tool" in tool_names

@pytest.mark.anyio
async def test_chatbot_yield_prediction_tool_trigger():
    req = ChatRequest(
        message="Predict yield for rice in Punjab for 2 acres during Kharif season with 90 N, 40 P, 40 K, 1100 rainfall, 25 temperature.",
        state="Punjab"
    )
    res = await chatbot_agent.process_chat(req)
    assert any(term in res.reply.lower() for term in ["yield", "quintal", "harvest", "acre"])
    tool_names = [t.tool_name for t in res.tools_invoked]
    assert "predict_yield_tool" in tool_names

@pytest.mark.anyio
async def test_chatbot_satellite_tool_trigger():
    req = ChatRequest(message="Show me the satellite ndvi canopy health index for my plot at 28.6 lat, 77.2 lon")
    res = await chatbot_agent.process_chat(req)
    assert any(term in res.reply.lower() for term in ["ndvi", "satellite", "canopy", "health"])
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
