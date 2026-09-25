from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class FarmerProfileCreate(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,12}$", description="Farmer mobile phone number")
    name: str = Field(..., min_length=2, max_length=100, description="Full name of farmer")
    state: str = Field(..., description="Indian State (e.g. Odisha, Punjab, Maharashtra)")
    district: str = Field(..., description="District name")
    village: Optional[str] = Field(None, description="Village name")
    soil_type: str = Field(..., description="Primary soil type (e.g. Alluvial, Black Soil, Red Soil, Clay Loam)")
    land_area_acres: float = Field(..., gt=0, le=1000, description="Total farm land area in acres")
    preferred_language: str = Field("hi", description="Preferred language code (hi, en, or, etc.)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "phone_number": "+919876543210",
                "name": "Ramesh Kumar",
                "state": "Odisha",
                "district": "Cuttack",
                "village": "Banki",
                "soil_type": "Alluvial",
                "land_area_acres": 4.5,
                "preferred_language": "or"
            }
        }
    )

class FarmerProfileUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    soil_type: Optional[str] = None
    land_area_acres: Optional[float] = None
    preferred_language: Optional[str] = None

class FarmerProfileResponse(BaseModel):
    id: str
    phone_number: str
    name: str
    state: str
    district: str
    village: Optional[str] = None
    soil_type: str
    land_area_acres: float
    preferred_language: str
    created_at: str
    updated_at: str

class SoilTestRecordCreate(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200)
    phosphorus: float = Field(..., ge=0, le=200)
    potassium: float = Field(..., ge=0, le=300)
    temperature: float = Field(..., ge=0, le=60)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0, le=1000)
    notes: Optional[str] = Field(None, description="Additional notes or crop intended")

class SoilTestRecordResponse(BaseModel):
    id: str
    farmer_id: str
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    notes: Optional[str] = None
    recorded_at: str
