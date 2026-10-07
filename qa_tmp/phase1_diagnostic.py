import os
import sys
import json
import subprocess
import shutil

sys.path.insert(0, os.path.abspath("."))

print("=" * 60)
print("PHASE 1 DIAGNOSTIC: ENVIRONMENT, DEPENDENCIES & MODELS")
print("=" * 60)

# 1. Python and Node Versions
print("\n--- 1. Runtimes ---")
print(f"Python Version: {sys.version.split()[0]} ({sys.executable})")

node_ver = "Not installed"
try:
    node_out = subprocess.run(["node", "-v"], capture_output=True, text=True, check=True)
    node_ver = node_out.stdout.strip()
except Exception as e:
    node_ver = f"Error: {e}"
print(f"Node.js Version: {node_ver}")

npm_ver = "Not installed"
try:
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    npm_out = subprocess.run([npm_cmd, "-v"], capture_output=True, text=True, check=True)
    npm_ver = npm_out.stdout.strip()
except Exception as e:
    npm_ver = f"Error: {e}"
print(f"npm Version: {npm_ver}")

# 2. Environment Variables & Settings
print("\n--- 2. Environment Variables & Keys ---")
from backend.app.core.config import settings

def check_env_var(name, val):
    if not val:
        print(f"  {name:25s}: [MISSING / EMPTY]")
        return False
    # Do NOT print the secret
    masked = f"SET (Length: {len(val)}, Prefix: {val[:4]}...)"
    print(f"  {name:25s}: [PRESENT] {masked}")
    return True

env_report = {}
env_report["MONGODB_URL"] = check_env_var("MONGODB_URL", settings.MONGODB_URL)
env_report["DATABASE_NAME"] = check_env_var("DATABASE_NAME", settings.DATABASE_NAME)
env_report["SECRET_KEY"] = check_env_var("SECRET_KEY", settings.SECRET_KEY)
env_report["OPENWEATHERMAP_API_KEY"] = check_env_var("OPENWEATHERMAP_API_KEY", settings.OPENWEATHERMAP_API_KEY)
env_report["OPENAI_API_KEY"] = check_env_var("OPENAI_API_KEY", settings.OPENAI_API_KEY)
env_report["ANTHROPIC_API_KEY"] = check_env_var("ANTHROPIC_API_KEY", settings.ANTHROPIC_API_KEY)
env_report["SARVAM_API_KEY"] = check_env_var("SARVAM_API_KEY", settings.SARVAM_API_KEY)
env_report["EE_PROJECT"] = check_env_var("EE_PROJECT", settings.EE_PROJECT)
env_report["DATA_GOV_API_KEY"] = check_env_var("DATA_GOV_API_KEY", settings.DATA_GOV_API_KEY)

# 3. MongoDB Connection Check
print("\n--- 3. MongoDB Connection ---")
try:
    from pymongo import MongoClient
    client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    client.admin.command('ping')
    print("  Local/Atlas MongoDB: CONNECTED (ping succeeded)")
except Exception as e:
    print(f"  Local/Atlas MongoDB: NOT REACHABLE ({e})")
    print(f"  In-Memory Fallback Flag: {settings.USE_IN_MEMORY_FALLBACK}")

# 4. Model & Artifact Files Verification
print("\n--- 4. Machine Learning & Model Files ---")
import joblib

# Crop recommendation models
crop_rf_path = "backend/app/services/crop_recommendation/crop_recommendation_rf.joblib"
crop_xgb_path = "backend/app/services/crop_recommendation/crop_recommendation_xgb.joblib"
crop_best_path = "backend/ml/crop_recommendation/model/crop_recommendation_best.joblib"

for p in [crop_rf_path, crop_xgb_path, crop_best_path]:
    if os.path.exists(p):
        try:
            m = joblib.load(p)
            print(f"  {p}: EXISTS & LOADS OK (type={type(m).__name__})")
        except Exception as e:
            print(f"  {p}: EXISTS but LOAD ERROR: {e}")
    else:
        print(f"  {p}: MISSING")

# Yield prediction models
yield_rf_path = "backend/app/services/yield_prediction/yield_prediction_rf.joblib"
yield_best_path = "backend/ml/yield_prediction/model/yield_prediction_best.joblib"

for p in [yield_rf_path, yield_best_path]:
    if os.path.exists(p):
        try:
            m = joblib.load(p)
            print(f"  {p}: EXISTS & LOADS OK (type={type(m).__name__})")
        except Exception as e:
            print(f"  {p}: EXISTS but LOAD ERROR: {e}")
    else:
        print(f"  {p}: MISSING")

# DigiGreen Vocabularies & Engine
print("\n--- 5. DigiGreen Disease Model ---")
from backend.app.services.disease_detection.digigreen_engine import digigreen_engine
print(f"  DigiGreen Assets Dir: {digigreen_engine.crop_vocab and 'Vocabs Loaded OK' or 'Vocabs Missing'}")
print(f"  Crop Vocab Classes: {len(digigreen_engine.crop_vocab)}")
print(f"  Disease Vocab Classes: {len(digigreen_engine.disease_vocab)}")
print(f"  Category Vocab Classes: {len(digigreen_engine.category_vocab)}")
print(f"  Pest Vocab Classes: {len(digigreen_engine.pest_vocab)}")
print(f"  Crop-Disease Mask: {'Present' if digigreen_engine.crop_disease_mask is not None else 'None'}")
print(f"  PyTorch Installed: {hasattr(digigreen_engine, 'device')}")
print(f"  Device: {getattr(digigreen_engine, 'device', 'N/A')}")

# Agricultural RAG
print("\n--- 6. Agricultural RAG & Corpus ---")
from backend.app.services.agricultural_rag.retriever import AgriculturalRetriever
retriever = AgriculturalRetriever()
print(f"  RAG Corpus Documents: {len(retriever.corpus)}")
sample_ret = retriever.retrieve("rice blast tricyclazole", top_k=2)
print(f"  Sample Retrieval for 'rice blast': {len(sample_ret)} citations found (First: {sample_ret[0].title if sample_ret else 'None'})")

print("\nPhase 1 diagnostic completed.")
