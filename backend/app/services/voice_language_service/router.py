from fastapi import APIRouter, HTTPException, status
from backend.app.services.voice_language_service.schema import (
    TranslateRequest,
    TranslateResponse,
    SpeechToTextRequest,
    SpeechToTextResponse,
    TextToSpeechRequest,
    TextToSpeechResponse,
)
from backend.app.services.voice_language_service.service import sarvam_voice_service

router = APIRouter(
    prefix="/voice-language",
    tags=["Sarvam AI Multilingual Voice & Translation (ASR/NMT/TTS)"]
)

@router.post(
    "/translate",
    response_model=TranslateResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate farming text across Indian regional languages (Sarvam mayura:v1)",
    description="Translates advisory text between English, Hindi, Odia, Bengali, Punjabi, Marathi, Telugu, Tamil, etc."
)
async def translate_text(request: TranslateRequest) -> TranslateResponse:
    try:
        return await sarvam_voice_service.translate_text(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sarvam text translation failed: {str(e)}"
        )

@router.post(
    "/speech-to-text",
    response_model=SpeechToTextResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert voice speech audio to text transcript (Sarvam saaras:v1)",
    description="Accepts base64 audio bytes of voice query and transcribes into text in regional language."
)
async def speech_to_text(request: SpeechToTextRequest) -> SpeechToTextResponse:
    try:
        return await sarvam_voice_service.speech_to_text(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sarvam speech to text transcription failed: {str(e)}"
        )

@router.post(
    "/text-to-speech",
    response_model=TextToSpeechResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert farming advisory text into voice audio speech (Sarvam bulbul:v1)",
    description="Synthesizes advisory text into spoken audio payload with natural Indian voices."
)
async def text_to_speech(request: TextToSpeechRequest) -> TextToSpeechResponse:
    try:
        return await sarvam_voice_service.text_to_speech(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sarvam text to speech synthesis failed: {str(e)}"
        )
