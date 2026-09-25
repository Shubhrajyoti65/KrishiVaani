import React from 'react';
import { Sprout, Globe, Activity, MessageSquare, CloudSun, Leaf, Satellite, LineChart } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentLang, setCurrentLang }) {
  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.8rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            background: 'var(--gradient-emerald)',
            padding: '0.6rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
          }}>
            <Sprout size={26} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="gradient-text">
              KrishiVaani <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', marginLeft: '0.4rem', fontWeight: 600 }}>v1.0</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              AI Smart Farming Guide for Indian Farmers
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('dashboard')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            <Activity size={16} /> Overview
          </button>
          
          <button
            className={activeTab === 'crop-rec' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('crop-rec')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            <Sprout size={16} /> Crop Rec
          </button>

          <button
            className={activeTab === 'yield' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('yield')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            <LineChart size={16} /> Yield & Revenue
          </button>

          <button
            className={activeTab === 'disease' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('disease')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            <Leaf size={16} /> Leaf Scanner
          </button>

          <button
            className={activeTab === 'weather' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('weather')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            <CloudSun size={16} /> Weather & Alerts
          </button>

          <button
            className={activeTab === 'satellite' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('satellite')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            <Satellite size={16} /> Satellite NDVI
          </button>

          <button
            className={activeTab === 'chatbot' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('chatbot')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            <MessageSquare size={16} /> AI Chatbot
          </button>
        </nav>

        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={18} color="var(--text-secondary)" />
          <select
            value={currentLang}
            onChange={(e) => setCurrentLang(e.target.value)}
            className="form-select"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="en">English (EN)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="or">ଓଡ଼ିଆ (Odia)</option>
          </select>
        </div>
      </div>
    </header>
  );
}
