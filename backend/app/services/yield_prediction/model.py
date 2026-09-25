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

MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), "yield_prediction_rf.joblib")

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
        self.load_or_train_model()

    def load_or_train_model(self):
        if os.path.exists(MODEL_FILE_PATH):
            try:
                self.model = joblib.load(MODEL_FILE_PATH)
                return
            except Exception:
                pass

        df = generate_synthetic_yield_dataset()
        df_encoded = pd.get_dummies(df, columns=["crop"])
        X = df_encoded.drop(columns=["yield_per_acre"])
        y = df_encoded["yield_per_acre"]

        rf = RandomForestRegressor(n_estimators=100, random_state=42)
        rf.fit(X, y)
        self.model = rf
        joblib.dump((rf, list(X.columns)), MODEL_FILE_PATH)

    def predict(self, req: YieldPredictionRequest) -> YieldPredictionResponse:
        rf_tuple = joblib.load(MODEL_FILE_PATH) if not isinstance(self.model, tuple) else self.model
        if isinstance(rf_tuple, tuple):
            clf, feature_columns = rf_tuple
        else:
            clf = rf_tuple
            df_dummy = pd.get_dummies(generate_synthetic_yield_dataset(), columns=["crop"])
            feature_columns = list(df_dummy.drop(columns=["yield_per_acre"]).columns)

        crop_clean = req.crop.strip().lower()
        
        # Build input row matching feature_columns
        row = {col: 0.0 for col in feature_columns}
        row["N"] = req.nitrogen
        row["P"] = req.phosphorus
        row["K"] = req.potassium
        row["rainfall"] = req.rainfall
        row["temperature"] = req.temperature
        
        crop_col = f"crop_{crop_clean}"
        if crop_col in row:
            row[crop_col] = 1.0

        input_df = pd.DataFrame([row])[feature_columns]
        predicted_yield_per_acre = float(clf.predict(input_df)[0])
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

        return YieldPredictionResponse(
            crop=req.crop,
            season=req.season,
            area_acres=req.area_acres,
            predicted_yield_per_acre_quintals=yield_per_acre_rounded,
            total_expected_yield_quintals=total_yield,
            revenue_estimate=revenue_est,
            risk_assessment=risks,
            yield_optimization_tips=tips
        )

yield_engine = YieldPredictionEngine()
