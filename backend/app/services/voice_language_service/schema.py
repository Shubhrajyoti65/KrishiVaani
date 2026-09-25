from pydantic import BaseModel, Field
from typing import Optional

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Source text to translate")
    source_language: str = Field("en", description="Source language code (en, hi, or, bn, pa, mr, te, ta)")
    target_language: str = Field("hi", description="Target language code (en, hi, or, bn, pa, mr, te, ta)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "Recommended crop for your farm is Rice with high yield potential.",
                "source_language": "en",
                "target_language": "hi"
            }
        }
    }

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    engine: str

class SpeechToTextRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64 encoded audio string (WAV/MP3/OGG)")
    language: str = Field("hi", description="Spoken language code (hi, or, en, etc.)")

class SpeechToTextResponse(BaseModel):
    transcribed_text: str
    language: str
    confidence: float

class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to synthesize into spoken audio")
    language: str = Field("hi", description="Target speech language code (hi, or, en, etc.)")
    gender: Optional[str] = Field("female", description="Voice gender (female/male)")

class TextToSpeechResponse(BaseModel):
    audio_base64: str
    audio_format: str
    language: str
