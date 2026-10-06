import React, { useState, useRef, useEffect } from 'react';
import { Leaf, Upload, Camera, CheckCircle, AlertCircle, Loader, FlaskConical, Sprout, X, Cpu, ShieldCheck, Bug, RefreshCw, BookOpen, Save, ArrowLeft } from 'lucide-react';
import { logCropToFarmHistory } from '../utils/farmHistoryService';
import { AGRI_IMAGES } from '../data/agriImages';

const SEV_COLOR = {
  None: { bg: 'var(--green-bg)', border: 'var(--green-pale)', text: 'var(--green-primary)' },
  Low: { bg: 'var(--gold-pale)', border: 'rgba(234, 179, 8, 0.35)', text: 'var(--gold)' },
  Moderate: { bg: 'rgba(217, 119, 6, 0.16)', border: 'rgba(217, 119, 6, 0.38)', text: '#d97706' },
  High: { bg: 'rgba(239, 68, 68, 0.16)', border: 'rgba(239, 68, 68, 0.38)', text: '#ef4444' },
};

const COMMON_CROPS = [
  { id: 'tomato', name: 'Tomato (टमाटर)', icon: '🍅' },
  { id: 'potato', name: 'Potato (आलू)', icon: '🥔' },
  { id: 'rice', name: 'Rice / Paddy (धान)', icon: '🌾' },
  { id: 'wheat', name: 'Wheat (गेहूं)', icon: '🌾' },
  { id: 'cotton', name: 'Cotton (कपास)', icon: '🌱' },
  { id: 'maize', name: 'Maize / Corn (मक्का)', icon: '🌽' },
  { id: 'chilli', name: 'Chilli / Pepper (मिर्च)', icon: '🌶️' },
  { id: 'soybean', name: 'Soybean (सोयाबीन)', icon: '🫘' },
  { id: 'apple', name: 'Apple (सेब)', icon: '🍎' },
  { id: 'banana', name: 'Banana (केला)', icon: '🍌' },
  { id: 'mango', name: 'Mango (आम)', icon: '🥭' },
  { id: 'cucumber', name: 'Cucumber (खीरा)', icon: '🥒' },
  { id: 'sugarcane', name: 'Sugarcane (गन्ना)', icon: '🎋' },
  { id: 'cabbage', name: 'Cabbage (पत्तागोभी)', icon: '🥬' },
  { id: 'groundnut', name: 'Groundnut (मूंगफली)', icon: '🥜' },
  { id: 'onion', name: 'Onion (प्याज)', icon: '🧅' },
  { id: 'general', name: 'Other / General Crop', icon: '🌿' },
];

export default function DiseaseScanner({ onBack }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const fileRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setError(null);
    analyzeImage(file, selectedCrop);
  };

  const handleCropChange = (newCrop) => {
    setSelectedCrop(newCrop);
    if (selectedFile) {
      analyzeImage(selectedFile, newCrop);
    }
  };

  const analyzeImage = async (file, cropToUse) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      if (cropToUse && cropToUse !== 'general') {
        form.append('crop_hint', cropToUse);
      }
      const res = await fetch('http://localhost:8000/api/v1/disease-detection/analyze', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        let errMessage = `DigiGreen model error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.detail) errMessage = errData.detail;
        } catch (_) { }
        throw new Error(errMessage);
      }

      const data = await res.json();
      setResult(data);

      // If user had not selected a crop and model returned one, sync the dropdown
      if (!cropToUse && data.crop) {
        const detectedLower = data.crop.toLowerCase();
        const matched = COMMON_CROPS.find(c => detectedLower.includes(c.id) || c.id.includes(detectedLower));
        if (matched) {
          setSelectedCrop(matched.id);
        }
      }
    } catch (err) {
      console.error('DigiGreen inference error:', err);
      setError(err.message || 'Failed to analyze leaf image with DigiGreen model.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiagnosis = async () => {
    if (!result) return;
    setSaveLoading(true);
    setSaveMsg(null);
    try {
      await logCropToFarmHistory({
        crop: result.crop || 'Crop',
        disease_experienced: `${result.disease_name || result.condition_type} (Severity: ${result.severity})`,
        soil_condition_note: `DigiGreen Vision AI Diagnosis: ${result.disease_name} (${((result.confidence || 0.95) * 100).toFixed(1)}% conf). Severity: ${result.severity}. PHI: ${(result.llm_grounded_guidance?.cibrc_chemical_management || [])[0]?.phi_harvest_interval || 'Standard safety interval'}.`,
        season: 'Current',
        year: new Date().getFullYear(),
        area_acres: 1.0,
        yield_obtained_quintals: 0,
        production_cost_inr: 0,
        revenue_inr: 0
      });
      setSaveMsg('Diagnosis logged to farm history successfully!');
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const sev = result ? (SEV_COLOR[result.severity] || SEV_COLOR.None) : null;

  return (
    <div>
      <div className="segment-header-box">
        <div className="segment-header-icon">
          <Leaf size={24} />
        </div>
        <h2 className="segment-header-title">Leaf Disease Scanner & Diagnosis</h2>
      </div>

      {/* ── Upload Panel at Top (Full Width) ── */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        {/* Target Crop Selector */}
        <div style={{ marginBottom: '1.25rem', background: 'var(--bg-section)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label htmlFor="crop-select" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              🌱 Select Crop / Plant Type:
            </label>
            {selectedFile && (
              <span style={{ fontSize: '0.75rem', color: 'var(--green-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <RefreshCw size={12} className={loading ? "spin-icon" : ""} /> Auto-updates on change
              </span>
            )}
          </div>
          <select
            id="crop-select"
            value={selectedCrop}
            onChange={e => handleCropChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              border: selectedCrop ? '1.5px solid var(--green-primary)' : '1.5px solid #cbd5e1',
              fontSize: '0.92rem',
              background: selectedCrop ? '#f0fdf4' : '#ffffff',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="">-- Choose Your Crop (e.g. Tomato, Rice, Wheat, Potato, Maize) --</option>
            {COMMON_CROPS.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem', marginBottom: 0 }}>
            💡 Selecting the crop applies ICAR/CIBRC disease masking for maximum diagnostic precision.
          </p>
        </div>

        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${dragOver ? 'var(--green-primary)' : 'var(--border-glass)'}`,
              borderRadius: 'var(--radius-lg)',
              background: dragOver ? 'var(--green-bg)' : 'var(--bg-card)',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 80, height: 80, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2px solid var(--green-pale)' }}>
              <Upload size={34} color="var(--green-primary)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Upload Leaf Photo</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', maxWidth: '380px' }}>
              Drag & drop or click to upload. JPG, PNG, WEBP supported.
            </p>
            <button className="btn btn-primary btn-md" type="button">
              <Camera size={16} /> Take / Upload Photo
            </button>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Works best with close-up photos of individual leaves with good natural lighting
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', background: 'var(--bg-section)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
            <img
              src={preview}
              alt="Uploaded leaf"
              style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-glass)', maxHeight: '360px', objectFit: 'contain' }}
            />
            <button
              onClick={reset}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg-surface-glass-heavy)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-sm)' }}
              title="Remove photo"
            >
              <X size={20} color="var(--text-primary)" />
            </button>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-surface-glass-heavy)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)' }}>
                <Loader size={40} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--green-primary)', fontWeight: 700, fontSize: '1rem' }}>Analyzing leaf with DigiGreen Vision AI…</p>
              </div>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

        {/* Tips */}
        <div className="card card-green" style={{ marginTop: '1rem', padding: '0.85rem 1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            📸 Photo Tips:
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>• Select crop for highest precision</span>
            <span>• Natural daytime lighting</span>
            <span>• Capture affected spot clearly</span>
            <span>• Single leaf per scan</span>
          </div>
        </div>
      </div>

      {/* ── Results Panel at Bottom (Full Width) ── */}
      {error && (
        <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: '#b91c1c', fontWeight: 700, fontSize: '0.95rem' }}>
            <AlertCircle size={20} color="#b91c1c" /> DigiGreen AI Processing Notice
          </div>
          <p style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '0.4rem', lineHeight: 1.5 }}>
            {error}
          </p>
        </div>
      )}

      {result && sev && (
        <div ref={resultsRef} className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
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
              <span>Vision AI Diagnosis Completed — Pathogen Analysis & Remedies Ready</span>
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
              Analysis Ready
            </span>
          </div>

          {/* Disease Banner card */}
          <div
            className="card-glass"
            style={{
              background: sev.bg,
              border: `2px solid ${sev.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem 2rem',
              marginBottom: '1.25rem',
              boxShadow: 'var(--shadow-glass)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', background: 'var(--bg-surface-glass)', padding: '0.25rem 0.75rem', borderRadius: '12px', border: `1px solid ${sev.border}`, color: sev.text, fontWeight: 700, letterSpacing: '0.04em' }}>
                🤖 DigiGreen DaViT-Base Vision AI
              </span>
              {result.condition_type && (
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '12px', background: result.condition_type === 'healthy' ? 'var(--green-bg)' : result.condition_type === 'pest' ? 'var(--gold-pale)' : 'rgba(239, 68, 68, 0.2)', color: result.condition_type === 'healthy' ? 'var(--green-primary)' : result.condition_type === 'pest' ? 'var(--gold)' : '#ef4444', border: '1px solid var(--border-glass)' }}>
                  {result.condition_type}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: sev.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                  Diagnostic Classification
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 800, color: sev.text }}>
                  {result.condition || result.disease}
                </div>
              </div>
              <span className="badge" style={{ background: 'var(--bg-surface-glass)', color: sev.text, border: `1.5px solid ${sev.border}`, fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
                {result.severity} Severity Level
              </span>
            </div>

            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, color: sev.text }}>{(result.confidence * 100).toFixed(0)}%</div>
                <div style={{ fontSize: '0.75rem', color: sev.text, opacity: 0.8 }}>Diagnosis Confidence</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, color: sev.text }}>
                  {result.crop || result.crop_name}
                  {result.is_crop_user_selected && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.45rem', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                      Verified Host
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: sev.text, opacity: 0.8 }}>Identified Crop</div>
              </div>
            </div>

            {/* Differential Diagnoses */}
            {result.top_diseases && result.top_diseases.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: `1px dashed ${sev.border}` }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: sev.text, opacity: 0.85, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Alternative Differential Diagnoses:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {result.top_diseases.map((alt, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.85)', border: `1px solid ${sev.border}`, borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.76rem', color: sev.text }}>
                      {alt.name} ({(alt.confidence * 100).toFixed(1)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: `1px solid ${sev.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleSaveDiagnosis}
                disabled={saveLoading}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {saveLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                Log Diagnosis to Farm Profile
              </button>
              {saveMsg && (
                <span style={{ fontSize: '0.8rem', color: saveMsg.startsWith('Error') ? '#dc2626' : '#166534', fontWeight: 600 }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>

          {/* Detected Pest Warning Card */}
          {result.top_pest && (result.condition_type === 'pest' || (result.pest_confidence && result.pest_confidence > 0.25)) && (
            <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#92400e', fontWeight: 700, fontSize: '0.95rem' }}>
                <Bug size={18} color="#b45309" /> Detected Insect / Pest: {result.top_pest}
              </div>
              {result.pest_confidence && (
                <div style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '0.25rem' }}>
                  Pest Detection Probability: {(result.pest_confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          )}

          {/* Detailed Remedy Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Immediate Actions */}
            {result.immediate_actions?.length > 0 && (
              <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <AlertCircle size={18} color="#dc2626" />
                  <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.95rem' }}>Immediate Containment Actions</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {result.immediate_actions.map((act, i) => (
                    <li key={i} style={{ marginBottom: '0.3rem' }}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Organic / Biological Options */}
            {(result.biological_organic_options?.length > 0 || result.organic) && (
              <div className="card" style={{ borderLeft: '4px solid var(--green-primary)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <Sprout size={18} color="var(--green-primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--green-primary)', fontSize: '0.95rem' }}>Organic & Biological Control</span>
                </div>
                {result.biological_organic_options?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {result.biological_organic_options.map((opt, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{opt}</li>)}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.organic}</p>
                )}
              </div>
            )}

            {/* Chemical Options */}
            {result.chemical_options?.length > 0 ? (
              <div className="card" style={{ borderLeft: '4px solid var(--brown)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <FlaskConical size={18} color="var(--brown)" />
                  <span style={{ fontWeight: 700, color: 'var(--brown)', fontSize: '0.95rem' }}>Chemical Treatments (CIBRC Approved)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.chemical_options.map((chem, i) => (
                    <div key={i} style={{ background: '#faf6f0', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ebd8c2' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brown)', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                        {chem.active_ingredient}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        <strong>Application:</strong> {chem.application_instructions}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        <span style={{ background: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #ddd', color: '#b45309' }}>
                          ⏱️ <strong>PHI:</strong> {chem.pre_harvest_interval}
                        </span>
                        <span style={{ background: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #ddd', color: '#4b5563' }}>
                          🛡️ <strong>Safety:</strong> {chem.safety_requirements}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : result.treatment && (
              <div className="card" style={{ borderLeft: '4px solid var(--brown)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <FlaskConical size={18} color="var(--brown)" />
                  <span style={{ fontWeight: 700, color: 'var(--brown)', fontSize: '0.95rem' }}>Chemical Treatment</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.treatment}</p>
              </div>
            )}
          </div>

          <button className="btn btn-secondary" onClick={reset} style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}>
            <Upload size={16} /> Scan Another Leaf
          </button>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
