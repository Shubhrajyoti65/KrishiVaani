from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import List, Dict, Optional, Any

class CropRecommendationRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200, description="Nitrogen content in soil (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=200, description="Phosphorus content in soil (kg/ha)")
    potassium: float = Field(..., ge=0, le=300, description="Potassium content in soil (kg/ha)")
    temperature: float = Field(..., ge=0, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity in %")
    ph: float = Field(..., ge=0, le=14, description="pH value of the soil")
    rainfall: float = Field(..., ge=0, le=1000, description="Rainfall in mm")

    # Location & Contextual parameters
    state: Optional[str] = Field(None, description="Indian State (e.g. Punjab, Odisha, Maharashtra)")
    region: Optional[str] = Field(None, description="Alias for state")
    district: Optional[str] = Field(None, description="District name")
    soil_type: Optional[str] = Field(None, description="Soil classification: Alluvial, Black, Red, Laterite, Sandy, Clay, Loamy")
    season: Optional[str] = Field(None, description="Target season: Kharif, Rabi, Zaid, Whole Year")
    use_live_weather: Optional[bool] = Field(False, description="Fetch live weather via Weather Service")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("state") and data.get("region"):
                data["state"] = data["region"]
        return data

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "nitrogen": 90.0,
                "phosphorus": 42.0,
                "potassium": 43.0,
                "temperature": 20.87,
                "humidity": 82.00,
                "ph": 6.50,
                "rainfall": 202.93,
                "state": "Punjab",
                "soil_type": "Alluvial",
                "season": "Kharif"
            }
        }
    )

class CropConfidence(BaseModel):
    crop: str
    confidence: float

class CropRecommendationResponse(BaseModel):
    primary_recommendation: str
    confidence: float
    top_recommendations: List[CropConfidence]
    soil_health_assessment: Dict[str, str]
    advisory_notes: List[str]
    # Compatibility aliases for frontend components
    recommended_crop: Optional[str] = None
    top_alternatives: Optional[List[Dict[str, Any]]] = None
    suitability_tier: Optional[str] = "High suitability"
    agronomic_rationale: Optional[str] = None
    model_name: Optional[str] = "XGBoost Classifier"
    weather_context: Optional[Dict[str, Any]] = None
    soil_suitability_factor: Optional[str] = None
    season_compatibility: Optional[str] = None

    model_config = ConfigDict(extra="ignore")
