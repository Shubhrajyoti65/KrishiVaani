from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class CropRecommendationRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200, description="Nitrogen content in soil (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=200, description="Phosphorus content in soil (kg/ha)")
    potassium: float = Field(..., ge=0, le=300, description="Potassium content in soil (kg/ha)")
    temperature: float = Field(..., ge=0, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity in %")
    ph: float = Field(..., ge=0, le=14, description="pH value of the soil")
    rainfall: float = Field(..., ge=0, le=1000, description="Rainfall in mm")

    model_config = {
        "json_schema_extra": {
            "example": {
                "nitrogen": 90.0,
                "phosphorus": 42.0,
                "potassium": 43.0,
                "temperature": 20.87,
                "humidity": 82.00,
                "ph": 6.50,
                "rainfall": 202.93
            }
        }
    }

class CropConfidence(BaseModel):
    crop: str
    confidence: float

class CropRecommendationResponse(BaseModel):
    primary_recommendation: str
    confidence: float
    top_recommendations: List[CropConfidence]
    soil_health_assessment: Dict[str, str]
    advisory_notes: List[str]
