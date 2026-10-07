# KrishiVaani Cleanup Baseline Report

**Timestamp:** 2026-10-07T15:15:00+05:30  
**Git Branch:** `cleanup/remove-unused` (created from `main` commit `25fe43bc`)  
**Environment:** Python 3.11.9 (virtualenv `.\.venv`), Node v20.18.0, Vite v8.3.1  

---

## 1. Automated Test Suite Baseline

- **Command:** `.\.venv\Scripts\pytest backend/tests/`
- **Result:** **55 passed**, 1 warning in 64.77s
- **Test Modules Passing:**
  - `backend\tests\test_agricultural_rag.py` (3 tests)
  - `backend\tests\test_chatbot_agent.py` (5 tests)
  - `backend\tests\test_crop_planning.py` (3 tests)
  - `backend\tests\test_crop_recommendation.py` (3 tests)
  - `backend\tests\test_disease_detection.py` (8 tests)
  - `backend\tests\test_farmer_profile.py` (7 tests)
  - `backend\tests\test_health.py` (1 test)
  - `backend\tests\test_mandi_service.py` (4 tests)
  - `backend\tests\test_production_cost.py` (3 tests)
  - `backend\tests\test_satellite_service.py` (4 tests)
  - `backend\tests\test_voice_language_service.py` (6 tests)
  - `backend\tests\test_weather_service.py` (5 tests)
  - `backend\tests\test_yield_prediction.py` (3 tests)

---

## 2. Live API Endpoint Probes (Backend: `http://localhost:8000`)

| Feature / Endpoint | Method | Path | HTTP Status | Latency | Baseline Result |
|---|---|---|---|---|---|
| Health Check | `GET` | `/health` | **200 OK** | 2.11s | `{"status":"healthy","service":"KrishiVaani"}` |
| Crop Recommendation | `POST` | `/api/v1/crop-recommendation/recommend` | **200 OK** | 2.42s | Recommended crop generated with agronomic advisory |
| Yield Prediction | `POST` | `/api/v1/yield-prediction/predict` | **200 OK** | 2.24s | Yield forecast (t/ha) & revenue estimate |
| Disease Detection | `POST` | `/api/v1/disease-detection/analyze` | **200 OK** | 2.91s | DigiGreen DaViT diagnosis + treatment advisory |
| Agricultural RAG | `POST` | `/api/v1/agriculture/rag/query` | **200 OK** | 2.06s | ICAR/CIBRC grounded knowledge retrieved |
| Satellite NDVI | `POST` | `/api/v1/satellite/ndvi` | **200 OK** | 2.07s | Sentinel-2 NDVI canopy index computed |
| Weather Advisory | `GET` | `/api/v1/weather/current?district=Cuttack&state=Odisha` | **200 OK** | 3.35s | Current temp, humidity & agromet alert |
| Sarvam Voice / Translation | `POST` | `/api/v1/voice-language/translate` | **200 OK** | 3.36s | Mayura NMT translation executed |
| 3-Year Crop Planning | `POST` | `/api/v1/crop-planning/plan` | **200 OK** | 2.14s | 3-year rotational sequence + soil improvement plan |
| Farmer Profile CREATE | `POST` | `/api/v1/farmers/` | **201 Created** | 4.79s | Farmer document saved |
| Farmer Profile GET | `GET` | `/api/v1/farmers/{id}` | **200 OK** | 2.14s | Farmer profile fetched |
| Farmer Profile UPDATE | `PATCH` | `/api/v1/farmers/{id}` | **200 OK** | 2.26s | Profile fields updated |
| Farmer Profile DELETE | `DELETE` | `/api/v1/farmers/{id}` | **200 OK** | 7.89s | Profile and associated tests/history deleted |
| Chatbot Agent (Live Gemini) | `POST` | `/api/v1/chatbot/chat` | **200 OK** | 4.80s | Gemini 2.5 Flash conversational response |

---

## 3. Frontend Build Baseline (Frontend: `http://localhost:5173`)

- **Command:** `npm run build` in `d:\STUDY MATERIAL\Projects\KrishiVaani\frontend`
- **Result:** Successfully compiled in **1.70s** with 0 errors.
- **Bundle Output:**
  - `dist/index.html` (1.13 kB)
  - `dist/assets/index-DbFJJDRX.css` (18.88 kB)
  - `dist/assets/index-CLaHzJQI.js` (594.44 kB)
- **Live UI Serve:** `GET http://localhost:5173` returns **200 OK**.
