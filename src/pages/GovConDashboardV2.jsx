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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useClerk } from '@clerk/clerk-react';
import {
  Send, Plus, LogOut, Shield, FileText, Clock,
  ChevronRight, AlertTriangle, Check, Zap, Brain,
  Loader2, Upload, Link2, X, TrendingUp, BarChart2,
  ChevronDown, Paperclip, RefreshCw, BookOpen, Eye,
  EyeOff, Info, ExternalLink, Download, FileType2,
  Menu, Calendar,
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { createCheckoutSession } from '../lib/stripe';
import { parseArisPlanJson } from '../utils/arisChatPlan';
import { downloadComplianceMatrixDocx } from '../utils/complianceMatrixDocx';
import { downloadComplianceMatrixXlsx } from '../utils/complianceMatrixXlsx';
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

/** Free 20 min walkthrough — set `VITE_CALENDLY_AUDIT_WALKTHROUGH` in Vercel / .env, or replace the fallback once your Calendly slug exists. */
const AUDIT_WALKTHROUGH_CALENDLY_URL =
  (typeof import.meta !== 'undefined' && String(import.meta.env?.VITE_CALENDLY_AUDIT_WALKTHROUGH || '').trim())
  || 'https://calendly.com/bidsmith-pro/audit-walkthrough';

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
  const n = normalizePursuitRecommendation(rec);
  if (n === 'BID') return C.green;
  if (n === 'NO_BID') return C.red;
  if (n === 'INSUFFICIENT') return C.yellow;
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

// ─── Viewport + markdown (engine returns MD in JSON fields too) ───────────────
function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

/** If the model wraps the whole answer in one ``` fence, unwrap so **bold** parses. */
function normalizeEngineMarkdown(s) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  const m = t.match(/^```(?:markdown|md|txt)?\s*\n?([\s\S]*?)\n?```$/i);
  if (m) return m[1].trim();
  return s;
}

function govMarkdownComponents(variant) {
  const isInline = variant === 'inline';
  const text = () => (isInline ? { color: C.text, fontSize: 'inherit', lineHeight: 1.5 } : { color: C.text });
  return {
    p: ({ children }) => (isInline
      ? <span style={{ ...text(), display: 'block', marginBottom: 4 }}>{children}</span>
      : <p style={{ margin: '0 0 10px', color: C.text }}>{children}</p>),
    ul: ({ children }) => (isInline
      ? <span style={text()}>{children}</span>
      : <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ul>),
    ol: ({ children }) => (isInline
      ? <span style={text()}>{children}</span>
      : <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ol>),
    li: ({ children }) => (isInline
      ? <span style={{ ...text(), display: 'block', marginBottom: 4 }}>{children}</span>
      : <li style={{ marginBottom: 5, color: C.text }}>{children}</li>),
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: C.text }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: 'italic', color: C.textMuted }}>{children}</em>,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 600 }}>
        {children}
      </a>
    ),
    h1: ({ children }) => <h1 style={{ fontSize: isInline ? '1.05em' : 18, fontWeight: 800, margin: isInline ? '0 0 4px' : '12px 0 8px', color: C.text }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: isInline ? '1em' : 16, fontWeight: 800, margin: isInline ? '0 0 4px' : '12px 0 8px', color: C.text }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: isInline ? '1em' : 15, fontWeight: 700, margin: isInline ? '0 0 4px' : '10px 0 6px', color: C.text }}>{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: isInline ? '4px 0' : '0 0 10px',
        paddingLeft: 12,
        borderLeft: `3px solid ${C.borderHi}`,
        color: C.textMuted,
      }}
      >{children}</blockquote>
    ),
    code: ({ inline, className, children, ...props }) => {
      if (inline) {
        return (
          <code
            style={{
              background: C.surfaceHi,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: '0.92em',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: '#0369a1',
            }}
            {...props}
          >{children}</code>
        );
      }
      return (
        <code
          className={className}
          style={{
            display: 'block',
            fontSize: 13,
            padding: 10,
            borderRadius: 8,
            background: C.surfaceHi,
            border: `1px solid ${C.border}`,
            overflowX: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
          {...props}
        >{children}</code>
      );
    },
    pre: ({ children }) => <pre style={{ margin: '0 0 10px', overflow: 'auto' }}>{children}</pre>,
    hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '12px 0' }} />,
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', margin: '0 0 10px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th style={{ border: `1px solid ${C.border}`, padding: '6px 8px', textAlign: 'left', background: C.surfaceHi }}>{children}</th>
    ),
    td: ({ children }) => (
      <td style={{ border: `1px solid ${C.border}`, padding: '6px 8px' }}>{children}</td>
    ),
  };
}

function GovChatMarkdown({ content, variant = 'chat' }) {
  const text = normalizeEngineMarkdown(content);
  const components = useMemo(() => govMarkdownComponents(variant), [variant]);
  if (!text) return null;
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function LeftSidebar({ activeAudit, history, onNewAudit, onSelectAudit, onBack, user, onLogout, embedded, onCloseDrawer }) {
  const docs = activeAudit && activeAudit.id !== 'demo' ? [
    { name: extractSolicitationName(activeAudit), type: 'solicitation', icon: FileText },
    ...(activeAudit.attachments || []).map((a, i) => ({ name: a.name || `Attachment ${i + 1}`, type: 'attachment', icon: Paperclip })),
  ] : [];

  return (
    <aside style={{
      width: embedded ? '100%' : 'clamp(228px, 24vw, 288px)',
      height: embedded ? '100%' : undefined,
      flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: C.sbBg, borderRight: `1px solid ${C.sbBorder}`,
      overflow: 'hidden',
      transition: 'width 0.2s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.sbBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}
          onClick={onBack}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBack?.(); } }}
          role="button"
          tabIndex={0}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(16,163,127,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color={C.accent} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: C.sbText, letterSpacing: '0.04em', fontFamily: "'Playfair Display', serif" }}>
            BidSmith
          </span>
        </div>
        {onCloseDrawer && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onCloseDrawer}
            style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.sbBorder}`,
              background: C.sbSurface, color: C.sbTextDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.sbBorder; e.currentTarget.style.color = C.sbText; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.sbSurface; e.currentTarget.style.color = C.sbTextDim; }}
          >
            <X size={16} />
          </button>
        )}
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
function AgentThinkingPanel({ steps, isRunning, embedded, onCloseDrawer }) {
  return (
    <aside style={{
      width: embedded ? '100%' : 'clamp(248px, 24vw, 304px)',
      height: embedded ? '100%' : undefined,
      flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: C.surface, borderLeft: `1px solid ${C.border}`,
      overflow: 'hidden',
      transition: 'width 0.2s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={14} color={C.accent} />
        <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Agent Thinking
        </span>
        {isRunning && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'pulse 1.2s infinite', flexShrink: 0 }} />
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {onCloseDrawer && (
            <button
              type="button"
              aria-label="Close panel"
              onClick={onCloseDrawer}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.bg, color: C.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceHi; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.bg; }}
            >
              <X size={15} />
            </button>
          )}
        </div>
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
    HIGH:   { color: '#15803d', bg: 'rgba(34,197,94,0.12)',  label: 'High confidence in this call' },
    MEDIUM: { color: '#b45309', bg: 'rgba(245,158,11,0.12)', label: 'Average confidence — double-check' },
    LOW:    { color: '#b91c1c', bg: 'rgba(239,68,68,0.12)',  label: 'Low confidence — treat as draft' },
  };
  const s = map[level.toUpperCase()] || map.MEDIUM;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.02em', border: `1px solid ${s.color}40`, maxWidth: 260, lineHeight: 1.3 }}>
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
        <BookOpen size={9} /> Section {section}
        {excerpt && <ChevronDown size={9} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
      </button>
      {open && excerpt && (
        <div style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(59,130,246,0.06)', border: `1px solid rgba(59,130,246,0.15)`, borderRadius: 6, borderLeft: `2px solid ${C.accent}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, marginBottom: 4 }}>Quoted from the solicitation</div>
          <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{excerpt}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Needs-review badge (Audit Mode) ─────────────────────────────────────────
function NeedsReviewBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#92400e', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 8px', letterSpacing: '0.02em' }}>
      <AlertTriangle size={9} /> Check this
    </span>
  );
}

// ─── Plain-language contract risk (partner / GC audience) ────────────────────

function normalizePursuitRecommendation(rec) {
  const u = String(rec || '').toUpperCase().replace(/[\s-]+/g, '_');
  if (u === 'BID' || u === 'GO') return 'BID';
  if (u === 'NO_BID' || u === 'NOBID') return 'NO_BID';
  if (u.includes('INSUFFICIENT')) return 'INSUFFICIENT';
  return 'CONDITIONAL';
}

function pursuitPlainLanguage(recNorm) {
  if (recNorm === 'BID') return 'On balance, this opportunity looks worth pursuing — if your firm fits what the government is asking for.';
  if (recNorm === 'NO_BID') return 'We would not commit firm time to this one as written; the downside outweighs the upside.';
  if (recNorm === 'INSUFFICIENT') return 'We do not have enough of the solicitation text here to give a confident read. Add sections or a full PDF.';
  return 'You might still bid — but only after you close the gaps we flag below.';
}

function humanSeverityLabel(r) {
  const R = String(r?.risk || '').toUpperCase();
  if (r?.is_disqualifier) return 'Could disqualify you';
  if (R === 'HIGH' || R === 'DISQUALIFIER') return 'Serious';
  if (R === 'MED' || R === 'MEDIUM') return 'Needs attention';
  if (R === 'LOW') return 'Lower concern';
  return 'Unrated';
}

function buildRiskOutput(rawScore, counts) {
  const score = Math.round(Math.max(4, Math.min(100, rawScore)));
  const { dq, serious, watch, routine, reqsLen, recNorm } = counts;
  let band = 'moderate';
  let label = 'Moderate';
  if (score <= 30) { band = 'low'; label = 'Low'; }
  else if (score <= 54) { band = 'moderate'; label = 'Moderate'; }
  else if (score <= 78) { band = 'elevated'; label = 'Elevated'; }
  else { band = 'severe'; label = 'Severe'; }
  const barColor = band === 'low' ? C.green : band === 'moderate' ? '#ca8a04' : band === 'elevated' ? '#ea580c' : C.red;

  let explain = '';
  if (reqsLen === 0) {
    explain = 'We could not build a detailed checklist from this run, so this score leans on the headline recommendation. Treat it as preliminary and read the solicitation yourself.';
  } else if (dq > 0) {
    explain = `The score is driven mainly by ${dq} ${dq === 1 ? 'item that can disqualify' : 'items that can disqualify'} a proposal if it is not handled correctly — even strong technical work will not save a miss on those.`;
  } else if (serious > 0) {
    explain = `We did not see automatic disqualifiers in this slice, but ${serious} ${serious === 1 ? 'requirement reads as a heavy compliance lift' : 'requirements read as heavy compliance lifts'}. Budget extra time with your contracts and delivery leads.`;
  } else if (watch > 0) {
    explain = 'Mostly standard paperwork with a few spots that deserve a careful read before you sign up the team.';
  } else {
    explain = 'Compared with a typical federal solicitation, the flagged items here look manageable. You should still line Section L/M up against your own gaps.';
  }

  return {
    score, label, band, barColor, explain, recNorm, dq, serious, watch, routine, reqsLen,
  };
}

/** 0 = calmer, 100 = heavier exposure — heuristic from parsed requirements + headline verdict. */
function computeContractRiskScore(audit) {
  const reqs = Array.isArray(audit?.requirements) ? audit.requirements : [];
  const recNorm = normalizePursuitRecommendation(audit?.verdict?.recommendation);
  let dq = 0;
  let serious = 0;
  let watch = 0;
  let routine = 0;
  for (const r of reqs) {
    if (r.is_disqualifier) dq += 1;
    else if (String(r.risk || '').toUpperCase() === 'HIGH' || String(r.risk || '').toUpperCase() === 'DISQUALIFIER') serious += 1;
    else if (String(r.risk || '').toUpperCase() === 'MED' || String(r.risk || '').toUpperCase() === 'MEDIUM') watch += 1;
    else routine += 1;
  }

  if (reqs.length === 0) {
    const s0 = recNorm === 'NO_BID' ? 68 : recNorm === 'INSUFFICIENT' ? 54 : 42;
    return buildRiskOutput(s0, { dq: 0, serious: 0, watch: 0, routine: 0, reqsLen: 0, recNorm });
  }

  let score = 18;
  score += Math.min(dq * 22, 70);
  score += Math.min(serious * 6, 28);
  score += Math.min(watch * 2, 12);
  score -= Math.min(Math.floor(routine / 6) * 4, 10);
  if (recNorm === 'NO_BID') score = Math.max(score, 62);
  if (recNorm === 'BID') score -= 8;
  if (recNorm === 'INSUFFICIENT') score += 6;

  return buildRiskOutput(score, { dq, serious, watch, routine, reqsLen: reqs.length, recNorm });
}

function ContractRiskSummaryCard({ audit, auditMode }) {
  const s = useMemo(() => computeContractRiskScore(audit), [audit]);
  const chips = [
    { n: s.dq, txt: 'Could kill the bid', color: C.red },
    { n: s.serious, txt: 'Serious issues', color: '#c2410c' },
    { n: s.watch, txt: 'Worth a close read', color: '#ca8a04' },
    { n: s.routine, txt: 'Look routine', color: C.green },
  ];

  return (
    <div style={{
      maxWidth: 560,
      background: '#ffffff',
      border: `2px solid ${s.barColor}`,
      borderRadius: 14,
      padding: '22px 24px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>
        Contract risk score
      </div>
      <p style={{ fontSize: 14, color: C.textMuted, margin: '0 0 18px', lineHeight: 1.55 }}>
        A single 0–100 read on how demanding this solicitation looks from the clauses we scanned. Higher means more exposure for your firm — not legal advice, and not a substitute for reading the RFP.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 16, marginBottom: 14 }}>
        <span style={{ fontSize: 52, fontWeight: 900, color: s.barColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.score}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{s.label} overall risk</div>
          <div style={{ fontSize: 14, color: C.textDim, marginTop: 4 }}>100 is the heaviest burden we commonly surface.</div>
        </div>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: C.surfaceHi, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ width: `${s.score}%`, height: '100%', background: s.barColor, borderRadius: 999, transition: 'width 0.5s ease-out' }} />
      </div>
      <p style={{ margin: '0 0 18px', fontSize: 16, color: C.text, lineHeight: 1.55 }}>{s.explain}</p>
      {s.reqsLen > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 10 }}>
          {chips.map((c) => (
            <div
              key={c.txt}
              style={{
                textAlign: 'center',
                padding: '12px 8px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.surfaceHi,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.n}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginTop: 6, lineHeight: 1.35 }}>{c.txt}</div>
            </div>
          ))}
        </div>
      )}
      {auditMode && (
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.22)', fontSize: 14, color: '#92400e', lineHeight: 1.55 }}>
          <strong>Verification mode is on.</strong> Orange flags mean a human should confirm wording against the source PDF — especially anything touching eligibility or certifications.
        </div>
      )}
      <p style={{ fontSize: 12, color: C.textDim, margin: '16px 0 0', lineHeight: 1.5 }}>
        This score does not predict court outcomes. It reflects solicitation language we were able to analyze.
      </p>
    </div>
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
  const rawRec = audit?.verdict?.recommendation || 'REVIEW';
  const recNorm = normalizePursuitRecommendation(rawRec);
  const prob = audit?.verdict?.win_probability;
  const conf = audit?.verdict?.confidence;
  const color = verdictColor(rawRec);
  const isLowConf = conf === 'LOW' || conf === 'MEDIUM';
  const headline = pursuitPlainLanguage(recNorm);
  const recShort = recNorm === 'BID' ? 'Pursue' : recNorm === 'NO_BID' ? 'Do not pursue' : recNorm === 'INSUFFICIENT' ? 'Undecided — need more text' : 'Pursue only after fixes';

  return (
    <div style={{
      background: C.surfaceHi,
      border: `1px solid ${auditMode && isLowConf ? 'rgba(245,158,11,0.4)' : C.border}`,
      borderLeft: `4px solid ${auditMode && isLowConf ? '#f59e0b' : color}`,
      borderRadius: 12, padding: '20px 22px', maxWidth: 560,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Pursuit recommendation</span>
        <ConfidenceBadge level={conf} />
        {auditMode && isLowConf && <NeedsReviewBadge />}
      </div>
      <p style={{ fontSize: 17, color: C.text, lineHeight: 1.5, margin: '0 0 12px', fontWeight: 600 }}>{headline}</p>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginBottom: 14 }}>{recShort}</div>
      {prob != null && Number.isFinite(Number(prob)) && (
        <div style={{ marginBottom: 14, padding: '14px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Rough chance of winning — if you bid and your résumé matches what evaluators asked for</div>
          <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{Math.round(Number(prob))}%</div>
        </div>
      )}
      {audit?.verdict?.summary && (
        <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.65, margin: 0 }}>{audit.verdict.summary}</p>
      )}
      {auditMode && isLowConf && (
        <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.22)', fontSize: 14, color: '#92400e', lineHeight: 1.55 }}>
          The model is {(conf || 'medium').toLowerCase()} confidence here. Have a senior person read Section M (evaluation) against this write-up before you green-light capture time.
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
  const lineFor = (r) => {
    if (typeof r === 'string') return r;
    return r.description || r.requirement || r.risk || '';
  };
  return (
    <div style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', maxWidth: 560 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>What could go wrong</div>
      <p style={{ fontSize: 14, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>Plain-English watch-outs. Read these alongside the solicitation — especially anything touching money, security, or past performance.</p>
      {items.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <AlertTriangle size={16} color={C.red} style={{ marginTop: 3, flexShrink: 0 }} />
          <span style={{ fontSize: 15, color: C.text, lineHeight: 1.55 }}>{lineFor(r)}</span>
        </div>
      ))}
    </div>
  );
}

function ComplianceCard({ audit, auditMode, onExportXlsx, exportXlsxLoading }) {
  const allReqs = audit?.requirements || [];
  const reqs = allReqs.slice(0, 5);

  const needsReview = (r) => auditMode && (r.risk === 'HIGH' || r.is_disqualifier || !r.source_excerpt);

  return (
    <div style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', maxWidth: 560 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Requirements snapshot</span>
        {auditMode && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 8px' }}>
            Verification mode
          </span>
        )}
      </div>
      <p style={{ fontSize: 14, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
        {allReqs.length === 0
          ? 'When the engine parses Section L/M style requirements, they appear here with severity and suggested next steps.'
          : 'First five rows from the compliance matrix. Severity is our read of how painful each item is — not a legal conclusion.'}
      </p>
      {allReqs.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reqs.map((r, i) => {
          const flagged = needsReview(r);
          const sev = humanSeverityLabel(r);
          const sevColor = r.is_disqualifier || String(r.risk).toUpperCase() === 'HIGH' ? C.red : String(r.risk).toUpperCase() === 'MED' || String(r.risk).toUpperCase() === 'MEDIUM' ? '#ca8a04' : C.green;
          return (
            <div key={r.id || i} style={{
              padding: '12px 14px', borderRadius: 10,
              background: flagged ? 'rgba(245,158,11,0.06)' : '#fff',
              border: `1px solid ${flagged ? 'rgba(245,158,11,0.35)' : C.border}`,
              borderLeft: `4px solid ${flagged ? '#f59e0b' : (r.risk === 'HIGH' || r.is_disqualifier) ? C.red : C.green}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {r.is_disqualifier
                    ? <AlertTriangle size={14} color={flagged ? '#f59e0b' : C.red} />
                    : r.risk === 'HIGH'
                      ? <AlertTriangle size={14} color={flagged ? '#f59e0b' : C.red} />
                      : <Check size={14} color={C.green} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: sevColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sev}</span>
                    {flagged && <NeedsReviewBadge />}
                  </div>
                  <div style={{ fontSize: 15, color: C.text, lineHeight: 1.5, marginBottom: 6 }}>{r.requirement}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <SourceTag section={r.section} excerpt={r.source_excerpt} auditMode={auditMode} />
                  </div>
                  {r.action_required && (
                    <div style={{ fontSize: 14, color: C.textMuted, marginTop: 8, lineHeight: 1.5 }}>
                      <strong style={{ color: C.text }}>Suggested next step:</strong> {r.action_required}
                    </div>
                  )}
                  {flagged && !r.source_excerpt && (
                    <div style={{ fontSize: 13, color: '#b45309', marginTop: 8, lineHeight: 1.45 }}>
                      We did not capture a verbatim quote for this line. Confirm it in the source PDF before you rely on it.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
      {allReqs.length > 5 && (
        <div style={{ fontSize: 13, color: C.textDim, marginTop: 12, textAlign: 'center' }}>
          +{allReqs.length - 5} more rows in the full matrix (with subscription)
        </div>
      )}
      {onExportXlsx && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <button
            type="button"
            onClick={() => onExportXlsx(audit)}
            disabled={exportXlsxLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: '#fff',
              color: C.text,
              fontSize: 13,
              fontWeight: 700,
              cursor: exportXlsxLoading ? 'wait' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {exportXlsxLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
            Export Compliance Matrix (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, auditMode, isStreaming, isSubscribed, userId, onExportComplianceXlsx, exportXlsxLoading }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 20, alignItems: 'flex-start' }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(16,163,127,0.08)', border: `1.5px solid rgba(16,163,127,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Shield size={13} color={C.accent} />
        </div>
      )}
      <div style={{ maxWidth: 'min(75%, 720px)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msg.type === 'free_limit' ? (
          <FreeLimitCard userId={userId} />
        ) : msg.type === 'audit_result' ? (
          <>
            <ContractRiskSummaryCard audit={msg.audit} auditMode={auditMode} />
            <VerdictCard audit={msg.audit} auditMode={auditMode} />
            <AccessBadge isSubscribed={isSubscribed} userId={userId} />
            {isSubscribed ? (
              <>
                <RiskCard audit={msg.audit} auditMode={auditMode} />
                <ComplianceCard
                  audit={msg.audit}
                  auditMode={auditMode}
                  onExportXlsx={onExportComplianceXlsx}
                  exportXlsxLoading={exportXlsxLoading}
                />
              </>
            ) : (
              <>
                <PaywallGate userId={userId} label="Issue list (full detail)">
                  <RiskCard audit={msg.audit} auditMode={auditMode} />
                </PaywallGate>
                <PaywallGate userId={userId} label="Requirements list (full detail)">
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
                        <li key={s.id} style={{ marginBottom: 4 }}>
                          <span style={{ marginRight: 4 }}>{s.status === 'done' ? '✓' : '○'}</span>
                          <GovChatMarkdown variant="inline" content={s.title || ''} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {msg.plan.next_action ? (
                  <div style={{ margin: msg.plan.steps?.length ? '8px 0 0' : 0, fontSize: 13, color: C.accent, fontWeight: 600, lineHeight: 1.5 }}>
                    Next: <GovChatMarkdown variant="inline" content={msg.plan.next_action} />
                  </div>
                ) : null}
              </div>
            )}
            {msg.role === 'assistant'
              ? <GovChatMarkdown content={msg.content} />
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

// ─── Human walkthrough CTA (Calendly) — one path, post-audit only ────────────
function HumanWalkthroughCTA({ visible, solicitationId }) {
  if (!visible) return null;
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '16px 20px 18px',
        background: `linear-gradient(180deg, ${C.surfaceHi} 0%, ${C.bg} 45%)`,
        borderTop: `1px solid ${C.border}`,
        boxShadow: '0 -6px 20px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(16,163,127,0.1)', border: `1px solid rgba(16,163,127,0.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          >
            <Calendar size={18} color={C.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>
              Want a human walkthrough?
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: C.textMuted, lineHeight: 1.55 }}>
              {"We'll review your audit results together and tell you exactly where you're exposed — free, 20 minutes."}
            </p>
            <a
              href={AUDIT_WALKTHROUGH_CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('audit_walkthrough_calendly_click', {
                category: 'conversion',
                solicitation: solicitationId || null,
              })}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 20px', borderRadius: 10,
                background: C.navy, color: '#fff', fontSize: 14, fontWeight: 800,
                textDecoration: 'none', border: `1px solid ${C.navy}`,
                boxShadow: '0 2px 8px rgba(0,34,68,0.2)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,34,68,0.28)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,34,68,0.2)';
              }}
            >
              Book a call
              <ChevronRight size={16} style={{ opacity: 0.9 }} />
            </a>
          </div>
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
  const winW = useWindowWidth();
  const dockLeft = winW >= 800;
  const dockRight = winW >= 1040;
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

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
  const [exportXlsxLoading, setExportXlsxLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const thinkingTimers = useRef([]);

  useEffect(() => {
    document.body.style.background = C.bg;
    return () => { document.body.style.background = ''; };
  }, []);

  useEffect(() => {
    if (dockLeft) setLeftDrawerOpen(false);
    if (dockRight) setRightDrawerOpen(false);
  }, [dockLeft, dockRight]);

  useEffect(() => {
    if (!leftDrawerOpen && !rightDrawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setLeftDrawerOpen(false);
        setRightDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leftDrawerOpen, rightDrawerOpen]);

  // Load history on mount
  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

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

  const handleExportComplianceMatrixXlsx = async (audit) => {
    const rows = Array.isArray(audit?.requirements) ? audit.requirements : [];
    if (rows.length === 0) {
      setToast({ msg: 'Not enough data to export — run a full audit first', type: 'warning' });
      return;
    }
    if (exportXlsxLoading) return;
    trackEvent('compliance_matrix_xlsx_download', {
      format: 'xlsx',
      solicitation: audit?.solicitation_number || audit?.id || null,
      category: 'export',
    });
    setExportXlsxLoading(true);
    try {
      await downloadComplianceMatrixXlsx(audit);
    } catch (e) {
      if (e?.code !== 'NO_COMPLIANCE_ROWS') {
        setToast({ msg: 'Export failed. Please try again.', type: 'error' });
      }
    } finally {
      setExportXlsxLoading(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            maxWidth: 'min(420px, calc(100vw - 32px))',
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.45,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${toast.type === 'error' ? '#fecaca' : toast.type === 'warning' ? '#fde68a' : C.border}`,
            background: toast.type === 'error' ? '#fef2f2' : toast.type === 'warning' ? '#fffbeb' : '#f8fafc',
            color: toast.type === 'error' ? '#991b1b' : toast.type === 'warning' ? '#92400e' : C.text,
          }}
        >
          {toast.msg}
        </div>
      )}
      <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf" onChange={handleFileChange} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {dockLeft ? (
          <LeftSidebar
            activeAudit={activeAudit}
            history={history}
            onNewAudit={() => { setMessages([]); setActiveAudit(null); setThinkingSteps([]); }}
            onSelectAudit={loadAudit}
            onBack={onBack}
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <>
            {leftDrawerOpen && (
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setLeftDrawerOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 90,
                  background: 'rgba(15, 15, 18, 0.48)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  border: 'none', padding: 0, cursor: 'pointer',
                }}
              />
            )}
            <div
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
                width: 'min(300px, calc(100vw - 20px))',
                transform: leftDrawerOpen ? 'translateX(0)' : 'translateX(-105%)',
                transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: leftDrawerOpen ? '12px 0 40px rgba(0,0,0,0.18)' : 'none',
                pointerEvents: leftDrawerOpen ? 'auto' : 'none',
              }}
            >
              <LeftSidebar
                activeAudit={activeAudit}
                history={history}
                onNewAudit={() => { setMessages([]); setActiveAudit(null); setThinkingSteps([]); setLeftDrawerOpen(false); }}
                onSelectAudit={(id) => { loadAudit(id); setLeftDrawerOpen(false); }}
                onBack={() => { onBack?.(); setLeftDrawerOpen(false); }}
                user={user}
                onLogout={handleLogout}
                embedded
                onCloseDrawer={() => setLeftDrawerOpen(false)}
              />
            </div>
          </>
        )}

        {/* Center — Chat */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg }}>
          <div style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: dockLeft ? '0 20px' : '0 12px 0 14px', gap: 10, flexShrink: 0 }}>
            {!dockLeft && (
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setLeftDrawerOpen(true)}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceHi,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMuted, flexShrink: 0,
                }}
              >
                <Menu size={18} />
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            {activeAudit ? (
              <>
                <FileText size={14} color={C.textDim} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
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
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {!dockRight && (
                <button
                  type="button"
                  title="Agent thinking"
                  aria-label="Open agent thinking"
                  onClick={() => setRightDrawerOpen(true)}
                  style={{
                    width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceHi,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.accent,
                  }}
                >
                  <Brain size={18} />
                </button>
              )}
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
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: dockLeft && dockRight ? '24px 28px' : '16px 14px' }}>
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
                  onExportComplianceXlsx={handleExportComplianceMatrixXlsx}
                  exportXlsxLoading={exportXlsxLoading}
                />
              ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <HumanWalkthroughCTA
            visible={!!(activeAudit && !isAuditing && activeAudit.verdict)}
            solicitationId={activeAudit?.solicitation_number || activeAudit?.id || null}
          />

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

        {dockRight ? (
          <AgentThinkingPanel steps={thinkingSteps} isRunning={isAuditing} />
        ) : (
          <>
            {rightDrawerOpen && (
              <button
                type="button"
                aria-label="Close agent panel"
                onClick={() => setRightDrawerOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 90,
                  background: 'rgba(15, 15, 18, 0.48)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  border: 'none', padding: 0, cursor: 'pointer',
                }}
              />
            )}
            <div
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100,
                width: 'min(320px, calc(100vw - 20px))',
                transform: rightDrawerOpen ? 'translateX(0)' : 'translateX(105%)',
                transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: rightDrawerOpen ? '-12px 0 40px rgba(0,0,0,0.14)' : 'none',
                pointerEvents: rightDrawerOpen ? 'auto' : 'none',
              }}
            >
              <AgentThinkingPanel
                steps={thinkingSteps}
                isRunning={isAuditing}
                embedded
                onCloseDrawer={() => setRightDrawerOpen(false)}
              />
            </div>
          </>
        )}
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
