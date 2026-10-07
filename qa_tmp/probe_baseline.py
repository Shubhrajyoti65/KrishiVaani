import requests
import json
import time
import os
import sys

BASE_URL = "http://localhost:8000"
results = {}

def probe(name, method, url, **kwargs):
    t0 = time.time()
    try:
        r = requests.request(method, f"{BASE_URL}{url}", timeout=25, **kwargs)
        duration = round(time.time() - t0, 3)
        status = r.status_code
        try:
            body = r.json()
        except:
            body = r.text[:200]
        results[name] = {
            "status_code": status,
            "duration_s": duration,
            "success": 200 <= status < 300,
            "sample_response": str(body)[:300]
        }
        print(f"[{'PASS' if 200 <= status < 300 else 'FAIL'}] {name}: status={status}, time={duration}s")
    except Exception as e:
        duration = round(time.time() - t0, 3)
        results[name] = {
            "status_code": None,
            "duration_s": duration,
            "success": False,
            "error": str(e)
        }
        print(f"[ERROR] {name}: {e}")

print("--- Running Baseline Probes ---")

# 1. Health
probe("Health Check", "GET", "/health")

# 2. Crop Recommendation
crop_payload = {
    "nitrogen": 90.0, "phosphorus": 42.0, "potassium": 43.0,
    "temperature": 20.8, "humidity": 82.0, "ph": 6.5, "rainfall": 202.9,
    "state": "Odisha", "district": "Cuttack", "season": "Kharif"
}
probe("Crop Recommendation", "POST", "/api/v1/crop-recommendation/recommend", json=crop_payload)

# 3. Yield Prediction
yield_payload = {
    "crop": "rice", "state": "Punjab", "district": "Ludhiana",
    "season": "Kharif", "area_acres": 2.5, "nitrogen": 90.0,
    "phosphorus": 40.0, "potassium": 40.0, "rainfall": 1100.0, "temperature": 25.0
}
probe("Yield Prediction", "POST", "/api/v1/yield-prediction/predict", json=yield_payload)

# 4. Disease Detection
img_path = "qa_tmp/images/diseased_blast_leaf.jpg"
if os.path.exists(img_path):
    with open(img_path, "rb") as f:
        probe("Disease Detection", "POST", "/api/v1/disease-detection/analyze", files={"file": ("leaf.jpg", f.read(), "image/jpeg")})
else:
    probe("Disease Detection", "POST", "/api/v1/disease-detection/analyze", files={"file": ("leaf.jpg", b"fakejpegdata", "image/jpeg")})

# 5. RAG Answer
rag_payload = {"query": "How to manage rice blast disease in paddy fields?", "top_k": 3}
probe("RAG Knowledge Answer", "POST", "/api/v1/agriculture/rag/query", json=rag_payload)

# 6. Satellite NDVI
ndvi_payload = {"latitude": 20.46, "longitude": 85.88, "buffer_meters": 500}
probe("Satellite NDVI Analysis", "POST", "/api/v1/satellite/ndvi", json=ndvi_payload)

# 7. Weather
probe("Weather Advisory", "GET", "/api/v1/weather/current?district=Cuttack&state=Odisha")

# 8. Sarvam Voice / Translation
trans_payload = {
    "text": "Apply urea and irrigate the field tomorrow.",
    "source_language": "en",
    "target_language": "hi"
}
probe("Sarvam Translation", "POST", "/api/v1/voice-language/translate", json=trans_payload)

# 8b. 3-Year Crop Planning
planning_payload = {
    "state": "Odisha",
    "district": "Cuttack",
    "current_season": "Kharif",
    "previous_crop": "Rice"
}
probe("3-Year Crop Planning", "POST", "/api/v1/crop-planning/plan", json=planning_payload)

# 9. Farmer Profile CRUD
create_farmer = {
    "phone_number": "+919111222333",
    "name": "Baseline Test Farmer",
    "state": "Odisha",
    "district": "Cuttack",
    "village": "Banki",
    "soil_type": "Alluvial",
    "land_area_acres": 3.5,
    "preferred_language": "or"
}
probe("Farmer Profile CREATE", "POST", "/api/v1/farmers/", json=create_farmer)
farmer_id = None
if results.get("Farmer Profile CREATE", {}).get("success"):
    try:
        # extract id
        body = json.loads(results["Farmer Profile CREATE"]["sample_response"].replace("'", '"'))
        farmer_id = body.get("id")
    except:
        pass

if not farmer_id:
    # fetch existing or by phone
    try:
        rf = requests.get(f"{BASE_URL}/api/v1/farmers/phone/%2B919111222333").json()
        farmer_id = rf.get("id")
    except:
        pass

if farmer_id:
    probe("Farmer Profile GET", "GET", f"/api/v1/farmers/{farmer_id}")
    probe("Farmer Profile UPDATE", "PATCH", f"/api/v1/farmers/{farmer_id}", json={"land_area_acres": 4.0})
    probe("Farmer Profile DELETE", "DELETE", f"/api/v1/farmers/{farmer_id}")

# 10. Frontend probe
try:
    rf = requests.get("http://localhost:5173", timeout=5)
    results["Frontend Page Load"] = {
        "status_code": rf.status_code,
        "success": rf.status_code == 200,
        "sample_response": f"Vite HTML served ({len(rf.text)} bytes)"
    }
    print(f"[PASS] Frontend Page Load: status={rf.status_code}")
except Exception as e:
    results["Frontend Page Load"] = {"success": False, "error": str(e)}
    print(f"[WARN] Frontend Page Load: {e}")

with open("qa_tmp/baseline_probe_results.json", "w") as out:
    json.dump(results, out, indent=2)
print("Saved baseline probe results to qa_tmp/baseline_probe_results.json")
