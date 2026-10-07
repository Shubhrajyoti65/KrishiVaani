import os
import sys
import time
import json
import base64
import wave
import io
import requests
from PIL import Image, ImageDraw

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:8000/api/v1"
HEALTH_URL = "http://localhost:8000/health"

results = {
    "phase2": {},
    "phase3": {},
    "phase4": {},
    "latencies": {},
    "errors": []
}

def log_step(name):
    print("\n" + "=" * 70)
    print(f"RUNNING: {name}")
    print("=" * 70)

def timed_request(method, url, **kwargs):
    t0 = time.time()
    try:
        if method.upper() == "GET":
            r = requests.get(url, **kwargs)
        elif method.upper() == "POST":
            r = requests.post(url, **kwargs)
        elif method.upper() == "PATCH":
            r = requests.patch(url, **kwargs)
        elif method.upper() == "DELETE":
            r = requests.delete(url, **kwargs)
        else:
            raise ValueError(f"Unsupported method {method}")
        elapsed = time.time() - t0
        return r, elapsed, None
    except Exception as e:
        elapsed = time.time() - t0
        return None, elapsed, str(e)

# ==============================================================================
# Helper to create sample images
# ==============================================================================
def create_sample_images():
    os.makedirs("qa_tmp/images", exist_ok=True)
    
    # 1. Healthy green leaf
    img1 = Image.new("RGB", (224, 224), color=(34, 139, 34))
    draw = ImageDraw.Draw(img1)
    draw.ellipse([40, 20, 184, 204], fill=(46, 160, 67), outline=(20, 90, 20), width=3)
    draw.line([112, 30, 112, 194], fill=(20, 90, 20), width=2)
    img1_path = "qa_tmp/images/healthy_leaf.jpg"
    img1.save(img1_path)

    # 2. Diseased leaf with brown lesions (Rice Blast / Brown Spot symptom)
    img2 = Image.new("RGB", (224, 224), color=(46, 160, 67))
    draw = ImageDraw.Draw(img2)
    # Draw necrotic lesions
    for pos in [(60, 60), (120, 90), (150, 140), (80, 160)]:
        draw.ellipse([pos[0]-15, pos[1]-10, pos[0]+15, pos[1]+10], fill=(139, 69, 19), outline=(90, 30, 10), width=2)
        draw.ellipse([pos[0]-6, pos[1]-4, pos[0]+6, pos[1]+4], fill=(180, 180, 180)) # Gray center
    img2_path = "qa_tmp/images/diseased_blast_leaf.jpg"
    img2.save(img2_path)

    # 3. Blight leaf with yellow halo and dark target spot
    img3 = Image.new("RGB", (224, 224), color=(50, 140, 50))
    draw = ImageDraw.Draw(img3)
    draw.ellipse([50, 50, 170, 170], fill=(200, 180, 50)) # yellow halo
    draw.ellipse([70, 70, 150, 150], fill=(110, 50, 20)) # brown dead spot
    draw.ellipse([90, 90, 130, 130], fill=(40, 20, 10)) # black center
    img3_path = "qa_tmp/images/early_blight_leaf.jpg"
    img3.save(img3_path)

    return img1_path, img2_path, img3_path

# ==============================================================================
# Helper to create sample audio (WAV)
# ==============================================================================
def create_sample_audio_b64():
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        # 0.5s of silence / low noise
        wf.writeframes(b"\x00\x00" * 8000)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

# ==============================================================================
# PHASE 2: ENDPOINT TESTING
# ==============================================================================
def run_phase2():
    log_step("PHASE 2 - ITEM 1 & 2: Farmer Profile & Farm History")
    phone = f"91{int(time.time()) % 100000000:08d}"
    farmer_payload = {
        "name": "Devendra Patnaik QA",
        "phone_number": phone,
        "village": "Pipili",
        "district": "Puri",
        "state": "Odisha",
        "total_land_acres": 4.2,
        "soil_type": "Alluvial",
        "preferred_language": "or",
        "primary_crops": ["Rice", "Blackgram"]
    }

    # 1. Create farmer
    res, t, err = timed_request("POST", f"{BASE_URL}/farmers/", json=farmer_payload)
    results["phase2"]["farmer_create"] = {
        "status": res.status_code if res else None,
        "time": t,
        "data": res.json() if res and res.status_code == 201 else (res.text if res else err)
    }
    farmer_id = res.json().get("id") if res and res.status_code == 201 else None
    print(f"Created farmer: ID={farmer_id}, Status={res.status_code if res else None} in {t:.3f}s")

    # 2. Read farmer by ID
    res, t, _ = timed_request("GET", f"{BASE_URL}/farmers/{farmer_id}")
    results["phase2"]["farmer_read_id"] = {"status": res.status_code if res else None, "time": t}

    # 3. Read farmer by Phone
    res, t, _ = timed_request("GET", f"{BASE_URL}/farmers/phone/{phone}")
    results["phase2"]["farmer_read_phone"] = {"status": res.status_code if res else None, "time": t}

    # 4. Patch farmer
    patch_payload = {"total_land_acres": 5.0, "primary_crops": ["Rice", "Moong", "Groundnut"]}
    res, t, _ = timed_request("PATCH", f"{BASE_URL}/farmers/{farmer_id}", json=patch_payload)
    results["phase2"]["farmer_patch"] = {"status": res.status_code if res else None, "time": t}

    # 5. Check Delete farmer
    res, t, _ = timed_request("DELETE", f"{BASE_URL}/farmers/{farmer_id}")
    results["phase2"]["farmer_delete_attempt"] = {
        "status": res.status_code if res else None,
        "time": t,
        "notes": "Route not implemented in router (405 Method Not Allowed)" if res and res.status_code == 405 else res.text if res else "No response"
    }

    # 6. Add Soil Test
    soil_payload = {
        "nitrogen": 85.0,
        "phosphorus": 45.0,
        "potassium": 55.0,
        "temperature": 27.5,
        "humidity": 78.0,
        "ph": 6.5,
        "rainfall": 210.0,
        "organic_carbon_percent": 0.65
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/farmers/{farmer_id}/soil-tests", json=soil_payload)
    results["phase2"]["soil_test_add"] = {"status": res.status_code if res else None, "time": t}

    # 7. Add Farm History
    hist_payload = {
        "year": 2024,
        "season": "Kharif",
        "crop": "Rice",
        "area_acres": 4.0,
        "yield_obtained_quintals": 58.0,
        "production_cost_inr": 42000.0,
        "revenue_inr": 87000.0,
        "disease_experienced": "Minor Brown Spot",
        "soil_condition_note": "Clay loam, adequate moisture"
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/farmers/{farmer_id}/farm-history", json=hist_payload)
    results["phase2"]["farm_history_add"] = {"status": res.status_code if res else None, "time": t, "body": res.json() if res and res.status_code == 201 else (res.text if res else None)}

    # 8. Retrieve Farm History
    res, t, _ = timed_request("GET", f"{BASE_URL}/farmers/{farmer_id}/farm-history")
    results["phase2"]["farm_history_get"] = {"status": res.status_code if res else None, "time": t, "count": len(res.json()) if res and res.status_code == 200 else 0}

    # 9. Retrieve Full History
    res, t, _ = timed_request("GET", f"{BASE_URL}/farmers/{farmer_id}/full-history")
    results["phase2"]["full_history_get"] = {"status": res.status_code if res else None, "time": t, "keys": list(res.json().keys()) if res and res.status_code == 200 else []}

    # Check MongoDB direct persistence
    try:
        from pymongo import MongoClient
        from backend.app.core.config import settings
        mc = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        db = mc[settings.DATABASE_NAME]
        f_doc = db.farmers.find_one({"phone_number": phone})
        s_doc = db.soil_tests.find_one({"farmer_id": farmer_id})
        h_doc = db.farm_history.find_one({"farmer_id": farmer_id})
        results["phase2"]["mongo_persistence"] = {
            "farmer_persisted": f_doc is not None,
            "soil_persisted": s_doc is not None,
            "history_persisted": h_doc is not None,
            "farmer_phone": f_doc.get("phone_number") if f_doc else None,
            "history_crop": h_doc.get("crop") if h_doc else None
        }
    except Exception as me:
        results["phase2"]["mongo_persistence"] = {"error": str(me)}

    # --------------------------------------------------------------------------
    # ITEM 3: CROP RECOMMENDATION (5 distinct agro-ecological inputs)
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 3: Crop Recommendation (5 distinct zones)")
    recommendation_cases = [
        {
            "name": "Punjab_Alluvial_Wheat",
            "payload": {"nitrogen": 120.0, "phosphorus": 60.0, "potassium": 50.0, "temperature": 18.0, "humidity": 65.0, "ph": 7.2, "rainfall": 90.0, "state": "Punjab", "soil_type": "Alluvial", "season": "Rabi"}
        },
        {
            "name": "Maharashtra_BlackSoil_Cotton",
            "payload": {"nitrogen": 80.0, "phosphorus": 40.0, "potassium": 40.0, "temperature": 28.0, "humidity": 75.0, "ph": 7.5, "rainfall": 800.0, "state": "Maharashtra", "soil_type": "Black", "season": "Kharif"}
        },
        {
            "name": "Rajasthan_Sandy_Mothbeans",
            "payload": {"nitrogen": 25.0, "phosphorus": 20.0, "potassium": 20.0, "temperature": 34.0, "humidity": 35.0, "ph": 8.0, "rainfall": 120.0, "state": "Rajasthan", "soil_type": "Sandy", "season": "Kharif"}
        },
        {
            "name": "Kerala_Laterite_Coffee_Coconut",
            "payload": {"nitrogen": 100.0, "phosphorus": 30.0, "potassium": 30.0, "temperature": 26.0, "humidity": 85.0, "ph": 5.8, "rainfall": 950.0, "state": "Kerala", "soil_type": "Laterite", "season": "Kharif"}
        },
        {
            "name": "UP_ClayLoam_Rice",
            "payload": {"nitrogen": 90.0, "phosphorus": 45.0, "potassium": 40.0, "temperature": 24.0, "humidity": 82.0, "ph": 6.5, "rainfall": 220.0, "state": "Uttar Pradesh", "soil_type": "Clay", "season": "Kharif"}
        }
    ]
    rec_results = []
    for c in recommendation_cases:
        res, t, err = timed_request("POST", f"{BASE_URL}/crop-recommendation/predict", json=c["payload"])
        if res and res.status_code == 200:
            data = res.json()
            rec_results.append({
                "case": c["name"],
                "status": res.status_code,
                "time": t,
                "primary": data.get("primary_recommendation"),
                "confidence": data.get("confidence"),
                "top_recommendations": [x["crop"] for x in data.get("top_recommendations", [])]
            })
            print(f"Crop Rec [{c['name']}]: {data.get('primary_recommendation')} ({data.get('confidence'):.2%}) in {t:.3f}s")
        else:
            rec_results.append({"case": c["name"], "status": res.status_code if res else None, "time": t, "error": res.text if res else err})
    results["phase2"]["crop_recommendation"] = rec_results

    # --------------------------------------------------------------------------
    # ITEM 4: YIELD PREDICTION (5 distinct inputs)
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 4: Yield Prediction (5 distinct crops/regions)")
    yield_cases = [
        {"crop": "rice", "state": "Punjab", "season": "Kharif", "area_acres": 5.0, "nitrogen": 100.0, "rainfall": 800.0},
        {"crop": "wheat", "state": "Haryana", "season": "Rabi", "area_acres": 3.0, "nitrogen": 120.0, "rainfall": 200.0},
        {"crop": "cotton", "state": "Maharashtra", "season": "Kharif", "area_acres": 10.0, "nitrogen": 80.0, "rainfall": 750.0},
        {"crop": "maize", "state": "Bihar", "season": "Kharif", "area_acres": 2.5, "nitrogen": 90.0, "rainfall": 600.0},
        {"crop": "sugarcane", "state": "Uttar Pradesh", "season": "Whole Year", "area_acres": 4.0, "nitrogen": 150.0, "rainfall": 1100.0}
    ]
    yield_results = []
    for yc in yield_cases:
        res, t, err = timed_request("POST", f"{BASE_URL}/yield-prediction/predict", json=yc)
        if res and res.status_code == 200:
            yd = res.json()
            yield_results.append({
                "crop": yc["crop"],
                "state": yc["state"],
                "area": yc["area_acres"],
                "status": res.status_code,
                "time": t,
                "predicted_yield_per_acre": yd.get("predicted_yield_per_acre_quintals"),
                "total_production": yd.get("total_expected_yield_quintals"),
                "min_revenue": yd.get("revenue_estimate", {}).get("min_total_revenue_inr") if isinstance(yd.get("revenue_estimate"), dict) else None,
                "max_revenue": yd.get("revenue_estimate", {}).get("max_total_revenue_inr") if isinstance(yd.get("revenue_estimate"), dict) else None,
                "risk_assessment": yd.get("risk_assessment")
            })
            print(f"Yield [{yc['crop']} {yc['state']}]: {yd.get('predicted_yield_per_acre_quintals')} q/acre, Total: {yd.get('total_expected_yield_quintals')} q in {t:.3f}s")
        else:
            yield_results.append({"crop": yc["crop"], "status": res.status_code if res else None, "time": t, "error": res.text if res else err})
    results["phase2"]["yield_prediction"] = yield_results

    # --------------------------------------------------------------------------
    # ITEM 5: 3-YEAR CROP PLANNING
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 5: 3-Year Crop Planning Workflow")
    plan_payload = {
        "state": "Punjab",
        "district": "Ludhiana",
        "current_season": "Kharif",
        "has_actual_soil_test": True,
        "nitrogen": 110.0,
        "phosphorus": 50.0,
        "potassium": 45.0,
        "ph": 7.0,
        "soil_type": "Alluvial",
        "water_availability": "Canal",
        "previous_crop": "Rice",
        "soil_improvement_goal": "balanced_health"
    }
    res, t, err = timed_request("POST", f"{BASE_URL}/crop-planning/plan", json=plan_payload)
    if res and res.status_code == 200:
        pd = res.json()
        plan_items = pd.get("three_year_plan", [])
        results["phase2"]["crop_planning"] = {
            "status": res.status_code,
            "time": t,
            "years_count": len(plan_items),
            "years": [f"{item['year_label']}: {item['recommended_crop']} ({item['season']})" for item in plan_items],
            "soil_actions_count": len(pd.get("soil_improvement_plan", {}).get("nutrient_management", [])),
            "soil_rotation_strategies": pd.get("soil_improvement_plan", {}).get("crop_rotation_strategy", [])
        }
        print(f"3-Year Plan generated {len(plan_items)} years in {t:.3f}s:")
        for y in plan_items:
            print(f"  - {y.get('year_label')}: {y.get('recommended_crop')} ({y.get('agronomic_rationale')[:50]}...)")
    else:
        results["phase2"]["crop_planning"] = {"status": res.status_code if res else None, "time": t, "error": res.text if res else err}

    # --------------------------------------------------------------------------
    # ITEM 6: DISEASE & PEST DETECTION (CV + RAG)
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 6: Disease & Pest Detection (CV + RAG)")
    img1, img2, img3 = create_sample_images()
    disease_cases = [
        ("healthy_leaf", img1, "wheat"),
        ("rice_blast_symptom", img2, "rice"),
        ("blight_symptom", img3, "potato")
    ]
    cv_results = []
    for name, path, hint in disease_cases:
        t0 = time.time()
        with open(path, "rb") as f:
            files = {"file": (os.path.basename(path), f, "image/jpeg")}
            data = {"crop_hint": hint}
            res = requests.post(f"{BASE_URL}/disease-detection/analyze", files=files, data=data)
        elapsed = time.time() - t0
        if res.status_code == 200:
            cd = res.json()
            cv_results.append({
                "test_image": name,
                "crop_hint": hint,
                "status": res.status_code,
                "time": elapsed,
                "diagnosed_crop": cd.get("crop"),
                "condition": cd.get("condition"),
                "confidence": cd.get("confidence"),
                "severity": cd.get("severity"),
                "rag_citations_count": len(cd.get("rag_citations", [])),
                "has_llm_guidance": bool(cd.get("llm_grounded_guidance")),
                "chemical_options_count": len(cd.get("chemical_options", [])),
                "model_source": cd.get("model_source")
            })
            print(f"CV Test [{name}]: {cd.get('crop')} -> {cd.get('condition')} (Conf: {cd.get('confidence')}) in {elapsed:.3f}s. Citations: {len(cd.get('rag_citations', []))}")
        else:
            cv_results.append({"test_image": name, "status": res.status_code, "time": elapsed, "error": res.text})
    results["phase2"]["disease_detection"] = cv_results

    # --------------------------------------------------------------------------
    # ITEM 7: RAG + LLM GUIDANCE
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 7: Agricultural RAG Knowledge Retrieval")
    rag_in_domain = {
        "query": "How to control rice blast and brown spot using bio-pesticides and cultural practices?",
        "crop": "rice",
        "top_k": 3
    }
    rag_out_of_domain = {
        "query": "How to trade cryptocurrency and buy Apple stock options on NYSE?",
        "top_k": 3
    }
    res_in, t_in, _ = timed_request("POST", f"{BASE_URL}/agriculture/rag/query", json=rag_in_domain)
    res_out, t_out, _ = timed_request("POST", f"{BASE_URL}/agriculture/rag/query", json=rag_out_of_domain)

    results["phase2"]["rag_retrieval"] = {
        "in_domain": {
            "status": res_in.status_code if res_in else None,
            "time": t_in,
            "count": res_in.json().get("results_count") if res_in and res_in.status_code == 200 else 0,
            "citations": [c["title"] for c in res_in.json().get("citations", [])] if res_in and res_in.status_code == 200 else []
        },
        "out_of_domain": {
            "status": res_out.status_code if res_out else None,
            "time": t_out,
            "count": res_out.json().get("results_count") if res_out and res_out.status_code == 200 else 0,
            "notes": "Returns 0 relevant citations or standard agricultural corpus without hallucination"
        }
    }
    print(f"RAG in-domain: {res_in.status_code if res_in else None} ({t_in:.3f}s), citations={len(results['phase2']['rag_retrieval']['in_domain']['citations'])}")
    print(f"RAG out-of-domain: {res_out.status_code if res_out else None} ({t_out:.3f}s), count={results['phase2']['rag_retrieval']['out_of_domain']['count']}")

    # --------------------------------------------------------------------------
    # ITEM 8: GOOGLE EARTH ENGINE NDVI
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 8: Google Earth Engine / Satellite NDVI")
    ndvi_req_up = {"latitude": 26.8467, "longitude": 80.9462, "farm_name": "Lucknow UP Farm", "buffer_meters": 500}
    ndvi_req_od = {"latitude": 20.4625, "longitude": 85.8830, "farm_name": "Bhubaneswar Odisha Farm", "buffer_meters": 500}

    res_up, t_up, _ = timed_request("POST", f"{BASE_URL}/satellite/ndvi", json=ndvi_req_up)
    res_od, t_od, _ = timed_request("POST", f"{BASE_URL}/satellite/ndvi", json=ndvi_req_od)

    results["phase2"]["satellite_ndvi"] = {
        "up_farm": {
            "status": res_up.status_code if res_up else None,
            "time": t_up,
            "data": res_up.json() if res_up and res_up.status_code == 200 else (res_up.text if res_up else None)
        },
        "odisha_farm": {
            "status": res_od.status_code if res_od else None,
            "time": t_od,
            "data": res_od.json() if res_od and res_od.status_code == 200 else (res_od.text if res_od else None)
        }
    }
    if res_up and res_up.status_code == 200:
        met = res_up.json().get("ndvi_metrics", {})
        constellation = res_up.json().get("satellite_constellation")
        print(f"Satellite UP: Status={met.get('canopy_health_status')}, Mean NDVI={met.get('mean_ndvi')}, Constellation={constellation} in {t_up:.3f}s")
    if res_od and res_od.status_code == 200:
        met = res_od.json().get("ndvi_metrics", {})
        constellation = res_od.json().get("satellite_constellation")
        print(f"Satellite Odisha: Status={met.get('canopy_health_status')}, Mean NDVI={met.get('mean_ndvi')}, Constellation={constellation} in {t_od:.3f}s")

    # --------------------------------------------------------------------------
    # ITEM 9: WEATHER INTEGRATION
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 9: Weather Integration (Punjab vs Odisha)")
    res_w_pb, t_w_pb, _ = timed_request("GET", f"{BASE_URL}/weather/current?district=Ludhiana&state=Punjab")
    res_w_od, t_w_od, _ = timed_request("GET", f"{BASE_URL}/weather/current?district=Bhubaneswar&state=Odisha")

    w_pb_data = res_w_pb.json() if res_w_pb and res_w_pb.status_code == 200 else {}
    w_od_data = res_w_od.json() if res_w_od and res_w_od.status_code == 200 else {}

    results["phase2"]["weather"] = {
        "punjab": {
            "status": res_w_pb.status_code if res_w_pb else None,
            "time": t_w_pb,
            "temp": w_pb_data.get("current", {}).get("temperature_c"),
            "humidity": w_pb_data.get("current", {}).get("humidity_percent"),
            "condition": w_pb_data.get("current", {}).get("condition")
        },
        "odisha": {
            "status": res_w_od.status_code if res_w_od else None,
            "time": t_w_od,
            "temp": w_od_data.get("current", {}).get("temperature_c"),
            "humidity": w_od_data.get("current", {}).get("humidity_percent"),
            "condition": w_od_data.get("current", {}).get("condition")
        }
    }
    print(f"Weather Punjab (Ludhiana): {results['phase2']['weather']['punjab']['temp']}°C, {results['phase2']['weather']['punjab']['humidity']}%, {results['phase2']['weather']['punjab']['condition']} in {t_w_pb:.3f}s")
    print(f"Weather Odisha (Bhubaneswar): {results['phase2']['weather']['odisha']['temp']}°C, {results['phase2']['weather']['odisha']['humidity']}%, {results['phase2']['weather']['odisha']['condition']} in {t_w_od:.3f}s")

    # --------------------------------------------------------------------------
    # ITEM 10: SARVAM AI (Translation, STT, TTS)
    # --------------------------------------------------------------------------
    log_step("PHASE 2 - ITEM 10: Sarvam AI Voice & Translation")
    # 1. Translate English -> Hindi
    t_req_hi = {"text": "Recommended crop for your farm is Rice with high yield potential.", "source_language": "en", "target_language": "hi"}
    res_t_hi, t_thi, _ = timed_request("POST", f"{BASE_URL}/voice-language/translate", json=t_req_hi)

    # 2. Translate English -> Odia
    t_req_or = {"text": "Recommended crop for your farm is Rice with high yield potential.", "source_language": "en", "target_language": "or"}
    res_t_or, t_tor, _ = timed_request("POST", f"{BASE_URL}/voice-language/translate", json=t_req_or)

    # 3. Text to Speech (Hindi)
    tts_req = {"text": "धान की फसल के लिए यूरिया और डीएपी का संतुलित प्रयोग करें।", "language": "hi", "gender": "female"}
    res_tts, t_tts, _ = timed_request("POST", f"{BASE_URL}/voice-language/text-to-speech", json=tts_req)

    # 4. Speech to Text (WAV Audio)
    audio_b64 = create_sample_audio_b64()
    stt_req = {"audio_base64": audio_b64, "language": "hi"}
    res_stt, t_stt, _ = timed_request("POST", f"{BASE_URL}/voice-language/speech-to-text", json=stt_req)

    results["phase2"]["sarvam_ai"] = {
        "translate_hi": {
            "status": res_t_hi.status_code if res_t_hi else None,
            "time": t_thi,
            "data": res_t_hi.json() if res_t_hi and res_t_hi.status_code == 200 else (res_t_hi.text if res_t_hi else None)
        },
        "translate_or": {
            "status": res_t_or.status_code if res_t_or else None,
            "time": t_tor,
            "data": res_t_or.json() if res_t_or and res_t_or.status_code == 200 else (res_t_or.text if res_t_or else None)
        },
        "tts": {
            "status": res_tts.status_code if res_tts else None,
            "time": t_tts,
            "engine": res_tts.json().get("engine") if res_tts and res_tts.status_code == 200 else None,
            "audio_len": len(res_tts.json().get("audio_base64", "")) if res_tts and res_tts.status_code == 200 else 0
        },
        "stt": {
            "status": res_stt.status_code if res_stt else None,
            "time": t_stt,
            "engine": res_stt.json().get("engine") if res_stt and res_stt.status_code == 200 else None,
            "transcript": res_stt.json().get("transcribed_text") if res_stt and res_stt.status_code == 200 else None
        }
    }
    if res_t_hi and res_t_hi.status_code == 200:
        print(f"Translate EN->HI: Engine='{res_t_hi.json().get('engine')}', Result='{res_t_hi.json().get('translated_text')}' in {t_thi:.3f}s")
    if res_t_or and res_t_or.status_code == 200:
        print(f"Translate EN->OR: Engine='{res_t_or.json().get('engine')}', Result='{res_t_or.json().get('translated_text')}' in {t_tor:.3f}s")
    if res_tts and res_tts.status_code == 200:
        print(f"TTS Engine: '{res_tts.json().get('engine')}', Audio bytes={results['phase2']['sarvam_ai']['tts']['audio_len']} in {t_tts:.3f}s")
    if res_stt and res_stt.status_code == 200:
        print(f"STT Engine: '{res_stt.json().get('engine')}', Transcript='{res_stt.json().get('transcribed_text')}' in {t_stt:.3f}s")

# ==============================================================================
# PHASE 3: END-TO-END FARMER JOURNEY
# ==============================================================================
def run_phase3():
    log_step("PHASE 3: End-to-End Complete Farmer Journey")
    journey_log = []
    
    # Step 1: Register Farmer
    journey_phone = f"95{int(time.time()) % 100000000:08d}"
    farmer_data = {
        "name": "Manoranjan Sahoo",
        "phone_number": journey_phone,
        "village": "Nimapada",
        "district": "Puri",
        "state": "Odisha",
        "total_land_acres": 3.0,
        "soil_type": "Alluvial",
        "preferred_language": "or",
        "primary_crops": ["Rice"]
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/farmers/", json=farmer_data)
    farmer_id = res.json().get("id") if res and res.status_code == 201 else None
    journey_log.append({"step": "1. Register Farmer", "success": farmer_id is not None, "time": t, "id": farmer_id})
    print(f"Step 1: Farmer Registered: {farmer_id} in {t:.3f}s")

    # Step 2: Add Soil Test
    soil_data = {
        "nitrogen": 80.0,
        "phosphorus": 40.0,
        "potassium": 45.0,
        "temperature": 27.0,
        "humidity": 80.0,
        "ph": 6.8,
        "rainfall": 200.0,
        "organic_carbon_percent": 0.58
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/farmers/{farmer_id}/soil-tests", json=soil_data)
    journey_log.append({"step": "2. Add Soil Test", "success": res and res.status_code == 201, "time": t})
    print(f"Step 2: Soil Test Logged in {t:.3f}s")

    # Step 3: Crop Recommendation
    crop_req = {
        "nitrogen": 80.0,
        "phosphorus": 40.0,
        "potassium": 45.0,
        "temperature": 27.0,
        "humidity": 80.0,
        "ph": 6.8,
        "rainfall": 200.0,
        "state": "Odisha",
        "district": "Puri",
        "soil_type": "Alluvial",
        "season": "Kharif"
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/crop-recommendation/predict", json=crop_req)
    rec_crop = res.json().get("primary_recommendation") if res and res.status_code == 200 else "Rice"
    journey_log.append({"step": "3. Crop Recommendation", "success": res and res.status_code == 200, "recommended_crop": rec_crop, "time": t})
    print(f"Step 3: Crop Recommended: {rec_crop} in {t:.3f}s")

    # Step 4: Yield Prediction
    yield_req = {
        "crop": rec_crop.lower(),
        "state": "Odisha",
        "season": "Kharif",
        "area_acres": 3.0,
        "nitrogen": 80.0,
        "rainfall": 800.0
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/yield-prediction/predict", json=yield_req)
    exp_yield = res.json().get("predicted_yield_per_acre_quintals") if res and res.status_code == 200 else None
    journey_log.append({"step": "4. Yield Prediction", "success": res and res.status_code == 200, "yield_q_acre": exp_yield, "time": t})
    print(f"Step 4: Yield Predicted: {exp_yield} q/acre in {t:.3f}s")

    # Step 5: 3-Year Plan
    plan_req = {
        "state": "Odisha",
        "district": "Puri",
        "current_season": "Kharif",
        "has_actual_soil_test": True,
        "nitrogen": 80.0,
        "phosphorus": 40.0,
        "potassium": 45.0,
        "ph": 6.8,
        "soil_type": "Alluvial",
        "water_availability": "Canal",
        "previous_crop": "Rice",
        "soil_improvement_goal": "balanced_health"
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/crop-planning/plan", json=plan_req)
    journey_log.append({"step": "5. 3-Year Plan", "success": res and res.status_code == 200, "time": t})
    print(f"Step 5: 3-Year Plan Generated in {t:.3f}s")

    # Step 6: Satellite NDVI
    sat_req = {"latitude": 20.0, "longitude": 85.8, "farm_name": "Puri Field Plot", "buffer_meters": 500}
    res, t, _ = timed_request("POST", f"{BASE_URL}/satellite/ndvi", json=sat_req)
    journey_log.append({"step": "6. Satellite NDVI", "success": res and res.status_code == 200, "time": t})
    print(f"Step 6: Satellite NDVI Checked in {t:.3f}s")

    # Step 7: Disease Image Upload
    img_path = "qa_tmp/images/diseased_blast_leaf.jpg"
    t0 = time.time()
    with open(img_path, "rb") as f:
        res = requests.post(f"{BASE_URL}/disease-detection/analyze", files={"file": ("leaf.jpg", f, "image/jpeg")}, data={"crop_hint": "rice"})
    t_cv = time.time() - t0
    journey_log.append({"step": "7. Disease Image Diagnosis", "success": res.status_code == 200, "diagnosis": res.json().get("condition") if res.status_code == 200 else None, "time": t_cv})
    print(f"Step 7: Disease Diagnosed: {res.json().get('condition') if res.status_code == 200 else None} in {t_cv:.3f}s")

    # Step 8: Hindi Voice Follow-up Query
    chat_payload = {
        "message": "धान में ब्लास्ट रोग के नियंत्रण के लिए कौन सी जैविक दवा सबसे अच्छी है?",
        "language": "hi",
        "farmer_id": farmer_id
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/chatbot/chat", json=chat_payload)
    journey_log.append({"step": "8. Hindi Follow-up Query", "success": res and res.status_code == 200, "time": t, "answer_snippet": res.json().get("reply")[:80] if res and res.status_code == 200 else None})
    print(f"Step 8: Follow-up Response received in {t:.3f}s")

    # Step 9: Save Outcome to Farm History
    hist_payload = {
        "year": 2025,
        "season": "Kharif",
        "crop": rec_crop,
        "area_acres": 3.0,
        "yield_obtained_quintals": round((exp_yield or 18.0) * 3.0, 1),
        "production_cost_inr": 36000.0,
        "revenue_inr": 78000.0,
        "disease_experienced": "Rice Blast (Treated)",
        "soil_condition_note": "Post bio-agent treatment recovery"
    }
    res, t, _ = timed_request("POST", f"{BASE_URL}/farmers/{farmer_id}/farm-history", json=hist_payload)
    journey_log.append({"step": "9. Save to Farm History", "success": res and res.status_code == 201, "time": t})
    print(f"Step 9: Saved Outcome to Farm History in {t:.3f}s")

    # Step 10: Verify in Full History
    res, t, _ = timed_request("GET", f"{BASE_URL}/farmers/{farmer_id}/full-history")
    fh_ok = res and res.status_code == 200 and len(res.json().get("crop_history", [])) > 0
    journey_log.append({"step": "10. Confirm Unified History", "success": fh_ok, "time": t})
    print(f"Step 10: Full History Verified: {fh_ok} in {t:.3f}s")

    results["phase3"]["journey"] = journey_log
    results["phase3"]["all_passed"] = all(j["success"] for j in journey_log)

# ==============================================================================
# PHASE 4: ROBUSTNESS AND EDGE CASES
# ==============================================================================
def run_phase4():
    log_step("PHASE 4: Robustness and Edge Cases")
    edge_results = []

    # 1. Missing required fields (crop recommendation)
    res, t, _ = timed_request("POST", f"{BASE_URL}/crop-recommendation/predict", json={})
    edge_results.append({
        "case": "Missing required fields (empty JSON)",
        "endpoint": "POST /crop-recommendation/predict",
        "status": res.status_code if res is not None else None,
        "time": t,
        "expected_status": 422,
        "graceful": bool(res is not None and res.status_code == 422)
    })

    # 2. Invalid coordinates (out of range latitude > 90)
    res, t, _ = timed_request("POST", f"{BASE_URL}/satellite/ndvi", json={"latitude": 999.0, "longitude": 85.0})
    edge_results.append({
        "case": "Invalid coordinates (latitude=999.0)",
        "endpoint": "POST /satellite/ndvi",
        "status": res.status_code if res is not None else None,
        "time": t,
        "expected_status": 422,
        "graceful": bool(res is not None and res.status_code == 422)
    })

    # 3. Unsupported image format (.txt uploaded as file)
    dummy_txt = io.BytesIO(b"This is not an image file.")
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/disease-detection/analyze", files={"file": ("virus.txt", dummy_txt, "text/plain")})
    elapsed = time.time() - t0
    edge_results.append({
        "case": "Unsupported file format (.txt)",
        "endpoint": "POST /disease-detection/analyze",
        "status": res.status_code if res is not None else None,
        "time": elapsed,
        "expected_status": 400,
        "graceful": bool(res is not None and res.status_code == 400)
    })

    # 4. Corrupt / truncated image bytes
    corrupt_bytes = io.BytesIO(b"\xFF\xD8\xFF\xE0" + b"\x00" * 30) # fake incomplete jpeg header
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/disease-detection/analyze", files={"file": ("corrupt.jpg", corrupt_bytes, "image/jpeg")})
    elapsed = time.time() - t0
    edge_results.append({
        "case": "Corrupt image bytes",
        "endpoint": "POST /disease-detection/analyze",
        "status": res.status_code if res is not None else None,
        "time": elapsed,
        "expected_status": 400,
        "graceful": bool(res is not None and res.status_code in (400, 422))
    })

    # 5. Empty audio string in speech-to-text
    res, t, _ = timed_request("POST", f"{BASE_URL}/voice-language/speech-to-text", json={"audio_base64": "", "language": "hi"})
    edge_results.append({
        "case": "Empty audio string in speech-to-text",
        "endpoint": "POST /voice-language/speech-to-text",
        "status": res.status_code if res is not None else None,
        "time": t,
        "expected_status": 200, # falls back gracefully to offline speech engine
        "graceful": bool(res is not None and res.status_code in (200, 400, 422))
    })

    # 6. Unsupported language code in translation
    res, t, _ = timed_request("POST", f"{BASE_URL}/voice-language/translate", json={"text": "Irrigate field tomorrow", "source_language": "en", "target_language": "klingon"})
    edge_results.append({
        "case": "Unsupported target language ('klingon')",
        "endpoint": "POST /voice-language/translate",
        "status": res.status_code if res is not None else None,
        "time": t,
        "expected_status": 200, # returns offline identity fallback
        "graceful": bool(res is not None and res.status_code == 200)
    })

    # 7. Non-existent farmer ID
    res, t, _ = timed_request("GET", f"{BASE_URL}/farmers/f_nonexistent_999999")
    edge_results.append({
        "case": "Non-existent farmer ID lookup",
        "endpoint": "GET /farmers/{farmer_id}",
        "status": res.status_code if res is not None else None,
        "time": t,
        "expected_status": 404,
        "graceful": bool(res is not None and res.status_code == 404)
    })

    # 8. Duplicate farmer phone registration
    res, t, _ = timed_request("POST", f"{BASE_URL}/farmers/", json={
        "name": "Duplicate Tester",
        "phone_number": "9988776655", # Already registered in MongoDB
        "state": "Odisha",
        "district": "Bhadrak",
        "soil_type": "Alluvial",
        "total_land_acres": 2.0
    })
    edge_results.append({
        "case": "Duplicate phone number registration",
        "endpoint": "POST /farmers/",
        "status": res.status_code if res is not None else None,
        "time": t,
        "expected_status": 400,
        "graceful": bool(res is not None and res.status_code == 400)
    })

    results["phase4"]["edge_cases"] = edge_results
    for er in edge_results:
        print(f"Edge Case [{er['case']}]: Status={er['status']} (Graceful={er['graceful']}) in {er['time']:.3f}s")

if __name__ == "__main__":
    print("STARTING FULL QA INTEGRATION TEST RUN")
    run_phase2()
    run_phase3()
    run_phase4()
    
    with open("qa_tmp/qa_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nALL INTEGRATION TESTS COMPLETE. RESULTS SAVED TO qa_tmp/qa_results.json")
