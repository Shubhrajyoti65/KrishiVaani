"""
KrishiVaani — Crop Recommendation Model Training Pipeline
Trains Random Forest, XGBoost, and CatBoost candidates on existing dataset.
Evaluates accuracy, precision, recall, F1, and confusion matrix.
Saves the best model, preprocessing metadata, and metrics.
"""
import os
import sys
import json
import joblib
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Add project root to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ml.crop_recommendation.preprocessing import (
    load_and_preprocess_dataset, FEATURE_COLUMNS, TARGET_COLUMN
)

DATA_PATH = os.path.join(PROJECT_ROOT, "backend", "data", "Crop_recommendation", "Crop_recommendation.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")
SERVICE_MODEL_PATH = os.path.join(
    PROJECT_ROOT, "backend", "app", "services", "crop_recommendation", "crop_recommendation_rf.joblib"
)

def train_and_evaluate():
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    print(f"[INFO] Loading dataset from: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Existing dataset not found at: {DATA_PATH}")

    X, y, label_encoder = load_and_preprocess_dataset(DATA_PATH)
    print(f"[INFO] Dataset shape: {X.shape[0]} rows, {X.shape[1]} features, {len(label_encoder.classes_)} classes.")
    
    # 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"[INFO] Train set: {len(X_train)} samples, Test set: {len(X_test)} samples.")

    candidates = {}

    # 1. Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    candidates["Random Forest"] = rf

    # 2. XGBoost
    try:
        from xgboost import XGBClassifier
        xgb = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric="mlogloss",
            verbosity=0
        )
        candidates["XGBoost"] = xgb
    except Exception as e:
        print(f"[WARN] XGBoost candidate skipped: {e}")

    # 3. CatBoost
    try:
        from catboost import CatBoostClassifier
        cb = CatBoostClassifier(
            iterations=100,
            depth=6,
            learning_rate=0.1,
            random_seed=42,
            verbose=0
        )
        candidates["CatBoost"] = cb
    except Exception as e:
        print(f"[WARN] CatBoost candidate skipped: {e}")

    results = {}
    best_name = None
    best_f1 = -1.0
    best_model = None

    print("\n" + "="*60)
    print("EVALUATING CANDIDATE MODELS")
    print("="*60)

    for name, model in candidates.items():
        print(f"\n[TRAINING] {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        if hasattr(y_pred, "flatten"):
            y_pred = y_pred.flatten()

        acc = float(accuracy_score(y_test, y_pred))
        prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1_mac = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
        f1_wt = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()

        metrics = {
            "accuracy": round(acc, 4),
            "precision_macro": round(prec_macro, 4),
            "precision_weighted": round(prec_weighted, 4),
            "recall_macro": round(rec_macro, 4),
            "recall_weighted": round(rec_weighted, 4),
            "f1_macro": round(f1_mac, 4),
            "f1_weighted": round(f1_wt, 4),
        }
        results[name] = {
            "metrics": metrics,
            "confusion_matrix_shape": [len(cm), len(cm[0])]
        }

        print(f"[{name}] Accuracy: {acc*100:.2f}% | F1 Weighted: {f1_wt*100:.2f}% | Macro F1: {f1_mac*100:.2f}%")

        if f1_wt > best_f1:
            best_f1 = f1_wt
            best_name = name
            best_model = model

    print("\n" + "="*60)
    print(f"[BEST MODEL SELECTED] {best_name} with F1-Score: {best_f1*100:.2f}%")
    print("="*60)

    # Save best model artifact as (model, label_encoder)
    best_model_path = os.path.join(MODEL_DIR, "crop_recommendation_best.joblib")
    joblib.dump((best_model, label_encoder), best_model_path)
    # Also update active service model
    joblib.dump((best_model, label_encoder), SERVICE_MODEL_PATH)
    print(f"[SUCCESS] Best model serialized to:\n  - {best_model_path}\n  - {SERVICE_MODEL_PATH}")

    # Explicitly serialize XGBoost model for production XGBoost deployment
    if "XGBoost" in candidates:
        xgb_model = candidates["XGBoost"]
        xgb_model_path = os.path.join(MODEL_DIR, "crop_recommendation_xgb.joblib")
        xgb_service_path = os.path.join(
            PROJECT_ROOT, "backend", "app", "services", "crop_recommendation", "crop_recommendation_xgb.joblib"
        )
        joblib.dump((xgb_model, label_encoder), xgb_model_path)
        joblib.dump((xgb_model, label_encoder), xgb_service_path)
        print(f"[SUCCESS] XGBoost model specifically serialized to:\n  - {xgb_model_path}\n  - {xgb_service_path}")

    # Save comprehensive metrics JSON
    metrics_data = {
        "model_name": f"crop_recommendation_{best_name.lower().replace(' ', '_')}",
        "version": "1.0.0",
        "dataset": "Crop_recommendation.csv",
        "dataset_rows": int(len(X)),
        "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "features": FEATURE_COLUMNS,
        "classes": list(label_encoder.classes_),
        "num_classes": len(label_encoder.classes_),
        "best_model": best_name,
        "all_candidates": results,
        "selected_metrics": results[best_name]["metrics"]
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"[SUCCESS] Model metrics saved to: {METRICS_PATH}")

    return metrics_data

if __name__ == "__main__":
    train_and_evaluate()
