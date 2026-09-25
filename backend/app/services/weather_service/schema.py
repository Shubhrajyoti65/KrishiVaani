from pydantic import BaseModel, Field
from typing import List, Optional

class WeatherQuery(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude coordinate")
    district: Optional[str] = Field(None, description="District name (e.g. Cuttack, Ludhiana)")
    state: Optional[str] = Field(None, description="State name (e.g. Odisha, Punjab)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "latitude": 20.4625,
                "longitude": 85.8830,
                "district": "Cuttack",
                "state": "Odisha"
            }
        }
    }

class CurrentWeather(BaseModel):
    temperature_c: float
    feels_like_c: float
    humidity_percent: float
    wind_speed_kmh: float
    rainfall_mm: float
    condition: str
    icon_code: str

class DailyForecast(BaseModel):
    date: str
    min_temp_c: float
    max_temp_c: float
    humidity_percent: float
    rain_probability_percent: float
    rainfall_mm: float
    condition: str

class WeatherAlert(BaseModel):
    severity: str  # INFO, WARNING, CRITICAL
    alert_type: str  # HEATWAVE, HEAVY_RAINFALL, FROST, HIGH_WINDS, NORMAL
    title: str
    description: str
    farmer_actionable_advice: str

class WeatherAdvisoryResponse(BaseModel):
    location_name: str
    current: CurrentWeather
    forecast_5day: List[DailyForecast]
    active_alerts: List[WeatherAlert]
    agromet_advisories: List[str]
