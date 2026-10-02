"""
Unit and Integration Tests for Production Cost & Gross Return Calculator
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.production_cost.calculator import cost_calculator
from backend.app.services.production_cost.schema import ProductionCostRequest

client = TestClient(app)

def test_production_cost_calculator_benchmarks():
    req = ProductionCostRequest(
        crop="Wheat",
        state="Punjab",
        season="Rabi",
        area_acres=2.0
    )
    res = cost_calculator.calculate_cost_and_returns(req)
    assert res is not None
    assert res.total_production_cost_inr > 0
    assert res.cost_per_acre_inr > 0
    assert res.estimated_revenue_inr > 0
    assert res.estimated_gross_return_inr is not None
    assert len(res.cost_breakdown) >= 7
    # All benchmark items should be tagged Estimated
    assert all(item.source_tag == "Estimated" for item in res.cost_breakdown)

def test_production_cost_calculator_user_override():
    req = ProductionCostRequest(
        crop="Rice",
        state="Odisha",
        season="Kharif",
        area_acres=3.0,
        seed_cost_inr=3500.0,
        fertilizer_cost_inr=9000.0,
        labour_cost_inr=15000.0,
        expected_yield_quintals_per_acre=22.0,
        expected_selling_price_per_quintal_inr=2200.0
    )
    res = cost_calculator.calculate_cost_and_returns(req)
    assert res.total_production_cost_inr > (3500.0 + 9000.0 + 15000.0)
    # Check user-entered tags
    user_items = [item for item in res.cost_breakdown if item.source_tag == "User-entered"]
    assert len(user_items) == 3
    # Check revenue & gross return
    expected_prod = 3.0 * 22.0
    expected_rev = expected_prod * 2200.0
    assert abs(res.estimated_revenue_inr - expected_rev) < 0.01
    assert abs(res.estimated_gross_return_inr - (res.estimated_revenue_inr - res.total_production_cost_inr)) < 0.01

def test_production_cost_api_endpoint():
    payload = {
        "crop": "Cotton",
        "state": "Gujarat",
        "season": "Kharif",
        "area_acres": 5.0,
        "seed_cost_inr": 8000.0
    }
    response = client.post("/api/v1/production/calculate-cost", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "total_production_cost_inr" in data
    assert data["total_production_cost_inr"] > 0
    assert "cost_breakdown" in data
    assert len(data["cost_breakdown"]) > 0
