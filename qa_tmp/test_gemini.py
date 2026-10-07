import os
import sys

sys.path.insert(0, os.path.abspath("."))
from backend.app.core.config import settings

print(f"Loaded GEMINI_API_KEY present: {bool(settings.GEMINI_API_KEY)}")
print(f"Loaded GEMINI_MODEL: {settings.GEMINI_MODEL}")

from langchain_google_genai import ChatGoogleGenerativeAI

try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.3
    )
    print("Testing invoke with Gemini...")
    res = llm.invoke("Hello, in 5 words confirm you are Gemini for KrishiVaani farming assistant.")
    print("Gemini Response:", res.content)
except Exception as e:
    print("Gemini Invoke Exception:", e)
