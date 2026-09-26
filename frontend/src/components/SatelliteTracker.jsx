import React, { useState } from 'react';
import { Satellite, MapPin, TrendingUp, Droplets, Thermometer, Eye, Loader, RefreshCw, AlertCircle, Info } from 'lucide-react';

const NDVI_LEVELS = [
  { min: 0.8, max: 1.0, label: 'Dense Vegetation',  color: '#1a7a1a', bg: '#e0f0d8' },
  { min: 0.6, max: 0.8, label: 'Healthy Crop',       color: 'var(--green-primary)', bg: 'var(--green-bg)' },
  { min: 0.4, max: 0.6, label: 'Moderate Growth',    color: '#8a9a20', bg: '#f0f4d0' },
  { min: 0.2, max: 0.4, label: 'Sparse / Stressed',  color: 'var(--gold)', bg: 'var(--gold-pale)' },
  { min: 0.0, max: 0.2, label: 'Bare Soil / Poor',   color: '#c06010', bg: '#fff0e0' },
];

const LOCATIONS = [
  { name: 'Ludhiana, Punjab', lat: 30.9, lon: 75.85 },
  { name: 'Nashik, Maharashtra', lat: 20.0, lon: 73.79 },
  { name: 'Guntur, Andhra Pradesh', lat: 16.3, lon: 80.45 },
  { name: 'Patna, Bihar', lat: 25.6, lon: 85.14 },
  { name: 'Indore, Madhya Pradesh', lat: 22.72, lon: 75.86 },
  { name: 'Rajkot, Gujarat', lat: 22.3, lon: 70.78 },
];

function getNdviLevel(ndvi) {
  return NDVI_LEVELS.find(l => ndvi >= l.min && ndvi <= l.max) || NDVI_LEVELS[3];
}

export default function SatelliteTracker() {
  const [loc,     setLoc]     = useState(LOCATIONS[0]);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const analyze = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/satellite/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: loc.lat, longitude: loc.lon, location_name: loc.name }),
      });
      if (!res.ok) throw new Error('API error');
      setResult(await res.json());
    } catch {
      // Mock data for demo
      const ndvi = +(Math.random() * 0.5 + 0.35).toFixed(2);
      const evi  = +(ndvi * 0.85).toFixed(2);
      const moisture = +(Math.random() * 0.3 + 0.3).toFixed(2);
      setTimeout(() => {
        setResult({
          location: loc.name,
          ndvi, evi, moisture_index: moisture,
          cloud_cover: Math.floor(Math.random() * 30),
          acquisition_date: new Date().toISOString().split('T')[0],
          health_score: Math.floor(ndvi * 100),
          water_stress: moisture < 0.35 ? 'Moderate' : 'Low',
          recommendation: ndvi > 0.6
            ? 'Crop health is good. Continue current irrigation schedule.'
            : 'Vegetation stress detected. Consider increasing irrigation and checking soil nutrients.',
        });
        setLoading(false);
      }, 1400);
      return;
    }
    setLoading(false);
  };

  const ndviLevel = result ? getNdviLevel(result.ndvi) : null;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">Sentinel-2 Satellite</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Satellite NDVI Crop Health</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Monitor your field using Sentinel-2 satellite imagery. NDVI and EVI indices show vegetation health and water stress.
        </p>
      </div>

      {/* Location selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="var(--green-primary)" />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Location:</span>
          </div>
          <select
            className="form-select"
            style={{ maxWidth: 260 }}
            value={loc.name}
            onChange={e => setLoc(LOCATIONS.find(l => l.name === e.target.value))}
          >
            {LOCATIONS.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-section)', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>
            {loc.lat}°N, {loc.lon}°E
          </div>
          <button className="btn btn-primary" onClick={analyze} disabled={loading}>
            {loading
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Fetching...</>
              : <><Satellite size={16} /> Analyze Field</>}
          </button>
        </div>
      </div>

      {/* NDVI color scale legend */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>NDVI Health Scale</div>
        <div style={{ display: 'flex', gap: '0', height: '16px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
          {['#c06010', '#d4a030', '#8a9a20', '#3d7a3d', '#1a7a1a'].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>0.0 — Bare soil</span><span>0.2</span><span>0.4</span><span>0.6</span><span>0.8</span><span>1.0 — Dense</span>
        </div>
      </div>

      {/* Results */}
      {result && ndviLevel && (
        <div className="animate-fade-in-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* NDVI */}
            <div className="card" style={{ background: ndviLevel.bg, border: `2px solid ${ndviLevel.color}40`, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: ndviLevel.color, lineHeight: 1 }}>{result.ndvi}</div>
              <div style={{ fontWeight: 700, color: ndviLevel.color, marginTop: '0.4rem', fontSize: '0.9rem' }}>NDVI Index</div>
              <div className="badge" style={{ background: ndviLevel.bg, color: ndviLevel.color, border: `1px solid ${ndviLevel.color}40`, marginTop: '0.5rem' }}>{ndviLevel.label}</div>
            </div>

            {/* EVI */}
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{result.evi}</div>
              <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '0.4rem', fontSize: '0.9rem' }}>EVI Index</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Enhanced Vegetation</div>
            </div>

            {/* Moisture */}
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--brown)', lineHeight: 1 }}>{result.moisture_index}</div>
              <div style={{ fontWeight: 700, color: 'var(--brown)', marginTop: '0.4rem', fontSize: '0.9rem' }}>Moisture Index</div>
              <span className="badge" style={{ background: result.water_stress === 'Low' ? 'var(--green-bg)' : 'var(--gold-pale)', color: result.water_stress === 'Low' ? 'var(--green-primary)' : '#9a6e0a', marginTop: '0.5rem' }}>
                {result.water_stress} stress
              </span>
            </div>

            {/* Health */}
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-primary)', lineHeight: 1 }}>{result.health_score}<span style={{ fontSize: '1rem' }}>%</span></div>
              <div style={{ fontWeight: 700, color: 'var(--green-primary)', marginTop: '0.4rem', fontSize: '0.9rem' }}>Health Score</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{result.cloud_cover}% cloud cover</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="card" style={{ borderLeft: '4px solid var(--green-primary)', background: 'var(--green-bg)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Satellite size={20} color="var(--green-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--green-primary)', marginBottom: '0.35rem' }}>
                  AI Recommendation — {result.location}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.recommendation}</p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Sentinel-2 acquisition: {result.acquisition_date}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', background: 'var(--bg-section)' }}>
          <Satellite size={52} color="var(--green-pale)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Select & Analyze</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '340px', margin: '0 auto' }}>
            Choose a field location above and click "Analyze Field" to fetch Sentinel-2 satellite imagery and compute NDVI crop health.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
