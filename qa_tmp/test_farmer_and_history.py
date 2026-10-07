import time
import requests
import json
import os
import sys

sys.path.insert(0, os.path.abspath("."))
from pymongo import MongoClient

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 60)
print("TESTING ITEM 1 & 2: FARMER PROFILE & FARM HISTORY")
print("=" * 60)

# Connect directly to MongoDB to verify data in DB
from backend.app.core.config import settings
try:
    mongo_client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    db = mongo_client[settings.DATABASE_NAME]
    mongo_ok = True
    print(f"Direct MongoDB client connected to: {settings.DATABASE_NAME}")
except Exception as e:
    mongo_ok = False
    print(f"Direct MongoDB client connection failed: {e}")

# 1. Create Farmer Profile
test_phone = f"9988776655"
create_payload = {
    "name": "Ramesh Kumar QA",
    "phone_number": test_phone,
    "village": "Bhadrak Rural",
    "district": "Bhadrak",
    "state": "Odisha",
    "total_land_acres": 3.5,
    "soil_type": "Alluvial",
    "preferred_language": "hi",
    "primary_crops": ["Rice", "Mustard"]
}

t0 = time.time()
res = requests.post(f"{BASE_URL}/farmers/", json=create_payload)
t_create = time.time() - t0
print(f"\n1. POST /farmers/ status={res.status_code} in {t_create:.3f}s")
created_farmer = res.json()
print("   Response:", json.dumps(created_farmer, indent=2))
farmer_id = created_farmer.get("id") or created_farmer.get("farmer_id")

# Verify in MongoDB
if mongo_ok and farmer_id:
    from bson import ObjectId
    doc = db.farmers.find_one({"phone_number": test_phone})
    print(f"   MongoDB check (farmers collection): Found={doc is not None}, name={doc.get('name') if doc else None}")

# 2. Read Farmer Profile by ID
t0 = time.time()
res = requests.get(f"{BASE_URL}/farmers/{farmer_id}")
t_read = time.time() - t0
print(f"\n2. GET /farmers/{farmer_id} status={res.status_code} in {t_read:.3f}s")
print("   Response:", res.json())

# 3. Read Farmer Profile by Phone
t0 = time.time()
res = requests.get(f"{BASE_URL}/farmers/phone/{test_phone}")
t_phone = time.time() - t0
print(f"\n3. GET /farmers/phone/{test_phone} status={res.status_code} in {t_phone:.3f}s")
print("   Response:", res.json())

# 4. Update Farmer Profile (PATCH)
update_payload = {
    "total_land_acres": 4.5,
    "primary_crops": ["Rice", "Mustard", "Wheat"]
}
t0 = time.time()
res = requests.patch(f"{BASE_URL}/farmers/{farmer_id}", json=update_payload)
t_patch = time.time() - t0
print(f"\n4. PATCH /farmers/{farmer_id} status={res.status_code} in {t_patch:.3f}s")
print("   Response:", res.json())
if mongo_ok:
    doc = db.farmers.find_one({"phone_number": test_phone})
    print(f"   MongoDB check after patch: total_land_acres={doc.get('total_land_acres') if doc else None}")

# 5. Add Soil Test Entry
soil_payload = {
    "soil_type": "Alluvial",
    "nitrogen": 65.0,
    "phosphorus": 38.0,
    "potassium": 42.0,
    "ph": 6.8,
    "organic_carbon": 0.55
}
t0 = time.time()
res = requests.post(f"{BASE_URL}/farmers/{farmer_id}/soil-tests", json=soil_payload)
t_soil = time.time() - t0
print(f"\n5. POST /farmers/{farmer_id}/soil-tests status={res.status_code} in {t_soil:.3f}s")
print("   Response:", res.json())

# 6. Add Farm History Entry
history_payload = {
    "crop": "Rice",
    "variety": "Swarna",
    "season": "Kharif",
    "year": 2025,
    "area_acres": 3.0,
    "yield_obtained_qtl": 45.0,
    "selling_price_per_qtl": 2300.0,
    "total_production_cost": 35000.0,
    "profit_earned": 68500.0,
    "fertilizer_used": "Urea + DAP",
    "disease_experienced": "None",
    "notes": "Excellent harvest year"
}
t0 = time.time()
res = requests.post(f"{BASE_URL}/farmers/{farmer_id}/farm-history", json=history_payload)
t_hist_add = time.time() - t0
print(f"\n6. POST /farmers/{farmer_id}/farm-history status={res.status_code} in {t_hist_add:.3f}s")
print("   Response:", res.json())

# 7. Retrieve Farm History
t0 = time.time()
res = requests.get(f"{BASE_URL}/farmers/{farmer_id}/farm-history")
t_hist_get = time.time() - t0
print(f"\n7. GET /farmers/{farmer_id}/farm-history status={res.status_code} in {t_hist_get:.3f}s")
hist_data = res.json()
print("   Entries count:", len(hist_data))
print("   First entry:", hist_data[0] if hist_data else None)

# 8. Check Full Unified History
t0 = time.time()
res = requests.get(f"{BASE_URL}/farmers/{farmer_id}/full-history")
t_full = time.time() - t0
print(f"\n8. GET /farmers/{farmer_id}/full-history status={res.status_code} in {t_full:.3f}s")
full_data = res.json()
print(f"   Full history keys: {list(full_data.keys())}")
print(f"   Farm records: {len(full_data.get('farm_history', []))}, Soil tests: {len(full_data.get('soil_tests', []))}")

# 9. Verify persistence directly in MongoDB collections
if mongo_ok:
    hist_doc = db.farm_history.find_one({"farmer_id": farmer_id})
    print(f"\n9. MongoDB direct check on farm_history: Found={hist_doc is not None}, Crop={hist_doc.get('crop') if hist_doc else None}")
    soil_doc = db.soil_tests.find_one({"farmer_id": farmer_id})
    print(f"   MongoDB direct check on soil_tests: Found={soil_doc is not None}, N={soil_doc.get('nitrogen') if soil_doc else None}")

# Save results to qa_tmp/farmer_test_result.json
results = {
    "farmer_id": farmer_id,
    "create_time": t_create,
    "read_time": t_read,
    "update_time": t_patch,
    "soil_time": t_soil,
    "history_add_time": t_hist_add,
    "history_get_time": t_hist_get,
    "full_history_time": t_full,
    "mongo_verified": mongo_ok
}
with open("qa_tmp/farmer_test_result.json", "w") as f:
    json.dump(results, f, indent=2)
print("\nItems 1 & 2 testing finished.")
