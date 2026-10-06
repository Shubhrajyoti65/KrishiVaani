import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShieldCheck, FileText, AlertTriangle, ArrowLeft,
  Lock, CheckCircle2, Mail, ExternalLink, HelpCircle
} from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' | 'terms' | 'disclaimer'

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['privacy', 'terms', 'disclaimer'].includes(tab)) {
      setActiveTab(tab);
    } else if (location.hash === '#terms') {
      setActiveTab('terms');
    } else if (location.hash === '#disclaimer') {
      setActiveTab('disclaimer');
    }
  }, [location]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Tab Switcher */}
      <div
        style={{
          display: 'flex',
          width: 'fit-content',
          margin: '0 auto 2rem auto',
          background: 'var(--bg-section)',
          padding: '4px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-color)',
          gap: '4px',
        }}
      >
            {[
              { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
              { id: 'terms', label: 'Terms of Use', icon: FileText },
              { id: 'disclaimer', label: 'Disclaimer', icon: AlertTriangle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: activeTab === id ? 'var(--green-primary)' : 'transparent',
                  color: activeTab === id ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: activeTab === id ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div
            className="card-glass"
            style={{
              borderRadius: '24px',
              border: '1.5px solid var(--border-glass)',
              background: 'var(--bg-card)',
              padding: '2.5rem 2.25rem',
              boxShadow: 'var(--shadow-lg)',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              fontSize: '0.94rem',
            }}
          >
            {activeTab === 'privacy' && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Farmer Privacy Policy
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  At KrishiVaani, we believe that Indian farmers own their data. This Privacy Policy details our practices regarding the collection, storage, and utilization of data collected through the KrishiVaani platform.
                </p>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  1. Information We Collect
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  We only collect data necessary to provide personalized agronomic insights:
                </p>
                <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li><strong>Profile Information:</strong> Name, mobile phone number, district, state, and preferred language.</li>
                  <li><strong>Farm Parameters:</strong> Land area in acres, soil classification, irrigation type, and primary crops sown.</li>
                  <li><strong>Soil Test Records:</strong> Nitrogen (N), Phosphorus (P), Potassium (K), pH, and organic carbon levels entered by you or loaded from digital cards.</li>
                </ul>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  2. How Your Data Is Used
                </h3>
                <p style={{ marginBottom: '1.5rem' }}>
                  Your data is solely used to generate machine learning crop recommendations, calculate custom ICAR fertilizer doses, project yield & MSP earnings, and provide tailored AI farming chat responses. <strong>We do not sell, rent, or trade your personal information or farm data to third-party commercial entities.</strong>
                </p>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  3. Data Security & Storage
                </h3>
                <p style={{ marginBottom: '1.5rem' }}>
                  All telemetry and communication are encrypted via HTTPS/TLS. Farmer profile data is protected using standard hashed credentials. You may modify or delete your account records at any time.
                </p>

                <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--bg-section)', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={20} color="var(--green-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>Privacy Inquiries</span>
                    <span style={{ fontSize: '0.85rem' }}>
                      For privacy-related questions or data deletion requests, email us at{' '}
                      <a href="mailto:krishiVaani@gmail.com" style={{ color: 'var(--green-primary)', fontWeight: 700, textDecoration: 'none' }}>
                        krishiVaani@gmail.com
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Terms of Use
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  By accessing KrishiVaani, you agree to these Terms of Use. KrishiVaani is provided free of charge for Indian farmers, agricultural extension workers, and agronomists.
                </p>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  1. Platform Purpose & Advisory Role
                </h3>
                <p style={{ marginBottom: '1.5rem' }}>
                  KrishiVaani provides AI-assisted recommendations based on machine learning models, statistical datasets, and remote sensing imagery. Recommendations should be viewed as decision-support advisories alongside local Krishi Vigyan Kendra (KVK) guidance.
                </p>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  2. Acceptable Use
                </h3>
                <p style={{ marginBottom: '1.5rem' }}>
                  You agree not to misuse the platform, reverse-engineer proprietary algorithms, or deploy automated bots against our API endpoints.
                </p>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  3. Service Availability
                </h3>
                <p style={{ marginBottom: '1.5rem' }}>
                  While we strive for 99.9% uptime, we are not liable for transient disruptions in third-party services such as satellite data feeds (Sentinel-2) or national weather radar feeds (IMD).
                </p>
              </div>
            )}

            {activeTab === 'disclaimer' && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Agricultural Disclaimer
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  Please read this scientific disclaimer carefully before implementing agronomic recommendations from the platform.
                </p>

                <div style={{ padding: '1rem 1.25rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '12px', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  <strong>Notice:</strong> Crop yields, weather patterns, and market price realizations (MSP/Mandi) depend on unpredictable real-world factors including sudden pest outbreaks, localized cloudbursts, and global market fluctuations.
                </div>

                <p style={{ marginBottom: '1.25rem' }}>
                  1. <strong>Fertilizer & Chemical Doses:</strong> Dosages recommended by the Fertilizer Advisor are derived from standardized ICAR research formulations. Always verify soil pH and local crop stage before applying concentrated chemical inputs.
                </p>
                <p style={{ marginBottom: '1.25rem' }}>
                  2. <strong>Disease Diagnostics:</strong> The Leaf Disease Scanner utilizes computer vision models trained on extensive botanical datasets. For high-risk infestations, cross-verification with an agricultural field officer is advised.
                </p>
                <p style={{ marginBottom: '1.5rem' }}>
                  3. <strong>Market Forecasts:</strong> Yield and revenue calculations are statistical estimates. Minimum Support Prices (MSP) reflect official Government of India announcements at the time of publication.
                </p>
              </div>
            )}
          </div>
        </div>
        );
}
