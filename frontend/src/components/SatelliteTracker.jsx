import React, { useState } from 'react';
import { Satellite, MapPin, Activity, Calendar, Loader2 } from 'lucide-react';

export default function SatelliteTracker() {
  const [coords, setCoords] = useState({ lat: 20.4625, lon: 85.8830, farmName: 'Block-A Paddy Field' });
  const [loading, setLoading] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);

  const fetchSatelliteNDVI = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/satellite/ndvi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(coords.lat),
          longitude: parseFloat(coords.lon),
          farm_name: coords.farmName,
          buffer_meters: 500
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSatelliteData(data);
      }
    } catch (err) {
      console.error('Satellite fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
        <Satellite color="#0284c7" size={26} />
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Satellite Crop Health & NDVI Monitoring</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sentinel-2 multispectral satellite remote sensing vegetation & water stress index</p>
        </div>
      </div>

      <form onSubmit={fetchSatelliteNDVI} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Latitude</label>
          <input type="number" step="0.0001" className="form-input" value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: e.target.value })} required />
        </div>

        <div className="form-group">
          <label className="form-label">Longitude</label>
          <input type="number" step="0.0001" className="form-input" value={coords.lon} onChange={(e) => setCoords({ ...coords, lon: e.target.value })} required />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Farm Plot Name</label>
          <input type="text" className="form-input" value={coords.farmName} onChange={(e) => setCoords({ ...coords, farmName: e.target.value })} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />} Compute Satellite NDVI Canopy Health
          </button>
        </div>
      </form>

      {/* Satellite Results */}
      {satelliteData && (
        <div style={{
          background: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="badge badge-info">{satelliteData.satellite_constellation}</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem' }}>
                📍 {satelliteData.farm_name || 'Farm Plot'} ({satelliteData.location_coords.latitude}, {satelliteData.location_coords.longitude})
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mean NDVI Vegetation Index</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                {satelliteData.ndvi_metrics.mean_ndvi}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Canopy Status</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80' }}>{satelliteData.ndvi_metrics.canopy_health_status}</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Water Stress (NDWI)</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>{satelliteData.ndvi_metrics.water_stress_index_ndwi}</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NDVI Range</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }}>{satelliteData.ndvi_metrics.min_ndvi} - {satelliteData.ndvi_metrics.max_ndvi}</div>
            </div>
          </div>

          {/* 30-Day Trend */}
          {satelliteData.historical_trend_30d && satelliteData.historical_trend_30d.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>30-Day Satellite Growth Trend</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {satelliteData.historical_trend_30d.map((pt, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                    <strong>{pt.date.slice(5)}</strong>: {pt.ndvi_value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canopy Advisories */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Satellite Field Canopy Advisories</h4>
            {satelliteData.canopy_advisories.map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}>• {item}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
