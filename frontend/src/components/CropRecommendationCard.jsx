import React, { useState } from 'react';
import { Sprout, ChevronRight, CheckCircle, AlertCircle, Loader, Droplets, Thermometer, Wind } from 'lucide-react';

const SOIL_TYPES = ['Red', 'Black', 'Alluvial', 'Sandy', 'Loamy', 'Clay'];

const DEFAULT_FORM = {
  nitrogen: 60, phosphorus: 40, potassium: 30,
  temperature: 25, humidity: 70, rainfall: 100, ph: 6.5,
  soil_type: 'Alluvial', region: 'Punjab',
};

const REGIONS = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar', 'Rajasthan', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Odisha', 'Andhra Pradesh', 'Madhya Pradesh', 'Gujarat'];

export default function CropRecommendationCard() {
  const [form,    setForm]    = useState(DEFAULT_FORM);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: isNaN(value) ? value : Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/crop-recommendation/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">AI Feature</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Crop Recommendation Engine</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Enter your soil parameters and climate data — our Random Forest ML model will recommend the best crop for your field.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,380px)', gap: '2rem', alignItems: 'start' }}>
        {/* ── Input form ── */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.15rem' }}>
            Soil & Climate Parameters
          </h3>
          <form onSubmit={handleSubmit}>
            {/* NPK */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
              {[
                { name: 'nitrogen',   label: 'Nitrogen (N)', min: 0, max: 200, unit: 'kg/ha' },
                { name: 'phosphorus', label: 'Phosphorus (P)', min: 0, max: 200, unit: 'kg/ha' },
                { name: 'potassium',  label: 'Potassium (K)', min: 0, max: 200, unit: 'kg/ha' },
              ].map(({ name, label, min, max, unit }) => (
                <div className="form-group" key={name}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    type="number"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    min={min} max={max} step="0.1"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unit}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 60 },
                { name: 'humidity',    label: 'Humidity',    unit: '%',  min: 0, max: 100 },
                { name: 'rainfall',    label: 'Rainfall',    unit: 'mm', min: 0, max: 500 },
                { name: 'ph',          label: 'Soil pH',     unit: 'pH', min: 3, max: 10, step: 0.1 },
              ].map(({ name, label, unit, min, max, step = 1 }) => (
                <div className="form-group" key={name}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" type="number" name={name} value={form[name]} onChange={handleChange} min={min} max={max} step={step} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unit}</span>
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <select className="form-select" name="soil_type" value={form.soil_type} onChange={handleChange}>
                  {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">State / Region</label>
                <select className="form-select" name="region" value={form.region} onChange={handleChange}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.9rem' }}
              disabled={loading}
            >
              {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                       : <><Sprout size={18} /> Get Crop Recommendation</>}
            </button>
          </form>
        </div>

        {/* ── Result Panel ── */}
        <div>
          {/* Placeholder state */}
          {!result && !error && !loading && (
            <div className="card card-green" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ width: 70, height: 70, background: 'rgba(61,122,61,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Sprout size={32} color="var(--green-primary)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>Ready to Recommend</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Fill in your soil and climate data, then click the button to get your AI-powered crop recommendation.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <Loader size={40} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Running ML model analysis…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card" style={{ border: '1.5px solid #f0b8a8', background: '#fde8e3' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertCircle size={22} color="#c04a30" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#c04a30', marginBottom: '0.3rem' }}>Connection Error</div>
                  <div style={{ fontSize: '0.875rem', color: '#7a3020' }}>{error}</div>
                  <div style={{ fontSize: '0.8rem', color: '#9a4030', marginTop: '0.5rem' }}>Make sure the FastAPI backend is running on port 8000.</div>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (() => {
            const cropName = result.recommended_crop || result.primary_recommendation || 'Crop';
            const alts = result.top_alternatives || (result.top_recommendations ? result.top_recommendations.slice(1).map(r => ({ crop: r.crop, probability: r.confidence })) : []);
            return (
              <div className="animate-fade-in-up">
                <div style={{
                  background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  color: '#ffffff',
                  marginBottom: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', opacity: 0.9 }}>
                      <CheckCircle size={14} /> Recommended Crop
                    </div>
                    {result.suitability_tier && (
                      <span style={{
                        background: 'rgba(255,255,255,0.22)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}>
                        {result.suitability_tier}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                    {cropName}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                    Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
                  </div>
                </div>

                {/* Top alternatives */}
                {alts.length > 0 && (
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Alternative Crops</div>
                    {alts.slice(0, 3).map((alt, i) => {
                      const prob = alt.probability ?? alt.confidence ?? 0;
                      return (
                        <div key={alt.crop} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{alt.crop}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 80, height: 6, background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--green-pale)', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(prob * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Agronomic advisory notes */}
                {result.advisory_notes?.length > 0 && (
                  <div className="card" style={{ marginBottom: '1rem', background: '#f5faf2', border: '1px solid #d4e8c8' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.88rem', color: 'var(--green-primary)' }}>Agronomic Advisory</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {result.advisory_notes.map((note, idx) => (
                        <li key={idx} style={{ marginBottom: '0.3rem' }}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Soil health assessment */}
                {result.soil_health_assessment && (
                  <div className="card card-cream" style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Soil Nutrient Assessment</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                      {Object.entries(result.soil_health_assessment).map(([nutrient, desc]) => (
                        <div key={nutrient} style={{ background: '#fff', padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: 'var(--green-primary)' }}>{nutrient}:</strong> {desc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soil inputs summary */}
                <div className="card card-cream">
                  <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Your Soil Profile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                    {[['N', form.nitrogen, 'Nitrogen'], ['P', form.phosphorus, 'Phosphorus'], ['K', form.potassium, 'Potassium']].map(([k, v, label]) => (
                      <div key={k}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-primary)' }}>{v}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label} kg/ha</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .crop-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
