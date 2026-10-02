"""
KrishiVaani — Crop Recommendation Predict Module
Provides clean inference on top of the trained model with suitability tiers.
"""
import os
import sys
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ml.crop_recommendation.preprocessing import prepare_input_dataframe

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "crop_recommendation_best.joblib")
FALLBACK_MODEL_PATH = os.path.join(
    PROJECT_ROOT, "backend", "app", "services", "crop_recommendation", "crop_recommendation_rf.joblib"
)

_cached_model = None
_cached_le = None

def get_model():
    global _cached_model, _cached_le
    if _cached_model is not None:
        return _cached_model, _cached_le

    path_to_load = MODEL_PATH if os.path.exists(MODEL_PATH) else FALLBACK_MODEL_PATH
    if not os.path.exists(path_to_load):
        raise FileNotFoundError(f"Model file not found at {path_to_load}. Please run train.py first.")

    loaded = joblib.load(path_to_load)
    if isinstance(loaded, tuple):
        _cached_model, _cached_le = loaded[0], loaded[1]
    else:
        _cached_model, _cached_le = loaded, None
    return _cached_model, _cached_le

def classify_suitability(confidence: float) -> str:
    """Label confidence in farmer-friendly language without claiming absolute certainty."""
    if confidence >= 0.55:
        return "High suitability"
    elif confidence >= 0.20:
        return "Moderate suitability"
    else:
        return "Low suitability"

def predict_crop_recommendations(features: Dict[str, float], top_k: int = 3) -> Dict[str, Any]:
    """
    Given N, P, K, temperature, humidity, ph, rainfall, returns top_k recommendations
    with probability score, suitability tier, and soil health note.
    """
    model, le = get_model()
    df_input = prepare_input_dataframe(features)

    probs = model.predict_proba(df_input)[0]
    classes = le.classes_ if le is not None else model.classes_

    # Sort descending
    sorted_idx = np.argsort(probs)[::-1]
    recommendations = []
    for i in sorted_idx[:top_k]:
        conf = float(probs[i])
        crop_name = str(classes[i])
        suitability = classify_suitability(conf)
        recommendations.append({
            "crop": crop_name.capitalize(),
            "score": round(conf, 4),
            "suitability": suitability,
        })

    primary = recommendations[0] if recommendations else {"crop": "Unknown", "score": 0.0, "suitability": "Low"}
    return {
        "primary_crop": primary["crop"],
        "confidence": primary["score"],
        "suitability": primary["suitability"],
        "top_recommendations": recommendations,
        "input_features": features
    }
