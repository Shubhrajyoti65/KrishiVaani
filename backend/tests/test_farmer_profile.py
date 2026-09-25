import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

@pytest.fixture
def sample_farmer_payload():
    return {
        "phone_number": "+919876543210",
        "name": "Ramesh Kumar",
        "state": "Odisha",
        "district": "Cuttack",
        "village": "Banki",
        "soil_type": "Alluvial",
        "land_area_acres": 4.5,
        "preferred_language": "or"
    }

def test_create_and_get_farmer_profile(sample_farmer_payload):
    # 1. Create farmer
    res = client.post("/api/v1/farmers/", json=sample_farmer_payload)
    assert res.status_code == 201
    farmer_data = res.json()
    farmer_id = farmer_data["id"]
    assert farmer_data["name"] == "Ramesh Kumar"
    assert farmer_data["phone_number"] == "+919876543210"
    assert farmer_data["preferred_language"] == "or"

    # 2. Get farmer by ID
    get_res = client.get(f"/api/v1/farmers/{farmer_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == farmer_id

    # 3. Get farmer by Phone
    phone_res = client.get(f"/api/v1/farmers/phone/{sample_farmer_payload['phone_number']}")
    assert phone_res.status_code == 200
    assert phone_res.json()["id"] == farmer_id

def test_create_duplicate_phone_fails(sample_farmer_payload):
    # Second registration attempt with same phone
    res = client.post("/api/v1/farmers/", json=sample_farmer_payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]

def test_update_farmer_profile():
    # Fetch existing farmer
    get_res = client.get("/api/v1/farmers/phone/+919876543210")
    farmer_id = get_res.json()["id"]

    # Patch update
    update_payload = {
        "land_area_acres": 6.0,
        "preferred_language": "hi"
    }
    patch_res = client.patch(f"/api/v1/farmers/{farmer_id}", json=update_payload)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["land_area_acres"] == 6.0
    assert updated_data["preferred_language"] == "hi"

def test_soil_test_logging_and_history():
    # Fetch existing farmer
    get_res = client.get("/api/v1/farmers/phone/+919876543210")
    farmer_id = get_res.json()["id"]

    # Log soil test 1
    soil_payload1 = {
        "nitrogen": 85.0,
        "phosphorus": 40.0,
        "potassium": 45.0,
        "temperature": 25.0,
        "humidity": 80.0,
        "ph": 6.5,
        "rainfall": 210.0,
        "notes": "Pre-Kharif soil lab test"
    }
    st_res1 = client.post(f"/api/v1/farmers/{farmer_id}/soil-tests", json=soil_payload1)
    assert st_res1.status_code == 201
    st_data1 = st_res1.json()
    assert st_data1["farmer_id"] == farmer_id
    assert st_data1["nitrogen"] == 85.0

    # Log soil test 2
    soil_payload2 = {
        "nitrogen": 60.0,
        "phosphorus": 35.0,
        "potassium": 30.0,
        "temperature": 22.0,
        "humidity": 65.0,
        "ph": 6.8,
        "rainfall": 90.0,
        "notes": "Post-monsoon test"
    }
    st_res2 = client.post(f"/api/v1/farmers/{farmer_id}/soil-tests", json=soil_payload2)
    assert st_res2.status_code == 201

    # Fetch soil test history
    hist_res = client.get(f"/api/v1/farmers/{farmer_id}/soil-tests")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 2
    assert history[0]["notes"] == "Post-monsoon test"  # Most recent first

def test_nonexistent_farmer_returns_404():
    res = client.get("/api/v1/farmers/f_nonexistent123")
    assert res.status_code == 404

    soil_res = client.get("/api/v1/farmers/f_nonexistent123/soil-tests")
    assert soil_res.status_code == 404
