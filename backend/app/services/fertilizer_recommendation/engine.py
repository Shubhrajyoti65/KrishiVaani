"""
Fertilizer Recommendation Engine
Based on ICAR (Indian Council of Agricultural Research) fertilizer dose guidelines.
Provides N/P/K dose recommendations by crop, soil type, and growth stage.
"""
import json
from typing import Dict, List, Any
from backend.app.services.fertilizer_recommendation.schema import (
    FertilizerRequest, FertilizerResponse, FertilizerDose
)

# ── ICAR-based fertilizer dose table (kg/acre) ─────────────────────────────────
# Format: crop → soil_quality → {N, P2O5, K2O total kg/acre}
ICAR_DOSE_TABLE: Dict[str, Dict[str, Dict[str, float]]] = {
    "rice": {
        "high":   {"N": 50, "P2O5": 25, "K2O": 20},
        "medium": {"N": 60, "P2O5": 30, "K2O": 25},
        "low":    {"N": 70, "P2O5": 35, "K2O": 30},
    },
    "wheat": {
        "high":   {"N": 55, "P2O5": 25, "K2O": 20},
        "medium": {"N": 65, "P2O5": 30, "K2O": 25},
        "low":    {"N": 80, "P2O5": 40, "K2O": 30},
    },
    "maize": {
        "high":   {"N": 60, "P2O5": 25, "K2O": 20},
        "medium": {"N": 70, "P2O5": 30, "K2O": 25},
        "low":    {"N": 85, "P2O5": 40, "K2O": 30},
    },
    "cotton": {
        "high":   {"N": 80, "P2O5": 35, "K2O": 25},
        "medium": {"N": 90, "P2O5": 40, "K2O": 30},
        "low":    {"N": 100,"P2O5": 50, "K2O": 35},
    },
    "sugarcane": {
        "high":   {"N": 100,"P2O5": 50, "K2O": 60},
        "medium": {"N": 125,"P2O5": 60, "K2O": 70},
        "low":    {"N": 150,"P2O5": 75, "K2O": 80},
    },
    "potato": {
        "high":   {"N": 80, "P2O5": 60, "K2O": 80},
        "medium": {"N": 100,"P2O5": 75, "K2O": 100},
        "low":    {"N": 120,"P2O5": 90, "K2O": 120},
    },
    "soybean": {
        "high":   {"N": 10, "P2O5": 35, "K2O": 25},
        "medium": {"N": 15, "P2O5": 40, "K2O": 30},
        "low":    {"N": 20, "P2O5": 50, "K2O": 35},
    },
    "chickpea": {
        "high":   {"N": 8,  "P2O5": 35, "K2O": 20},
        "medium": {"N": 10, "P2O5": 40, "K2O": 25},
        "low":    {"N": 15, "P2O5": 50, "K2O": 30},
    },
    "mustard": {
        "high":   {"N": 40, "P2O5": 20, "K2O": 15},
        "medium": {"N": 50, "P2O5": 25, "K2O": 20},
        "low":    {"N": 60, "P2O5": 30, "K2O": 25},
    },
    "groundnut": {
        "high":   {"N": 10, "P2O5": 35, "K2O": 30},
        "medium": {"N": 15, "P2O5": 40, "K2O": 35},
        "low":    {"N": 20, "P2O5": 50, "K2O": 40},
    },
    "default": {
        "high":   {"N": 50, "P2O5": 25, "K2O": 20},
        "medium": {"N": 60, "P2O5": 30, "K2O": 25},
        "low":    {"N": 70, "P2O5": 35, "K2O": 30},
    },
}

# Conversion: nutrient kg → fertilizer product kg per acre
# Urea = 46% N,  DAP = 18% N + 46% P2O5,  MOP = 60% K2O
def _nutrient_to_fertilizer(N: float, P2O5: float, K2O: float) -> Dict[str, float]:
    # DAP satisfies P2O5 first, provides some N
    dap_kg = round(P2O5 / 0.46, 1)
    n_from_dap = dap_kg * 0.18
    remaining_N = max(0, N - n_from_dap)
    urea_kg = round(remaining_N / 0.46, 1)
    mop_kg = round(K2O / 0.60, 1)
    return {"urea_kg_per_acre": urea_kg, "dap_kg_per_acre": dap_kg, "mop_kg_per_acre": mop_kg}

# Application schedule per crop
SCHEDULES: Dict[str, str] = {
    "rice":     "Basal: DAP + MOP at transplanting. N in 2 splits: 50% at tillering (25 DAT), 50% at panicle initiation (50 DAT).",
    "wheat":    "Basal: Full DAP + MOP + 50% Urea at sowing. Top-dress remaining 50% Urea at first irrigation (CRI stage).",
    "maize":    "Basal: Full DAP + MOP at sowing. Urea in 3 splits: at sowing, knee-high stage, and tasseling.",
    "cotton":   "Basal: DAP + MOP at sowing. Urea: 1/3 at sowing, 1/3 at squaring, 1/3 at boll development.",
    "sugarcane":"Basal: Full P + K at planting. N in 3 splits: at planting, 45 days, and 90 days after planting.",
    "potato":   "Basal: 50% N + full P + K at planting. Top-dress remaining 50% N at earthing-up (30-35 DAP).",
    "soybean":  "Basal: Full dose at sowing (legume — minimal N needed). Rhizobium seed treatment recommended.",
    "chickpea": "Basal: Full dose at sowing. Rhizobium seed inoculation + PSB bio-fertilizer recommended.",
    "mustard":  "Basal: Full DAP + MOP at sowing. Top-dress Urea at first irrigation (20-25 DAS).",
    "groundnut":"Basal: Full dose at sowing. Gypsum @ 200 kg/acre at pegging stage for pod development.",
    "default":  "Apply basal dose at sowing/transplanting. Top-dress nitrogen in 2 splits at 30 and 60 DAS.",
}

# Organic supplement recommendations
ORGANICS: Dict[str, List[str]] = {
    "rice":     ["FYM 5 t/acre (before pudding)", "Azospirillum + PSB seed treatment @ 25g/kg"],
    "wheat":    ["FYM 4 t/acre before last ploughing", "Azotobacter seed treatment"],
    "default":  ["FYM 4-5 t/acre before sowing", "Vermicompost 1 t/acre improves soil structure"],
}

def _assess_soil_quality(N: float, P: float, K: float) -> str:
    score = 0
    if N >= 80: score += 2
    elif N >= 50: score += 1
    if P >= 40: score += 2
    elif P >= 25: score += 1
    if K >= 40: score += 2
    elif K >= 25: score += 1
    if score >= 5: return "high"
    if score >= 3: return "medium"
    return "low"


class FertilizerEngine:
    def recommend(self, req: FertilizerRequest) -> FertilizerResponse:
        crop_key = req.crop.lower().strip()
        if crop_key not in ICAR_DOSE_TABLE:
            crop_key = "default"

        soil_quality = _assess_soil_quality(req.nitrogen, req.phosphorus, req.potassium)
        dose_profile = ICAR_DOSE_TABLE[crop_key][soil_quality]

        # Adjust for actual soil nutrient levels
        N_needed  = max(0, dose_profile["N"]    - (req.nitrogen   * 0.3))
        P_needed  = max(0, dose_profile["P2O5"] - (req.phosphorus * 0.2))
        K_needed  = max(0, dose_profile["K2O"]  - (req.potassium  * 0.2))

        fert = _nutrient_to_fertilizer(N_needed, P_needed, K_needed)
        schedule = SCHEDULES.get(crop_key, SCHEDULES["default"])
        organics = ORGANICS.get(crop_key, ORGANICS["default"])

        deficiencies = []
        if req.nitrogen < 40:
            deficiencies.append("Nitrogen deficient — yellowing of older leaves (chlorosis)")
        if req.phosphorus < 25:
            deficiencies.append("Phosphorus deficient — purpling/reddening of stems and leaves")
        if req.potassium < 25:
            deficiencies.append("Potassium deficient — leaf tip/margin scorch (firing)")
        if req.ph and req.ph < 5.5:
            deficiencies.append("Acidic soil (pH < 5.5) — apply agricultural lime @ 200–400 kg/acre")
        elif req.ph and req.ph > 8.0:
            deficiencies.append("Alkaline soil (pH > 8.0) — apply gypsum @ 200 kg/acre")

        return FertilizerResponse(
            crop=req.crop.capitalize(),
            soil_quality_assessed=soil_quality,
            recommended_doses=FertilizerDose(
                urea_kg_per_acre=fert["urea_kg_per_acre"],
                dap_kg_per_acre=fert["dap_kg_per_acre"],
                mop_kg_per_acre=fert["mop_kg_per_acre"],
                total_N_kg_per_acre=round(N_needed, 1),
                total_P2O5_kg_per_acre=round(P_needed, 1),
                total_K2O_kg_per_acre=round(K_needed, 1),
            ),
            application_schedule=schedule,
            organic_supplements=organics,
            deficiency_symptoms=deficiencies,
            advisory=f"Based on ICAR guidelines for {req.crop.capitalize()} on {soil_quality}-fertility "
                      f"{req.soil_type} soil in {req.state}.",
        )


fertilizer_engine = FertilizerEngine()
