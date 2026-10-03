import os
import io
import base64
import logging
from typing import Optional, Dict, Any
import httpx
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

SARVAM_BASE_URL = "https://api.sarvam.ai"

# BCP-47 Language mapping for Sarvam AI
SARVAM_LANG_MAP: Dict[str, str] = {
    "hi": "hi-IN",
    "en": "en-IN",
    "or": "od-IN",
    "od": "od-IN",
    "bn": "bn-IN",
    "pa": "pa-IN",
    "mr": "mr-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "gu": "gu-IN",
}

class SarvamAIClient:
    """
    Client for Sarvam AI multilingual Indian speech & language services:
    - Translation (mayura:v1)
    - Speech-to-Text (saaras:v1)
    - Text-to-Speech (bulbul:v1)
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def _to_sarvam_lang(self, lang: str) -> str:
        """Map short language code to Sarvam BCP-47 tag (e.g. 'hi' -> 'hi-IN')."""
        parts = lang.strip().split("-")
        lang_code = parts[0].lower()
        if len(parts) > 1:
            region = parts[1].upper()
            return f"{lang_code}-{region}"
        return SARVAM_LANG_MAP.get(lang_code, f"{lang_code}-IN")

    async def translate(
        self,
        text: str,
        source_lang: str = "en",
        target_lang: str = "hi",
        gender: str = "Female"
    ) -> Optional[str]:
        """
        Translate text using Sarvam mayura:v1.
        Returns translated string or None on failure.
        """
        if not self.is_configured:
            return None

        src_code = self._to_sarvam_lang(source_lang)
        tgt_code = self._to_sarvam_lang(target_lang)

        headers = {
            "api-subscription-key": self.api_key.strip(),
            "Content-Type": "application/json",
        }
        payload = {
            "input": text,
            "source_language_code": src_code,
            "target_language_code": tgt_code,
            "speaker_gender": "Female" if gender.lower() == "female" else "Male",
            "mode": "formal",
            "model": "mayura:v1",
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"{SARVAM_BASE_URL}/translate",
                    json=payload,
                    headers=headers
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("translated_text")
                else:
                    logger.warning(f"Sarvam translation API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Sarvam translation request error: {e}")

        return None

    async def speech_to_text(
        self,
        audio_base64: str,
        language: str = "hi"
    ) -> Optional[Dict[str, Any]]:
        """
        Transcribe spoken audio using Sarvam saaras:v1.
        Returns dict with 'transcribed_text' and 'confidence' or None.
        """
        if not self.is_configured:
            return None

        try:
            audio_bytes = base64.b64decode(audio_base64)
        except Exception as e:
            logger.error(f"Failed to decode audio base64: {e}")
            return None

        lang_code = self._to_sarvam_lang(language)
        headers = {
            "api-subscription-key": self.api_key.strip(),
        }

        files = {
            "file": ("input_audio.wav", io.BytesIO(audio_bytes), "audio/wav")
        }
        data = {
            "model": "saaras:v1",
            "language_code": lang_code,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{SARVAM_BASE_URL}/speech-to-text",
                    headers=headers,
                    files=files,
                    data=data
                )
                if res.status_code == 200:
                    res_data = res.json()
                    transcript = res_data.get("transcript", "")
                    return {
                        "transcribed_text": transcript,
                        "confidence": 0.95 if transcript else 0.0,
                        "language": language,
                    }
                else:
                    logger.warning(f"Sarvam STT API error {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Sarvam STT request error: {e}")

        return None

    async def text_to_speech(
        self,
        text: str,
        language: str = "hi",
        gender: str = "female"
    ) -> Optional[Dict[str, Any]]:
        """
        Synthesize audio speech from text using Sarvam bulbul:v1.
        Returns dict with 'audio_base64' and 'audio_format' or None.
        """
        if not self.is_configured:
            return None

        target_lang_code = self._to_sarvam_lang(language)
        # Select appropriate speaker profile
        speaker = "meera" if gender.lower() == "female" else "arvind"

        headers = {
            "api-subscription-key": self.api_key.strip(),
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": [text[:500]],  # Ensure text length stays within safe limits
            "target_language_code": target_lang_code,
            "speaker": speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.0,
            "speech_sample_rate": 22050,
            "enable_preprocessing": True,
            "model": "bulbul:v1",
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{SARVAM_BASE_URL}/text-to-speech",
                    json=payload,
                    headers=headers
                )
                if res.status_code == 200:
                    data = res.json()
                    audios = data.get("audios", [])
                    if audios and len(audios) > 0:
                        return {
                            "audio_base64": audios[0],
                            "audio_format": "audio/wav",
                            "language": language,
                        }
                else:
                    logger.warning(f"Sarvam TTS API error {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Sarvam TTS request error: {e}")

        return None

sarvam_client = SarvamAIClient()
