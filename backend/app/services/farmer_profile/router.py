from fastapi import APIRouter, HTTPException, status
from typing import List
from backend.app.services.farmer_profile.schema import (
    FarmerProfileCreate,
    FarmerProfileUpdate,
    FarmerProfileResponse,
    SoilTestRecordCreate,
    SoilTestRecordResponse,
    FarmHistoryRecordCreate,
    FarmHistoryRecordResponse,
    FullFarmHistoryResponse,
)
from backend.app.services.farmer_profile.repository import farmer_repository

router = APIRouter(
    prefix="/farmers",
    tags=["Farmer Profile & Soil History"]
)

@router.post(
    "/",
    response_model=FarmerProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new farmer profile",
)
async def create_farmer_profile(profile: FarmerProfileCreate) -> FarmerProfileResponse:
    existing = await farmer_repository.get_farmer_by_phone(profile.phone_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Farmer with phone number {profile.phone_number} already registered."
        )
    return await farmer_repository.create_farmer(profile)

@router.get(
    "/{farmer_id}",
    response_model=FarmerProfileResponse,
    summary="Get farmer profile by ID"
)
async def get_farmer_profile(farmer_id: str) -> FarmerProfileResponse:
    farmer = await farmer_repository.get_farmer_by_id(farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    return farmer

@router.get(
    "/phone/{phone_number}",
    response_model=FarmerProfileResponse,
    summary="Get farmer profile by phone number"
)
async def get_farmer_by_phone(phone_number: str) -> FarmerProfileResponse:
    farmer = await farmer_repository.get_farmer_by_phone(phone_number)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with phone number '{phone_number}' not found."
        )
    return farmer

@router.patch(
    "/{farmer_id}",
    response_model=FarmerProfileResponse,
    summary="Update farmer profile"
)
async def update_farmer_profile(farmer_id: str, update: FarmerProfileUpdate) -> FarmerProfileResponse:
    updated = await farmer_repository.update_farmer(farmer_id, update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    return updated

@router.delete(
    "/{farmer_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a farmer profile and associated history"
)
async def delete_farmer_profile(farmer_id: str):
    deleted = await farmer_repository.delete_farmer(farmer_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    return {"status": "success", "message": f"Farmer profile '{farmer_id}' deleted successfully"}

@router.post(
    "/{farmer_id}/soil-tests",
    response_model=SoilTestRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a soil test record for a farmer"
)
async def add_soil_test(farmer_id: str, test: SoilTestRecordCreate) -> SoilTestRecordResponse:
    farmer = await farmer_repository.get_farmer_by_id(farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    return await farmer_repository.add_soil_test(farmer_id, test)

@router.get(
    "/{farmer_id}/soil-tests",
    response_model=List[SoilTestRecordResponse],
    summary="Get soil test history for a farmer"
)
async def get_soil_test_history(farmer_id: str) -> List[SoilTestRecordResponse]:
    farmer = await farmer_repository.get_farmer_by_id(farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    return await farmer_repository.get_farmer_soil_tests(farmer_id)

@router.post(
    "/{farmer_id}/farm-history",
    response_model=FarmHistoryRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a historical crop yield and production cost record for a farmer"
)
async def add_farm_history(farmer_id: str, record: FarmHistoryRecordCreate) -> FarmHistoryRecordResponse:
    farmer = await farmer_repository.get_farmer_by_id(farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    return await farmer_repository.add_farm_history_record(farmer_id, record)

@router.get(
    "/{farmer_id}/farm-history",
    response_model=List[FarmHistoryRecordResponse],
    summary="Get multi-year crop and yield history for a farmer"
)
async def get_farm_history(farmer_id: str) -> List[FarmHistoryRecordResponse]:
    farmer = await farmer_repository.get_farmer_by_id(farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    return await farmer_repository.get_farm_history(farmer_id)

@router.post(
    "/{farmer_id}/crops-history",
    response_model=FarmHistoryRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Alias: Log a historical crop record"
)
async def add_crops_history_alias(farmer_id: str, record: FarmHistoryRecordCreate) -> FarmHistoryRecordResponse:
    return await add_farm_history(farmer_id, record)

@router.get(
    "/{farmer_id}/crops-history",
    response_model=List[FarmHistoryRecordResponse],
    summary="Alias: Get multi-year crop history"
)
async def get_crops_history_alias(farmer_id: str) -> List[FarmHistoryRecordResponse]:
    return await get_farm_history(farmer_id)

@router.get(
    "/{farmer_id}/full-history",
    response_model=FullFarmHistoryResponse,
    summary="Get unified farmer history including profile, soil tests, and crop records"
)
async def get_full_farm_history(farmer_id: str) -> FullFarmHistoryResponse:
    farmer = await farmer_repository.get_farmer_by_id(farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer profile with ID '{farmer_id}' not found."
        )
    soil_tests = await farmer_repository.get_farmer_soil_tests(farmer_id)
    crop_hist = await farmer_repository.get_farm_history(farmer_id)

    return FullFarmHistoryResponse(
        farmer_id=farmer.id,
        farmer_name=farmer.name,
        location=f"{farmer.district}, {farmer.state}",
        total_area_acres=farmer.land_area_acres,
        soil_tests=soil_tests,
        crop_history=crop_hist
    )
