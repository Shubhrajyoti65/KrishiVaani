"""
KrishiVaani — 3-Year Crop Planning & Soil Improvement Engine
Combines ML crop recommendation, regional agro-climatic estimates,
agronomic rotation principles, and authoritative ICAR soil improvement guidelines.
"""
from typing import Dict, Any, List, Tuple, Optional
from backend.app.services.crop_planning.schema import (
    CropPlanRequest, CropPlanResponse, YearPlanItem, SoilImprovementPlan
)
from backend.ml.crop_recommendation.predict import predict_crop_recommendations

# Regional soil & climate baselines across Indian agricultural belts
REGIONAL_AGRI_PROFILES: Dict[str, Dict[str, Any]] = {
    "Punjab": {"N": 78.0, "P": 44.0, "K": 36.0, "ph": 7.3, "temp": 24.5, "hum": 68.0, "rain": 650.0, "soil": "Alluvial"},
    "Haryana": {"N": 72.0, "P": 42.0, "K": 38.0, "ph": 7.5, "temp": 25.0, "hum": 64.0, "rain": 580.0, "soil": "Alluvial / Sandy Loam"},
    "Odisha": {"N": 85.0, "P": 38.0, "K": 42.0, "ph": 6.2, "temp": 27.5, "hum": 82.0, "rain": 1350.0, "soil": "Coastal Alluvial / Laterite"},
    "West Bengal": {"N": 88.0, "P": 42.0, "K": 40.0, "ph": 6.3, "temp": 26.8, "hum": 84.0, "rain": 1450.0, "soil": "Alluvial"},
    "Uttar Pradesh": {"N": 80.0, "P": 40.0, "K": 38.0, "ph": 7.1, "temp": 25.2, "hum": 70.0, "rain": 920.0, "soil": "Gangetic Alluvial"},
    "Bihar": {"N": 82.0, "P": 39.0, "K": 37.0, "ph": 6.9, "temp": 26.0, "hum": 76.0, "rain": 1100.0, "soil": "Alluvial Loam"},
    "Maharashtra": {"N": 58.0, "P": 36.0, "K": 48.0, "ph": 7.6, "temp": 27.2, "hum": 65.0, "rain": 880.0, "soil": "Black Cotton Soil"},
    "Gujarat": {"N": 62.0, "P": 35.0, "K": 44.0, "ph": 7.8, "temp": 28.0, "hum": 62.0, "rain": 720.0, "soil": "Black / Sandy Loam"},
    "Madhya Pradesh": {"N": 64.0, "P": 38.0, "K": 42.0, "ph": 7.2, "temp": 26.5, "hum": 66.0, "rain": 950.0, "soil": "Medium Black / Red"},
    "Rajasthan": {"N": 42.0, "P": 28.0, "K": 46.0, "ph": 8.0, "temp": 29.0, "hum": 45.0, "rain": 420.0, "soil": "Sandy Desert / Loam"},
    "Andhra Pradesh": {"N": 70.0, "P": 36.0, "K": 42.0, "ph": 7.0, "temp": 28.5, "hum": 74.0, "rain": 910.0, "soil": "Red Sandy / Black"},
    "Telangana": {"N": 68.0, "P": 35.0, "K": 40.0, "ph": 7.1, "temp": 28.0, "hum": 70.0, "rain": 890.0, "soil": "Red Chalkas / Black"},
    "Karnataka": {"N": 65.0, "P": 36.0, "K": 42.0, "ph": 6.8, "temp": 26.0, "hum": 72.0, "rain": 980.0, "soil": "Red Loam / Black"},
    "Tamil Nadu": {"N": 66.0, "P": 34.0, "K": 44.0, "ph": 6.9, "temp": 28.8, "hum": 75.0, "rain": 920.0, "soil": "Red Loam / Coastal Alluvial"}
}

DEFAULT_NATIONAL_PROFILE = {
    "N": 70.0, "P": 40.0, "K": 40.0, "ph": 7.0, "temp": 26.0, "hum": 70.0, "rain": 900.0, "soil": "Alluvial Loam"
}

# Agronomic crop rotation rules mapping
ROTATION_STRATEGIES = {
    "rice": {
        "year2": {
            "crop": "Chickpea",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Legume break following Kharif rice fixes 45-75 kg N/ha and utilizes residual soil moisture.",
            "soil_compat": "Highly compatible with clayey alluvial rice paddies; deep tap-roots open compacted plow pan.",
            "water": "Low to medium (2-3 light irrigations required).",
            "pest_break": "Breaks the vegetative lifecycle of rice stem borer and rice blast fungal spores.",
            "yield_est": "6.0 – 8.5 quintals/acre",
            "soil_impact": "Adds 50 kg biological Nitrogen/ha, improving soil tilth for subsequent cereal."
        },
        "year3": {
            "crop": "Wheat",
            "tier": "High suitability",
            "season": "Rabi / Annual",
            "rationale": "Exhaustive cereal crop utilizing the residual nitrogen and mineralized phosphorus left by the chickpea legume.",
            "soil_compat": "Thrives on restored soil structure with improved microbial biomass.",
            "water": "Medium (4-5 irrigations at critical stages: CRI, tillering, flowering).",
            "pest_break": "Different botanical family (Poaceae) prevents pulse root rot pathogens.",
            "yield_est": "16.0 – 22.0 quintals/acre",
            "soil_impact": "Wheat root exudates stimulate balanced fungal-bacterial ratios."
        }
    },
    "wheat": {
        "year2": {
            "crop": "Mungbean (Green Gram)",
            "tier": "High suitability",
            "season": "Summer / Kharif",
            "rationale": "Short-duration (60-day) summer legume to enrich soil with atmospheric nitrogen before next season.",
            "soil_compat": "Excellent on light to medium loamy soils.",
            "water": "Low water requirement; utilizes summer sunshine.",
            "pest_break": "Breaks wheat rust and foliar blight disease cycles effectively.",
            "yield_est": "4.5 – 6.5 quintals/acre",
            "soil_impact": "Fixes 35-50 kg N/ha; green foliage incorporated as green manure after two pickings."
        },
        "year3": {
            "crop": "Mustard",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Deep-rooted oilseed accessing subsoil potassium and sulfur with low water needs.",
            "soil_compat": "Tolerates light loamy and mildly alkaline soils.",
            "water": "Low to medium water requirement (2 irrigations).",
            "pest_break": "Glucosinolate root exudates have natural bio-fumigant properties against soil nematodes.",
            "yield_est": "6.0 – 9.0 quintals/acre",
            "soil_impact": "Improves subsoil porosity and mineral cycling."
        }
    },
    "cotton": {
        "year2": {
            "crop": "Chickpea",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Legume break after deep-rooted cotton restores soil nitrogen balance and breaks pink bollworm cycle.",
            "soil_compat": "Ideal for black cotton soils with good residual moisture capacity.",
            "water": "Low (rain-fed or 1-2 supplemental irrigations).",
            "pest_break": "Completely interrupts pink bollworm (Pectinophora gossypiella) pupal survival in soil.",
            "yield_est": "5.5 – 8.0 quintals/acre",
            "soil_impact": "Fixes 45 kg N/ha and moderates soil compaction caused by cotton harvest."
        },
        "year3": {
            "crop": "Sorghum / Maize",
            "tier": "Moderate suitability",
            "season": "Kharif",
            "rationale": "High biomass cereal replenishing organic carbon and creating dense fibrous root network.",
            "soil_compat": "Tolerant of diverse soil moisture fluctuations.",
            "water": "Medium water requirement.",
            "pest_break": "Non-host for cotton wilt pathogens (Fusarium oxysporum f. sp. vasinfectum).",
            "yield_est": "14.0 – 20.0 quintals/acre",
            "soil_impact": "Cereal root biomass adds 2.5 tonnes organic carbon per hectare."
        }
    },
    "maize": {
        "year2": {
            "crop": "Blackgram (Urad)",
            "tier": "High suitability",
            "season": "Kharif / Rabi",
            "rationale": "Fast-growing legume restores soil nitrogen depleted by heavy nitrogen-feeding maize.",
            "soil_compat": "Grows vigorously in well-drained loamy soils.",
            "water": "Low to medium water requirement.",
            "pest_break": "Breaks the fall armyworm (Spodoptera frugiperda) and stalk borer lifecycle.",
            "yield_est": "4.0 – 6.5 quintals/acre",
            "soil_impact": "Fixes 40 kg N/ha and provides dense canopy protecting soil from erosion."
        },
        "year3": {
            "crop": "Potato",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "High-value cash crop utilizing loosened, biologically active soil tilth.",
            "soil_compat": "Thrives in friable, well-aerated soil.",
            "water": "Medium to high (frequent light irrigations).",
            "pest_break": "Different botanical family eliminates cereal leaf blight inocula.",
            "yield_est": "80 – 120 quintals/acre",
            "soil_impact": "Intercultural operations aerate the top 20 cm of root zone."
        }
    },
    "chickpea": {
        "year2": {
            "crop": "Mustard",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Oilseed rotation following legume exploits mineralized nitrogen and breaks soil pathogen cycles.",
            "soil_compat": "Well suited to conserved-moisture loamy seedbeds.",
            "water": "Low to medium water requirement.",
            "pest_break": "Glucosinolate bio-fumigant effect suppresses Fusarium oxysporum wilt spores.",
            "yield_est": "6.0 – 9.0 quintals/acre",
            "soil_impact": "Extracts subsoil potassium while leaving surface soil structurally intact."
        },
        "year3": {
            "crop": "Wheat",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Major food cereal capitalizing on fully renewed mycorrhizal soil community.",
            "soil_compat": "High productivity on restored, aerated loam.",
            "water": "Medium (3-4 irrigations).",
            "pest_break": "Monocotyledonous rotation interrupts brassica disease inoculum.",
            "yield_est": "18.0 – 24.0 quintals/acre",
            "soil_impact": "Extensive root network maintains soil organic carbon equilibrium."
        }
    },
    "sugarcane": {
        "year2": {
            "crop": "Mungbean (Green Gram)",
            "tier": "High suitability",
            "season": "Summer / Zaid",
            "rationale": "Fast-maturing summer legume to rehabilitate soil after exhaustive sugarcane harvest.",
            "soil_compat": "Improves organic matter and biological activity in heavy soils.",
            "water": "Low to medium.",
            "pest_break": "Starves sugarcane stalk and root borer larvae.",
            "yield_est": "4.5 – 6.5 quintals/acre",
            "soil_impact": "Supplies 40 kg biological Nitrogen per hectare and decomposes crop trash."
        },
        "year3": {
            "crop": "Wheat",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "High-yielding cereal fitting smoothly into the restored field tilth.",
            "soil_compat": "Thrives after legume green manuring.",
            "water": "Medium.",
            "pest_break": "Breaks red rot (Colletotrichum falcatum) fungal persistence.",
            "yield_est": "16.0 – 22.0 quintals/acre",
            "soil_impact": "Leaves fibrous stubble that prevents soil crusting."
        }
    },
    "pigeonpeas": {
        "year2": {
            "crop": "Wheat",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Cereal rotation taking full advantage of the deep taproot aeration and 40 kg N fixed by arhar.",
            "soil_compat": "Excellent tilth and deep porosity created by pigeonpea root system.",
            "water": "Medium.",
            "pest_break": "Disrupts pod borer (Helicoverpa armigera) soil pupation.",
            "yield_est": "18.0 – 24.0 quintals/acre",
            "soil_impact": "Increases available phosphorus through mycorrhizal association."
        },
        "year3": {
            "crop": "Cotton",
            "tier": "Moderate suitability",
            "season": "Kharif",
            "rationale": "Cash crop rotation fitting semi-arid black and red soil agro-ecosystems.",
            "soil_compat": "High suitability on deep, well-drained soils.",
            "water": "Medium to rain-fed.",
            "pest_break": "Different pest complex compared to cereal-pulse sequence.",
            "yield_est": "7.0 – 11.0 quintals/acre",
            "soil_impact": "Deep extraction balanced by prior leguminous enrichment."
        }
    },
    "mungbean": {
        "year2": {
            "crop": "Wheat",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Direct cereal successor utilizing legume residual fertility.",
            "soil_compat": "Optimal for all alluvial and medium loamy tracts.",
            "water": "Medium.",
            "pest_break": "Clears pulse aphid and yellow mosaic virus reservoirs.",
            "yield_est": "18.0 – 23.0 quintals/acre",
            "soil_impact": "Increases microbial respiration and active carbon."
        },
        "year3": {
            "crop": "Mustard",
            "tier": "High suitability",
            "season": "Rabi",
            "rationale": "Oilseed diversity maintaining continuous field rotation.",
            "soil_compat": "Good soil coverage with low nutrient mining.",
            "water": "Low.",
            "pest_break": "Reduces foliar blight incidence in subsequent cereals.",
            "yield_est": "6.0 – 8.5 quintals/acre",
            "soil_impact": "Bio-fumigation benefits topsoil health."
        }
    }
}

class CropPlanningEngine:
    def resolve_soil_profile(self, req: CropPlanRequest) -> Tuple[Dict[str, float], str, str]:
        """Resolves whether to use farmer's actual soil test or regional estimated baseline."""
        reg_data = REGIONAL_AGRI_PROFILES.get(req.state.strip(), DEFAULT_NATIONAL_PROFILE)

        if req.has_actual_soil_test and req.nitrogen is not None and req.phosphorus is not None:
            soil_features = {
                "N": float(req.nitrogen),
                "P": float(req.phosphorus),
                "K": float(req.potassium if req.potassium is not None else reg_data["K"]),
                "ph": float(req.ph if req.ph is not None else reg_data["ph"]),
                "temperature": float(reg_data["temp"]),
                "humidity": float(reg_data["hum"]),
                "rainfall": float(reg_data["rain"])
            }
            label = "Recommendation based on your soil data"
            profile_type = "Farmer Laboratory Soil Test"
        else:
            soil_features = {
                "N": float(reg_data["N"]),
                "P": float(reg_data["P"]),
                "K": float(reg_data["K"]),
                "ph": float(reg_data["ph"]),
                "temperature": float(reg_data["temp"]),
                "humidity": float(reg_data["hum"]),
                "rainfall": float(reg_data["rain"])
            }
            label = "Regional estimate"
            profile_type = "Regional Agro-Climatic Estimate"

        return soil_features, label, profile_type

    def generate_plan(self, req: CropPlanRequest) -> CropPlanResponse:
        soil_features, label, profile_type = self.resolve_soil_profile(req)

        # ── Year 1: ML-driven primary crop recommendation ──
        ml_res = predict_crop_recommendations(soil_features, top_k=3)
        y1_crop = ml_res["primary_crop"]
        y1_conf = ml_res["confidence"]
        y1_suitability = ml_res["suitability"]

        # If previous crop is identical to ML crop, select the second best candidate to prevent immediate monoculture
        prev_clean = req.previous_crop.strip().lower() if req.previous_crop else ""
        if prev_clean and y1_crop.lower() == prev_clean and len(ml_res["top_recommendations"]) > 1:
            alt = ml_res["top_recommendations"][1]
            y1_crop = alt["crop"]
            y1_suitability = alt["suitability"]

        # Calculate dynamic yield estimate using XGBoost Yield Model
        try:
            from backend.ml.yield_prediction.predict import predict_yield_production
            y1_yp = predict_yield_production(
                crop=y1_crop,
                state=req.state or "Punjab",
                season=req.current_season or "Kharif",
                area_acres=req.total_land_acres or 1.0
            )
            y1_yield_str = f"{y1_yp['predicted_yield_quintals_per_acre']} Q/acre (Est: {y1_yp['estimated_range']['quintals_per_acre']['min']}–{y1_yp['estimated_range']['quintals_per_acre']['max']} Q/acre)"
        except Exception:
            y1_yield_str = "Top-tier regional productivity under recommended fertilizer schedule."

        y1_item = YearPlanItem(
            year_label="Year 1 (Current Season)",
            season=req.current_season,
            recommended_crop=y1_crop,
            suitability_tier=y1_suitability,
            agronomic_rationale=f"Selected by Machine Learning model matched with local soil profile (N:{soil_features['N']}, P:{soil_features['P']}, K:{soil_features['K']}, pH:{soil_features['ph']}) and season.",
            soil_compatibility="Matches primary soil nutrient availability and seasonal temperature band.",
            water_requirement=f"Standard for {y1_crop}; fits {req.water_availability} irrigation infrastructure.",
            pest_disease_break_benefit="Establishes productive initial canopy while monitoring regional pest patterns.",
            expected_yield_estimate=y1_yield_str,
            soil_impact="Utilizes available nutrients; requires subsequent restorative rotation."
        )

        # ── Year 2 & Year 3: Agronomic Rotation Rules ──
        key = y1_crop.lower()
        if key not in ROTATION_STRATEGIES:
            # Fallback to general cereal/legume strategy
            key = "rice" if req.water_availability in ["Canal", "Drip"] else "wheat"

        strat = ROTATION_STRATEGIES[key]
        y2_dict = strat["year2"]
        y3_dict = strat["year3"]

        # Dynamic XGBoost Yield Predictions for Year 2 & Year 3
        try:
            from backend.ml.yield_prediction.predict import predict_yield_production
            y2_yp = predict_yield_production(
                crop=y2_dict["crop"],
                state=req.state or "Punjab",
                season=y2_dict["season"],
                area_acres=req.total_land_acres or 1.0
            )
            y2_yield_str = f"{y2_yp['predicted_yield_quintals_per_acre']} Q/acre (Est: {y2_yp['estimated_range']['quintals_per_acre']['min']}–{y2_yp['estimated_range']['quintals_per_acre']['max']} Q/acre)"
        except Exception:
            y2_yield_str = y2_dict.get("yield_est", "Standard regional productivity")

        try:
            from backend.ml.yield_prediction.predict import predict_yield_production
            y3_yp = predict_yield_production(
                crop=y3_dict["crop"],
                state=req.state or "Punjab",
                season=y3_dict["season"],
                area_acres=req.total_land_acres or 1.0
            )
            y3_yield_str = f"{y3_yp['predicted_yield_quintals_per_acre']} Q/acre (Est: {y3_yp['estimated_range']['quintals_per_acre']['min']}–{y3_yp['estimated_range']['quintals_per_acre']['max']} Q/acre)"
        except Exception:
            y3_yield_str = y3_dict.get("yield_est", "Standard regional productivity")

        y2_item = YearPlanItem(
            year_label="Year 2 (Next Year)",
            season=y2_dict["season"],
            recommended_crop=y2_dict["crop"],
            suitability_tier=y2_dict["tier"],
            agronomic_rationale=y2_dict["rationale"],
            soil_compatibility=y2_dict["soil_compat"],
            water_requirement=y2_dict["water"],
            pest_disease_break_benefit=y2_dict["pest_break"],
            expected_yield_estimate=y2_yield_str,
            soil_impact=y2_dict["soil_impact"]
        )

        y3_item = YearPlanItem(
            year_label="Year 3 (Second Following Year)",
            season=y3_dict["season"],
            recommended_crop=y3_dict["crop"],
            suitability_tier=y3_dict["tier"],
            agronomic_rationale=y3_dict["rationale"],
            soil_compatibility=y3_dict["soil_compat"],
            water_requirement=y3_dict["water"],
            pest_disease_break_benefit=y3_dict["pest_break"],
            expected_yield_estimate=y3_yield_str,
            soil_impact=y3_dict["soil_impact"]
        )

        # ── Soil Improvement Plan ──
        ph_val = soil_features["ph"]
        n_val = soil_features["N"]
        
        nutrient_mgmt = [
            f"Apply split doses of Nitrogen: 50% basal at sowing, 25% at active tillering, and 25% at panicle/flowering stage.",
            f"Current N ({n_val:.0f} kg/ha) requires balanced application with Potash (MOP) to prevent luxury nitrogen consumption.",
            "Incorporate Zinc Sulfate (10-12 kg/acre) once every two years to prevent khaira/chlorosis in cereal crops."
        ]

        if ph_val < 6.0:
            nutrient_mgmt.append("Acidic Soil Advisory: Apply Agricultural Lime (CaCO3) @ 500 kg/ha 3 weeks before sowing to elevate pH toward neutral (6.5).")
        elif ph_val > 7.8:
            nutrient_mgmt.append("Alkaline/Sodic Advisory: Apply Agricultural Gypsum @ 500-800 kg/ha to displace excess sodium and enhance water infiltration.")

        soil_improve = SoilImprovementPlan(
            soil_profile_type=profile_type,
            nutrient_management=nutrient_mgmt,
            organic_matter_enhancement=[
                "Apply well-decomposed Farm Yard Manure (FYM) or Vermicompost @ 2.5 - 3.0 tonnes/acre prior to summer plowing.",
                "Incorporate bio-fertilizers (Azotobacter/Azospirillum and Phosphate Solubilizing Bacteria - PSB) @ 2 kg/acre each mixed with compost."
            ],
            crop_rotation_strategy=[
                f"Follow the 3-Year Sequence: {y1_crop} → {y2_dict['crop']} (Legume Break) → {y3_dict['crop']} (Restorative Crop).",
                "Strictly avoid consecutive cereal-cereal or solanaceous-solanaceous monoculture to break soil-borne root pathogens."
            ],
            cover_crops_and_green_manure=[
                "Sow Dhaincha (Sesbania aculeata) or Sunnhemp @ 20 kg/acre after summer harvest.",
                "Incorporate green manure into soil at 45-50 days before flowering; adds 15 tonnes green biomass and fixes ~60 kg N/ha."
            ],
            residue_management=[
                "Never burn crop stubble or straw. Burning volatilizes 100% of organic nitrogen and kills beneficial mycorrhizae.",
                "Incorporate straw in-situ using a Rotavator or Super Seeder, treated with Waste Decomposer / Pusa bio-decomposer spray."
            ],
            irrigation_optimization=[
                "Adopt Alternate Wetting and Drying (AWD) for rice to save 25-30% water and aerate roots.",
                "Use drip or furrow irrigation for row crops (cotton, maize, potato) to prevent waterlogging and fungal root rots."
            ],
            soil_testing_recommendation="Collect 15-20 zig-zag soil core samples across your field and test at the nearest Soil Testing Lab (KVK) every 2 years."
        )

        summary = (
            f"Multi-year plan established for {req.district}, {req.state}. "
            f"Year 1 establishes {y1_crop} based on your {label.lower()}. "
            f"Year 2 introduces {y2_dict['crop']} to enrich biological nitrogen and break pest cycles. "
            f"Year 3 completes the rotation with {y3_dict['crop']} to maximize return on regenerated soil fertility."
        )

        return CropPlanResponse(
            location=f"{req.district}, {req.state}",
            soil_source_label=label,
            previous_crop=req.previous_crop or "None",
            three_year_plan=[y1_item, y2_item, y3_item],
            soil_improvement_plan=soil_improve,
            agronomic_summary=summary
        )

planner_engine = CropPlanningEngine()
