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
@router.post(
    "/recommend",
    response_model=CropRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Recommend optimal crop for soil & climate profile (alias)"
)
async def predict_crop(request: CropRecommendationRequest) -> CropRecommendationResponse:
    try:
        weather_info = None
        if request.use_live_weather and (request.state or request.district or request.latitude is not None):
            try:
                from backend.app.services.weather_service.service import weather_service
                from backend.app.services.weather_service.schema import WeatherQuery
                loc_st = request.state or "Punjab"
                loc_dist = request.district or loc_st
                wq = WeatherQuery(
                    state=loc_st,
                    district=loc_dist,
                    latitude=request.latitude,
                    longitude=request.longitude
                )
                adv = await weather_service.get_weather_advisory(wq)
                if adv and adv.current:
                    request.temperature = adv.current.temperature_celsius
                    request.humidity = adv.current.humidity_percent
                    weather_info = {
                        "location": f"{adv.location.district}, {adv.location.state}",
                        "live_temperature": adv.current.temperature_celsius,
                        "live_humidity": adv.current.humidity_percent,
                        "condition": adv.current.weather_description,
                        "alerts": [a.headline for a in adv.active_alerts] if adv.active_alerts else []
                    }
            except Exception:
                pass

        recommendation = crop_engine.predict(request)
        if weather_info:
            recommendation.weather_context = weather_info
        return recommendation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Crop recommendation prediction failed: {str(e)}"
        )
