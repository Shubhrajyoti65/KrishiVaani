import React, { useState, useRef, useEffect } from 'react';
import { Sprout, ChevronRight, CheckCircle, AlertCircle, Loader, Droplets, Thermometer, Wind, CloudSun, ShieldCheck, Save, ArrowLeft, Sparkles } from 'lucide-react';
import { logCropToFarmHistory } from '../utils/farmHistoryService';

const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Loamy', 'Clay'];
const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Whole Year'];
const REGIONS = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar', 'Rajasthan', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Odisha', 'Andhra Pradesh', 'Madhya Pradesh', 'Gujarat'];

const DEFAULT_FORM = {
  nitrogen: 60, phosphorus: 40, potassium: 30,
  temperature: 25, humidity: 70, rainfall: 100, ph: 6.5,
  soil_type: 'Alluvial', region: 'Punjab', season: 'Kharif',
  use_live_weather: false
};

export default function CropRecommendationCard({ onBack }) {
  const [form,    setForm]    = useState(DEFAULT_FORM);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherMsg, setWeatherMsg] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [error,   setError]   = useState(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: isNaN(value) ? value : Number(value) }));
  };

  const handleFetchWeather = async () => {
    setFetchingWeather(true);
    setWeatherMsg(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/weather/current?state=${encodeURIComponent(form.region)}&district=${encodeURIComponent(form.region)}`);
      if (!res.ok) throw new Error('Weather service unavailable');
      const data = await res.json();
      if (data && data.current) {
        setForm(prev => ({
          ...prev,
          temperature: Math.round(data.current.temperature_celsius * 10) / 10,
          humidity: Math.round(data.current.humidity_percent),
          rainfall: data.current.precipitation_mm > 0 ? Math.round(data.current.precipitation_mm * 30) : prev.rainfall,
          use_live_weather: true
        }));
        setWeatherMsg(`Synced weather for ${data.location?.district || form.region}: ${data.current.temperature_celsius}°C, ${data.current.humidity_percent}% RH (${data.current.weather_description})`);
        setTimeout(() => setWeatherMsg(null), 6000);
      }
    } catch (err) {
      setWeatherMsg(`Notice: Using standard regional climate data (${err.message})`);
      setTimeout(() => setWeatherMsg(null), 5000);
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const payload = {
        ...form,
        state: form.region
      };
      const res = await fetch('http://localhost:8000/api/v1/crop-recommendation/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleSaveToHistory = async () => {
    if (!result) return;
    setSaveLoading(true);
    setSaveMsg(null);
    try {
      const cropName = result.recommended_crop || result.crop || 'Wheat';
      await logCropToFarmHistory({
        crop: cropName,
        season: form.season || 'Kharif',
        year: new Date().getFullYear(),
        area_acres: 2.0,
        yield_obtained_quintals: 0,
        production_cost_inr: 0,
        revenue_inr: 0,
        soil_condition_note: `XGBoost Recommendation (${((result.confidence || 0.95) * 100).toFixed(1)}% conf). Soil: ${form.soil_type}, Region: ${form.region}, NPK: ${form.nitrogen}-${form.phosphorus}-${form.potassium}`
      });
      setSaveMsg('Saved to your farm history successfully!');
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div>
      {/* Page header */}
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
            AI Crop Intelligence
          </span>
        </div>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Location-, Soil- & Weather-Aware Crop Recommendation</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Trained on benchmark agricultural datasets with an <strong>XGBoost Multi-Class Classifier</strong>. Enter your soil health parameters or auto-sync localized regional weather.
        </p>
      </div>

      {/* ── Input form (Full-width Query at Top) ── */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.15rem' }}>
            Soil & Climate Parameters
          </h3>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleFetchWeather}
            disabled={fetchingWeather}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            {fetchingWeather ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CloudSun size={14} color="var(--green-primary)" />}
            Auto-Sync Live Weather
          </button>
        </div>

        {weatherMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.6rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={15} /> {weatherMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Location & Cropping Season */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>State / Region</label>
              <select className="form-select" name="region" value={form.region} onChange={handleChange}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Soil Type</label>
              <select className="form-select" name="soil_type" value={form.soil_type} onChange={handleChange}>
                {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cropping Season</label>
              <select className="form-select" name="season" value={form.season} onChange={handleChange}>
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Soil Nutrients NPK */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {[
              { name: 'nitrogen',   label: 'Nitrogen (N)', min: 0, max: 200, unit: 'kg/ha' },
              { name: 'phosphorus', label: 'Phosphorus (P)', min: 0, max: 200, unit: 'kg/ha' },
              { name: 'potassium',  label: 'Potassium (K)', min: 0, max: 200, unit: 'kg/ha' },
            ].map(({ name, label, min, max, unit }) => (
              <div className="form-group" key={name} style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    type="number"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    min={min} max={max} step="0.1"
                  />
                  <span style={{ position: 'absolute', right: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Climate & Soil pH */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 60 },
              { name: 'humidity',    label: 'Humidity',    unit: '%',  min: 0, max: 100 },
              { name: 'rainfall',    label: 'Annual Rainfall', unit: 'mm', min: 0, max: 500 },
              { name: 'ph',          label: 'Soil pH',     unit: 'pH', min: 3, max: 10, step: 0.1 },
            ].map(({ name, label, unit, min, max, step = 1 }) => (
              <div className="form-group" key={name} style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input className="form-input" type="number" name={name} value={form[name]} onChange={handleChange} min={min} max={max} step={step} />
                  <span style={{ position: 'absolute', right: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating with XGBoost Classifier...</>
                     : <><Sprout size={18} /> Evaluate Optimal Crops & Strategy</>}
          </button>
        </form>
      </div>

      {/* ── Result Section at Bottom (Full Width) ── */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
          <Loader size={44} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1.25rem' }} />
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Evaluating Agricultural Soil & Climate Parameters...
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Running XGBoost Multi-Class Machine Learning inference with localized climate matching.
          </p>
        </div>
      )}

      {error && (
        <div className="card" style={{ border: '1.5px solid #f0b8a8', background: '#fde8e3', marginBottom: '2rem' }}>
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

      {result && (() => {
        const cropName = result.recommended_crop || result.primary_recommendation || 'Crop';
        const alts = result.top_alternatives || (result.top_recommendations ? result.top_recommendations.slice(1).map(r => ({ crop: r.crop, probability: r.confidence })) : []);
        return (
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
                <span>Recommendation Model Evaluated — Optimal Strategy Ready</span>
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
                Results Ready
              </span>
            </div>

            {/* Top Green Banner */}
            <div style={{
              background: 'linear-gradient(135deg, var(--green-primary) 0%, #1c4a1c 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 2.5rem',
              color: '#ffffff',
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(28,43,26,0.18)',
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <CheckCircle size={14} /> Recommended Primary Crop
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {result.suitability_tier && (
                    <span style={{
                      background: 'rgba(255,255,255,0.22)',
                      padding: '0.25rem 0.8rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      {result.suitability_tier}
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', background: 'rgba(0,0,0,0.25)', padding: '0.25rem 0.7rem', borderRadius: '6px' }}>
                    ⚡ {result.model_name || 'XGBoost Classifier'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, textTransform: 'capitalize', color: '#ffffff' }}>
                    {cropName}
                  </div>
                  <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: '0.4rem' }}>
                    Confidence Match: <strong>{(result.confidence * 100).toFixed(1)}%</strong> for {form.region} ({form.season} season)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  disabled={saveLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.4rem',
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'var(--green-primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {saveLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                  Save Recommendation to Farm History
                </button>
              </div>

              {saveMsg && (
                <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: saveMsg.startsWith('Error') ? '#fca5a5' : '#bbf7d0', fontWeight: 600 }}>
                  {saveMsg}
                </div>
              )}

              {result.weather_context && (
                <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.12)', padding: '0.5rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.15)' }}>
                  ☁️ <strong>Live Weather Sync ({result.weather_context.location}):</strong> {result.weather_context.live_temperature}°C · {result.weather_context.live_humidity}% RH · {result.weather_context.condition}
                </div>
              )}
            </div>

            {/* Results Grid Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* Top Alternatives Card */}
              {alts.length > 0 && (
                <div className="card">
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '1rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Alternative Recommended Crops
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alts.slice(0, 4).map((alt, i) => {
                      const prob = alt.probability ?? alt.confidence ?? 0;
                      return (
                        <div key={alt.crop} style={{ background: 'var(--bg-section)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.95rem' }}>{alt.crop}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-primary)' }}>{(prob * 100).toFixed(0)}% Match</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${prob * 100}%`, height: '100%', background: 'var(--green-primary)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agronomic Advisory Card */}
              <div className="card">
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.85rem', fontSize: '1.05rem', color: 'var(--green-primary)' }}>
                  Agronomic Assessment & Guidelines
                </h4>
                {result.agronomic_rationale && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
                    {result.agronomic_rationale}
                  </p>
                )}
                {result.advisory_notes?.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {result.advisory_notes.map((note, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Soil Nutrient Profile Card */}
              <div className="card card-cream">
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '1rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Soil Nutrient & Climate Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
                  {[['N', form.nitrogen, 'Nitrogen'], ['P', form.phosphorus, 'Phosphorus'], ['K', form.potassium, 'Potassium']].map(([k, v, label]) => (
                    <div key={k} style={{ background: '#ffffff', padding: '0.75rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-primary)' }}>{v}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label} kg/ha</div>
                    </div>
                  ))}
                </div>

                {result.soil_health_assessment && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                    {Object.entries(result.soil_health_assessment).map(([nutrient, desc]) => (
                      <div key={nutrient} style={{ background: '#ffffff', padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <strong style={{ color: 'var(--green-primary)' }}>{nutrient}:</strong> {desc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .crop-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
