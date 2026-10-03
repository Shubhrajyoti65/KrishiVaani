import React, { useState, useEffect } from 'react';
import {
  User, Phone, MapPin, FlaskConical, History, Plus,
  CheckCircle, AlertCircle, Loader, Calendar, Sprout, Save,
  Search, X, UserPlus, RefreshCw, Layers, ShieldCheck, ArrowLeft
} from 'lucide-react';

const STATES = [
  'Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar', 'Odisha',
  'West Bengal', 'Andhra Pradesh', 'Tamil Nadu', 'Karnataka',
  'Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh'
];
const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy Loam', 'Clayey Loam', 'Loamy'];
const IRRIGATION_TYPES = ['Canal', 'Borewell', 'Drip', 'Sprinkler', 'Rain-fed'];

export default function FarmerProfileManager({ onBack }) {
  const [phoneSearch, setPhoneSearch] = useState(() => localStorage.getItem('krishivaani_farmer_phone') || '6371818655');
  const [modalPhone, setModalPhone]   = useState(phoneSearch);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [farmer, setFarmer]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [successMsg, setSuccessMsg]   = useState(null);

  // Tabs inside profile
  const [activeTab, setActiveTab] = useState('soil-tests'); // 'soil-tests' | 'crops-history'

  // New Farmer Registration Form
  const [regForm, setRegForm] = useState({
    name: 'Shubhrajyoti Mohanty',
    phone_number: '6371818655',
    state: 'Odisha',
    district: 'Bhadrak',
    village: 'Kuansh',
    land_area_acres: 4.5,
    farm_size_acres: 4.5,
    soil_type: 'Alluvial',
    irrigation_source: 'Canal',
    primary_crops: ['Paddy', 'Mustard'],
    preferred_language: 'en'
  });

  // New Soil Test Form
  const [soilForm, setSoilForm] = useState({
    test_date: new Date().toISOString().split('T')[0],
    lab_name: 'District Soil Testing Lab',
    nitrogen: 78.5,
    phosphorus: 42.0,
    potassium: 36.5,
    ph: 7.2,
    temperature: 25.0,
    humidity: 65.0,
    rainfall: 120.0,
    organic_carbon_percent: 0.55,
    electrical_conductivity: 0.35,
    recommendations: 'Apply recommended MOP top-dressing.'
  });

  // New Crop Harvest Form
  const [cropForm, setCropForm] = useState({
    crop_name: 'Rice (Paddy)',
    season: 'Kharif',
    year: 2024,
    area_acres: 4.0,
    yield_quintals: 84.0,
    market_price_per_quintal_inr: 2300.0,
    cost_incurred_inr: 45000.0,
    gross_return_inr: 193200.0,
    notes: 'Good harvest with optimal canal irrigation.'
  });

  const [soilTests, setSoilTests]       = useState([]);
  const [cropHistory, setCropHistory]   = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Farmer by Phone on initial mount
  useEffect(() => {
    if (phoneSearch) {
      handleLookup(phoneSearch);
    }
  }, []);

  const handleLookup = async (phone) => {
    if (!phone || phone.trim() === '') return;
    const cleanPhone = phone.trim();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/farmers/phone/${cleanPhone}`);
      if (res.status === 404) {
        setFarmer(null);
        setPhoneSearch(cleanPhone);
        return;
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setFarmer(data);
      setPhoneSearch(cleanPhone);
      setModalPhone(cleanPhone);
      localStorage.setItem('krishivaani_farmer_phone', cleanPhone);
      localStorage.setItem('krishivaani_farmer_id', data.id);
      fetchHistory(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (farmerId) => {
    try {
      const [soilRes, cropRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/farmers/${farmerId}/soil-tests`),
        fetch(`http://localhost:8000/api/v1/farmers/${farmerId}/farm-history`)
      ]);
      if (soilRes.ok) setSoilTests(await soilRes.json());
      if (cropRes.ok) setCropHistory(await cropRes.json());
    } catch (err) {
      console.error("Failed to load farmer history:", err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const payload = {
        ...regForm,
        land_area_acres: Number(regForm.land_area_acres || regForm.farm_size_acres || 1.0)
      };
      const res = await fetch('http://localhost:8000/api/v1/farmers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Registration failed');
      }
      const data = await res.json();
      setFarmer(data);
      setPhoneSearch(data.phone_number);
      setModalPhone(data.phone_number);
      localStorage.setItem('krishivaani_farmer_phone', data.phone_number);
      localStorage.setItem('krishivaani_farmer_id', data.id);
      setSuccessMsg('Farmer profile registered successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchHistory(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSoilTest = async (e) => {
    e.preventDefault();
    if (!farmer) return;
    setActionLoading(true);
    try {
      const payload = {
        ...soilForm,
        notes: soilForm.recommendations || 'Soil test logged'
      };
      const res = await fetch(`http://localhost:8000/api/v1/farmers/${farmer.id}/soil-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to log soil test');
      }
      const newTest = await res.json();
      setSuccessMsg('Soil test logged successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchHistory(farmer.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCropHistory = async (e) => {
    e.preventDefault();
    if (!farmer) return;
    setActionLoading(true);
    try {
      const payload = {
        crop: cropForm.crop_name,
        season: cropForm.season,
        year: Number(cropForm.year),
        area_acres: Number(cropForm.area_acres),
        yield_obtained_quintals: Number(cropForm.yield_quintals),
        production_cost_inr: Number(cropForm.cost_incurred_inr || 0),
        revenue_inr: Number(cropForm.gross_return_inr || (cropForm.yield_quintals * (cropForm.market_price_per_quintal_inr || 0))),
        soil_condition_note: cropForm.notes
      };
      const res = await fetch(`http://localhost:8000/api/v1/farmers/${farmer.id}/farm-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to log crop history');
      }
      setSuccessMsg('Harvest history recorded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchHistory(farmer.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
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
            Digital Farm Management
          </span>
        </div>
        <h2 className="heading-lg" style={{ marginBottom: '0.4rem' }}>Farmer Profile & Soil Test Records</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Store your land holdings, maintain historical soil health card laboratory tests, and track seasonal harvest records.
        </p>
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '1.5rem', color: '#b91c1c', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '1.5rem', color: '#166534', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <Loader size={32} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Farmer Records...</div>
        </div>
      )}

      {/* Profile Not Found -> Lookup & Registration Form */}
      {!farmer && !loading && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={22} color="var(--green-primary)" />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.2rem' }}>
                Farmer Profile Lookup & Registration
              </h3>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setModalPhone(''); setShowSearchModal(true); }}
            >
              <Search size={14} /> Search Another Number
            </button>
          </div>

          {/* Quick Lookup Bar */}
          <div style={{ background: 'var(--bg-section)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
              <Phone size={18} color="var(--green-primary)" />
              <input
                className="form-input"
                type="text"
                placeholder="Enter 10-digit mobile number (e.g. 6371818655)"
                value={phoneSearch}
                onChange={e => setPhoneSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleLookup(phoneSearch)}
              disabled={loading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
              Search Profile
            </button>
          </div>

          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
              Create New Farmer Profile
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              No profile found for <strong>{phoneSearch}</strong>. Register your farm details below to store soil health cards and unlock tailored AI recommendations.
            </p>

            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input className="form-input" type="text" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" type="text" value={regForm.phone_number} onChange={e => setRegForm({...regForm, phone_number: e.target.value})} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">State</label>
                  <select className="form-select" value={regForm.state} onChange={e => setRegForm({...regForm, state: e.target.value})}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">District</label>
                  <input className="form-input" type="text" value={regForm.district} onChange={e => setRegForm({...regForm, district: e.target.value})} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Village</label>
                  <input className="form-input" type="text" value={regForm.village} onChange={e => setRegForm({...regForm, village: e.target.value})} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Farm Size (Acres)</label>
                  <input className="form-input" type="number" step="0.1" value={regForm.farm_size_acres} onChange={e => setRegForm({...regForm, farm_size_acres: Number(e.target.value)})} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Soil Type</label>
                  <select className="form-select" value={regForm.soil_type} onChange={e => setRegForm({...regForm, soil_type: e.target.value})}>
                    {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Irrigation Source</label>
                  <select className="form-select" value={regForm.irrigation_source} onChange={e => setRegForm({...regForm, irrigation_source: e.target.value})}>
                    {IRRIGATION_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={actionLoading}>
                {actionLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {actionLoading ? ' Saving Profile...' : ' Save Profile & Start Tracking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Found -> Display Card & Subtabs */}
      {farmer && !loading && (
        <div>
          {/* Farmer Card Banner with sleek Search/Switch Option */}
          <div style={{
            background: 'linear-gradient(135deg, var(--green-primary), #1a421a)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            marginBottom: '1.75rem',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 8px 30px rgba(28,43,26,0.18)',
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  background: 'rgba(255,255,255,0.15)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  FARMER ID: {farmer.id}
                </span>

                {/* Option to Search / Switch Users */}
                <button
                  onClick={() => {
                    setModalPhone(farmer.phone_number || '');
                    setShowSearchModal(true);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.25rem 0.8rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.32)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                  title="Search or switch to another farmer profile"
                >
                  <Search size={13} /> Search Users
                </button>
              </div>

              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.15 }}>
                {farmer.name}
              </div>

              <div style={{ fontSize: '0.88rem', opacity: 0.9, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <span>📍 {farmer.village ? `${farmer.village}, ` : ''}{farmer.district}, {farmer.state}</span>
                <span>📞 {farmer.phone_number}</span>
              </div>
            </div>

            {/* Quick Farm Metric Badges */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.6rem 1.1rem', borderRadius: '10px', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Land Holding</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{farmer.farm_size_acres} Acres</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.6rem 1.1rem', borderRadius: '10px', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Soil Type</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{farmer.soil_type}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.6rem 1.1rem', borderRadius: '10px', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Irrigation</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{farmer.irrigation_source}</div>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-section)', padding: '0.35rem', borderRadius: '10px', width: 'fit-content' }}>
            <button
              onClick={() => setActiveTab('soil-tests')}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: activeTab === 'soil-tests' ? '#fff' : 'transparent',
                color: activeTab === 'soil-tests' ? 'var(--green-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'soil-tests' ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                transition: 'all 0.15s ease',
              }}
            >
              <FlaskConical size={16} /> Soil Health Cards ({soilTests.length})
            </button>
            <button
              onClick={() => setActiveTab('crops-history')}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: activeTab === 'crops-history' ? '#fff' : 'transparent',
                color: activeTab === 'crops-history' ? 'var(--green-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'crops-history' ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Sprout size={16} /> Harvest History ({cropHistory.length})
            </button>
          </div>

          {/* ══════════════════════════════════════
               SUB-TAB 1: SOIL HEALTH TESTS
          ══════════════════════════════════════ */}
          {activeTab === 'soil-tests' && (
            <div>
              {/* Add New Soil Test Card */}
              <div className="card" style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={16} color="var(--green-primary)" /> Log Soil Health Test
                </h4>

                <form onSubmit={handleAddSoilTest}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Test Date</label>
                      <input className="form-input" type="date" value={soilForm.test_date} onChange={e => setSoilForm({...soilForm, test_date: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Testing Lab</label>
                      <input className="form-input" type="text" value={soilForm.lab_name} onChange={e => setSoilForm({...soilForm, lab_name: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Nitrogen (N) kg/ha</label>
                      <input className="form-input" type="number" step="0.1" value={soilForm.nitrogen} onChange={e => setSoilForm({...soilForm, nitrogen: Number(e.target.value)})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Phosphorus (P) kg/ha</label>
                      <input className="form-input" type="number" step="0.1" value={soilForm.phosphorus} onChange={e => setSoilForm({...soilForm, phosphorus: Number(e.target.value)})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Potassium (K) kg/ha</label>
                      <input className="form-input" type="number" step="0.1" value={soilForm.potassium} onChange={e => setSoilForm({...soilForm, potassium: Number(e.target.value)})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Soil pH</label>
                      <input className="form-input" type="number" step="0.1" value={soilForm.ph} onChange={e => setSoilForm({...soilForm, ph: Number(e.target.value)})} required />
                    </div>
                  </div>

                  <button className="btn btn-primary btn-sm" type="submit" disabled={actionLoading}>
                    {actionLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                    Record Soil Test
                  </button>
                </form>
              </div>

              {/* History Table */}
              <div className="card">
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>
                  Recorded Soil Health Card History
                </h4>

                {soilTests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No soil test records yet. Add one above to begin tracking soil fertility trends.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {soilTests.map(test => (
                      <div key={test.id} style={{ background: 'var(--bg-section)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            📅 {test.test_date} · <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{test.lab_name || 'Agri Lab'}</span>
                          </span>
                          <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                            {test.soil_health_category || 'Normal'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.8rem', background: '#fff', padding: '0.6rem', borderRadius: '6px' }}>
                          <div><strong>N:</strong> {test.nitrogen} kg/ha</div>
                          <div><strong>P:</strong> {test.phosphorus} kg/ha</div>
                          <div><strong>K:</strong> {test.potassium} kg/ha</div>
                          <div><strong>pH:</strong> {test.ph}</div>
                        </div>

                        {test.recommendations && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <strong>Lab Recommendation:</strong> {test.recommendations}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
               SUB-TAB 2: HARVEST HISTORY
          ══════════════════════════════════════ */}
          {activeTab === 'crops-history' && (
            <div>
              {/* Add Harvest History */}
              <div className="card" style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={16} color="var(--green-primary)" /> Record Seasonal Harvest
                </h4>

                <form onSubmit={handleAddCropHistory}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Crop</label>
                      <input className="form-input" type="text" value={cropForm.crop_name} onChange={e => setCropForm({...cropForm, crop_name: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Season</label>
                      <select className="form-select" value={cropForm.season} onChange={e => setCropForm({...cropForm, season: e.target.value})}>
                        <option value="Kharif">Kharif</option>
                        <option value="Rabi">Rabi</option>
                        <option value="Zaid">Zaid</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Year</label>
                      <input className="form-input" type="number" value={cropForm.year} onChange={e => setCropForm({...cropForm, year: Number(e.target.value)})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Harvest (Quintals)</label>
                      <input className="form-input" type="number" step="0.1" value={cropForm.yield_quintals} onChange={e => setCropForm({...cropForm, yield_quintals: Number(e.target.value)})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Selling Price (₹/Q)</label>
                      <input className="form-input" type="number" value={cropForm.market_price_per_quintal_inr} onChange={e => setCropForm({...cropForm, market_price_per_quintal_inr: Number(e.target.value)})} />
                    </div>
                  </div>

                  <button className="btn btn-primary btn-sm" type="submit" disabled={actionLoading}>
                    {actionLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                    Record Harvest
                  </button>
                </form>
              </div>

              {/* History Table */}
              <div className="card">
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>
                  Seasonal Harvest History
                </h4>

                {cropHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No harvest records yet. Add past seasonal crops to monitor your field yield performance.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cropHistory.map(record => (
                      <div key={record.id} style={{ background: 'var(--bg-section)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--green-primary)' }}>
                            {record.crop || record.crop_name} · <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{record.season} {record.year}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Harvested: <strong>{record.yield_obtained_quintals ?? record.yield_quintals} Quintals</strong> across {record.area_acres} Acres
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            ₹{record.revenue_inr ? Number(record.revenue_inr).toLocaleString('en-IN') : (record.market_price_per_quintal_inr ? ((record.yield_obtained_quintals ?? record.yield_quintals) * record.market_price_per_quintal_inr).toLocaleString('en-IN') : '—')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {record.yield_per_acre_quintals ? `${record.yield_per_acre_quintals} Q/acre` : (record.market_price_per_quintal_inr ? `@ ₹${record.market_price_per_quintal_inr}/Q` : '')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Search / Switch User Modal Dialog ── */}
      {showSearchModal && (
        <div
          onClick={() => setShowSearchModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(28, 43, 26, 0.55)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={18} color="var(--green-primary)" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Search / Switch Farmer
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Look up profile records by mobile number
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleLookup(modalPhone);
                setShowSearchModal(false);
              }}
            >
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.82rem' }}>Mobile Number</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. 6371818655 or 9876543210"
                    value={modalPhone}
                    onChange={e => setModalPhone(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSearchModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                >
                  {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                  Find Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
