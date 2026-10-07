import os
import sys
import warnings
import joblib
import sklearn

def update_sklearn_version(obj):
    if hasattr(obj, "_sklearn_version"):
        obj._sklearn_version = sklearn.__version__
    
    # If it's a Pipeline
    if hasattr(obj, "steps"):
        for name, step in obj.steps:
            update_sklearn_version(step)
    
    # If it's a ColumnTransformer
    if hasattr(obj, "transformers_"):
        for name, trans, cols in obj.transformers_:
            if trans not in ("drop", "passthrough", None):
                update_sklearn_version(trans)

    # If it's an ensemble (RandomForest, etc.)
    if hasattr(obj, "estimators_"):
        for sub in obj.estimators_:
            update_sklearn_version(sub)

    # If it has base_estimator or estimator
    if hasattr(obj, "estimator_"):
        update_sklearn_version(obj.estimator_)

    # If tuple or list
    if isinstance(obj, (tuple, list)):
        for item in obj:
            update_sklearn_version(item)

def test_file(filepath):
    print(f"\n--- Checking {filepath} ---")
    with warnings.catch_warnings(record=True) as w_before:
        obj = joblib.load(filepath)
    print(f"Warnings before: {len(w_before)}")
    for item in w_before:
        print(f"  [Before Warning] {item.category.__name__}: {item.message}")

    update_sklearn_version(obj)
    
    # If it's XGBoost, check if we need to call save_model / load_model
    def fix_xgboost(item):
        if hasattr(item, "get_booster"):
            try:
                booster = item.get_booster()
                # Ensure booster is in memory
            except Exception:
                pass
        if isinstance(item, (tuple, list)):
            for sub in item:
                fix_xgboost(sub)
        if hasattr(item, "steps"):
            for _, step in item.steps:
                fix_xgboost(step)

    fix_xgboost(obj)

    joblib.dump(obj, filepath)
    
    with warnings.catch_warnings(record=True) as w_after:
        joblib.load(filepath)
    print(f"Warnings after: {len(w_after)}")
    for item in w_after:
        print(f"  [After Warning] {item.category.__name__}: {item.message}")

if __name__ == "__main__":
    files = [
        "backend/app/services/crop_recommendation/crop_recommendation_rf.joblib",
        "backend/app/services/crop_recommendation/crop_recommendation_xgb.joblib",
        "backend/ml/crop_recommendation/model/crop_recommendation_best.joblib",
        "backend/ml/crop_recommendation/model/crop_recommendation_xgb.joblib",
        "backend/app/services/yield_prediction/yield_prediction_rf.joblib",
        "backend/ml/yield_prediction/model/yield_prediction_best.joblib",
    ]
    for f in files:
        if os.path.exists(f):
            test_file(f)
