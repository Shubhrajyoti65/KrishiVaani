import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.mandi_service.repository import (
    mandi_repository,
    normalize_commodity_name,
    STATUTORY_MSP_RATES,
)

client = TestClient(app)

def test_commodity_normalization():
    assert normalize_commodity_name("gehun") == "Wheat"
    assert normalize_commodity_name("paddy") == "Rice"
    assert normalize_commodity_name("sarson") == "Mustard"
    assert normalize_commodity_name("chana") == "Chickpea"
    assert normalize_commodity_name("kapas") == "Cotton"
    assert normalize_commodity_name("makka") == "Maize"

@pytest.mark.anyio
async def test_mandi_repository_direct_query():
    # Query Wheat in Punjab
    wheat_pb = await mandi_repository.get_mandi_prices(commodity="Wheat", state="Punjab")
    assert len(wheat_pb) >= 1
    rec = wheat_pb[0]
    assert rec.commodity == "Wheat"
    assert rec.state == "Punjab"
    assert rec.modal_price >= 2275.0
    assert rec.statutory_msp == 2275.0

    # Query Cotton in Gujarat
    cotton_gj = await mandi_repository.get_mandi_prices(commodity="Cotton", state="Gujarat")
    assert len(cotton_gj) >= 1
    assert cotton_gj[0].commodity == "Cotton"
    assert cotton_gj[0].state == "Gujarat"

    # Query Mustard in Rajasthan
    mustard_rj = await mandi_repository.get_mandi_prices(commodity="Mustard", state="Rajasthan")
    assert len(mustard_rj) >= 1
    assert mustard_rj[0].commodity == "Mustard"
    assert mustard_rj[0].statutory_msp == 5650.0

def test_mandi_api_endpoints():
    # 1. GET /api/v1/mandi/prices with commodity filter
    res = client.get("/api/v1/mandi/prices?commodity=wheat&state=Punjab")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] >= 1
    assert data["matched_commodity"] == "Wheat"
    assert data["statutory_msp_benchmark"] == 2275.0
    assert "records" in data
    first_record = data["records"][0]
    assert first_record["commodity"] == "Wheat"
    assert "modal_price" in first_record
    assert "status_vs_msp" in first_record

    # 2. GET /api/v1/mandi/commodities
    comm_res = client.get("/api/v1/mandi/commodities")
    assert comm_res.status_code == 200
    commodities = comm_res.json()
    assert "Wheat" in commodities
    assert "Rice" in commodities
    assert "Cotton" in commodities

    # 3. GET /api/v1/mandi/states
    states_res = client.get("/api/v1/mandi/states")
    assert states_res.status_code == 200
    states = states_res.json()
    assert "Punjab" in states
    assert "Gujarat" in states
    assert "Rajasthan" in states

    # 4. POST /api/v1/mandi/sync
    sync_res = client.post("/api/v1/mandi/sync")
    assert sync_res.status_code == 200
    assert sync_res.json()["status"] == "success"
    assert sync_res.json()["records_indexed"] >= 20

def test_chatbot_agent_market_price_tool():
    from backend.app.services.chatbot_agent.tools import get_market_price_tool
    import json

    # Test Wheat in Punjab
    result_str = get_market_price_tool.invoke({"crop": "wheat", "state": "Punjab"})
    result = json.loads(result_str)
    assert result["crop"] == "Wheat"
    assert result["state"] == "Punjab"
    assert "current_modal_price_inr_per_quintal" in result
    assert result["msp_benchmark_inr_per_quintal"] == 2275.0
    assert "recommendation" in result

    # Test Cotton in Gujarat
    cotton_str = get_market_price_tool.invoke({"crop": "cotton", "state": "Gujarat"})
    cotton_res = json.loads(cotton_str)
    assert cotton_res["crop"] == "Cotton"
    assert cotton_res["msp_benchmark_inr_per_quintal"] == 7121.0
