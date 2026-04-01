import React, { useState } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock,
  Users, DollarSign, Target, Shield, Eye, ChevronDown, ChevronUp, Zap
} from 'lucide-react';

// ── Colour helpers ────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  BID:         { color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: '#16a34a', icon: <CheckCircle size={22} />, label: 'BID'      },
  'NO-BID':    { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: '#dc2626', icon: <XCircle    size={22} />, label: 'NO-BID'   },
  CONDITIONAL: { color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: '#d97706', icon: <AlertTriangle size={22} />, label: 'CONDITIONAL' },
};

const INCUMBENT_COLOR = { LOW: '#16a34a', MODERATE: '#d97706', HIGH: '#dc2626', CRITICAL: '#7c2d12' };

function WinGauge({ probability, confidence }) {
  const pct = Math.min(100, Math.max(0, probability));
  const color = pct >= 65 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  // SVG arc gauge
  const r = 42, cx = 54, cy = 54;
  const circ = Math.PI * r; // half-circle
  const arc  = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={108} height={62} viewBox="0 0 108 62">
        {/* track */}
        <path d={`M 12 54 A ${r} ${r} 0 0 1 96 54`} fill="none" stroke="#e2e8f0" strokeWidth={10} strokeLinecap="round" />
        {/* fill */}
        <path d={`M 12 54 A ${r} ${r} 0 0 1 96 54`} fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round" strokeDasharray={`${arc} ${circ}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x={cx} y={50} textAnchor="middle" fontSize={18} fontWeight={800} fill={color}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em' }}>
        WIN PROBABILITY · {confidence} CONFIDENCE
      </div>
    </div>
  );
}

function SignalCard({ icon, title, label, labelColor, body, expandable, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#475569' }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label && (
            <span style={{ fontSize: 10, fontWeight: 700, color: labelColor || '#475569', background: `${labelColor}18` || '#f1f5f9', border: `1px solid ${labelColor || '#e2e8f0'}`, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em' }}>
              {label}
            </span>
          )}
          {expandable && (
            <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8' }}>
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{body}</div>
      {expandable && open && <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 4 }}>{children}</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function IntelligenceBrief({ auditData }) {
  if (!auditData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', flexDirection: 'column', gap: 12 }}>
        <Target size={40} strokeWidth={1.5} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Run an audit to see intelligence signals</div>
        <div style={{ fontSize: 12 }}>Paste a SAM.gov URL above or upload a PDF</div>
      </div>
    );
  }

  const { verdict = {}, intelligence = {}, agency, value, naics_code, set_aside_type, due_date, response_window_days } = auditData;
  const vc = VERDICT_CONFIG[verdict.recommendation] || VERDICT_CONFIG.CONDITIONAL;
  const inc = intelligence.incumbent_signal || {};
  const incColor = INCUMBENT_COLOR[inc.label] || '#94a3b8';
  const ptw = intelligence.price_to_win || {};
  const fmt = (n) => n ? `$${(n / 1_000_000).toFixed(1)}M` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PANEL 1: Solicitation header ──────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Left: meta */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>SOLICITATION</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: 10 }}>{auditData.title || agency}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {agency && <Chip label={agency} />}
              {naics_code && <Chip label={`NAICS ${naics_code}`} />}
              {set_aside_type && set_aside_type !== 'Not stated' && <Chip label={set_aside_type} color="#2563eb" />}
              {value && value !== '0' && <Chip label={value} color="#16a34a" />}
              {due_date && due_date !== 'Not stated' && <Chip label={`Due ${due_date}`} color={response_window_days && response_window_days < 10 ? '#dc2626' : '#475569'} />}
              {response_window_days && <Chip label={`${response_window_days}d response window`} color={response_window_days < 10 ? '#dc2626' : '#475569'} />}
            </div>
          </div>

          {/* Centre: win gauge */}
          <WinGauge probability={verdict.win_probability || 50} confidence={verdict.confidence || 'MEDIUM'} />

          {/* Right: verdict pill */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              background: vc.bg, border: `2px solid ${vc.border}`, borderRadius: 10,
              color: vc.color, fontWeight: 800, fontSize: 15, letterSpacing: '0.06em'
            }}>
              {vc.icon}{vc.label}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.06em' }}>RECOMMENDATION</div>
          </div>
        </div>

        {/* Rationale */}
        {verdict.summary && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, borderLeft: `3px solid ${vc.border}` }}>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{verdict.summary}</div>
          </div>
        )}
      </div>

      {/* ── PANEL 2: Intelligence signals grid ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>

        {/* Incumbent Signal */}
        <SignalCard
          icon={<Eye size={16} />}
          title="Incumbent Signal"
          label={`${inc.score ?? 0}/10 — ${inc.label || 'LOW'}`}
          labelColor={incColor}
          body={inc.explanation || 'No strong incumbent language detected.'}
          expandable={inc.signals_detected?.length > 0}
        >
          {inc.signals_detected?.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ color: s.found ? '#dc2626' : '#16a34a', flexShrink: 0, marginTop: 1 }}>{s.found ? '●' : '○'}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{s.signal}</div>
                {s.evidence && <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>"{s.evidence}"</div>}
              </div>
            </div>
          ))}
        </SignalCard>

        {/* Evaluation Reality */}
        <SignalCard
          icon={<TrendingUp size={16} />}
          title="Evaluation Reality"
          label={intelligence.evaluation_type || 'Unknown'}
          labelColor="#2563eb"
          body={intelligence.evaluation_reality || 'Evaluation type not determined from solicitation text.'}
        />

        {/* Price-to-Win */}
        <SignalCard
          icon={<DollarSign size={16} />}
          title="Price-to-Win Range"
          label={ptw.low && ptw.high ? `${fmt(ptw.low)} – ${fmt(ptw.high)}` : 'Not estimated'}
          labelColor="#16a34a"
          body={ptw.rationale || 'Insufficient pricing data to estimate competitive range.'}
        />

        {/* Team Signal */}
        <SignalCard
          icon={<Users size={16} />}
          title="Team Signal"
          label={intelligence.team_signal || 'SELF-PERFORM'}
          labelColor={intelligence.team_signal === 'TEAMING REQUIRED' ? '#dc2626' : intelligence.team_signal === 'TEAMING RECOMMENDED' ? '#d97706' : '#16a34a'}
          body={intelligence.team_signal_explanation || 'No teaming indicators detected.'}
        />

        {/* Timeline Pressure */}
        <SignalCard
          icon={<Clock size={16} />}
          title="Timeline Pressure"
          label={intelligence.timeline_pressure?.detected ? 'FLAGGED' : 'NORMAL'}
          labelColor={intelligence.timeline_pressure?.detected ? '#dc2626' : '#16a34a'}
          body={intelligence.timeline_pressure?.explanation || 'Response window appears standard.'}
        />

        {/* Key Discriminators */}
        <SignalCard
          icon={<Zap size={16} />}
          title="Lead With These"
          body={
            intelligence.key_discriminators?.length > 0
              ? intelligence.key_discriminators.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                    <span style={{ color: '#2563eb', fontWeight: 800, flexShrink: 0 }}>✦</span>
                    <span style={{ fontSize: 12, color: '#334155' }}>{d}</span>
                  </div>
                ))
              : 'No specific discriminators identified.'
          }
        />
      </div>

      {/* ── Top risks ───────────────────────────────────────────────────────── */}
      {intelligence.top_risks?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', marginBottom: 12 }}>TOP RISKS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {intelligence.top_risks.slice(0, 4).map((r, i) => {
              const rColor = r.severity === 'HIGH' ? '#dc2626' : r.severity === 'MED' ? '#d97706' : '#16a34a';
              return (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, borderLeft: `3px solid ${rColor}` }}>
                  <AlertTriangle size={14} color={rColor} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.risk}</div>
                    {r.action && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>→ {r.action}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: rColor, border: `1px solid ${rColor}`, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{r.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hidden requirements ──────────────────────────────────────────── */}
      {intelligence.hidden_requirements?.length > 0 && (
        <div style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={14} color="#dc2626" />
            <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', letterSpacing: '0.1em' }}>
              HIDDEN REQUIREMENTS — Found outside Section L
            </div>
          </div>
          {intelligence.hidden_requirements.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '8px 10px', background: '#fff', borderRadius: 6, border: '1px solid #fecaca' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: 'rgba(220,38,38,0.1)', padding: '2px 6px', borderRadius: 4, height: 'fit-content', flexShrink: 0 }}>{h.found_in}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{h.text}</div>
                {h.implication && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{h.implication}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ label, color = '#475569' }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}12`, border: `1px solid ${color}30`, padding: '3px 8px', borderRadius: 5 }}>
      {label}
    </span>
  );
}
