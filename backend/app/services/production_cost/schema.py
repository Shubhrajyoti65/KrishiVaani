"""
KrishiVaani — Production Cost Calculator Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class CostItem(BaseModel):
    category: str
    amount_inr: float
    source_tag: str  # "User-entered", "Estimated", "Historical"
    description: str

class ProductionCostRequest(BaseModel):
    crop: str = Field(..., description="Target crop")
    state: str = Field(..., description="Indian State")
    district: Optional[str] = Field(None, description="District")
    season: str = Field("Kharif", description="Cropping Season")
    area_acres: float = Field(..., gt=0, le=1000, description="Area in acres")
    expected_yield_quintals_per_acre: Optional[float] = Field(None, ge=0, description="Optional expected yield per acre")
    expected_selling_price_per_quintal_inr: Optional[float] = Field(None, ge=0, description="Optional expected selling price per quintal (INR)")

    # Operational input costs (optional — if omitted, regional ICAR CACP benchmarks are estimated)
    seed_cost_inr: Optional[float] = Field(None, ge=0)
    fertilizer_cost_inr: Optional[float] = Field(None, ge=0)
    pesticide_cost_inr: Optional[float] = Field(None, ge=0)
    labour_cost_inr: Optional[float] = Field(None, ge=0)
    irrigation_cost_inr: Optional[float] = Field(None, ge=0)
    machinery_cost_inr: Optional[float] = Field(None, ge=0)
    transportation_cost_inr: Optional[float] = Field(None, ge=0)
    other_cost_inr: Optional[float] = Field(None, ge=0)

class ProductionCostResponse(BaseModel):
    crop: str
    state: str
    season: str
    area_acres: float
    cost_breakdown: List[CostItem]
    total_production_cost_inr: float
    cost_per_acre_inr: float

    # Economics & Gross return
    expected_production_quintals: Optional[float] = None
    selling_price_per_quintal_inr: Optional[float] = None
    estimated_revenue_inr: Optional[float] = None
    estimated_gross_return_inr: Optional[float] = None
    cost_per_quintal_inr: Optional[float] = None
    profit_margin_percent: Optional[float] = None

    calculation_mode: str = "Deterministic Backend Arithmetic (No LLM Approximation)"
    disclaimer: str = "Default estimates based on ICAR/CACP Comprehensive Cost of Cultivation benchmarks. Actual costs vary with local input prices."
