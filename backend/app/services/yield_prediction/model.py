import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import torch
import torch.nn as nn
from sklearn.ensemble import RandomForestRegressor

from backend.app.services.yield_prediction.schema import (
    YieldPredictionRequest,
    YieldPredictionResponse,
    RevenueEstimate,
)

PYTORCH_MODEL_PATH = os.path.join(os.path.dirname(__file__), "yield_prediction_pytorch.pt")
RF_MODEL_PATH = os.path.join(os.path.dirname(__file__), "yield_prediction_rf.joblib")

class YieldRegressionNN(nn.Module):
    def __init__(self, input_dim):
        super(YieldRegressionNN, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )

    def forward(self, x):
        return self.net(x)

# Baseline Indian MSP prices (INR per Quintal) for key crops (2024-2026 reference)
MSP_PRICES = {
    "rice": 2300.0,
    "wheat": 2275.0,
    "maize": 2225.0,
    "cotton": 7121.0,
    "chickpea": 5440.0,
    "sugarcane": 315.0,
    "pigeonpeas": 7000.0,
    "blackgram": 6950.0,
    "mungbean": 8558.0,
    "jute": 5050.0,
    "groundnut": 6783.0,
    "mustard": 5650.0,
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
            
            base = np.random.uniform(*prof["yield_range"])
            n_factor = 1.0 - abs(N - prof["opt_N"]) / 300.0
            rain_factor = 1.0 - abs(rain - prof["opt_rain"]) / 2500.0
            yield_per_acre = max(1.0, base * n_factor * rain_factor)
            
            data.append([N, P, K, rain, temp, crop, yield_per_acre])

    df = pd.DataFrame(data, columns=["N", "P", "K", "rainfall", "temperature", "crop", "yield_per_acre"])
    return df

class YieldPredictionEngine:
    def __init__(self):
        self.pytorch_model = None
        self.pytorch_meta = None
        self.rf_model = None
        self.rf_features = None
        self.load_models()

    def load_models(self):
        # 1. Try PyTorch Deep Regression Network
        if os.path.exists(PYTORCH_MODEL_PATH):
            try:
                ckpt = torch.load(PYTORCH_MODEL_PATH, map_location="cpu")
                net = YieldRegressionNN(input_dim=len(ckpt["feature_columns"]))
                net.load_state_dict(ckpt["model_state_dict"])
                net.eval()
                self.pytorch_model = net
                self.pytorch_meta = ckpt
            except Exception:
                self.pytorch_model = None

        # 2. Try Random Forest fallback
        if os.path.exists(RF_MODEL_PATH):
            try:
                loaded = joblib.load(RF_MODEL_PATH)
                if isinstance(loaded, tuple):
                    self.rf_model, self.rf_features = loaded
                else:
                    self.rf_model = loaded
                    df_dummy = pd.get_dummies(generate_synthetic_yield_dataset(), columns=["crop"])
                    self.rf_features = list(df_dummy.drop(columns=["yield_per_acre"]).columns)
                return
            except Exception:
                pass

        if self.rf_model is None and self.pytorch_model is None:
            df = generate_synthetic_yield_dataset()
            df_encoded = pd.get_dummies(df, columns=["crop"])
            X = df_encoded.drop(columns=["yield_per_acre"])
            y = df_encoded["yield_per_acre"]

            rf = RandomForestRegressor(n_estimators=100, random_state=42)
            rf.fit(X, y)
            self.rf_model = rf
            self.rf_features = list(X.columns)
            joblib.dump((rf, self.rf_features), RF_MODEL_PATH)

    def predict(self, req: YieldPredictionRequest) -> YieldPredictionResponse:
        crop_clean = req.crop.strip().lower()
        state_clean = req.state.strip().lower()

        predicted_yield_per_acre = None

        # Predict using PyTorch model if available
        if self.pytorch_model is not None and self.pytorch_meta is not None:
            try:
                feature_columns = self.pytorch_meta["feature_columns"]
                mean = np.array(self.pytorch_meta["scaler_mean"], dtype=np.float32)
                scale = np.array(self.pytorch_meta["scaler_scale"], dtype=np.float32)

                row = {col: 0.0 for col in feature_columns}
                row["nitrogen"] = req.nitrogen
                row["phosphorus"] = req.phosphorus
                row["potassium"] = req.potassium
                row["rainfall"] = req.rainfall
                row["temperature"] = req.temperature

                crop_col = f"crop_{crop_clean}"
                if crop_col in row:
                    row[crop_col] = 1.0

                state_col = f"state_{state_clean}"
                if state_col in row:
                    row[state_col] = 1.0

                feats = np.array([row[c] for c in feature_columns], dtype=np.float32)
                norm_feats = (feats - mean) / scale
                tensor_x = torch.tensor(norm_feats, dtype=torch.float32).unsqueeze(0)

                with torch.no_grad():
                    pred_tensor = self.pytorch_model(tensor_x)
                    predicted_yield_per_acre = float(pred_tensor.squeeze().item())
            except Exception:
                predicted_yield_per_acre = None

        # Fallback to Random Forest
        if predicted_yield_per_acre is None or predicted_yield_per_acre <= 0:
            if self.rf_model is not None and self.rf_features is not None:
                row = {col: 0.0 for col in self.rf_features}
                row["N"] = req.nitrogen
                row["P"] = req.phosphorus
                row["K"] = req.potassium
                row["rainfall"] = req.rainfall
                row["temperature"] = req.temperature
                crop_col = f"crop_{crop_clean}"
                if crop_col in row:
                    row[crop_col] = 1.0
                input_df = pd.DataFrame([row])[self.rf_features]
                predicted_yield_per_acre = float(self.rf_model.predict(input_df)[0])
            else:
                predicted_yield_per_acre = 12.5

        yield_per_acre_rounded = round(max(0.5, predicted_yield_per_acre), 2)
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
