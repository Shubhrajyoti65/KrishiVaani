from pydantic import BaseModel, Field
from typing import Optional, List

class MandiPriceRecord(BaseModel):
    id: str = Field(..., description="Unique record identifier")
    commodity: str = Field(..., description="Crop/Commodity name (e.g., Wheat, Rice, Cotton, Mustard)")
    state: str = Field(..., description="State name (e.g., Punjab, Haryana, Madhya Pradesh)")
    district: str = Field(..., description="District name")
    market: str = Field(..., description="APMC Mandi name")
    variety: str = Field("Common", description="Commodity variety (e.g., Sharbati, Basmati, Desi)")
    min_price: float = Field(..., description="Minimum traded price in INR per Quintal")
    max_price: float = Field(..., description="Maximum traded price in INR per Quintal")
    modal_price: float = Field(..., description="Modal / prevailing trading price in INR per Quintal")
    statutory_msp: float = Field(..., description="Government CCEA statutory MSP for 2024-2026")
    price_vs_msp_diff: float = Field(..., description="Difference: modal_price - statutory_msp")
    status_vs_msp: str = Field(..., description="'Above MSP', 'Below MSP', or 'Equal to MSP'")
    advisory: str = Field(..., description="Actionable advisory on whether to sell in mandi or APMC/FCI")
    arrival_date: str = Field(..., description="Date of recording (YYYY-MM-DD)")
    source: str = Field("APMC Mandi & e-NAM Aggregator", description="Origin source")

class MandiQueryRequest(BaseModel):
    commodity: Optional[str] = Field(None, description="Crop or commodity to filter by")
    state: Optional[str] = Field(None, description="State to filter by")
    district: Optional[str] = Field(None, description="District to filter by")
    limit: int = Field(50, ge=1, le=200, description="Max records to return")

class MandiQueryResponse(BaseModel):
    total_records: int
    matched_commodity: Optional[str] = None
    matched_state: Optional[str] = None
    records: List[MandiPriceRecord]
    statutory_msp_benchmark: Optional[float] = None
    summary_advisory: str
    source: str = "MongoDB Mandi Cache (Alternative 1)"

class MandiSyncResponse(BaseModel):
    status: str
    records_indexed: int
    timestamp: str
    message: str
