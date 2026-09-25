import React, { useState } from 'react';
import Navbar from './components/Navbar';
import WeatherWidget from './components/WeatherWidget';
import CropRecommendationCard from './components/CropRecommendationCard';
import YieldCalculator from './components/YieldCalculator';
import DiseaseScanner from './components/DiseaseScanner';
import SatelliteTracker from './components/SatelliteTracker';
import ChatbotWidget from './components/ChatbotWidget';
import { Sprout, LineChart, Leaf, CloudSun, Satellite, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentLang, setCurrentLang] = useState('en');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
      />

      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* HERO BANNER FOR DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="glass-card animate-fade-in" style={{
              background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(13, 148, 136, 0.2) 50%, rgba(2, 132, 199, 0.25) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              marginBottom: '1.5rem',
              padding: '2rem 1.5rem'
            }}>
              <div style={{ maxWidth: '800px' }}>
                <span className="badge badge-success" style={{ marginBottom: '0.6rem' }}>
                  <Zap size={12} /> AI/ML-Powered Indian Farming Assistant Platform
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>
                  Empowering Indian Farmers with <span className="gradient-text">Data-Driven Precision Agriculture</span>
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Get personalized crop recommendations, soil health diagnosis, harvest yield predictions, extreme weather alerts, leaf disease cure remedies, and Sentinel-2 satellite canopy tracking.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => setActiveTab('crop-rec')}>
                    <Sprout size={18} /> Get Crop Recommendation
                  </button>
                  <button className="btn-secondary" onClick={() => setActiveTab('chatbot')}>
                    <MessageSquare size={18} /> Chat with AI Assistant
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('crop-rec')}>
                <Sprout color="#22c55e" size={28} style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Crop Recommendation</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Soil NPK & climate-matched crop prediction engine</p>
              </div>

              <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('yield')}>
                <LineChart color="#f59e0b" size={28} style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Yield & Revenue Calculator</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Quintals production and Indian MSP revenue estimate</p>
              </div>

              <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('disease')}>
                <Leaf color="#10b981" size={28} style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Leaf Disease Scanner</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Computer Vision photo upload & organic cure remedies</p>
              </div>

              <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('satellite')}>
                <Satellite color="#0284c7" size={28} style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Satellite NDVI Health</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sentinel-2 vegetation canopy health & water stress</p>
              </div>
            </div>

            {/* Main Weather Overview */}
            <WeatherWidget />

            {/* Side-by-side modules */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              <CropRecommendationCard />
              <YieldCalculator />
            </div>
          </div>
        )}

        {/* SPECIFIC TAB VIEWS */}
        {activeTab === 'crop-rec' && <CropRecommendationCard />}
        {activeTab === 'yield' && <YieldCalculator />}
        {activeTab === 'disease' && <DiseaseScanner />}
        {activeTab === 'weather' && <WeatherWidget />}
        {activeTab === 'satellite' && <SatelliteTracker />}
        {activeTab === 'chatbot' && <ChatbotWidget currentLang={currentLang} />}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid var(--border-color)',
        padding: '1.25rem 1rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginTop: '2rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>KrishiVaani AI Platform</strong> — Smart Farming & Agriculture Guidance for Indian Farmers
          </div>
          <div>
            Built with FastAPI • React PWA • MongoDB • LangChain • Scikit-Learn • Bhashini
          </div>
        </div>
      </footer>
    </div>
  );
}
