import React, { useState } from 'react';
import { CloudSun, Wind, Droplets, Thermometer, AlertTriangle, RefreshCw, MapPin, Eye } from 'lucide-react';

const CITIES = ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Amritsar'];

const MOCK_WEATHER = {
  Delhi: { temp: 34, humidity: 52, wind_speed: 14, description: 'Partly Cloudy', condition: 'normal', feels_like: 37, visibility: 8, pressure: 1008 },
  Mumbai: { temp: 29, humidity: 85, wind_speed: 22, description: 'Humid & Cloudy', condition: 'normal', feels_like: 33, visibility: 6, pressure: 1012 },
  Kolkata: { temp: 31, humidity: 78, wind_speed: 18, description: 'Partly Cloudy', condition: 'normal', feels_like: 36, visibility: 7, pressure: 1007 },
  default: { temp: 27, humidity: 65, wind_speed: 12, description: 'Clear Sky', condition: 'normal', feels_like: 29, visibility: 10, pressure: 1010 },
};

const CONDITION_ICON = {
  heatwave: '🌡️',
  frost:    '❄️',
  flood:    '🌊',
  normal:   '🌤️',
};

const CONDITION_COLOR = {
  heatwave: { bg: '#fde8e3', border: '#f0b8a8', text: '#c04a30' },
  frost:    { bg: '#e8f0fa', border: '#c8d8f0', text: '#2563eb' },
  flood:    { bg: '#e8f0fa', border: '#93c5fd', text: '#1d4ed8' },
  normal:   { bg: 'var(--green-bg)', border: 'var(--green-pale)', text: 'var(--green-primary)' },
};

export default function WeatherWidget({ compact }) {
  const [city,    setCity]    = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [advisory, setAdvisory] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Try real API first, fall back to mock
      const res = await fetch(`http://localhost:8000/api/v1/weather/current?city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const d = await res.json();
        setWeather(d.weather); setAdvisory(d.advisory);
      } else {
        throw new Error('fallback');
      }
    } catch {
      // Use mock data
      const mock = MOCK_WEATHER[city] || MOCK_WEATHER.default;
      setWeather(mock);
      const cond = mock.temp > 40 ? 'heatwave' : mock.temp < 5 ? 'frost' : 'normal';
      setAdvisory({
        condition: cond,
        message: cond === 'heatwave' ? '⚠️ Extreme heat — irrigate crops in early morning or evening only.'
                : cond === 'frost'   ? '⚠️ Frost risk — protect seedlings with mulching tonight.'
                : '✅ Conditions are good for most field operations today.',
        farming_tips: ['Check soil moisture before irrigation', 'Avoid pesticide spraying during high winds'],
      });
    } finally {
      setLoading(false);
    }
  };

  const cond = advisory?.condition || 'normal';
  const cc = CONDITION_COLOR[cond] || CONDITION_COLOR.normal;

  if (compact) {
    return (
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
            <select className="form-select" style={{ maxWidth: 180 }} value={city} onChange={e => setCity(e.target.value)}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={fetchWeather} disabled={loading}>
              {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
              {loading ? 'Loading' : 'Fetch'}
            </button>
          </div>
          {weather && (
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div className="stat-block">
                <div className="stat-number">{weather.temp}°C</div>
                <div className="stat-label">Temperature</div>
              </div>
              <div className="stat-block">
                <div className="stat-number" style={{ color: '#2563eb' }}>{weather.humidity}%</div>
                <div className="stat-label">Humidity</div>
              </div>
              <div className="stat-block">
                <div className="stat-number" style={{ color: 'var(--gold)' }}>{weather.wind_speed}</div>
                <div className="stat-label">Wind km/h</div>
              </div>
            </div>
          )}
          {!weather && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select a city and click Fetch to load weather data.</p>}
        </div>
        {advisory && (
          <div style={{ background: cc.bg, border: `1.5px solid ${cc.border}`, borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
            <div style={{ fontWeight: 700, color: cc.text, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {CONDITION_ICON[cond]} Farming Advisory
            </div>
            <p style={{ fontSize: '0.875rem', color: cc.text, lineHeight: 1.6 }}>{advisory.message}</p>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">Live Data</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Weather & Farming Advisory</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Get real-time weather data and AI farming advisories including heatwave, frost and flood alerts.
        </p>
      </div>

      {/* City selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="var(--green-primary)" />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Select City:</span>
          </div>
          <select className="form-select" style={{ maxWidth: 220 }} value={city} onChange={e => setCity(e.target.value)}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={fetchWeather} disabled={loading}>
            {loading
              ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</>
              : <><RefreshCw size={16} /> Get Weather Advisory</>}
          </button>
        </div>
      </div>

      {/* Weather data */}
      {weather && (
        <div className="animate-fade-in-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: Thermometer, label: 'Temperature', value: `${weather.temp}°C`, sub: `Feels ${weather.feels_like ?? weather.temp}°C`, color: '#ef4444' },
              { icon: Droplets,    label: 'Humidity',     value: `${weather.humidity}%`, sub: 'Relative humidity', color: '#2563eb' },
              { icon: Wind,        label: 'Wind Speed',   value: `${weather.wind_speed} km/h`, sub: weather.description, color: 'var(--green-primary)' },
              { icon: Eye,         label: 'Visibility',   value: `${weather.visibility ?? 8} km`, sub: `Pressure ${weather.pressure ?? 1010} hPa`, color: 'var(--gold)' },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, background: `${color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={color} />
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Advisory */}
          {advisory && (
            <div style={{ background: cc.bg, border: `2px solid ${cc.border}`, borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.75rem' }}>{CONDITION_ICON[cond]}</div>
                <div>
                  <div style={{ fontWeight: 700, color: cc.text, fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                    {cond === 'normal' ? 'Conditions Favourable' : `${cond.charAt(0).toUpperCase() + cond.slice(1)} Alert`}
                  </div>
                  <p style={{ color: cc.text, fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>{advisory.message}</p>
                  {advisory.farming_tips?.length > 0 && (
                    <ul style={{ paddingLeft: '1.2rem' }}>
                      {advisory.farming_tips.map((tip, i) => (
                        <li key={i} style={{ color: cc.text, fontSize: '0.875rem', marginBottom: '0.3rem' }}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!weather && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'var(--green-bg)' }}>
          <CloudSun size={48} color="var(--green-primary)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Select a City</h3>
          <p style={{ color: 'var(--text-muted)' }}>Choose your district or nearest city to get live weather and farming advisory.</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
