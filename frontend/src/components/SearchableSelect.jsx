import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Plus, MapPin, Loader2, Globe } from 'lucide-react';

/**
 * SearchableSelect
 * Props:
 *  - options: Array of strings or objects { id/value, name/label, category/state/tag, icon, subtitle, lat, lon }
 *  - value: Current selected value (string or id)
 *  - onChange: (selectedValue, selectedObject) => void
 *  - placeholder: Placeholder text for search / trigger
 *  - label: Optional label text above the input
 *  - icon: Optional Lucide Icon component
 *  - allowCustom: Boolean - if true, allows typing and picking a custom value not in list
 *  - customActionLabel: Optional label for custom input (e.g. "Use custom location")
 *  - isLocationSearch: Boolean - if true, fetches dynamic live geocoding for ANY Indian city/district/town
 *  - groupBy: Optional key string to group items (e.g. 'state', 'category')
 *  - maxWidth: Optional max-width string
 *  - compact: Boolean - for smaller height/padding
 *  - disabled: Boolean
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  label,
  icon: Icon,
  allowCustom = false,
  customActionLabel = 'Use custom value',
  isLocationSearch = false,
  groupBy,
  maxWidth,
  compact = false,
  disabled = false,
  className = '',
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [liveGeoOptions, setLiveGeoOptions] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize static options into standard format: { value, label, subtext, tag, icon, group, original }
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt, subtext: null, tag: null, icon: null, group: null, original: opt };
      }
      return {
        value: opt.id ?? opt.value ?? opt.name ?? opt.district ?? '',
        label: opt.name ?? opt.label ?? opt.district ?? opt.id ?? '',
        subtext: opt.state ? (opt.district && opt.district !== opt.name ? `${opt.district}, ${opt.state}` : opt.state) : (opt.description || opt.yield_range || null),
        tag: opt.tag || opt.category || (opt.season ? `${opt.season}` : null),
        icon: opt.icon || null,
        group: groupBy ? opt[groupBy] : null,
        lat: opt.lat,
        lon: opt.lon,
        original: opt,
      };
    });
  }, [options, groupBy]);

  // Current selected item display label
  const selectedItem = normalizedOptions.find(o => String(o.value).toLowerCase() === String(value).toLowerCase());
  const displayLabel = selectedItem ? selectedItem.label : (value || placeholder);
  const displaySubtext = selectedItem?.subtext;

  // Filtered static options based on search query
  const filteredStatic = React.useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase().trim();
    return normalizedOptions.filter(opt => {
      return (
        opt.label.toLowerCase().includes(q) ||
        (opt.subtext && opt.subtext.toLowerCase().includes(q)) ||
        (opt.tag && opt.tag.toLowerCase().includes(q)) ||
        (opt.value && String(opt.value).toLowerCase().includes(q))
      );
    });
  }, [normalizedOptions, search]);

  // Live dynamic geocoding for any village/town/district across India & worldwide
  useEffect(() => {
    if (!isLocationSearch || !isOpen) {
      setLiveGeoOptions([]);
      return;
    }

    const query = search.trim();
    if (query.length < 2) {
      setLiveGeoOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Geocoding network error');
        const data = await res.json();
        
        if (data && data.results && data.results.length > 0) {
          // Sort India locations first
          const sorted = [...data.results].sort((a, b) => {
            if (a.country_code === 'IN' && b.country_code !== 'IN') return -1;
            if (a.country_code !== 'IN' && b.country_code === 'IN') return 1;
            return (b.population || 0) - (a.population || 0);
          });

          const formatted = sorted.map(r => {
            const state = r.admin1 || '';
            const district = r.admin2 || r.name;
            const country = r.country || 'India';
            const locationName = r.name;
            
            let sub = state ? `${state}, ${country}` : country;
            if (district && district !== locationName) {
              sub = `${district}, ${state ? state + ', ' : ''}${country}`;
            }

            return {
              value: locationName,
              label: locationName,
              subtext: `${sub} (GPS: ${r.latitude.toFixed(2)}°N, ${r.longitude.toFixed(2)}°E)`,
              tag: country === 'India' ? (state || 'India') : country,
              icon: '📍',
              isLive: true,
              original: {
                name: locationName,
                district: district,
                state: state,
                country: country,
                lat: +r.latitude.toFixed(4),
                lon: +r.longitude.toFixed(4),
                tag: state ? `${state} District` : country,
              }
            };
          });

          setLiveGeoOptions(formatted);
        } else {
          setLiveGeoOptions([]);
        }
      } catch (err) {
        setLiveGeoOptions([]);
      } finally {
        setIsGeocoding(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [search, isLocationSearch, isOpen]);

  // Combine live dynamic options with filtered static options
  const finalOptions = React.useMemo(() => {
    if (!isLocationSearch || liveGeoOptions.length === 0) {
      return filteredStatic;
    }

    // Merge live results, avoiding duplicates with static list
    const liveNames = new Set(liveGeoOptions.map(l => l.label.toLowerCase()));
    const remainingStatic = filteredStatic.filter(s => !liveNames.has(s.label.toLowerCase()));

    return [...liveGeoOptions, ...remainingStatic];
  }, [isLocationSearch, liveGeoOptions, filteredStatic]);

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto-focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
      setLiveGeoOptions([]);
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (onChange) {
      onChange(opt.value, opt.original);
    }
    setIsOpen(false);
    setSearch('');
    setLiveGeoOptions([]);
  };

  const handleCustomSelect = () => {
    if (!search.trim()) return;
    const customObj = { name: search.trim(), district: search.trim(), value: search.trim(), custom: true };
    if (onChange) {
      onChange(search.trim(), customObj);
    }
    setIsOpen(false);
    setSearch('');
    setLiveGeoOptions([]);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('', null);
    setSearch('');
    setLiveGeoOptions([]);
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${className}`}
      style={{
        position: 'relative',
        zIndex: isOpen ? 9999 : 'auto',
        width: maxWidth ? '100%' : 'auto',
        maxWidth: maxWidth || '100%',
        ...style
      }}
    >
      {label && (
        <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className="searchable-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: compact ? '0.45rem 0.75rem' : '0.65rem 0.9rem',
          background: '#ffffff',
          border: isOpen ? '1.5px solid var(--green-primary)' : '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontSize: compact ? '0.85rem' : '0.92rem',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(61, 122, 61, 0.18)' : 'var(--shadow-sm)',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
          {Icon && <Icon size={compact ? 15 : 17} color="var(--green-primary)" style={{ flexShrink: 0 }} />}
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: value ? 700 : 400, color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {displayLabel}
            </span>
            {displaySubtext && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 400 }}>
                ({displaySubtext})
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
          {value && !disabled && (
            <span
              onClick={handleClear}
              title="Clear selection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '50%',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#e04040'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu Popup with Isolated High Z-Index & Solid Background */}
      {isOpen && (
        <div
          className="searchable-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: '#ffffff',
            border: '1.5px solid var(--green-pale)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
            overflow: 'hidden',
            minWidth: '280px',
          }}
        >
          {/* Search Input Bar */}
          <div style={{ padding: '0.6rem', borderBottom: '1px solid var(--border-color)', background: '#faf9f5' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {isGeocoding ? (
                <Loader2 size={15} className="animate-spin" color="var(--green-primary)" style={{ position: 'absolute', left: '0.6rem' }} />
              ) : (
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.6rem' }} />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (finalOptions.length > 0) {
                      handleSelect(finalOptions[0]);
                    } else if (allowCustom && search.trim()) {
                      handleCustomSelect();
                    }
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                placeholder={isLocationSearch ? "Type any Indian city, town, or district..." : searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.6rem 0.5rem 2.1rem',
                  fontSize: '0.88rem',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: '#ffffff',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', padding: '0 0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {isGeocoding ? (
                  <span style={{ color: 'var(--green-primary)', fontWeight: 600 }}>Searching live locations...</span>
                ) : (
                  `${finalOptions.length} ${finalOptions.length === 1 ? 'location' : 'locations'} found`
                )}
              </span>
              {search && <span style={{ color: 'var(--green-primary)', fontWeight: 600 }}>Press Enter to pick top match</span>}
            </div>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '0.35rem 0',
              background: '#ffffff',
            }}
          >
            {/* Live Search Custom Option */}
            {allowCustom && search.trim() && !finalOptions.some(f => f.label.toLowerCase() === search.toLowerCase().trim()) && (
              <div
                onClick={handleCustomSelect}
                style={{
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--green-primary)',
                  background: 'var(--green-bg)',
                  borderBottom: '1px dashed var(--green-pale)',
                  fontWeight: 600,
                }}
              >
                <Plus size={15} />
                <span>{customActionLabel}: <strong>"{search.trim()}"</strong></span>
              </div>
            )}

            {finalOptions.length === 0 && !allowCustom ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No locations found for "{search}". Type any Indian town or city name.
              </div>
            ) : (
              finalOptions.map((opt, idx) => {
                const isSelected = String(opt.value).toLowerCase() === String(value).toLowerCase();
                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--green-bg)' : 'transparent',
                      color: isSelected ? 'var(--green-primary)' : 'var(--text-primary)',
                      fontSize: '0.88rem',
                      borderBottom: '1px solid #f2f0eb',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#f4f6f1';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                        {opt.isLive ? '📍' : (opt.icon || '🌾')}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: isSelected ? 700 : 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{opt.label}</span>
                          {opt.isLive && (
                            <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                              Live GPS
                            </span>
                          )}
                        </div>
                        {opt.subtext && (
                          <div style={{ fontSize: '0.74rem', color: isSelected ? 'var(--green-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                            {opt.subtext}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      {opt.tag && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: isSelected ? 'var(--green-pale)' : '#ebeee8',
                            color: isSelected ? 'var(--green-primary)' : 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          {opt.tag}
                        </span>
                      )}
                      {isSelected && <Check size={15} color="var(--green-primary)" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
