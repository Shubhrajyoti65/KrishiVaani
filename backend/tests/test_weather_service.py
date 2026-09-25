import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.weather_service.schema import WeatherQuery, CurrentWeather, DailyForecast
from backend.app.services.weather_service.service import weather_service

client = TestClient(app)

@pytest.mark.anyio
async def test_get_weather_advisory_normal():
    query = WeatherQuery(district="Cuttack", state="Odisha")
    res = await weather_service.get_weather_advisory(query)
    assert res.location_name == "Cuttack, Odisha"
    assert res.current.temperature_c > 0
    assert len(res.forecast_5day) == 5
    assert len(res.active_alerts) > 0
    assert len(res.agromet_advisories) > 0

@pytest.mark.anyio
async def test_weather_heatwave_alert():
    query = WeatherQuery(district="heatwave_zone", state="Rajasthan")
    res = await weather_service.get_weather_advisory(query)
    alert_types = [a.alert_type for a in res.active_alerts]
    assert "HEATWAVE" in alert_types

@pytest.mark.anyio
async def test_weather_frost_alert():
    query = WeatherQuery(district="frost_valley", state="Himachal Pradesh")
    res = await weather_service.get_weather_advisory(query)
    alert_types = [a.alert_type for a in res.active_alerts]
    assert "FROST" in alert_types

def test_weather_api_get_current_endpoint():
    response = client.get("/api/v1/weather/current?district=Kendrapara&state=Odisha")
    assert response.status_code == 200
    data = response.json()
    assert data["location_name"] == "Kendrapara, Odisha"
    assert "current" in data
    assert "forecast_5day" in data
    assert len(data["forecast_5day"]) == 5

def test_weather_api_post_advisory_endpoint():
    payload = {
        "district": "Ludhiana",
        "state": "Punjab",
        "latitude": 30.9010,
        "longitude": 75.8573
    }
    response = client.post("/api/v1/weather/advisory", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "current" in data
    assert "active_alerts" in data
    assert "agromet_advisories" in data
