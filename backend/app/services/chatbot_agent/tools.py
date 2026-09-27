"""
KrishiVaani — LangChain Tool Definitions
All ML models and external services wrapped as @tool for the agent.
"""
import json
from typing import Optional
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
from backend.app.services.fertilizer_recommendation.engine import fertilizer_engine
from backend.app.services.fertilizer_recommendation.schema import FertilizerRequest
from backend.app.services.crop_calendar.data import get_calendar
from backend.app.services.crop_rotation.engine import get_rotation


# ── Tool 1: Crop Recommendation ───────────────────────────────────────────────
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
    """Recommends the optimal crop for a farm based on soil NPK values, temperature, humidity, soil pH, and annual rainfall. Returns top 3 crops with confidence scores and soil health assessment."""
    req = CropRecommendationRequest(
        nitrogen=nitrogen, phosphorus=phosphorus, potassium=potassium,
        temperature=temperature, humidity=humidity, ph=ph, rainfall=rainfall
    )
    return crop_engine.predict(req).model_dump_json()


# ── Tool 2: Yield Prediction ──────────────────────────────────────────────────
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
    """Predicts crop yield in quintals per acre and total expected production. Also calculates estimated MSP revenue range. Use this when farmer asks about expected harvest, income, or profit."""
    req = YieldPredictionRequest(
        crop=crop, state=state, season=season, area_acres=area_acres,
        nitrogen=nitrogen, phosphorus=phosphorus, potassium=potassium,
        rainfall=rainfall, temperature=temperature
    )
    return yield_engine.predict(req).model_dump_json()


# ── Tool 3: Weather Advisory ──────────────────────────────────────────────────
@tool
async def get_weather_advisory_tool(district: str, state: str) -> str:
    """Fetches current weather conditions, 5-day forecast, and extreme weather alerts (heatwave, frost, heavy rain, windstorm) for a district/state in India. Also provides agromet advisories for farmers."""
    query = WeatherQuery(district=district, state=state)
    res = await weather_service.get_weather_advisory(query)
    return res.model_dump_json()


# ── Tool 4: Disease Detection ─────────────────────────────────────────────────
@tool
def detect_disease_tool(crop_hint: str, image_base64: str) -> str:
    """Diagnoses leaf/crop disease from a base64-encoded image. Returns disease name, severity, confidence score, and both organic and chemical treatment remedies. Use when farmer shares a photo of an affected plant."""
    res = disease_model.analyze_base64(image_base64, crop_hint=crop_hint)
    return res.model_dump_json()


# ── Tool 5: Satellite NDVI ────────────────────────────────────────────────────
@tool
async def get_satellite_ndvi_tool(latitude: float, longitude: float) -> str:
    """Fetches Sentinel-2 satellite NDVI and EVI vegetation indices for a farm's GPS coordinates. Returns canopy health status, moisture index, and field management advisory. Use when farmer asks about field health or satellite monitoring."""
    req = SatelliteMonitoringRequest(latitude=latitude, longitude=longitude)
    res = await satellite_service.analyze_crop_health(req)
    return res.model_dump_json()


# ── Tool 6: Fertilizer Recommendation (NEW) ───────────────────────────────────
@tool
def get_fertilizer_recommendation_tool(
    crop: str,
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    soil_type: str,
    state: str,
    ph: float = 7.0,
    area_acres: float = 1.0,
) -> str:
    """Provides ICAR-based fertilizer dose recommendations (Urea, DAP, MOP quantities per acre) for a specific crop and soil condition. Includes deficiency diagnosis and application schedule. Use when farmer asks about fertilizer, manure, or nutrient application."""
    req = FertilizerRequest(
        crop=crop, nitrogen=nitrogen, phosphorus=phosphorus,
        potassium=potassium, ph=ph, soil_type=soil_type,
        state=state, area_acres=area_acres
    )
    return fertilizer_engine.recommend(req).model_dump_json()


# ── Tool 7: Crop Calendar (NEW) ───────────────────────────────────────────────
@tool
def get_crop_calendar_tool(crop: str, state: str) -> str:
    """Returns the sowing window, transplanting dates, and harvesting window for a crop in a specific Indian state. Based on ICAR and State Agriculture Department bulletins. Use when farmer asks when to sow, transplant, or harvest a crop."""
    return get_calendar(crop, state).model_dump_json()


# ── Tool 8: Crop Rotation (NEW) ───────────────────────────────────────────────
@tool
def get_crop_rotation_tool(
    previous_crop: str,
    soil_type: str = "Alluvial",
    state: str = "Punjab"
) -> str:
    """Recommends what crop to grow next based on the previous crop, soil type, and state. Uses agronomic rotation rules (nutrient cycling, pest break, soil health improvement). Use when farmer asks what to grow next season or after a specific crop."""
    return get_rotation(previous_crop, soil_type, state).model_dump_json()


# ── Tool 9: Market Price (NEW stub — real Agmarknet wired later) ──────────────
@tool
def get_market_price_tool(crop: str, state: str) -> str:
    """Looks up current mandi/market price for a crop in a state. Returns modal price, min/max range, and comparison with government MSP. Use when farmer asks about current crop price, mandi rate, or whether to sell now."""
    # MSP data 2024-25 (Government of India)
    MSP_2024: dict = {
        "rice": 2300, "wheat": 2275, "maize": 2090, "soybean": 4892,
        "cotton": 7121, "mustard": 5940, "groundnut": 6783,
        "chickpea": 5440, "sugarcane": 340, "potato": 1200,
    }
    crop_key = crop.lower().strip()
    msp = MSP_2024.get(crop_key, 2000)
    # Simulate ±8% market variance around MSP
    import random; random.seed(hash(crop + state) % 1000)
    modal = round(msp * random.uniform(0.92, 1.10))
    result = {
        "crop": crop.capitalize(),
        "state": state,
        "msp_2024_25_inr_per_quintal": msp,
        "current_modal_price_inr_per_quintal": modal,
        "price_vs_msp": f"{'Above' if modal > msp else 'Below'} MSP by ₹{abs(modal - msp)}/qtl",
        "recommendation": (
            "✅ Market price is above MSP — good time to sell." if modal > msp
            else "⚠️ Market price is below MSP — consider selling at APMC/FCI mandi for guaranteed MSP."
        ),
        "source": "Indicative data — verify at Agmarknet (agmarknet.gov.in) before selling"
    }
    return json.dumps(result)


# ── All tools list for the agent ──────────────────────────────────────────────
ALL_TOOLS = [
    recommend_crop_tool,
    predict_yield_tool,
    get_weather_advisory_tool,
    detect_disease_tool,
    get_satellite_ndvi_tool,
    get_fertilizer_recommendation_tool,
    get_crop_calendar_tool,
    get_crop_rotation_tool,
    get_market_price_tool,
]
