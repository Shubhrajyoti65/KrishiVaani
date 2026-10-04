import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, Search, Loader, Info, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { AGRI_IMAGES } from '../data/agriImages';

const CROPS  = ['rice','wheat','maize','cotton','mustard','sugarcane','potato','soybean','chickpea','groundnut'];
const STATES = [
  'Punjab','Haryana','Uttar Pradesh','Bihar','Odisha','West Bengal',
  'Andhra Pradesh','Tamil Nadu','Karnataka','Maharashtra','Gujarat',
  'Rajasthan','Madhya Pradesh','Assam'
];

const SEASON_COLOR = {
  Kharif: { bg: 'var(--green-bg)',           color: 'var(--green-primary)', border: 'var(--green-pale)' },
  Rabi:   { bg: 'rgba(37, 99, 235, 0.16)',   color: '#3b82f6',              border: 'rgba(37, 99, 235, 0.35)' },
  Annual: { bg: 'rgba(217, 119, 6, 0.16)',   color: 'var(--brown)',         border: 'rgba(217, 119, 6, 0.35)' },
  Zaid:   { bg: 'var(--gold-pale)',          color: 'var(--gold)',          border: 'rgba(234, 179, 8, 0.35)' },
};

export default function CropCalendar({ onBack }) {
  const [crop, setCrop]   = useState('rice');
  const [state, setState] = useState('Punjab');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/crop-calendar/?crop=${crop}&state=${encodeURIComponent(state)}`);
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const theme = SEASON_COLOR[result?.season] || SEASON_COLOR.Kharif;

  const Timeline = ({ label, date, dot, active }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: active ? theme.color : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{dot}</div>
        <div style={{ width: 2, height: 32, background: active ? `${theme.color}40` : 'var(--border-color)', marginTop: 4 }} />
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontWeight: 700, color: active ? theme.color : 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>{date}</div>
      </div>
    </div>
  );

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
            ICAR / State Agri Dept
          </span>
        </div>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Crop Sowing & Harvesting Calendar</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          State-wise optimal sowing windows, transplanting dates, and harvesting seasons for major Indian crops.
        </p>

        {/* Havens-Inspired Crop Calendar Seasonal Banner */}
        <div
          className="card-glass"
          style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: `linear-gradient(135deg, rgba(7, 19, 15, 0.88) 0%, rgba(13, 33, 26, 0.85) 100%), url("${AGRI_IMAGES.heroGoldenField}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '1.75rem 2rem',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-glass)',
          }}
        >
          <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
            <span
              className="badge"
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#6ee7b7',
                border: '1px solid rgba(110, 231, 183, 0.35)',
                marginBottom: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Sparkles size={13} /> Agro-Met Biological Schedule
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                color: '#f0fdf4',
                marginBottom: '0.5rem',
                fontWeight: 700,
              }}
            >
              Phenological Sowing & Harvest Windows
            </h3>
            <p
              style={{
                color: '#d1fae5',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                margin: 0,
                opacity: 0.9,
              }}
            >
              Synchronized with Kharif, Rabi, and Zaid agro-climatic thermal units to avoid terminal heat stress and monsoon delays.
            </p>
          </div>
        </div>
      </div>

      {/* Selector */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Crop</label>
            <select className="form-select" value={crop} onChange={e => setCrop(e.target.value)}>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select State</label>
            <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSearch} style={{ padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }} disabled={loading}>
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {loading ? ' Fetching...' : ' Show Calendar'}
          </button>
        </div>
      </div>

      {/* Quick crop tiles */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {CROPS.map(c => (
          <button key={c}
            onClick={() => { setCrop(c); }}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: crop === c ? 'var(--green-primary)' : 'var(--bg-card)',
              color: crop === c ? '#fff' : 'var(--text-secondary)',
              borderColor: crop === c ? 'var(--green-primary)' : 'var(--border-color)',
              transition: 'all 0.2s',
            }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div ref={resultsRef} className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          {/* Calculation Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            color: '#166534',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: '0 2px 8px rgba(22, 101, 52, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#22c55e',
                color: '#ffffff',
                flexShrink: 0
              }}>
                <CheckCircle size={15} />
              </span>
              <span>Crop Calendar Retrieved — Sowing, Transplanting & Harvest Windows Ready</span>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              background: '#dcfce7',
              color: '#15803d',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
              Calendar Ready
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,360px)', gap: '1.5rem' }}>
            {/* Season card */}
          <div className="card" style={{ borderTop: `4px solid ${theme.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: theme.color }}>
                  {result.crop}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{result.state}</div>
              </div>
              <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '999px', padding: '0.35rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: theme.color }}>
                {result.season} Season
              </div>
            </div>

            {/* Timeline */}
            <Timeline label="Nursery / Sowing" date={result.sowing_window}   dot="🌱" active={true} />
            <Timeline label="Transplanting"   date={result.transplanting}    dot="🌾" active={true} />
            <Timeline label="Harvesting"      date={result.harvesting_window} dot="🌾" active={true} />

            <div style={{ background: theme.bg, borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginTop: '0.5rem', border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.color }}>⏱ Duration: </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.duration_days} days</span>
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--green-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarDays size={16} /> Agronomic Tips
              </div>
              {result.agronomic_tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--green-primary)', fontWeight: 700, flexShrink: 0 }}>•</span>
                  {tip}
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--bg-section)', borderLeft: '3px solid var(--gold)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
              <Info size={13} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
              Source: {result.source}
            </div>
          </div>
        </div>
      </div>
      )}

      {!result && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-section)' }}>
          <CalendarDays size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select a Crop & State</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Click "Show Calendar" to see sowing and harvesting windows.</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
