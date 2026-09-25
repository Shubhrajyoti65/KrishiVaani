from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class SatelliteMonitoringRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Farm center latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Farm center longitude")
    farm_name: Optional[str] = Field(None, description="Optional farm plot designation")
    buffer_meters: Optional[int] = Field(500, ge=50, le=5000, description="Radius buffer for plot analysis in meters")

    model_config = {
        "json_schema_extra": {
            "example": {
                "latitude": 20.4625,
                "longitude": 85.8830,
                "farm_name": "Plot #4 - North Field",
                "buffer_meters": 500
            }
        }
    }

class NDVIMetrics(BaseModel):
    mean_ndvi: float
    max_ndvi: float
    min_ndvi: float
    canopy_health_status: str  # Excellent, Moderate, Stressed, Low/Bare Soil
    water_stress_index_ndwi: float

class NDVIHistoricalPoint(BaseModel):
    date: str
    ndvi_value: float

class SatelliteMonitoringResponse(BaseModel):
    farm_name: Optional[str] = None
    location_coords: Dict[str, float]
    satellite_constellation: str
    last_satellite_pass_date: str
    ndvi_metrics: NDVIMetrics
    historical_trend_30d: List[NDVIHistoricalPoint]
    canopy_advisories: List[str]
