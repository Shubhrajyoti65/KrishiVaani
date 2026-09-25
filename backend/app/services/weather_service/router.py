from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from backend.app.services.weather_service.schema import (
    WeatherQuery,
    WeatherAdvisoryResponse,
)
from backend.app.services.weather_service.service import weather_service

router = APIRouter(
    prefix="/weather",
    tags=["Weather & Agromet Advisory Service"]
)

@router.post(
    "/advisory",
    response_model=WeatherAdvisoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get weather forecast and farming advisories",
    description="Fetches current weather, 5-day daily forecast, extreme weather risk alerts (heatwave, frost, heavy rainfall, high winds), and actionable agromet advisories."
)
async def get_weather_advisory(query: WeatherQuery) -> WeatherAdvisoryResponse:
    try:
        return await weather_service.get_weather_advisory(query)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weather advisory service error: {str(e)}"
        )

@router.get(
    "/current",
    response_model=WeatherAdvisoryResponse,
    summary="Get current weather by district and state parameters"
)
async def get_current_weather(
    district: Optional[str] = Query(None, description="District name"),
    state: Optional[str] = Query(None, description="State name"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude")
) -> WeatherAdvisoryResponse:
    query = WeatherQuery(
        district=district,
        state=state,
        latitude=lat,
        longitude=lon
    )
    return await weather_service.get_weather_advisory(query)
