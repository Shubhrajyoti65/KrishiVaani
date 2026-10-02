"""
KrishiVaani — Production Cost API Router
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.services.production_cost.schema import (
    ProductionCostRequest, ProductionCostResponse
)
from backend.app.services.production_cost.calculator import cost_calculator

router = APIRouter(
    prefix="/production",
    tags=["Production Cost & Gross Return Calculator"]
)

@router.post(
    "/calculate-cost",
    response_model=ProductionCostResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate production cost, estimated revenue, and gross return",
    description="Deterministic operational cost calculation (Seeds, Fertilizer, Pesticides, Labour, Irrigation, Machinery, Transport, Other). Computes gross return = revenue - cost."
)
async def calculate_production_cost(req: ProductionCostRequest) -> ProductionCostResponse:
    try:
        return cost_calculator.calculate_cost_and_returns(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Production cost calculation failed: {str(e)}"
        )
