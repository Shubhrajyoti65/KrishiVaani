import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Plus, Loader2, MapPin, Globe } from 'lucide-react';

/**
 * SearchableSelect
 * Props:
 *  - options: Array of strings or objects { id/value, name/label, category/state/tag, icon, subtitle }
 *  - value: Current selected value (string or id)
 *  - onChange: (selectedValue, selectedObject) => void
 *  - placeholder: Placeholder text for search / trigger
 *  - label: Optional label text above the input
 *  - icon: Optional Lucide Icon component
 *  - allowCustom: If true, allows typing any custom value and submitting
 *  - customActionLabel: Text for the custom add button
 *  - onSearchAsync: Optional async function `async (query) => Array<Item>` for live geocoding/API search
 *  - groupBy: Optional field to group options by
 *  - maxWidth: Container max width
 *  - compact: If true, renders smaller padding
 *  - disabled: Disable select
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
  onSearchAsync = null,
  groupBy,
  maxWidth,
  compact = false,
  disabled = false,
  className = '',
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [asyncResults, setAsyncResults] = useState([]);
  const [isSearchingAsync, setIsSearchingAsync] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize static options into standard format: { value, label, subtext, tag, icon, group }
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

  // Live async search (e.g. for geocoding real cities/districts across India)
  useEffect(() => {
    if (!onSearchAsync || !search.trim() || search.trim().length < 2) {
      setAsyncResults([]);
      setIsSearchingAsync(false);
      return;
    }

    let active = true;
    setIsSearchingAsync(true);

    const timer = setTimeout(async () => {
      try {
        const rawResults = await onSearchAsync(search.trim());
        if (active) {
          const formatted = (rawResults || []).map(r => {
            if (typeof r === 'string') {
              return { value: r, label: r, subtext: null, tag: 'Live Match', isLive: true, original: r };
            }
            return {
              value: r.id ?? r.value ?? r.name ?? r.district ?? '',
              label: r.name ?? r.label ?? r.district ?? '',
              subtext: r.subtext || (r.state ? `${r.state}, ${r.country || 'India'}` : (r.country || '')),
              tag: r.tag || (r.state ? `${r.state}` : 'Live Location'),
              icon: r.icon || null,
              isLive: true,
              original: r,
            };
          });
          setAsyncResults(formatted);
          setIsSearchingAsync(false);
        }
      } catch (err) {
        if (active) {
          setAsyncResults([]);
          setIsSearchingAsync(false);
        }
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, onSearchAsync]);

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
      setAsyncResults([]);
      setIsSearchingAsync(false);
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (onChange) {
      onChange(opt.value, opt.original);
    }
    setIsOpen(false);
    setSearch('');
    setAsyncResults([]);
  };

  const handleCustomSelect = () => {
    if (!search.trim()) return;
    if (onChange) {
      onChange(search.trim(), { name: search.trim(), value: search.trim(), district: search.trim(), custom: true });
    }
    setIsOpen(false);
    setSearch('');
    setAsyncResults([]);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('', null);
    setSearch('');
  };

  const hasAsync = Boolean(onSearchAsync);
  const totalOptionsCount = asyncResults.length > 0 ? (asyncResults.length + filteredStatic.length) : filteredStatic.length;

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${className}`}
      style={{
        position: 'relative',
        zIndex: isOpen ? 1000 : 1,
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
          background: 'var(--bg-card)',
          border: isOpen ? '1.5px solid var(--green-primary)' : '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontSize: compact ? '0.85rem' : '0.92rem',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(61, 122, 61, 0.18)' : 'none',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
          {Icon && <Icon size={compact ? 15 : 17} color="var(--green-primary)" style={{ flexShrink: 0 }} />}
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: value ? 600 : 400, color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {displayLabel}
            </span>
            {displaySubtext && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
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

      {/* Dropdown Menu Popup with Highest Z-Index to Prevent Overlap */}
      {isOpen && (
        <div
          className="searchable-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 40px rgba(28, 43, 26, 0.22), 0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease',
            minWidth: '280px',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '0.6rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-section)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (asyncResults.length > 0) {
                      handleSelect(asyncResults[0]);
                    } else if (filteredStatic.length > 0) {
                      handleSelect(filteredStatic[0]);
                    } else if (allowCustom && search.trim()) {
                      handleCustomSelect();
                    }
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                placeholder={searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.5rem 2rem 0.5rem 2.1rem',
                  fontSize: '0.88rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
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
                    right: '0.6rem',
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
                {isSearchingAsync ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--green-primary)' }}>
                    <Loader2 size={12} className="animate-spin" /> Searching locations across India & globe...
                  </span>
                ) : (
                  `${totalOptionsCount} ${totalOptionsCount === 1 ? 'option' : 'options'} available`
                )}
              </span>
              {search && <span style={{ color: 'var(--green-primary)' }}>Press Enter to pick top match</span>}
            </div>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '0.35rem 0',
            }}
          >
            {/* Custom input button if allowCustom & search query typed */}
            {allowCustom && search.trim() && (
              <div
                onClick={handleCustomSelect}
                style={{
                  padding: '0.55rem 0.85rem',
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

            {/* Live Geocoded Results Section */}
            {asyncResults.length > 0 && (
              <div>
                <div style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(61, 122, 61, 0.08)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Globe size={12} /> Live Geocoded Matches ({asyncResults.length})
                </div>
                {asyncResults.map((opt, idx) => {
                  const isSelected = String(opt.value).toLowerCase() === String(value).toLowerCase();
                  return (
                    <div
                      key={`async-${opt.value}-${idx}`}
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
                        borderLeft: '3px solid var(--green-primary)',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--bg-section)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                        <MapPin size={16} color="var(--green-primary)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {opt.label}
                          </div>
                          {opt.subtext && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {opt.subtext}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'var(--green-pale)',
                            color: 'var(--green-primary)',
                            fontWeight: 700,
                          }}
                        >
                          {opt.tag || 'Live GPS'}
                        </span>
                        {isSelected && <Check size={15} color="var(--green-primary)" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Static Options Section */}
            {asyncResults.length > 0 && filteredStatic.length > 0 && (
              <div style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--bg-section)', marginTop: '0.25rem' }}>
                Pre-loaded Agricultural Districts
              </div>
            )}

            {filteredStatic.length === 0 && asyncResults.length === 0 && !allowCustom ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {isSearchingAsync ? 'Searching across India...' : `No matches found for "${search}"`}
              </div>
            ) : (
              filteredStatic.map((opt, idx) => {
                const isSelected = String(opt.value).toLowerCase() === String(value).toLowerCase();
                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '0.5rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--green-bg)' : 'transparent',
                      color: isSelected ? 'var(--green-primary)' : 'var(--text-primary)',
                      fontSize: '0.88rem',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-section)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      {opt.icon && <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{opt.icon}</span>}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: isSelected ? 700 : 500 }}>
                          {opt.label}
                        </div>
                        {opt.subtext && (
                          <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--green-primary)' : 'var(--text-muted)' }}>
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
                            background: isSelected ? 'var(--green-pale)' : 'var(--bg-section)',
                            color: isSelected ? 'var(--green-primary)' : 'var(--text-muted)',
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
