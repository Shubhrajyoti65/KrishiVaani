import React, { useState, useEffect, useRef } from 'react';
import { LineChart, TrendingUp, IndianRupee, Calculator, Loader, AlertCircle, ChevronDown, Info, DollarSign, PieChart, ShieldCheck, Save, CheckCircle, Store, ArrowLeft } from 'lucide-react';
import { logCropToFarmHistory } from '../utils/farmHistoryService';
import { AGRI_IMAGES } from '../data/agriImages';

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
const STATES = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Karnataka', 'Gujarat', 'West Bengal', 'Odisha', 'Andhra Pradesh', 'Tamil Nadu'];
const IRRIGATION = ['Canal', 'Drip', 'Sprinkler', 'Rain-fed', 'Borewell'];

export default function YieldCalculator({ onBack }) {
  const [tab, setTab] = useState('cost-returns'); // 'cost-returns' | 'yield-msp'

  // Yield & MSP state
  const [form,    setForm]    = useState(DEFAULT_FORM);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Production Cost & Gross Return state
  const [costForm, setCostForm] = useState({
    crop: 'Wheat',
    state: 'Punjab',
    season: 'Rabi',
    area_acres: 2.0,
    expected_yield_quintals_per_acre: '',
    expected_selling_price_per_quintal_inr: '',
    seed_cost_inr: '',
    fertilizer_cost_inr: '',
    pesticide_cost_inr: '',
    labour_cost_inr: '',
    irrigation_cost_inr: '',
    machinery_cost_inr: '',
    transportation_cost_inr: '',
    other_cost_inr: '',
  });
  const [costResult,  setCostResult]  = useState(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError,   setCostError]   = useState(null);
  const [mandiData,   setMandiData]   = useState(null);

  const costResultsRef = useRef(null);
  const yieldResultsRef = useRef(null);

  useEffect(() => {
    if (costResult && costResultsRef.current) {
      costResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [costResult]);

  useEffect(() => {
    if (result && yieldResultsRef.current) {
      yieldResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  useEffect(() => {
    let active = true;
    const fetchMandi = async () => {
      try {
        const cropToUse = tab === 'cost-returns' ? costForm.crop : form.crop;
        const stateToUse = tab === 'cost-returns' ? costForm.state : form.state;
        const res = await fetch(`http://localhost:8000/api/v1/mandi/prices?commodity=${cropToUse}&state=${stateToUse}`);
        if (res.ok) {
          const data = await res.json();
          if (active) setMandiData(data);
        }
      } catch (e) {
        // Silently ignore if offline
      }
    };
    fetchMandi();
    return () => { active = false; };
  }, [form.crop, form.state, costForm.crop, costForm.state, tab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: isNaN(value) || value === '' ? value : Number(value) }));
  };

  const handleCostChange = (e) => {
    const { name, value } = e.target;
    setCostForm(prev => ({ ...prev, [name]: value }));
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

  const handleCostSubmit = async (e) => {
    e.preventDefault();
    setCostLoading(true);
    setCostError(null);
    try {
      const payload = {
        crop: costForm.crop,
        state: costForm.state,
        season: costForm.season,
        area_acres: Number(costForm.area_acres),
        ...(costForm.expected_yield_quintals_per_acre !== '' ? { expected_yield_quintals_per_acre: Number(costForm.expected_yield_quintals_per_acre) } : {}),
        ...(costForm.expected_selling_price_per_quintal_inr !== '' ? { expected_selling_price_per_quintal_inr: Number(costForm.expected_selling_price_per_quintal_inr) } : {}),
        ...(costForm.seed_cost_inr !== '' ? { seed_cost_inr: Number(costForm.seed_cost_inr) } : {}),
        ...(costForm.fertilizer_cost_inr !== '' ? { fertilizer_cost_inr: Number(costForm.fertilizer_cost_inr) } : {}),
        ...(costForm.pesticide_cost_inr !== '' ? { pesticide_cost_inr: Number(costForm.pesticide_cost_inr) } : {}),
        ...(costForm.labour_cost_inr !== '' ? { labour_cost_inr: Number(costForm.labour_cost_inr) } : {}),
        ...(costForm.irrigation_cost_inr !== '' ? { irrigation_cost_inr: Number(costForm.irrigation_cost_inr) } : {}),
        ...(costForm.machinery_cost_inr !== '' ? { machinery_cost_inr: Number(costForm.machinery_cost_inr) } : {}),
        ...(costForm.transportation_cost_inr !== '' ? { transportation_cost_inr: Number(costForm.transportation_cost_inr) } : {}),
        ...(costForm.other_cost_inr !== '' ? { other_cost_inr: Number(costForm.other_cost_inr) } : {}),
      };

      const res = await fetch('http://localhost:8000/api/v1/production/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCostResult(data);
    } catch (err) {
      setCostError(err.message || 'Failed to calculate production cost.');
    } finally {
      setCostLoading(false);
    }
  };

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const handleSaveCostResult = async () => {
    if (!costResult) return;
    setSaveLoading(true);
    setSaveMsg(null);
    try {
      await logCropToFarmHistory({
        crop: costResult.crop,
        season: costResult.season || 'Rabi',
        year: new Date().getFullYear(),
        area_acres: costResult.area_acres,
        yield_obtained_quintals: Number((costResult.expected_yield_quintals_per_acre * costResult.area_acres).toFixed(1)),
        production_cost_inr: costResult.total_production_cost_inr,
        revenue_inr: costResult.estimated_revenue_inr,
        soil_condition_note: `Calculated Gross Return: ₹${costResult.estimated_gross_return_inr?.toFixed(0)}, Profit Margin: ${costResult.profit_margin_percent}%`
      });
      setSaveMsg('Farm economics saved to your profile history!');
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveYieldResult = async () => {
    if (!result) return;
    setSaveLoading(true);
    setSaveMsg(null);
    try {
      await logCropToFarmHistory({
        crop: result.crop || form.crop,
        season: result.season || 'Rabi',
        year: new Date().getFullYear(),
        area_acres: result.area || form.area,
        yield_obtained_quintals: Number(result.estimated_yield_quintals || 0),
        production_cost_inr: Math.round(Number(result.estimated_revenue_inr || 0) * 0.38),
        revenue_inr: Number(result.estimated_revenue_inr || 0),
        soil_condition_note: `XGBoost Yield Forecast at MSP ₹${result.msp_price_per_quintal || CROPS_MSP[form.crop]?.msp}/Q`
      });
      setSaveMsg('Yield forecast saved to your profile history!');
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
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
            Farm Economics & Revenue
          </span>
        </div>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Cultivation Cost & Revenue Calculator</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Calculate deterministic operational costs, forecast MSP harvest revenues, and compute gross net returns per acre.
        </p>

        {/* Havens-Inspired Harvest & Soil Economics Banner */}
        <div
          className="card-glass"
          style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: `linear-gradient(135deg, rgba(7, 19, 15, 0.88) 0%, rgba(13, 33, 26, 0.84) 100%), url("${AGRI_IMAGES.harvestGrain}")`,
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
                background: 'rgba(234, 179, 8, 0.22)',
                color: '#fde047',
                border: '1px solid rgba(253, 224, 71, 0.35)',
                marginBottom: '0.75rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              🌾 Commission for Agricultural Costs & Prices (CACP)
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
              Production Economics & MSP Profit Maximizer
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(240, 247, 243, 0.85)', lineHeight: 1.6, margin: 0 }}>
              Model comprehensive C2 cultivation costs across seeds, fertilizers, machinery, and labour alongside live Indian government Minimum Support Price (MSP) harvest projections.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-section)', padding: '0.35rem', borderRadius: '10px', width: 'fit-content' }}>
        <button
          onClick={() => setTab('cost-returns')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: tab === 'cost-returns' ? '1px solid var(--border-glass)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: tab === 'cost-returns' ? 'var(--bg-card)' : 'transparent',
            color: tab === 'cost-returns' ? 'var(--green-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'cost-returns' ? 'var(--shadow-sm)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.2s',
          }}
        >
          <Calculator size={16} /> Cost of Cultivation & Gross Return
        </button>
        <button
          onClick={() => setTab('yield-msp')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: tab === 'yield-msp' ? '1px solid var(--border-glass)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: tab === 'yield-msp' ? 'var(--bg-card)' : 'transparent',
            color: tab === 'yield-msp' ? 'var(--green-primary)' : 'var(--text-muted)',
            boxShadow: tab === 'yield-msp' ? 'var(--shadow-sm)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.2s',
          }}
        >
          <LineChart size={16} /> Harvest Yield Forecast & MSP
        </button>
      </div>

      {/* ══════════════════════════════════════
           TAB 1: CULTIVATION COST & GROSS RETURN
      ══════════════════════════════════════ */}
      {tab === 'cost-returns' && (
        <div>
          {/* Query Form (Full Width on Top) */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              Operational Input Cost Parameters
            </h3>

            <form onSubmit={handleCostSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Crop</label>
                  <select className="form-select" name="crop" value={costForm.crop} onChange={handleCostChange}>
                    {Object.keys(CROPS_MSP).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" name="state" value={costForm.state} onChange={handleCostChange}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Season</label>
                  <select className="form-select" name="season" value={costForm.season} onChange={handleCostChange}>
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Area (Acres)</label>
                  <input className="form-input" type="number" step="0.1" name="area_acres" value={costForm.area_acres} onChange={handleCostChange} min={0.1} max={500} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Yield (Q/Acre)</label>
                  <input className="form-input" type="number" step="0.1" name="expected_yield_quintals_per_acre" value={costForm.expected_yield_quintals_per_acre} onChange={handleCostChange} placeholder="Auto (Benchmark)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price (₹/Quintal)</label>
                  <input className="form-input" type="number" name="expected_selling_price_per_quintal_inr" value={costForm.expected_selling_price_per_quintal_inr} onChange={handleCostChange} placeholder="Auto (MSP)" />
                </div>
              </div>

              {/* APMC Mandi Rate in Tab 1 */}
              {mandiData?.records?.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#166534', fontWeight: 700 }}>
                      <Store size={15} color="#15803d" />
                      <span>Live APMC Benchmark ({mandiData.records[0].market}, {mandiData.records[0].state}):</span>
                    </div>
                    <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>₹{mandiData.records[0].modal_price}/qtl</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                    {mandiData.records[0].advisory}
                  </div>
                </div>
              )}

              {/* Optional User Operational Overrides */}
              <div style={{ background: 'var(--bg-section)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  Custom Operational Expenses (₹ INR) <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-muted)' }}>— leave blank to auto-estimate from ICAR CACP benchmarks</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Seeds (₹)</label>
                    <input className="form-input" type="number" name="seed_cost_inr" value={costForm.seed_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Fertilizer (₹)</label>
                    <input className="form-input" type="number" name="fertilizer_cost_inr" value={costForm.fertilizer_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Pesticides (₹)</label>
                    <input className="form-input" type="number" name="pesticide_cost_inr" value={costForm.pesticide_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Labour (₹)</label>
                    <input className="form-input" type="number" name="labour_cost_inr" value={costForm.labour_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Irrigation (₹)</label>
                    <input className="form-input" type="number" name="irrigation_cost_inr" value={costForm.irrigation_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Machinery (₹)</label>
                    <input className="form-input" type="number" name="machinery_cost_inr" value={costForm.machinery_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Transport (₹)</label>
                    <input className="form-input" type="number" name="transportation_cost_inr" value={costForm.transportation_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Other Costs (₹)</label>
                    <input className="form-input" type="number" name="other_cost_inr" value={costForm.other_cost_inr} onChange={handleCostChange} placeholder="Auto" />
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" type="submit" disabled={costLoading} style={{ width: '100%', padding: '0.85rem' }}>
                {costLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Calculator size={18} />}
                {costLoading ? ' Calculating Economics...' : ' Calculate Cost & Gross Return'}
              </button>
            </form>
          </div>

          {/* Results Summary & Breakdown (Full Width Below Query) */}
          {costLoading && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem', marginBottom: '2rem' }}>
              <Loader size={44} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Computing deterministic cost summation and gross returns…</p>
            </div>
          )}

          {costResult && !costLoading && (
            <div ref={costResultsRef} className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
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
                  <span>Farm Economics Calculated — Cultivation Cost & Gross Return Ready</span>
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
                  Results Ready
                </span>
              </div>

              {/* Gross Return Hero Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a1e 0%, var(--green-primary) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                color: '#ffffff',
                marginBottom: '1.5rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                      Farm Economics · {costResult.area_acres} Acres {costResult.crop} ({costResult.season})
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                      Gross Net Return (Revenue − Total Cost)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCostResult}
                    disabled={saveLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 1.15rem',
                      background: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'var(--green-primary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {saveLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    Save to Profile History
                  </button>
                </div>

                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.75rem', fontWeight: 800, color: '#d4f0c0', lineHeight: 1.1, marginBottom: '1.25rem' }}>
                  ₹{costResult.estimated_gross_return_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Production Cost</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{costResult.total_production_cost_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: '0.75rem', textTransform: 'uppercase' }}>Estimated Gross Revenue</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{costResult.estimated_revenue_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: '0.75rem', textTransform: 'uppercase' }}>Profit Margin</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#d4f0c0' }}>{costResult.profit_margin_percent}%</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: '0.75rem', textTransform: 'uppercase' }}>Cost Per Acre</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{costResult.cost_per_acre_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>

                {saveMsg && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: saveMsg.startsWith('Error') ? '#fca5a5' : '#d4f0c0', fontWeight: 600 }}>
                    {saveMsg}
                  </div>
                )}
              </div>

              {/* Detailed Operational Breakdown & Notes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Operational Cost Breakdown</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deterministic Arithmetic</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {costResult.cost_breakdown.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', background: 'var(--bg-section)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.category}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.description}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            ₹{item.amount_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: item.source_tag === 'User-entered' ? 'var(--green-bg)' : '#e2e8f0',
                            color: item.source_tag === 'User-entered' ? 'var(--green-primary)' : '#475569',
                            fontWeight: 600
                          }}>
                            {item.source_tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card card-cream">
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💡 Economic Insights</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      <li>Net profit is calculated based on expected yield ({costResult.expected_yield_quintals_per_acre} Q/Acre) multiplied by selling rate.</li>
                      <li>Standard benchmark inputs adhere to Commission for Agricultural Costs and Prices (CACP) and ICAR regional reports.</li>
                      <li>Save this calculation to your farm profile to compare season-over-season operational performance.</li>
                    </ul>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, background: '#faf5ee', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #ebd8c2' }}>
                    ℹ️ {costResult.disclaimer}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
           TAB 2: HARVEST YIELD & MSP
      ══════════════════════════════════════ */}
      {tab === 'yield-msp' && (
        <div>
          {/* Form (Full Width on Top) */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.25rem' }}>Farm & Crop Parameters</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
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
                  <label className="form-label">Irrigation</label>
                  <select className="form-select" name="irrigation" value={form.irrigation} onChange={handleChange}>
                    {IRRIGATION.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" name="state" value={form.state} onChange={handleChange}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Crop MSP info pill */}
              {CROPS_MSP[form.crop] && (
                <div style={{ background: 'var(--gold-pale)', border: '1px solid #e8d080', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#9a6e0a', fontWeight: 600 }}>Govt Statutory MSP (2024–25): </span>
                    <strong style={{ color: '#7a5500' }}>₹{CROPS_MSP[form.crop].msp} / quintal</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#9a6e0a' }}>
                    {CROPS_MSP[form.crop].season} Season
                  </span>
                </div>
              )}

              {/* Live APMC Mandi Rate vs MSP Card */}
              {mandiData?.records?.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                      <Store size={15} color="#15803d" />
                      <span>APMC Mandi: {mandiData.records[0].market} ({mandiData.records[0].district || mandiData.records[0].state})</span>
                    </div>
                    <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>
                      ₹{mandiData.records[0].modal_price} / qtl
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#166534', lineHeight: 1.4 }}>
                    {mandiData.records[0].advisory}
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Calculator size={16} />}
                {loading ? ' Calculating...' : ' Forecast Yield & Revenue'}
              </button>
            </form>
          </div>

          {/* Results panel (Full Width Below Form) */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem', marginBottom: '2rem' }}>
              <Loader size={44} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Calculating ML yield prediction and MSP revenue…</p>
            </div>
          )}

          {result && !loading && (
            <div ref={yieldResultsRef} className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
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
                  <span>Harvest Yield Forecast Calculated — MSP & Net Profit Ready</span>
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
                  Results Ready
                </span>
              </div>

              {/* Revenue hero */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a1e 0%, var(--green-primary) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                color: '#ffffff',
                marginBottom: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                      Harvest Yield Forecast · {form.area} Acres {form.crop} ({result.season || 'Rabi'})
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                      Estimated Total Revenue (at MSP)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveYieldResult}
                    disabled={saveLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 1.15rem',
                      background: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'var(--green-primary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {saveLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    Save Forecast to History
                  </button>
                </div>

                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.75rem', fontWeight: 800, color: '#d4f0c0', lineHeight: 1.1, marginBottom: '0.75rem' }}>
                  ₹{Number(result.estimated_revenue_inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.88rem', opacity: 0.88 }}>
                  Net Profit (after ~38% operational cost benchmark): <strong>₹{Number(result.net_profit_inr || result.estimated_revenue_inr * 0.62).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                </div>

                {saveMsg && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: saveMsg.startsWith('Error') ? '#fca5a5' : '#d4f0c0', fontWeight: 600 }}>
                    {saveMsg}
                  </div>
                )}
              </div>

              {/* Breakdown cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--green-primary)' }}>
                    {result.estimated_yield_quintals}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Estimated Yield (Quintals)</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#9a6e0a' }}>
                    ₹{result.msp_price_per_quintal || CROPS_MSP[form.crop]?.msp}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Govt MSP Price / Quintal</div>
                </div>
              </div>

              <div className="card card-cream">
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💡 Optimization Tips</div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <li>Drip irrigation can increase yield by 15–25% while saving 40% water compared to flood irrigation.</li>
                  <li>Sell through e-NAM electronic trading portals to access competitive wholesale buyers across state borders.</li>
                  <li>Verify soil micro-nutrients using our Soil Health Card feature to ensure maximum potential yield.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
