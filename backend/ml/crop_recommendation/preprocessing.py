"""
KrishiVaani — Crop Recommendation Preprocessing Pipeline
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.preprocessing import LabelEncoder

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COLUMN = "label"

FEATURE_RANGES = {
    "N": (0.0, 300.0),
    "P": (0.0, 300.0),
    "K": (0.0, 300.0),
    "temperature": (0.0, 60.0),
    "humidity": (5.0, 100.0),
    "ph": (3.0, 11.0),
    "rainfall": (0.0, 2000.0),
}

def validate_features(data: Dict[str, float]) -> Dict[str, float]:
    """Validate and clamp features to agronomic bounds."""
    validated = {}
    for feat in FEATURE_COLUMNS:
        val = float(data.get(feat, 0.0))
        min_v, max_v = FEATURE_RANGES[feat]
        if val < min_v or val > max_v:
            val = max(min_v, min(max_v, val))
        validated[feat] = val
    return validated

def prepare_input_dataframe(data: Dict[str, float]) -> pd.DataFrame:
    """Convert input dictionary to model-ready DataFrame."""
    clean_dict = validate_features(data)
    return pd.DataFrame([clean_dict])[FEATURE_COLUMNS]

def load_and_preprocess_dataset(csv_path: str) -> Tuple[pd.DataFrame, pd.Series, LabelEncoder]:
    """Load existing dataset and encode target labels."""
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])
    X = df[FEATURE_COLUMNS]
    y_raw = df[TARGET_COLUMN].str.strip().str.lower()
    
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    return X, pd.Series(y, name=TARGET_COLUMN), le
