import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.satellite_service.schema import SatelliteMonitoringRequest
from backend.app.services.satellite_service.service import satellite_service

client = TestClient(app)

@pytest.mark.anyio
async def test_satellite_direct_service_analysis():
    req = SatelliteMonitoringRequest(
        latitude=20.4625,
        longitude=85.8830,
        farm_name="Block-A Paddy Field"
    )
    res = await satellite_service.analyze_crop_health(req)
    assert res.farm_name == "Block-A Paddy Field"
    assert res.location_coords["latitude"] == 20.4625
    assert 0.0 <= res.ndvi_metrics.mean_ndvi <= 1.0
    assert 0.0 <= res.ndvi_metrics.max_ndvi <= 1.0
    assert len(res.historical_trend_30d) == 6
    assert len(res.canopy_advisories) > 0

@pytest.mark.anyio
async def test_satellite_ndvi_ranges_and_history():
    req = SatelliteMonitoringRequest(
        latitude=30.9010,
        longitude=75.8573,
        buffer_meters=1000
    )
    res = await satellite_service.analyze_crop_health(req)
    metrics = res.ndvi_metrics
    assert metrics.min_ndvi <= metrics.mean_ndvi <= metrics.max_ndvi
    assert isinstance(metrics.canopy_health_status, str)
    assert len(metrics.canopy_health_status) > 0

def test_satellite_api_endpoint_success():
    payload = {
        "latitude": 20.4625,
        "longitude": 85.8830,
        "farm_name": "Test Farm",
        "buffer_meters": 500
    }
    response = client.post("/api/v1/satellite/ndvi", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "location_coords" in data
    assert "ndvi_metrics" in data
    assert "mean_ndvi" in data["ndvi_metrics"]
    assert "historical_trend_30d" in data
    assert len(data["historical_trend_30d"]) > 0

def test_satellite_api_validation_error():
    # Latitude out of bounds (> 90.0)
    payload = {
        "latitude": 120.0,
        "longitude": 85.8830
    }
    response = client.post("/api/v1/satellite/ndvi", json=payload)
    assert response.status_code == 422
