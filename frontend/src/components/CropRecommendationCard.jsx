import React, { useState } from 'react';
import { Sprout, CheckCircle, Info, Sparkles, Loader2 } from 'lucide-react';

export default function CropRecommendationCard() {
  const [formData, setFormData] = useState({
    nitrogen: 90,
    phosphorus: 42,
    potassium: 43,
    temperature: 24.5,
    humidity: 82.0,
    ph: 6.5,
    rainfall: 210.0
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/crop-recommendation/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Crop rec submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
        <Sprout color="#22c55e" size={26} />
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>AI Soil-Based Crop Recommendation Engine</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Input soil NPK and climate metrics to get optimal crop recommendations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Nitrogen (N) kg/ha</label>
          <input
            type="number"
            className="form-input"
            value={formData.nitrogen}
            onChange={(e) => setFormData({ ...formData, nitrogen: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phosphorus (P) kg/ha</label>
          <input
            type="number"
            className="form-input"
            value={formData.phosphorus}
            onChange={(e) => setFormData({ ...formData, phosphorus: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Potassium (K) kg/ha</label>
          <input
            type="number"
            className="form-input"
            value={formData.potassium}
            onChange={(e) => setFormData({ ...formData, potassium: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Temperature (°C)</label>
          <input
            type="number"
            step="0.1"
            className="form-input"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Humidity (%)</label>
          <input
            type="number"
            step="0.1"
            className="form-input"
            value={formData.humidity}
            onChange={(e) => setFormData({ ...formData, humidity: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Soil pH</label>
          <input
            type="number"
            step="0.1"
            className="form-input"
            value={formData.ph}
            onChange={(e) => setFormData({ ...formData, ph: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Rainfall (mm)</label>
          <input
            type="number"
            step="0.1"
            className="form-input"
            value={formData.rainfall}
            onChange={(e) => setFormData({ ...formData, rainfall: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Predict Recommended Crops
          </button>
        </div>
      </form>

      {/* Result Card */}
      {result && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="badge badge-success">Top Match</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem', textTransform: 'capitalize' }}>
                🌾 {result.primary_recommendation}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confidence Score</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>
                {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Top 3 List */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Top 3 Suitable Crops</h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {result.top_recommendations.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <strong>#{idx + 1} {item.crop.toUpperCase()}</strong>: {(item.confidence * 100).toFixed(1)}%
                </div>
              ))}
            </div>
          </div>

          {/* Soil Health */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Soil Diagnosis</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.88rem', display: 'grid', gap: '0.3rem' }}>
              {Object.entries(result.soil_health_assessment).map(([key, val], idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={15} color="#4ade80" />
                  <strong>{key}:</strong> {val}
                </li>
              ))}
            </ul>
          </div>

          {/* Advisory */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Agronomic Advisory Notes</h4>
            {result.advisory_notes.map((note, idx) => (
              <p key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0.2rem 0' }}>• {note}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
