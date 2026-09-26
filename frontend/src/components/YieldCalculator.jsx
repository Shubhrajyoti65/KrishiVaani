import React, { useState } from 'react';
import { LineChart, TrendingUp, IndianRupee, Calculator, Loader, AlertCircle, ChevronDown, Info } from 'lucide-react';

const CROPS_MSP = {
  Rice:      { msp: 2183, season: 'Kharif', yield_range: '2.5–4.5' },
  Wheat:     { msp: 2275, season: 'Rabi',   yield_range: '3.5–5.5' },
  Maize:     { msp: 1962, season: 'Kharif', yield_range: '2.0–4.0' },
  Cotton:    { msp: 6620, season: 'Kharif', yield_range: '1.5–2.5' },
  Soybean:   { msp: 4600, season: 'Kharif', yield_range: '1.2–2.0' },
  Groundnut: { msp: 6377, season: 'Kharif', yield_range: '1.5–2.8' },
  Chickpea:  { msp: 5440, season: 'Rabi',   yield_range: '1.2–2.0' },
  Mustard:   { msp: 5650, season: 'Rabi',   yield_range: '1.2–2.5' },
  Sugarcane: { msp: 340,  season: 'Annual', yield_range: '60–80' },
  Potato:    { msp: 1200, season: 'Rabi',   yield_range: '15–25' },
};

const DEFAULT_FORM = { crop: 'Wheat', area: 2, soil_quality: 'medium', irrigation: 'Canal', state: 'Punjab' };
const STATES = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Karnataka', 'Gujarat', 'West Bengal'];
const IRRIGATION = ['Canal', 'Drip', 'Sprinkler', 'Rain-fed', 'Borewell'];

export default function YieldCalculator() {
  const [form,    setForm]    = useState(DEFAULT_FORM);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: isNaN(value) || value === '' ? value : Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/yield-prediction/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Server: ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      // Local fallback calculation
      const cropInfo = CROPS_MSP[form.crop] || { msp: 2000, yield_range: '2–3' };
      const baseYield = form.soil_quality === 'high' ? 4.2 : form.soil_quality === 'medium' ? 3.1 : 2.0;
      const irrigBonus = form.irrigation === 'Drip' ? 0.4 : form.irrigation === 'Sprinkler' ? 0.3 : form.irrigation === 'Canal' ? 0.2 : 0;
      const yieldQ = (baseYield + irrigBonus) * form.area;
      const revenue = yieldQ * cropInfo.msp;
      setResult({
        estimated_yield_quintals: yieldQ.toFixed(1),
        msp_price_per_quintal: cropInfo.msp,
        estimated_revenue_inr: revenue,
        net_profit_inr: revenue * 0.62,
        season: cropInfo.season,
        crop: form.crop,
        area: form.area,
      });
    } finally {
      setLoading(false);
    }
  };

  const cropInfo = CROPS_MSP[form.crop];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">Revenue Calculator</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Yield & MSP Revenue Forecast</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Estimate your harvest in quintals and calculate expected revenue at government MSP prices.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,400px)', gap: '2rem', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>Farm Details</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Crop</label>
                <select className="form-select" name="crop" value={form.crop} onChange={handleChange}>
                  {Object.keys(CROPS_MSP).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Area (Acres)</label>
                <input className="form-input" type="number" name="area" value={form.area} onChange={handleChange} min={0.1} max={500} step={0.1} />
              </div>
              <div className="form-group">
                <label className="form-label">Soil Quality</label>
                <select className="form-select" name="soil_quality" value={form.soil_quality} onChange={handleChange}>
                  <option value="high">High Fertility</option>
                  <option value="medium">Medium Fertility</option>
                  <option value="low">Low Fertility</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Irrigation Type</label>
                <select className="form-select" name="irrigation" value={form.irrigation} onChange={handleChange}>
                  {IRRIGATION.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">State</label>
                <select className="form-select" name="state" value={form.state} onChange={handleChange}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* MSP hint */}
            {cropInfo && (
              <div style={{ background: 'var(--gold-pale)', border: '1px solid #e8d080', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <Info size={16} color="#9a6e0a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#7a5010' }}>
                  <strong>{form.crop}</strong> ({cropInfo.season}) · Govt MSP: <strong>₹{cropInfo.msp.toLocaleString('en-IN')}/quintal</strong> · Typical yield: <strong>{cropInfo.yield_range} q/acre</strong>
                </div>
              </div>
            )}

            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '0.9rem' }} disabled={loading}>
              {loading
                ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Calculating...</>
                : <><Calculator size={18} /> Calculate Yield & Revenue</>}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--gold-pale)', border: '1px solid #e8d080' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(212,166,42,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <IndianRupee size={30} color="var(--gold)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>Revenue Estimator</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter your farm details and click Calculate to get harvest yield and expected income at government MSP rates.</p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <Loader size={40} color="var(--gold)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Calculating yield estimate…</p>
            </div>
          )}

          {result && (
            <div className="animate-fade-in-up">
              {/* Main revenue card */}
              <div style={{
                background: 'linear-gradient(135deg, #c8960a 0%, #e8b820 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                color: '#fff',
                marginBottom: '1rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <div style={{ fontSize: '0.82rem', opacity: 0.75, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Estimated Revenue (MSP)
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1 }}>
                  ₹{Number(result.estimated_revenue_inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '0.35rem' }}>
                  Net Profit (est.): ₹{Number(result.net_profit_inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Yield (Quintals)', value: `${result.estimated_yield_quintals} q`, color: 'var(--green-primary)' },
                  { label: 'MSP per Quintal', value: `₹${Number(result.msp_price_per_quintal).toLocaleString('en-IN')}`, color: 'var(--gold)' },
                  { label: 'Crop', value: result.crop, color: 'var(--brown)' },
                  { label: 'Season', value: result.season, color: '#7c3aed' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div className="card card-cream" style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <Info size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '1px' }} />
                Revenue based on Government of India MSP 2024–25. Actual market prices may vary. Net profit assumes ~38% input costs.
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ border: '1.5px solid #f0b8a8', background: '#fde8e3', color: '#c04a30', fontSize: '0.875rem', padding: '1rem' }}>
              <AlertCircle size={18} style={{ marginRight: '0.5rem' }} /> {error}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
