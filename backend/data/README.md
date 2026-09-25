# KrishiVaani Datasets Directory

This directory is where you can place custom CSV datasets or pre-trained ML model files to train the KrishiVaani engines on your own data.

## Folder Structure

### 1. Crop Recommendation Dataset
- **Path**: `backend/data/crop_recommendation/Crop_recommendation.csv`
- **Expected Columns**: `N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`, `label`
- **Format**: CSV format (e.g., standard Kaggle Indian Crop Recommendation dataset).

### 2. Crop Yield Prediction Dataset
- **Path**: `backend/data/yield_prediction/crop_yield.csv`
- **Expected Columns**: `N`, `P`, `K`, `rainfall`, `temperature`, `crop`, `yield_per_acre`
- **Format**: CSV format containing crop yield records across Indian states.

### 3. Leaf Disease Detection Models & Datasets
- **Path**: `backend/data/disease_detection/`
- **Usage**: Place custom leaf image datasets or pre-trained weight files (`.pt`, `.onnx`, `.h5`, `.joblib`).

---
*Note: If custom CSV files are not placed here, KrishiVaani engines automatically run using optimized agronomic baseline distributions.*
