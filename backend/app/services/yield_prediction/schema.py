"""
KrishiVaani — Yield Prediction Schemas
"""
from pydantic import BaseModel, Field, model_validator
from typing import List, Dict, Optional, Any

class RevenueEstimate(BaseModel):
    estimated_msp_per_quintal_inr: float
    min_total_revenue_inr: float
    max_total_revenue_inr: float

class YieldPredictionRequest(BaseModel):
    crop: str = Field(..., description="Crop name (e.g. rice, wheat, maize, cotton, chickpea, sugarcane)")
    state: Optional[str] = Field("Punjab", description="Indian State name")
    season: Optional[str] = Field("Kharif", description="Cropping season (Kharif, Rabi, Zaid, Whole Year)")
    area_acres: Optional[float] = Field(None, gt=0, le=1000, description="Total land area for this crop in acres")
    area: Optional[float] = Field(None, gt=0, le=1000, description="Alias for area_acres")

    # Optional soil & climate fields (filled with regional defaults if absent)
    nitrogen: Optional[float] = Field(None, ge=0, le=300, description="Nitrogen input (kg/ha)")
    phosphorus: Optional[float] = Field(None, ge=0, le=300, description="Phosphorus input (kg/ha)")
    potassium: Optional[float] = Field(None, ge=0, le=300, description="Potassium input (kg/ha)")
    rainfall: Optional[float] = Field(None, ge=0, le=3000, description="Seasonal rainfall in mm")
    temperature: Optional[float] = Field(None, ge=0, le=60, description="Average temperature in Celsius")

    # Optional farm context from frontend
    soil_quality: Optional[str] = Field(None, description="high, medium, low")
    irrigation: Optional[str] = Field(None, description="Canal, Drip, Sprinkler, Rain-fed, Borewell")

    @model_validator(mode="before")
    @classmethod
    def populate_area_and_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Map area -> area_acres if area_acres not provided
            if data.get("area_acres") is None and data.get("area") is not None:
                data["area_acres"] = float(data["area"])
            elif data.get("area_acres") is None:
                data["area_acres"] = 1.0

            # Default NPK & climate if omitted
            if data.get("nitrogen") is None:
                data["nitrogen"] = 80.0
            if data.get("phosphorus") is None:
                data["phosphorus"] = 40.0
            if data.get("potassium") is None:
                data["potassium"] = 40.0
            if data.get("rainfall") is None:
                data["rainfall"] = 800.0
            if data.get("temperature") is None:
                data["temperature"] = 26.0
            if not data.get("season"):
                data["season"] = "Kharif"
            if not data.get("state"):
                data["state"] = "Punjab"
        return data

class YieldPredictionResponse(BaseModel):
    crop: str
    season: str
    area_acres: float
    predicted_yield_per_acre_quintals: float
    total_expected_yield_quintals: float
    revenue_estimate: RevenueEstimate
    risk_assessment: List[str]
    yield_optimization_tips: List[str]

    # Enhanced unit & range fields
    estimated_yield: Optional[float] = None
    unit: str = "tonnes/hectare"
    estimated_range: Optional[Dict[str, float]] = None
    predicted_yield_tonnes_per_hectare: Optional[float] = None
