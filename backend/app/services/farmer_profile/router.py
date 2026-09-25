from fastapi import APIRouter, HTTPException, status
from typing import List
from backend.app.services.farmer_profile.schema import (
    FarmerProfileCreate,
    FarmerProfileUpdate,
    FarmerProfileResponse,
    SoilTestRecordCreate,
    SoilTestRecordResponse,
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
