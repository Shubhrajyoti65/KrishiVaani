"""
KrishiVaani — Deterministic Production Cost & Revenue Calculator
Implements transparent arithmetic calculations using CACP / ICAR cost of cultivation benchmarks.
"""
from typing import Dict, Any, List
from backend.app.services.production_cost.schema import (
    ProductionCostRequest, ProductionCostResponse, CostItem
)

# Reference ICAR / CACP A2+FL benchmark costs per acre (INR)
CROP_COST_BENCHMARKS: Dict[str, Dict[str, float]] = {
    "rice": {
        "seeds": 1200.0, "fertilizer": 2800.0, "pesticides": 1500.0,
        "labour": 7500.0, "irrigation": 2000.0, "machinery": 3500.0,
        "transportation": 800.0, "other": 600.0,
        "default_yield_qtl": 18.0, "default_price_qtl": 2300.0
    },
    "wheat": {
        "seeds": 1800.0, "fertilizer": 2600.0, "pesticides": 900.0,
        "labour": 4800.0, "irrigation": 2200.0, "machinery": 3200.0,
        "transportation": 700.0, "other": 500.0,
        "default_yield_qtl": 19.0, "default_price_qtl": 2275.0
    },
    "cotton": {
        "seeds": 2200.0, "fertilizer": 3500.0, "pesticides": 3800.0,
        "labour": 8500.0, "irrigation": 1800.0, "machinery": 3000.0,
        "transportation": 1000.0, "other": 800.0,
        "default_yield_qtl": 7.5, "default_price_qtl": 7121.0
    },
    "maize": {
        "seeds": 1500.0, "fertilizer": 2500.0, "pesticides": 1200.0,
        "labour": 4200.0, "irrigation": 1600.0, "machinery": 2800.0,
        "transportation": 700.0, "other": 500.0,
        "default_yield_qtl": 20.0, "default_price_qtl": 2225.0
    },
    "chickpea": {
        "seeds": 1600.0, "fertilizer": 1800.0, "pesticides": 1100.0,
        "labour": 3800.0, "irrigation": 1000.0, "machinery": 2400.0,
        "transportation": 500.0, "other": 400.0,
        "default_yield_qtl": 7.0, "default_price_qtl": 5440.0
    },
    "sugarcane": {
        "seeds": 6500.0, "fertilizer": 7500.0, "pesticides": 2500.0,
        "labour": 16000.0, "irrigation": 6500.0, "machinery": 6000.0,
        "transportation": 3500.0, "other": 1500.0,
        "default_yield_qtl": 320.0, "default_price_qtl": 315.0
    },
    "potato": {
        "seeds": 14000.0, "fertilizer": 5500.0, "pesticides": 3200.0,
        "labour": 8500.0, "irrigation": 3000.0, "machinery": 5000.0,
        "transportation": 2200.0, "other": 1000.0,
        "default_yield_qtl": 85.0, "default_price_qtl": 1200.0
    },
    "mustard": {
        "seeds": 800.0, "fertilizer": 2200.0, "pesticides": 900.0,
        "labour": 3500.0, "irrigation": 1200.0, "machinery": 2200.0,
        "transportation": 500.0, "other": 400.0,
        "default_yield_qtl": 7.5, "default_price_qtl": 5650.0
    },
    "groundnut": {
        "seeds": 3500.0, "fertilizer": 2600.0, "pesticides": 1400.0,
        "labour": 6000.0, "irrigation": 1800.0, "machinery": 2800.0,
        "transportation": 800.0, "other": 500.0,
        "default_yield_qtl": 8.5, "default_price_qtl": 6783.0
    },
    "soybean": {
        "seeds": 2000.0, "fertilizer": 2400.0, "pesticides": 1500.0,
        "labour": 4000.0, "irrigation": 1000.0, "machinery": 2600.0,
        "transportation": 600.0, "other": 400.0,
        "default_yield_qtl": 7.0, "default_price_qtl": 4892.0
    }
}

DEFAULT_BENCHMARK = {
    "seeds": 1500.0, "fertilizer": 2500.0, "pesticides": 1200.0,
    "labour": 5000.0, "irrigation": 1800.0, "machinery": 2800.0,
    "transportation": 700.0, "other": 500.0,
    "default_yield_qtl": 12.0, "default_price_qtl": 2500.0
}

class ProductionCostCalculator:
    def calculate_cost_and_returns(self, req: ProductionCostRequest) -> ProductionCostResponse:
        crop_key = req.crop.strip().lower()
        benchmarks = CROP_COST_BENCHMARKS.get(crop_key, DEFAULT_BENCHMARK)
        area = float(req.area_acres)

        def resolve_cost(user_val, bench_key, desc):
            if user_val is not None:
                return CostItem(
                    category=bench_key.capitalize(),
                    amount_inr=round(float(user_val), 2),
                    source_tag="User-entered",
                    description=f"{desc} (entered by user)"
                )
            amt = round(benchmarks[bench_key] * area, 2)
            return CostItem(
                category=bench_key.capitalize(),
                amount_inr=amt,
                source_tag="Estimated",
                description=f"{desc} (CACP benchmark ₹{benchmarks[bench_key]:.0f}/acre)"
            )

        items = [
            resolve_cost(req.seed_cost_inr, "seeds", "Certified seed / planting material"),
            resolve_cost(req.fertilizer_cost_inr, "fertilizer", "Chemical and organic fertilizers (Urea, DAP, MOP, FYM)"),
            resolve_cost(req.pesticide_cost_inr, "pesticides", "Plant protection agrochemicals and bio-pesticides"),
            resolve_cost(req.labour_cost_inr, "labour", "Field operations, sowing, weeding, harvesting labour"),
            resolve_cost(req.irrigation_cost_inr, "irrigation", "Electricity, diesel pumps, or water canal cess"),
            resolve_cost(req.machinery_cost_inr, "machinery", "Tractor plowing, rotavator, and combine harvesting rent"),
            resolve_cost(req.transportation_cost_inr, "transportation", "Haulage to nearest APMC Mandi or storage warehouse"),
            resolve_cost(req.other_cost_inr, "other", "Miscellaneous contingency and equipment maintenance"),
        ]

        total_cost = round(sum(it.amount_inr for it in items), 2)
        cost_per_acre = round(total_cost / area, 2)

        # Revenue and Gross Return calculations
        yield_per_acre = (
            req.expected_yield_quintals_per_acre
            if req.expected_yield_quintals_per_acre is not None
            else benchmarks["default_yield_qtl"]
        )
        selling_price = (
            req.expected_selling_price_per_quintal_inr
            if req.expected_selling_price_per_quintal_inr is not None
            else benchmarks["default_price_qtl"]
        )

        expected_production = round(float(yield_per_acre) * area, 2)
        estimated_revenue = round(expected_production * float(selling_price), 2)
        gross_return = round(estimated_revenue - total_cost, 2)
        cost_per_quintal = round(total_cost / expected_production, 2) if expected_production > 0 else 0.0
        profit_margin = round((gross_return / estimated_revenue) * 100.0, 1) if estimated_revenue > 0 else 0.0

        return ProductionCostResponse(
            crop=req.crop.capitalize(),
            state=req.state.capitalize(),
            season=req.season.capitalize(),
            area_acres=area,
            cost_breakdown=items,
            total_production_cost_inr=total_cost,
            cost_per_acre_inr=cost_per_acre,
            expected_production_quintals=expected_production,
            selling_price_per_quintal_inr=selling_price,
            estimated_revenue_inr=estimated_revenue,
            estimated_gross_return_inr=gross_return,
            cost_per_quintal_inr=cost_per_quintal,
            profit_margin_percent=profit_margin
        )

cost_calculator = ProductionCostCalculator()
