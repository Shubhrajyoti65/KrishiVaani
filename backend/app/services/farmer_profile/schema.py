"""
KrishiVaani — Farmer Profile, Soil History & Farm Records Schemas
"""
from pydantic import BaseModel, Field, ConfigDict, model_validator, computed_field
from typing import Optional, List, Any
from datetime import datetime

class FarmerProfileCreate(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,12}$", description="Farmer mobile phone number")
    name: str = Field(..., min_length=2, max_length=100, description="Full name of farmer")
    state: str = Field(..., description="Indian State (e.g. Odisha, Punjab, Maharashtra)")
    district: str = Field(..., description="District name")
    village: Optional[str] = Field(None, description="Village name")
    soil_type: str = Field(..., description="Primary soil type (e.g. Alluvial, Black Soil, Red Soil, Clay Loam)")
    land_area_acres: float = Field(default=1.0, gt=0, le=1000, description="Total farm land area in acres")
    preferred_language: str = Field("hi", description="Preferred language code (hi, en, or, etc.)")
    irrigation_source: Optional[str] = Field(None, description="Canal, Borewell, Drip, Sprinkler, Rain-fed")
    primary_crops: Optional[List[str]] = Field(default_factory=list, description="Primary crops cultivated")

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "farm_size_acres" in data and "land_area_acres" not in data:
                data["land_area_acres"] = data["farm_size_acres"]
        return data

    model_config = ConfigDict(
        extra="ignore",
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
    irrigation_source: Optional[str] = None
    primary_crops: Optional[List[str]] = None

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "farm_size_acres" in data and "land_area_acres" not in data:
                data["land_area_acres"] = data["farm_size_acres"]
        return data

    model_config = ConfigDict(extra="ignore")

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
    irrigation_source: Optional[str] = None
    primary_crops: Optional[List[str]] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(extra="ignore")

class SoilTestRecordCreate(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200)
    phosphorus: float = Field(..., ge=0, le=200)
    potassium: float = Field(..., ge=0, le=300)
    temperature: Optional[float] = Field(25.0, ge=0, le=60)
    humidity: Optional[float] = Field(65.0, ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: Optional[float] = Field(120.0, ge=0, le=1000)
    organic_carbon_percent: Optional[float] = Field(None, ge=0, le=10)
    electrical_conductivity: Optional[float] = Field(None, ge=0, le=10)
    lab_name: Optional[str] = None
    test_date: Optional[str] = None
    notes: Optional[str] = Field(None, description="Additional notes or crop intended")

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "recommendations" in data and not data.get("notes"):
                data["notes"] = data["recommendations"]
            if "temperature" not in data or data["temperature"] is None:
                data["temperature"] = 25.0
            if "humidity" not in data or data["humidity"] is None:
                data["humidity"] = 65.0
            if "rainfall" not in data or data["rainfall"] is None:
                data["rainfall"] = 120.0
        return data

    model_config = ConfigDict(extra="ignore")

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
    organic_carbon_percent: Optional[float] = None
    electrical_conductivity: Optional[float] = None
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    recorded_at: str

    model_config = ConfigDict(extra="ignore")

class FarmHistoryRecordCreate(BaseModel):
    year: int = Field(..., ge=1990, le=2030, description="Cropping Year")
    season: str = Field(..., description="Kharif, Rabi, Summer, Whole Year")
    crop: str = Field(..., description="Crop grown")
    area_acres: float = Field(..., gt=0)
    yield_obtained_quintals: float = Field(..., ge=0)
    production_cost_inr: Optional[float] = Field(None, ge=0)
    revenue_inr: Optional[float] = Field(None, ge=0)
    disease_experienced: Optional[str] = Field(None)
    soil_condition_note: Optional[str] = Field(None)

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "crop_name" in data and "crop" not in data:
                data["crop"] = data["crop_name"]
            if "yield_quintals" in data and "yield_obtained_quintals" not in data:
                data["yield_obtained_quintals"] = data["yield_quintals"]
            if "cost_incurred_inr" in data and "production_cost_inr" not in data:
                data["production_cost_inr"] = data["cost_incurred_inr"]
            if "gross_return_inr" in data and "revenue_inr" not in data:
                data["revenue_inr"] = data["gross_return_inr"]
            if "notes" in data and "soil_condition_note" not in data:
                data["soil_condition_note"] = data["notes"]
        return data

    model_config = ConfigDict(extra="ignore")

class FarmHistoryRecordResponse(BaseModel):
    id: str
    farmer_id: str
    year: int
    season: str
    crop: str
    area_acres: float
    yield_obtained_quintals: float
    yield_per_acre_quintals: float
    production_cost_inr: Optional[float] = None
    revenue_inr: Optional[float] = None
    disease_experienced: Optional[str] = None
    soil_condition_note: Optional[str] = None
    recorded_at: str

    @computed_field
    @property
    def crop_name(self) -> str:
        return self.crop

    @computed_field
    @property
    def yield_quintals(self) -> float:
        return self.yield_obtained_quintals

    @computed_field
    @property
    def net_profit_inr(self) -> Optional[float]:
        if self.revenue_inr is not None and self.production_cost_inr is not None:
            return round(self.revenue_inr - self.production_cost_inr, 2)
        return None

    model_config = ConfigDict(extra="ignore")

class FullFarmHistoryResponse(BaseModel):
    farmer_id: str
    farmer_name: str
    location: str
    total_area_acres: float
    soil_tests: List[SoilTestRecordResponse]
    crop_history: List[FarmHistoryRecordResponse]

    model_config = ConfigDict(extra="ignore")
