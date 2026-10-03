import React, { useState, useEffect } from 'react';
import { LineChart, TrendingUp, IndianRupee, Calculator, Loader, AlertCircle, ChevronDown, Info, DollarSign, PieChart, ShieldCheck, Save, CheckCircle, Store } from 'lucide-react';
import { logCropToFarmHistory } from '../utils/farmHistoryService';

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

export default function YieldCalculator() {
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
        <span className="section-label">Farm Economics & Revenue</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Cultivation Cost & Revenue Calculator</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Calculate deterministic operational costs, forecast MSP harvest revenues, and compute gross net returns per acre.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-section)', padding: '0.35rem', borderRadius: '10px', width: 'fit-content' }}>
        <button
          onClick={() => setTab('cost-returns')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: tab === 'cost-returns' ? '#fff' : 'transparent',
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
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: tab === 'yield-msp' ? '#fff' : 'transparent',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: '2rem', alignItems: 'start' }}>
          {/* Input Form */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
              Operational Input Cost Parameters
            </h3>

            <form onSubmit={handleCostSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
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
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '0.65rem 0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
                      <Store size={14} color="#15803d" />
                      <span>{mandiData.records[0].market} ({mandiData.records[0].state}):</span>
                    </div>
                    <strong style={{ color: '#15803d', fontSize: '0.9rem' }}>₹{mandiData.records[0].modal_price}/qtl</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#166534' }}>
                    {mandiData.records[0].advisory}
                  </div>
                </div>
              )}

              {/* Optional User Operational Overrides */}
              <div style={{ background: 'var(--bg-section)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Custom Costs (₹ INR) <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)' }}>— leave blank to auto-estimate from ICAR CACP benchmarks</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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

              <button className="btn btn-primary" type="submit" disabled={costLoading} style={{ width: '100%', padding: '0.85rem' }}>
                {costLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Calculator size={18} />}
                {costLoading ? ' Calculating Economics...' : ' Calculate Cost & Gross Return'}
              </button>
            </form>
          </div>

          {/* Results Summary & Breakdown */}
          <div>
            {costLoading && (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
                <Loader size={44} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>Computing deterministic cost summation and gross returns…</p>
              </div>
            )}

            {costResult && !costLoading && (
              <div className="animate-fade-in-up">
                {/* Gross Return Hero Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a1e 0%, var(--green-primary) 100%)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem',
                  color: '#ffffff',
                  marginBottom: '1rem',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Farm Economics · {costResult.area_acres} Acres {costResult.crop}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.75rem' }}>
                    Gross Return (Revenue − Total Cost)
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: '#d4f0c0', lineHeight: 1, marginBottom: '0.75rem' }}>
                    ₹{costResult.estimated_gross_return_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem' }}>
                    <div>
                      <div style={{ opacity: 0.75, fontSize: '0.72rem' }}>Total Cost</div>
                      <div style={{ fontWeight: 700 }}>₹{costResult.total_production_cost_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.75, fontSize: '0.72rem' }}>Estimated Revenue</div>
                      <div style={{ fontWeight: 700 }}>₹{costResult.estimated_revenue_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.75, fontSize: '0.72rem' }}>Profit Margin</div>
                      <div style={{ fontWeight: 700, color: '#d4f0c0' }}>{costResult.profit_margin_percent}%</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.75, fontSize: '0.72rem' }}>Cost / Acre</div>
                      <div style={{ fontWeight: 700 }}>₹{costResult.cost_per_acre_inr?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleSaveCostResult}
                      disabled={saveLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.6rem 1rem',
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
                      Save Economics to Farm History
                    </button>
                    {saveMsg && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: saveMsg.startsWith('Error') ? '#fca5a5' : '#d4f0c0', fontWeight: 600, textAlign: 'center' }}>
                        {saveMsg}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Operational Breakdown */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Operational Cost Breakdown</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deterministic Arithmetic</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {costResult.cost_breakdown.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', background: 'var(--bg-section)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{item.category}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.description}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
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

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, background: '#faf5ee', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ebd8c2' }}>
                  ℹ️ {costResult.disclaimer}
                </div>
              </div>
            )}

            {!costResult && !costLoading && (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-section)' }}>
                <Calculator size={44} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Awaiting Calculation
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Fill in your acreage and operational costs, or click Calculate to benchmark using official ICAR CACP cultivation data.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
           TAB 2: HARVEST YIELD & MSP
      ══════════════════════════════════════ */}
      {tab === 'yield-msp' && (
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
                  <label className="form-label">Irrigation</label>
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

              {/* Crop MSP info pill */}
              {CROPS_MSP[form.crop] && (
                <div style={{ background: 'var(--gold-pale)', border: '1px solid #e8d080', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#9a6e0a', fontWeight: 600 }}>Govt Statutory MSP (2024–25): </span>
                    <strong style={{ color: '#7a5500' }}>₹{CROPS_MSP[form.crop].msp} / quintal</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#9a6e0a' }}>
                    {CROPS_MSP[form.crop].season}
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

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Calculator size={16} />}
                {loading ? ' Calculating...' : ' Forecast Yield & Revenue'}
              </button>
            </form>
          </div>

          {/* Results panel */}
          <div>
            {result && (
              <div className="animate-fade-in-up">
                {/* Revenue hero */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a1e 0%, var(--green-primary) 100%)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  color: '#ffffff',
                  marginBottom: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ fontSize: '0.82rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                    Estimated Total Revenue (at MSP)
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: '#d4f0c0', lineHeight: 1, marginBottom: '0.5rem' }}>
                    ₹{Number(result.estimated_revenue_inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                    Net Profit (after ~38% input costs): <strong>₹{Number(result.net_profit_inr || result.estimated_revenue_inr * 0.62).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </div>
                </div>

                {/* Breakdown cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--green-primary)' }}>
                      {result.estimated_yield_quintals}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Estimated Yield (Quintals)</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#9a6e0a' }}>
                      ₹{result.msp_price_per_quintal || CROPS_MSP[form.crop]?.msp}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MSP Price / Quintal</div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleSaveYieldResult}
                    disabled={saveLoading}
                    className="btn btn-outline"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.65rem 1rem',
                      borderColor: 'var(--green-primary)',
                      color: 'var(--green-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    {saveLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    Save Yield Forecast to Farm History
                  </button>
                  {saveMsg && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: saveMsg.startsWith('Error') ? '#dc2626' : '#16a34a', fontWeight: 600, textAlign: 'center' }}>
                      {saveMsg}
                    </div>
                  )}
                </div>

                <div className="card card-cream">
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💡 Optimization Tips</div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <li>Drip irrigation can increase yield by 15–25% while saving 40% water.</li>
                    <li>Sell through e-NAM portals to access competitive buyers across state borders.</li>
                  </ul>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-section)' }}>
                <TrendingUp size={44} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Awaiting Input</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter farm details and click calculate to estimate yield and revenue.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
