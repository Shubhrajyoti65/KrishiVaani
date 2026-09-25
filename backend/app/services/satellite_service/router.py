from fastapi import APIRouter, HTTPException, status
from backend.app.services.satellite_service.schema import (
    SatelliteMonitoringRequest,
    SatelliteMonitoringResponse,
)
from backend.app.services.satellite_service.service import satellite_service

router = APIRouter(
    prefix="/satellite",
    tags=["Satellite Crop Health & NDVI Monitoring Engine"]
)

@router.post(
    "/ndvi",
    response_model=SatelliteMonitoringResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute Sentinel-2 Satellite NDVI & Crop Canopy Health",
    description="Calculates Normalized Difference Vegetation Index (NDVI) and Normalized Difference Water Index (NDWI) from Sentinel-2 multispectral satellite imagery for given farm coordinates."
)
async def analyze_satellite_ndvi(request: SatelliteMonitoringRequest) -> SatelliteMonitoringResponse:
    try:
        return await satellite_service.analyze_crop_health(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Satellite analysis failed: {str(e)}"
        )
