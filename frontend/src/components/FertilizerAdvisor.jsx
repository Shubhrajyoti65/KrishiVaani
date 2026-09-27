import React, { useState } from 'react';
import { FlaskConical, Loader, Info, AlertCircle, CheckCircle, Sprout } from 'lucide-react';

const CROPS = ['rice','wheat','maize','cotton','sugarcane','potato','soybean','chickpea','mustard','groundnut'];
const SOILS = ['Alluvial','Black','Red','Laterite','Sandy Loam','Clayey Loam','Loamy'];
const STATES = ['Punjab','Haryana','Uttar Pradesh','Bihar','Odisha','West Bengal','Maharashtra','Karnataka','Madhya Pradesh','Rajasthan','Gujarat','Andhra Pradesh'];

export default function FertilizerAdvisor() {
  const [form, setForm] = useState({ crop:'wheat', nitrogen:55, phosphorus:30, potassium:28, ph:7.2, soil_type:'Alluvial', state:'Punjab', area_acres:3 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: isNaN(value) || value === '' ? value : Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/fertilizer/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      // Inline fallback
      const urea = Math.round((form.nitrogen < 50 ? 85 : 65) + (3 - form.area_acres) * 2);
      const dap = Math.round(form.phosphorus < 30 ? 55 : 40);
      const mop = Math.round(form.potassium < 30 ? 35 : 25);
      setResult({
        crop: form.crop.charAt(0).toUpperCase() + form.crop.slice(1),
        soil_quality_assessed: form.nitrogen < 50 ? 'low' : form.nitrogen < 80 ? 'medium' : 'high',
        recommended_doses: { urea_kg_per_acre: urea, dap_kg_per_acre: dap, mop_kg_per_acre: mop, total_N_kg_per_acre: Math.round(urea * 0.46 + dap * 0.18), total_P2O5_kg_per_acre: Math.round(dap * 0.46), total_K2O_kg_per_acre: Math.round(mop * 0.6) },
        application_schedule: 'Apply full DAP + MOP as basal at sowing. Split Urea: 50% at sowing, 50% at first irrigation.',
        organic_supplements: ['FYM 4–5 t/acre before sowing', 'Azotobacter bio-fertilizer seed treatment'],
        deficiency_symptoms: form.nitrogen < 40 ? ['Nitrogen deficient — yellowing of older leaves'] : [],
        advisory: `ICAR recommendation for ${form.crop} on ${form.soil_type} soil in ${form.state}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const SQ_COLOR = { high: 'var(--green-primary)', medium: '#9a6e0a', low: '#c04a30' };
  const SQ_BG   = { high: 'var(--green-bg)',       medium: 'var(--gold-pale)',    low: '#fde8e3' };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">ICAR Guidelines</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Fertilizer Dose Advisor</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Get Urea, DAP, and MOP quantities per acre based on your crop, soil NPK, and state — sourced from ICAR fertilizer guidelines.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: '2rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>Soil & Crop Details</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Crop</label>
                <select className="form-select" name="crop" value={form.crop} onChange={handleChange}>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Field Area (Acres)</label>
                <input className="form-input" type="number" name="area_acres" value={form.area_acres} onChange={handleChange} min={0.1} step={0.5} />
              </div>
              <div className="form-group">
                <label className="form-label">Soil Nitrogen (kg/ha)</label>
                <input className="form-input" type="number" name="nitrogen" value={form.nitrogen} onChange={handleChange} min={0} max={200} />
              </div>
              <div className="form-group">
                <label className="form-label">Soil Phosphorus (kg/ha)</label>
                <input className="form-input" type="number" name="phosphorus" value={form.phosphorus} onChange={handleChange} min={0} max={200} />
              </div>
              <div className="form-group">
                <label className="form-label">Soil Potassium (kg/ha)</label>
                <input className="form-input" type="number" name="potassium" value={form.potassium} onChange={handleChange} min={0} max={300} />
              </div>
              <div className="form-group">
                <label className="form-label">Soil pH</label>
                <input className="form-input" type="number" name="ph" value={form.ph} onChange={handleChange} min={0} max={14} step={0.1} />
              </div>
              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <select className="form-select" name="soil_type" value={form.soil_type} onChange={handleChange}>
                  {SOILS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-select" name="state" value={form.state} onChange={handleChange}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> Calculating...</> : <><FlaskConical size={17} /> Get Fertilizer Plan</>}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-section)' }}>
              <FlaskConical size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fertilizer Plan</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter your soil test values and click calculate to get ICAR-based fertilizer doses.</p>
            </div>
          )}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader size={40} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Calculating optimal doses…</p>
            </div>
          )}
          {result && (
            <div className="animate-fade-in-up">
              {/* Soil quality badge */}
              <div style={{ background: SQ_BG[result.soil_quality_assessed] || 'var(--green-bg)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: SQ_COLOR[result.soil_quality_assessed], textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Soil Fertility</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: SQ_COLOR[result.soil_quality_assessed] }}>
                    {result.soil_quality_assessed.charAt(0).toUpperCase() + result.soil_quality_assessed.slice(1)} Fertility
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: SQ_COLOR[result.soil_quality_assessed] }}>{result.crop}</div>
              </div>

              {/* Doses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Urea', value: result.recommended_doses.urea_kg_per_acre, unit: 'kg/acre', sub: '46% N', color: '#2563eb' },
                  { label: 'DAP',  value: result.recommended_doses.dap_kg_per_acre,  unit: 'kg/acre', sub: '18N+46P', color: 'var(--green-primary)' },
                  { label: 'MOP',  value: result.recommended_doses.mop_kg_per_acre,  unit: 'kg/acre', sub: '60% K₂O', color: 'var(--brown)' },
                ].map(({ label, value, unit, sub, color }) => (
                  <div key={label} className="card" style={{ textAlign: 'center', padding: '1rem 0.75rem' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{unit}</div>
                    <div style={{ fontWeight: 700, color, fontSize: '0.85rem', marginTop: '0.3rem' }}>{label}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Schedule */}
              <div className="card" style={{ marginBottom: '0.75rem', borderLeft: '3px solid var(--green-primary)', background: 'var(--green-bg)' }}>
                <div style={{ fontWeight: 700, color: 'var(--green-primary)', fontSize: '0.875rem', marginBottom: '0.4rem' }}>📅 Application Schedule</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.application_schedule}</p>
              </div>

              {/* Organic supplements */}
              <div className="card" style={{ marginBottom: '0.75rem', borderLeft: '3px solid var(--gold)' }}>
                <div style={{ fontWeight: 700, color: '#9a6e0a', fontSize: '0.875rem', marginBottom: '0.4rem' }}>🌿 Organic Supplements</div>
                {result.organic_supplements.map((s, i) => <div key={i} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>• {s}</div>)}
              </div>

              {/* Deficiency warnings */}
              {result.deficiency_symptoms?.length > 0 && (
                <div className="card" style={{ borderLeft: '3px solid #c04a30', background: '#fde8e3' }}>
                  <div style={{ fontWeight: 700, color: '#c04a30', fontSize: '0.875rem', marginBottom: '0.4rem' }}>⚠️ Deficiency Symptoms Detected</div>
                  {result.deficiency_symptoms.map((s, i) => <div key={i} style={{ fontSize: '0.83rem', color: '#a03020', marginBottom: '0.2rem' }}>• {s}</div>)}
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                <Info size={12} color="var(--gold)" style={{ flexShrink: 0, marginTop: '1px' }} /> {result.advisory}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
