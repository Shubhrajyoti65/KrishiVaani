from fastapi import APIRouter, HTTPException, status
from backend.app.services.crop_recommendation.schema import (
    CropRecommendationRequest,
    CropRecommendationResponse,
)
from backend.app.services.crop_recommendation.model import crop_engine

router = APIRouter(
    prefix="/crop-recommendation",
    tags=["Crop Recommendation Engine"]
)

@router.post(
    "/predict",
    response_model=CropRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict optimal crop for soil & climate profile",
    description="Accepts Nitrogen, Phosphorus, Potassium (NPK), Temperature, Humidity, pH, and Rainfall inputs and returns top recommended crops with confidence score and agronomic advisory."
)
async def predict_crop(request: CropRecommendationRequest) -> CropRecommendationResponse:
    try:
        recommendation = crop_engine.predict(request)
        return recommendation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Crop recommendation prediction failed: {str(e)}"
        )
