import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import WeatherWidget from './components/WeatherWidget';
import CropRecommendationCard from './components/CropRecommendationCard';
import YieldCalculator from './components/YieldCalculator';
import DiseaseScanner from './components/DiseaseScanner';
import SatelliteTracker from './components/SatelliteTracker';
import ChatbotWidget from './components/ChatbotWidget';
import FertilizerAdvisor from './components/FertilizerAdvisor';
import CropCalendar from './components/CropCalendar';
import CropRotation from './components/CropRotation';
import FarmerProfileManager from './components/FarmerProfileManager';
import AuthModal from './components/AuthModal';
import AboutUs from './components/AboutUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import { AGRI_IMAGES, getHeroOverlay, getBannerOverlay } from './data/agriImages';
import {
  Sprout, LineChart, Leaf, CloudSun, Satellite, MessageSquare,
  FlaskConical, CalendarDays, RefreshCw, User,
  ArrowRight, Star, Users, TrendingUp, Award, ChevronRight,
  ShieldCheck, CheckCircle2, Sparkles, Cpu, Mail
} from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function ToolSegment({ children }) {
  return (
    <div className="tool-segment-wrapper">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Havens-Inspired Platform Capabilities with Curated Agricultural Photography ── */
const FEATURES = [
  {
    id: 'crop-rec',
    path: '/crop-recommendation',
    icon: Sprout,
    tag: 'AI/ML Model',
    title: 'Crop Recommendation',
    desc: 'Soil NPK, pH & climate-matched crop prediction using Random Forest ML calibrated for Indian soils.',
    stat: '22 Crops',
    statLabel: 'AI Supported',
    accent: 'var(--green-primary)',
    image: AGRI_IMAGES.greenPaddy,
  },
  {
    id: 'yield',
    path: '/yield-prediction',
    icon: LineChart,
    tag: 'Market & Govt MSP',
    title: 'Yield & MSP Revenue',
    desc: 'Harvest yield forecast with live Indian government Minimum Support Price (MSP) profit estimation.',
    stat: '₹ MSP',
    statLabel: 'Live Pricing',
    accent: 'var(--gold)',
    image: AGRI_IMAGES.harvestGrain,
  },
  {
    id: 'fertilizer',
    path: '/fertilizer-advisor',
    icon: FlaskConical,
    tag: 'ICAR Agronomy',
    title: 'Fertilizer & Soil Doctor',
    desc: 'ICAR-standard Urea, DAP, and MOP dose optimization with nutrient deficiency visual diagnosis.',
    stat: '100% ICAR',
    statLabel: 'Standards',
    accent: '#d97706',
    image: AGRI_IMAGES.organicSoil,
  },
  {
    id: 'disease',
    path: '/disease-scanner',
    icon: Leaf,
    tag: 'Computer Vision',
    title: 'Leaf Disease Scanner',
    desc: 'Instant leaf photo diagnosis identifying 38+ plant pathologies with verified organic & chemical remedies.',
    stat: '38+ Diseases',
    statLabel: 'Identified',
    accent: 'var(--green-primary)',
    image: AGRI_IMAGES.healthyLeaf,
  },
  {
    id: 'weather',
    path: '/weather-alerts',
    icon: CloudSun,
    tag: 'Hyperlocal IMD',
    title: 'Weather & Disaster Alerts',
    desc: '24-hour hyperlocal weather advisory with heatwave, frost, storm, and flood early warnings.',
    stat: '24-Hour',
    statLabel: 'Live Radar',
    accent: '#2563eb',
    image: AGRI_IMAGES.weatherLandscape,
  },
  {
    id: 'satellite',
    path: '/satellite-map',
    icon: Satellite,
    tag: 'Sentinel-2 Geo',
    title: 'Satellite NDVI Health',
    desc: 'Sentinel-2 multispectral vegetation canopy greenness index and field moisture stress telemetry.',
    stat: '10m Res',
    statLabel: 'Canopy Index',
    accent: '#059669',
    image: AGRI_IMAGES.agriTech,
  },
  {
    id: 'rotation',
    path: '/crop-rotation',
    icon: RefreshCw,
    tag: '3-Year Strategy',
    title: '3-Year Crop Planning',
    desc: 'Science-backed 3-year crop rotation sequencing to replenish soil nitrogen and disrupt pest life-cycles.',
    stat: 'N+P+K',
    statLabel: 'Regenerative',
    accent: '#8b5cf6',
    image: AGRI_IMAGES.rotationYear3,
  },
  {
    id: 'calendar',
    path: '/crop-calendar',
    icon: CalendarDays,
    tag: 'Agro-Climatic',
    title: 'Crop Sowing Calendar',
    desc: 'State-wise sowing, weeding, and harvesting windows synthesized from Agriculture Department bulletins.',
    stat: 'Pan-India',
    statLabel: 'Seasonal Map',
    accent: '#0284c7',
    image: AGRI_IMAGES.heroGoldenField,
  },

  {
    id: 'chatbot',
    path: '/ai-assistant',
    icon: MessageSquare,
    tag: 'LangChain + Voice',
    title: 'AI Farming Assistant',
    desc: 'Context-aware agricultural assistant answering farming queries in Hindi, Odia & English with voice output.',
    stat: 'Sarvam AI',
    statLabel: 'Voice Enabled',
    accent: '#9333ea',
    image: AGRI_IMAGES.aiAssistantBg,
  },
];

/* ── Live Key Metrics ── */
const STATS = [
  { icon: TrendingUp, value: '+38%', label: 'Average Harvest Yield Boost' },
  { icon: Users, value: '22+ crops', label: 'AI soil and climate Recommendation' },
  { icon: Star, value: '94.2%', label: 'Crop Recommendation Accuracy' },
  { icon: Award, value: '100% Free', label: 'Public Good for Bharat 🇮🇳' },
];

/* ── Landing Page / Dashboard Component ── */
function DashboardHome({ navigate, theme }) {
  return (
    <>
      {/* ── SECTION 1: AGRICULTURAL HERO SECTION ── */}
      <section
        style={{
          position: 'relative',
          backgroundImage: getHeroOverlay(theme, AGRI_IMAGES.pageBg, theme === 'dark' ? 0.90 : 0.82),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
          borderBottom: '1px solid var(--border-glass)',
          overflow: 'hidden',
          padding: '4.5rem 0 4rem',
        }}
      >
        {/* Subtle ambient lighting */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '5%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, var(--green-glow) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            filter: 'blur(40px)',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            filter: 'blur(50px)',
          }}
        />

        <div className="container" style={{ maxWidth: '1180px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2.5rem',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Headline, Bio & Primary CTAs */}
            <div className="animate-fade-in-up" style={{ zIndex: 2 }}>
              <h1
                className="heading-xl"
                style={{
                  marginBottom: '1.25rem',
                  letterSpacing: '-0.025em',
                }}
              >
                Rooted in People <br />
                <span style={{ color: 'var(--green-primary)' }}>Powered by Technology</span>{' '}

              </h1>

              <p
                style={{
                  fontSize: '1.1rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '2.25rem',
                  lineHeight: 1.75,
                  maxWidth: '520px',
                }}
              >
                Empowering Indian agriculture with machine learning crop intelligence,
                satellite vegetation monitoring, ICAR soil diagnosis, and multilingual
                voice guidance                    </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/crop-recommendation')}
                  style={{
                    boxShadow: '0 8px 24px var(--green-glow)',
                    padding: '0.95rem 2rem'
                  }}
                >
                  <Sprout size={20} />
                  <span>Start Crop Guide</span>
                </button>

                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate('/ai-assistant')}
                  style={{
                    background: 'var(--bg-surface-glass)',
                    backdropFilter: 'blur(16px)',
                    padding: '0.95rem 1.85rem'
                  }}
                >
                  <MessageSquare size={18} />
                  <span>Talk with AI</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Trust indicators */}
              <div
                style={{
                  display: 'flex',
                  gap: '2.5rem',
                  marginTop: '2.5rem',
                  flexWrap: 'wrap',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-glass)',
                }}
              >
                {[
                  { label: 'ICAR Formulations', icon: ShieldCheck },
                  { label: 'Multilingual Voice', icon: Sparkles },
                  { label: 'Sentinel-2 Telemetry', icon: Satellite },
                ].map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500
                    }}
                  >
                    <Icon size={16} color="var(--green-primary)" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Havens-Inspired Visual Floating Glass Showcase */}
            <div
              className="animate-float"
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'flex-start',
                zIndex: 2,
                width: '100%',
              }}
            >
              {/* Primary Agricultural Card Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '640px',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-glass)',
                  border: '2.5px solid var(--border-glass)',
                  background: 'var(--bg-surface-glass)',
                }}
              >
                <img
                  src="/hero_farm.png"
                  alt="KrishiVaani precision farm landscape"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/hero_farm.png';
                  }}
                  style={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '16 / 9',
                    objectFit: 'cover',
                    display: 'block',
                    filter: theme === 'dark' ? 'brightness(0.92) contrast(1.05)' : 'none',
                  }}
                />

                {/* Image Bottom Glass Overlay Strip */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(7, 19, 15, 0.90) 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(34, 197, 94, 0.28)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(110, 231, 183, 0.4)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    ● Live Connected
                  </span>
                </div>
              </div>

              {/* Floating Glass Widget 1: Real-time Agro Weather Card */}
              <div
                className="card-glass"
                style={{
                  position: 'absolute',
                  top: '-24px',
                  right: '-16px',
                  padding: '0.9rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  backdropFilter: 'blur(20px)',
                  zIndex: 3,
                  maxWidth: '220px',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'rgba(234, 179, 8, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CloudSun size={22} color="var(--gold)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      28°C
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--green-primary)', fontWeight: 600 }}>
                      Optimal
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    💧 64% RH · 12mm Rain
                  </div>
                </div>
              </div>

              {/* Floating Glass Widget 2: AI Recommended Crop Card */}
              <div
                className="card-glass"
                style={{
                  position: 'absolute',
                  bottom: '-24px',
                  left: '-20px',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  backdropFilter: 'blur(20px)',
                  zIndex: 3,
                  maxWidth: '260px',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: 'var(--green-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--green-pale)',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={22} color="var(--green-primary)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--green-primary)' }}>
                      +38% Yield
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Forecast
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    🌾 Basmati Rice · 94% Suitability
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR (Glassmorphic) ── */}
      <section
        style={{
          background: 'var(--bg-section)',
          borderBottom: '1px solid var(--border-glass)',
          padding: '1.75rem 0',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {STATS.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="card-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  padding: '0.9rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: 'var(--green-bg)',
                    border: '1px solid var(--green-pale)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} color="var(--green-primary)" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.1,
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.2rem' }}>
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CORE CAPABILITIES (Havens-Style Photography Glass Cards) ── */}
      <section style={{ padding: '5rem 0 4rem', background: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="section-label" style={{ justifyContent: 'center' }}>
              Agricultural Intelligence Suite
            </span>
            <h2 className="heading-lg" style={{ marginBottom: '0.85rem' }}>
              Everything a Progressive Farmer Needs, in One Place
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Precision agronomy powered by Machine Learning, Sentinel-2 satellite telemetry,
              and ICAR agricultural research data — tailored for Indian farms.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {FEATURES.map(({ id, path, icon: Icon, tag, title, desc, stat, statLabel, accent, image }, i) => (
              <div
                key={id}
                className="card-glass animate-fade-in-up"
                onClick={() => navigate(path)}
                style={{
                  cursor: 'pointer',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  animationDelay: `${i * 0.05}s`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = 'var(--green-pale)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                {/* Top Havens-Inspired Photographic Header with Glass Badge */}
                <div
                  style={{
                    height: '145px',
                    borderRadius: 'calc(var(--radius-md) - 2px)',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '1.15rem',
                  }}
                >
                  <img
                    src={image}
                    alt={title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(7, 19, 15, 0.78) 100%)',
                    }}
                  />
                  {/* Overlaid Icon Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.65rem',
                      left: '0.65rem',
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    }}
                  >
                    <Icon size={20} color={accent || 'var(--green-primary)'} />
                  </div>
                  {/* Overlaid Tag */}
                  <div style={{ position: 'absolute', top: '0.65rem', right: '0.65rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(7, 19, 15, 0.70)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#f0f7f3',
                        fontSize: '0.72rem',
                        backdropFilter: 'blur(8px)',
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      marginBottom: '1.25rem',
                    }}
                  >
                    {desc}
                  </p>
                </div>

                {/* Bottom Row: Stat metric + Launch action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-glass)',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: accent }}>
                      {stat}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {statLabel}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--green-primary)',
                    }}
                  >
                    <span>Open Tool</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: AI + AGRICULTURE PIPELINE (Havens Visual Split) ── */}
      <section
        style={{
          padding: '5rem 0',
          backgroundImage: getHeroOverlay(theme, AGRI_IMAGES.greenPaddy, theme === 'dark' ? 0.94 : 0.88),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderTop: '1px solid var(--border-glass)',
          borderBottom: '1px solid var(--border-glass)',
          position: 'relative',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3.5rem',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Visual Data Pipeline */}
            <div>
              <span className="section-label">Intelligent Decision Architecture</span>
              <h2 className="heading-lg" style={{ marginBottom: '1.25rem' }}>
                How KrishiVaani Synthesizes Agro-Data into Decisions
              </h2>

              {/* Step-by-Step Flow Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[
                  {
                    step: '01',
                    title: 'Laboratory test values or district averages for Nitrogen, Phosphorus, Potassium, and soil acidity.',
                    icon: FlaskConical,
                  },
                  {
                    step: '02',
                    title: 'Real-time temperature, relative humidity, and precipitation predictions.',
                    icon: CloudSun,
                  },
                  {
                    step: '03',
                    title: '10-meter resolution NDVI scans tracking real-time plant vigor and crop water stress.',
                    icon: Satellite,
                  },
                  {
                    step: '04',
                    title: 'Trained on 2,200+ verified Indian agro-climatic records to deliver high-yield crop and fertilizer advisory.',
                    icon: Cpu,
                  },
                ].map(({ step, title, desc, icon: Icon }) => (
                  <div
                    key={step}
                    className="card-glass"
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-glass)',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        background: 'var(--green-bg)',
                        border: '1px solid var(--green-pale)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color="var(--green-primary)" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--green-primary)', letterSpacing: '0.04em' }}>
                          STEP {step}
                        </span>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border-glass)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {title}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: High-Res Agricultural Visual Card with Floating Elements */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-glass)',
                  border: '1.5px solid var(--border-glass)',
                  position: 'relative',
                }}
              >
                <img
                  src={AGRI_IMAGES.farmerHarvestInspect}
                  alt="Progressive Indian farmer inspecting healthy crop harvest in sunlight"
                  style={{
                    width: '100%',
                    height: '480px',
                    objectFit: 'cover',
                    display: 'block',
                    filter: theme === 'dark' ? 'brightness(0.9) contrast(1.05)' : 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 50%, rgba(7, 19, 15, 0.92) 100%)',
                  }}
                />

                {/* Glass overlay decision summary */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    left: '1.5rem',
                    right: '1.5rem',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-glass-heavy)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <CheckCircle2 size={18} color="var(--green-primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      Personalized Agronomic Decision
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Instant crop advisory with optimal sowing depth, fertilizer doses, expected harvest MSP, and disease resistance profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: 3-YEAR SUSTAINABLE CROP PLANNING (Havens-Style Card Visuals) ── */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="section-label" style={{ justifyContent: 'center' }}>
              Soil Regeneration Strategy
            </span>
            <h2 className="heading-lg" style={{ marginBottom: '0.85rem' }}>
              Scientific 3-Year Crop Rotation Architecture
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Monocropping depletes specific micronutrients and builds fungal reservoirs.
              Our 3-year agronomic sequence naturally rebalances soil Nitrogen, breaks pest cycles,
              and improves organic carbon.
            </p>
          </div>

          {/* 3-Year Visual Connected Sequence with Havens Photography Headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem',
              position: 'relative',
            }}
          >
            {[
              {
                year: 'Year 1',
                tag: 'High Revenue / Heavy Feeder',
                crop: '🌾 Paddy (Rice) / Maize',
                desc: 'Primary economic harvest. Demands high nitrogen and soil moisture. Generates substantial seasonal farmer income.',
                benefit: 'Maximizes immediate revenue under optimal monsoon rainfall.',
                color: 'var(--green-primary)',
                image: AGRI_IMAGES.rotationYear1,
              },
              {
                year: 'Year 2',
                tag: 'Soil Restorer / Leguminous',
                crop: '🫘 Chickpea (Gram) / Moong',
                desc: 'Rhizobium bacteria in legume root nodules fix 40–60 kg atmospheric Nitrogen/hectare into the root zone without chemical fertilizer.',
                benefit: 'Restores nitrogen reserves & halves subsequent fertilizer expense.',
                color: 'var(--gold)',
                image: AGRI_IMAGES.rotationYear2,
              },
              {
                year: 'Year 3',
                tag: 'Pest Breaker / Deep Root',
                crop: '🌻 Mustard / Wheat / Millets',
                desc: 'Deep taproot systems draw sub-soil minerals to the surface, breaking cereal pest life-cycles and restoring mycorrhizal fungal webs.',
                benefit: 'Breaks fungal blight cycles & improves soil organic carbon.',
                color: '#8b5cf6',
                image: AGRI_IMAGES.rotationYear3,
              },
            ].map(({ year, tag, crop, desc, benefit, color, image }) => (
              <div
                key={year}
                className="card-glass"
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Card Photographic Header */}
                  <div
                    style={{
                      height: '145px',
                      borderRadius: 'calc(var(--radius-md) - 2px)',
                      overflow: 'hidden',
                      position: 'relative',
                      marginBottom: '1rem',
                    }}
                  >
                    <img
                      src={image}
                      alt={crop}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(7, 19, 15, 0.8) 100%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.65rem',
                        left: '0.75rem',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1.25rem',
                        color: '#ffffff',
                        textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      }}
                    >
                      {year}
                    </div>
                    <div style={{ position: 'absolute', top: '0.65rem', right: '0.75rem' }}>
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(7, 19, 15, 0.70)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          fontSize: '0.7rem',
                          color: '#f0f7f3',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {tag}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.55rem', color: 'var(--text-primary)' }}>
                    {crop}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.15rem' }}>
                    {desc}
                  </p>
                </div>

                <div
                  style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--green-bg)',
                    border: '1px solid var(--green-pale)',
                    fontSize: '0.8rem',
                    color: 'var(--green-primary)',
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  ✓ {benefit}
                </div>
              </div>
            ))}
          </div>

          {/* Direct Action Trigger */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/crop-rotation')}
              style={{
                padding: '0.85rem 2rem',
                background: 'var(--bg-surface-glass)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <RefreshCw size={18} />
              <span>Launch 3-Year Rotation Planner</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: COMPUTER VISION LEAF DISEASE FLOW ── */}
      <section
        style={{
          padding: '5rem 0',
          backgroundImage: getHeroOverlay(theme, AGRI_IMAGES.foliageCanopy, theme === 'dark' ? 0.94 : 0.88),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderTop: '1px solid var(--border-glass)',
          borderBottom: '1px solid var(--border-glass)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3.5rem',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Leaf Photo Visual with Glass Diagnostic Badge */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-glass)',
                  border: '1.5px solid var(--border-glass)',
                }}
              >
                <img
                  src={AGRI_IMAGES.healthyLeaf}
                  alt="High resolution leaf showing cellular structure for computer vision diagnostic"
                  style={{
                    width: '100%',
                    height: '420px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              {/* Floating Glass Result Card */}
              <div
                className="card-glass"
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  right: '-16px',
                  padding: '1.1rem 1.4rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-glass)',
                  backdropFilter: 'blur(20px)',
                  maxWidth: '280px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Leaf size={18} color="var(--green-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    38+ Pathologies Identified
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Detects Early Blight, Powdery Mildew, Leaf Rust, and Bacterial Spot with instant organic cures.
                </div>
              </div>
            </div>

            {/* Right Column: Diagnostic Pipeline Description */}
            <div>
              <span className="section-label">Computer Vision AI Scanner</span>
              <h2 className="heading-lg" style={{ marginBottom: '1.25rem' }}>
                Instant Crop Disease Identification from a Leaf Photo
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                Pest and disease attacks ruin up to 25% of annual harvest in India.
                Snap a photo using your smartphone or upload an image to receive instant diagnosis
                and certified bio-pesticide treatment recommendations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem' }}>
                {[
                  'Upload or capture leaf photo with visible spot or discoloration',
                  'Deep Convolutional Neural Network analyzes lesion morphology',
                  'Receive certified diagnosis with confidence percentage',
                  'Get immediate chemical dosage + organic neem oil treatment options',
                ].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'var(--green-bg)',
                        border: '1px solid var(--green-pale)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--green-primary)',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/disease-scanner')}
                style={{ boxShadow: '0 8px 24px var(--green-glow)' }}
              >
                <Leaf size={20} />
                <span>Launch Leaf Disease Scanner</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: LIVE WEATHER & ADVISORY SECTION ── */}
      <section
        style={{
          padding: '4.5rem 0',
          backgroundImage: getHeroOverlay(theme, AGRI_IMAGES.weatherLandscape, theme === 'dark' ? 0.93 : 0.86),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div className="container">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-label">Atmospheric Telemetry</span>
              <h2 className="heading-lg" style={{ color: 'var(--text-primary)' }}>
                Hyperlocal Weather & Severe Climate Warnings
              </h2>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/weather-alerts')}
              style={{ background: 'var(--bg-surface-glass)', backdropFilter: 'blur(12px)' }}
            >
              <span>Full Weather Forecast</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Embedded compact weather widget */}
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <WeatherWidget compact />
          </div>
        </div>
      </section>

      {/* ── SECTION 7: CTA BANNER (Misty Dawn Valley Backdrop) ── */}
      <section
        style={{
          backgroundImage: getBannerOverlay(theme, AGRI_IMAGES.ctaBanner),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '5rem 0',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid var(--border-glass)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <span
            className="badge"
            style={{
              background: 'rgba(34, 197, 94, 0.22)',
              color: '#6ee7b7',
              border: '1px solid rgba(110, 231, 183, 0.35)',
              marginBottom: '1.25rem',
              padding: '0.4rem 1.1rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            🌾 100% Free Public Good for Bharat's Farmers
          </span>

          <h2 className="heading-lg" style={{ color: '#ffffff', marginBottom: '1.1rem' }}>
            Cultivate with Certainty. <br />
            <span style={{ color: '#6ee7b7' }}>Harness AI for Your Next Harvest.</span>
          </h2>

          <p
            style={{
              color: 'rgba(240, 247, 243, 0.85)',
              marginBottom: '2.25rem',
              maxWidth: '520px',
              margin: '0 auto 2.25rem',
              fontSize: '1.05rem',
              lineHeight: 1.7,
            }}
          >
            Join us to maximize profits and preserve your land using data science, satellite indices, and
            multilingual AI assistance.
          </p>

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/crop-recommendation')}
              style={{
                background: 'var(--green-primary)',
                boxShadow: '0 8px 24px var(--green-glow)',
              }}
            >
              <Sprout size={20} />
              <span>Try Crop Recommendation</span>
            </button>

            <button
              className="btn btn-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(16px)',
              }}
              onClick={() => navigate('/ai-assistant')}
            >
              <MessageSquare size={18} />
              <span>Talk with AI Assistant</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentLang, setCurrentLang] = useState('en');

  // Compute activeTab from current route so Navbar highlighting stays in sync
  const getActiveTab = () => {
    const p = location.pathname;
    if (p === '/' || p === '/dashboard') return 'dashboard';
    if (p.includes('crop-rec')) return 'crop-rec';
    if (p.includes('yield')) return 'yield';
    if (p.includes('fertilizer')) return 'fertilizer';
    if (p.includes('disease')) return 'disease';
    if (p.includes('weather')) return 'weather';
    if (p.includes('satellite')) return 'satellite';
    if (p.includes('calendar')) return 'calendar';
    if (p.includes('rotation')) return 'rotation';
    if (p.includes('profile')) return 'profile';
    if (p.includes('assistant') || p.includes('chatbot')) return 'chatbot';
    if (p.includes('about')) return 'about';
    if (p.includes('privacy') || p.includes('terms') || p.includes('disclaimer')) return 'privacy';
    return 'dashboard';
  };
  const activeTab = getActiveTab();
  const isLandingPage = location.pathname === '/' || location.pathname === '/dashboard';

  const handleTabChange = (tabId) => {
    const feature = FEATURES.find(f => f.id === tabId);
    if (feature) {
      navigate(feature.path);
    } else if (tabId === 'dashboard') {
      navigate('/');
    } else {
      navigate('/' + tabId);
    }
  };

  // Persistent Theme State
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('krishivaani-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('krishivaani-theme', theme);
    } catch (e) {
      console.warn("Could not save theme preference:", e);
    }
  }, [theme]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <ScrollToTop />
      <AuthModal />
      {/* ── Top Sticky Navigation ── */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        theme={theme}
        setTheme={setTheme}
      />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<DashboardHome navigate={navigate} theme={theme} />} />
          <Route path="/dashboard" element={<DashboardHome navigate={navigate} theme={theme} />} />

          {/* Segment Routes with Clean onBack Navigation */}
          <Route path="/crop-recommendation" element={<ToolSegment><CropRecommendationCard onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/crop-rec" element={<Navigate to="/crop-recommendation" replace />} />

          <Route path="/yield-prediction" element={<ToolSegment><YieldCalculator onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/yield" element={<Navigate to="/yield-prediction" replace />} />

          <Route path="/disease-scanner" element={<ToolSegment><DiseaseScanner onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/disease" element={<Navigate to="/disease-scanner" replace />} />

          <Route path="/weather-alerts" element={<ToolSegment><WeatherWidget onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/weather" element={<Navigate to="/weather-alerts" replace />} />

          <Route path="/satellite-map" element={<ToolSegment><SatelliteTracker onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/satellite" element={<Navigate to="/satellite-map" replace />} />

          <Route path="/fertilizer-advisor" element={<ToolSegment><FertilizerAdvisor onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/fertilizer" element={<Navigate to="/fertilizer-advisor" replace />} />

          <Route path="/crop-calendar" element={<ToolSegment><CropCalendar onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/calendar" element={<Navigate to="/crop-calendar" replace />} />

          <Route path="/crop-rotation" element={<ToolSegment><CropRotation onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/rotation" element={<Navigate to="/crop-rotation" replace />} />

          <Route path="/farmer-profile" element={<ToolSegment><FarmerProfileManager onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/profile" element={<Navigate to="/farmer-profile" replace />} />

          <Route path="/ai-assistant" element={<ToolSegment><ChatbotWidget currentLang={currentLang} setCurrentLang={setCurrentLang} onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/chatbot" element={<Navigate to="/ai-assistant" replace />} />

          <Route path="/about" element={<ToolSegment><AboutUs onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/about-us" element={<Navigate to="/about" replace />} />

          <Route path="/privacy" element={<ToolSegment><PrivacyPolicy onBack={() => navigate('/')} /></ToolSegment>} />
          <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
          <Route path="/terms" element={<Navigate to="/privacy?tab=terms" replace />} />
          <Route path="/disclaimer" element={<Navigate to="/privacy?tab=disclaimer" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* ── FOOTER: Landing Page Only ── */}
      {isLandingPage && (
        <footer
          style={{
            background: 'var(--bg-dark)',
            borderTop: '1px solid var(--border-glass)',
            padding: '2rem 0 1.25rem',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          <div className="container">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '2rem',
                marginBottom: '1.5rem',
              }}
            >
              {/* Left Column: Brand */}
              <div style={{ maxWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px var(--green-glow)',
                    }}
                  >
                    <Sprout size={18} color="#fff" />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      color: 'var(--text-light)',
                    }}
                  >
                    KrishiVaani
                  </span>
                </div>
                <p style={{ lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
                  AI-powered agricultural intelligence.
                </p>
              </div>

              {/* Middle Column: Contact Us */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Contact us at:
                </div>
                <a
                  href="mailto:krishiVaani@gmail.com"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--green-light)',
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--green-light)'}
                >
                  <Mail size={16} />
                  <span>krishiVaani@gmail.com</span>
                </a>
              </div>

              {/* Right Column: Important Quick Links */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.55rem 2.5rem',
                  minWidth: '280px',
                  maxWidth: '520px',
                  width: '100%',
                  alignContent: 'flex-start',
                }}
              >
                {[
                  { label: 'Crops', path: '/crop-recommendation' },
                  { label: 'Weather', path: '/weather-alerts' },
                  { label: 'Disease Scanner', path: '/disease-scanner' },
                  { label: 'Yield & Revenue', path: '/yield-prediction' },
                  { label: 'Soil & Fertilizer', path: '/fertilizer-advisor' },
                  { label: 'Satellite Map', path: '/satellite-map' },
                  { label: 'Crop Calendar', path: '/crop-calendar' },
                  { label: 'Crop Rotation', path: '/crop-rotation' },
                  { label: 'AI Assistant', path: '/ai-assistant' },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => { navigate(item.path); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      color: 'rgba(255,255,255,0.72)',
                      fontSize: '0.88rem',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--green-light)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.72)'}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Legal Bar */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.82rem',
              }}
            >
              <div>© 2026 KrishiVaani</div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  onClick={() => { navigate('/about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--green-light)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  About Us
                </span>
                <span
                  onClick={() => { navigate('/privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--green-light)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  Privacy
                </span>
                <span
                  onClick={() => { navigate('/privacy?tab=terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--green-light)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  Terms
                </span>
                <span
                  onClick={() => { navigate('/privacy?tab=disclaimer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--green-light)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  Disclaimer
                </span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
