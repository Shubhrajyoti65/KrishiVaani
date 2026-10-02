import React, { useState, useRef } from 'react';
import { Leaf, Upload, Camera, CheckCircle, AlertCircle, Loader, FlaskConical, Sprout, X, Cpu, ShieldCheck, Bug, RefreshCw } from 'lucide-react';

const SEV_COLOR = {
  None:     { bg: 'var(--green-bg)',  border: 'var(--green-pale)',  text: 'var(--green-primary)' },
  Low:      { bg: 'var(--gold-pale)', border: '#e8d080',             text: '#9a6e0a' },
  Moderate: { bg: '#fff0e0',          border: '#f8c090',             text: '#c06010' },
  High:     { bg: '#fde8e3',          border: '#f0b8a8',             text: '#c04a30' },
};

const COMMON_CROPS = [
  { id: 'tomato',    name: 'Tomato (टमाटर)',          icon: '🍅' },
  { id: 'potato',    name: 'Potato (आलू)',            icon: '🥔' },
  { id: 'rice',      name: 'Rice / Paddy (धान)',      icon: '🌾' },
  { id: 'wheat',     name: 'Wheat (गेहूं)',           icon: '🌾' },
  { id: 'cotton',    name: 'Cotton (कपास)',           icon: '🌱' },
  { id: 'maize',     name: 'Maize / Corn (मक्का)',    icon: '🌽' },
  { id: 'chilli',    name: 'Chilli / Pepper (मिर्च)', icon: '🌶️' },
  { id: 'soybean',   name: 'Soybean (सोयाबीन)',       icon: '🫘' },
  { id: 'apple',     name: 'Apple (सेब)',             icon: '🍎' },
  { id: 'banana',    name: 'Banana (केला)',           icon: '🍌' },
  { id: 'mango',     name: 'Mango (आम)',              icon: '🥭' },
  { id: 'cucumber',  name: 'Cucumber (खीरा)',         icon: '🥒' },
  { id: 'sugarcane', name: 'Sugarcane (गन्ना)',       icon: '🎋' },
  { id: 'cabbage',   name: 'Cabbage (पत्तागोभी)',     icon: '🥬' },
  { id: 'groundnut', name: 'Groundnut (मूंगफली)',     icon: '🥜' },
  { id: 'onion',     name: 'Onion (प्याज)',           icon: '🧅' },
  { id: 'general',   name: 'Other / General Crop',    icon: '🌿' },
];

export default function DiseaseScanner() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [result,       setResult]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const fileRef = useRef(null);

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
        } catch (_) {}
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

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const sev = result ? (SEV_COLOR[result.severity] || SEV_COLOR.None) : null;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="section-label">Computer Vision</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Leaf Disease Scanner</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
          Select your plant type and upload a photo of your leaf. DigiGreen AI will diagnose diseases and provide organic & chemical remedies.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '24px', padding: '0.3rem 0.85rem', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
          <Cpu size={15} color="#16a34a" />
          <span>Powered by DigiGreen Multi-Task Vision AI (DaViT-Base) • 110 Crops • 285 Diseases • 92 Pests</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Upload panel */}
        <div>
          {/* Target Crop Selector */}
          <div style={{ marginBottom: '1rem', background: '#ffffff', padding: '1rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label htmlFor="crop-select" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                🌱 Select Crop / Plant Type:
              </label>
              {selectedFile && (
                <span style={{ fontSize: '0.72rem', color: 'var(--green-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <RefreshCw size={11} className={loading ? "spin-icon" : ""} /> Auto-updates on change
                </span>
              )}
            </div>
            <select
              id="crop-select"
              value={selectedCrop}
              onChange={e => handleCropChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: selectedCrop ? '1.5px solid var(--green-primary)' : '1.5px solid #cbd5e1',
                fontSize: '0.9rem',
                background: selectedCrop ? '#f0fdf4' : '#ffffff',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <option value="">-- Choose Your Crop (e.g. Tomato, Rice, Wheat) --</option>
              {COMMON_CROPS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem', marginBottom: 0 }}>
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
                border: `2px dashed ${dragOver ? 'var(--green-primary)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-lg)',
                background: dragOver ? 'var(--green-bg)' : '#ffffff',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 80, height: 80, background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2px solid var(--green-pale)' }}>
                <Upload size={34} color="var(--green-primary)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>Upload Leaf Photo</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', maxWidth: '280px' }}>
                Drag & drop or click to upload. JPG, PNG, WEBP supported.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-primary btn-sm" type="button">
                  <Camera size={15} /> Take / Upload Photo
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Works best with close-up photos of individual leaves
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <img
                src={preview}
                alt="Uploaded leaf"
                style={{ width: '100%', borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-color)', maxHeight: '380px', objectFit: 'cover' }}
              />
              <button
                onClick={reset}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-color)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                title="Remove photo"
              >
                <X size={18} color="var(--text-primary)" />
              </button>
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <Loader size={36} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'var(--green-primary)', fontWeight: 600 }}>Analyzing leaf with DigiGreen Vision AI…</p>
                </div>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          {/* Tips */}
          <div className="card card-green" style={{ marginTop: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--green-primary)', marginBottom: '0.5rem' }}>📸 Photo Tips</div>
            {['Select crop above to ensure exact disease diagnosis', 'Use good natural lighting', 'Capture full affected leaf surface', 'One leaf per photo works best'].map(t => (
              <div key={t} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>• {t}</div>
            ))}
          </div>
        </div>

        {/* Results panel */}
        <div>
          {error && (
            <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: '#b91c1c', fontWeight: 700, fontSize: '0.95rem' }}>
                <AlertCircle size={20} color="#b91c1c" /> DigiGreen AI Processing Notice
              </div>
              <p style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '0.4rem', lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-section)' }}>
              <Leaf size={48} color="var(--green-pale)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Awaiting Leaf Photo</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Select your crop type on the left and upload a photo to inspect for plant diseases and pests.
              </p>
            </div>
          )}

          {result && sev && (
            <div className="animate-fade-in-up">
              {/* Disease name card */}
              <div style={{ background: sev.bg, border: `2px solid ${sev.border}`, borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.85)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: `1px solid ${sev.border}`, color: sev.text, fontWeight: 700, letterSpacing: '0.04em' }}>
                    🤖 DigiGreen DaViT-Base Vision AI
                  </span>
                  {result.condition_type && (
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', background: result.condition_type === 'healthy' ? '#dcfce7' : result.condition_type === 'pest' ? '#fef3c7' : '#fee2e2', color: result.condition_type === 'healthy' ? '#15803d' : result.condition_type === 'pest' ? '#b45309' : '#b91c1c' }}>
                      {result.condition_type}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: sev.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                      Detection Result
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: sev.text }}>
                      {result.condition || result.disease}
                    </div>
                  </div>
                  <span className="badge" style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}`, fontSize: '0.75rem' }}>
                    {result.severity} Severity
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: sev.text }}>{(result.confidence * 100).toFixed(0)}%</div>
                    <div style={{ fontSize: '0.72rem', color: sev.text, opacity: 0.7 }}>Diagnosis Confidence</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: sev.text }}>
                      {result.crop || result.crop_name}
                      {result.is_crop_user_selected ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.35rem', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
                          Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: '0.35rem', opacity: 0.8 }}>
                          (Auto-detected)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: sev.text, opacity: 0.7 }}>Host Crop</div>
                  </div>
                </div>

                {/* Alternative Differential Diagnoses */}
                {result.top_diseases && result.top_diseases.length > 0 && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: `1px dashed ${sev.border}` }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: sev.text, opacity: 0.85, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Alternative Differential Diagnoses:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {result.top_diseases.map((alt, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${sev.border}`, borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.73rem', color: sev.text }}>
                          {alt.name} ({(alt.confidence * 100).toFixed(1)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Detected Pest Warning Card */}
              {result.top_pest && (result.condition_type === 'pest' || (result.pest_confidence && result.pest_confidence > 0.25)) && (
                <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a', marginBottom: '1rem', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#92400e', fontWeight: 700, fontSize: '0.88rem' }}>
                    <Bug size={17} color="#b45309" /> Detected Insect / Pest: {result.top_pest}
                  </div>
                  {result.pest_confidence && (
                    <div style={{ fontSize: '0.76rem', color: '#78350f', marginTop: '0.2rem' }}>
                      Pest Detection Probability: {(result.pest_confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              )}

              {/* Reliability warning if low confidence */}
              {result.is_reliable === false && (
                <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '1rem', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#b45309', fontWeight: 600, fontSize: '0.85rem' }}>
                    <AlertCircle size={16} /> Caution: Low Confidence Prediction
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '0.25rem' }}>
                    {result.reliability_message || "Confidence is below 60%. Chemical pesticides are withheld for safety. Please verify with your local KVK expert or upload a clearer photo."}
                  </div>
                </div>
              )}

              {/* Immediate actions */}
              {result.immediate_actions?.length > 0 && (
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid #dc2626' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <AlertCircle size={18} color="#dc2626" />
                    <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>Immediate Actions</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {result.immediate_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Organic / Biological options */}
              {(result.biological_organic_options?.length > 0 || result.organic) && (
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--green-primary)' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <Sprout size={18} color="var(--green-primary)" />
                    <span style={{ fontWeight: 700, color: 'var(--green-primary)', fontSize: '0.9rem' }}>Organic & Biological Control</span>
                  </div>
                  {result.biological_organic_options?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {result.biological_organic_options.map((opt, i) => <li key={i}>{opt}</li>)}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.organic}</p>
                  )}
                </div>
              )}

              {/* Chemical options with CIBRC & Pre-Harvest Interval (PHI) */}
              {result.chemical_options?.length > 0 ? (
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--brown)' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <FlaskConical size={18} color="var(--brown)" />
                    <span style={{ fontWeight: 700, color: 'var(--brown)', fontSize: '0.9rem' }}>Chemical Control (CIBRC Approved)</span>
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
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                          <span style={{ background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #ddd', color: '#b45309' }}>
                            ⏱️ <strong>PHI:</strong> {chem.pre_harvest_interval}
                          </span>
                          <span style={{ background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #ddd', color: '#4b5563' }}>
                            🛡️ <strong>Safety:</strong> {chem.safety_requirements}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : result.treatment && (
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--brown)' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <FlaskConical size={18} color="var(--brown)" />
                    <span style={{ fontWeight: 700, color: 'var(--brown)', fontSize: '0.9rem' }}>Chemical Treatment</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.treatment}</p>
                </div>
              )}

              {/* Safety & Spraying precautions */}
              {result.safety_instructions?.length > 0 && (
                <div className="card" style={{ marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
                    ⚠️ Safety & Spray Precautions
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                    {result.safety_instructions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* KVK Expert Contact Guidance */}
              {result.when_to_contact_expert && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-section)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  🏛️ <strong>Expert Guidance:</strong> {result.when_to_contact_expert}
                </div>
              )}

              <button className="btn btn-secondary" onClick={reset} style={{ width: '100%', marginTop: '0.5rem' }}>
                <Upload size={16} /> Scan Another Leaf
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
