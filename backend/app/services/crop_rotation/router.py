from fastapi import APIRouter
from backend.app.services.crop_rotation.schema import CropRotationResponse
from backend.app.services.crop_rotation.engine import get_rotation

router = APIRouter(prefix="/crop-rotation", tags=["Crop Rotation"])

@router.get("/", response_model=CropRotationResponse)
def recommend_rotation(
    previous_crop: str = "rice",
    soil_type: str = "Alluvial",
    state: str = "Punjab"
):
    """
    Get crop rotation recommendations based on the previous crop, soil type, and state.
    Returns ranked options with agronomic reasons and soil benefits.
    """
    return get_rotation(previous_crop, soil_type, state)
