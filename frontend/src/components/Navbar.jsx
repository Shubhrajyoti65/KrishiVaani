import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout, Activity, MessageSquare, CloudSun,
  Leaf, Satellite, LineChart, Menu, X, ChevronRight, ChevronLeft,
  User, FlaskConical, CalendarDays, RefreshCw, Sparkles, Shield, LogOut
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const NAV_SERVICES = [
  // Section 0: Primary Agricultural Intelligence (6 items)
  {
    id: 'dashboard',
    path: '/',
    aliases: ['/dashboard'],
    label: 'Overview',
    desc: 'Platform home & live key metrics',
    icon: Activity,
    section: 0,
  },
  {
    id: 'crop-rec',
    path: '/crop-recommendation',
    aliases: ['/crop-rec'],
    label: 'Crops',
    desc: 'Soil & climate crop advisory',
    icon: Sprout,
    section: 0,
  },
  {
    id: 'weather',
    path: '/weather-alerts',
    aliases: ['/weather'],
    label: 'Weather',
    desc: '24h forecast & severe weather',
    icon: CloudSun,
    section: 0,
  },
  {
    id: 'disease',
    path: '/disease-scanner',
    aliases: ['/disease'],
    label: 'Disease Scanner',
    desc: 'Instant leaf disease diagnostics',
    icon: Leaf,
    section: 0,
  },
  {
    id: 'yield',
    path: '/yield-prediction',
    aliases: ['/yield'],
    label: 'Yield & Revenue',
    desc: 'Harvest & government pricing',
    icon: LineChart,
    section: 0,
  },
  {
    id: 'fertilizer',
    path: '/fertilizer-advisor',
    aliases: ['/fertilizer'],
    label: 'Soil & Fertilizer',
    desc: 'Urea, DAP & MOP dosage guide',
    icon: FlaskConical,
    section: 0,
  },

  // Section 1: Extended Agronomic & Field Tools (5 items)
  {
    id: 'satellite',
    path: '/satellite-map',
    aliases: ['/satellite'],
    label: 'Satellite Map',
    desc: 'Canopy greenness & farm health',
    icon: Satellite,
    section: 1,
  },
  {
    id: 'calendar',
    path: '/crop-calendar',
    aliases: ['/calendar'],
    label: 'Crop Calendar',
    desc: 'State-wise sowing & harvest time',
    icon: CalendarDays,
    section: 1,
  },
  {
    id: 'rotation',
    path: '/crop-rotation',
    aliases: ['/rotation'],
    label: 'Crop Rotation',
    desc: 'Soil nutrient balancing sequences',
    icon: RefreshCw,
    section: 1,
  },
  {
    id: 'chatbot',
    path: '/ai-assistant',
    aliases: ['/chatbot'],
    label: 'AI Assistant',
    desc: 'Multilingual chat in Hindi & Odia',
    icon: MessageSquare,
    section: 1,
  },
  {
    id: 'profile',
    path: '/farmer-profile',
    aliases: ['/profile'],
    label: 'Farm Records',
    desc: 'Digital land & soil test cards',
    icon: User,
    section: 1,
  },
];

const LANGS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'हि', full: 'हिन्दी' },
  { code: 'or', label: 'ଓ', full: 'ଓଡ଼ିଆ' },
];

export default function Navbar({ activeTab, setActiveTab, currentLang, setCurrentLang, theme = 'light', setTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, openAuth, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navSection, setNavSection] = useState(0); // 0 or 1
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [leftOverflowOpen, setLeftOverflowOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const overflowRef = useRef(null);
  const leftOverflowRef = useRef(null);

  // Helper to determine if a service is currently active based on current URL path
  const isServiceActive = (service) => {
    const currentPath = location.pathname;
    if (service.path === '/') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    if (currentPath === service.path || (service.path !== '/' && currentPath.startsWith(service.path))) {
      return true;
    }
    if (service.aliases && service.aliases.some(alias => currentPath === alias || currentPath.startsWith(alias))) {
      return true;
    }
    return activeTab === service.id;
  };

  // Helper to check if any service in a specific section is active
  const isSectionActive = (sectionIndex) => {
    return NAV_SERVICES.some(s => s.section === sectionIndex && isServiceActive(s));
  };

  // Auto-switch to the section containing the currently active page whenever route changes
  useEffect(() => {
    const activeService = NAV_SERVICES.find(isServiceActive);
    if (activeService) {
      setNavSection(activeService.section);
    }
  }, [location.pathname, activeTab]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(e.target)) {
        setOverflowOpen(false);
      }
      if (leftOverflowRef.current && !leftOverflowRef.current.contains(e.target)) {
        setLeftOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProfileOpen(false);
        setOverflowOpen(false);
        setLeftOverflowOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [menuOpen]);

  const handleSelect = (id) => {
    const item = NAV_SERVICES.find(n => n.id === id);
    if (item) {
      navigate(item.path);
      setNavSection(item.section);
    } else {
      navigate('/');
      setNavSection(0);
    }
    if (setActiveTab) setActiveTab(id);
    setMenuOpen(false);
    setOverflowOpen(false);
    setLeftOverflowOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    if (setTheme) {
      setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)',
        boxShadow: scrolled ? 'var(--shadow-glass)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', maxWidth: '1220px' }}>

          {/* ── Brand Logo & Title ── */}
          <div
            onClick={() => handleSelect('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: 42, height: 42,
              background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px var(--green-glow)',
              transition: 'transform 0.2s ease',
            }}>
              <Sprout size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                KrishiVaani
              </div>
            </div>
          </div>

          {/* ── Center: Unified Professional SaaS Navigation with Overflow Control ── */}
          <nav
            className="navbar-center-nav"
            role="navigation"
            aria-label="Application Services"
          >
            {navSection === 0 ? (
              <>
                {NAV_SERVICES.filter(s => s.section === 0).map(s => {
                  const active = isServiceActive(s);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelect(s.id)}
                      className={`nav-item-pill ${active ? 'active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      title={s.desc}
                    >
                      {s.label}
                    </button>
                  );
                })}

                {/* Section 0: "•••" Overflow Control (on the right) */}
                <div
                  ref={overflowRef}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                  onMouseEnter={() => setOverflowOpen(true)}
                  onMouseLeave={() => setOverflowOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setNavSection(1);
                      setOverflowOpen(false);
                    }}
                    className={`nav-item-pill nav-overflow-btn ${isSectionActive(1) ? 'active' : ''}`}
                    aria-label="More services (click to switch to next set)"
                    aria-expanded={overflowOpen}
                    title="More services (Click to reveal next set)"
                  >
                    <span>•••</span>
                  </button>

                  {/* Dropdown Popover on Hover/Focus */}
                  {overflowOpen && (
                    <div
                      className="nav-overflow-popover animate-fade-in"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '220px',
                        borderRadius: 'var(--radius-lg)',
                        padding: '0.45rem',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      {NAV_SERVICES.filter(s => s.section === 1).map(service => {
                        const active = isServiceActive(service);
                        const Icon = service.icon;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleSelect(service.id)}
                            className={`nav-popover-item ${active ? 'active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                          >
                            <div style={{
                              width: 26, height: 26, borderRadius: '8px',
                              background: active ? 'var(--green-primary)' : 'var(--bg-section)',
                              color: active ? '#ffffff' : 'var(--green-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Icon size={14} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: active ? 700 : 600, fontSize: '0.84rem' }}>{service.label}</div>
                            </div>
                            {active && (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: 'var(--green-primary)',
                                background: 'var(--green-bg)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Section 1: Left-side "•••" control (replaces Back button) */}
                <div
                  ref={leftOverflowRef}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                  onMouseEnter={() => setLeftOverflowOpen(true)}
                  onMouseLeave={() => setLeftOverflowOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setNavSection(0);
                      setLeftOverflowOpen(false);
                    }}
                    className={`nav-item-pill nav-overflow-btn ${isSectionActive(0) ? 'active' : ''}`}
                    aria-label="Previous services (click to switch to first set)"
                    aria-expanded={leftOverflowOpen}
                    title="Previous services (Click to reveal first set)"
                  >
                    <span>•••</span>
                  </button>

                  {/* Dropdown Popover on Hover/Focus */}
                  {leftOverflowOpen && (
                    <div
                      className="nav-overflow-popover animate-fade-in"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        minWidth: '220px',
                        borderRadius: 'var(--radius-lg)',
                        padding: '0.45rem',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      {NAV_SERVICES.filter(s => s.section === 0).map(service => {
                        const active = isServiceActive(service);
                        const Icon = service.icon;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleSelect(service.id)}
                            className={`nav-popover-item ${active ? 'active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                          >
                            <div style={{
                              width: 26, height: 26, borderRadius: '8px',
                              background: active ? 'var(--green-primary)' : 'var(--bg-section)',
                              color: active ? '#ffffff' : 'var(--green-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Icon size={14} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: active ? 700 : 600, fontSize: '0.84rem' }}>{service.label}</div>
                            </div>
                            {active && (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: 'var(--green-primary)',
                                background: 'var(--green-bg)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {NAV_SERVICES.filter(s => s.section === 1).map(s => {
                  const active = isServiceActive(s);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelect(s.id)}
                      className={`nav-item-pill ${active ? 'active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      title={s.desc}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </>
            )}
          </nav>

          {/* ── Right Controls: Theme Toggle, Profile Icon & 3-Bar Menu ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Theme Toggle Button */}
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />

            {/* Profile Icon / Account Control (Symbol Only) */}
            <div ref={profileMenuRef} style={{ position: 'relative' }}>
              {isAuthenticated ? (
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  aria-label="Farmer Profile Menu"
                  title={user.name ? `${user.name} - Account` : "Farmer Account"}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1.5px solid var(--green-pale)',
                    background: 'var(--green-bg)',
                    color: 'var(--green-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--green-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'F'}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => openAuth('register')}
                  aria-label="Register Farmer Profile"
                  title="Farmer Profile & Registration"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border-glass)',
                    background: 'var(--bg-surface-glass)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                    padding: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--green-primary)';
                    e.currentTarget.style.color = 'var(--green-primary)';
                    e.currentTarget.style.background = 'var(--green-bg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--bg-surface-glass)';
                  }}
                >
                  <User size={18} />
                </button>
              )}

              {/* Profile Dropdown Popover */}
              {profileOpen && isAuthenticated && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.65rem)',
                    right: 0,
                    width: '270px',
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '1rem',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      📱 +91 {user.mobile}
                    </div>
                    <div style={{ display: 'inline-block', marginTop: '0.4rem', padding: '0.2rem 0.55rem', background: 'var(--green-bg)', color: 'var(--green-primary)', borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: 700 }}>
                      ✓ Registered Farmer Account
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/farmer-profile');
                      setProfileOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'var(--bg-section)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.55rem 0.75rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <Sprout size={16} color="var(--green-primary)" />
                    <span>My Farm & Soil Records</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      padding: '0.4rem 0.5rem',
                      color: '#ef4444',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── 3-Bar Hamburger Menu Button ── */}
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              title="All Features Menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-glass)',
                background: menuOpen ? 'var(--green-bg)' : 'var(--bg-surface-glass)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: menuOpen ? 'var(--green-primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--green-primary)';
                e.currentTarget.style.background = 'var(--green-bg)';
                e.currentTarget.style.color = 'var(--green-primary)';
              }}
              onMouseLeave={e => {
                if (!menuOpen) {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.background = 'var(--bg-surface-glass)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Right-Side Slide-out Navigation Drawer Overlay ── */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            background: 'rgba(28, 43, 26, 0.45)',
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* ── Drawer Panel ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '390px',
          background: 'var(--bg-surface-glass-heavy)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          zIndex: 999,
          boxShadow: 'var(--shadow-glass)',
          borderLeft: '1px solid var(--border-glass)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-section)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-light) 100%)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px var(--green-glow)'
            }}>
              <Sprout size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                Services
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} style={{ width: '34px', height: '34px' }} />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-surface-glass)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fef2f2';
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.borderColor = '#fecaca';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-surface-glass)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
        }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0.35rem 0.6rem 0.2rem' }}>
            Navigation & Tools
          </div>

          {NAV_SERVICES.map((service) => {
            const { id, label, desc, icon: Icon } = service;
            const isActive = isServiceActive(service);
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1.5px solid var(--green-primary)' : '1px solid transparent',
                  background: isActive ? 'var(--green-bg)' : 'transparent',
                  color: isActive ? 'var(--green-primary)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-section)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: isActive ? 'var(--green-primary)' : 'var(--bg-section)',
                  color: isActive ? '#ffffff' : 'var(--green-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}>
                  <Icon size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: isActive ? 700 : 600, fontSize: '0.92rem', color: isActive ? 'var(--green-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {desc}
                  </div>
                </div>

                <ChevronRight size={16} color={isActive ? 'var(--green-primary)' : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-glass)',
          background: 'var(--bg-section)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600 }}>Language:</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => setCurrentLang(l.code)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    border: currentLang === l.code ? '1.5px solid var(--green-primary)' : '1px solid var(--border-glass)',
                    background: currentLang === l.code ? 'var(--green-primary)' : 'var(--bg-surface-glass)',
                    color: currentLang === l.code ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            KrishiVaani · AI-Powered Farming Suite for Bharat 🇮🇳
          </div>
        </div>
      </div>
    </>
  );
}
