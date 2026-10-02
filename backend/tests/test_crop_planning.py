"""
Unit and Integration Tests for 3-Year Crop Planning Engine
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.crop_planning.planner import planner_engine
from backend.app.services.crop_planning.schema import CropPlanRequest

client = TestClient(app)

def test_crop_planner_direct_engine():
    req = CropPlanRequest(
        state="Punjab",
        district="Ludhiana",
        current_season="Kharif",
        previous_crop="Rice",
        water_availability="Canal",
        soil_type="Alluvial"
    )
    plan = planner_engine.generate_plan(req)
    assert plan is not None
    assert len(plan.three_year_plan) == 3
    assert "Regional estimate" in plan.soil_source_label
    assert any("Legume" in p.agronomic_rationale or "legume" in p.recommended_crop.lower() or "chickpea" in p.recommended_crop.lower() for p in plan.three_year_plan)
    assert len(plan.soil_improvement_plan.nutrient_management) > 0
    assert len(plan.soil_improvement_plan.cover_crops_and_green_manure) > 0

def test_crop_planner_with_farmer_soil_test():
    req = CropPlanRequest(
        state="Odisha",
        district="Cuttack",
        has_actual_soil_test=True,
        nitrogen=95.0,
        phosphorus=32.0,
        potassium=45.0,
        ph=6.2,
        soil_type="Laterite",
        previous_crop="Rice",
        soil_improvement_goal="increase_organic_carbon"
    )
    plan = planner_engine.generate_plan(req)
    assert "Recommendation based on your soil data" in plan.soil_source_label
    assert plan.soil_improvement_plan.soil_profile_type == "Farmer Laboratory Soil Test"
    org_matter_str = " ".join(plan.soil_improvement_plan.organic_matter_enhancement).lower()
    assert "carbon" in org_matter_str or "manure" in org_matter_str

def test_crop_planner_api_endpoint():
    payload = {
        "state": "Maharashtra",
        "district": "Pune",
        "current_season": "Kharif",
        "previous_crop": "Cotton",
        "water_availability": "Borewell",
        "soil_type": "Black Cotton Soil"
    }
    response = client.post("/api/v1/crop-planning/plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "three_year_plan" in data
    assert len(data["three_year_plan"]) == 3
    assert "soil_improvement_plan" in data
