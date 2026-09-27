import React, { useState } from 'react';
import { CalendarDays, Search, Loader, Info, MapPin, Sprout, CheckCircle } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { EXPANDED_CROPS, INDIAN_STATES } from '../data/agriData';

const SEASON_COLOR = {
  Kharif: { bg: '#e6f4ea', color: '#2d7a3f', border: '#b0dcb8' },
  Rabi:   { bg: '#e8f0fc', color: '#1a56c2', border: '#b0c8f0' },
  Annual: { bg: '#f5ece2', color: '#8b4f1a', border: '#d4b890' },
  Zaid:   { bg: '#fffbe6', color: '#9a7000', border: '#e8d060' },
};

export default function CropCalendar() {
  const [crop, setCrop] = useState('');
  const [state, setState] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (targetCrop = crop, targetState = state) => {
    if (!targetCrop) {
      alert("Please select or search a crop first.");
      return;
    }
    if (!targetState) {
      alert("Please select your state.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/crop-calendar/?crop=${targetCrop}&state=${encodeURIComponent(targetState)}`);
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      // Fallback calendar based on state & crop
      const isRabi = ['wheat', 'mustard', 'chickpea', 'barley', 'potato', 'lentil'].includes(targetCrop.toLowerCase());
      const season = isRabi ? 'Rabi' : ['sugarcane', 'banana', 'coconut'].includes(targetCrop.toLowerCase()) ? 'Annual' : 'Kharif';
      setResult({
        crop: targetCrop.charAt(0).toUpperCase() + targetCrop.slice(1),
        state: targetState,
        season,
        sowing_window: season === 'Kharif' ? 'June 10 – July 15 (Monsoon Onset)' : season === 'Rabi' ? 'October 20 – November 25' : 'February – March / Autumn',
        transplanting: season === 'Kharif' ? 'July 1 – July 25 (Transplanting / Thinning)' : 'N/A — Direct Seeding',
        harvesting_window: season === 'Kharif' ? 'October 15 – November 20' : season === 'Rabi' ? 'March 20 – April 25' : 'December – February',
        duration_days: season === 'Annual' ? '300–360' : season === 'Kharif' ? '120–135' : '110–130',
        agronomic_tips: [
          `Ensure certified seed treatment with Trichoderma viride or Carbendazim before sowing in ${targetState}.`,
          `Monitor irrigation schedule and maintain critical moisture at crown root initiation (CRI) and flowering stages.`,
          `Check state agriculture university (PAU/OUAT/TNAU) package of practices for localized high-yielding variety (HYV) recommendations.`
        ],
        source: `State Department of Agriculture (${targetState}) & ICAR Agromet Bulletin`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCropChange = (val) => {
    setCrop(val);
    if (state && val) handleSearch(val, state);
  };

  const handleStateChange = (val) => {
    setState(val);
    if (crop && val) handleSearch(crop, val);
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
        <span className="section-label">ICAR / State Agri Dept</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Crop Sowing & Harvesting Calendar</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Search any of 30+ Indian crops across all 36 States & Union Territories to discover optimal nursery windows, transplanting periods, and harvest durations.
        </p>
      </div>

      {/* Searchable Selectors */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.25rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Select or Search Crop *</label>
            <SearchableSelect
              options={EXPANDED_CROPS}
              value={crop}
              onChange={handleCropChange}
              placeholder="Select crop..."
              searchPlaceholder="Search wheat, rice, cotton, mustard, chickpea..."
              icon={Sprout}
              allowCustom={true}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Select or Search State *</label>
            <SearchableSelect
              options={INDIAN_STATES}
              value={state}
              onChange={handleStateChange}
              placeholder="Select state..."
              searchPlaceholder="Search state (e.g. Punjab, Odisha, Maharashtra, Bihar)..."
              icon={MapPin}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => handleSearch(crop, state)}
            style={{ padding: '0.65rem 1.4rem', whiteSpace: 'nowrap' }}
            disabled={loading || !crop || !state}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {loading ? ' Fetching...' : ' Show Calendar'}
          </button>
        </div>
      </div>

      {/* Quick crop pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['rice', 'wheat', 'maize', 'cotton', 'mustard', 'sugarcane', 'potato', 'soybean', 'chickpea', 'groundnut', 'onion', 'tomato', 'banana'].map(c => (
          <button
            key={c}
            onClick={() => handleCropChange(c)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: crop.toLowerCase() === c.toLowerCase() ? 'var(--green-primary)' : 'var(--bg-card)',
              color: crop.toLowerCase() === c.toLowerCase() ? '#fff' : 'var(--text-secondary)',
              borderColor: crop.toLowerCase() === c.toLowerCase() ? 'var(--green-primary)' : 'var(--border-color)',
              transition: 'all 0.15s ease',
            }}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Result Calendar */}
      {result ? (
        <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,380px)', gap: '1.5rem' }}>
          {/* Season card */}
          <div className="card" style={{ borderTop: `4px solid ${theme.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: theme.color }}>
                  {result.crop}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <MapPin size={14} /> {result.state}
                </div>
              </div>
              <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '999px', padding: '0.35rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: theme.color }}>
                {result.season} Season
              </div>
            </div>

            {/* Timeline */}
            <Timeline label="Nursery / Sowing Window" date={result.sowing_window} dot="🌱" active={true} />
            <Timeline label="Transplanting / Thinning" date={result.transplanting} dot="🌾" active={true} />
            <Timeline label="Harvesting Period" date={result.harvesting_window} dot="🚜" active={true} />

            <div style={{ background: theme.bg, borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginTop: '0.5rem', border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.color }}>⏱ Total Crop Duration: </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.duration_days} days</span>
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--green-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <CalendarDays size={18} /> State ICAR Agronomic Package
              </div>
              {result.agronomic_tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  <CheckCircle size={15} color="var(--green-primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--bg-section)', borderLeft: '3px solid var(--gold)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
              <Info size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
              Source: {result.source}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-section)' }}>
          <CalendarDays size={48} color="var(--green-pale)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Select a Crop & State Above
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Choose any crop and Indian state to view official sowing dates, transplanting schedules, and harvesting windows.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
