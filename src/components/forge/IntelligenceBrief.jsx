/**
 * IntelligenceBrief.jsx — BidSmith v2
 *
 * Consumes auditPipeline.js output directly.
 * Surfaces: verdict, win probability, incumbent signal, evaluation intel,
 * price-to-win, hidden requirements, top risks, key discriminators.
 *
 * This is the "read between the lines" layer — the moat.
 */

import { useState } from 'react';
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Eye, Target, DollarSign, Clock, ChevronDown, ChevronUp,
  Zap, AlertOctagon, Search, Users
} from 'lucide-react';

// ─── Verdict Config ────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  BID: {
    label: 'BID',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.25)',
    icon: CheckCircle,
    tagline: 'Pursue this opportunity',
  },
  'NO-BID': {
    label: 'NO-BID',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.25)',
    icon: XCircle,
    tagline: 'Do not pursue',
  },
  CONDITIONAL: {
    label: 'CONDITIONAL',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
    icon: AlertTriangle,
    tagline: 'Proceed with caution',
  },
};

const INCUMBENT_COLOR = {
  LOW: '#16a34a',
  MODERATE: '#d97706',
  HIGH: '#dc2626',
  CRITICAL: '#7c3aed',
};

const RISK_COLOR = {
  HIGH: '#dc2626',
  MED: '#d97706',
  LOW: '#16a34a',
};

// ─── Solicitation Header ───────────────────────────────────────────────────────

function SolicitationHeader({ auditData, isDemo }) {
  const title = auditData?.title || 'Federal Solicitation';
  const agency = auditData?.agency || 'Federal Agency';
  const naics = auditData?.naics || '—';
  const value = auditData?.value;
  const dueDate = auditData?.due_date;
  const solNum = auditData?.solicitation_number || '—';
  const daysLeft = dueDate ? Math.ceil((new Date(dueDate) - new Date()) / 86400000) : null;

  const formatValue = (v) => {
    if (!v) return '—';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  };

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: '12px', padding: '18px 22px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '4px', background: 'linear-gradient(180deg, #0B3D91 0%, #002244 100%)'
      }} />

      {isDemo && (
        <span style={{
          position: 'absolute', top: '12px', right: '12px',
          fontSize: '10px', fontWeight: 800, color: '#7c3aed',
          background: '#f3e8ff', border: '1px solid #e9d5ff',
          padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.08em'
        }}>
          DEMO DATA
        </span>
      )}

      <div style={{ paddingLeft: '12px' }}>
        <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
          SOLICITATION
        </p>
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.3, paddingRight: isDemo ? '80px' : '0' }}>
          {agency} — {title}
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{solNum}</span>
          {naics !== '—' && (
            <span style={{ fontSize: '12px', color: '#475569' }}>NAICS <strong>{naics}</strong></span>
          )}
          {value && (
            <span style={{ fontSize: '12px', color: '#475569' }}><strong>{formatValue(value)}</strong> ceiling</span>
          )}
          {dueDate && (
            <span style={{
              fontSize: '12px', fontWeight: 700,
              color: daysLeft !== null && daysLeft < 7 ? '#dc2626' : daysLeft !== null && daysLeft < 14 ? '#d97706' : '#475569'
            }}>
              Due: {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {daysLeft !== null && daysLeft > 0 && (
                <span style={{ fontWeight: 500 }}> · {daysLeft}d remaining</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Win Probability Gauge ─────────────────────────────────────────────────────

function WinGauge({ probability }) {
  const clamp = Math.max(0, Math.min(100, probability || 0));
  const color = clamp >= 65 ? '#16a34a' : clamp >= 40 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (clamp / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="65" cy="65" r="52" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text
          x="65" y="65"
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '65px 65px', fill: color, fontSize: '26px', fontWeight: 800, fontFamily: 'Inter, sans-serif' }}
        >
          {clamp}%
        </text>
        <text
          x="65" y="83"
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '65px 65px', fill: '#94a3b8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
        >
          WIN PROB
        </text>
      </svg>
    </div>
  );
}

// ─── Incumbent Signal Meter ────────────────────────────────────────────────────

function IncumbentMeter({ signal }) {
  const [expanded, setExpanded] = useState(false);
  const score = signal?.score ?? 0;
  const label = signal?.label || 'LOW';
  const color = INCUMBENT_COLOR[label] || '#16a34a';
  const detected = (signal?.signals_detected || []).filter(s => s.found);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Eye size={16} color={color} />
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Incumbent Signal
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
          color, background: `${color}15`, border: `1px solid ${color}30`,
          padding: '3px 10px', borderRadius: '20px'
        }}>
          {label} RISK
        </span>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>0 — Not wired</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color }}>{score}<span style={{ fontSize: '12px', color: '#94a3b8' }}>/10</span></span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>10 — Wired</span>
        </div>
        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${score * 10}%`,
            background: color, borderRadius: '4px',
            transition: 'width 1s ease'
          }} />
        </div>
      </div>

      {/* Explanation */}
      {signal?.explanation && (
        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 12px 0' }}>
          {signal.explanation}
        </p>
      )}

      {/* Detected signals */}
      {detected.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', fontWeight: 600, padding: 0, marginBottom: expanded ? '12px' : 0 }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {detected.length} signal{detected.length !== 1 ? 's' : ''} detected
          </button>

          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detected.map((s, i) => (
                <div key={i} style={{
                  background: '#fef9f0', border: '1px solid #fde68a',
                  borderRadius: '8px', padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
                    {s.signal}
                  </div>
                  <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>
                    {s.evidence}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Evaluation Intel Card ─────────────────────────────────────────────────────

function EvaluationCard({ intelligence }) {
  const evalType = intelligence?.evaluation_type || 'Unknown';
  const evalReality = intelligence?.evaluation_reality || '';
  const ptw = intelligence?.price_to_win;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <TrendingUp size={16} color="#2563eb" />
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Evaluation Intelligence
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '12px', fontWeight: 700, padding: '5px 12px',
          background: '#eff6ff', color: '#1d4ed8',
          border: '1px solid #bfdbfe', borderRadius: '6px'
        }}>
          {evalType}
        </span>
        {intelligence?.team_signal && (
          <span style={{
            fontSize: '12px', fontWeight: 700, padding: '5px 12px',
            background: '#f0fdf4', color: '#15803d',
            border: '1px solid #bbf7d0', borderRadius: '6px',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Users size={12} /> {intelligence.team_signal.replace(/-/g, ' ')}
          </span>
        )}
      </div>

      {evalReality && (
        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 14px 0' }}>
          {evalReality}
        </p>
      )}

      {ptw && (ptw.low > 0 || ptw.high > 0) && (
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '8px', padding: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <DollarSign size={13} color="#475569" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Price-to-Win Estimate
            </span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            ${(ptw.low / 1_000_000).toFixed(1)}M – ${(ptw.high / 1_000_000).toFixed(1)}M
          </div>
          {ptw.rationale && (
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              {ptw.rationale}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hidden Requirements ───────────────────────────────────────────────────────

function HiddenRequirements({ hidden }) {
  if (!hidden || hidden.length === 0) return null;

  return (
    <div style={{
      background: '#fff', border: '1px solid #fca5a5',
      borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Search size={16} color="#dc2626" />
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Hidden Requirements
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
          background: '#fee2e2', color: '#dc2626',
          padding: '3px 10px', borderRadius: '20px'
        }}>
          Not in Section L
        </span>
      </div>

      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.5 }}>
        These requirements were found outside Section L — in the PWS, attachments, or CLINs. Miss them and you'll fail evaluation.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {hidden.map((req, i) => (
          <div key={i} style={{
            background: '#fff5f5', border: '1px solid #fca5a5',
            borderRadius: '8px', padding: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                background: '#fee2e2', color: '#dc2626',
                padding: '2px 8px', borderRadius: '4px'
              }}>
                Found in: {req.found_in}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: RISK_COLOR[req.risk] || RISK_COLOR.MED,
                background: `${RISK_COLOR[req.risk]}15`,
                padding: '2px 8px', borderRadius: '4px'
              }}>
                {req.risk} RISK
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px 0', lineHeight: 1.5 }}>
              {req.text}
            </p>
            {req.implication && (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>
                → {req.implication}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Risks & Discriminators ────────────────────────────────────────────────

function RisksAndDiscriminators({ risks, discriminators }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Risks */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '12px', padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <AlertOctagon size={16} color="#dc2626" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Top Risks
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(risks || []).slice(0, 4).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '3px 6px',
                borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                color: RISK_COLOR[r.severity] || RISK_COLOR.MED,
                background: `${RISK_COLOR[r.severity] || RISK_COLOR.MED}15`
              }}>
                {r.severity}
              </span>
              <div>
                <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 3px 0', lineHeight: 1.4, fontWeight: 600 }}>
                  {r.risk}
                </p>
                {r.action && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    → {r.action}
                  </p>
                )}
              </div>
            </div>
          ))}
          {(!risks || risks.length === 0) && (
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No high-priority risks flagged.</p>
          )}
        </div>
      </div>

      {/* Discriminators */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '12px', padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Target size={16} color="#2563eb" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Lead With These
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(discriminators || []).slice(0, 5).map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, color: '#2563eb',
                flexShrink: 0, marginTop: '1px'
              }}>
                {i + 1}.
              </span>
              <p style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                {d}
              </p>
            </div>
          ))}
          {(!discriminators || discriminators.length === 0) && (
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Run an audit to surface discriminators.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Proposal Roadmap ──────────────────────────────────────────────────────────

function ProposalRoadmap({ roadmap }) {
  if (!roadmap || roadmap.length === 0) return null;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Zap size={16} color="#7c3aed" />
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Proposal Roadmap
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              {['Section', 'Pages', 'Focus Areas', 'Lead Discriminator'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left',
                  fontSize: '10px', fontWeight: 700, color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roadmap.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{row.section}</td>
                <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{row.recommended_pages}</td>
                <td style={{ padding: '10px 12px', color: '#475569', lineHeight: 1.5 }}>
                  {(row.focus_areas || []).slice(0, 2).join(' · ')}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {row.discriminator && (
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: '#7c3aed',
                      background: '#f3e8ff', padding: '3px 8px', borderRadius: '6px'
                    }}>
                      {row.discriminator}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Intelligence Brief ───────────────────────────────────────────────────

export default function IntelligenceBrief({ auditData, onOpenForge }) {
  // auditData = output of auditPipeline.js runAudit()
  // Falls back to empty/demo state if no data

  const verdict = auditData?.verdict || {};
  const intelligence = auditData?.intelligence || {};
  const vcfg = VERDICT_CONFIG[verdict.recommendation] || VERDICT_CONFIG.CONDITIONAL;
  const VIcon = vcfg.icon;

  const isDemo = !auditData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Solicitation header — shows for both live and demo data */}
      {auditData && (
        <SolicitationHeader auditData={auditData} isDemo={auditData?.id === 'demo'} />
      )}

      {/* Empty state */}
      {isDemo && (
        <div style={{
          background: '#f8fafc', border: '2px dashed #e2e8f0',
          borderRadius: '12px', padding: '40px',
          textAlign: 'center'
        }}>
          <Shield size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#64748b', margin: '0 0 8px 0' }}>
            No solicitation loaded
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Run an audit from the main workspace to see the Intelligence Brief.
          </p>
        </div>
      )}

      {/* Verdict header */}
      {!isDemo && (
        <div style={{
          background: vcfg.bg,
          border: `1px solid ${vcfg.border}`,
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <WinGauge probability={verdict.win_probability} />

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <VIcon size={20} color={vcfg.color} />
                <span style={{
                  fontSize: '22px', fontWeight: 900, color: vcfg.color,
                  letterSpacing: '-0.02em'
                }}>
                  {vcfg.label}
                </span>
                <span style={{
                  fontSize: '12px', color: '#64748b', fontWeight: 500,
                  padding: '4px 10px', background: 'white',
                  borderRadius: '20px', border: '1px solid #e2e8f0'
                }}>
                  {verdict.confidence} CONFIDENCE
                </span>
              </div>

              {verdict.summary && (
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                  {verdict.summary}
                </p>
              )}
              {verdict.rationale && (
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                  {verdict.rationale}
                </p>
              )}
            </div>

            {onOpenForge && (
              <button
                onClick={onOpenForge}
                style={{
                  padding: '12px 20px',
                  background: '#002244',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,34,68,0.2)'
                }}
              >
                <Zap size={15} />
                Open in Forge
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timeline pressure banner */}
      {!isDemo && intelligence.timeline_pressure?.detected && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <Clock size={16} color="#d97706" />
          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
            Tight response window detected:{' '}
            {intelligence.timeline_pressure.days_to_respond
              ? `${intelligence.timeline_pressure.days_to_respond} business days`
              : 'unusually short deadline'}
          </span>
          {intelligence.timeline_pressure.explanation && (
            <span style={{ fontSize: '12px', color: '#78350f' }}>
              — {intelligence.timeline_pressure.explanation}
            </span>
          )}
        </div>
      )}

      {/* Incumbent + Evaluation row */}
      {!isDemo && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <IncumbentMeter signal={intelligence.incumbent_signal} />
          <EvaluationCard intelligence={intelligence} />
        </div>
      )}

      {/* Risks + Discriminators */}
      {!isDemo && (
        <RisksAndDiscriminators
          risks={intelligence.top_risks}
          discriminators={intelligence.key_discriminators}
        />
      )}

      {/* Hidden requirements */}
      {!isDemo && (
        <HiddenRequirements hidden={intelligence.hidden_requirements} />
      )}

      {/* Proposal Roadmap */}
      {!isDemo && (
        <ProposalRoadmap roadmap={auditData?.proposal_roadmap} />
      )}
    </div>
  );
}
