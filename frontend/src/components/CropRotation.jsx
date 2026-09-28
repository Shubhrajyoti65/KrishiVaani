import React, { useState } from 'react';
import { RefreshCw, Search, Loader, Info, CheckCircle, AlertCircle } from 'lucide-react';

const CROPS  = ['rice','wheat','maize','cotton','mustard','soybean','chickpea','sugarcane','potato','groundnut'];
const SOILS  = ['Alluvial','Black','Red','Laterite','Sandy Loam','Clayey Loam','Loamy'];
const STATES = ['Punjab','Haryana','Uttar Pradesh','Bihar','Odisha','West Bengal','Andhra Pradesh','Tamil Nadu','Karnataka','Maharashtra','Gujarat','Rajasthan','Madhya Pradesh'];

const PRIORITY_COLOR = { 1: 'var(--green-primary)', 2: '#2563eb', 3: '#9a6e0a', 4: 'var(--text-muted)' };
const PRIORITY_BG    = { 1: 'var(--green-bg)', 2: '#e8f0fc', 3: 'var(--gold-pale)', 4: 'var(--bg-section)' };

export default function CropRotation() {
  const [prevCrop, setPrevCrop] = useState('rice');
  const [soilType, setSoilType] = useState('Alluvial');
  const [state, setState] = useState('Punjab');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:8000/api/v1/crop-rotation/?previous_crop=${prevCrop}&soil_type=${encodeURIComponent(soilType)}&state=${encodeURIComponent(state)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">Soil Health & Productivity</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Crop Rotation Planner</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Find the best next crop to grow based on your previous crop, soil type, and state — using agronomic rotation rules for pest control and soil nutrition balance.
        </p>
      </div>

      {/* Selector */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Previous Crop</label>
            <select className="form-select" value={prevCrop} onChange={e => setPrevCrop(e.target.value)}>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Soil Type</label>
            <select className="form-select" value={soilType} onChange={e => setSoilType(e.target.value)}>
              {SOILS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">State</label>
            <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSearch} style={{ padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }} disabled={loading}>
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            {loading ? ' Loading...' : ' Get Rotation'}
          </button>
        </div>
      </div>

      {/* Quick previous crop selector */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {CROPS.map(c => (
          <button key={c}
            onClick={() => setPrevCrop(c)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: prevCrop === c ? 'var(--brown)' : 'var(--bg-card)',
              color: prevCrop === c ? '#fff' : 'var(--text-secondary)',
              borderColor: prevCrop === c ? 'var(--brown)' : 'var(--border-color)',
              transition: 'all 0.2s',
            }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader size={40} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Finding best next crops…</p>
        </div>
      )}

      {result && !loading && (
        <div className="animate-fade-in-up">
          {/* Summary banner */}
          <div style={{ background: 'linear-gradient(135deg, var(--brown), #a06840)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>After {result.previous_crop}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                Best Next: <span style={{ color: '#d4f0c0' }}>{result.recommended_next_crops[0]?.crop}</span>
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{result.rotation_benefit}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, fontSize: '0.85rem' }}>
              <RefreshCw size={16} /> {result.soil_type} Soil · {result.state}
            </div>
          </div>

          {/* Rotation options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {result.recommended_next_crops.map((opt, i) => (
              <div key={i} className="card" style={{ borderTop: `3px solid ${PRIORITY_COLOR[opt.priority] || 'var(--border-color)'}`, background: opt.soil_compatible ? 'var(--bg-card)' : 'var(--bg-section)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: PRIORITY_COLOR[opt.priority] }}>
                    #{opt.priority} {opt.crop}
                  </div>
                  {opt.soil_compatible
                    ? <CheckCircle size={16} color="var(--green-primary)" />
                    : <AlertCircle size={16} color="var(--gold)" />}
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.6rem' }}>{opt.reason}</p>
                <div style={{ fontSize: '0.78rem', color: PRIORITY_COLOR[opt.priority], background: PRIORITY_BG[opt.priority], borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', fontWeight: 600 }}>
                  {opt.soil_benefit}
                </div>
                {!opt.soil_compatible && (
                  <div style={{ fontSize: '0.73rem', color: 'var(--gold)', marginTop: '0.4rem', display: 'flex', gap: '0.3rem' }}>
                    <AlertCircle size={11} /> May need soil amendment for {soilType} soil
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* General advice */}
          <div className="card" style={{ borderLeft: '3px solid var(--green-primary)', background: 'var(--green-bg)' }}>
            <div style={{ fontWeight: 700, color: 'var(--green-primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📋 General Rotation Principles</div>
            {result.general_advice.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--green-primary)', fontWeight: 700 }}>•</span> {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-section)' }}>
          <RefreshCw size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Plan Your Crop Rotation</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select your previous crop and click "Get Rotation" to see scientifically recommended next crops.</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
