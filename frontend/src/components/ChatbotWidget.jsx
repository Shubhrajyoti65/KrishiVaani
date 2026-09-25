import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, Volume2, Bot, User, Sparkles, Loader2, Wrench } from 'lucide-react';

export default function ChatbotWidget({ currentLang }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! I am **KrishiVaani**, your personal AI Smart Farming Assistant. How can I help your farm today?\n\nTry asking:\n• "What crop should I grow in Cuttack with high rainfall?"\n• "What is the weather forecast and heatwave alerts?"\n• "Predict yield and revenue for 5 acres of Rice"',
      tools: []
    }
  ]);

  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setInputMsg('');

    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          district: 'Cuttack',
          state: 'Odisha',
          language: currentLang
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            tools: data.tools_invoked || []
          }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an error connecting to KrishiVaani backend servers. Please try again.',
          tools: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSimulate = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setInputMsg('What is the weather forecast and recommended crop for my farm?');
    }, 2000);
  };

  const handleTextToSpeech = async (text) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/voice-language/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 200), language: currentLang })
      });
      if (res.ok) {
        const data = await res.json();
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        audio.play().catch((e) => console.log('Audio playback:', e));
      }
    } catch (e) {
      console.log('TTS error:', e);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'var(--gradient-emerald)', padding: '0.45rem', borderRadius: '10px' }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>KrishiVaani Voice & Chat Assistant</h3>
            <p style={{ fontSize: '0.75rem', color: '#4ade80', margin: 0 }}>● Online (LangChain Tool-Calling Agent)</p>
          </div>
        </div>

        <button className="btn-secondary" onClick={handleVoiceSimulate} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          <Mic size={15} color={recording ? '#f87171' : 'var(--accent-primary)'} />
          {recording ? 'Listening...' : 'Voice Input'}
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.sender === 'bot' && (
              <div style={{ background: 'var(--gradient-emerald)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color="#fff" />
              </div>
            )}

            <div
              style={{
                maxWidth: '80%',
                background: msg.sender === 'user' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(30, 41, 59, 0.9)',
                border: `1px solid ${msg.sender === 'user' ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-color)'}`,
                padding: '0.85rem 1.1rem',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: '0.9rem',
                whiteSpace: 'pre-line'
              }}
            >
              {/* Tool Traces Badges */}
              {msg.tools && msg.tools.length > 0 && (
                <div style={{ marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {msg.tools.map((t, tidx) => (
                    <span key={tidx} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      <Wrench size={10} /> Executed: {t.tool_name}
                    </span>
                  ))}
                </div>
              )}

              <div>{msg.text}</div>

              {msg.sender === 'bot' && (
                <button
                  onClick={() => handleTextToSpeech(msg.text)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                >
                  <Volume2 size={14} color="#60a5fa" /> Listen Audio
                </button>
              )}
            </div>

            {msg.sender === 'user' && (
              <div style={{ background: 'rgba(59, 130, 246, 0.3)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} color="#fff" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Loader2 size={18} className="animate-spin" color="var(--accent-primary)" />
            KrishiVaani Agent is processing tools...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)' }}>
        <input
          type="text"
          className="form-input"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask KrishiVaani about crops, weather, yield, disease..."
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary" disabled={loading || !inputMsg.trim()} style={{ padding: '0.7rem 1.2rem' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
