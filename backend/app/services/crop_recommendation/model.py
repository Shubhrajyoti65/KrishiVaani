import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, Any, Tuple, List
from backend.app.services.crop_recommendation.schema import (
    CropRecommendationRequest,
    CropRecommendationResponse,
    CropConfidence,
)

MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), "crop_recommendation_rf.joblib")

# Synthetic baseline dataset generator for standard Indian crops based on agronomic thresholds
def generate_synthetic_agri_dataset():
    np.random.seed(42)
    crops_profile = {
        "rice": {"N": (80, 120), "P": (35, 60), "K": (35, 50), "temp": (20, 27), "hum": (80, 95), "ph": (6.0, 7.5), "rain": (180, 300)},
        "maize": {"N": (60, 100), "P": (35, 60), "K": (15, 30), "temp": (18, 27), "hum": (55, 75), "ph": (5.5, 7.0), "rain": (60, 110)},
        "chickpea": {"N": (20, 50), "P": (55, 80), "K": (75, 85), "temp": (17, 23), "hum": (14, 20), "ph": (6.0, 8.5), "rain": (65, 95)},
        "kidneybeans": {"N": (15, 40), "P": (55, 80), "K": (15, 25), "temp": (15, 24), "hum": (18, 25), "ph": (5.5, 6.0), "rain": (60, 150)},
        "pigeonpeas": {"N": (15, 40), "P": (55, 80), "K": (15, 25), "temp": (27, 38), "hum": (45, 65), "ph": (5.5, 7.5), "rain": (90, 200)},
        "mothbeans": {"N": (15, 40), "P": (35, 60), "K": (15, 25), "temp": (24, 32), "hum": (40, 65), "ph": (3.5, 10.0), "rain": (30, 75)},
        "mungbean": {"N": (15, 40), "P": (35, 60), "K": (15, 25), "temp": (27, 30), "hum": (80, 90), "ph": (6.2, 7.2), "rain": (35, 60)},
        "blackgram": {"N": (35, 60), "P": (55, 80), "K": (20, 35), "temp": (25, 35), "hum": (60, 75), "ph": (6.5, 7.8), "rain": (60, 75)},
        "lentil": {"N": (15, 40), "P": (55, 80), "K": (15, 25), "temp": (18, 30), "hum": (60, 70), "ph": (5.9, 7.4), "rain": (35, 55)},
        "pomegranate": {"N": (15, 40), "P": (10, 30), "K": (35, 45), "temp": (18, 26), "hum": (85, 95), "ph": (5.5, 7.2), "rain": (100, 115)},
        "banana": {"N": (90, 120), "P": (70, 95), "K": (45, 55), "temp": (25, 30), "hum": (75, 85), "ph": (5.5, 6.5), "rain": (90, 120)},
        "mango": {"N": (15, 40), "P": (15, 40), "K": (25, 35), "temp": (27, 36), "hum": (45, 55), "ph": (4.5, 7.0), "rain": (85, 100)},
        "grapes": {"N": (15, 40), "P": (120, 145), "K": (195, 205), "temp": (8, 40), "hum": (80, 85), "ph": (5.5, 6.5), "rain": (65, 75)},
        "watermelon": {"N": (80, 120), "P": (5, 30), "K": (45, 55), "temp": (24, 27), "hum": (80, 90), "ph": (6.0, 7.0), "rain": (40, 60)},
        "muskmelon": {"N": (80, 120), "P": (5, 30), "K": (45, 55), "temp": (27, 30), "hum": (90, 95), "ph": (6.0, 6.8), "rain": (20, 30)},
        "apple": {"N": (0, 40), "P": (120, 145), "K": (195, 205), "temp": (21, 24), "hum": (90, 95), "ph": (5.5, 6.5), "rain": (100, 125)},
        "orange": {"N": (15, 40), "P": (5, 30), "K": (5, 15), "temp": (10, 35), "hum": (90, 95), "ph": (6.0, 8.0), "rain": (100, 120)},
        "papaya": {"N": (35, 70), "P": (45, 70), "K": (45, 55), "temp": (23, 44), "hum": (90, 95), "ph": (6.5, 7.0), "rain": (40, 250)},
        "coconut": {"N": (15, 40), "P": (5, 30), "K": (25, 35), "temp": (25, 28), "hum": (90, 99), "ph": (5.5, 6.5), "rain": (130, 225)},
        "cotton": {"N": (100, 140), "P": (35, 60), "K": (15, 25), "temp": (22, 26), "hum": (75, 85), "ph": (5.8, 8.0), "rain": (60, 90)},
        "jute": {"N": (60, 90), "P": (35, 60), "K": (35, 45), "temp": (23, 26), "hum": (70, 80), "ph": (6.0, 7.5), "rain": (150, 200)},
        "coffee": {"N": (80, 120), "P": (15, 35), "K": (25, 35), "temp": (23, 28), "hum": (50, 70), "ph": (6.0, 7.5), "rain": (115, 190)}
    }

    data = []
    samples_per_crop = 100
    for crop, prof in crops_profile.items():
        for _ in range(samples_per_crop):
            N = np.random.uniform(*prof["N"])
            P = np.random.uniform(*prof["P"])
            K = np.random.uniform(*prof["K"])
            temp = np.random.uniform(*prof["temp"])
            hum = np.random.uniform(*prof["hum"])
            ph = np.random.uniform(*prof["ph"])
            rain = np.random.uniform(*prof["rain"])
            data.append([N, P, K, temp, hum, ph, rain, crop])

    df = pd.DataFrame(data, columns=["N", "P", "K", "temperature", "humidity", "ph", "rainfall", "label"])
    return df


class CropRecommendationEngine:
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
        
        custom_csv_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "data", "crop_recommendation", "Crop_recommendation.csv"
        )
        if os.path.exists(custom_csv_path):
            try:
                df = pd.read_csv(custom_csv_path)
            except Exception:
                df = generate_synthetic_agri_dataset()
        else:
            df = generate_synthetic_agri_dataset()

        X = df[["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]]
        y = df["label"]
        
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X, y)
        self.model = clf
        joblib.dump(clf, MODEL_FILE_PATH)


    def assess_soil_health(self, N: float, P: float, K: float, ph: float) -> Dict[str, str]:
        assessment = {}
        # Nitrogen assessment
        if N < 50:
            assessment["Nitrogen"] = "Low - Nitrogen deficient. Consider applying urea or organic compost."
        elif N <= 100:
            assessment["Nitrogen"] = "Optimal - Good nitrogen level for most crops."
        else:
            assessment["Nitrogen"] = "High - Abundant nitrogen. Limit extra nitrogenous fertilizers."

        # Phosphorus assessment
        if P < 30:
            assessment["Phosphorus"] = "Low - Phosphorus deficient. Apply DAP or Single Super Phosphate (SSP)."
        elif P <= 80:
            assessment["Phosphorus"] = "Optimal - Healthy phosphorus range."
        else:
            assessment["Phosphorus"] = "High - Elevated phosphorus levels."

        # Potassium assessment
        if K < 30:
            assessment["Potassium"] = "Low - Potassium deficient. Apply Muriate of Potash (MOP)."
        elif K <= 80:
            assessment["Potassium"] = "Optimal - Sufficient potassium."
        else:
            assessment["Potassium"] = "High - High potassium concentration."

        # pH assessment
        if ph < 5.5:
            assessment["pH"] = "Acidic - Soil is acidic. Lime (calcium carbonate) application recommended."
        elif ph <= 7.5:
            assessment["pH"] = "Neutral - Ideal pH range for nutrient availability."
        else:
            assessment["pH"] = "Alkaline - Soil is alkaline. Gypsum application recommended."

        return assessment

    def generate_advisory(self, crop: str, req: CropRecommendationRequest) -> List[str]:
        notes = [f"Recommended crop '{crop.capitalize()}' is well suited for your local soil & climate profile."]
        
        if req.rainfall < 70 and crop in ["rice", "jute", "papaya"]:
            notes.append("Note: This crop requires high moisture. Ensure supplemental irrigation is available.")
        if req.ph < 6.0:
            notes.append("Consider applying agricultural lime to elevate soil pH towards neutral range.")
        if req.nitrogen < 40:
            notes.append("Incorporate leguminous cover crops or bio-fertilizers to enhance soil organic nitrogen.")

        return notes

    def predict(self, req: CropRecommendationRequest) -> CropRecommendationResponse:
        input_features = pd.DataFrame([{
            "N": req.nitrogen,
            "P": req.phosphorus,
            "K": req.potassium,
            "temperature": req.temperature,
            "humidity": req.humidity,
            "ph": req.ph,
            "rainfall": req.rainfall
        }])

        probs = self.model.predict_proba(input_features)[0]

        classes = self.model.classes_

        # Sort by confidence
        sorted_indices = np.argsort(probs)[::-1]
        top_recommendations = [
            CropConfidence(crop=classes[i], confidence=round(float(probs[i]), 4))
            for i in sorted_indices[:3]
        ]

        primary_crop = top_recommendations[0].crop
        primary_confidence = top_recommendations[0].confidence

        soil_assessment = self.assess_soil_health(req.nitrogen, req.phosphorus, req.potassium, req.ph)
        advisory = self.generate_advisory(primary_crop, req)

        return CropRecommendationResponse(
            primary_recommendation=primary_crop,
            confidence=primary_confidence,
            top_recommendations=top_recommendations,
            soil_health_assessment=soil_assessment,
            advisory_notes=advisory
        )

# Global singleton instance
crop_engine = CropRecommendationEngine()
