"""
KrishiVaani — Yield Prediction Model Training Pipeline
Trains Random Forest, XGBoost, and CatBoost regressors on the official Indian Crop Production dataset.
Evaluates MAE, RMSE, and R2 on a held-out test set.
Saves the best model pipeline, feature metadata, and metrics.json.
"""
import os
import sys
import json
import joblib
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ml.yield_prediction.preprocessing import (
    load_and_preprocess_yield_data, FEATURE_COLS
)

DATA_PATH = os.path.join(
    PROJECT_ROOT, "backend", "data", "Crop Production data", "Crop Production data.csv", "Crop Production data.csv"
)
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")
SERVICE_MODEL_PATH = os.path.join(
    PROJECT_ROOT, "backend", "app", "services", "yield_prediction", "yield_prediction_rf.joblib"
)

def train_and_evaluate():
    os.makedirs(MODEL_DIR, exist_ok=True)

    print(f"[INFO] Loading yield dataset from: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Existing yield dataset not found at: {DATA_PATH}")

    X, y, metadata = load_and_preprocess_yield_data(DATA_PATH, max_samples=75000)
    print(f"[INFO] Processed samples: {len(X)}, crops: {len(metadata['crops'])}, states: {len(metadata['states'])}")

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"[INFO] Train split: {len(X_train)} samples, Test split: {len(X_test)} samples.")

    # Preprocessing transformer for categorical features
    cat_features = ["Crop", "State_Name", "Season"]
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
            ("num", "passthrough", ["Area"])
        ]
    )

    candidates = {}

    # 1. Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=80, max_depth=16, random_state=42, n_jobs=-1)
    candidates["Random Forest Regressor"] = rf

    # 2. XGBoost Regressor
    try:
        from xgboost import XGBRegressor
        xgb = XGBRegressor(
            n_estimators=100,
            max_depth=7,
            learning_rate=0.08,
            random_state=42,
            n_jobs=-1
        )
        candidates["XGBoost Regressor"] = xgb
    except Exception as e:
        print(f"[WARN] XGBoost candidate skipped: {e}")

    # 3. CatBoost Regressor
    try:
        from catboost import CatBoostRegressor
        cb = CatBoostRegressor(
            iterations=100,
            depth=7,
            learning_rate=0.08,
            random_seed=42,
            verbose=0
        )
        candidates["CatBoost Regressor"] = cb
    except Exception as e:
        print(f"[WARN] CatBoost candidate skipped: {e}")

    results = {}
    best_name = None
    best_r2 = -float("inf")
    best_pipeline = None

    print("\n" + "="*60)
    print("EVALUATING YIELD REGRESSION CANDIDATES")
    print("="*60)

    for name, regressor in candidates.items():
        print(f"\n[TRAINING] {name}...")
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", regressor)
        ])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        if hasattr(y_pred, "flatten"):
            y_pred = y_pred.flatten()

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        metrics = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "target_unit": "tonnes/hectare"
        }
        results[name] = {"metrics": metrics}

        print(f"[{name}] MAE: {mae:.3f} t/ha | RMSE: {rmse:.3f} t/ha | R2 Score: {r2:.4f}")

        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            best_pipeline = pipeline

    print("\n" + "="*60)
    print(f"[BEST MODEL SELECTED] {best_name} with R2: {best_r2:.4f}")
    print("="*60)

    # Save best model pipeline
    best_model_path = os.path.join(MODEL_DIR, "yield_prediction_best.joblib")
    saved_bundle = {
        "pipeline": best_pipeline,
        "metadata": metadata,
        "model_name": best_name,
        "trained_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    joblib.dump(saved_bundle, best_model_path)
    # Also save to service location
    joblib.dump(saved_bundle, SERVICE_MODEL_PATH)
    print(f"[SUCCESS] Yield pipeline serialized to:\n  - {best_model_path}\n  - {SERVICE_MODEL_PATH}")

    # Metrics JSON
    metrics_data = {
        "model_name": f"yield_prediction_{best_name.lower().replace(' ', '_')}",
        "version": "1.0.0",
        "dataset": "Crop Production data.csv",
        "features": FEATURE_COLS,
        "target": "Yield (tonnes/hectare)",
        "target_formula": "Production / Area",
        "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "best_model": best_name,
        "all_candidates": results,
        "selected_metrics": results[best_name]["metrics"]
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"[SUCCESS] Yield metrics saved to: {METRICS_PATH}")

    return metrics_data

if __name__ == "__main__":
    train_and_evaluate()
