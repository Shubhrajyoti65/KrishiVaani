from fastapi import APIRouter, HTTPException, status
from backend.app.services.yield_prediction.schema import (
    YieldPredictionRequest,
    YieldPredictionResponse,
)
from backend.app.services.yield_prediction.model import yield_engine

router = APIRouter(
    prefix="/yield-prediction",
    tags=["Crop Yield Prediction Engine"]
)

@router.post(
    "/predict",
    response_model=YieldPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict crop yield and estimated revenue",
    description="Predicts yield in quintals per acre, total production, MSP financial revenue estimate, and agronomic risk assessment for given farm parameters."
)
async def predict_yield(request: YieldPredictionRequest) -> YieldPredictionResponse:
    try:
        return yield_engine.predict(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Yield prediction computation failed: {str(e)}"
        )
