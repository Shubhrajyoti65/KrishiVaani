import React, { useState, useEffect } from 'react';
import {
  User, Phone, MapPin, FlaskConical, History, Plus,
  CheckCircle, AlertCircle, Loader, Calendar, Sprout, Save,
  Search, X, UserPlus, RefreshCw, Layers, ShieldCheck, ArrowLeft,
  Edit3, Lock, Check, ChevronRight, FileText, Droplets
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATES = [
  'Odisha', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar',
  'West Bengal', 'Andhra Pradesh', 'Tamil Nadu', 'Karnataka',
  'Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Telangana', 'Assam'
];
const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy Loam', 'Clayey Loam', 'Loamy'];
const IRRIGATION_TYPES = ['Canal', 'Borewell', 'Drip', 'Sprinkler', 'Rain-fed'];

export default function FarmerProfileManager({ onBack }) {
  const { user, isAuthenticated, openAuth, updateProfile } = useAuth();

  const [phoneSearch, setPhoneSearch] = useState(() => user?.mobile || localStorage.getItem('krishivaani_farmer_phone') || '');
  const [modalPhone, setModalPhone] = useState(phoneSearch);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Editing Farm Details State
  const [isEditingFarm, setIsEditingFarm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    state: 'Odisha',
    district: 'Bhadrak',
    village: 'Kuansh',
    farm_size_acres: 4.5,
    soil_type: 'Alluvial',
    irrigation_source: 'Canal',
    primary_crops: 'Paddy, Mustard',
    preferred_language: 'en'
  });

  // Tabs inside profile
  const [activeTab, setActiveTab] = useState('soil-tests'); // 'soil-tests' | 'crops-history'

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

  const [soilTests, setSoilTests] = useState([]);
  const [cropHistory, setCropHistory] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync with authenticated user on mount or user change
  useEffect(() => {
    if (isAuthenticated && user?.mobile) {
      setPhoneSearch(user.mobile);
      handleLookup(user.mobile);
    } else {
      setFarmer(null);
    }
  }, [isAuthenticated, user?.mobile]);

  const handleLookup = async (phone) => {
    if (!phone || phone.trim() === '') return;
    const cleanPhone = phone.trim();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/farmers/phone/${cleanPhone}`);
      if (res.status === 404) {
        // Backend didn't find record yet -> construct from user auth data if available
        if (user && user.mobile === cleanPhone) {
          const fallback = {
            id: user.id || `farmer_${cleanPhone}`,
            name: user.name || 'Farmer Member',
            phone_number: cleanPhone,
            state: user.state || 'Odisha',
            district: user.district || 'Bhadrak',
            village: user.village || 'Kuansh',
            farm_size_acres: user.land_area_acres || 4.5,
            land_area_acres: user.land_area_acres || 4.5,
            soil_type: user.soil_type || 'Alluvial',
            irrigation_source: user.irrigation_source || 'Canal',
            primary_crops: Array.isArray(user.primary_crops) ? user.primary_crops : ['Paddy', 'Mustard'],
            preferred_language: user.preferred_language || 'en',
          };
          setFarmer(fallback);
          populateEditForm(fallback);
          loadLocalHistory(fallback.id);
        } else {
          setFarmer(null);
        }
        setPhoneSearch(cleanPhone);
        return;
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setFarmer(data);
      setPhoneSearch(cleanPhone);
      setModalPhone(cleanPhone);
      populateEditForm(data);
      localStorage.setItem('krishivaani_farmer_phone', cleanPhone);
      localStorage.setItem('krishivaani_farmer_id', data.id);
      fetchHistory(data.id);
    } catch (err) {
      console.warn("Backend lookup failed, loading local user profile:", err);
      if (user && user.mobile === cleanPhone) {
        const fallback = {
          id: user.id || `farmer_${cleanPhone}`,
          name: user.name || 'Farmer Member',
          phone_number: cleanPhone,
          state: user.state || 'Odisha',
          district: user.district || 'Bhadrak',
          village: user.village || 'Kuansh',
          farm_size_acres: user.land_area_acres || 4.5,
          land_area_acres: user.land_area_acres || 4.5,
          soil_type: user.soil_type || 'Alluvial',
          irrigation_source: user.irrigation_source || 'Canal',
          primary_crops: Array.isArray(user.primary_crops) ? user.primary_crops : ['Paddy', 'Mustard'],
          preferred_language: user.preferred_language || 'en',
        };
        setFarmer(fallback);
        populateEditForm(fallback);
        loadLocalHistory(fallback.id);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (data) => {
    setEditForm({
      name: data.name || '',
      state: data.state || 'Odisha',
      district: data.district || '',
      village: data.village || '',
      farm_size_acres: data.farm_size_acres || data.land_area_acres || 4.5,
      soil_type: data.soil_type || 'Alluvial',
      irrigation_source: data.irrigation_source || 'Canal',
      primary_crops: Array.isArray(data.primary_crops) ? data.primary_crops.join(', ') : (data.primary_crops || 'Paddy, Mustard'),
      preferred_language: data.preferred_language || 'en'
    });
  };

  const loadLocalHistory = (farmerId) => {
    try {
      const localSoil = localStorage.getItem(`krishivaani_soil_tests_${farmerId}`);
      if (localSoil) setSoilTests(JSON.parse(localSoil));
      const localCrop = localStorage.getItem(`krishivaani_crop_history_${farmerId}`);
      if (localCrop) setCropHistory(JSON.parse(localCrop));
    } catch {
      // ignore
    }
  };

  const fetchHistory = async (farmerId) => {
    try {
      const [soilRes, cropRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/farmers/${farmerId}/soil-tests`),
        fetch(`http://localhost:8000/api/v1/farmers/${farmerId}/farm-history`)
      ]);
      if (soilRes.ok) {
        const st = await soilRes.json();
        setSoilTests(st);
        localStorage.setItem(`krishivaani_soil_tests_${farmerId}`, JSON.stringify(st));
      } else {
        loadLocalHistory(farmerId);
      }
      if (cropRes.ok) {
        const ch = await cropRes.json();
        setCropHistory(ch);
        localStorage.setItem(`krishivaani_crop_history_${farmerId}`, JSON.stringify(ch));
      } else {
        loadLocalHistory(farmerId);
      }
    } catch (err) {
      console.warn("Failed to load farmer history from server:", err);
      loadLocalHistory(farmerId);
    }
  };

  // Save/Update Farm Details
  const handleSaveFarmDetails = async (e) => {
    e.preventDefault();
    if (!farmer) return;
    setActionLoading(true);
    setError(null);

    const cropsArray = editForm.primary_crops
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const updates = {
      name: editForm.name.trim(),
      state: editForm.state,
      district: editForm.district.trim(),
      village: editForm.village.trim(),
      land_area_acres: Number(editForm.farm_size_acres) || 1.0,
      farm_size_acres: Number(editForm.farm_size_acres) || 1.0,
      soil_type: editForm.soil_type,
      irrigation_source: editForm.irrigation_source,
      primary_crops: cropsArray,
      preferred_language: editForm.preferred_language,
    };

    try {
      // 1. Update Auth Context & Local storage
      if (updateProfile) {
        await updateProfile(updates);
      }

      // 2. Update Backend
      if (farmer.id) {
        try {
          await fetch(`http://localhost:8000/api/v1/farmers/${farmer.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (apiErr) {
          console.warn("Backend patch error:", apiErr);
        }
      }

      // 3. Update active farmer state
      setFarmer(prev => ({
        ...prev,
        ...updates
      }));

      setIsEditingFarm(false);
      setSuccessMsg('Farm & land details updated successfully! You can re-edit anytime.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update farm details');
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

      let newTest = null;
      try {
        const res = await fetch(`http://localhost:8000/api/v1/farmers/${farmer.id}/soil-tests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          newTest = await res.json();
        }
      } catch (err) {
        console.warn("Server offline, saving locally:", err);
      }

      if (!newTest) {
        newTest = {
          id: `soil_${Date.now()}`,
          farmer_id: farmer.id,
          ...payload,
          soil_health_category: payload.ph >= 6.5 && payload.ph <= 7.5 ? 'Optimal' : 'Needs Correction',
          created_at: new Date().toISOString()
        };
      }

      const updated = [newTest, ...soilTests];
      setSoilTests(updated);
      localStorage.setItem(`krishivaani_soil_tests_${farmer.id}`, JSON.stringify(updated));

      setSuccessMsg('Soil Health Card record logged successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
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

      let newRecord = null;
      try {
        const res = await fetch(`http://localhost:8000/api/v1/farmers/${farmer.id}/farm-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          newRecord = await res.json();
        }
      } catch (err) {
        console.warn("Server offline, saving harvest locally:", err);
      }

      if (!newRecord) {
        newRecord = {
          id: `harvest_${Date.now()}`,
          farmer_id: farmer.id,
          ...payload,
          yield_per_acre_quintals: (payload.yield_obtained_quintals / payload.area_acres).toFixed(1),
          created_at: new Date().toISOString()
        };
      }

      const updated = [newRecord, ...cropHistory];
      setCropHistory(updated);
      localStorage.setItem(`krishivaani_crop_history_${farmer.id}`, JSON.stringify(updated));

      setSuccessMsg('Harvest history recorded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="segment-header-box">
        <div className="segment-header-icon">
          <User size={24} />
        </div>
        <h2 className="segment-header-title">Farmer Profile & Soil Test Records</h2>
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

      {/* ══════════════════════════════════════════════════════════
           CONDITION 1: USER IS NOT REGISTERED / SIGNED IN
           Display beautiful registration gate card as requested
      ══════════════════════════════════════════════════════════ */}
      {!isAuthenticated && (
        <div
          className="card-glass"
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            marginBottom: '2rem',
            border: '1.5px solid var(--border-glass)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-xl)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 24px var(--green-glow)',
            }}
          >
            <Lock size={32} color="#ffffff" />
          </div>

          <span
            style={{
              display: 'inline-block',
              background: 'var(--green-bg)',
              color: 'var(--green-primary)',
              padding: '0.3rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.85rem',
              border: '1px solid var(--green-pale)',
            }}
          >
            Registration Required
          </span>

          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Register to Add Farm & Soil Reports
          </h3>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.98rem',
              maxWidth: '620px',
              margin: '0 auto 1.75rem',
              lineHeight: 1.65,
            }}
          >
            You can use KrishiVaani's <strong>Crop Recommendation</strong>, <strong>Weather Alerts</strong>, <strong>Disease Scanner</strong>, and <strong>Yield Estimators</strong> freely without registration.
            <br />
            To save your personalized land holdings, maintain soil fertility test cards, and track seasonal harvests, please register with your <strong>Name, Mobile Number, and Password</strong>.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => openAuth('register')}
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 16px var(--green-glow)',
              }}
            >
              <UserPlus size={18} />
              Register Now (Name & Mobile)
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => openAuth('login')}
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <User size={18} />
              Already Registered? Sign In
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            textAlign: 'left',
            marginTop: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-glass)',
          }}>
            <div style={{ background: 'var(--bg-section)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--green-primary)', fontWeight: 700, fontSize: '0.92rem' }}>
                <Sprout size={18} /> Land & Farm Details
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Record acreage, soil type, irrigation source, and village. Fully editable after saving.
              </p>
            </div>

            <div style={{ background: 'var(--bg-section)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--green-primary)', fontWeight: 700, fontSize: '0.92rem' }}>
                <FlaskConical size={18} /> Soil Health Reports
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Store official laboratory N-P-K tests, pH, organic carbon, and government advisories.
              </p>
            </div>

            <div style={{ background: 'var(--bg-section)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--green-primary)', fontWeight: 700, fontSize: '0.92rem' }}>
                <History size={18} /> Harvest & Revenue
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Track past seasonal crop yields and income to optimize next year's crop rotation plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isAuthenticated && loading && (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <Loader size={32} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Farmer Records...</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           CONDITION 2: USER IS AUTHENTICATED
           Show profile banner, editable farm details, and soil reports
      ══════════════════════════════════════════════════════════ */}
      {isAuthenticated && farmer && !loading && (
        <div>
          {/* Farmer Card Banner with Edit Details Action */}
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

                <span style={{
                  fontSize: '0.75rem',
                  background: '#22c55e',
                  color: '#ffffff',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}>
                  <ShieldCheck size={13} /> Verified Member
                </span>

                {/* Edit Farm Details Button */}
                <button
                  onClick={() => setIsEditingFarm(prev => !prev)}
                  style={{
                    background: isEditingFarm ? '#ffffff' : 'rgba(255,255,255,0.22)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: isEditingFarm ? 'var(--green-primary)' : '#ffffff',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.3rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                  }}
                  title="Edit farm land and crop details"
                >
                  <Edit3 size={13} /> {isEditingFarm ? 'Close Edit Form' : 'Edit Farm Details'}
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
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{farmer.farm_size_acres || farmer.land_area_acres || 4.5} Acres</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.6rem 1.1rem', borderRadius: '10px', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Soil Type</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{farmer.soil_type || 'Alluvial'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '0.6rem 1.1rem', borderRadius: '10px', textAlign: 'center', minWidth: '95px' }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Irrigation</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{farmer.irrigation_source || 'Canal'}</div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
               EDIT FARM DETAILS FORM (Toggled by "Edit Farm Details")
          ══════════════════════════════════════════════════ */}
          {isEditingFarm && (
            <div
              className="card"
              style={{
                marginBottom: '1.75rem',
                border: '2px solid var(--green-pale)',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Edit3 size={20} color="var(--green-primary)" />
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0, fontSize: '1.15rem' }}>
                    Edit Farm & Land Details
                  </h3>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditingFarm(false)}
                >
                  <X size={14} /> Cancel
                </button>
              </div>

              <form onSubmit={handleSaveFarmDetails}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {/* Farmer Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Farmer Full Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* State */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>State</label>
                    <select
                      className="form-select"
                      value={editForm.state}
                      onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                    >
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* District */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>District</label>
                    <input
                      className="form-input"
                      type="text"
                      value={editForm.district}
                      onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                      required
                    />
                  </div>

                  {/* Village */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Village / Panchayat</label>
                    <input
                      className="form-input"
                      type="text"
                      value={editForm.village}
                      onChange={e => setEditForm({ ...editForm, village: e.target.value })}
                    />
                  </div>

                  {/* Land Area */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Farm Size / Land Area (Acres)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1000"
                      value={editForm.farm_size_acres}
                      onChange={e => setEditForm({ ...editForm, farm_size_acres: e.target.value })}
                      required
                    />
                  </div>

                  {/* Soil Type */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dominant Soil Type</label>
                    <select
                      className="form-select"
                      value={editForm.soil_type}
                      onChange={e => setEditForm({ ...editForm, soil_type: e.target.value })}
                    >
                      {SOIL_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>

                  {/* Irrigation Source */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Irrigation Source</label>
                    <select
                      className="form-select"
                      value={editForm.irrigation_source}
                      onChange={e => setEditForm({ ...editForm, irrigation_source: e.target.value })}
                    >
                      {IRRIGATION_TYPES.map(ir => <option key={ir} value={ir}>{ir}</option>)}
                    </select>
                  </div>

                  {/* Primary Crops */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Primary Crops (comma separated)</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Paddy, Mustard, Wheat"
                      value={editForm.primary_crops}
                      onChange={e => setEditForm({ ...editForm, primary_crops: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditingFarm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={actionLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {actionLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub Navigation Tabs */}
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
                background: activeTab === 'soil-tests' ? 'var(--bg-card)' : 'transparent',
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
                background: activeTab === 'crops-history' ? 'var(--bg-card)' : 'transparent',
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
                  <Plus size={16} color="var(--green-primary)" /> Log Soil Health Test Report
                </h4>

                <form onSubmit={handleAddSoilTest}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Test Date</label>
                      <input className="form-input" type="date" value={soilForm.test_date} onChange={e => setSoilForm({ ...soilForm, test_date: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Testing Lab / Kendra</label>
                      <input className="form-input" type="text" value={soilForm.lab_name} onChange={e => setSoilForm({ ...soilForm, lab_name: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Nitrogen (N) kg/ha</label>
                      <input className="form-input" type="number" step="0.1" value={soilForm.nitrogen} onChange={e => setSoilForm({ ...soilForm, nitrogen: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Phosphorus (P) kg/ha</label>
                      <input className="form-input" type="number" step="0.1" value={soilForm.phosphorus} onChange={e => setSoilForm({ ...soilForm, phosphorus: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Potassium (K) kg/ha</label>
                      <input className="form-input" type="number" step="0.1" value={soilForm.potassium} onChange={e => setSoilForm({ ...soilForm, potassium: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Soil pH (0-14)</label>
                      <input className="form-input" type="number" step="0.1" min="0" max="14" value={soilForm.ph} onChange={e => setSoilForm({ ...soilForm, ph: Number(e.target.value) })} required />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Lab Recommendations / Notes</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Apply recommended MOP top-dressing, add vermicompost"
                      value={soilForm.recommendations}
                      onChange={e => setSoilForm({ ...soilForm, recommendations: e.target.value })}
                    />
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

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.8rem', background: 'var(--bg-card)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
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
                      <input className="form-input" type="text" value={cropForm.crop_name} onChange={e => setCropForm({ ...cropForm, crop_name: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Season</label>
                      <select className="form-select" value={cropForm.season} onChange={e => setCropForm({ ...cropForm, season: e.target.value })}>
                        <option value="Kharif">Kharif</option>
                        <option value="Rabi">Rabi</option>
                        <option value="Zaid">Zaid</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Year</label>
                      <input className="form-input" type="number" value={cropForm.year} onChange={e => setCropForm({ ...cropForm, year: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Harvest (Quintals)</label>
                      <input className="form-input" type="number" step="0.1" value={cropForm.yield_quintals} onChange={e => setCropForm({ ...cropForm, yield_quintals: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Selling Price (₹/Q)</label>
                      <input className="form-input" type="number" value={cropForm.market_price_per_quintal_inr} onChange={e => setCropForm({ ...cropForm, market_price_per_quintal_inr: Number(e.target.value) })} />
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
              background: 'var(--bg-card)',
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
