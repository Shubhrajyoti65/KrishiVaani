from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "KrishiVaani API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # MongoDB Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "krishivaani_db"
    USE_IN_MEMORY_FALLBACK: bool = True  # Enable graceful fallback if live MongoDB is unreachable

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
