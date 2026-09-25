import json
from typing import Dict, Any, Optional
from langchain_core.tools import tool

from backend.app.services.crop_recommendation.model import crop_engine
from backend.app.services.crop_recommendation.schema import CropRecommendationRequest
from backend.app.services.yield_prediction.model import yield_engine
from backend.app.services.yield_prediction.schema import YieldPredictionRequest
from backend.app.services.weather_service.service import weather_service
from backend.app.services.weather_service.schema import WeatherQuery
from backend.app.services.disease_detection.model import disease_model
from backend.app.services.satellite_service.service import satellite_service
from backend.app.services.satellite_service.schema import SatelliteMonitoringRequest

@tool
def recommend_crop_tool(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float
) -> str:
    """Recommends optimal crop for soil NPK values, temperature, humidity, pH, and rainfall."""
    req = CropRecommendationRequest(
        nitrogen=nitrogen,
        phosphorus=phosphorus,
        potassium=potassium,
        temperature=temperature,
        humidity=humidity,
        ph=ph,
        rainfall=rainfall
    )
    res = crop_engine.predict(req)
    return res.model_dump_json()

@tool
def predict_yield_tool(
    crop: str,
    state: str,
    season: str,
    area_acres: float,
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    rainfall: float,
    temperature: float
) -> str:
    """Predicts crop yield in quintals per acre, total production, and MSP revenue estimate."""
    req = YieldPredictionRequest(
        crop=crop,
        state=state,
        season=season,
        area_acres=area_acres,
        nitrogen=nitrogen,
        phosphorus=phosphorus,
        potassium=potassium,
        rainfall=rainfall,
        temperature=temperature
    )
    res = yield_engine.predict(req)
    return res.model_dump_json()

@tool
async def get_weather_advisory_tool(district: str, state: str) -> str:
    """Fetches current weather, 5-day forecast, extreme weather alerts, and agromet advisories for location."""
    query = WeatherQuery(district=district, state=state)
    res = await weather_service.get_weather_advisory(query)
    return res.model_dump_json()

@tool
def detect_disease_tool(crop_hint: str, image_base64: str) -> str:
    """Diagnoses crop leaf disease from base64 image and provides organic and chemical remedies."""
    res = disease_model.analyze_base64(image_base64, crop_hint=crop_hint)
    return res.model_dump_json()

@tool
async def get_satellite_ndvi_tool(latitude: float, longitude: float) -> str:
    """Calculates Sentinel-2 satellite NDVI vegetation index and canopy health for farm coordinates."""
    req = SatelliteMonitoringRequest(latitude=latitude, longitude=longitude)
    res = await satellite_service.analyze_crop_health(req)
    return res.model_dump_json()

# List of all available tools
ALL_TOOLS = [
    recommend_crop_tool,
    predict_yield_tool,
    get_weather_advisory_tool,
    detect_disease_tool,
    get_satellite_ndvi_tool
]
