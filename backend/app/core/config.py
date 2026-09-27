from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ROOT_DIR = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    PROJECT_NAME: str = "KrishiVaani API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["*"]

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "krishivaani_db"
    USE_IN_MEMORY_FALLBACK: bool = True

    # Session secret for chat memory
    SECRET_KEY: str = "krishivaani-default-dev-secret-change-in-prod"

    # LLM — at least one must be set for real AI responses
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # Weather
    OPENWEATHERMAP_API_KEY: Optional[str] = None

    # Bhashini Voice/Translation — optional, mocked if absent
    BHASHINI_USER_ID: Optional[str] = None
    BHASHINI_API_KEY: Optional[str] = None
    BHASHINI_PIPELINE_ID: str = "64392f08f21d092df78502f9"

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
