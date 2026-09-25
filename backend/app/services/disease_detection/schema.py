from pydantic import BaseModel, Field
from typing import List, Optional

class Base64ImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded string of crop leaf image")
    crop_hint: Optional[str] = Field(None, description="Optional hint for crop species (e.g. rice, potato, tomato, cotton)")

class DiseaseDetectionResponse(BaseModel):
    crop_name: str
    disease_name: str
    is_healthy: bool
    confidence: float
    severity: str  # Healthy, Mild, Moderate, Severe
    symptoms: List[str]
    organic_treatments: List[str]
    chemical_treatments: List[str]
    preventive_measures: List[str]
