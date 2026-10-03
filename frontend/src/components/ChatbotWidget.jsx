import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, MicOff, Bot, User, Loader, Sprout, CloudSun, TrendingUp, Satellite, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

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

export default function ChatbotWidget({ currentLang = 'en', onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: LANG_GREET[currentLang] || LANG_GREET.en, ts: new Date() }
  ]);
  const [input,      setInput]     = useState('');
  const [loading,    setLoading]   = useState(false);
  const [listening,  setListening] = useState(false);
  const [playingId,  setPlayingId] = useState(null);
  const bottomRef = useRef(null);
  const audioRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const speakMessage = async (msgId, text) => {
    if (playingId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    try {
      setPlayingId(msgId);
      const res = await fetch('http://localhost:8000/api/v1/voice-language/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 350),
          language: currentLang,
          gender: 'female'
        })
      });
      if (!res.ok) throw new Error('TTS failed');
      const data = await res.json();
      if (data.audio_base64) {
        if (audioRef.current) audioRef.current.pause();
        const snd = new Audio(`data:${data.audio_format || 'audio/mp3'};base64,${data.audio_base64}`);
        audioRef.current = snd;
        snd.onended = () => setPlayingId(null);
        snd.onerror = () => setPlayingId(null);
        await snd.play();
      } else {
        setPlayingId(null);
      }
    } catch (e) {
      console.warn("Voice playback error:", e);
      setPlayingId(null);
    }
  };

  const send = async (text = input.trim()) => {
    if (!text || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language: currentLang }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: data.response || data.reply, ts: new Date() }]);
    } catch {
      // Intelligent fallback responses
      const lower = text.toLowerCase();
      let reply =
        lower.includes('crop') || lower.includes('plant') || lower.includes('फसल') ?
          '🌾 Based on your query, I recommend testing your soil NPK before selecting crops. You can use our Crop Recommendation tool for a detailed analysis. Common high-yield crops for good soil are wheat (Rabi), rice (Kharif), and maize.' :
        lower.includes('weather') || lower.includes('rain') || lower.includes('मौसम') ?
          '☁️ For live weather data, please use our Weather & Alerts tab. The India Meteorological Department (IMD) predicts normal monsoon this season. Check daily for your district advisory.' :
        lower.includes('msp') || lower.includes('price') || lower.includes('मूल्य') ?
          '💰 Key MSP 2024-25: Wheat ₹2,275/q, Rice ₹2,183/q, Mustard ₹5,650/q, Cotton ₹6,620/q, Groundnut ₹6,377/q. Sell to FCI or APMC for guaranteed MSP.' :
        lower.includes('ndvi') || lower.includes('satellite') ?
          '🛰️ NDVI (Normalized Difference Vegetation Index) ranges from 0 to 1. Values above 0.6 indicate healthy crops. Use our NDVI Satellite tool to monitor your field weekly using Sentinel-2 imagery.' :
        lower.includes('disease') || lower.includes('leaf') || lower.includes('रोग') ?
          '🍃 Common crop diseases: Leaf Blight (use Mancozeb), Rust (use Propiconazole), Powdery Mildew (Sulfur). For organic treatment, neem oil spray at 5ml/L is very effective. Upload a leaf photo in our Disease Scanner for AI diagnosis.' :
          '🤖 I can help with crop advice, weather info, MSP prices, disease identification, and satellite field monitoring. Try asking me: "Best crop for sandy soil in Rajasthan" or "Wheat disease symptoms".';

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply, ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported. Please use Chrome browser.');
      return;
    }
    if (listening) { setListening(false); return; }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'or' ? 'or-IN' : 'en-IN';
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const fmt = (ts) => ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1.5px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(28,43,26,0.08)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--green-bg)';
                e.currentTarget.style.color = 'var(--green-primary)';
                e.currentTarget.style.borderColor = 'var(--green-pale)';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--green-primary)',
          }}>
            LangChain AI
          </span>
        </div>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>AI Farming Assistant</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Ask any farming question in English, Hindi, or Odia. Powered by LangChain with real-time tool calling.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Sidebar */}
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
          {/* Header */}
          <div
            style={{
              padding: '1.1rem 1.35rem',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--green-bg)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 4px 14px var(--green-glow)',
                }}
              >
                <Bot size={22} color="#fff" />
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
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>KrishiVaani AI Farming Guide</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--green-primary)', fontWeight: 600 }}>● Online — Sarvam AI Voice & Multilingual RAG</div>
              </div>
            </div>

            <span
              className="badge"
              style={{
                background: 'var(--bg-surface-glass)',
                border: '1px solid var(--border-glass)',
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
              }}
            >
              LangChain Agent
            </span>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              background: 'var(--bg-main)',
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
                        title={playingId === msg.id ? "Stop voice" : "Listen in voice (Sarvam AI)"}
                        style={{
                          background: 'var(--bg-surface-glass)',
                          border: '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          padding: '0.15rem 0.45rem',
                          color: playingId === msg.id ? 'var(--green-primary)' : 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          borderRadius: 'var(--radius-pill)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {playingId === msg.id ? <VolumeX size={13} color="var(--green-primary)" /> : <Volume2 size={13} />}
                        <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>{playingId === msg.id ? 'Playing…' : 'Listen'}</span>
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
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              gap: '0.75rem',
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
              placeholder={currentLang === 'hi' ? 'अपना सवाल लिखें...' : currentLang === 'or' ? 'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲିଖନ୍ତୁ...' : 'Ask a farming question...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              onClick={toggleMic}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid var(--border-glass)',
                background: listening ? '#ef4444' : 'var(--green-bg)',
                color: listening ? '#fff' : 'var(--green-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              title={listening ? "Stop voice input" : "Speak your query"}
            >
              {listening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>
            <button
              onClick={() => send()}
              className="btn btn-primary"
              style={{
                width: 44,
                height: 44,
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
