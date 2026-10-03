import React, { useState, useEffect } from 'react';
import {
  Sprout, Activity, MessageSquare, CloudSun,
  Leaf, Satellite, LineChart, Menu, X, ChevronRight,
  User, FlaskConical, CalendarDays, RefreshCw, Sparkles, Shield
} from 'lucide-react';

const NAV_LINKS = [
  { id: 'dashboard',  label: 'Overview & Dashboard',   desc: 'Platform home & live key metrics', icon: Activity, tag: 'Home' },
  { id: 'crop-rec',   label: 'Crop Recommendation',    desc: 'NPK & climate AI prediction',      icon: Sprout,   tag: 'AI/ML' },
  { id: 'yield',      label: 'Yield & MSP Forecast',   desc: 'Harvest & government pricing',     icon: LineChart, tag: 'Market' },
  { id: 'fertilizer', label: 'Fertilizer Advisor',     desc: 'ICAR Urea, DAP & MOP doses',       icon: FlaskConical, tag: 'ICAR' },
  { id: 'disease',    label: 'Leaf Disease Scanner',   desc: 'Computer vision leaf diagnostics', icon: Leaf,     tag: 'Vision' },
  { id: 'weather',    label: 'Weather & Disaster Alert',desc: '24h forecast & severe weather',   icon: CloudSun, tag: 'Live' },
  { id: 'satellite',  label: 'NDVI Satellite Map',     desc: 'Sentinel-2 canopy greenness',      icon: Satellite,tag: 'Geo' },
  { id: 'calendar',   label: 'Crop Calendar',          desc: 'State-wise sowing & harvest time', icon: CalendarDays, tag: 'Schedule' },
  { id: 'rotation',   label: 'Crop Rotation Planner',  desc: 'Soil nutrient balancing sequences',icon: RefreshCw, tag: 'Soil' },
  { id: 'profile',    label: 'My Farm & Soil Records', desc: 'Digital land & soil test cards',   icon: User,     tag: 'Farm ID' },
  { id: 'chatbot',    label: 'AI Farming Assistant',   desc: 'Multilingual chat in Hindi & Odia',icon: MessageSquare, tag: 'Voice/Chat' },
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

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [menuOpen]);

  const handleSelect = (id) => {
    setActiveTab(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: scrolled ? '0 2px 20px rgba(28,43,26,0.10)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* ── Brand Logo & Title ── */}
          <div
            onClick={() => handleSelect('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: 42, height: 42,
              background: 'var(--green-primary)',
              borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(61,122,61,0.35)',
              transition: 'transform 0.2s ease',
            }}>
              <Sprout size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                KrishiVaani
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
                AI Smart Farming
              </div>
            </div>
          </div>

          {/* ── Right Controls: Language, Quick CTA & 3-Bar Menu ── */}
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
                  padding: '0.42rem 1.85rem 0.42rem 0.9rem',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%233d7a3d' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.65rem center',
                }}
              >
                {LANGS.map(l => (
                  <option key={l.code} value={l.code}>{l.label} — {l.full}</option>
                ))}
              </select>
            </div>

            {/* Quick Action Button */}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSelect('crop-rec')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.95rem' }}
            >
              <Sparkles size={14} /> Get Started
            </button>

            {/* ── 3-Bar Hamburger Menu Button ── */}
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              title="All Features Menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color)',
                background: menuOpen ? 'var(--green-bg)' : '#ffffff',
                color: menuOpen ? 'var(--green-primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--green-pale)';
                e.currentTarget.style.background = 'var(--green-bg)';
                e.currentTarget.style.color = 'var(--green-primary)';
              }}
              onMouseLeave={e => {
                if (!menuOpen) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Right-Side Slide-out Navigation Drawer Overlay ── */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(28, 43, 26, 0.45)',
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* ── Drawer Panel ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '380px',
          background: '#ffffff',
          zIndex: 999,
          boxShadow: '-8px 0 35px rgba(28,43,26,0.18)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-section)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 34, height: 34,
              background: 'var(--green-primary)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sprout size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                KrishiVaani Menu
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Smart Farming Suite
              </div>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '0.35rem 0.6rem 0.2rem' }}>
            Navigation & Tools
          </div>

          {NAV_LINKS.map(({ id, label, desc, icon: Icon, tag }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1.5px solid var(--green-primary)' : '1px solid transparent',
                  background: isActive ? 'var(--green-bg)' : 'transparent',
                  color: isActive ? 'var(--green-primary)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-section)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: isActive ? 'var(--green-primary)' : 'var(--bg-section)',
                  color: isActive ? '#ffffff' : 'var(--green-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}>
                  <Icon size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ fontWeight: isActive ? 700 : 600, fontSize: '0.92rem', color: isActive ? 'var(--green-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </div>
                    {tag && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: isActive ? 'rgba(61,122,61,0.15)' : 'rgba(0,0,0,0.05)',
                        color: isActive ? 'var(--green-primary)' : 'var(--text-muted)',
                      }}>
                        {tag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {desc}
                  </div>
                </div>

                <ChevronRight size={16} color={isActive ? 'var(--green-primary)' : '#c0c8b8'} />
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-section)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Language Preference:</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => setCurrentLang(l.code)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    border: currentLang === l.code ? '1.5px solid var(--green-primary)' : '1px solid var(--border-color)',
                    background: currentLang === l.code ? 'var(--green-primary)' : '#ffffff',
                    color: currentLang === l.code ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            KrishiVaani · AI-Powered Farming Suite for Bharat 🇮🇳
          </div>
        </div>
      </div>
    </>
  );
}
