import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.crop_recommendation.schema import CropRecommendationRequest
from backend.app.services.crop_recommendation.model import crop_engine

client = TestClient(app)

def test_crop_engine_direct_prediction():
    # Valid high-rainfall profile typical for Rice
    req = CropRecommendationRequest(
        nitrogen=90.0,
        phosphorus=42.0,
        potassium=43.0,
        temperature=24.0,
        humidity=82.0,
        ph=6.5,
        rainfall=220.0
    )
    result = crop_engine.predict(req)
    assert result.primary_recommendation is not None
    assert isinstance(result.primary_recommendation, str)
    assert 0.0 <= result.confidence <= 1.0
    assert len(result.top_recommendations) == 3
    assert "Nitrogen" in result.soil_health_assessment
    assert "pH" in result.soil_health_assessment
    assert len(result.advisory_notes) > 0

def test_crop_recommendation_api_endpoint_success():
    payload = {
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "temperature": 20.87,
        "humidity": 82.00,
        "ph": 6.50,
        "rainfall": 202.93
    }
    response = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "primary_recommendation" in data
    assert "confidence" in data
    assert "top_recommendations" in data
    assert len(data["top_recommendations"]) == 3
    assert "soil_health_assessment" in data
    assert "advisory_notes" in data

def test_crop_recommendation_api_validation_error():
    # Invalid negative nitrogen input
    payload = {
        "nitrogen": -10.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "temperature": 20.87,
        "humidity": 82.00,
        "ph": 6.50,
        "rainfall": 202.93
    }
    response = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert response.status_code == 422  # Unprocessable Entity
