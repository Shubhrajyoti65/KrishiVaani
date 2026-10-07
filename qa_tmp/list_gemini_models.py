import os
import sys

sys.path.insert(0, os.path.abspath("."))
from backend.app.core.config import settings
from google import genai

client = genai.Client(api_key=settings.GEMINI_API_KEY)
print("Listing available models for this key:")
try:
    for m in client.models.list():
        # filter to models that support generateContent
        methods = getattr(m, "supported_generation_methods", []) or getattr(m, "supported_actions", [])
        print(f"Name: {m.name}, Display: {getattr(m, 'display_name', '')}")
except Exception as e:
    print("Error listing models:", e)
