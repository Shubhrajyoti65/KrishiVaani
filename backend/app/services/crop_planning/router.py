"""
KrishiVaani — 3-Year Crop Planning API Router
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.services.crop_planning.schema import CropPlanRequest, CropPlanResponse
from backend.app.services.crop_planning.planner import planner_engine

router = APIRouter(
    prefix="/crop-planning",
    tags=["3-Year Crop Planning & Soil Health"]
)

@router.post(
    "/plan",
    response_model=CropPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 3-year crop rotation sequence and soil improvement plan",
    description="Creates a multi-year cropping sequence (Year 1, Year 2, Year 3) considering soil health, rotation rules, pest-break principles, and soil improvement guidelines."
)
async def generate_three_year_plan(req: CropPlanRequest) -> CropPlanResponse:
    try:
        return planner_engine.generate_plan(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Crop planning sequence generation failed: {str(e)}"
        )
