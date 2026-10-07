from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ROOT_DIR = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    PROJECT_NAME: str = "KrishiVaani API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
    ]

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "krishivaani_db"
    USE_IN_MEMORY_FALLBACK: bool = True

    # Session secret for chat memory
    SECRET_KEY: str = "krishivaani-default-dev-secret-change-in-prod"

    # LLM — Google Gemini API
    -: Optional[str] = None
    GEMINI_API_KEY1: Optional[str] = None
    GEMINI_API_KEY2: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_FALLBACK_MODELS: str = "gemini-3.5-flash-lite,gemini-flash-lite-latest"

    # Weather
    OPENWEATHERMAP_API_KEY: Optional[str] = None

    # Sarvam AI Voice, Translation & Speech (STT: saaras:v1, TTS: bulbul:v1, Translation: mayura:v1)
    SARVAM_API_KEY: Optional[str] = None

    # Google Earth Engine — optional, simulated if absent
    EE_PROJECT: Optional[str] = None

    # Agmarknet / data.gov.in — optional
    DATA_GOV_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=[
            str(_BACKEND_DIR / ".env"),
            str(_ROOT_DIR / ".env"),
            ".env",
        ],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
