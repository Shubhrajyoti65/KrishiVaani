import React, { useState, useEffect } from 'react';
import { CloudSun, Thermometer, Droplets, Wind, CloudRain, AlertTriangle, CheckCircle2, Search, Loader2 } from 'lucide-react';

export default function WeatherWidget() {
  const [district, setDistrict] = useState('Cuttack');
  const [state, setState] = useState('Odisha');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/weather/current?district=${district}&state=${state}`);
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CloudSun color="#f59e0b" size={24} /> Weather & Agromet Safety Alerts
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time climate metrics, 5-day forecast, and extreme hazard advisories
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District"
            style={{ width: '130px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          />
          <input
            type="text"
            className="form-input"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            style={{ width: '130px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          />
          <button className="btn-primary" onClick={fetchWeather} disabled={loading} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Update
          </button>
        </div>
      </div>

      {weatherData && (
        <div>
          {/* Active Alerts Banner */}
          {weatherData.active_alerts && weatherData.active_alerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                background: alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : alert.severity === 'WARNING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                border: `1px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'WARNING' ? '#f59e0b' : '#3b82f6'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              <AlertTriangle size={22} color={alert.severity === 'CRITICAL' ? '#f87171' : alert.severity === 'WARNING' ? '#fbbf24' : '#60a5fa'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span className={`badge ${alert.severity === 'CRITICAL' ? 'badge-danger' : alert.severity === 'WARNING' ? 'badge-warning' : 'badge-info'}`}>
                    {alert.alert_type}
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{alert.title}</h4>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{alert.description}</p>
                <p style={{ fontSize: '0.83rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  💡 Farmer Action: {alert.farmer_actionable_advice}
                </p>
              </div>
            </div>
          ))}

          {/* Current Weather Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <Thermometer size={16} color="#ef4444" /> Temperature
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{weatherData.current.temperature_c}°C</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Feels like {weatherData.current.feels_like_c}°C</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <Droplets size={16} color="#3b82f6" /> Humidity
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{weatherData.current.humidity_percent}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relative Humidity</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <CloudRain size={16} color="#06b6d4" /> Rainfall
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{weatherData.current.rainfall_mm} mm</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precipitation today</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <Wind size={16} color="#a855f7" /> Wind Speed
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{weatherData.current.wind_speed_kmh} km/h</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Surface Wind</div>
            </div>
          </div>

          {/* 5-Day Forecast Grid */}
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>5-Day Agricultural Forecast</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
            {weatherData.forecast_5day.map((day, idx) => (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>{day.date.slice(5)}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{day.min_temp_c}° - {day.max_temp_c}°C</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>🌧️ {day.rain_probability_percent}% ({day.rainfall_mm}mm)</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
