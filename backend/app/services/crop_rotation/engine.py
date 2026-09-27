"""
Crop Rotation Recommendation Engine
Based on agronomic principles: nutrient cycling, pest-break, soil health.
"""
from typing import Dict, List
from backend.app.services.crop_rotation.schema import (
    CropRotationResponse, RotationOption
)

# ── Rotation rules database ────────────────────────────────────────────────────
# Format: previous_crop → list of {crop, reason, benefit, soil_types}
ROTATION_DB: Dict[str, List[Dict]] = {
    "rice": [
        {"crop": "wheat",    "reason": "Classic rice-wheat system of Indo-Gangetic Plains. Complementary seasons (Kharif/Rabi).", "benefit": "Efficient use of residual soil moisture; wheat straw improves SOM", "priority": 1},
        {"crop": "chickpea", "reason": "Legume break fixes atmospheric N, reducing fertilizer needs for next crop.", "benefit": "Adds 40–80 kg N/ha via biological fixation; breaks rice blast cycle", "priority": 2},
        {"crop": "mustard",  "reason": "Oil seed Rabi crop fits well after rice harvest in Oct-Nov.", "benefit": "Deepens root zone; different pest spectrum breaks disease cycle", "priority": 3},
        {"crop": "potato",   "reason": "High-value Rabi cash crop on residual rice field moisture.", "benefit": "Higher income; loose soil after potato benefits next Kharif crop", "priority": 4},
    ],
    "wheat": [
        {"crop": "rice",     "reason": "Established rice-wheat rotation in north India.", "benefit": "Seasonal complementarity; paddy straw (with management) adds OM", "priority": 1},
        {"crop": "maize",    "reason": "Kharif cereal with different pest/disease profile than wheat.", "benefit": "Different weed flora; deep roots improve soil structure", "priority": 2},
        {"crop": "soybean",  "reason": "Legume after cereal restores soil nitrogen balance.", "benefit": "Fixes N; improves soil organic matter; breaks wheat foliar disease cycle", "priority": 3},
        {"crop": "cotton",   "reason": "Summer/Kharif cash crop after wheat harvest in Apr-May.", "benefit": "Long growing period maximises summer rainfall; good income", "priority": 4},
    ],
    "cotton": [
        {"crop": "chickpea", "reason": "Short-duration Rabi legume fits after cotton picking (Nov-Dec).", "benefit": "N-fixation; breaks bollworm cycle effectively", "priority": 1},
        {"crop": "wheat",    "reason": "Cereal rotation after cotton in north India.", "benefit": "Different herbicide use; wheat residue recycles nutrients", "priority": 2},
        {"crop": "mustard",  "reason": "Rabi oilseed after cotton in Rajasthan and Gujarat.", "benefit": "Low water requirement; different pest group", "priority": 3},
    ],
    "maize": [
        {"crop": "chickpea", "reason": "Legume Rabi crop after Kharif maize harvest.", "benefit": "N-fixation restores nutrients; short duration fits calendar", "priority": 1},
        {"crop": "wheat",    "reason": "Rabi cereal after Kharif maize — widely practised.", "benefit": "Well-established system; efficient input use", "priority": 2},
        {"crop": "potato",   "reason": "High-value Rabi crop after maize in UP/Bihar.", "benefit": "Good income; maize residue adds OM after incorporation", "priority": 3},
    ],
    "soybean": [
        {"crop": "wheat",    "reason": "Soybean-wheat rotation is highly productive in MP and Maharashtra.", "benefit": "N fixed by soybean (40-60 kg/ha) reduces wheat fertilizer needs by 30%", "priority": 1},
        {"crop": "maize",    "reason": "Cereal-legume rotation balances nutrient draw-down.", "benefit": "Disease cycle broken; improved SOC from legume residue", "priority": 2},
        {"crop": "mustard",  "reason": "Rabi oilseed in central India after soybean.", "benefit": "Different root depth accesses deeper nutrients", "priority": 3},
    ],
    "mustard": [
        {"crop": "rice",     "reason": "Kharif paddy after Rabi mustard in East India.", "benefit": "Timely land availability; different water regime breaks disease", "priority": 1},
        {"crop": "maize",    "reason": "Kharif cereal after Rabi mustard in north India.", "benefit": "Balanced nutrient use; different pest profile", "priority": 2},
        {"crop": "mungbean", "reason": "Short-duration summer legume between Rabi mustard and next Kharif.", "benefit": "Quick N-fix in 60 days; grain income; improves soil tilth", "priority": 3},
    ],
    "chickpea": [
        {"crop": "maize",    "reason": "Kharif cereal benefiting from legume-fixed N.", "benefit": "Saves 40 kg Urea/acre; maize responds well to residual N", "priority": 1},
        {"crop": "rice",     "reason": "Paddy after chickpea in east India rotation.", "benefit": "Different water regime; leftover P benefits rice", "priority": 2},
        {"crop": "sorghum",  "reason": "Drought-tolerant Kharif cereal after Rabi legume.", "benefit": "Maximises residual N; low input requirement", "priority": 3},
    ],
    "sugarcane": [
        {"crop": "wheat",    "reason": "Wheat on ratoon/stubble land after sugarcane harvest.", "benefit": "Residual nutrients from sugarcane fertilization benefit wheat", "priority": 1},
        {"crop": "potato",   "reason": "Short-duration Rabi cash crop between sugarcane plantings.", "benefit": "High income; loosens soil for next crop", "priority": 2},
        {"crop": "maize",    "reason": "Kharif cereal on post-sugarcane land.", "benefit": "Soil aeration; different pest/disease spectrum", "priority": 3},
    ],
    "potato": [
        {"crop": "maize",    "reason": "Kharif cereal after Rabi potato — standard north India practice.", "benefit": "Different diseases; deep roots use subsoil nutrients", "priority": 1},
        {"crop": "rice",     "reason": "Paddy in irrigated fields after potato harvest.", "benefit": "High water use clears soil-borne potato pathogens", "priority": 2},
        {"crop": "soybean",  "reason": "Kharif legume to restore N after high-N potato crop.", "benefit": "N-fixation; reduces fertilizer cost for next season", "priority": 3},
    ],
    "groundnut": [
        {"crop": "wheat",    "reason": "Rabi cereal after groundnut benefits from residual N and P.", "benefit": "Saves 20-30 kg N/acre; improved soil structure from pod harvest", "priority": 1},
        {"crop": "maize",    "reason": "Kharif cereal after Rabi/Zaid groundnut.", "benefit": "Different root depth; benefits from residual N", "priority": 2},
        {"crop": "sorghum",  "reason": "Drought-tolerant alternate Kharif crop.", "benefit": "Efficient water use; different pest spectrum", "priority": 3},
    ],
}

# Soil-type suitability filter
SOIL_PREFERENCES: Dict[str, List[str]] = {
    "rice":     ["Alluvial", "Clay", "Clayey Loam"],
    "wheat":    ["Alluvial", "Loamy", "Sandy Loam"],
    "maize":    ["Alluvial", "Loamy", "Sandy Loam", "Red"],
    "cotton":   ["Black", "Alluvial", "Loamy"],
    "soybean":  ["Black", "Alluvial", "Loamy"],
    "chickpea": ["Alluvial", "Loamy", "Sandy Loam", "Black"],
    "mustard":  ["Sandy Loam", "Loamy", "Alluvial"],
    "potato":   ["Sandy Loam", "Loamy", "Alluvial"],
    "sugarcane":["Alluvial", "Loamy", "Clayey Loam"],
    "groundnut":["Sandy Loam", "Sandy", "Red", "Loamy"],
}

ROTATION_BENEFIT_SUMMARY: Dict[str, str] = {
    "rice":     "Rabi legume or oilseed best after rice harvest to break blast + BPH cycle and fix nitrogen.",
    "wheat":    "Kharif legume (soybean) recommended to rebuild soil nitrogen after continuous wheat.",
    "cotton":   "Legume rotation reduces bollworm carryover and restores nitrogen depleted by cotton.",
    "maize":    "Legume Rabi crop maximises residual field nutrition from Kharif maize.",
    "soybean":  "Cereal rotation (wheat/maize) efficiently uses the 40-60 kg/ha N fixed by soybean.",
    "mustard":  "Legume summer crop (mungbean) between mustard and next Kharif boosts income.",
    "chickpea": "High-N field after chickpea strongly favours Kharif cereals — saves fertilizer.",
    "sugarcane":"Shorter-season Rabi crops maximise use of high-nutrient sugarcane residue.",
    "potato":   "Kharif cereals or legumes after potato break soil-borne pathogen cycle effectively.",
    "groundnut":"Rabi cereals benefit from residual N + P left by groundnut crop.",
}


def get_rotation(previous_crop: str, soil_type: str, state: str) -> CropRotationResponse:
    crop_key = previous_crop.lower().strip()
    options_raw = ROTATION_DB.get(crop_key, ROTATION_DB.get("rice", []))

    # Filter/rank by soil suitability
    options = []
    for opt in options_raw:
        soil_ok = not soil_type or (
            soil_type in SOIL_PREFERENCES.get(opt["crop"], ["Alluvial","Loamy","Sandy Loam"])
        )
        options.append(RotationOption(
            crop=opt["crop"].capitalize(),
            reason=opt["reason"],
            soil_benefit=opt["benefit"],
            soil_compatible=soil_ok,
            priority=opt["priority"],
        ))
    options.sort(key=lambda x: (0 if x.soil_compatible else 1, x.priority))

    soil_benefit = ROTATION_BENEFIT_SUMMARY.get(crop_key, "Rotate crops to break pest/disease cycles and maintain soil health.")

    return CropRotationResponse(
        previous_crop=previous_crop.capitalize(),
        soil_type=soil_type,
        state=state,
        recommended_next_crops=options,
        rotation_benefit=soil_benefit,
        general_advice=[
            "Never grow the same crop family 2 years in a row in the same field.",
            "Incorporate crop residue to improve soil organic matter between rotations.",
            "Legume in rotation reduces fertilizer cost by 20–40% for the next season.",
            "Keep field records (crop, yield, inputs) to plan rotations scientifically.",
        ]
    )
