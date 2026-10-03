import React, { useState } from 'react';
import { Sprout, ChevronRight, CheckCircle, AlertCircle, Loader, Droplets, Thermometer, Wind, CloudSun, ShieldCheck, Save } from 'lucide-react';
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

export default function CropRecommendationCard() {
  const [form,    setForm]    = useState(DEFAULT_FORM);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherMsg, setWeatherMsg] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [error,   setError]   = useState(null);

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
        <span className="section-label">AI Crop Intelligence</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Location-, Soil- & Weather-Aware Crop Recommendation</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Trained on benchmark agricultural datasets with an <strong>XGBoost Multi-Class Classifier</strong>. Enter your soil health parameters or auto-sync localized regional weather.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,400px)', gap: '2rem', alignItems: 'start' }}>
        {/* ── Input form ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.15rem' }}>
              Soil & Climate Parameters
            </h3>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleFetchWeather}
              disabled={fetchingWeather}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
            >
              {fetchingWeather ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CloudSun size={14} color="var(--green-primary)" />}
              Auto-Sync Live Weather
            </button>
          </div>

          {weatherMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={14} /> {weatherMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Location & Soil Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>State / Region</label>
                <select className="form-select" name="region" value={form.region} onChange={handleChange}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Soil Type</label>
                <select className="form-select" name="soil_type" value={form.soil_type} onChange={handleChange}>
                  {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Cropping Season</label>
                <select className="form-select" name="season" value={form.season} onChange={handleChange}>
                  {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* NPK */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              {[
                { name: 'nitrogen',   label: 'Nitrogen (N)', min: 0, max: 200, unit: 'kg/ha' },
                { name: 'phosphorus', label: 'Phosphorus (P)', min: 0, max: 200, unit: 'kg/ha' },
                { name: 'potassium',  label: 'Potassium (K)', min: 0, max: 200, unit: 'kg/ha' },
              ].map(({ name, label, min, max, unit }) => (
                <div className="form-group" key={name} style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>{label}</label>
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

            {/* Climate & pH */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'temperature', label: 'Temp', unit: '°C', min: 0, max: 60 },
                { name: 'humidity',    label: 'Humidity',    unit: '%',  min: 0, max: 100 },
                { name: 'rainfall',    label: 'Rainfall',    unit: 'mm', min: 0, max: 500 },
                { name: 'ph',          label: 'Soil pH',     unit: 'pH', min: 3, max: 10, step: 0.1 },
              ].map(({ name, label, unit, min, max, step = 1 }) => (
                <div className="form-group" key={name} style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>{label}</label>
                  <input className="form-input" type="number" name={name} value={form[name]} onChange={handleChange} min={min} max={max} step={step} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unit}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating with XGBoost...</>
                       : <><Sprout size={18} /> Evaluate Optimal Crops</>}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.88rem', opacity: 0.9 }}>
                    <div>Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong></div>
                    <div style={{ fontSize: '0.78rem', background: 'rgba(0,0,0,0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      ⚡ {result.model_name || 'XGBoost Classifier'}
                    </div>
                  </div>

                  {(result.soil_suitability_factor || result.season_compatibility) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {result.soil_suitability_factor && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.25)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                          🌱 {result.soil_suitability_factor}
                        </span>
                      )}
                      {result.season_compatibility && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.25)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                          ☀️ {result.season_compatibility}
                        </span>
                      )}
                    </div>
                  )}

                  {result.weather_context && (
                    <div style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                      ☁️ <strong>Live Weather ({result.weather_context.location}):</strong> {result.weather_context.live_temperature}°C · {result.weather_context.live_humidity}% RH · {result.weather_context.condition}
                    </div>
                  )}

                  <div style={{ marginTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleSaveToHistory}
                      disabled={saveLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.6rem 1rem',
                        background: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'var(--green-primary)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {saveLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                      Save Recommendation to Farm History
                    </button>
                    {saveMsg && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: saveMsg.startsWith('Error') ? '#fca5a5' : '#bbf7d0', fontWeight: 600, textAlign: 'center' }}>
                        {saveMsg}
                      </div>
                    )}
                  </div>
                </div>

                {result.agronomic_rationale && (
                  <div className="card" style={{ marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong>Agronomic Assessment:</strong> {result.agronomic_rationale}
                  </div>
                )}

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
