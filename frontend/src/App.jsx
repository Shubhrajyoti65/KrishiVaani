import React, { useState } from 'react';
import Navbar from './components/Navbar';
import WeatherWidget from './components/WeatherWidget';
import CropRecommendationCard from './components/CropRecommendationCard';
import YieldCalculator from './components/YieldCalculator';
import DiseaseScanner from './components/DiseaseScanner';
import SatelliteTracker from './components/SatelliteTracker';
import ChatbotWidget from './components/ChatbotWidget';
import {
  Sprout, LineChart, Leaf, CloudSun, Satellite, MessageSquare,
  ArrowRight, Star, Users, TrendingUp, Award, ChevronRight, Zap
} from 'lucide-react';

/* ── Feature cards for the dashboard grid ── */
const FEATURES = [
  {
    id: 'crop-rec', icon: Sprout, color: 'green',
    title: 'Crop Recommendation',
    desc: 'Soil NPK & climate-matched crop prediction using Random Forest ML',
    stat: '22 crops', statLabel: 'supported',
  },
  {
    id: 'yield', icon: LineChart, color: 'gold',
    title: 'Yield & MSP Revenue',
    desc: 'Harvest yield forecast with Indian government MSP price estimates',
    stat: '₹ MSP', statLabel: 'live prices',
  },
  {
    id: 'disease', icon: Leaf, color: 'brown',
    title: 'Leaf Disease Scanner',
    desc: 'Computer Vision photo upload with organic cure remedies in your language',
    stat: '38+', statLabel: 'diseases',
  },
  {
    id: 'weather', icon: CloudSun, color: 'blue',
    title: 'Weather & Alerts',
    desc: 'Real-time weather advisory with heatwave, frost & flood early warnings',
    stat: '24 hr', statLabel: 'forecast',
  },
  {
    id: 'satellite', icon: Satellite, color: 'dark',
    title: 'Satellite NDVI Health',
    desc: 'Sentinel-2 vegetation canopy health index & crop water stress tracking',
    stat: 'NDVI', statLabel: 'live index',
  },
  {
    id: 'chatbot', icon: MessageSquare, color: 'purple',
    title: 'AI Farming Assistant',
    desc: 'LangChain-powered chatbot answering farming queries in Hindi, Odia & English',
    stat: '3 lang', statLabel: 'supported',
  },
];

const ICON_COLOR_MAP = {
  green:  { bg: 'var(--green-bg)',   color: 'var(--green-primary)', border: 'var(--green-pale)' },
  gold:   { bg: 'var(--gold-pale)',  color: '#9a6e0a',               border: '#e8d080' },
  brown:  { bg: '#f5ece2',           color: 'var(--brown)',          border: '#ddc8a8' },
  blue:   { bg: '#e8f0fa',           color: '#2563eb',               border: '#c8d8f0' },
  dark:   { bg: '#e8ede6',           color: 'var(--bg-dark)',        border: '#c8d8c0' },
  purple: { bg: '#f0eaf8',           color: '#7c3aed',               border: '#d8c8f0' },
};

/* ── Stats bar ── */
const STATS = [
  { icon: Users,      value: '2.8M+', label: 'Farmers Served' },
  { icon: Star,       value: '4.9/5', label: 'Satisfaction Score' },
  { icon: TrendingUp, value: '38%',   label: 'Avg Yield Increase' },
  { icon: Award,      value: 'Govt',  label: 'Bhashini Certified' },
];

export default function App() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [currentLang, setCurrentLang] = useState('en');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
      />

      <main style={{ flex: 1 }}>
        {/* ══════════════════════════════════════
             DASHBOARD / LANDING VIEW
        ══════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* ── HERO SECTION ── */}
            <section style={{
              background: 'linear-gradient(160deg, #f0f6eb 0%, #e8f0e0 40%, #f5f2eb 100%)',
              borderBottom: '1px solid var(--border-color)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Decorative blob */}
              <div style={{
                position: 'absolute', top: '-80px', right: '-80px',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(61,122,61,0.12) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: '-60px', left: '10%',
                width: '300px', height: '300px',
                background: 'radial-gradient(circle, rgba(212,166,42,0.10) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
              }} />

              <div className="container" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                gap: '3rem',
                alignItems: 'center',
                padding: '5rem 1.5rem 4rem',
              }}>
                {/* Left: copy */}
                <div className="animate-fade-in-up">
                  <span className="badge badge-green" style={{ marginBottom: '1.25rem' }}>
                    <Zap size={12} /> AI/ML Powered — Built for Bharat 🇮🇳
                  </span>

                  <h1 className="heading-xl" style={{ marginBottom: '1.25rem' }}>
                    Smart Farming <br />
                    <span style={{ color: 'var(--green-primary)' }}>for Every</span>{' '}
                    <span style={{
                      background: 'linear-gradient(135deg, #d4a62a, #a07040)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>Indian Farmer</span>
                  </h1>

                  <p style={{
                    fontSize: '1.05rem', color: 'var(--text-secondary)',
                    marginBottom: '2rem', lineHeight: 1.75, maxWidth: '440px',
                  }}>
                    Get AI-powered crop recommendations, yield forecasts, satellite NDVI
                    monitoring, leaf disease cures, and weather alerts — all in your language.
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => setActiveTab('crop-rec')}
                    >
                      <Sprout size={20} /> Start Crop Guide
                    </button>
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={() => setActiveTab('chatbot')}
                    >
                      Chat with AI <ArrowRight size={18} />
                    </button>
                  </div>

                  {/* Trust badges */}
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                    {['Free to Use', 'Hindi & Odia', 'No Internet Required*'].map(t => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-primary)' }} />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: illustration */}
                <div className="animate-float" style={{ position: 'relative' }}>
                  {/* Decorative ring */}
                  <div style={{
                    position: 'absolute', inset: '-12px',
                    borderRadius: 'var(--radius-xl)',
                    border: '2px dashed rgba(61,122,61,0.2)',
                    pointerEvents: 'none',
                  }} />
                  <img
                    src="/hero_farm.jpg"
                    alt="Indian farmer with lush fields"
                    style={{
                      width: '100%',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: '0 20px 60px rgba(28,43,26,0.20)',
                      border: '4px solid rgba(255,255,255,0.8)',
                    }}
                  />
                  {/* Floating stat cards */}
                  <div style={{
                    position: 'absolute', bottom: '-18px', left: '-20px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1.1rem',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                  }}>
                    <div style={{ width: 36, height: 36, background: 'var(--green-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={18} color="var(--green-primary)" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--green-primary)' }}>+38%</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg Yield Boost</div>
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', top: '-18px', right: '-16px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1.1rem',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                  }}>
                    <div style={{ width: 36, height: 36, background: 'var(--gold-pale)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={18} color="var(--gold)" fill="var(--gold)" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: '#9a6e0a' }}>4.9★</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Farmer Rating</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsive: stack on mobile */}
              <style>{`
                @media (max-width: 780px) {
                  .hero-grid { grid-template-columns: 1fr !important; }
                }
              `}</style>
            </section>

            {/* ── STATS BAR ── */}
            <section style={{ background: 'var(--bg-dark)', padding: '1.5rem 0' }}>
              <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {STATS.map(({ icon: Icon, value, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.5rem 1rem' }}>
                    <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color="#d4e8c2" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#d4e8c2' }}>{value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FEATURES GRID ── */}
            <section style={{ padding: '5rem 0 4rem', background: 'var(--bg-main)' }}>
              <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <span className="section-label" style={{ justifyContent: 'center' }}>Our Features</span>
                  <h2 className="heading-lg" style={{ marginBottom: '0.75rem' }}>
                    Everything a Farmer Needs,<br />in One Platform
                  </h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto', fontSize: '1rem' }}>
                    Powered by machine learning, satellite imagery, and government data — available in your native language.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                  {FEATURES.map(({ id, icon: Icon, color, title, desc, stat, statLabel }, i) => {
                    const c = ICON_COLOR_MAP[color];
                    return (
                      <div
                        key={id}
                        className="card animate-fade-in-up"
                        style={{ cursor: 'pointer', animationDelay: `${i * 0.08}s`, opacity: 0 }}
                        onClick={() => setActiveTab(id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ width: 52, height: 52, borderRadius: '12px', background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={24} color={c.color} />
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: c.color }}>{stat}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{statLabel}</div>
                          </div>
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.25rem' }}>{desc}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: c.color }}>
                          Open Tool <ChevronRight size={16} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── WEATHER QUICK OVERVIEW ── */}
            <section style={{ padding: '0 0 4rem', background: 'var(--bg-section)' }}>
              <div className="container">
                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="section-label">Live Data</span>
                  <h2 className="heading-md">Weather Advisory</h2>
                </div>
                <WeatherWidget compact />
              </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section style={{
              background: 'var(--bg-dark)',
              padding: '4rem 0',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '-100px', right: '-100px',
                width: '350px', height: '350px',
                background: 'radial-gradient(circle, rgba(61,122,61,0.3) 0%, transparent 70%)',
                borderRadius: '50%',
              }} />
              <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#d4e8c2', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '1.25rem' }}>
                  🌾 Get Started Today — It's Free
                </span>
                <h2 className="heading-lg" style={{ color: '#ffffff', marginBottom: '1rem' }}>
                  Grow Smarter with<br />
                  <span style={{ color: '#d4e8c2' }}>KrishiVaani AI</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '2rem', maxWidth: '440px', margin: '0 auto 2rem', fontSize: '1rem' }}>
                  Join millions of Indian farmers already using AI precision agriculture to boost yields and income.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-gold btn-lg" onClick={() => setActiveTab('crop-rec')}>
                    <Sprout size={20} /> Try Crop Recommendation
                  </button>
                  <button
                    className="btn btn-lg"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}
                    onClick={() => setActiveTab('chatbot')}
                  >
                    <MessageSquare size={18} /> Talk to AI Assistant
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════
             INDIVIDUAL FEATURE TABS
        ══════════════════════════════════════ */}
        {activeTab !== 'dashboard' && (
          <div style={{ padding: '2.5rem 0 4rem' }}>
            <div className="container">
              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green-primary)', fontWeight: 600, fontSize: '0.875rem', padding: 0 }}
                >
                  ← Back to Dashboard
                </button>
              </div>

              {activeTab === 'crop-rec'  && <CropRecommendationCard />}
              {activeTab === 'yield'     && <YieldCalculator />}
              {activeTab === 'disease'   && <DiseaseScanner />}
              {activeTab === 'weather'   && <WeatherWidget />}
              {activeTab === 'satellite' && <SatelliteTracker />}
              {activeTab === 'chatbot'   && <ChatbotWidget currentLang={currentLang} />}
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        background: 'var(--bg-dark)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '2.5rem 0 1.5rem',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.875rem',
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 34, height: 34, background: 'var(--green-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sprout size={18} color="#fff" />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: '#d4e8c2' }}>KrishiVaani</span>
              </div>
              <p style={{ lineHeight: 1.7, maxWidth: '220px' }}>AI-powered precision agriculture platform built for India's 140 million farmers.</p>
            </div>
            <div>
              <div style={{ color: '#d4e8c2', fontWeight: 600, marginBottom: '0.75rem' }}>Features</div>
              {['Crop Recommendation', 'Yield Calculator', 'Leaf Disease Scanner', 'Satellite NDVI', 'Weather Alerts'].map(f => (
                <div key={f} style={{ marginBottom: '0.4rem' }}>{f}</div>
              ))}
            </div>
            <div>
              <div style={{ color: '#d4e8c2', fontWeight: 600, marginBottom: '0.75rem' }}>Technology</div>
              {['FastAPI Backend', 'React Frontend', 'MongoDB Database', 'LangChain AI', 'Bhashini Voice'].map(t => (
                <div key={t} style={{ marginBottom: '0.4rem' }}>{t}</div>
              ))}
            </div>
            <div>
              <div style={{ color: '#d4e8c2', fontWeight: 600, marginBottom: '0.75rem' }}>Languages</div>
              {['English', 'हिन्दी (Hindi)', 'ଓଡ଼ିଆ (Odia)'].map(l => (
                <div key={l} style={{ marginBottom: '0.4rem' }}>{l}</div>
              ))}
              <div style={{ marginTop: '1rem', padding: '0.5rem 0.85rem', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', display: 'inline-block', fontSize: '0.78rem', color: '#a0c890' }}>
                🇮🇳 Made for Bharat
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span>© 2025 KrishiVaani — AI Smart Farming Platform</span>
            <span>Built with FastAPI · React · MongoDB · Scikit-Learn · Bhashini · Sentinel-2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
