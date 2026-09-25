import pytest
import base64
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.voice_language_service.schema import (
    TranslateRequest,
    SpeechToTextRequest,
    TextToSpeechRequest,
)
from backend.app.services.voice_language_service.service import bhashini_service

client = TestClient(app)

@pytest.mark.anyio
async def test_translate_text_hi_and_or():
    req_hi = TranslateRequest(text="recommended crop rice", source_language="en", target_language="hi")
    res_hi = await bhashini_service.translate_text(req_hi)
    assert "अनुशंसित फसल" in res_hi.translated_text
    assert res_hi.target_language == "hi"

    req_or = TranslateRequest(text="recommended crop rice", source_language="en", target_language="or")
    res_or = await bhashini_service.translate_text(req_or)
    assert "ସୁପାରିଶ କରାଯାଇଥିବା ଫସଲ" in res_or.translated_text
    assert res_or.target_language == "or"

@pytest.mark.anyio
async def test_speech_to_text():
    dummy_audio = base64.b64encode(b"RIFF dummy audio bytes").decode("utf-8")
    req = SpeechToTextRequest(audio_base64=dummy_audio, language="hi")
    res = await bhashini_service.speech_to_text(req)
    assert res.transcribed_text is not None
    assert len(res.transcribed_text) > 0
    assert res.language == "hi"

@pytest.mark.anyio
async def test_text_to_speech():
    req = TextToSpeechRequest(text="आपके खेत के लिए चावल उपयुक्त फसल है", language="hi", gender="female")
    res = await bhashini_service.text_to_speech(req)
    assert res.audio_base64 is not None
    assert len(res.audio_base64) > 0
    assert res.audio_format == "audio/mp3"

def test_voice_api_endpoints():
    # 1. Translate API
    t_res = client.post("/api/v1/voice-language/translate", json={
        "text": "weather recommendation",
        "source_language": "en",
        "target_language": "hi"
    })
    assert t_res.status_code == 200
    assert "translated_text" in t_res.json()

    # 2. Speech-to-text API
    dummy_audio = base64.b64encode(b"audio header").decode("utf-8")
    stt_res = client.post("/api/v1/voice-language/speech-to-text", json={
        "audio_base64": dummy_audio,
        "language": "or"
    })
    assert stt_res.status_code == 200
    assert "transcribed_text" in stt_res.json()

    # 3. Text-to-speech API
    tts_res = client.post("/api/v1/voice-language/text-to-speech", json={
        "text": "धान की फसल",
        "language": "hi"
    })
    assert tts_res.status_code == 200
    assert "audio_base64" in tts_res.json()
