"""
KrishiVaani — Yield Prediction Preprocessing Pipeline
Prepares features from the official Indian Crop Production dataset.
"""
import os
import re
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List
from sklearn.preprocessing import OneHotEncoder, StandardScaler

EXCLUDED_CROPS = {"coconut", "coconut ", "cashewnut"}
VALID_SEASONS = {"kharif", "rabi", "summer", "autumn", "winter", "whole year"}

FEATURE_COLS = ["Crop", "State_Name", "Season", "Area"]
TARGET_COL = "Yield"

def clean_crop_name(c: str) -> str:
    """Normalize crop name to match dataset naming."""
    c = str(c).strip().lower()
    c = re.sub(r"\(.*?\)", "", c).strip()
    return c.title()

def clean_season_name(s: str) -> str:
    s = str(s).strip().lower()
    if s not in VALID_SEASONS:
        return "Kharif"
    return s.title()

def clean_state_name(st: str) -> str:
    return str(st).strip().title()

def load_and_preprocess_yield_data(csv_path: str, max_samples: int = 100000) -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
    """
    Loads Crop Production dataset, computes Yield = Production / Area,
    filters realistic yields, and prepares feature sets.
    """
    df = pd.read_csv(csv_path)
    df["Crop"] = df["Crop"].astype(str).str.strip()
    df["State_Name"] = df["State_Name"].astype(str).str.strip()
    df["Season"] = df["Season"].astype(str).str.strip()

    # Drop missing production and non-positive area/production
    df = df.dropna(subset=["Production", "Area"])
    df = df[(df["Area"] > 0) & (df["Production"] > 0)]

    # Exclude non-weight crops like coconut
    df = df[~df["Crop"].str.lower().isin(EXCLUDED_CROPS)]

    # Calculate Yield in Tonnes/Hectare
    df["Yield"] = df["Production"] / df["Area"]

    # Filter out extreme noise / recording errors (yield > 150 t/ha or yield < 0.05 t/ha)
    df = df[(df["Yield"] >= 0.05) & (df["Yield"] <= 150.0)]

    # Select top 50 most prevalent crops for robust regression
    top_crops = df["Crop"].value_counts().head(50).index.tolist()
    df = df[df["Crop"].isin(top_crops)]

    # Subsample if dataset is very large for fast, reproducible training
    if len(df) > max_samples:
        df = df.sample(n=max_samples, random_state=42)

    X_raw = df[FEATURE_COLS].copy()
    y = df[TARGET_COL].copy()

    metadata = {
        "crops": sorted(list(df["Crop"].unique())),
        "states": sorted(list(df["State_Name"].unique())),
        "seasons": sorted(list(df["Season"].unique())),
        "feature_cols": FEATURE_COLS,
        "target_unit": "tonnes/hectare"
    }

    return X_raw, y, metadata
