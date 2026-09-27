from fastapi import APIRouter
from backend.app.services.crop_calendar.schema import CropCalendarResponse
from backend.app.services.crop_calendar.data import get_calendar

STATES = [
    "Punjab","Haryana","Uttar Pradesh","Bihar","West Bengal","Odisha",
    "Andhra Pradesh","Tamil Nadu","Karnataka","Maharashtra","Gujarat",
    "Rajasthan","Madhya Pradesh","Assam","Jharkhand"
]
CROPS = ["rice","wheat","maize","cotton","mustard","sugarcane","potato",
         "soybean","chickpea","groundnut"]

router = APIRouter(prefix="/crop-calendar", tags=["Crop Calendar"])

@router.get("/", response_model=CropCalendarResponse)
def crop_calendar(crop: str = "rice", state: str = "Punjab"):
    """
    Get sowing, transplanting & harvesting windows for a crop in a given state.
    Sourced from ICAR / State Agriculture Department bulletins.
    """
    return get_calendar(crop, state)

@router.get("/crops")
def list_crops():
    return {"crops": CROPS}

@router.get("/states")
def list_states():
    return {"states": STATES}
