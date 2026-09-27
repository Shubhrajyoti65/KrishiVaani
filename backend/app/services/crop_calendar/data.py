"""
Crop Calendar Data — Sowing/Transplanting/Harvesting windows by crop & state.
Source: ICAR/IARI State Agriculture Department bulletins.
"""
from typing import Dict, List, Optional
from backend.app.services.crop_calendar.schema import CropCalendarResponse

# ── Calendar database ─────────────────────────────────────────────────────────
# Format: crop → state → {sowing, transplanting, harvesting, duration, season, tips}
CALENDAR_DB: Dict[str, Dict[str, Dict]] = {
    "rice": {
        "Punjab":        {"sowing": "May–Jun (nursery)", "transplanting": "Jun 10–Jul 10", "harvesting": "Oct–Nov", "duration_days": 130, "season": "Kharif"},
        "Haryana":       {"sowing": "May–Jun (nursery)", "transplanting": "Jun 15–Jul 10", "harvesting": "Oct–Nov", "duration_days": 130, "season": "Kharif"},
        "West Bengal":   {"sowing": "May–Jun (Aman nursery)", "transplanting": "Jul–Aug", "harvesting": "Nov–Dec", "duration_days": 140, "season": "Kharif"},
        "Odisha":        {"sowing": "Jun–Jul (nursery)", "transplanting": "Jul–Aug", "harvesting": "Nov–Dec", "duration_days": 135, "season": "Kharif"},
        "Uttar Pradesh": {"sowing": "Jun–Jul (nursery)", "transplanting": "Jul–Aug", "harvesting": "Oct–Nov", "duration_days": 125, "season": "Kharif"},
        "Bihar":         {"sowing": "Jun (nursery)", "transplanting": "Jul–Aug", "harvesting": "Oct–Nov", "duration_days": 130, "season": "Kharif"},
        "Andhra Pradesh":{"sowing": "Jun–Jul", "transplanting": "Jul–Aug", "harvesting": "Nov–Dec", "duration_days": 140, "season": "Kharif"},
        "Tamil Nadu":    {"sowing": "Jun–Jul (Kuruvai)", "transplanting": "Jul", "harvesting": "Sep–Oct", "duration_days": 105, "season": "Kharif"},
        "default":       {"sowing": "Jun–Jul (nursery)", "transplanting": "Jul–Aug", "harvesting": "Nov–Dec", "duration_days": 130, "season": "Kharif"},
    },
    "wheat": {
        "Punjab":        {"sowing": "Oct 25–Nov 10", "transplanting": "Direct seeding", "harvesting": "Apr–May", "duration_days": 155, "season": "Rabi"},
        "Haryana":       {"sowing": "Nov 1–15", "transplanting": "Direct seeding", "harvesting": "Apr", "duration_days": 150, "season": "Rabi"},
        "Uttar Pradesh": {"sowing": "Nov 1–20", "transplanting": "Direct seeding", "harvesting": "Mar–Apr", "duration_days": 145, "season": "Rabi"},
        "Madhya Pradesh":{"sowing": "Nov 1–20", "transplanting": "Direct seeding", "harvesting": "Mar–Apr", "duration_days": 145, "season": "Rabi"},
        "Bihar":         {"sowing": "Nov 10–25", "transplanting": "Direct seeding", "harvesting": "Mar–Apr", "duration_days": 140, "season": "Rabi"},
        "Rajasthan":     {"sowing": "Nov 1–15", "transplanting": "Direct seeding", "harvesting": "Apr", "duration_days": 150, "season": "Rabi"},
        "default":       {"sowing": "Nov 1–15", "transplanting": "Direct seeding", "harvesting": "Mar–Apr", "duration_days": 145, "season": "Rabi"},
    },
    "maize": {
        "Karnataka":     {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 95, "season": "Kharif"},
        "Andhra Pradesh":{"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 90, "season": "Kharif"},
        "Punjab":        {"sowing": "Jun 15–Jul 15", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 95, "season": "Kharif"},
        "Uttar Pradesh": {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 90, "season": "Kharif"},
        "default":       {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 90, "season": "Kharif"},
    },
    "cotton": {
        "Punjab":        {"sowing": "Apr 15–May 15", "transplanting": "Direct seeding", "harvesting": "Oct–Dec", "duration_days": 180, "season": "Kharif"},
        "Haryana":       {"sowing": "May 1–20", "transplanting": "Direct seeding", "harvesting": "Oct–Dec", "duration_days": 175, "season": "Kharif"},
        "Gujarat":       {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Nov–Jan", "duration_days": 190, "season": "Kharif"},
        "Maharashtra":   {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Nov–Jan", "duration_days": 185, "season": "Kharif"},
        "default":       {"sowing": "May–Jun", "transplanting": "Direct seeding", "harvesting": "Oct–Dec", "duration_days": 180, "season": "Kharif"},
    },
    "mustard": {
        "Rajasthan":     {"sowing": "Sep 25–Oct 15", "transplanting": "Direct seeding", "harvesting": "Feb–Mar", "duration_days": 140, "season": "Rabi"},
        "Haryana":       {"sowing": "Oct 1–15", "transplanting": "Direct seeding", "harvesting": "Mar", "duration_days": 135, "season": "Rabi"},
        "Uttar Pradesh": {"sowing": "Oct 1–15", "transplanting": "Direct seeding", "harvesting": "Feb–Mar", "duration_days": 130, "season": "Rabi"},
        "default":       {"sowing": "Oct 1–15", "transplanting": "Direct seeding", "harvesting": "Feb–Mar", "duration_days": 135, "season": "Rabi"},
    },
    "sugarcane": {
        "Uttar Pradesh": {"sowing": "Feb–Mar (spring)", "transplanting": "Direct planting (setts)", "harvesting": "Nov–Apr (next yr)", "duration_days": 360, "season": "Annual"},
        "Maharashtra":   {"sowing": "Oct–Nov (adsali)", "transplanting": "Direct planting", "harvesting": "Oct–Dec (14–18 months)", "duration_days": 420, "season": "Annual"},
        "Punjab":        {"sowing": "Feb–Mar", "transplanting": "Direct planting", "harvesting": "Oct–Dec", "duration_days": 300, "season": "Annual"},
        "default":       {"sowing": "Feb–Mar", "transplanting": "Direct planting (setts)", "harvesting": "Nov–Apr (next yr)", "duration_days": 360, "season": "Annual"},
    },
    "potato": {
        "Uttar Pradesh": {"sowing": "Oct 15–Nov 15", "transplanting": "Direct planting (tubers)", "harvesting": "Jan–Mar", "duration_days": 100, "season": "Rabi"},
        "Punjab":        {"sowing": "Oct–Nov", "transplanting": "Direct planting", "harvesting": "Feb–Mar", "duration_days": 110, "season": "Rabi"},
        "West Bengal":   {"sowing": "Nov–Dec", "transplanting": "Direct planting", "harvesting": "Feb–Mar", "duration_days": 90, "season": "Rabi"},
        "default":       {"sowing": "Oct–Nov", "transplanting": "Direct planting (tubers)", "harvesting": "Jan–Mar", "duration_days": 100, "season": "Rabi"},
    },
    "soybean": {
        "Madhya Pradesh":{"sowing": "Jun 25–Jul 15", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 100, "season": "Kharif"},
        "Maharashtra":   {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 95, "season": "Kharif"},
        "default":       {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 100, "season": "Kharif"},
    },
    "chickpea": {
        "Madhya Pradesh":{"sowing": "Oct 15–Nov 15", "transplanting": "Direct seeding", "harvesting": "Feb–Mar", "duration_days": 110, "season": "Rabi"},
        "Rajasthan":     {"sowing": "Oct–Nov", "transplanting": "Direct seeding", "harvesting": "Feb–Mar", "duration_days": 115, "season": "Rabi"},
        "Uttar Pradesh": {"sowing": "Oct 15–Nov 15", "transplanting": "Direct seeding", "harvesting": "Feb–Mar", "duration_days": 110, "season": "Rabi"},
        "default":       {"sowing": "Oct–Nov", "transplanting": "Direct seeding", "harvesting": "Feb–Mar", "duration_days": 110, "season": "Rabi"},
    },
    "groundnut": {
        "Gujarat":       {"sowing": "Jun–Jul", "transplanting": "Direct seeding (pods)", "harvesting": "Sep–Oct", "duration_days": 120, "season": "Kharif"},
        "Andhra Pradesh":{"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 115, "season": "Kharif"},
        "Tamil Nadu":    {"sowing": "Jun–Jul", "transplanting": "Direct seeding", "harvesting": "Sep–Oct", "duration_days": 110, "season": "Kharif"},
        "default":       {"sowing": "Jun–Jul", "transplanting": "Direct seeding (pods)", "harvesting": "Sep–Oct", "duration_days": 120, "season": "Kharif"},
    },
}

CROP_TIPS: Dict[str, List[str]] = {
    "rice": [
        "Use certified seed of blast-resistant variety (e.g. Swarna, MTU-1010)",
        "Maintain 2–3 cm water level during active tillering",
        "Apply weedicide (Butachlor 50 EC) within 3 days of transplanting",
    ],
    "wheat": [
        "Sow at the right time — late sowing causes 1.5% yield loss per day",
        "First irrigation (CRI) at 20–21 DAS is critical — do not miss",
        "Use resistant variety (HD-2781, WH-542) in rust-prone areas",
    ],
    "default": [
        "Use certified / treated seed for better germination",
        "Apply recommended fertilizer dose in splits for best efficiency",
        "Monitor crop weekly for pest/disease during critical growth stages",
    ],
}

# Import List for hints
from typing import List


def get_calendar(crop: str, state: str) -> CropCalendarResponse:
    crop_key = crop.lower().strip()
    if crop_key not in CALENDAR_DB:
        crop_key = "rice"  # fallback

    state_data = CALENDAR_DB[crop_key].get(state, CALENDAR_DB[crop_key].get("default", {}))
    tips = CROP_TIPS.get(crop_key, CROP_TIPS["default"])

    return CropCalendarResponse(
        crop=crop.capitalize(),
        state=state,
        season=state_data.get("season", "Kharif"),
        sowing_window=state_data.get("sowing", "N/A"),
        transplanting=state_data.get("transplanting", "N/A"),
        harvesting_window=state_data.get("harvesting", "N/A"),
        duration_days=state_data.get("duration_days", 120),
        agronomic_tips=tips,
        source="ICAR / State Agriculture Department Bulletin 2024",
    )
