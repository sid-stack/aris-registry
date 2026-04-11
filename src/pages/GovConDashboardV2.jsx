/**
 * GovConDashboardV2 — BidSmith Chat UI
 *
 * Three-column layout:
 *   Left  (260px) — Documents + Audit history
 *   Center (flex) — Chat thread + input
 *   Right  (300px) — Agent thinking steps
 *
 * API wiring:
 *   POST /api/analyze-link     — new audit from SAM.gov URL
 *   POST /api/analyze-pdf      — new audit from PDF upload
 *   POST /api/govcon/chat      — follow-up chat with audit context
 *   GET  /api/audits/history   — load prior audits
 *   GET  /api/audits/:id       — load specific audit
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useClerk } from '@clerk/clerk-react';
import {
  Send, Plus, LogOut, Shield, FileText, Clock,
  ChevronRight, AlertTriangle, Check, Zap, Brain,
  Loader2, Upload, Link2, X, TrendingUp, BarChart2,
  ChevronDown, Paperclip, RefreshCw, BookOpen, Eye,
  EyeOff, Info, ExternalLink, Download, FileType2,
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { createCheckoutSession } from '../lib/stripe';
import { parseArisPlanJson } from '../utils/arisChatPlan';
import { downloadComplianceMatrixDocx } from '../utils/complianceMatrixDocx';
import { downloadGovConAuditPdf } from '../utils/govconAuditPdf';
import NextBestAction from '../components/govcon/NextBestAction';

// ─── Colors — dark sidebar + light main (ChatGPT style) ──────────────────────
const C = {
  // main area (light)
  bg:        '#ffffff',
  surface:   '#f9f9f9',
  surfaceHi: '#f3f4f6',
  border:    '#e5e7eb',
  borderHi:  '#d1d5db',
  text:      '#0d0d0d',
  textMuted: '#374151',
  textDim:   '#9ca3af',
  accent:    '#10a37f',
  accentHi:  '#0d8f6f',
  green:     '#16a34a',
  red:       '#dc2626',
  yellow:    '#d97706',
  navy:      '#002244',
  // sidebar (dark)
  sbBg:      '#171717',
  sbSurface: '#212121',
  sbBorder:  '#2a2a2a',
  sbText:    '#ececec',
  sbTextDim: '#8e8ea0',
};

// ─── Agent thinking steps ─────────────────────────────────────────────────────
const THINKING_STEPS = [
  { id: 'fetch',   label: 'Fetching solicitation from SAM.gov',   ms: 0    },
  { id: 'parse',   label: 'Parsing document structure',            ms: 1800 },
  { id: 'extract', label: 'Extracting FAR/DFARS clauses',          ms: 3600 },
  { id: 'risk',    label: 'Analyzing disqualifier risk signals',   ms: 5400 },
  { id: 'incumb',  label: 'Scoring incumbency indicators',         ms: 7200 },
  { id: 'matrix',  label: 'Building compliance matrix',            ms: 9000 },
  { id: 'verdict', label: 'Generating bid/no-bid recommendation',  ms: 10800 },
  { id: 'done',    label: 'Analysis complete',                      ms: 12600 },
];

// ─── Small helpers ────────────────────────────────────────────────────────────
function verdictColor(rec) {
  if (!rec) return C.textMuted;
  const r = rec.toUpperCase();
  if (r === 'BID' || r === 'GO') return C.green;
  if (r === 'NO-BID' || r === 'NO_BID' || r === 'NO BID') return C.red;
  return C.yellow;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function extractSolicitationName(audit) {
  return audit?.title || audit?.solicitation_number || 'Untitled Solicitation';
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function LeftSidebar({ activeAudit, history, onNewAudit, onSelectAudit, onBack, user, onLogout }) {
  const docs = activeAudit && activeAudit.id !== 'demo' ? [
    { name: extractSolicitationName(activeAudit), type: 'solicitation', icon: FileText },
    ...(activeAudit.attachments || []).map((a, i) => ({ name: a.name || `Attachment ${i + 1}`, type: 'attachment', icon: Paperclip })),
  ] : [];

  return (
    <aside style={{
      width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: C.sbBg, borderRight: `1px solid ${C.sbBorder}`,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.sbBorder}`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={onBack}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(16,163,127,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={14} color={C.accent} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 900, color: C.sbText, letterSpacing: '0.04em', fontFamily: "'Playfair Display', serif" }}>
          BidSmith
        </span>
      </div>

      {/* New conversation */}
      <div style={{ padding: '12px' }}>
        <button onClick={onNewAudit} style={{
          width: '100%', padding: '9px 12px',
          background: 'transparent',
          color: C.sbText, border: `1px solid ${C.sbBorder}`, borderRadius: 8, fontWeight: 600,
          fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 7, cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.sbSurface; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Plus size={14} /> New Evaluation
        </button>
      </div>

      {/* Documents */}
      {docs.length > 0 && (
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.sbTextDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px' }}>
            Documents
          </div>
          {docs.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
              borderRadius: 6, marginBottom: 2,
              background: i === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
            }}>
              <d.icon size={13} color={i === 0 ? C.accent : C.sbTextDim} />
              <span style={{ fontSize: 12, color: i === 0 ? C.sbText : C.sbTextDim, fontWeight: i === 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {d.name}
        </span>
              {d.type === 'solicitation' && (
                <span style={{ fontSize: 9, fontWeight: 800, color: C.accent, background: 'rgba(16,163,127,0.15)', padding: '2px 5px', borderRadius: 4 }}>
                  ACTIVE
          </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.sbTextDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, padding: '8px 4px 4px' }}>
          Audit History
        </div>
        {history.length === 0 ? (
          <div style={{ padding: '12px 4px', fontSize: 12, color: C.sbTextDim, lineHeight: 1.6 }}>
            No prior audits. Run your first audit.
          </div>
        ) : history.map(item => (
          <button key={item.id} onClick={() => onSelectAudit(item.id)} style={{
            width: '100%', textAlign: 'left', padding: '9px 8px', borderRadius: 6,
            marginBottom: 2, cursor: 'pointer', border: 'none',
            background: activeAudit?.id === item.id ? 'rgba(255,255,255,0.08)' : 'transparent',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (activeAudit?.id !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { if (activeAudit?.id !== item.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: C.sbText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
              {item.title || item.solicitation_number || 'Untitled'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: verdictColor(item.verdict?.recommendation || item.verdict) }}>
                {(item.verdict?.recommendation || item.verdict || 'PENDING').toUpperCase()}
              </span>
              <span style={{ fontSize: 10, color: C.sbTextDim }}>·</span>
              <span style={{ fontSize: 10, color: C.sbTextDim }}>{timeAgo(item.created_at)}</span>
            </div>
    </button>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: `1px solid ${C.sbBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: C.sbTextDim, fontWeight: 600 }}>
          {user?.email?.split('@')[0] || 'User'}
        </span>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', color: C.sbTextDim, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

// ─── Right Sidebar — Agent Thinking ──────────────────────────────────────────
function AgentThinkingPanel({ steps, isRunning }) {
  return (
    <aside style={{
      width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: C.surface, borderLeft: `1px solid ${C.border}`,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={14} color={C.accent} />
        <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Agent Thinking
        </span>
        {isRunning && (
          <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'pulse 1.2s infinite' }} />
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {steps.length === 0 ? (
          <div style={{ padding: '16px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,163,127,0.08)', border: `1px solid rgba(16,163,127,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Brain size={18} color={C.accent} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: '0.08em', marginBottom: 4 }}>ENGINE READY</div>
              <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>Awaiting solicitation</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { n: '01', title: 'Reads every clause', desc: 'FAR/DFARS, Section L/M/H, attachments' },
                { n: '02', title: 'Maps requirements', desc: 'Explicit + implied compliance with source citations' },
                { n: '03', title: 'Scores risks', desc: 'Disqualifiers, hidden requirements, deadlines' },
                { n: '04', title: 'Returns verdict', desc: 'Bid/No-Bid with win probability & rationale' },
              ].map(({ n, title, desc }) => (
                <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 800, color: C.accent, opacity: 0.7, marginTop: 2, flexShrink: 0 }}>{n}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{desc}</div>
                  </div>
          </div>
        ))}
      </div>
            <div style={{ marginTop: 20, padding: '10px 12px', background: 'rgba(16,163,127,0.05)', border: `1px solid rgba(16,163,127,0.15)`, borderRadius: 8, fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: C.accent }}>90 seconds</span> from URL to full compliance matrix.
    </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((step) => (
              <div key={step.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                opacity: step.status === 'pending' ? 0.35 : 1,
                transition: 'opacity 0.3s',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                  background: step.status === 'done' ? 'rgba(22,163,74,0.1)' : step.status === 'active' ? 'rgba(16,163,127,0.1)' : C.surfaceHi,
                  border: `1px solid ${step.status === 'done' ? C.green : step.status === 'active' ? C.accent : C.border}`,
                }}>
                  {step.status === 'done' && <Check size={11} color={C.green} />}
                  {step.status === 'active' && <Loader2 size={11} color={C.accent} style={{ animation: 'spin 1s linear infinite' }} />}
                  {step.status === 'pending' && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.textDim }} />}
                </div>
        <div>
                  <div style={{ fontSize: 12, color: step.status === 'done' ? C.textMuted : step.status === 'active' ? C.accent : C.textDim, fontWeight: step.status === 'active' ? 600 : 400, lineHeight: 1.4 }}>
                    {step.label}
        </div>
                  {step.status === 'active' && (
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>Processing...</div>
                  )}
          </div>
          </div>
            ))}
        </div>
        )}
      </div>

      <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.textDim, fontFamily: 'monospace' }}>
          BIDSMITH AUDIT ENGINE v2
      </div>
      </div>
    </aside>
  );
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  if (!level) return null;
  const map = {
    HIGH:   { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'HIGH CONFIDENCE' },
    MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'MED CONFIDENCE'  },
    LOW:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'LOW CONFIDENCE'  },
  };
  const s = map[level.toUpperCase()] || map.MEDIUM;
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color: s.color, background: s.bg, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.08em', border: `1px solid ${s.color}33` }}>
      {s.label}
    </span>
  );
}

// ─── Source citation tag ──────────────────────────────────────────────────────
function SourceTag({ section, excerpt, auditMode }) {
  const [open, setOpen] = useState(false);
  if (!section) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, color: C.accent, background: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.25)`, borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.04em' }}
      >
        <BookOpen size={9} /> § {section}
        {excerpt && <ChevronDown size={9} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
      </button>
      {open && excerpt && (
        <div style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(59,130,246,0.06)', border: `1px solid rgba(59,130,246,0.15)`, borderRadius: 6, borderLeft: `2px solid ${C.accent}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.textDim, letterSpacing: '0.08em', marginBottom: 4 }}>SOURCE EXCERPT</div>
          <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{excerpt}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Needs-review badge (Audit Mode) ─────────────────────────────────────────
function NeedsReviewBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.06em' }}>
      <AlertTriangle size={8} /> VERIFY
    </span>
  );
}

// ─── Paywall gate — blurs content, shows upgrade CTA ─────────────────────────
function PaywallGate({ userId, children, label = "Full Intelligence" }) {
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const url = await createCheckoutSession({ plan: "starter", uid: userId });
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', maxWidth: 540 }}>
      {/* Blurred preview */}
      <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.6 }}>
        {children}
      </div>

      {/* Overlay CTA */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(2px)',
        borderRadius: 10,
        border: '1.5px solid #e5e7eb',
        padding: '20px 24px',
        textAlign: 'center',
        gap: 10,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(11,61,145,0.08)', border: '1px solid rgba(11,61,145,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={16} color='#0B3D91' />
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.01em' }}>
          {label} requires a subscription
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
          Unlock the compliance matrix, risk flags, and action plan.<br />
          <strong style={{ color: '#0d0d0d' }}>Starter — $99/mo</strong>. Cancel any time.
        </div>
        <button
          onClick={handleUnlock}
          disabled={loading}
          style={{
            marginTop: 4,
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: loading ? '#9ca3af' : '#0B3D91',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'background 0.2s',
          }}
        >
          {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />}
          {loading ? 'Redirecting…' : 'Unlock with Starter — $99/mo'}
        </button>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>
          Verdict &amp; win probability always free
        </div>
      </div>
    </div>
  );
}

// ─── Access status badge ──────────────────────────────────────────────────────
function AccessBadge({ isSubscribed, userId }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await createCheckoutSession({ plan: 'starter', uid: userId });
      window.location.href = url;
    } catch { setLoading(false); }
  };

  if (isSubscribed) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 8px',
        background: 'rgba(22,163,74,0.07)',
        border: '1px solid rgba(22,163,74,0.25)',
        borderRadius: 99,
        fontSize: 11, fontWeight: 700,
        color: '#15803d',
        letterSpacing: '0.02em',
        alignSelf: 'flex-start',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
        </svg>
        UNLOCKED · Subscriber Access
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '4px 10px 4px 8px',
      background: 'rgba(180,83,9,0.06)',
      border: '1px solid rgba(180,83,9,0.2)',
      borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      color: '#92400e',
      letterSpacing: '0.02em',
      alignSelf: 'flex-start',
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      LOCKED · Full analysis requires subscription —
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          background: 'none', border: 'none', padding: 0, margin: 0,
          cursor: loading ? 'not-allowed' : 'pointer',
          color: '#0B3D91', fontWeight: 800, fontSize: 11,
          textDecoration: 'underline', textUnderlineOffset: 2,
          fontFamily: 'inherit', letterSpacing: '0.02em',
        }}
      >
        {loading ? 'redirecting…' : 'Upgrade $99/mo →'}
      </button>
    </div>
  );
}

// ─── Free limit hit — teaser CTA ─────────────────────────────────────────────
function FreeLimitCard({ userId }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await createCheckoutSession({ plan: 'starter', uid: userId });
      window.location.href = url;
    } catch { setLoading(false); }
  };

  return (
    <div style={{
      maxWidth: 480,
      background: 'linear-gradient(135deg, #0B3D91 0%, #1d4ed8 100%)',
      borderRadius: 12, padding: '20px 22px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(11,61,145,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={15} color="#fff" />
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
          You've used your 1 free audit
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 16px' }}>
        Your free verdict is saved. To run <strong style={{ color: '#fff' }}>unlimited audits</strong> with full compliance matrices, risk flags, and action plans — upgrade to Starter.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {['Unlimited audits', 'Full compliance matrix', 'FAR/DFARS risk flags', 'Action plan'].map(f => (
          <span key={f} style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, padding: '3px 10px' }}>
            ✓ {f}
          </span>
        ))}
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: '#fff', color: '#0B3D91', fontSize: 14, fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'opacity 0.2s',
        }}
      >
        {loading
          ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          : <Zap size={14} />}
        {loading ? 'Redirecting to Stripe…' : 'Unlock Starter — $99/mo'}
      </button>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 }}>
        Cancel any time · 10 audits/month · No contracts
      </div>
    </div>
  );
}

// ─── Inline result cards ──────────────────────────────────────────────────────
function VerdictCard({ audit, auditMode }) {
  const rec = audit?.verdict?.recommendation || 'REVIEW';
  const prob = audit?.verdict?.win_probability;
  const conf = audit?.verdict?.confidence;
  const color = verdictColor(rec);
  const isLowConf = conf === 'LOW' || conf === 'MEDIUM';

  return (
    <div style={{
      background: C.surfaceHi,
      border: `1px solid ${auditMode && isLowConf ? 'rgba(245,158,11,0.4)' : C.border}`,
        borderLeft: `3px solid ${auditMode && isLowConf ? '#f59e0b' : color}`,
        borderRadius: 10, padding: '16px 18px', maxWidth: 480,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.textDim, letterSpacing: '0.1em' }}>BID / NO-BID VERDICT</span>
        <ConfidenceBadge level={conf} />
        {auditMode && isLowConf && <NeedsReviewBadge />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color }}>{rec.toUpperCase()}</span>
        {prob != null && (
          <div>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>WIN PROBABILITY</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{prob}%</div>
      </div>
        )}
      </div>
      {audit?.verdict?.summary && (
        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>{audit.verdict.summary}</p>
      )}
      {auditMode && isLowConf && (
        <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
          AI confidence is {(conf || 'MEDIUM').toLowerCase()} on this verdict. Review the rationale and validate against Section M evaluation criteria before committing.
        </div>
      )}
    </div>
  );
}

function RiskCard({ audit, auditMode }) {
  const risks = (audit?.intelligence?.top_risks || []).slice(0, 4);
  const highReqs = (audit?.requirements || []).filter(r => r.risk === 'HIGH' || r.is_disqualifier).slice(0, 4);
  const items = risks.length > 0 ? risks : highReqs;
  if (items.length === 0) return null;
  return (
    <div style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', maxWidth: 480 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.textDim, letterSpacing: '0.1em', marginBottom: 10 }}>TOP RISK FLAGS</div>
      {items.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 8 }}>
          <AlertTriangle size={13} color={C.red} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            {r.risk || r.requirement || r.description || JSON.stringify(r)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ComplianceCard({ audit, auditMode }) {
  const reqs = (audit?.requirements || []).slice(0, 5);
  if (reqs.length === 0) return null;

  const needsReview = (r) => auditMode && (r.risk === 'HIGH' || r.is_disqualifier || !r.source_excerpt);

  return (
    <div style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', maxWidth: 540 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.textDim, letterSpacing: '0.1em' }}>COMPLIANCE MATRIX (PREVIEW)</span>
        {auditMode && (
          <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em' }}>
            AUDIT MODE
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {reqs.map((r, i) => {
          const flagged = needsReview(r);
          return (
            <div key={r.id || i} style={{
              padding: '10px 12px', borderRadius: 7,
              background: flagged ? 'rgba(245,158,11,0.06)' : C.surface,
              border: `1px solid ${flagged ? 'rgba(245,158,11,0.3)' : C.border}`,
              borderLeft: `3px solid ${flagged ? '#f59e0b' : (r.risk === 'HIGH' || r.is_disqualifier) ? C.red : C.green}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {r.is_disqualifier
                    ? <AlertTriangle size={12} color={flagged ? '#f59e0b' : C.red} />
                    : r.risk === 'HIGH'
                      ? <AlertTriangle size={12} color={flagged ? '#f59e0b' : C.red} />
                      : <Check size={12} color={C.green} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: C.text, lineHeight: 1.45 }}>{r.requirement}</span>
                    {flagged && <NeedsReviewBadge />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: r.risk === 'HIGH' ? C.red : r.risk === 'MED' ? C.yellow : C.green, fontWeight: 700 }}>{r.risk}</span>
                    {r.is_disqualifier && <span style={{ fontSize: 9, color: C.red, fontWeight: 800, background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 3 }}>DISQUALIFIER</span>}
                    <SourceTag section={r.section} excerpt={r.source_excerpt} auditMode={auditMode} />
                  </div>
                  {r.action_required && (
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, lineHeight: 1.5 }}>
                      → {r.action_required}
                    </div>
                  )}
                  {flagged && !r.source_excerpt && (
                    <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4, fontStyle: 'italic' }}>
                      No source excerpt — AI inferred this requirement. Verify manually against original RFP.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {(audit?.requirements || []).length > 5 && (
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 8, textAlign: 'center' }}>
          +{audit.requirements.length - 5} more requirements in full audit
        </div>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, auditMode, isStreaming, isSubscribed, userId }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 20, alignItems: 'flex-start' }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(16,163,127,0.08)', border: `1.5px solid rgba(16,163,127,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Shield size={13} color={C.accent} />
        </div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msg.type === 'free_limit' ? (
          <FreeLimitCard userId={userId} />
        ) : msg.type === 'audit_result' ? (
          <>
            <VerdictCard audit={msg.audit} auditMode={auditMode} />
            <AccessBadge isSubscribed={isSubscribed} userId={userId} />
            {isSubscribed ? (
              <>
                <RiskCard audit={msg.audit} auditMode={auditMode} />
                <ComplianceCard audit={msg.audit} auditMode={auditMode} />
              </>
            ) : (
              <>
                <PaywallGate userId={userId} label="Risk Flags">
                  <RiskCard audit={msg.audit} auditMode={auditMode} />
                </PaywallGate>
                <PaywallGate userId={userId} label="Compliance Matrix">
                  <ComplianceCard audit={msg.audit} auditMode={auditMode} />
                </PaywallGate>
              </>
            )}
          </>
        ) : msg.type === 'external_docs' ? (
          <div style={{ background: C.surfaceHi, border: `1px solid rgba(245,158,11,0.35)`, borderLeft: `3px solid #f59e0b`, borderRadius: 10, padding: '16px 18px', maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ExternalLink size={14} color="#f59e0b" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.08em' }}>DOCUMENTS HOSTED EXTERNALLY</span>
            </div>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, margin: '0 0 14px' }}>
              This solicitation's documents aren't stored on SAM.gov — they're on an external portal. Download the PDF from the link below and upload it here.
            </p>
            {(msg.externalLinks || []).map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, color: '#f59e0b', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 6 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
              >
                <ExternalLink size={12} /> {link}
              </a>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: C.textDim }}>
              After downloading, use the <strong style={{ color: C.text }}>PDF</strong> button in the chat input to upload and audit it.
            </div>
          </div>
        ) : (
          <div style={{
            background: isUser ? C.surfaceHi : C.bg,
            color: C.text,
            padding: '11px 16px', borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
            fontSize: 14, lineHeight: 1.7,
            border: isUser ? 'none' : 'none',
            maxWidth: isUser ? '72%' : '100%',
          }}>
            {msg.role === 'assistant' && (msg.plan?.steps?.length > 0 || msg.plan?.next_action) && (
              <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: C.surfaceHi, border: `1px solid ${C.border}` }}>
                {msg.plan.steps?.length > 0 && (
                  <>
                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Plan</p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.textMuted }}>
                      {msg.plan.steps.map((s) => (
                        <li key={s.id} style={{ marginBottom: 4 }}>{s.status === 'done' ? '✓ ' : '○ '}{s.title}</li>
                      ))}
                    </ul>
                  </>
                )}
                {msg.plan.next_action ? (
                  <p style={{ margin: msg.plan.steps?.length ? '8px 0 0' : 0, fontSize: 13, color: C.accent, fontWeight: 600 }}>Next: {msg.plan.next_action}</p>
                ) : null}
              </div>
            )}
            {msg.role === 'assistant'
              ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({children}) => <p style={{margin: '0 0 10px', color: C.text}}>{children}</p>, ul: ({children}) => <ul style={{margin: '0 0 10px', paddingLeft: 20}}>{children}</ul>, li: ({children}) => <li style={{marginBottom: 5, color: C.text}}>{children}</li>, strong: ({children}) => <strong style={{fontWeight: 700, color: C.text}}>{children}</strong> }}>{msg.content}</ReactMarkdown>
              : <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
            }
            {isStreaming && (
              <span style={{ display: 'inline-block', width: 2, height: 16, background: C.accent, borderRadius: 1, verticalAlign: 'middle', animation: 'pulse 0.8s ease-in-out infinite', marginLeft: 2 }} />
            )}
          </div>
        )}
        {msg.timestamp && (
          <div style={{ fontSize: 10, color: C.textDim, paddingLeft: isUser ? 0 : 4, textAlign: isUser ? 'right' : 'left' }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.surfaceHi, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.textMuted, marginTop: 2 }}>
          {String.fromCodePoint(0x1F464)}
        </div>
      )}
    </div>
  );
}

// ─── Empty state / New audit input ───────────────────────────────────────────
const CAPABILITY_CARDS = [
  { icon: Link2,    label: 'Audit a SAM.gov URL',        sub: 'Paste any opportunity link',          action: 'url'      },
  { icon: Upload,   label: 'Review a PDF solicitation',   sub: 'Upload Section L/M/H documents',      action: 'file'     },
  { icon: Brain,    label: 'Ask a FAR/DFARS question',    sub: 'Compliance, clauses, strategy',       action: 'question' },
];

const STARTER_PROMPTS = [
  'What is CMMC Level 2 and do I need it?',
  'Explain FAR 52.204-21 cybersecurity requirements',
  'What makes a strong past performance reference?',
  'How do I win a small business set-aside?',
];

function EmptyState({ onAuditUrl, onAuditFile, fileRef, onStartChat, userName }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = userName ? `, ${userName}` : '';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', minHeight: '100%' }}>

      {/* AI avatar */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, rgba(99,130,255,0.25), rgba(59,130,246,0.08))', border: `1px solid rgba(99,130,255,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(59,130,246,0.15)' }}>
          <Shield size={30} color={C.accent} />
        </div>
        <div style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: C.green, border: `2px solid ${C.bg}`, boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
            </div>

      {/* Greeting */}
      <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        {greeting}{name}.
      </h2>
      <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.7, maxWidth: 420, margin: '0 0 36px' }}>
        I analyze federal solicitations — every FAR/DFARS clause — and return a bid/no-bid verdict with evidence in 90 seconds.
      </p>

      {/* Capability cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36, maxWidth: 560 }}>
        {CAPABILITY_CARDS.map(({ icon: Icon, label, sub, action }) => (
          <button
            key={action}
            onClick={() => {
              if (action === 'file') fileRef.current?.click();
              else if (action === 'question') onStartChat?.();
              else onStartChat?.('url');
            }}
              style={{
              flex: '1 1 150px', maxWidth: 170,
              padding: '16px 14px', textAlign: 'left',
              background: C.surfaceHi, border: `1px solid ${C.border}`,
              borderRadius: 12, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = 'rgba(59,130,246,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surfaceHi; }}
          >
            <Icon size={18} color={C.accent} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{sub}</div>
          </button>
          ))}
        </div>

      {/* Starter prompts */}
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.textDim, letterSpacing: '0.1em', marginBottom: 10 }}>TRY ASKING</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STARTER_PROMPTS.map(q => (
            <button
              key={q}
              onClick={() => onAuditUrl(null, q)}
              style={{
                textAlign: 'left', padding: '10px 14px',
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 8, cursor: 'pointer', color: C.textMuted,
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surfaceHi; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
            >
              <ChevronRight size={13} color={C.textDim} style={{ flexShrink: 0 }} />
              {q}
            </button>
          ))}
            </div>
      </div>
    </div>
  );
}

// ─── Chat Input ───────────────────────────────────────────────────────────────
function ChatInput({ onSend, onAuditUrl, onAuditFile, fileRef, loading, hasAudit }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const isUrl = (s) => s.startsWith('http') || s.includes('sam.gov');

  const handleSend = () => {
    if (loading || !text.trim()) return;
    if (isUrl(text.trim())) { onAuditUrl(text.trim()); setText(''); return; }
    onSend(text.trim());
    setText('');
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [text]);

  const QUICK = hasAudit
    ? ['Top disqualifiers?', 'Summarize Section L', 'Draft executive summary', 'Evaluation criteria?']
    : [];

  const placeholder = hasAudit
    ? 'Ask anything about this solicitation, or paste a new SAM.gov URL…'
    : 'Ask a FAR/DFARS question, or paste a SAM.gov URL to audit…';

  return (
    <div style={{ padding: '8px 20px 20px', background: C.bg, borderTop: `1px solid ${C.border}` }}>

      {/* Quick action chips — only when audit is active */}
      {QUICK.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, paddingTop: 8 }}>
          {QUICK.map(q => (
            <button
              key={q}
              onClick={() => onSend(q)}
              disabled={loading}
              style={{ fontSize: 11, color: C.textMuted, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 99, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Unified input box */}
      <div style={{
        background: C.bg,
        border: `1px solid ${focused ? C.accent : C.borderHi}`,
        borderRadius: 14, padding: '14px 14px 10px',
        boxShadow: focused ? `0 0 0 3px rgba(16,163,127,0.1), 0 1px 6px rgba(0,0,0,0.06)` : '0 1px 6px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        maxWidth: 720, margin: '0 auto',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={1}
          style={{
            width: '100%', background: 'transparent', border: 'none',
            color: C.text, fontSize: 14, outline: 'none', resize: 'none',
            fontFamily: 'inherit', lineHeight: 1.6, padding: 0,
            maxHeight: 160, overflowY: 'auto', boxSizing: 'border-box',
          }}
        />

        {/* Bottom row — actions + send */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => fileRef.current?.click()}
            title="Upload PDF solicitation"
            style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: C.textDim, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}
          >
            <Paperclip size={13} /> PDF
    </button>
          <button
            onClick={() => { const url = window.prompt('Paste SAM.gov URL:'); if (url?.trim()) onAuditUrl(url.trim()); }}
            title="Audit a SAM.gov URL"
            style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: C.textDim, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}
          >
            <Link2 size={13} /> SAM.gov
          </button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: C.textDim, opacity: 0.6 }}>↵ to send</span>
          <button
            onClick={handleSend}
            disabled={loading || !text.trim()}
            style={{
              background: loading || !text.trim() ? C.surfaceHi : C.accent,
              border: `1px solid ${loading || !text.trim() ? C.border : 'transparent'}`,
              borderRadius: 8, padding: '7px 14px',
              color: loading || !text.trim() ? C.textDim : '#fff',
              cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {loading
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function GovConDashboardV2({ onBack, user }) {
  const { signOut } = useClerk();
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [auditMode, setAuditMode] = useState(false);
  const [exportDocxLoading, setExportDocxLoading] = useState(false);
  const [exportPdfLoading, setExportPdfLoading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const thinkingTimers = useRef([]);

  useEffect(() => {
    document.body.style.background = C.bg;
    return () => { document.body.style.background = ''; };
  }, []);

  // Load history on mount
  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/audits?limit=30', { headers: { 'x-user-id': user.id } });
      if (!res.ok) return;
      const { audits } = await res.json();
      const normalized = (audits || []).map(a => ({
        ...a,
        verdict: typeof a.verdict === 'string'
          ? { recommendation: a.verdict, win_probability: a.win_probability || 0 }
          : (a.verdict || {}),
      }));
      setHistory(normalized);
    } catch { /* silent */ }
  };

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random(), timestamp: new Date().toISOString() }]);
  };

  // ── Start thinking animation ─────────────────────────────────────────────
  const startThinking = () => {
    thinkingTimers.current.forEach(clearTimeout);
    thinkingTimers.current = [];
    const initial = THINKING_STEPS.map(s => ({ ...s, status: 'pending' }));
    setThinkingSteps(initial);

    THINKING_STEPS.forEach((step, idx) => {
      const activateTimer = setTimeout(() => {
        setThinkingSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'active' } : s));
      }, step.ms);

      const doneTimer = setTimeout(() => {
        setThinkingSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'done' } : s));
      }, step.ms + 1600);

      thinkingTimers.current.push(activateTimer, doneTimer);
    });
  };

  const finishThinking = () => {
    thinkingTimers.current.forEach(clearTimeout);
    setThinkingSteps(THINKING_STEPS.map(s => ({ ...s, status: 'done' })));
  };

  // ── Run audit from URL ───────────────────────────────────────────────────
  const runAuditUrl = async (url) => {
    if (isAuditing) return;
    setIsAuditing(true);
    addMessage({ role: 'user', content: `Audit this solicitation:\n${url}` });
    addMessage({ role: 'assistant', content: '**Audit started.** Fetching solicitation from SAM.gov and running compliance analysis...' });
    startThinking();
    trackEvent('audit_started', { method: 'url' });

    try {
      const res = await fetch('/api/audit/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-subscribed': user?.isSubscribed ? 'true' : 'false',
        },
        body: JSON.stringify({ url, userId: user?.id, userEmail: user?.email }),
      });
      const data = await res.json();
      finishThinking();

      if (!res.ok || data.error) {
        if (data.code === 'FREE_LIMIT_REACHED') {
          addMessage({ role: 'assistant', type: 'free_limit', content: data.error });
        } else if (data.code === 'EXTERNAL_DOCUMENTS' && data.externalLinks?.length) {
          addMessage({
            role: 'assistant',
            type: 'external_docs',
            externalLinks: data.externalLinks,
            hint: data.hint,
            content: data.error,
          });
        } else {
          const hint = data.hint ? `\n\n*${data.hint}*` : '';
          addMessage({ role: 'assistant', content: `**Could not fetch solicitation.**\n\n${data.error || 'Please check the URL and try again.'}${hint}` });
        }
      } else {
        setActiveAudit(data);
        addMessage({ role: 'assistant', type: 'audit_result', audit: data, content: '' });
        addMessage({ role: 'assistant', content: `Audit complete. I've analyzed **${data.title || 'this solicitation'}** and generated your compliance matrix.\n\nWhat would you like to know? I can explain the risk flags, dig into specific requirements, or help you start the proposal.` });
        trackEvent('audit_completed', { recommendation: data?.verdict?.recommendation });
        loadHistory();
      }
    } catch (err) {
      finishThinking();
      addMessage({ role: 'assistant', content: '**Connection error.** Could not reach the BidSmith API. Please check your connection and try again.' });
    } finally {
      setIsAuditing(false);
    }
  };

  // ── Run audit from PDF ───────────────────────────────────────────────────
  const runAuditFile = async (file) => {
    if (isAuditing || !file) return;
    setIsAuditing(true);
    addMessage({ role: 'user', content: `Upload and audit: **${file.name}**` });
    addMessage({ role: 'assistant', content: '**PDF received.** Extracting text and running compliance analysis...' });
    startThinking();
    trackEvent('audit_started', { method: 'pdf' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (user?.id) formData.append('userId', user.id);
      if (user?.email) formData.append('userEmail', user.email);

      const res = await fetch('/api/audit/pdf', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': user?.id || '',
          'x-subscribed': user?.isSubscribed ? 'true' : 'false',
        },
      });
      const data = await res.json();
      finishThinking();

      if (!res.ok || data.error) {
        addMessage({ role: 'assistant', content: `**Error:** ${data.error || 'PDF analysis failed. Please try again.'}` });
      } else {
        setActiveAudit(data);
        addMessage({ role: 'assistant', type: 'audit_result', audit: data, content: '' });
        addMessage({ role: 'assistant', content: `Audit complete for **${file.name}**.\n\nAsk me about the compliance requirements, risk flags, or how to approach the proposal.` });
        trackEvent('audit_completed', { recommendation: data?.verdict?.recommendation });
        loadHistory();
      }
    } catch {
      finishThinking();
      addMessage({ role: 'assistant', content: '**Upload error.** Could not process the PDF. Please try again.' });
    } finally {
      setIsAuditing(false);
    }
  };

  // ── Load prior audit ─────────────────────────────────────────────────────
  const loadAudit = async (id) => {
    try {
      const res = await fetch(`/api/audits/${id}`, { headers: { 'x-user-id': user?.id || '' } });
      if (!res.ok) return;
      const data = await res.json();
      const audit = data?.result || data;
      if (!audit) return;

      setActiveAudit(audit);
      setMessages([]);
      setTimeout(() => {
        addMessage({ role: 'assistant', content: `Loaded audit: **${extractSolicitationName(audit)}**` });
        addMessage({ role: 'assistant', type: 'audit_result', audit, content: '' });
        addMessage({ role: 'assistant', content: 'What would you like to know about this solicitation?' });
        setThinkingSteps(THINKING_STEPS.map(s => ({ ...s, status: 'done' })));
      }, 50);
        trackEvent('audit_history_opened', { audit_id: id });
    } catch { /* silent */ }
  };

  // ── Send chat message — real SSE streaming ──────────────────────────────
  const sendChat = async (text) => {
    if (isChatLoading || !text.trim()) return;

    if (!activeAudit && (text.startsWith('http') || text.includes('sam.gov'))) {
      runAuditUrl(text);
      return;
    }

    addMessage({ role: 'user', content: text });
    setIsChatLoading(true);

    const chatHistory = messages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content && m.type !== 'audit_result'))
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    // Insert empty assistant message that we'll stream into
    const msgId = Date.now() + Math.random();
    setMessages(prev => [...prev, {
      id: msgId, role: 'assistant', type: 'text',
      content: '', timestamp: new Date().toISOString(),
    }]);
    setStreamingId(msgId);

    const appendChunk = (chunk) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: m.content + chunk } : m));
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: text }],
          auditContext: activeAudit,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const txt = data?.text || data?.response || 'Something went wrong. Please try again.';
        const pl = data?.plan;
        setMessages(prev => prev.map(m => m.id === msgId ? {
          ...m,
          content: txt,
          plan: pl ? { steps: pl.steps || [], next_action: pl.next_action || '' } : m.plan,
        } : m));
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') break;
            try {
              const obj = JSON.parse(payload);
              if (obj.chunk) appendChunk(obj.chunk);
              if (obj.meta?.plan) {
                setMessages(prev => prev.map(m => m.id === msgId ? {
                  ...m,
                  plan: {
                    steps: obj.meta.plan.steps || [],
                    next_action: obj.meta.plan.next_action || '',
                  },
                } : m));
              }
            } catch { /* skip malformed line */ }
          }
        }
        setMessages(prev => prev.map(m => {
          if (m.id !== msgId || (m.plan?.steps?.length > 0 || m.plan?.next_action)) return m;
          const parsed = parseArisPlanJson(m.content);
          if (parsed.steps.length || parsed.next_action) {
            return {
              ...m,
              content: parsed.answer || m.content,
              plan: { steps: parsed.steps, next_action: parsed.next_action },
            };
          }
          return m;
        }));
      }
    } catch {
      appendChunk('Network error — please check your connection.');
    } finally {
      setStreamingId(null);
      setIsChatLoading(false);
    }
  };

  const handleLogout = () => signOut(() => { window.location.href = '/'; });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) runAuditFile(file);
    e.target.value = '';
  };

  // Quick question without audit context (empty state chips)
  const handleQuickQuestion = (url, question) => {
    if (url && (url.startsWith('http') || url.includes('sam.gov'))) { runAuditUrl(url); return; }
    if (question) sendChat(question);
  };

  const handleExportDocx = async () => {
    if (!activeAudit || exportDocxLoading) return;
    trackEvent("compliance_matrix_docx_download", {
      format: "docx",
      solicitation: activeAudit.solicitation_number || activeAudit.id || null,
      category: "export",
    });
    setExportDocxLoading(true);
    try {
      await downloadComplianceMatrixDocx(activeAudit);
    } catch {
      addMessage({ role: 'assistant', type: 'text', content: "**Export failed.** Could not build the Word file. Try again or use PDF." });
    } finally {
      setExportDocxLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activeAudit || exportPdfLoading) return;
    trackEvent("compliance_matrix_pdf_download", {
      format: "pdf",
      solicitation: activeAudit.solicitation_number || activeAudit.id || null,
      category: "export",
    });
    setExportPdfLoading(true);
    try {
      await downloadGovConAuditPdf(activeAudit);
    } catch {
      addMessage({ role: 'assistant', type: 'text', content: "**PDF export failed.** Check your browser download settings and try again." });
    } finally {
      setExportPdfLoading(false);
    }
  };

  const isLoading = isAuditing || isChatLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf" onChange={handleFileChange} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left sidebar */}
        <LeftSidebar
          activeAudit={activeAudit}
          history={history}
          onNewAudit={() => { setMessages([]); setActiveAudit(null); setThinkingSteps([]); }}
          onSelectAudit={loadAudit}
          onBack={onBack}
          user={user}
          onLogout={handleLogout}
        />

        {/* Center — Chat */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg }}>
      {/* Top bar */}
          <div style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, flexShrink: 0 }}>
            {activeAudit ? (
              <>
                <FileText size={14} color={C.textDim} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                  {extractSolicitationName(activeAudit)}
          </span>
                {activeAudit?.verdict?.recommendation && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: verdictColor(activeAudit.verdict.recommendation), background: `${verdictColor(activeAudit.verdict.recommendation)}18`, padding: '3px 8px', borderRadius: 6, border: `1px solid ${verdictColor(activeAudit.verdict.recommendation)}33`, flexShrink: 0 }}>
                    {activeAudit.verdict.recommendation.toUpperCase()}
          </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: 12, color: C.textDim }}>No active solicitation</span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              {isAuditing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.accent }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  Analyzing solicitation...
        </div>
              )}
              {activeAudit && !isAuditing && (
                <>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={exportPdfLoading}
                    title="Download compliance matrix as PDF"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, fontWeight: 700,
                      color: C.textMuted,
                      background: C.surfaceHi,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: '6px 11px', cursor: exportPdfLoading ? 'wait' : 'pointer',
                    }}
                  >
                    {exportPdfLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportDocx}
                    disabled={exportDocxLoading}
                    title="Download Word matrix for bid construction"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, fontWeight: 800,
                      color: '#fff',
                      background: C.accent,
                      border: `1px solid ${C.accent}`,
                      borderRadius: 8, padding: '6px 12px', cursor: exportDocxLoading ? 'wait' : 'pointer',
                    }}
                  >
                    {exportDocxLoading ? <Loader2 size={13} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <FileType2 size={13} color="#fff" />}
                    .docx (Bid construction)
                  </button>
                </>
              )}
              {/* Audit Mode toggle */}
              <button
                onClick={() => setAuditMode(v => !v)}
                title={auditMode ? 'Exit Audit Mode — hide uncertainty flags' : 'Audit Mode — highlight items AI is uncertain about'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
                  color: auditMode ? '#f59e0b' : C.textDim,
                  background: auditMode ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${auditMode ? 'rgba(245,158,11,0.35)' : C.border}`,
                  borderRadius: 6, padding: '5px 11px', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {auditMode ? <Eye size={11} /> : <EyeOff size={11} />}
                AUDIT MODE {auditMode ? 'ON' : 'OFF'}
              </button>
        </div>
        </div>

          {activeAudit && (
            <NextBestAction
              audit={activeAudit}
              fileRef={fileRef}
              onAction={(type, prompt) => {
                if (type === "chat" && prompt) sendChat(prompt);
                if (type === "focus_chat") {
                  document.querySelector("textarea")?.focus();
                }
              }}
            />
          )}

          {/* Message thread */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {messages.length === 0 ? (
              <EmptyState
                onAuditUrl={handleQuickQuestion}
                onAuditFile={runAuditFile}
                fileRef={fileRef}
                onStartChat={() => document.querySelector('textarea')?.focus()}
                userName={user?.firstName || user?.email?.split('@')[0] || ''}
              />
            ) : (
              <>
                {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  auditMode={auditMode}
                  isStreaming={msg.id === streamingId}
                  isSubscribed={user?.isSubscribed === true}
                  userId={user?.id}
                />
              ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Chat input */}
          <ChatInput
            onSend={sendChat}
            onAuditUrl={(url) => runAuditUrl(url)}
            onAuditFile={runAuditFile}
            fileRef={fileRef}
            loading={isLoading}
            hasAudit={!!activeAudit}
          />
        </main>

        {/* Right sidebar — Agent thinking */}
        <AgentThinkingPanel steps={thinkingSteps} isRunning={isAuditing} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { margin: 0; background: ${C.bg}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
        textarea { resize: none; }
        textarea::placeholder { color: ${C.textDim}; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}} />
    </div>
  );
}
