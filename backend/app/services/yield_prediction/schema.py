from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class YieldPredictionRequest(BaseModel):
    crop: str = Field(..., description="Crop name (e.g. rice, wheat, maize, cotton, chickpea, sugarcane)")
    state: str = Field(..., description="Indian State name")
    season: str = Field(..., description="Cropping season (Kharif, Rabi, Zaid, Whole Year)")
    area_acres: float = Field(..., gt=0, le=1000, description="Total land area for this crop in acres")
    nitrogen: float = Field(..., ge=0, le=300, description="Nitrogen input (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=300, description="Phosphorus input (kg/ha)")
    potassium: float = Field(..., ge=0, le=300, description="Potassium input (kg/ha)")
    rainfall: float = Field(..., ge=0, le=2000, description="Seasonal rainfall in mm")
    temperature: float = Field(..., ge=0, le=60, description="Average temperature in Celsius")

    model_config = {
        "json_schema_extra": {
            "example": {
                "crop": "rice",
                "state": "Odisha",
                "season": "Kharif",
                "area_acres": 5.0,
                "nitrogen": 90.0,
                "phosphorus": 45.0,
                "potassium": 40.0,
                "rainfall": 1200.0,
                "temperature": 27.5
            }
        }
    }

class RevenueEstimate(BaseModel):
    estimated_msp_per_quintal_inr: float
    min_total_revenue_inr: float
    max_total_revenue_inr: float

class YieldPredictionResponse(BaseModel):
    crop: str
    season: str
    area_acres: float
    predicted_yield_per_acre_quintals: float
    total_expected_yield_quintals: float
    revenue_estimate: RevenueEstimate
    risk_assessment: List[str]
    yield_optimization_tips: List[str]
