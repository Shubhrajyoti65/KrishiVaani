from pydantic import BaseModel
from typing import List

class CropCalendarResponse(BaseModel):
    crop: str
    state: str
    season: str
    sowing_window: str
    transplanting: str
    harvesting_window: str
    duration_days: int
    agronomic_tips: List[str]
    source: str
