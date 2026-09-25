import React, { useState } from 'react';
import { LineChart, DollarSign, Layers, Sparkles, Loader2 } from 'lucide-react';

export default function YieldCalculator() {
  const [formData, setFormData] = useState({
    crop: 'rice',
    state: 'Odisha',
    season: 'Kharif',
    area_acres: 5.0,
    nitrogen: 90,
    phosphorus: 45,
    potassium: 40,
    rainfall: 1100,
    temperature: 27.5
  });

  const [loading, setLoading] = useState(false);
  const [yieldResult, setYieldResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/yield-prediction/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setYieldResult(data);
      }
    } catch (err) {
      console.error('Yield calc error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
        <LineChart color="#f59e0b" size={26} />
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Crop Yield Prediction & MSP Revenue Calculator</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Predict expected crop production (Quintals) and financial revenue projections</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Crop Species</label>
          <select
            className="form-select"
            value={formData.crop}
            onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
          >
            <option value="rice">Rice (धान)</option>
            <option value="wheat">Wheat (गेहूं)</option>
            <option value="maize">Maize (मक्का)</option>
            <option value="cotton">Cotton (कपास)</option>
            <option value="chickpea">Chickpea (चना)</option>
            <option value="sugarcane">Sugarcane (गन्ना)</option>
            <option value="jute">Jute (पटसन)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Indian State</label>
          <input
            type="text"
            className="form-input"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Season</label>
          <select
            className="form-select"
            value={formData.season}
            onChange={(e) => setFormData({ ...formData, season: e.target.value })}
          >
            <option value="Kharif">Kharif</option>
            <option value="Rabi">Rabi</option>
            <option value="Zaid">Zaid</option>
            <option value="Whole Year">Whole Year</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Land Area (Acres)</label>
          <input
            type="number"
            step="0.5"
            className="form-input"
            value={formData.area_acres}
            onChange={(e) => setFormData({ ...formData, area_acres: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Rainfall (mm)</label>
          <input
            type="number"
            className="form-input"
            value={formData.rainfall}
            onChange={(e) => setFormData({ ...formData, rainfall: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Compute Yield & Revenue
          </button>
        </div>
      </form>

      {/* Yield Result Display */}
      {yieldResult && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Yield Per Acre</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>
                {yieldResult.predicted_yield_per_acre_quintals} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>qtl/acre</span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Production ({yieldResult.area_acres} Acres)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4ade80' }}>
                {yieldResult.total_expected_yield_quintals} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Quintals</span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated MSP Income</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>
                ₹{yieldResult.revenue_estimate.min_total_revenue_inr.toLocaleString()} - ₹{yieldResult.revenue_estimate.max_total_revenue_inr.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@ ₹{yieldResult.revenue_estimate.estimated_msp_per_quintal_inr}/qtl MSP</div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Risk Assessment & Field Tips</h4>
            {yieldResult.risk_assessment.map((risk, idx) => (
              <p key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0.2rem 0' }}>• {risk}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
