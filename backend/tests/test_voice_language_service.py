import pytest
import base64
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.voice_language_service.schema import (
    TranslateRequest,
    SpeechToTextRequest,
    TextToSpeechRequest,
)
from backend.app.services.voice_language_service.service import sarvam_voice_service

client = TestClient(app)

@pytest.mark.anyio
async def test_translate_text_hi_and_or():
    req_hi = TranslateRequest(text="recommended crop rice", source_language="en", target_language="hi")
    res_hi = await sarvam_voice_service.translate_text(req_hi)
    assert res_hi.translated_text and len(res_hi.translated_text) > 0
    assert res_hi.target_language == "hi"

    req_or = TranslateRequest(text="recommended crop rice", source_language="en", target_language="or")
    res_or = await sarvam_voice_service.translate_text(req_or)
    assert res_or.translated_text and len(res_or.translated_text) > 0
    assert res_or.target_language == "or"

@pytest.mark.anyio
async def test_speech_to_text():
    dummy_audio = base64.b64encode(b"RIFF dummy audio bytes").decode("utf-8")
    req = SpeechToTextRequest(audio_base64=dummy_audio, language="hi")
    res = await sarvam_voice_service.speech_to_text(req)
    assert res.transcribed_text is not None
    assert len(res.transcribed_text) > 0
    assert res.language == "hi"

@pytest.mark.anyio
async def test_text_to_speech():
    req = TextToSpeechRequest(text="आपके खेत के लिए चावल उपयुक्त फसल है", language="hi", gender="female")
    res = await sarvam_voice_service.text_to_speech(req)
    assert res.audio_base64 is not None
    assert len(res.audio_base64) > 0
    assert res.audio_format in ["audio/mp3", "audio/wav"]

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

@pytest.mark.anyio
async def test_sarvam_client_language_mapping():
    from backend.app.services.voice_language_service.sarvam_client import SarvamAIClient
    sarvam = SarvamAIClient(api_key="test_key_dummy")
    assert sarvam._to_sarvam_lang("hi") == "hi-IN"
    assert sarvam._to_sarvam_lang("or") == "od-IN"
    assert sarvam._to_sarvam_lang("pa") == "pa-IN"
    assert sarvam._to_sarvam_lang("en") == "en-IN"
    assert sarvam._to_sarvam_lang("te-IN") == "te-IN"

@pytest.mark.anyio
async def test_sarvam_client_mock_dispatch(monkeypatch):
    from backend.app.services.voice_language_service.sarvam_client import SarvamAIClient
    import httpx

    sarvam = SarvamAIClient(api_key="sk_test_mock_123456")

    class MockResponse:
        def __init__(self, status_code, json_data):
            self.status_code = status_code
            self._json = json_data
            self.text = "mock text"
        def json(self):
            return self._json

    async def mock_post(url, *args, **kwargs):
        if "translate" in url:
            return MockResponse(200, {"translated_text": "अनुशंसित फसल"})
        elif "speech-to-text" in url:
            return MockResponse(200, {"transcript": "सरसों की बुवाई कब करें", "language_code": "hi-IN"})
        elif "text-to-speech" in url:
            return MockResponse(200, {"audios": ["bW9ja19hdWRpb19kYXRh"]})
        return MockResponse(404, {})

    monkeypatch.setattr(httpx.AsyncClient, "post", lambda self, url, *a, **kw: mock_post(url, *a, **kw))

    # Test Translate (mayura:v1)
    translated = await sarvam.translate("recommended crop", "en", "hi")
    assert translated == "अनुशंसित फसल"

    # Test STT (saaras:v1)
    stt = await sarvam.speech_to_text("ZHVtbXlhdWRpbw==", "hi")
    assert stt is not None
    assert stt["transcribed_text"] == "सरसों की बुवाई कब करें"

    # Test TTS (bulbul:v1)
    tts = await sarvam.text_to_speech("गेहूं की फसल", "hi", "female")
    assert tts is not None
    assert tts["audio_base64"] == "bW9ja19hdWRpb19kYXRh"
