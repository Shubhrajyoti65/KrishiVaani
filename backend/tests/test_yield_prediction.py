import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.yield_prediction.schema import YieldPredictionRequest
from backend.app.services.yield_prediction.model import yield_engine

client = TestClient(app)

def test_yield_engine_direct_prediction():
    req = YieldPredictionRequest(
        crop="rice",
        state="Odisha",
        season="Kharif",
        area_acres=5.0,
        nitrogen=90.0,
        phosphorus=45.0,
        potassium=40.0,
        rainfall=1100.0,
        temperature=27.5
    )
    result = yield_engine.predict(req)
    assert result.crop == "rice"
    assert result.area_acres == 5.0
    assert result.predicted_yield_per_acre_quintals > 0.0
    assert result.total_expected_yield_quintals == round(result.predicted_yield_per_acre_quintals * 5.0, 2)
    assert result.revenue_estimate.estimated_msp_per_quintal_inr > 0.0
    assert result.revenue_estimate.min_total_revenue_inr < result.revenue_estimate.max_total_revenue_inr
    assert len(result.risk_assessment) > 0
    assert len(result.yield_optimization_tips) > 0

def test_yield_prediction_api_endpoint_success():
    payload = {
        "crop": "cotton",
        "state": "Maharashtra",
        "season": "Kharif",
        "area_acres": 10.0,
        "nitrogen": 110.0,
        "phosphorus": 50.0,
        "potassium": 45.0,
        "rainfall": 750.0,
        "temperature": 30.0
    }
    response = client.post("/api/v1/yield-prediction/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "cotton"
    assert data["predicted_yield_per_acre_quintals"] > 0
    assert data["total_expected_yield_quintals"] > 0
    assert "revenue_estimate" in data
    assert data["revenue_estimate"]["estimated_msp_per_quintal_inr"] == 7121.0
    assert "risk_assessment" in data

def test_yield_prediction_api_validation_error():
    # Invalid zero area acres
    payload = {
        "crop": "wheat",
        "state": "Punjab",
        "season": "Rabi",
        "area_acres": 0.0,  # Invalid: must be > 0
        "nitrogen": 100.0,
        "phosphorus": 50.0,
        "potassium": 40.0,
        "rainfall": 400.0,
        "temperature": 20.0
    }
    response = client.post("/api/v1/yield-prediction/predict", json=payload)
    assert response.status_code == 422
