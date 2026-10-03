from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status
from backend.app.services.mandi_service.schema import (
    MandiQueryResponse,
    MandiPriceRecord,
    MandiSyncResponse,
)
from backend.app.services.mandi_service.repository import (
    mandi_repository,
    normalize_commodity_name,
    STATUTORY_MSP_RATES,
)

router = APIRouter(
    prefix="/mandi",
    tags=["APMC Mandi & Spot Prices (Alternative 1 — Cached)"]
)

@router.get(
    "/prices",
    response_model=MandiQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Query live APMC Mandi trading prices vs Statutory MSP",
    description="Returns prevailing modal prices across APMC mandis in India, compared against CCEA statutory MSP benchmarks."
)
async def get_mandi_prices(
    commodity: Optional[str] = Query(None, description="Commodity/Crop name (e.g. Wheat, Rice, Cotton, Mustard)"),
    state: Optional[str] = Query(None, description="State (e.g. Punjab, Haryana, Madhya Pradesh, Rajasthan)"),
    district: Optional[str] = Query(None, description="District name"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return")
) -> MandiQueryResponse:
    try:
        norm_comm = normalize_commodity_name(commodity)
        records = await mandi_repository.get_mandi_prices(
            commodity=norm_comm,
            state=state,
            district=district,
            limit=limit
        )

        statutory_msp = STATUTORY_MSP_RATES.get(norm_comm) if norm_comm else None

        # Build summary advisory
        if records:
            above_count = sum(1 for r in records if r.status_vs_msp == "Above MSP")
            total = len(records)
            if above_count == total:
                summary = f"All {total} reporting mandis are trading ABOVE the statutory MSP. Farmers are advised to sell directly in open APMC mandis."
            elif above_count > 0:
                summary = f"{above_count} of {total} mandis are trading above MSP. Compare local mandi rates against the ₹{statutory_msp}/qtl MSP floor before selling."
            else:
                summary = f"Reporting mandis are trading below or at MSP. Farmers are strongly advised to sell via government FCI/APMC MSP procurement centers."
        else:
            summary = "No active mandi trading records found for the specified filters."

        return MandiQueryResponse(
            total_records=len(records),
            matched_commodity=norm_comm,
            matched_state=state,
            records=records,
            statutory_msp_benchmark=statutory_msp,
            summary_advisory=summary,
            source="MongoDB Mandi Cache (Alternative 1 — APMC Feed)"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query mandi prices: {str(e)}"
        )

@router.get(
    "/commodities",
    response_model=List[str],
    summary="List all commodities tracked in the Mandi database"
)
async def get_commodities() -> List[str]:
    return await mandi_repository.get_all_commodities()

@router.get(
    "/states",
    response_model=List[str],
    summary="List all states tracked in the Mandi database"
)
async def get_states() -> List[str]:
    return await mandi_repository.get_all_states()

@router.post(
    "/sync",
    response_model=MandiSyncResponse,
    status_code=status.HTTP_200_OK,
    summary="Sync and refresh cached Mandi records"
)
async def sync_mandi_records() -> MandiSyncResponse:
    try:
        count = await mandi_repository.sync_mandi_prices()
        return MandiSyncResponse(
            status="success",
            records_indexed=count,
            timestamp=datetime.now(timezone.utc).isoformat(),
            message="Mandi records synchronized successfully."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync mandi records: {str(e)}"
        )
