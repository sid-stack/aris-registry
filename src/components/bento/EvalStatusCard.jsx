/**
 * EvalStatusCard — Inference Regression Status Panel.
 * Polls /api/evals/status (served from eval_results.json) and renders
 * 5 status dots with score + label for each Golden Set eval.
 */
import { useEffect, useState, useCallback } from 'react';
import { FlaskConical, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { BD } from '../../theme/bentoDarkTheme.js';

const POLL_INTERVAL_MS = 30_000;

const DOT_CONFIG = {
  pass:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  shadow: '0 0 8px rgba(34,197,94,0.3)',  Icon: CheckCircle2 },
  fail:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  shadow: '0 0 8px rgba(239,68,68,0.3)',  Icon: XCircle      },
  error:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', shadow: '0 0 8px rgba(245,158,11,0.3)', Icon: AlertCircle  },
  pending: { color: BD.textMuted, bg: BD.chipBg,               shadow: 'none',                          Icon: Clock        },
};

function StatusDot({ eval: ev, index }) {
  const status = ev?.status || 'pending';
  const cfg    = DOT_CONFIG[status] || DOT_CONFIG.pending;
  const { Icon } = cfg;
  const score  = typeof ev?.score === 'number' ? `${Math.round(ev.score * 100)}%` : '–';

  return (
    <div style={s.dotRow} title={ev?.label || `Eval ${index + 1}`}>
      <div style={{ ...s.dotWrap, background: cfg.bg }}>
        <Icon size={13} color={cfg.color} style={{ filter: status !== 'pending' ? cfg.shadow : 'none' }} />
      </div>
      <div style={s.dotMeta}>
        <span style={s.dotLabel}>{ev?.label || `Eval ${index + 1}`}</span>
        <span style={{ ...s.dotScore, color: cfg.color }}>{score}</span>
      </div>
      <div style={{ ...s.statusPip, background: cfg.color, boxShadow: cfg.shadow }} />
    </div>
  );
}

export default function EvalStatusCard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [error, setError]     = useState(null);

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setLoading(true);
    try {
      const res = await fetch('/api/evals/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      if (manual) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(() => fetchStatus(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // Build 5-slot array (always show 5 dots, pad with nulls if fewer)
  const evals   = data?.evals || [];
  const slots   = Array.from({ length: 5 }, (_, i) => evals[i] || null);
  const summary = data?.summary;
  const overall = summary?.overall || 'pending';

  const overallColor = overall === 'pass' ? '#22c55e' : overall === 'warn' ? BD.warning : overall === 'fail' ? BD.danger : BD.textMuted;
  const overallLabel = overall === 'pass' ? 'All Passing' : overall === 'warn' ? 'Warning' : overall === 'fail' ? 'Regressions Detected' : 'Not Run';

  const timeStr = lastFetch
    ? lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={s.card}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.iconWrap}>
            <FlaskConical size={14} color={BD.link} />
          </div>
          <div>
            <p style={s.title}>Eval Status</p>
            <p style={s.subtitle}>Golden Set · 5 tests</p>
          </div>
        </div>
        <button style={s.refreshBtn} onClick={() => fetchStatus(true)} title="Refresh">
          <RefreshCw size={12} color={BD.textMuted} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Overall status pill */}
      <div style={{ ...s.overallPill, borderColor: `${overallColor}33`, background: `${overallColor}0f` }}>
        <div style={{ ...s.overallDot, background: overallColor, boxShadow: `0 0 6px ${overallColor}` }} />
        <span style={{ ...s.overallLabel, color: overallColor }}>{overallLabel}</span>
        {summary && (
          <span style={s.overallCount}>
            {summary.passed}/{summary.total} passed
          </span>
        )}
      </div>

      {/* Individual eval dots */}
      <div style={s.dotList}>
        {slots.map((ev, i) => (
          <StatusDot key={ev?.id || i} eval={ev} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        {error ? (
          <span style={s.footerError}>{error}</span>
        ) : (
          <span style={s.footerMeta}>
            {timeStr ? `Updated ${timeStr}` : 'Run: python scripts/run_evals.py'}
          </span>
        )}
        <span style={s.footerHint}>Auto-refreshes every 30s</span>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
  card: {
    background: BD.bgCard,
    border: `1px solid ${BD.border}`,
    borderRadius: 8,
    padding: '20px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    height: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: BD.chipBg,
    border: `1px solid ${BD.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 15,
    fontWeight: 400,
    color: BD.textBright,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    margin: 0,
    fontSize: 12,
    color: BD.textMuted,
    marginTop: 1,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: BD.bgPanel,
    border: `1px solid ${BD.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  overallPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid transparent',
  },
  overallDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: 500,
    flex: 1,
  },
  overallCount: {
    fontSize: 12,
    color: BD.textMuted,
    fontVariantNumeric: 'tabular-nums',
  },
  dotList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  dotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 10px',
    borderRadius: 8,
    background: BD.bgPanelHi,
    border: `1px solid ${BD.border}`,
    cursor: 'default',
  },
  dotWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dotMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    overflow: 'hidden',
  },
  dotLabel: {
    fontSize: 12,
    fontWeight: 400,
    color: BD.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dotScore: {
    fontSize: 10,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  statusPip: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${BD.border}`,
    paddingTop: 10,
  },
  footerMeta: {
    fontSize: 12,
    color: BD.textMuted,
  },
  footerError: {
    fontSize: 12,
    color: BD.danger,
  },
  footerHint: {
    fontSize: 12,
    color: BD.textDim,
  },
};
