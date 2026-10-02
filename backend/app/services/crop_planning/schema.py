"""
KrishiVaani — 3-Year Crop Planning & Soil Improvement Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CropPlanRequest(BaseModel):
    state: str = Field(..., description="Indian State")
    district: str = Field(..., description="District")
    current_season: str = Field("Kharif", description="Current season (Kharif, Rabi, Zaid)")
    has_actual_soil_test: bool = Field(False, description="Whether farmer provided actual laboratory soil test")
    nitrogen: Optional[float] = Field(None, ge=0, le=300, description="Nitrogen (kg/ha) if tested")
    phosphorus: Optional[float] = Field(None, ge=0, le=300, description="Phosphorus (kg/ha) if tested")
    potassium: Optional[float] = Field(None, ge=0, le=300, description="Potassium (kg/ha) if tested")
    ph: Optional[float] = Field(None, ge=3.0, le=11.0, description="Soil pH if tested")
    soil_type: Optional[str] = Field("Alluvial", description="Observed soil type")
    water_availability: str = Field("Canal", description="Canal, Borewell, Drip, Rain-fed")
    previous_crop: Optional[str] = Field("Rice", description="Previously harvested crop on this field")
    soil_improvement_goal: Optional[str] = Field("balanced_health", description="Goal: increase_organic_carbon, fix_nitrogen, reduce_salinity, balanced_health")

class YearPlanItem(BaseModel):
    year_label: str  # "Year 1 (Current Year)", "Year 2 (Next Year)", "Year 3 (Second Following Year)"
    season: str
    recommended_crop: str
    suitability_tier: str  # "High suitability", "Moderate suitability", "Low suitability"
    agronomic_rationale: str
    soil_compatibility: str
    water_requirement: str
    pest_disease_break_benefit: str
    expected_yield_estimate: str
    soil_impact: str

class SoilImprovementPlan(BaseModel):
    soil_profile_type: str  # "Farmer Laboratory Test" vs "Regional Estimate"
    nutrient_management: List[str]
    organic_matter_enhancement: List[str]
    crop_rotation_strategy: List[str]
    cover_crops_and_green_manure: List[str]
    residue_management: List[str]
    irrigation_optimization: List[str]
    soil_testing_recommendation: str

class CropPlanResponse(BaseModel):
    location: str
    soil_source_label: str  # "Recommendation based on your soil data" vs "Regional estimate"
    previous_crop: str
    three_year_plan: List[YearPlanItem]
    soil_improvement_plan: SoilImprovementPlan
    agronomic_summary: str
    disclaimer: str = (
        "Multi-year sequence planned using agronomic rotation rules and historical climate patterns. "
        "Adhere to local weather alerts for exact sowing dates."
    )
