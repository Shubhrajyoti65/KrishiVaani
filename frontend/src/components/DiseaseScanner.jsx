import React, { useState, useRef } from 'react';
import { Leaf, Upload, Camera, CheckCircle, AlertCircle, Loader, FlaskConical, Sprout, X } from 'lucide-react';

const MOCK_DISEASES = [
  { disease: 'Leaf Blight', confidence: 0.87, severity: 'Moderate', treatment: 'Apply Mancozeb 75 WP @ 2.5 g/L water. Remove and destroy infected leaves. Improve drainage.', organic: 'Spray neem oil (5ml/L) + garlic extract solution. Improve air circulation between plants.', crop: 'Rice' },
  { disease: 'Powdery Mildew', confidence: 0.91, severity: 'High', treatment: 'Spray Sulfur 80 WP @ 3g/L. Apply Carbendazim 50 WP in severe cases.', organic: 'Spray baking soda solution (10g/L) + neem oil. Remove infected plant parts immediately.', crop: 'Wheat' },
  { disease: 'Rust', confidence: 0.78, severity: 'Low', treatment: 'Apply Propiconazole 25 EC @ 0.1%. Ensure proper plant spacing.', organic: 'Neem-based spray + wood ash dusting on leaves. Rotate crops next season.', crop: 'Wheat' },
  { disease: 'Healthy Plant', confidence: 0.95, severity: 'None', treatment: 'No treatment needed. Plant appears healthy.', organic: 'Continue regular organic fertilization and monitoring.', crop: 'General' },
];

const SEV_COLOR = {
  None:     { bg: 'var(--green-bg)',  border: 'var(--green-pale)',  text: 'var(--green-primary)' },
  Low:      { bg: 'var(--gold-pale)', border: '#e8d080',             text: '#9a6e0a' },
  Moderate: { bg: '#fff0e0',          border: '#f8c090',             text: '#c06010' },
  High:     { bg: '#fde8e3',          border: '#f0b8a8',             text: '#c04a30' },
};

export default function DiseaseScanner() {
  const [preview,  setPreview]  = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url); setResult(null); setError(null);
    analyzeImage(file);
  };

  const analyzeImage = async (file) => {
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('http://localhost:8000/api/v1/disease-detection/analyze', { method: 'POST', body: form });
      if (!res.ok) throw new Error('API error');
      setResult(await res.json());
    } catch {
      // Use mock result for demo
      const mock = MOCK_DISEASES[Math.floor(Math.random() * MOCK_DISEASES.length)];
      setTimeout(() => { setResult(mock); setLoading(false); }, 1200);
      return;
    }
    setLoading(false);
  };

  const reset = () => { setPreview(null); setResult(null); setError(null); };
  const sev = result ? (SEV_COLOR[result.severity] || SEV_COLOR.None) : null;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label">Computer Vision</span>
        <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Leaf Disease Scanner</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Upload a photo of your plant's leaf. Our AI will detect diseases and provide organic & chemical treatment remedies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Upload panel */}
        <div>
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
                padding: '4rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '320px',
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', maxWidth: '260px' }}>
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
              >
                <X size={18} color="var(--text-primary)" />
              </button>
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <Loader size={36} color="var(--green-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'var(--green-primary)', fontWeight: 600 }}>Analyzing leaf…</p>
                </div>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          {/* Tips */}
          <div className="card card-green" style={{ marginTop: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--green-primary)', marginBottom: '0.5rem' }}>📸 Photo Tips</div>
            {['Use good natural lighting', 'Capture full leaf, not just tip', 'Avoid blurry or very dark photos', 'One leaf per photo works best'].map(t => (
              <div key={t} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>• {t}</div>
            ))}
          </div>
        </div>

        {/* Results panel */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-section)' }}>
              <Leaf size={48} color="var(--green-pale)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Awaiting Analysis</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Upload a leaf photo to detect diseases and get organic treatment remedies.</p>
            </div>
          )}

          {result && sev && (
            <div className="animate-fade-in-up">
              {/* Disease name */}
              <div style={{ background: sev.bg, border: `2px solid ${sev.border}`, borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: sev.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                      Detection Result
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: sev.text }}>
                      {result.disease}
                    </div>
                  </div>
                  <span className="badge" style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}`, fontSize: '0.75rem' }}>
                    {result.severity} Severity
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: sev.text }}>{(result.confidence * 100).toFixed(0)}%</div>
                    <div style={{ fontSize: '0.72rem', color: sev.text, opacity: 0.7 }}>Confidence</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: sev.text }}>{result.crop}</div>
                    <div style={{ fontSize: '0.72rem', color: sev.text, opacity: 0.7 }}>Affected Crop</div>
                  </div>
                </div>
              </div>

              {/* Chemical treatment */}
              <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--brown)' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <FlaskConical size={18} color="var(--brown)" />
                  <span style={{ fontWeight: 700, color: 'var(--brown)', fontSize: '0.9rem' }}>Chemical Treatment</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.treatment}</p>
              </div>

              {/* Organic treatment */}
              <div className="card" style={{ borderLeft: '3px solid var(--green-primary)' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <Sprout size={18} color="var(--green-primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--green-primary)', fontSize: '0.9rem' }}>Organic / Natural Remedy</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.organic}</p>
              </div>

              <button className="btn btn-secondary" onClick={reset} style={{ width: '100%', marginTop: '1rem' }}>
                <Upload size={16} /> Scan Another Leaf
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
