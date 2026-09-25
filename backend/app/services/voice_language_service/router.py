from fastapi import APIRouter, HTTPException, status
from backend.app.services.voice_language_service.schema import (
    TranslateRequest,
    TranslateResponse,
    SpeechToTextRequest,
    SpeechToTextResponse,
    TextToSpeechRequest,
    TextToSpeechResponse,
)
from backend.app.services.voice_language_service.service import bhashini_service

router = APIRouter(
    prefix="/voice-language",
    tags=["Bhashini Multilingual & Voice Service (ASR/NMT/TTS)"]
)

@router.post(
    "/translate",
    response_model=TranslateResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate farming text across Indian regional languages (Bhashini NMT)",
    description="Translates advisory text between English, Hindi, Odia, Bengali, Punjabi, Marathi, Telugu, Tamil, etc."
)
async def translate_text(request: TranslateRequest) -> TranslateResponse:
    try:
        return await bhashini_service.translate_text(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text translation failed: {str(e)}"
        )

@router.post(
    "/speech-to-text",
    response_model=SpeechToTextResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert voice speech audio to text transcript (Bhashini ASR)",
    description="Accepts base64 audio bytes of voice query and transcribes into text in regional language."
)
async def speech_to_text(request: SpeechToTextRequest) -> SpeechToTextResponse:
    try:
        return await bhashini_service.speech_to_text(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech to text transcription failed: {str(e)}"
        )

@router.post(
    "/text-to-speech",
    response_model=TextToSpeechResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert farming advisory text into voice audio speech (Bhashini TTS)",
    description="Synthesizes advisory text into spoken MP3 audio base64 payload."
)
async def text_to_speech(request: TextToSpeechRequest) -> TextToSpeechResponse:
    try:
        return await bhashini_service.text_to_speech(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text to speech synthesis failed: {str(e)}"
        )
