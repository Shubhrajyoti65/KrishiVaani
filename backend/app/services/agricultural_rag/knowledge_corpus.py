"""
KrishiVaani — Authoritative Agricultural Knowledge Corpus
Curated from ICAR (Indian Council of Agricultural Research), CIBRC (Central Insecticides Board & Registration Committee),
and State Agricultural Universities (PAU, TNAU, OUAT, IARI).
"""
from typing import List, Dict, Any

AGRICULTURAL_DOCUMENTS: List[Dict[str, Any]] = [
    # ── 1. Rice Blast Management ──
    {
        "doc_id": "ICAR-RICE-BLAST-01",
        "title": "Integrated Disease Management for Rice Blast (Magnaporthe oryzae)",
        "source": "ICAR - National Rice Research Institute (NRRI), Cuttack",
        "crop": "Rice",
        "disease": "Blast",
        "topic": "disease_management",
        "region": "Eastern & Southern India",
        "content": (
            "Rice blast is caused by the fungus Magnaporthe oryzae. Symptoms include spindle-shaped elliptical lesions with gray "
            "or whitish centers and reddish-brown borders on leaf blades (leaf blast), and blackening of the node or neck (neck blast). "
            "Immediate Actions: Drain stagnant water temporarily to reduce microclimate humidity. Avoid excessive nitrogen top-dressing. "
            "Cultural Management: Maintain optimum plant spacing (20x15 cm) to allow canopy aeration. Burn or deep-plow infected stubble after harvest. "
            "Biological & Low-Cost Measures: Foliar spray of Pseudomonas fluorescens (talc-based formulation) @ 10 g/litre at 15-day intervals or Neem Seed Kernel Extract (NSKE 5%). "
            "Chemical Control (Approved by CIBRC): Tricyclazole 75% WP @ 0.6 g/litre water OR Isoprothiolane 40% EC @ 1.5 ml/litre water. "
            "Safety & Pre-Harvest Interval (PHI): Tricyclazole PHI is 30 days; wear personal protective equipment (gloves, mask) during spraying. Do not spray against the wind."
        )
    },
    # ── 2. Rice Brown Spot Management ──
    {
        "doc_id": "ICAR-RICE-BROWNSPOT-02",
        "title": "Management of Brown Spot in Paddy (Bipolaris oryzae / Helminthosporium oryzae)",
        "source": "ICAR - Indian Agricultural Research Institute (IARI), New Delhi",
        "crop": "Rice",
        "disease": "Brown Spot",
        "topic": "disease_management",
        "region": "Indo-Gangetic Plain & Coastal Belts",
        "content": (
            "Brown spot is characterized by oval or sesame-seed-shaped dark brown lesions with yellow chlorotic halos on foliage. "
            "It is strongly correlated with nutrient-depleted, potash-deficient, or water-stressed soils. "
            "Immediate Actions: Apply balanced top-dressing of Potassium (MOP @ 15-20 kg/acre) and zinc sulfate (10 kg/acre if deficient). "
            "Cultural Management: Ensure proper land leveling and avoid prolonged water stress. Sow certified disease-free seeds. "
            "Low-Cost / Bio Options: Seed soaking in Trichoderma harzianum @ 10 g/kg seed before nursery sowing. Spray fermented butter-milk (chaas) mixed with water (1:10) as bio-fungicide. "
            "Chemical Control: Mancozeb 75% WP @ 2.0 g/litre water or Propiconazole 25% EC @ 1.0 ml/litre water. "
            "Safety: Spray early morning or late afternoon. Keep domestic animals away from treated field for 48 hours."
        )
    },
    # ── 3. Potato Late Blight Management ──
    {
        "doc_id": "CPRI-POTATO-LATEBLIGHT-01",
        "title": "Integrated Management of Late Blight of Potato (Phytophthora infestans)",
        "source": "ICAR - Central Potato Research Institute (CPRI), Shimla",
        "crop": "Potato",
        "disease": "Late Blight",
        "topic": "disease_management",
        "region": "North Indian Plains & Hills",
        "content": (
            "Late blight presents as water-soaked irregular dark brown lesions on leaf tips and margins, rapidly expanding with white cottony mildew on the lower leaf surface during humid foggy weather (>85% RH, 12-20°C). "
            "Immediate Actions: Destroy early infected patches; immediately stop sprinkler or overhead irrigation. "
            "Cultural Management: Plant certified healthy seed tubers from reputed sources. Carry out earthing-up properly to cover developing tubers by at least 5 cm soil layer. "
            "Biological Options: Prophylactic copper oxychloride 50% WP @ 2.5 g/litre or Trichoderma viride foliar spray. "
            "Chemical Control: Metalaxyl 8% + Mancozeb 64% WP @ 2.5 g/litre water OR Cymoxanil 8% + Mancozeb 64% WP @ 2.0 g/litre. "
            "Safety & PHI: Pre-harvest interval for Mancozeb combination is 14 days before tuber lifting. Wear eye protection and waterproof apron."
        )
    },
    # ── 4. Tomato Early & Late Blight ──
    {
        "doc_id": "IIHR-TOMATO-BLIGHT-01",
        "title": "Early Blight & Leaf Curl Management in Solanaceous Crops",
        "source": "ICAR - Indian Institute of Horticultural Research (IIHR), Bengaluru",
        "crop": "Tomato",
        "disease": "Early Blight",
        "topic": "disease_management",
        "region": "Peninsular & Central India",
        "content": (
            "Early blight (Alternaria solani) causes target-board concentric dark rings on older lower leaves, advancing upwards. "
            "Immediate Actions: Prune lower infected leaves touching the soil surface and safely dispose outside the field. "
            "Cultural Measures: Practice staking with bamboo poles to prevent leaves contacting wet soil. Avoid overhead sprinkler irrigation; prefer drip irrigation. "
            "Biological / Low-Cost Options: Spray Neem oil (10,000 ppm) @ 3 ml/litre emulsified with mild liquid soap. Apply Trichoderma harzianum enriched farmyard manure to root zone. "
            "Chemical Control: Chlorothalonil 75% WP @ 2 g/litre water or Difenoconazole 25% EC @ 1 ml/litre. "
            "Safety & Restrictions: PHI for Chlorothalonil on tomato is 5 days. Never apply pesticides during peak honeybee foraging hours (9 AM - 12 PM)."
        )
    },
    # ── 5. Crop Rotation & Legume Nitrogen Cycling ──
    {
        "doc_id": "ICAR-ROTATION-LEGUME-01",
        "title": "Principles of Agronomic Crop Rotation and Legume-Cereal Nutrient Cycling",
        "source": "ICAR - Indian Agricultural Research Institute (IARI), Agronomy Division",
        "crop": "General",
        "disease": "None",
        "topic": "crop_rotation",
        "region": "National",
        "content": (
            "Crop rotation involves alternating deep-rooted and shallow-rooted crops, as well as legumes and cereals, across seasons. "
            "1. Cereal-Legume Synergy: Incorporating pulses (chickpea, blackgram, mungbean, pigeonpea) fixes 40–90 kg atmospheric nitrogen per hectare through Rhizobium nodules. "
            "2. Pest Cycle Disruption: Continuous monoculture (such as continuous paddy-paddy or cotton-cotton) causes buildup of soil-borne pathogens (Fusarium wilt, root rot) and specialized insect pests. Rotating with a non-host botanical family starves pest inocula. "
            "3. Root Zone Stratification: Deep tap-root crops like cotton, pigeonpea, or mustard access subsoil moisture and nutrients, opening aeration channels for subsequent shallow fibrous root crops like wheat or maize. "
            "4. Organic Residue Management: Legume haulms and green leaf residues decompose rapidly due to low C:N ratio (15:1 to 25:1), stimulating soil microbial biomass."
        )
    },
    # ── 6. Soil Improvement & Green Manuring ──
    {
        "doc_id": "ICAR-SOIL-HEALTH-01",
        "title": "Soil Organic Carbon Enhancement, Bio-fertilizers, and Green Manuring Practices",
        "source": "ICAR - Indian Institute of Soil Science (IISS), Bhopal",
        "crop": "General",
        "disease": "None",
        "topic": "soil_improvement",
        "region": "National",
        "content": (
            "Soil health optimization requires maintaining Soil Organic Carbon (SOC > 0.75%) and neutral pH (6.5 - 7.5). "
            "1. Green Manuring: Sowing Sesbania aculeata (Dhaincha) or Crotalaria juncea (Sunnhemp) @ 20-25 kg/acre in May-June, and incorporating into soil at 45-50 days (before flowering) adds 15-20 tonnes green biomass and 60-80 kg N/ha. "
            "2. Bio-fertilizer Consortia: Azospirillum / Azotobacter for Nitrogen fixation; Bacillus / Pseudomonas for Phosphate Solubilization (PSB); and Frateuria aurantia for Potash Mobilization (KMB) @ 2 kg/acre each mixed with vermicompost. "
            "3. Acidity Correction: For soils with pH < 5.5, apply Agricultural Lime (CaCO3) @ 500-1000 kg/ha based on soil buffer capacity, 3 weeks before sowing. "
            "4. Alkalinity Correction: For sodic soils with pH > 8.5, apply Gypsum (CaSO4.2H2O) followed by leaching with good quality canal water. "
            "5. Moisture Retention: Farmyard Manure (FYM) @ 4-5 tonnes/acre or in-situ crop residue mulching reduces soil evaporation by 30-40%."
        )
    },
    # ── 7. Pesticide Regulatory Safety & CIBRC Compliance ──
    {
        "doc_id": "CIBRC-SAFETY-REGULATORY-01",
        "title": "Safe Use, Handling, and Regulatory Restrictions on Agrochemicals in India",
        "source": "Central Insecticides Board & Registration Committee (CIBRC), Directorate of Plant Protection, Quarantine & Storage",
        "crop": "General",
        "disease": "None",
        "topic": "safety",
        "region": "National",
        "content": (
            "Pesticide safety regulations mandate that chemicals are applied only for registered label claims approved by CIBRC. "
            "Crucial Safety Mandates: "
            "1. Personal Protective Equipment (PPE): Always wear rubber gloves, boots, protective goggles, and nose mask during preparation and spraying. "
            "2. Pre-Harvest Interval (PHI): Observe statutory waiting periods between the final spray and harvesting (e.g., Mancozeb 7-14 days; Tricyclazole 30 days). "
            "3. Re-entry Interval: Farmers and farm laborers must not enter treated plots for a minimum of 24 to 48 hours post-application. "
            "4. Disposal: Empty pesticide containers must be triple-rinsed, punctured, and disposed of per environmental guidelines; never reuse containers for domestic or livestock water. "
            "5. When to Contact Experts: If >30% foliage is severely blighted, or unusual wilting/dieback occurs that does not match standard leaf spot patterns, consult the local Krishi Vigyan Kendra (KVK) or Assistant Agriculture Officer (AAO) immediately."
        )
    },
    # ── 8. Cotton Pink Bollworm & Whitefly IPM ──
    {
        "doc_id": "CICR-COTTON-IPM-01",
        "title": "Integrated Pest Management (IPM) for Cotton Whitefly and Pink Bollworm",
        "source": "ICAR - Central Institute for Cotton Research (CICR), Nagpur",
        "crop": "Cotton",
        "disease": "Pink Bollworm / Whitefly",
        "topic": "pest_management",
        "region": "Central & Western India (Maharashtra, Gujarat, Punjab)",
        "content": (
            "Whitefly transmits Cotton Leaf Curl Virus (CLCuV); Pink Bollworm (Pectinophora gossypiella) attacks squares and bolls. "
            "Monitoring & ETL: Install yellow sticky traps @ 8-10 per acre for whitefly. For pink bollworm, install pheromone traps with gossyplure @ 2 traps/acre (ETL: 8 moths/trap/night for 3 consecutive days). "
            "Cultural Control: Avoid early or off-season cotton planting. Sow border rows of maize, sorghum, or pearl millet to harbor natural predators. "
            "Biological Control: Spray Neem seed kernel extract (NSKE 5%) or Azadirachtin 1500 ppm @ 2.5 ml/litre water. Release Trichogramma bactrae egg parasitoid @ 60,000/acre. "
            "Chemical Options: For whitefly exceeding ETL: Diafenthiuron 50% WP @ 1.2 g/litre OR Pyriproxyfen 10% EC @ 2 ml/litre. For bollworm: Emamectin benzoate 5% SG @ 0.5 g/litre. "
            "Safety: Never mix organophosphates with synthetic pyrethroids indiscriminately."
        )
    }
]
