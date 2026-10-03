import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle, style = {} }) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        border: '1px solid var(--border-glass)',
        background: isDark ? 'rgba(18, 49, 38, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: isDark ? '#fde047' : '#2d7a3a',
        cursor: 'pointer',
        boxShadow: isDark
          ? '0 2px 10px rgba(0, 0, 0, 0.35), inset 0 0 12px rgba(253, 224, 71, 0.12)'
          : '0 2px 8px rgba(45, 122, 58, 0.12)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        flexShrink: 0,
        ...style
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        e.currentTarget.style.borderColor = isDark ? '#4ade80' : 'var(--green-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.borderColor = 'var(--border-glass)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isDark ? 'rotate(360deg)' : 'rotate(0deg)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {isDark ? (
          <Moon size={19} color="#fde047" fill="#fde047" style={{ opacity: 0.95 }} />
        ) : (
          <Sun size={20} color="#d97706" fill="#f59e0b" style={{ opacity: 0.95 }} />
        )}
      </div>
    </button>
  );
}
