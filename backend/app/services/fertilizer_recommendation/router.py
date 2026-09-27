from fastapi import APIRouter, HTTPException
from backend.app.services.fertilizer_recommendation.schema import FertilizerRequest, FertilizerResponse
from backend.app.services.fertilizer_recommendation.engine import fertilizer_engine

router = APIRouter(prefix="/fertilizer", tags=["Fertilizer Recommendation"])

@router.post("/recommend", response_model=FertilizerResponse)
def recommend_fertilizer(request: FertilizerRequest):
    """
    Get ICAR-based fertilizer dose recommendation for your crop.
    Returns Urea / DAP / MOP quantities per acre with application schedule.
    """
    try:
        return fertilizer_engine.recommend(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
