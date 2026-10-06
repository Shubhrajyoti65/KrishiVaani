import React, { useState } from 'react';
import {
  X, User, Phone, Lock, CheckCircle, AlertCircle, Loader,
  Sprout, ShieldCheck, Eye, EyeOff, Check, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, authModalTab, closeAuth, openAuth, register, login, authError, setAuthError } = useAuth();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  if (!authModalOpen) return null;

  // Real-time password condition checkers
  const rules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[@$!%*?&#^()_\-+={}[\]:;"'<>,.?/\\|~`]/.test(password),
  };

  const allRulesPassed = rules.minLength && rules.hasUpper && rules.hasLower && rules.hasNumber && rules.hasSpecial;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleTabSwitch = (tab) => {
    openAuth(tab);
    setAuthError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setSuccess(null);

    try {
      if (authModalTab === 'register') {
        // Validate Conditions
        if (!rules.minLength) {
          throw new Error('Password must be at least 8 characters long.');
        }
        if (!rules.hasUpper) {
          throw new Error('Password must contain at least 1 uppercase letter (A-Z).');
        }
        if (!rules.hasLower) {
          throw new Error('Password must contain at least 1 lowercase letter (a-z).');
        }
        if (!rules.hasNumber) {
          throw new Error('Password must contain at least 1 number (0-9).');
        }
        if (!rules.hasSpecial) {
          throw new Error('Password must contain at least 1 special character (e.g. @, #, $, etc.).');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter confirm password.');
        }

        const acc = await register({ name, mobile, password });
        setSuccess(`Welcome, ${acc.name}! Your farmer account is registered.`);
      } else {
        const acc = await login({ mobile, password });
        setSuccess(`Welcome back, ${acc.name}!`);
      }
      setTimeout(() => {
        setSuccess(null);
      }, 1200);
    } catch (err) {
      setAuthError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(10, 25, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuth();
      }}
    >
      <div
        className="card-glass animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '92vh',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1.5px solid var(--border-glass)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '2px 4px 2px 0',
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuth}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface-glass)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--green-pale)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <X size={16} />
        </button>

        {/* Scrollable Container with aligned inset scrollbar */}
        <div
          className="auth-modal-scroll"
          style={{
            overflowY: 'auto',
            maxHeight: 'calc(92vh - 4px)',
            padding: '1.5rem 1.6rem 1.35rem 1.6rem',
            boxSizing: 'border-box',
          }}
        >
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px var(--green-glow)',
                flexShrink: 0,
              }}
            >
              <Sprout size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {authModalTab === 'register' ? 'Farmer Registration' : 'Farmer Sign In'}
              </h3>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {authModalTab === 'register' ? 'Create profile to save farm & soil data' : 'Access your saved farm records'}
              </div>
            </div>
          </div>

          {/* Tab Switcher Slider */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'var(--bg-section)',
              padding: '4px',
              borderRadius: 'var(--radius-pill)',
              marginBottom: '1rem',
              border: '1px solid var(--border-color)',
              gap: '4px',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              style={{
                padding: '0.5rem',
                height: '36px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: authModalTab === 'register' ? 'var(--green-primary)' : 'transparent',
                color: authModalTab === 'register' ? '#fff' : 'var(--text-secondary)',
                boxShadow: authModalTab === 'register' ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              style={{
                padding: '0.5rem',
                height: '36px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: authModalTab === 'login' ? 'var(--green-primary)' : 'transparent',
                color: authModalTab === 'login' ? '#fff' : 'var(--text-secondary)',
                boxShadow: authModalTab === 'login' ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
          </div>

        {/* Error Alert */}
        {authError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              color: '#ef4444',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              color: '#22c55e',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Full Name (Register only) */}
          {authModalTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Mohanty"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {/* Mobile Number */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Mobile Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit number (e.g. 9876543210)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={authModalTab === 'register' ? 'Create a strong password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 2.4rem 0.6rem 2.4rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Validation Checklist (Register only) */}
          {authModalTab === 'register' && password.length > 0 && (
            <div
              style={{
                background: 'var(--bg-section)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.55rem 0.8rem',
                fontSize: '0.74rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                Password Requirements:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: rules.minLength ? '#22c55e' : 'var(--text-muted)' }}>
                  <Check size={13} strokeWidth={rules.minLength ? 3 : 1.5} />
                  <span>Min 8 characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: rules.hasUpper ? '#22c55e' : 'var(--text-muted)' }}>
                  <Check size={13} strokeWidth={rules.hasUpper ? 3 : 1.5} />
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: rules.hasLower ? '#22c55e' : 'var(--text-muted)' }}>
                  <Check size={13} strokeWidth={rules.hasLower ? 3 : 1.5} />
                  <span>1 Lowercase (a-z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: rules.hasNumber ? '#22c55e' : 'var(--text-muted)' }}>
                  <Check size={13} strokeWidth={rules.hasNumber ? 3 : 1.5} />
                  <span>1 Number (0-9)</span>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.35rem', color: rules.hasSpecial ? '#22c55e' : 'var(--text-muted)' }}>
                  <Check size={13} strokeWidth={rules.hasSpecial ? 3 : 1.5} />
                  <span>1 Special character (e.g. @, #, $, etc.)</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {authModalTab === 'register' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Confirm Password
                </label>
                {confirmPassword.length > 0 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: passwordsMatch ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {passwordsMatch ? (
                      <>
                        <Check size={12} /> Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} /> Passwords do not match
                      </>
                    )}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color={confirmPassword.length > 0 ? (passwordsMatch ? '#22c55e' : '#ef4444') : 'var(--text-muted)'}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 2.4rem 0.6rem 2.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${confirmPassword.length > 0 ? (passwordsMatch ? '#22c55e' : '#ef4444') : 'var(--border-color)'}`,
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : authModalTab === 'register' ? (
              'Register Farmer Profile'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Security / Privacy Hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', marginTop: '1.2rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <ShieldCheck size={14} color="var(--green-primary)" />
          <span>Unlocks AI Assistant chat, farm records & personalized advisory.</span>
        </div>
        </div>
      </div>
    </div>
  );
}
