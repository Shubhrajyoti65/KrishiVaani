import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Search, Loader, Info, CheckCircle, AlertCircle, Calendar, Layers, ShieldCheck, Sprout, ArrowLeft } from 'lucide-react';
import { AGRI_IMAGES } from '../data/agriImages';

const CROPS  = ['rice','wheat','maize','cotton','mustard','soybean','chickpea','sugarcane','potato','groundnut'];
const SOILS  = ['Alluvial','Black','Red','Laterite','Sandy Loam','Clayey Loam','Loamy'];
const STATES = ['Punjab','Haryana','Uttar Pradesh','Bihar','Odisha','West Bengal','Andhra Pradesh','Tamil Nadu','Karnataka','Maharashtra','Gujarat','Rajasthan','Madhya Pradesh'];

const PRIORITY_COLOR = { 1: 'var(--green-primary)', 2: '#2563eb', 3: 'var(--gold)', 4: 'var(--text-muted)' };
const PRIORITY_BG    = { 1: 'var(--green-bg)', 2: 'rgba(37, 99, 235, 0.16)', 3: 'var(--gold-pale)', 4: 'var(--bg-section)' };

export default function CropRotation({ onBack }) {
  const [activeMode, setActiveMode] = useState('multi-year'); // 'single-year' | 'multi-year'

  // Single-year quick rotation state
  const [prevCrop, setPrevCrop] = useState('rice');
  const [soilType, setSoilType] = useState('Alluvial');
  const [state, setState]       = useState('Punjab');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  // 3-Year Planning state
  const [district, setDistrict]                 = useState('Ludhiana');
  const [currentSeason, setCurrentSeason]       = useState('Kharif');
  const [waterAvail, setWaterAvail]             = useState('Canal');
  const [soilGoal, setSoilGoal]                 = useState('balanced_health');
  const [hasSoilTest, setHasSoilTest]           = useState(false);
  const [nitrogen, setNitrogen]                 = useState(75);
  const [phosphorus, setPhosphorus]             = useState(38);
  const [potassium, setPotassium]               = useState(40);
  const [ph, setPh]                             = useState(7.2);
  const [multiYearPlan, setMultiYearPlan]       = useState(null);
  const [multiYearLoading, setMultiYearLoading] = useState(false);
  const [multiYearError, setMultiYearError]     = useState(null);

  const multiYearRef = useRef(null);
  const singleYearRef = useRef(null);

  useEffect(() => {
    if (multiYearPlan && multiYearRef.current) {
      multiYearRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [multiYearPlan]);

  useEffect(() => {
    if (result && singleYearRef.current) {
      singleYearRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleSearchSingle = async () => {
    setLoading(true);
    try {
      const url = `http://localhost:8000/api/v1/crop-rotation/?previous_crop=${prevCrop}&soil_type=${encodeURIComponent(soilType)}&state=${encodeURIComponent(state)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate3YearPlan = async () => {
    setMultiYearLoading(true);
    setMultiYearError(null);
    try {
      const payload = {
        state,
        district,
        current_season: currentSeason,
        has_actual_soil_test: hasSoilTest,
        soil_type: soilType,
        water_availability: waterAvail,
        previous_crop: prevCrop.charAt(0).toUpperCase() + prevCrop.slice(1),
        soil_improvement_goal: soilGoal,
        ...(hasSoilTest ? {
          nitrogen: Number(nitrogen),
          phosphorus: Number(phosphorus),
          potassium: Number(potassium),
          ph: Number(ph),
        } : {})
      };

      const res = await fetch('http://localhost:8000/api/v1/crop-planning/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setMultiYearPlan(data);
    } catch (err) {
      setMultiYearError(err.message || 'Failed to generate 3-year plan.');
    } finally {
      setMultiYearLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
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
            Soil Health & Multi-Year Strategy
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Science-backed crop sequence planning to break pest cycles, replenish soil nutrients, and maximize long-term farm productivity.
        </p>

        {/* Havens-Inspired Soil Health & Rotation Banner */}
        <div
          className="card-glass"
          style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: `linear-gradient(135deg, rgba(7, 19, 15, 0.88) 0%, rgba(13, 33, 26, 0.82) 100%), url("${AGRI_IMAGES.rotationYear3}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '1.75rem 2rem',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-glass)',
          }}
        >
          <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
            <span
              className="badge"
              style={{
                background: 'rgba(139, 92, 246, 0.22)',
                color: '#c4b5fd',
                border: '1px solid rgba(196, 181, 253, 0.35)',
                marginBottom: '0.75rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              🔄 3-Year Agronomic Soil Restoration Model
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
              Regenerative Crop Sequencing & Soil Microbiology
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(240, 247, 243, 0.85)', lineHeight: 1.6, margin: 0 }}>
              Break weed and fungal pathogen cycles, maximize organic nitrogen fixation, and sustain multi-year field productivity with state-specific crop rotations.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', background: 'var(--bg-section)', padding: '0.35rem', borderRadius: '10px', width: 'fit-content' }}>
        <button
          onClick={() => setActiveMode('multi-year')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: activeMode === 'multi-year' ? '1px solid var(--border-glass)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: activeMode === 'multi-year' ? 'var(--bg-card)' : 'transparent',
            color: activeMode === 'multi-year' ? 'var(--green-primary)' : 'var(--text-muted)',
            boxShadow: activeMode === 'multi-year' ? 'var(--shadow-sm)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.2s',
          }}
        >
          <Calendar size={16} /> 3-Year Sequence & Soil Health Plan
        </button>
        <button
          onClick={() => setActiveMode('single-year')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: activeMode === 'single-year' ? '1px solid var(--border-glass)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: activeMode === 'single-year' ? 'var(--bg-card)' : 'transparent',
            color: activeMode === 'single-year' ? 'var(--green-primary)' : 'var(--text-muted)',
            boxShadow: activeMode === 'single-year' ? 'var(--shadow-sm)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={16} /> Quick Next-Crop Rotation
        </button>
      </div>

      {/* ══════════════════════════════════════
           TAB 1: 3-YEAR MULTI-YEAR PLANNER
      ══════════════════════════════════════ */}
      {activeMode === 'multi-year' && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
              Field & Soil Profile Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">State</label>
                <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">District</label>
                <input className="form-input" type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Ludhiana" />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Previous Harvested Crop</label>
                <select className="form-select" value={prevCrop} onChange={e => setPrevCrop(e.target.value)}>
                  {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Current Planning Season</label>
                <select className="form-select" value={currentSeason} onChange={e => setCurrentSeason(e.target.value)}>
                  <option value="Kharif">Kharif (Monsoon / Summer)</option>
                  <option value="Rabi">Rabi (Winter / Spring)</option>
                  <option value="Zaid">Zaid (Summer)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Soil Type</label>
                <select className="form-select" value={soilType} onChange={e => setSoilType(e.target.value)}>
                  {SOILS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Water Source</label>
                <select className="form-select" value={waterAvail} onChange={e => setWaterAvail(e.target.value)}>
                  <option value="Canal">Canal Irrigation</option>
                  <option value="Borewell">Borewell / Tube-well</option>
                  <option value="Drip">Drip / Micro-irrigation</option>
                  <option value="Rain-fed">Rain-fed</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Soil Improvement Goal</label>
                <select className="form-select" value={soilGoal} onChange={e => setSoilGoal(e.target.value)}>
                  <option value="balanced_health">Balanced Nutrient Replenishment</option>
                  <option value="increase_organic_carbon">Increase Soil Organic Carbon</option>
                  <option value="fix_nitrogen">Atmospheric Nitrogen Fixation (Legumes)</option>
                  <option value="reduce_salinity">Reclaim Alkaline / Saline Soil</option>
                </select>
              </div>
            </div>

            {/* Optional Actual Soil Test Toggle */}
            <div style={{ background: 'var(--bg-section)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  checked={hasSoilTest}
                  onChange={e => setHasSoilTest(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--green-primary)' }}
                />
                I have an actual Laboratory Soil Test (Soil Health Card)
              </label>

              {hasSoilTest && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Nitrogen (N) kg/ha</label>
                    <input className="form-input" type="number" value={nitrogen} onChange={e => setNitrogen(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Phosphorus (P) kg/ha</label>
                    <input className="form-input" type="number" value={phosphorus} onChange={e => setPhosphorus(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Potassium (K) kg/ha</label>
                    <input className="form-input" type="number" value={potassium} onChange={e => setPotassium(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Soil pH</label>
                    <input className="form-input" type="number" step="0.1" value={ph} onChange={e => setPh(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerate3YearPlan}
              disabled={multiYearLoading}
              style={{ padding: '0.8rem 1.8rem' }}
            >
              {multiYearLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={18} />}
              {multiYearLoading ? ' Generating 3-Year Strategy...' : ' Generate 3-Year Plan & Soil Strategy'}
            </button>
          </div>

          {/* 3-Year Plan Results */}
          {multiYearLoading && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
              <Loader size={44} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Calculating agronomic rotation sequence and ICAR soil health guidelines…</p>
            </div>
          )}

          {multiYearPlan && !multiYearLoading && (
            <div ref={multiYearRef} className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
              {/* Calculation Status Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                color: '#166534',
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                boxShadow: '0 2px 8px rgba(22, 101, 52, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <CheckCircle size={15} />
                  </span>
                  <span>3-Year Rotation Plan Generated — Agronomic Sequence & Soil Strategy Ready</span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
                  Strategy Ready
                </span>
              </div>

              {/* Strategy Header */}
              <div style={{ background: 'linear-gradient(135deg, var(--green-primary), #235223)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.75rem', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                      Location: {multiYearPlan.location} · Following {multiYearPlan.previous_crop}
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800 }}>
                      3-Year Strategic Cropping Sequence
                    </div>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {multiYearPlan.soil_source_label}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                  {multiYearPlan.agronomic_summary}
                </p>
              </div>

              {/* 3 Yearly Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {multiYearPlan.three_year_plan.map((item, idx) => (
                  <div key={idx} className="card" style={{ borderTop: '4px solid var(--green-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {item.year_label}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'var(--green-bg)', color: 'var(--green-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          {item.suitability_tier}
                        </span>
                      </div>

                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--green-primary)', marginBottom: '0.5rem' }}>
                        {item.recommended_crop}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
                        <strong>Rationale:</strong> {item.agronomic_rationale}
                      </div>

                      <div style={{ background: 'var(--bg-section)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '0.6rem', color: '#1e3a8a' }}>
                        🛡️ <strong>Pest Break:</strong> {item.pest_disease_break_benefit}
                      </div>

                      <div style={{ background: '#f5faf2', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', color: '#166534' }}>
                        🌱 <strong>Soil Impact:</strong> {item.soil_impact}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Water: {item.water_requirement}</span>
                      <span>Expected: {item.expected_yield_estimate}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comprehensive Soil Health Improvement Strategy */}
              {multiYearPlan.soil_improvement_plan && (
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--brown)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <ShieldCheck size={22} color="var(--brown)" />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--brown)', margin: 0 }}>
                      ICAR Soil Health & Fertility Enhancement Plan
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        🌾 Cover Crops & Green Manuring
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {multiYearPlan.soil_improvement_plan.cover_crops_and_green_manure.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        🧪 Nutrient Management
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {multiYearPlan.soil_improvement_plan.nutrient_management.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        🍂 Crop Residue Management
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {multiYearPlan.soil_improvement_plan.residue_management.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        💧 Irrigation Optimization
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {multiYearPlan.soil_improvement_plan.irrigation_optimization.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#faf5ee', borderRadius: '8px', border: '1px solid #ebd8c2', fontSize: '0.8rem', color: 'var(--brown)' }}>
                    ℹ️ <strong>Soil Testing:</strong> {multiYearPlan.soil_improvement_plan.soil_testing_recommendation}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
           TAB 2: QUICK 1-SEASON ROTATION
      ══════════════════════════════════════ */}
      {activeMode === 'single-year' && (
        <div>
          {/* Selector */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Previous Crop</label>
                <select className="form-select" value={prevCrop} onChange={e => setPrevCrop(e.target.value)}>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Soil Type</label>
                <select className="form-select" value={soilType} onChange={e => setSoilType(e.target.value)}>
                  {SOILS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">State</label>
                <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSearchSingle} style={{ padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }} disabled={loading}>
                {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                {loading ? ' Loading...' : ' Get Rotation'}
              </button>
            </div>
          </div>

          {/* Quick previous crop selector */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {CROPS.map(c => (
              <button key={c}
                onClick={() => setPrevCrop(c)}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  background: prevCrop === c ? 'var(--brown)' : 'var(--bg-card)',
                  color: prevCrop === c ? '#fff' : 'var(--text-secondary)',
                  borderColor: prevCrop === c ? 'var(--brown)' : 'var(--border-color)',
                  transition: 'all 0.2s',
                }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader size={40} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Finding best next crops…</p>
            </div>
          )}

          {result && !loading && (
            <div ref={singleYearRef} className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
              {/* Calculation Status Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                color: '#166534',
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                boxShadow: '0 2px 8px rgba(22, 101, 52, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <CheckCircle size={15} />
                  </span>
                  <span>Rotation Analysis Completed — Recommended Successor Crops Ready</span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
                  Rotation Ready
                </span>
              </div>

              <div style={{ background: 'linear-gradient(135deg, var(--brown), #a06840)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>After {result.previous_crop}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                    Best Next: <span style={{ color: '#d4f0c0' }}>{result.recommended_next_crops[0]?.crop}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{result.rotation_benefit}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9, fontSize: '0.85rem' }}>
                  <RefreshCw size={16} /> {result.soil_type} Soil · {result.state}
                </div>
              </div>

              {/* Rotation options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {result.recommended_next_crops.map((opt, i) => (
                  <div key={i} className="card" style={{ borderTop: `3px solid ${PRIORITY_COLOR[opt.priority] || 'var(--border-color)'}`, background: opt.soil_compatible ? 'var(--bg-card)' : 'var(--bg-section)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: PRIORITY_COLOR[opt.priority] }}>
                        #{opt.priority} {opt.crop}
                      </div>
                      {opt.soil_compatible
                        ? <CheckCircle size={16} color="var(--green-primary)" />
                        : <AlertCircle size={16} color="var(--gold)" />}
                    </div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.6rem' }}>{opt.reason}</p>
                    <div style={{ fontSize: '0.78rem', color: PRIORITY_COLOR[opt.priority], background: PRIORITY_BG[opt.priority], borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', fontWeight: 600 }}>
                      {opt.soil_benefit}
                    </div>
                    {!opt.soil_compatible && (
                      <div style={{ fontSize: '0.73rem', color: 'var(--gold)', marginTop: '0.4rem', display: 'flex', gap: '0.3rem' }}>
                        <AlertCircle size={11} /> May need soil amendment for {soilType} soil
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* General advice */}
              <div className="card" style={{ borderLeft: '3px solid var(--green-primary)', background: 'var(--green-bg)' }}>
                <div style={{ fontWeight: 700, color: 'var(--green-primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📋 General Rotation Principles</div>
                {result.general_advice.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--green-primary)', fontWeight: 700 }}>•</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-section)' }}>
              <RefreshCw size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Plan Your Crop Rotation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select your previous crop and click "Get Rotation" to see scientifically recommended next crops.</p>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
