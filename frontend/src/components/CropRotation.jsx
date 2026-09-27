import React, { useState } from 'react';
import { RefreshCw, Search, Loader, Info, CheckCircle, AlertCircle, Layers, MapPin, Sprout } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { EXPANDED_CROPS, SOIL_TYPES, INDIAN_STATES } from '../data/agriData';

const PRIORITY_COLOR = { 1: 'var(--green-primary)', 2: '#2563eb', 3: '#9a6e0a', 4: 'var(--text-muted)' };
const PRIORITY_BG    = { 1: 'var(--green-bg)', 2: '#e8f0fc', 3: 'var(--gold-pale)', 4: 'var(--bg-section)' };

export default function CropRotation() {
  const [prevCrop, setPrevCrop] = useState('');
  const [soilType, setSoilType] = useState('');
  const [state, setState] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (targetCrop = prevCrop, targetSoil = soilType, targetState = state) => {
    if (!targetCrop) {
      alert("Please select or search your previously harvested crop.");
      return;
    }

    setLoading(true);
    try {
      const url = `http://localhost:8000/api/v1/crop-rotation/?previous_crop=${targetCrop}&soil_type=${encodeURIComponent(targetSoil || 'Alluvial')}&state=${encodeURIComponent(targetState || 'Punjab')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      // Fallback rotation calculation
      const isLegume = ['chickpea', 'mungbean', 'blackgram', 'pigeonpeas', 'lentil', 'groundnut', 'soybean'].includes(targetCrop.toLowerCase());
      const nextCrops = isLegume
        ? [
            { priority: 1, crop: 'Wheat / Maize', reason: 'High nitrogen feeder that capitalizes on biological nitrogen fixed in soil by previous legume.', soil_benefit: '+20–30 kg/ha residual N enrichment', soil_compatible: true },
            { priority: 2, crop: 'Mustard / Rapeseed', reason: 'Deep taproot system opens hardpan and absorbs deep subsoil moisture.', soil_benefit: 'Breaks soil-borne fungal spore cycle', soil_compatible: true },
            { priority: 3, crop: 'Vegetables (Potato/Onion)', reason: 'High cash return and responsive to enriched organic residual humus.', soil_benefit: 'Improves soil micro-flora biodiversity', soil_compatible: true },
          ]
        : [
            { priority: 1, crop: 'Chickpea / Moong / Lentil', reason: 'Leguminous nitrogen-fixing crop restores soil nutrient depleted by cereal.', soil_benefit: 'Fixes 40–70 kg atmospheric nitrogen per hectare', soil_compatible: true },
            { priority: 2, crop: 'Mustard / Oilseeds', reason: 'Different nutrient uptake band and breaks pest cycle.', soil_benefit: 'Deep root penetration improves aeration', soil_compatible: true },
            { priority: 3, crop: 'Green Manure (Dhaincha/Sunhemp)', reason: 'Adds biomass organic carbon before next main Kharif season.', soil_benefit: 'Adds 15–20 tonnes/ha fresh green organic matter', soil_compatible: true },
          ];

      setResult({
        previous_crop: targetCrop.charAt(0).toUpperCase() + targetCrop.slice(1),
        soil_type: targetSoil || 'Alluvial',
        state: targetState || 'All India',
        rotation_benefit: isLegume ? 'Soil is enriched with fixed atmospheric Nitrogen.' : 'Soil nitrogen is depleted; legume rotation is highly recommended.',
        recommended_next_crops: nextCrops,
        general_advice: [
          'Never follow a deep-rooted crop with another deep-rooted crop in consecutive seasons.',
          'Always rotate heavy feeders (e.g. Rice, Sugarcane) with soil restorers (e.g. Pulses, Legumes).',
          'Practice summer deep ploughing after harvest to eradicate pest pupae and weed seeds naturally.'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCropChange = (val) => {
    setPrevCrop(val);
    if (val) handleSearch(val, soilType, state);
  };

  const handleSoilChange = (val) => {
    setSoilType(val);
    if (prevCrop) handleSearch(prevCrop, val, state);
  };

  const handleStateChange = (val) => {
    setState(val);
    if (prevCrop) handleSearch(prevCrop, soilType, val);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">Soil Health & Productivity</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Crop Rotation & Soil Fertility Planner</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Search any previous harvested crop, soil type, and state to get scientifically verified agronomic rotation recommendations for biological nitrogen fixation, disease disruption, and soil health.
        </p>
      </div>

      {/* Selectors */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Previous Harvested Crop *</label>
            <SearchableSelect
              options={EXPANDED_CROPS}
              value={prevCrop}
              onChange={handleCropChange}
              placeholder="Select previous crop..."
              searchPlaceholder="Search wheat, rice, cotton, potato, soybean..."
              icon={Sprout}
              allowCustom={true}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Field Soil Type</label>
            <SearchableSelect
              options={SOIL_TYPES.map(s => ({ value: s.id, label: s.name, subtext: s.description }))}
              value={soilType}
              onChange={handleSoilChange}
              placeholder="Select soil..."
              searchPlaceholder="Search alluvial, black cotton, red, laterite..."
              icon={Layers}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>State</label>
            <SearchableSelect
              options={INDIAN_STATES}
              value={state}
              onChange={handleStateChange}
              placeholder="Select state..."
              searchPlaceholder="Search 36 states/UTs..."
              icon={MapPin}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => handleSearch(prevCrop, soilType, state)}
            style={{ padding: '0.65rem 1.4rem', whiteSpace: 'nowrap' }}
            disabled={loading || !prevCrop}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
            {loading ? ' Calculating...' : ' Get Rotation'}
          </button>
        </div>
      </div>

      {/* Quick previous crop pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['rice', 'wheat', 'cotton', 'sugarcane', 'potato', 'soybean', 'mustard', 'chickpea', 'maize', 'groundnut'].map(c => (
          <button
            key={c}
            onClick={() => handleCropChange(c)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: prevCrop.toLowerCase() === c.toLowerCase() ? 'var(--brown)' : 'var(--bg-card)',
              color: prevCrop.toLowerCase() === c.toLowerCase() ? '#fff' : 'var(--text-secondary)',
              borderColor: prevCrop.toLowerCase() === c.toLowerCase() ? 'var(--brown)' : 'var(--border-color)',
              transition: 'all 0.15s ease',
            }}
          >
            After {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      {result ? (
        <div className="animate-fade-in-up">
          {/* Summary Banner */}
          <div style={{ background: 'linear-gradient(135deg, var(--brown), #a06840)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                AFTER HARVESTING {result.previous_crop}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                Primary Recommended Next: <span style={{ color: '#d4f0c0' }}>{result.recommended_next_crops[0]?.crop}</span>
              </div>
              <div style={{ fontSize: '0.88rem', opacity: 0.9 }}>{result.rotation_benefit}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.95, fontSize: '0.85rem' }}>
              <RefreshCw size={16} /> {result.soil_type} Soil · {result.state}
            </div>
          </div>

          {/* Rotation options cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {result.recommended_next_crops.map((opt, i) => (
              <div key={i} className="card" style={{ borderTop: `3px solid ${PRIORITY_COLOR[opt.priority] || 'var(--border-color)'}`, background: opt.soil_compatible ? 'var(--bg-card)' : 'var(--bg-section)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: PRIORITY_COLOR[opt.priority] }}>
                    Priority #{opt.priority}: {opt.crop}
                  </div>
                  {opt.soil_compatible ? (
                    <CheckCircle size={16} color="var(--green-primary)" />
                  ) : (
                    <AlertCircle size={16} color="var(--gold)" />
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.6rem' }}>
                  {opt.reason}
                </p>
                <div style={{ fontSize: '0.8rem', color: PRIORITY_COLOR[opt.priority], background: PRIORITY_BG[opt.priority], borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem', fontWeight: 600 }}>
                  🌱 {opt.soil_benefit}
                </div>
              </div>
            ))}
          </div>

          {/* General Advice */}
          <div className="card" style={{ borderLeft: '3px solid var(--green-primary)', background: 'var(--green-bg)' }}>
            <div style={{ fontWeight: 700, color: 'var(--green-primary)', marginBottom: '0.75rem', fontSize: '0.92rem' }}>
              📋 Agronomic Crop Rotation Principles
            </div>
            {result.general_advice.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--green-primary)', fontWeight: 700 }}>•</span> {a}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-section)' }}>
          <RefreshCw size={48} color="var(--green-pale)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Select Your Previous Harvested Crop
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Choose what you previously grew in your field to see scientifically recommended next crops for pest breaking and soil nutrient restoration.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
