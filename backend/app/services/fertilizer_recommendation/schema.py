from pydantic import BaseModel, Field
from typing import List, Optional

class FertilizerRequest(BaseModel):
    crop: str = Field(..., description="Crop name (e.g. rice, wheat, cotton)")
    nitrogen: float = Field(..., ge=0, le=200, description="Current soil Nitrogen (kg/ha or ppm)")
    phosphorus: float = Field(..., ge=0, le=200, description="Current soil Phosphorus")
    potassium: float = Field(..., ge=0, le=300, description="Current soil Potassium")
    ph: Optional[float] = Field(None, ge=0, le=14, description="Soil pH")
    soil_type: str = Field("Alluvial", description="Soil type")
    state: str = Field("Punjab", description="Indian state")
    area_acres: float = Field(1.0, gt=0, description="Field area in acres (for total quantity)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "crop": "wheat",
                "nitrogen": 55, "phosphorus": 30, "potassium": 28,
                "ph": 7.2, "soil_type": "Alluvial", "state": "Punjab", "area_acres": 3.0
            }
        }
    }

class FertilizerDose(BaseModel):
    urea_kg_per_acre: float
    dap_kg_per_acre: float
    mop_kg_per_acre: float
    total_N_kg_per_acre: float
    total_P2O5_kg_per_acre: float
    total_K2O_kg_per_acre: float

class FertilizerResponse(BaseModel):
    crop: str
    soil_quality_assessed: str
    recommended_doses: FertilizerDose
    application_schedule: str
    organic_supplements: List[str]
    deficiency_symptoms: List[str]
    advisory: str
