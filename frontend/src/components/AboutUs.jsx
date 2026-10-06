import React from 'react';
import {
  Sprout, Users, ShieldCheck, Mail, MapPin, Award,
  ArrowLeft, HeartHandshake, Cpu, Globe, CheckCircle2,
  ExternalLink, Sparkles
} from 'lucide-react';

export default function AboutUs({ onBack }) {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Box */}
      <div className="segment-header-box">
        <div className="segment-header-icon">
          <Users size={24} />
        </div>
        <h1 className="segment-header-title">Empowering Indian Agriculture with AI</h1>
      </div>

      {/* Hero Mission Card */}
      <div
        className="card-glass"
        style={{
          borderRadius: '24px',
          border: '1.5px solid var(--border-glass)',
          background: 'var(--bg-card)',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.18) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px var(--green-glow)',
              flexShrink: 0,
            }}
          >
            <Sprout size={30} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
              Our Mission
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
              KrishiVaani was founded with a clear conviction: Every farmer in India deserves access to high-precision agronomic insights without paywalls or technical complexity. By combining calibrated Machine Learning, European Space Agency Sentinel-2 satellite telemetry, ICAR nutrient protocols, and Sarvam AI multilingual voice models in Hindi and Odia, we help farmers optimize yields, slash fertilizer costs, and protect their crops against climate volatility.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '18px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(34,197,94,0.15)', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Cpu size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            Scientific Precision
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            Trained on ICAR soil testing formulas and real Indian agro-climatic zones, delivering reliable advice tailored to your exact district and soil type.
          </p>
        </div>

        <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '18px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Globe size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            Multilingual & Accessible
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            Built for Bharat with native voice and text support in Hindi, Odia, and English, making complex ag-tech simple for rural farming communities.
          </p>
        </div>

        <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '18px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(168,85,247,0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShieldCheck size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            Farmer Data Sovereignty
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            Your land records, soil tests, and harvest yields remain completely confidential. We never monetize or sell individual farmer telemetry.
          </p>
        </div>
      </div>

      {/* Team & Contact Grid */}
      <div id="team" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Team Card */}
        <div className="card-glass" style={{ padding: '2rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Users size={22} color="var(--green-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              The Team Behind KrishiVaani
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
            KrishiVaani is engineered by dedicated agronomists, software architects, and AI researchers passionate about sustainable agriculture in India.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="var(--green-primary)" />
              <span>Machine Learning & Agronomic Modeling</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="var(--green-primary)" />
              <span>Earth Observation & Sentinel-2 Telemetry</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="var(--green-primary)" />
              <span>Rural Multilingual Voice UI Design</span>
            </div>
          </div>
        </div>

        {/* Contact Us Card */}
        <div id="contact" className="card-glass" style={{ padding: '2rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Mail size={22} color="var(--green-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Contact & Support
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
            Have questions, feedback, or partnership inquiries? Our team is always here to assist farmers, FPOs, and agricultural scientists.
          </p>
          <div
            style={{
              background: 'var(--bg-section)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Mail size={16} color="var(--green-primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Official Email:</span>
              <a
                href="mailto:krishiVaani@gmail.com"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--green-primary)',
                  textDecoration: 'none',
                }}
              >
                krishiVaani@gmail.com
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <MapPin size={16} color="var(--green-primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Location:</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Bhadrak & Bhubaneswar, Odisha, India
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
