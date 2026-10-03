import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, List, Tuple
from backend.app.services.yield_prediction.schema import (
    YieldPredictionRequest,
    YieldPredictionResponse,
    RevenueEstimate,
)

BEST_YIELD_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "ml", "yield_prediction", "model", "yield_prediction_best.joblib"
)
SERVICE_MODEL_PATH = os.path.join(os.path.dirname(__file__), "yield_prediction_rf.joblib")
MODEL_FILE_PATH = BEST_YIELD_MODEL_PATH if os.path.exists(BEST_YIELD_MODEL_PATH) else SERVICE_MODEL_PATH

# Baseline Indian MSP prices (INR per Quintal) for key crops (2024-2026 reference)
MSP_PRICES = {
    "rice": 2300.0,
    "wheat": 2275.0,
    "maize": 2225.0,
    "cotton": 7121.0,
    "chickpea": 5440.0,
    "sugarcane": 315.0,  # per quintal
    "pigeonpeas": 7000.0,
    "blackgram": 6950.0,
    "mungbean": 8558.0,
    "jute": 5050.0,
    "groundnut": 6783.0,
}
DEFAULT_MSP = 2500.0

def generate_synthetic_yield_dataset():
    np.random.seed(42)
    crops_yield_base = {
        "rice": {"yield_range": (14.0, 26.0), "opt_N": 90, "opt_rain": 1100},
        "wheat": {"yield_range": (12.0, 22.0), "opt_N": 100, "opt_rain": 400},
        "maize": {"yield_range": (15.0, 30.0), "opt_N": 80, "opt_rain": 600},
        "cotton": {"yield_range": (6.0, 14.0), "opt_N": 110, "opt_rain": 700},
        "chickpea": {"yield_range": (5.0, 11.0), "opt_N": 30, "opt_rain": 350},
        "sugarcane": {"yield_range": (250.0, 400.0), "opt_N": 150, "opt_rain": 1500},
        "pigeonpeas": {"yield_range": (4.0, 9.0), "opt_N": 25, "opt_rain": 650},
        "blackgram": {"yield_range": (3.5, 8.0), "opt_N": 40, "opt_rain": 500},
        "mungbean": {"yield_range": (3.0, 7.5), "opt_N": 30, "opt_rain": 450},
        "jute": {"yield_range": (10.0, 18.0), "opt_N": 70, "opt_rain": 1400},
    }

    data = []
    samples_per_crop = 120
    for crop, prof in crops_yield_base.items():
        for _ in range(samples_per_crop):
            N = np.random.uniform(20, 160)
            P = np.random.uniform(15, 90)
            K = np.random.uniform(15, 90)
            rain = np.random.uniform(200, 1800)
            temp = np.random.uniform(15, 38)
            
            # Simple synthetic yield function with penalties for deviation from optimal
            base = np.random.uniform(*prof["yield_range"])
            n_factor = 1.0 - abs(N - prof["opt_N"]) / 300.0
            rain_factor = 1.0 - abs(rain - prof["opt_rain"]) / 2500.0
            yield_per_acre = max(1.0, base * n_factor * rain_factor)
            
            data.append([N, P, K, rain, temp, crop, yield_per_acre])

    df = pd.DataFrame(data, columns=["N", "P", "K", "rainfall", "temperature", "crop", "yield_per_acre"])
    return df

class YieldPredictionEngine:
    def __init__(self):
        self.model = None
        self.model_name = "XGBoost Regressor"
        self.load_or_train_model()

    def load_or_train_model(self):
        candidates = [BEST_YIELD_MODEL_PATH, SERVICE_MODEL_PATH]
        for p in candidates:
            if os.path.exists(p):
                try:
                    loaded = joblib.load(p)
                    self.model = loaded
                    if isinstance(loaded, dict) and "model_name" in loaded:
                        self.model_name = loaded["model_name"]
                    return
                except Exception:
                    pass

        # If not present, train via backend.ml.yield_prediction.train
        try:
            from backend.ml.yield_prediction.train import train_and_evaluate
            metrics = train_and_evaluate()
            if os.path.exists(BEST_YIELD_MODEL_PATH):
                self.model = joblib.load(BEST_YIELD_MODEL_PATH)
                self.model_name = "XGBoost Regressor"
                return
        except Exception:
            pass

        df = generate_synthetic_yield_dataset()
        df_encoded = pd.get_dummies(df, columns=["crop"])
        X = df_encoded.drop(columns=["yield_per_acre"])
        y = df_encoded["yield_per_acre"]
        rf = RandomForestRegressor(n_estimators=100, random_state=42)
        rf.fit(X, y)
        self.model = (rf, list(X.columns))
        self.model_name = "Random Forest Regressor"

    def predict(self, req: YieldPredictionRequest) -> YieldPredictionResponse:
        crop_clean = req.crop.strip().lower()
        area_acres = float(req.area_acres or 1.0)
        state_clean = (req.state or "Punjab").strip().title()
        season_clean = (req.season or "Kharif").strip().title()

        # Call predict_yield_production from ML package if available
        try:
            from backend.ml.yield_prediction.predict import predict_yield_production
            ml_pred = predict_yield_production(
                crop=req.crop,
                state=state_clean,
                season=season_clean,
                area_acres=area_acres
            )
            predicted_yield_per_acre = ml_pred["predicted_yield_quintals_per_acre"]
            yield_tonnes_ha = ml_pred["predicted_yield_tonnes_per_hectare"]
            total_yield = ml_pred["total_expected_yield_quintals"]
            est_range = {
                "min": ml_pred["estimated_range"]["tonnes_per_hectare"]["min"],
                "max": ml_pred["estimated_range"]["tonnes_per_hectare"]["max"],
            }
        except Exception:
            # Fallback to direct model inference
            loaded = self.model
            if isinstance(loaded, dict) and "pipeline" in loaded:
                pipeline = loaded["pipeline"]
                area_ha = max(0.1, area_acres / 2.47105)
                input_df = pd.DataFrame([{
                    "Crop": req.crop.strip().title(),
                    "State_Name": state_clean,
                    "Season": season_clean,
                    "Area": area_ha
                }])
                raw_pred = float(pipeline.predict(input_df)[0])
                yield_tonnes_ha = max(0.1, round(raw_pred, 2))
                predicted_yield_per_acre = round(yield_tonnes_ha * 4.04686, 2)
            else:
                yield_tonnes_ha = 2.5
                predicted_yield_per_acre = 10.1

            total_yield = round(predicted_yield_per_acre * area_acres, 2)
            est_range = {
                "min": round(yield_tonnes_ha * 0.88, 2),
                "max": round(yield_tonnes_ha * 1.14, 2)
            }

        yield_per_acre_rounded = round(predicted_yield_per_acre, 2)
        total_yield = round(yield_per_acre_rounded * req.area_acres, 2)

        # Revenue estimation
        msp = MSP_PRICES.get(crop_clean, DEFAULT_MSP)
        min_rev = round(total_yield * msp * 0.9, 2)
        max_rev = round(total_yield * msp * 1.15, 2)

        revenue_est = RevenueEstimate(
            estimated_msp_per_quintal_inr=msp,
            min_total_revenue_inr=min_rev,
            max_total_revenue_inr=max_rev
        )

        # Risk assessment & tips
        risks = []
        tips = []

        if req.rainfall < 400 and crop_clean in ["rice", "sugarcane", "jute"]:
            risks.append("Drought Risk: Sub-optimal rainfall detected for high water-requirement crop.")
            tips.append("Ensure canal or groundwater drip/sprinkler irrigation during critical flowering stages.")
        elif req.rainfall > 1200 and crop_clean in ["chickpea", "blackgram", "cotton"]:
            risks.append("Waterlogging Risk: Excessive seasonal rainfall may cause root rot or fungal disease.")
            tips.append("Ensure effective field drainage channels to prevent water accumulation.")

        if req.nitrogen < 40:
            risks.append("Nutrient Deficit: Low Nitrogen input limiting biomass and yield potential.")
            tips.append("Apply split doses of Nitrogen (Urea) co-applied with Neem coating.")

        if not risks:
            risks.append("Low Risk: Weather and soil parameters match recommended agronomic bands.")
        
        tips.append("Monitor localized weather alerts weekly to adjust fertigation schedules.")

        # Convert to tonnes per hectare (1 tonne/ha ≈ 4.04686 quintals/acre)
        yield_tonnes_ha = round(yield_per_acre_rounded / 4.04686, 2)
        min_tonnes = max(0.1, round(yield_tonnes_ha * 0.88, 2))
        max_tonnes = round(yield_tonnes_ha * 1.14, 2)

        return YieldPredictionResponse(
            crop=req.crop,
            season=req.season,
            area_acres=req.area_acres,
            predicted_yield_per_acre_quintals=yield_per_acre_rounded,
            total_expected_yield_quintals=total_yield,
            revenue_estimate=revenue_est,
            risk_assessment=risks,
            yield_optimization_tips=tips,
            estimated_yield=yield_tonnes_ha,
            unit="tonnes/hectare",
            estimated_range={"min": min_tonnes, "max": max_tonnes},
            predicted_yield_tonnes_per_hectare=yield_tonnes_ha
        )

yield_engine = YieldPredictionEngine()
