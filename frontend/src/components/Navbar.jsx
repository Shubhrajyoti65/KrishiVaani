import React, { useState, useEffect } from 'react';
import {
  Sprout, Globe, Activity, MessageSquare, CloudSun,
  Leaf, Satellite, LineChart, Menu, X, ChevronDown
} from 'lucide-react';

const NAV_LINKS = [
  { id: 'dashboard', label: 'Overview', icon: Activity },
  { id: 'crop-rec',  label: 'Crop Guide', icon: Sprout },
  { id: 'yield',     label: 'Yield & MSP', icon: LineChart },
  { id: 'disease',   label: 'Leaf Scanner', icon: Leaf },
  { id: 'weather',   label: 'Weather', icon: CloudSun },
  { id: 'satellite', label: 'NDVI Map', icon: Satellite },
  { id: 'chatbot',   label: 'AI Chat', icon: MessageSquare },
];

const LANGS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'हि', full: 'हिन्दी' },
  { code: 'or', label: 'ଓ',  full: 'ଓଡ଼ିଆ' },
];

export default function Navbar({ activeTab, setActiveTab, currentLang, setCurrentLang }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: scrolled ? '0 2px 20px rgba(28,43,26,0.10)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

        {/* ── Brand ── */}
        <div
          onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            width: 40, height: 40,
            background: 'var(--green-primary)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(61,122,61,0.4)',
          }}>
            <Sprout size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1 }}>
              KrishiVaani
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
              AI Smart Farming
            </div>
          </div>
        </div>

        {/* ── Desktop Nav ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center', flexWrap: 'nowrap' }}
          className="desktop-nav">
          {NAV_LINKS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: active ? 'var(--green-primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--green-bg)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* ── Right Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Language selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={currentLang}
              onChange={e => setCurrentLang(e.target.value)}
              style={{
                background: 'var(--green-bg)',
                border: '1.5px solid var(--green-pale)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--green-primary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                padding: '0.4rem 1.8rem 0.4rem 0.85rem',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%233d7a3d' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.6rem center',
              }}
            >
              {LANGS.map(l => (
                <option key={l.code} value={l.code}>{l.label} — {l.full}</option>
              ))}
            </select>
          </div>

          {/* Get Started CTA */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('crop-rec')}
          >
            <Sprout size={14} /> Get Started
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.4rem' }}
            id="mobile-menu-btn"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div style={{
          background: '#ffffff',
          borderTop: '1px solid var(--border-color)',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {NAV_LINKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === id ? 'var(--green-bg)' : 'transparent',
                color: activeTab === id ? 'var(--green-primary)' : 'var(--text-primary)',
                fontWeight: activeTab === id ? 600 : 400,
                fontSize: '0.95rem',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
