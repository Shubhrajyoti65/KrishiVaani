import React, { useState } from 'react';
import { Leaf, Upload, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function DiseaseScanner() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cropHint, setCropHint] = useState('rice');
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('crop_hint', cropHint);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/disease-detection/analyze', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosis(data);
      }
    } catch (err) {
      console.error('Disease scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
        <Leaf color="#10b981" size={26} />
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>AI Crop Leaf Disease Scanner</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload a photo of an infected leaf to get an instant AI diagnosis & treatment guide</p>
        </div>
      </div>

      <form onSubmit={handleUpload} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Crop Species Hint</label>
            <select className="form-select" value={cropHint} onChange={(e) => setCropHint(e.target.value)}>
              <option value="rice">Rice (धान)</option>
              <option value="potato">Potato (आलू)</option>
              <option value="tomato">Tomato (टमाटर)</option>
              <option value="cotton">Cotton (कपास)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Upload Crop Leaf Photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" required />
          </div>
        </div>

        {previewUrl && (
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <img src={previewUrl} alt="Leaf Preview" style={{ maxHeight: '180px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading || !selectedFile} style={{ width: '100%', padding: '0.85rem' }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} Analyze Leaf Photo
        </button>
      </form>

      {/* Diagnosis Results */}
      {diagnosis && (
        <div style={{
          background: diagnosis.is_healthy ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${diagnosis.is_healthy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className={`badge ${diagnosis.is_healthy ? 'badge-success' : 'badge-danger'}`}>
                {diagnosis.severity}
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {diagnosis.disease_name}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI Confidence</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: diagnosis.is_healthy ? '#4ade80' : '#f87171' }}>
                {(diagnosis.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Organic Treatments */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#4ade80', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🍃 Organic & Biological Remedies
            </h4>
            {diagnosis.organic_treatments.map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}>• {item}</p>
            ))}
          </div>

          {/* Chemical Treatments */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fbbf24', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🧪 Recommended Chemical Fungicide / Treatment
            </h4>
            {diagnosis.chemical_treatments.map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}>• {item}</p>
            ))}
          </div>

          {/* Preventive Measures */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#60a5fa', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🛡️ Preventive Crop Care Guidelines
            </h4>
            {diagnosis.preventive_measures.map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}>• {item}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
