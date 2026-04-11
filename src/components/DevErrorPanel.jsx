/**
 * DevErrorPanel — floating bottom-right panel (dev-only).
 *
 * Subscribes to httpDebug.js and renders every captured HTTP error
 * in Python requests.HTTPError style. Filters: all | api | 4xx | 5xx.
 * Tree-shaken in production via IS_DEV guard.
 */

import { useState, useEffect } from 'react';
import { subscribeErrors, clearErrors } from '../utils/httpDebug';

const IS_DEV = import.meta.env.DEV;

const STATUS_COLOR = (s) => {
  if (!s) return { bg: '#1f2937', fg: '#9ca3af' };
  if (s >= 500) return { bg: '#7f1d1d', fg: '#fca5a5' };
  if (s >= 400) return { bg: '#78350f', fg: '#fde68a' };
  return { bg: '#1e3a5f', fg: '#93c5fd' };
};

export default function DevErrorPanel() {
  const [errors, setErrors] = useState([]);
  const [open, setOpen]     = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!IS_DEV) return;
    return subscribeErrors(setErrors);
  }, []);

  if (!IS_DEV) return null;

  const visible = errors.filter(e => {
    if (filter === 'api')  return !e.thirdParty;
    if (filter === '4xx')  return e.status >= 400 && e.status < 500;
    if (filter === '5xx')  return e.status >= 500;
    return true;
  });

  if (errors.length === 0) return null;

  const ownCount = errors.filter(e => !e.thirdParty).length;

  return (
    <div style={{
      position:   'fixed',
      bottom:     16,
      right:      16,
      zIndex:     999999,
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize:   11,
      userSelect: 'none',
    }}>

      {/* ── Toggle badge ───────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           6,
          background:    ownCount > 0 ? '#991b1b' : '#374151',
          color:         ownCount > 0 ? '#fecaca' : '#d1d5db',
          border:        `1px solid ${ownCount > 0 ? '#7f1d1d' : '#4b5563'}`,
          borderRadius:  6,
          padding:       '5px 11px',
          cursor:        'pointer',
          fontWeight:    700,
          letterSpacing: '0.04em',
          boxShadow:     ownCount > 0
            ? '0 4px 14px rgba(153,27,27,0.55)'
            : '0 2px 8px rgba(0,0,0,0.4)',
          fontFamily:    'inherit',
        }}
      >
        <span>⚠</span>
        <span>
          {ownCount > 0
            ? `${ownCount} API error${ownCount !== 1 ? 's' : ''}`
            : `${errors.length} error${errors.length !== 1 ? 's' : ''} (3rd-party)`
          }
        </span>
        <span style={{ opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position:     'absolute',
          bottom:       '110%',
          right:        0,
          marginBottom: 8,
          width:        560,
          maxHeight:    460,
          overflowY:    'auto',
          background:   '#080b10',
          border:       '1px solid #1f2937',
          borderRadius: 8,
          boxShadow:    '0 24px 64px rgba(0,0,0,0.9)',
        }}>

          {/* Header */}
          <div style={{
            position:     'sticky',
            top:          0,
            padding:      '8px 12px',
            background:   '#0d1117',
            borderBottom: '1px solid #1f2937',
            display:      'flex',
            justifyContent: 'space-between',
            alignItems:   'center',
            gap:          8,
            zIndex:       1,
          }}>
            <span style={{ color: '#f87171', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>
              ▸ BidSmith Dev · HTTP Error Log
            </span>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {/* Filter tabs */}
              {['all', 'api', '4xx', '5xx'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background:    filter === f ? '#374151' : 'transparent',
                    color:         filter === f ? '#f9fafb' : '#6b7280',
                    border:        `1px solid ${filter === f ? '#4b5563' : '#1f2937'}`,
                    borderRadius:  4,
                    padding:       '2px 7px',
                    cursor:        'pointer',
                    fontSize:      10,
                    fontWeight:    700,
                    fontFamily:    'inherit',
                    letterSpacing: '0.04em',
                  }}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={() => { clearErrors(); setOpen(false); }}
                title="Clear all"
                style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Empty state */}
          {visible.length === 0 && (
            <div style={{ padding: 20, color: '#374151', textAlign: 'center' }}>
              No errors match this filter.
            </div>
          )}

          {/* Error rows */}
          {visible.map(err => {
            const col = STATUS_COLOR(err.status);
            return (
              <div
                key={err.id}
                style={{
                  padding:      '10px 12px',
                  borderBottom: '1px solid #0d1117',
                  background:   err.thirdParty ? 'rgba(31,41,55,0.25)' : 'transparent',
                }}
              >
                {/* Row meta */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    background:    col.bg,
                    color:         col.fg,
                    padding:       '1px 6px',
                    borderRadius:  3,
                    fontWeight:    700,
                    fontSize:      10,
                    letterSpacing: '0.04em',
                  }}>
                    {err.status || '---'} {err.method}
                  </span>
                  {err.thirdParty && (
                    <span style={{
                      color:         '#4b5563',
                      fontSize:      10,
                      fontStyle:     'italic',
                      border:        '1px solid #1f2937',
                      borderRadius:  3,
                      padding:       '1px 5px',
                    }}>
                      3rd-party
                    </span>
                  )}
                  <span style={{ color: '#374151', fontSize: 10, marginLeft: 'auto' }}>
                    {new Date(err.ts).toLocaleTimeString()}
                  </span>
                </div>

                {/* Python-style error block */}
                <pre style={{
                  color:       err.thirdParty ? '#374151' : '#f87171',
                  whiteSpace:  'pre-wrap',
                  wordBreak:   'break-all',
                  margin:      0,
                  fontSize:    11,
                  lineHeight:  1.55,
                  fontFamily:  'inherit',
                }}>
                  {err.message}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
