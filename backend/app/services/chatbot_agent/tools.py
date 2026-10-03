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


# ── Tool 9: Market Price (Alternative 1 — Cached APMC Mandi Data) ──────────────
@tool
def get_market_price_tool(crop: str, state: str) -> str:
    """Looks up current APMC mandi trading price for a crop in a state from the verified MongoDB Mandi cache. Returns modal price, min/max range, and statutory MSP comparison. Use when farmer asks about current crop price, mandi rate, or whether to sell now."""
    from backend.app.services.mandi_service.repository import (
        normalize_commodity_name,
        STATUTORY_MSP_RATES,
        _in_memory_mandi_prices,
        RAW_MANDI_SEED_DATA
    )

    norm_crop = normalize_commodity_name(crop) or crop.capitalize()
    state_clean = state.strip().lower() if state else ""

    # Search in-memory cache / seed records
    candidates = []
    pool = list(_in_memory_mandi_prices.values()) or RAW_MANDI_SEED_DATA
    for item in pool:
        if item["commodity"].lower() == norm_crop.lower():
            if state_clean and state_clean != "all" and item["state"].lower() == state_clean:
                candidates.insert(0, item)
            else:
                candidates.append(item)

    if candidates:
        rec = candidates[0]
        msp = STATUTORY_MSP_RATES.get(norm_crop, float(rec["min_price"]))
        modal = float(rec["modal_price"])
        diff = round(modal - msp, 2)
        status = "Above MSP" if diff > 0 else "Below MSP" if diff < 0 else "Equal to MSP"
        
        result = {
            "crop": norm_crop,
            "state": rec["state"],
            "district": rec.get("district", ""),
            "market": rec.get("market", "APMC Mandi"),
            "variety": rec.get("variety", "Common"),
            "current_modal_price_inr_per_quintal": modal,
            "min_price": float(rec["min_price"]),
            "max_price": float(rec["max_price"]),
            "msp_benchmark_inr_per_quintal": msp,
            "price_vs_msp": f"{status} by ₹{abs(int(diff))}/qtl" if diff != 0 else "Equal to MSP",
            "recommendation": (
                f"✅ Market rate (₹{int(modal)}/qtl) is above MSP by ₹{int(diff)}/qtl — favorable time to sell in open APMC mandi."
                if diff > 0 else
                f"⚠️ Market rate (₹{int(modal)}/qtl) is below MSP — consider selling at FCI/APMC purchase centers for guaranteed ₹{int(msp)}/qtl."
            ),
            "source": "MongoDB Mandi Cache (Alternative 1 — APMC Feed)"
        }
        return json.dumps(result)

    # Fallback to statutory MSP table
    msp = STATUTORY_MSP_RATES.get(norm_crop, 2275.0)
    return json.dumps({
        "crop": norm_crop,
        "state": state,
        "msp_benchmark_inr_per_quintal": msp,
        "status_vs_msp": "Statutory Floor Rate",
        "recommendation": f"Government guaranteed MSP floor is ₹{int(msp)}/quintal. Sell through APMC/FCI procurement centers for guaranteed rate.",
        "source": "CCEA Statutory MSP Benchmark"
    })


# ── Tool 10: Agricultural RAG Knowledge Retrieval ─────────────────────────────
@tool
def query_agricultural_rag_tool(query: str, crop: Optional[str] = None, topic: Optional[str] = None) -> str:
    """Retrieves authoritative agricultural guidelines from ICAR, CIBRC, and State Agricultural Universities on disease management, pest control, crop practices, soil health, and pesticide safety. ALWAYS use this tool before answering questions about pesticide recommendations, crop diseases, or soil improvement."""
    from backend.app.services.agricultural_rag.retriever import agri_rag
    citations = agri_rag.retrieve(query=query, crop=crop, topic=topic, top_k=3)
    return agri_rag.format_grounded_context(citations)


# ── Tool 11: 3-Year Crop Planning & Rotation ──────────────────────────────────
@tool
def generate_three_year_crop_plan_tool(
    state: str,
    district: str,
    current_season: str = "Kharif",
    previous_crop: str = "Rice"
) -> str:
    """Generates a complete 3-Year Crop Rotation Sequence (Year 1, Year 2, Year 3) and Soil Improvement Plan based on local soil norms, legume-nitrogen rotation principles, and pest break strategies."""
    from backend.app.services.crop_planning.planner import planner_engine
    from backend.app.services.crop_planning.schema import CropPlanRequest
    req = CropPlanRequest(
        state=state, district=district, current_season=current_season,
        previous_crop=previous_crop
    )
    return planner_engine.generate_plan(req).model_dump_json()


# ── Tool 12: Production Cost & Returns Calculator ─────────────────────────────
@tool
def calculate_production_cost_tool(
    crop: str,
    state: str,
    area_acres: float = 1.0
) -> str:
    """Calculates operational farming production costs (seeds, fertilizer, pesticides, labour, irrigation, machinery, transport) and estimated gross return based on CACP/ICAR benchmarks. Use when farmer asks how much it costs to grow a crop or what return they can expect."""
    from backend.app.services.production_cost.calculator import cost_calculator
    from backend.app.services.production_cost.schema import ProductionCostRequest
    req = ProductionCostRequest(crop=crop, state=state, area_acres=area_acres)
    return cost_calculator.calculate_cost_and_returns(req).model_dump_json()


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
    query_agricultural_rag_tool,
    generate_three_year_crop_plan_tool,
    calculate_production_cost_tool,
]
