from pydantic import BaseModel
from typing import List

class RotationOption(BaseModel):
    crop: str
    reason: str
    soil_benefit: str
    soil_compatible: bool
    priority: int

class CropRotationResponse(BaseModel):
    previous_crop: str
    soil_type: str
    state: str
    recommended_next_crops: List[RotationOption]
    rotation_benefit: str
    general_advice: List[str]
