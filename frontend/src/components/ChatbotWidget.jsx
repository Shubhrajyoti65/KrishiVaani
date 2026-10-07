import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Mic, MicOff, Bot, User, Loader,
  Sprout, CloudSun, TrendingUp, Satellite, Volume2, VolumeX,
  ArrowLeft, Square, Globe, Lock, UserPlus, CheckCircle2, LogIn
} from 'lucide-react';
import { AGRI_IMAGES } from '../data/agriImages';
import { useAuth } from '../context/AuthContext';

const LANG_GREET = {
  en: "Hello! I'm KrishiVaani AI Assistant 🌾 I can help you with crop recommendations, weather advisories, yield estimates, and disease diagnosis. How can I help you today?",
  hi: "नमस्ते! मैं कृषिवाणी AI सहायक हूँ 🌾 मैं फसल की जानकारी, मौसम अपडेट, उपज और रोग पहचान में आपकी मदद कर सकता हूँ। आज आप क्या जानना चाहते हैं?",
  or: "ନମସ୍କାର! ମୁଁ କୃଷିବାଣୀ AI ସହାୟକ 🌾 ଫସଲ ଅନୁଶଂସା, ପାଣିପାଗ, ଅମଳ ଆଦି ବିଷୟରେ ସାହାଯ୍ୟ କରିପାରିବି। ଆଜି ଆପଣ କ'ଣ ଜାଣିବାକୁ ଚାହୁଁଛନ୍ତି?",
};

const QUICK_PROMPTS = [
  { icon: Sprout,    text: 'Which crop is best for my black soil?', label: 'Crop Advice' },
  { icon: CloudSun,  text: 'Will there be rain in Delhi this week?', label: 'Weather' },
  { icon: TrendingUp,text: 'What is the MSP for wheat in 2025?',    label: 'MSP Price' },
  { icon: Satellite, text: 'How to check my field NDVI health?',     label: 'Satellite' },
];

const CHAT_LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' },
  { code: 'or', label: 'ଓଡ଼ିଆ', short: 'OR' },
];

export default function ChatbotWidget({ currentLang = 'en', setCurrentLang, onBack }) {
  const { user, isAuthenticated, openAuth } = useAuth();
  const [chatLang, setChatLang] = useState(currentLang || 'en');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: user?.name
        ? (currentLang === 'hi'
            ? `नमस्ते ${user.name}! मैं कृषिवाणी AI सहायक हूँ 🌾 मैं फसल की जानकारी, मौसम अपडेट, उपज और रोग पहचान में आपकी मदद कर सकता हूँ। आज आप क्या जानना चाहते हैं?`
            : currentLang === 'or'
            ? `ନମସ୍କାର ${user.name}! ମୁଁ କୃଷିବାଣୀ AI ସହାୟକ 🌾 ଫସଲ ଅନୁଶଂସା, ପାଣିପାଗ, ଅମଳ ଆଦି ବିଷୟରେ ସାହାଯ୍ୟ କରିପାରିବି। ଆଜି ଆପଣ କ'ଣ ଜାଣିବାକୁ ଚାହୁଁଛନ୍ତି?`
            : `Hello ${user.name}! I'm KrishiVaani AI Assistant 🌾 I can help you with crop recommendations, weather advisories, yield estimates, and disease diagnosis. How can I help you today?`)
        : (LANG_GREET[currentLang] || LANG_GREET.en),
      ts: new Date()
    }
  ]);
  const [input,      setInput]     = useState('');
  const [loading,    setLoading]   = useState(false);
  const [listening,  setListening] = useState(false);
  const [playingId,  setPlayingId] = useState(null);
  const [sessionId,  setSessionId] = useState(null);

  const bottomRef = useRef(null);
  const audioRef  = useRef(null);

  // Sync when currentLang prop changes externally
  useEffect(() => {
    if (currentLang && currentLang !== chatLang) {
      setChatLang(currentLang);
    }
  }, [currentLang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleLanguageChange = (newCode) => {
    setChatLang(newCode);
    if (setCurrentLang) {
      setCurrentLang(newCode);
    }
    // Update or add language greeting
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: 'assistant',
        text: LANG_GREET[newCode] || LANG_GREET.en,
        ts: new Date()
      }
    ]);
  };

  // Clean Markdown asterisks and symbols for smooth voice pronunciation
  const cleanSpeechText = (text) => {
    return text
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setPlayingId(null);
  };

  const speakMessage = async (msgId, text) => {
    if (playingId === msgId) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    setPlayingId(msgId);

    const spokenText = cleanSpeechText(text).slice(0, 450);

    // 1. Try Backend Neural TTS
    try {
      const res = await fetch('http://localhost:8000/api/v1/voice-language/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenText,
          language: chatLang,
          gender: 'female'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio_base64) {
          const snd = new Audio(`data:${data.audio_format || 'audio/mp3'};base64,${data.audio_base64}`);
          audioRef.current = snd;
          snd.onended = () => setPlayingId(null);
          snd.onerror = () => fallbackBrowserSpeech(msgId, spokenText);
          await snd.play();
          return;
        }
      }
    } catch (e) {
      console.warn("Backend TTS unreachable, using browser speech synthesis:", e);
    }

    // 2. Fallback to Browser Speech Synthesis
    fallbackBrowserSpeech(msgId, spokenText);
  };

  const fallbackBrowserSpeech = (msgId, text) => {
    if (!('speechSynthesis' in window)) {
      setPlayingId(null);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.0;

      const langCode = chatLang === 'hi' ? 'hi' : chatLang === 'or' ? 'or' : 'en';
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.toLowerCase().startsWith(langCode));
      if (match) utterance.voice = match;

      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);

      window.speechSynthesis.speak(utterance);
    } catch {
      setPlayingId(null);
    }
  };

  const send = async (text = input.trim()) => {
    if (!text || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        message: text,
        language: chatLang,
        ...(sessionId && { session_id: sessionId }),
        ...(user?.id && { farmer_id: user.id }),
        ...(user?.district && { district: user.district }),
        ...(user?.state && { state: user.state }),
        ...(user?.soil_type && { soil_type: user.soil_type }),
      };
      const res = await fetch('http://localhost:8000/api/v1/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error (${res.status})`);
      }
      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      const replyText = data.reply || data.response;
      const newBotMsg = { id: Date.now() + 1, role: 'assistant', text: replyText, ts: new Date() };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (err) {
      console.error('Chatbot API error:', err);
      const isQuota = err.message && (err.message.includes('429') || err.message.toLowerCase().includes('quota'));
      const errorText = isQuota
        ? '⚠️ KrishiMitra is currently busy (API quota limit reached). Please try again in a few moments.'
        : `⚠️ KrishiMitra service error: ${err.message || 'Unable to connect to assistant. Please try again.'}`;
      const errorBotMsg = { id: Date.now() + 1, role: 'assistant', text: errorText, isError: true, ts: new Date() };
      setMessages(prev => [...prev, errorBotMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (listening) { setListening(false); return; }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = chatLang === 'hi' ? 'hi-IN' : chatLang === 'or' ? 'or-IN' : 'en-IN';
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const fmt = (ts) => ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Page Header */}
      <div className="segment-header-box">
        <div className="segment-header-icon">
          <MessageSquare size={24} />
        </div>
        <h2 className="segment-header-title">AI Farming Assistant</h2>
      </div>

      {!isAuthenticated ? (
        <div
          className="card-glass animate-fade-in-up"
          style={{
            borderRadius: '24px',
            border: '1.5px solid var(--border-glass)',
            background: 'var(--bg-card)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: '720px',
            margin: '1.5rem auto 2.5rem',
          }}
        >
          {/* Glowing ambient radial blur */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '360px',
              height: '200px',
              background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(30px)',
            }}
          />

          {/* Access Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.4rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--green-primary)',
              marginBottom: '1.75rem',
            }}
          >
            <Lock size={15} />
            <span>Registration or Login Required</span>
          </div>

          {/* Icon */}
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '26px',
              background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 32px var(--green-glow)',
            }}
          >
            <Bot size={46} color="#ffffff" />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Unlock AI Farming Assistant
          </h2>

          <p
            style={{
              fontSize: '0.96rem',
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              margin: '0 auto 2rem',
              lineHeight: 1.6,
            }}
          >
            The KrishiVaani AI Chatbot provides personalized real-time farming intelligence, voice queries in Indian regional languages, and soil-tailored advice. Sign in or register your farmer account to start chatting.
          </p>

          {/* Feature Checklist */}
          <div
            style={{
              background: 'var(--bg-section)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.25rem 1.6rem',
              maxWidth: '480px',
              margin: '0 auto 2.25rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={18} color="var(--green-primary)" style={{ flexShrink: 0 }} />
              <span>Multilingual voice & text assistance (English, हिन्दी, ଓଡ଼ିଆ)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={18} color="var(--green-primary)" style={{ flexShrink: 0 }} />
              <span>Personalized answers matching your soil type & crop records</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={18} color="var(--green-primary)" style={{ flexShrink: 0 }} />
              <span>Real-time weather, MSP prices, and pest diagnosis</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
            }}
          >
            <button
              className="btn btn-primary btn-lg"
              onClick={() => openAuth('register')}
              style={{
                padding: '0.85rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                boxShadow: '0 6px 20px var(--green-glow)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={18} />
              <span>Register Farmer Profile</span>
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => openAuth('login')}
              style={{
                padding: '0.85rem 1.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                background: 'var(--bg-surface-glass)',
                border: '1.5px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Free for all Indian farmers · Quick 30-second mobile sign-up
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Quick Questions</div>
            {QUICK_PROMPTS.map(({ icon: Icon, text, label }) => (
              <button
                key={label}
                onClick={() => send(text)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  width: '100%', padding: '0.6rem 0.75rem',
                  background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', textAlign: 'left', marginBottom: '0.35rem',
                  transition: 'background 0.2s',
                  color: 'var(--text-secondary)', fontSize: '0.82rem',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--green-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon size={15} color="var(--green-primary)" style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="card card-green" style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--green-primary)', marginBottom: '0.5rem' }}>AI Capabilities</div>
            {['Crop recommendations', 'Weather advisories', 'MSP price lookup', 'Disease diagnosis', 'Soil guidance', 'Yield forecasting'].map(c => (
              <div key={c} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--green-primary)' }}>✓</span> {c}
              </div>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div
          className="card-glass"
          style={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '620px',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-glass)',
          }}
        >
          {/* Header with Language Change Function */}
          <div
            style={{
              padding: '0.85rem 1.35rem',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--green-bg)',
              backdropFilter: 'blur(16px)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 4px 14px var(--green-glow)',
                }}
              >
                <Bot size={20} color="#fff" />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: 10,
                    height: 10,
                    background: '#22c55e',
                    border: '2px solid var(--bg-main)',
                    borderRadius: '50%',
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>KrishiVaani AI Farming Guide</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--green-primary)', fontWeight: 600 }}>● Online — Multilingual AI</div>
              </div>
            </div>

            {/* Language Change Function on Top of Chat Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--bg-surface-glass)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div style={{ padding: '0 0.35rem 0 0.5rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                <Globe size={14} />
              </div>
              {CHAT_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: chatLang === l.code ? 'var(--green-primary)' : 'transparent',
                    color: chatLang === l.code ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: chatLang === l.code ? '0 2px 8px var(--green-glow)' : 'none',
                  }}
                  title={`Switch conversation to ${l.label}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              backgroundImage: `linear-gradient(180deg, var(--bg-main) 0%, rgba(7, 19, 15, 0.82) 100%), url("${AGRI_IMAGES.aiAssistantBg}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: msg.role === 'user' ? 'var(--green-primary)' : 'var(--bg-surface-glass)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {msg.role === 'user' ? <User size={16} color="#fff" /> : <Bot size={17} color="var(--green-primary)" />}
                </div>
                <div style={{ maxWidth: '78%' }}>
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      background: msg.role === 'user' ? 'var(--green-primary)' : 'var(--bg-card)',
                      color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border-glass)',
                      fontSize: '0.92rem',
                      lineHeight: 1.65,
                      boxShadow: 'var(--shadow-sm)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {msg.text}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.3rem',
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                      paddingInline: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: '0.6rem',
                    }}
                  >
                    <span>{fmt(msg.ts)}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speakMessage(msg.id, msg.text)}
                        title={playingId === msg.id ? "Stop voice narration" : "Listen to answer"}
                        style={{
                          background: playingId === msg.id ? 'var(--green-primary)' : 'var(--bg-surface-glass)',
                          color: playingId === msg.id ? '#ffffff' : 'var(--text-secondary)',
                          border: '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          padding: '0.2rem 0.55rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          borderRadius: 'var(--radius-pill)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {playingId === msg.id ? <Square size={11} fill="#fff" /> : <Volume2 size={13} />}
                        <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                          {playingId === msg.id ? 'Stop Voice' : 'Listen'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--bg-surface-glass)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={17} color="var(--green-primary)" />
                </div>
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderRadius: '4px 18px 18px 18px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--green-primary)',
                        animation: `bounce 1.2s ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: '0.9rem 1.25rem',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'center',
              background: 'var(--bg-section)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <input
              className="form-input"
              style={{
                flex: 1,
                borderRadius: 'var(--radius-pill)',
                padding: '0.75rem 1.25rem',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border-glass)',
                color: 'var(--text-primary)',
              }}
              placeholder={chatLang === 'hi' ? 'अपना सवाल लिखें...' : chatLang === 'or' ? 'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲିଖନ୍ତୁ...' : 'Ask a farming question...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />

            <button
              onClick={toggleMic}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                border: '1.5px solid var(--border-glass)',
                background: listening ? '#ef4444' : 'var(--green-bg)',
                color: listening ? '#fff' : 'var(--green-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              title={listening ? "Stop voice input" : "Speak query with mic"}
            >
              {listening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>

            <button
              onClick={() => send()}
              className="btn btn-primary"
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                padding: 0,
                flexShrink: 0,
                boxShadow: '0 4px 14px var(--green-glow)',
              }}
              disabled={loading || !input.trim()}
              title="Send question"
            >
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @media (max-width: 720px) {
          .chat-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
