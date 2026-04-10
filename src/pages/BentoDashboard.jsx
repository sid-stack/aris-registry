/**
 * BentoDashboard — Apple-clean Bento-grid intelligence dashboard.
 *
 * Layout (fluid, 12-col Bento):
 *   Row 1: [RFP Upload — 5col] [Live Analysis — 7col]
 *   Row 2: [Audit Stats — 4col] [Compliance Snapshot — 4col] [Eval Status — 4col]
 *
 * Stateless Bridge: all data flows from API → state → cards. No local DB.
 * API endpoints used:
 *   POST /api/audit/pdf   → file upload
 *   POST /api/audit/link  → SAM.gov URL
 *   GET  /api/health      → system status
 *   GET  /api/evals/status → eval runner results
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Zap, Activity, FileSearch, ArrowUpRight, Send, RotateCcw,
         MessageSquare, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import RfpUploadZone   from '../components/bento/RfpUploadZone';
import LiveAnalysisCard from '../components/bento/LiveAnalysisCard';
import EvalStatusCard  from '../components/bento/EvalStatusCard';
import BidOutputCard   from '../components/bento/BidOutputCard';

// ── Error code → intelligent AI opening message ───────────────────────────────
const CHAT_CONTEXTS = {
  EXTERNAL_DOCUMENTS: (err) => ({
    aiMessage: `This solicitation's documents aren't on SAM.gov — they're hosted at an external portal.\n\nYou can download the PDF from there and drop it here, or describe the contract type and I'll find similar open solicitations with attached PDFs.`,
    externalLinks: err.externalLinks || [],
    placeholder: 'Describe the contract type, NAICS code, or agency…',
    apiContext: `User tried to audit a SAM.gov contract where documents are externally hosted at: ${(err.externalLinks || []).join(', ')}`,
    badge: 'External Docs',
    badgeColor: '#f59e0b',
  }),
  RESUME_DETECTED: (err) => ({
    aiMessage: `This looks like a resume, not a government solicitation.\n\nAre you trying to match your capabilities to a specific RFP? Paste a SAM.gov URL below and I'll evaluate your fit against the actual requirements.`,
    externalLinks: [],
    placeholder: 'Paste a SAM.gov opportunity URL…',
    apiContext: 'User uploaded what appears to be a resume or capability statement instead of an RFP solicitation',
    badge: 'Not an RFP',
    badgeColor: '#ef4444',
  }),
  SET_ASIDE_MISMATCH: (err) => ({
    aiMessage: `You may not qualify for this set-aside category. I can search for unrestricted opportunities in the same NAICS code instead.\n\nShare your certifications (8(a), WOSB, HUBZone, etc.) and I'll narrow down the opportunities you can actually win.`,
    externalLinks: [],
    placeholder: 'Share your certifications and NAICS focus…',
    apiContext: 'User uploaded an RFP with a set-aside restriction they likely do not qualify for',
    badge: 'Set-Aside Mismatch',
    badgeColor: '#a78bfa',
  }),
  INSUFFICIENT_DATA: (err) => ({
    aiMessage: `The document does not have enough structured data for a full audit — it may not be a standard solicitation format.\n\nTell me what you are evaluating and I will help you work through it manually.`,
    externalLinks: [],
    placeholder: 'Describe the opportunity you are evaluating...',
    apiContext: 'User uploaded a document with insufficient solicitation data for automated audit',
    badge: 'Low Data',
    badgeColor: '#f59e0b',
  }),
  _DEFAULT: (err) => ({
    aiMessage: `Something went wrong fetching that solicitation. ${err.hint || ''}\n\nTell me what you're trying to evaluate and I'll help you work through it.`,
    externalLinks: [],
    placeholder: 'Describe the contract or paste a different URL…',
    apiContext: `Audit failed: ${err.message}`,
    badge: 'Inquiry',
    badgeColor: '#3b82f6',
  }),
};

function classifyError(err) {
  if (!err || typeof err !== 'object') return '_DEFAULT';
  const code = String(err.code || '');
  const msg  = String(err.message || '').toLowerCase();
  if (code === 'EXTERNAL_DOCUMENTS') return 'EXTERNAL_DOCUMENTS';
  if (code === 'INSUFFICIENT_DATA' || msg.includes('insufficient') || msg.includes('not a solicitation')) return 'INSUFFICIENT_DATA';
  if (msg.includes('resume') || msg.includes('curriculum vitae') || msg.includes('cv ')) return 'RESUME_DETECTED';
  if (msg.includes('set-aside') || msg.includes('8(a)') || msg.includes('hubzone') || msg.includes('wosb')) return 'SET_ASIDE_MISMATCH';
  return '_DEFAULT';
}

// ── MiniChatShell — renders inside the uploadCol when an error triggers ───────
function MiniChatShell({ context, onReset, onAuditResult, onAuditStart }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: context.aiMessage, id: 0 },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [input]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const isUrl = text.startsWith('http') || text.includes('sam.gov');
    setMessages(m => [...m, { role: 'user', text, id: Date.now() }]);
    setLoading(true);

    // If it looks like a SAM.gov URL, try to audit it
    if (isUrl) {
      onAuditStart?.();
      try {
        const res = await fetch('/api/audit/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: text }),
        });
        const data = await res.json();
        if (res.ok && !data.error) {
          onAuditResult?.(data);
          setMessages(m => [...m, {
            role: 'ai',
            text: `Audit complete. Verdict: **${data.verdict?.recommendation || 'CONDITIONAL'}** (${data.verdict?.win_probability ?? '?'}% win probability).\n\n${data.verdict?.summary || ''}`,
            id: Date.now(),
          }]);
        } else {
          const nextClass = classifyError(data);
          const nextCtx = (CHAT_CONTEXTS[nextClass] || CHAT_CONTEXTS._DEFAULT)(data);
          setMessages(m => [...m, { role: 'ai', text: nextCtx.aiMessage, id: Date.now() }]);
        }
      } catch {
        setMessages(m => [...m, { role: 'ai', text: 'Connection error. Check your network and try again.', id: Date.now() }]);
      }
    } else {
      // Regular chat — send to /api/chat with context
      try {
        const history = messages
          .filter(m => m.role === 'user' || m.role === 'ai')
          .slice(-8)
          .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...history, { role: 'user', content: text }],
            context: context.apiContext,
          }),
        });
        const data = await res.json();
        setMessages(m => [...m, {
          role: 'ai',
          text: data.text || data.response || 'No response received.',
          id: Date.now(),
        }]);
      } catch {
        setMessages(m => [...m, { role: 'ai', text: 'Connection error.', id: Date.now() }]);
      }
    }

    setLoading(false);
  }, [input, loading, messages, context, onAuditResult, onAuditStart]);

  return (
    <div style={cs.shell}>
      {/* Header */}
      <div style={cs.header}>
        <div style={cs.headerLeft}>
          <span style={{ ...cs.badge, color: context.badgeColor, borderColor: context.badgeColor + '44', background: context.badgeColor + '14' }}>
            {context.badge}
          </span>
          <span style={cs.headerTitle}>AI Assistant</span>
        </div>
        <button onClick={onReset} style={cs.resetBtn} title="Back to upload">
          <RotateCcw size={12} style={{ marginRight: 5 }} /> Upload new file
        </button>
      </div>

      {/* Message thread */}
      <div style={cs.thread}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={cs.aiAvatar}>
                <Shield size={10} color="#3b82f6" />
              </div>
            )}
            <div style={{
              ...cs.bubble,
              background: msg.role === 'user' ? '#1d4ed8' : '#161616',
              borderColor: msg.role === 'user' ? 'transparent' : '#2a2a2a',
              maxWidth: msg.role === 'user' ? '80%' : '95%',
              borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
            }}>
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
              ))}
              {/* External links inside the AI message */}
              {msg.role === 'ai' && messages.indexOf(msg) === 0 && context.externalLinks?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {context.externalLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={cs.extLink}>
                      <ExternalLink size={10} /> {link.replace(/^https?:\/\//, '')}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={cs.aiAvatar}><Shield size={10} color="#3b82f6" /></div>
            <div style={{ ...cs.bubble, background: '#161616', borderColor: '#2a2a2a' }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#4b5563', animation: `bounce 1.2s ${i*0.2}s infinite`, display: 'inline-block' }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={cs.inputWrap}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={context.placeholder}
          rows={1}
          style={cs.textarea}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{ ...cs.sendBtn, opacity: !input.trim() || loading ? 0.4 : 1 }}
        >
          {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}

// MiniChatShell styles
const cs = {
  shell: {
    background: '#111111',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px 12px',
    borderBottom: '1px solid #1a1a1a',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 12, fontWeight: 600, color: '#6b7280' },
  badge: {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
    padding: '2px 7px', borderRadius: 4,
    border: '1px solid', textTransform: 'uppercase',
  },
  resetBtn: {
    display: 'flex', alignItems: 'center',
    fontSize: 10, fontWeight: 600, color: '#4b5563',
    background: 'transparent', border: '1px solid #1f1f1f',
    borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  thread: {
    flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
    display: 'flex', flexDirection: 'column', gap: 10,
    scrollbarWidth: 'none',
  },
  aiAvatar: {
    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  bubble: {
    fontSize: 12, lineHeight: 1.65, color: '#d1d5db',
    padding: '9px 12px', border: '1px solid',
    wordBreak: 'break-word',
  },
  extLink: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 10, color: '#f59e0b',
    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 5, padding: '3px 7px', textDecoration: 'none',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  inputWrap: {
    display: 'flex', gap: 8, alignItems: 'flex-end',
    padding: '10px 12px 12px',
    borderTop: '1px solid #1a1a1a', flexShrink: 0,
  },
  textarea: {
    flex: 1, background: '#0d0d0d', border: '1px solid #1f1f1f',
    borderRadius: 9, padding: '8px 12px',
    color: '#f9fafb', fontSize: 12, fontFamily: 'inherit',
    outline: 'none', resize: 'none', lineHeight: 1.5,
    maxHeight: 100, overflowY: 'auto',
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: '#1d4ed8', border: 'none',
    color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.15s',
  },
};

// ── Stat card (Row 2, col 1-2) ────────────────────────────────────────────
function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub, trend }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, background: iconBg }}>
        <Icon size={14} color={iconColor} />
      </div>
      <div style={s.statBody}>
        <p style={s.statValue}>{value}</p>
        <p style={s.statLabel}>{label}</p>
        {sub && <p style={s.statSub}>{sub}</p>}
      </div>
      {trend !== undefined && (
        <span style={{ ...s.trend, color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  );
}

// ── Analysis progress steps (latency transparency) ────────────────────────
const ANALYSIS_STEPS = [
  { id: 'fetch',    label: 'Fetching solicitation',        detail: 'SAM.gov API + PDF extraction'    },
  { id: 'parse',    label: 'Parsing clause structure',     detail: 'Section L / M / C identification' },
  { id: 'audit',    label: 'Running compliance audit',     detail: '3-agent pipeline — logic gate v2.2' },
  { id: 'verdict',  label: 'Generating bid/no-bid verdict',detail: 'Win probability + risk scoring'   },
];

function AnalysisProgress({ activeStep }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 0 4px' }}>
      {ANALYSIS_STEPS.map((step, i) => {
        const done    = i < activeStep;
        const active  = i === activeStep;
        const pending = i > activeStep;
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {/* Status indicator */}
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done   ? 'rgba(34,197,94,0.15)'  :
                          active ? 'rgba(59,130,246,0.15)' :
                                   'rgba(255,255,255,0.04)',
              border: `1.5px solid ${done   ? '#22c55e50'  :
                                     active ? '#3b82f650' :
                                              '#1f1f1f'}`,
            }}>
              {done ? (
                <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 800 }}>✓</span>
              ) : active ? (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite', display: 'block' }} />
              ) : (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2a2a2a', display: 'block' }} />
              )}
            </div>
            {/* Label */}
            <div style={{ minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: active ? 600 : 500,
                color: done ? '#6b7280' : active ? '#f9fafb' : '#374151',
                letterSpacing: '-0.01em',
              }}>{step.label}</p>
              {active && (
                <p style={{ margin: '2px 0 0', fontSize: 10, color: '#4b5563', letterSpacing: '-0.01em' }}>
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function BentoDashboard() {
  const [auditResult, setAuditResult] = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [toast, setToast]             = useState(null);
  const [health, setHealth]           = useState(null);

  // Chat overlay state
  const [chatMode, setChatMode]       = useState(false);   // is overlay active?
  const [chatContext, setChatContext]  = useState(null);    // CHAT_CONTEXTS output
  const [colVisible, setColVisible]   = useState(true);    // drive opacity/transform

  // Health probe
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? r.json() : null)
      .then(d => setHealth(d))
      .catch(() => setHealth(null));
  }, []);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Step ticker: advances every ~8s to simulate 4-stage pipeline
  const stepTimerRef = useRef(null);

  const handleStart = () => {
    setAnalyzing(true);
    setAuditResult(null);
    setAnalysisStep(0);
    // Advance through steps: 0→1 at 5s, 1→2 at 14s, 2→3 at 22s
    const delays = [5_000, 14_000, 22_000];
    delays.forEach((delay, i) => {
      const t = setTimeout(() => setAnalysisStep(i + 1), delay);
      if (!stepTimerRef.current) stepTimerRef.current = [];
      stepTimerRef.current.push(t);
    });
  };

  const handleResult = data => {
    // Clear step timers
    (stepTimerRef.current || []).forEach(clearTimeout);
    stepTimerRef.current = [];
    setAnalysisStep(ANALYSIS_STEPS.length); // all done
    setAuditResult(data);
    setAnalyzing(false);
    // If we were in chat mode after an error and got a successful audit, exit chat mode
    if (chatMode) resetChatMode();
    // Show cache hit indicator in toast
    const cacheMsg = data?.meta?.cache_hit
      ? 'Audit loaded from cache (0s latency)'
      : 'Audit complete';
    showToast(cacheMsg, 'success');
  };

  // ── Error → Chat bridge ──────────────────────────────────────────────────────
  const handleError = (errObj) => {
    (stepTimerRef.current || []).forEach(clearTimeout);
    stepTimerRef.current = [];
    setAnalyzing(false);

    // Ignore pure validation errors (no file selected etc.)
    if (errObj?.code === 'VALIDATION') {
      showToast(errObj.message, 'error');
      return;
    }

    // Classify → get intelligent prompt context
    const errorClass = classifyError(errObj);
    const ctxFn = CHAT_CONTEXTS[errorClass] || CHAT_CONTEXTS._DEFAULT;
    const ctx = ctxFn(errObj);

    // Animate out the upload zone, then swap to chat
    setColVisible(false);
    setTimeout(() => {
      setChatContext(ctx);
      setChatMode(true);
      setColVisible(true);
    }, 220);
  };

  const resetChatMode = () => {
    setColVisible(false);
    setTimeout(() => {
      setChatMode(false);
      setChatContext(null);
      setColVisible(true);
    }, 220);
  };

  // Derived stats
  const winProb   = auditResult?.verdict?.win_probability;
  const riskCount = Array.isArray(auditResult?.intelligence?.top_risks)
    ? auditResult.intelligence.top_risks.length : null;

  return (
    <div style={s.page}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header style={s.topBar}>
        <div style={s.topBarLeft}>
          <div style={s.logoMark}>
            <Shield size={14} color="#3b82f6" />
          </div>
          <span style={s.logoText}>BidSmith</span>
          <span style={s.logoSep}>/</span>
          <span style={s.logoSub}>Intelligence Dashboard</span>
        </div>

        <div style={s.topBarRight}>
          {health && (
            <div style={s.healthPill}>
              <span style={s.healthDot} />
              <span style={s.healthLabel}>API Online</span>
            </div>
          )}
          <a href="/app" style={s.openApp}>
            Open App <ArrowUpRight size={11} style={{ marginLeft: 3 }} />
          </a>
        </div>
      </header>

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <div style={s.titleBlock}>
        <h1 style={s.pageTitle}>RFP Intelligence</h1>
        <p style={s.pageSubtitle}>
          Upload an RFP or paste a SAM.gov link. AI analysis streams back in real-time.
        </p>
      </div>

      {/* ── Bento Row 1 ─────────────────────────────────────────────────── */}
      <div style={s.row1}>

        {/* Upload col — morphs into MiniChatShell on error */}
        <div style={{
          ...s.uploadCol,
          opacity: colVisible ? 1 : 0,
          transform: colVisible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.99)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}>
          {chatMode && chatContext ? (
            <MiniChatShell
              context={chatContext}
              onReset={resetChatMode}
              onAuditResult={handleResult}
              onAuditStart={handleStart}
            />
          ) : (
            <RfpUploadZone onStart={handleStart} onResult={handleResult} onError={handleError} />
          )}
        </div>

        {/* Analysis col — stays put, shows "Inquiry" badge when in chat mode */}
        <div style={s.analysisCol}>
          <LiveAnalysisCard
            auditResult={auditResult}
            loading={analyzing}
            inquiryMode={chatMode && !auditResult}
            analysisProgress={analyzing ? <AnalysisProgress activeStep={analysisStep} /> : null}
          />
        </div>
      </div>

      {/* ── Bento Row 2 ─────────────────────────────────────────────────── */}
      <div style={s.row2}>
        <StatCard
          icon={Zap}
          iconColor="#f59e0b"
          iconBg="rgba(245,158,11,0.1)"
          label="Win Probability"
          value={winProb != null ? `${winProb}%` : '–'}
          sub={auditResult ? auditResult.agency || 'Federal Agency' : 'No audit loaded'}
          trend={null}
        />
        <StatCard
          icon={Activity}
          iconColor="#a78bfa"
          iconBg="rgba(167,139,250,0.1)"
          label="Risk Signals"
          value={riskCount != null ? riskCount : '–'}
          sub={riskCount != null ? 'disqualifiers flagged' : 'No audit loaded'}
          trend={null}
        />
        <StatCard
          icon={FileSearch}
          iconColor="#3b82f6"
          iconBg="rgba(59,130,246,0.1)"
          label="Compliance Coverage"
          value={(() => {
            const reqs = Array.isArray(auditResult?.requirements) ? auditResult.requirements : [];
            if (!reqs.length) return '–';
            const met = reqs.filter(r => r.status === 'compliant' || r.met).length;
            return `${Math.round((met / reqs.length) * 100)}%`;
          })()}
          sub={auditResult ? `${(Array.isArray(auditResult?.requirements) ? auditResult.requirements : []).filter(r => r.status === 'compliant' || r.met).length} reqs met` : 'No audit loaded'}
        />
        <EvalStatusCard />
      </div>

      {/* ── Bento Row 3 — Bid Output ────────────────────────────────────── */}
      <div style={s.row3}>
        <BidOutputCard auditResult={auditResult} loading={analyzing} />
      </div>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.type === 'error' ? '#1a0a0a' : toast.type === 'success' ? '#0a1a0f' : '#0f0f0f',
          borderColor: toast.type === 'error' ? '#ef444440' : toast.type === 'success' ? '#22c55e40' : '#1f1f1f',
        }}>
          <span style={{
            ...s.toastDot,
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#22c55e' : '#6b7280',
          }} />
          <span style={s.toastMsg}>{toast.msg}</span>
        </div>
      )}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg);   } to { transform: rotate(360deg); } }
        @keyframes bounce  { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        * { box-sizing: border-box; }
        ::placeholder { color: #374151; }
        textarea:focus, input:focus { border-color: #2f2f2f !important; outline: none; }
        a { transition: opacity 0.15s; }
        a:hover { opacity: 0.75; }
        .mini-thread::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: '#080808',
    fontFamily: '"Inter", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#f9fafb',
    padding: '0 0 60px',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },

  // ── Top bar ──
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 28px',
    borderBottom: '1px solid #111111',
    position: 'sticky',
    top: 0,
    background: 'rgba(8,8,8,0.9)',
    backdropFilter: 'blur(12px)',
    zIndex: 50,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(59,130,246,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: 700,
    color: '#f9fafb',
    letterSpacing: '-0.02em',
  },
  logoSep: {
    color: '#1f2937',
    fontSize: 14,
  },
  logoSub: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: 400,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  healthPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#0d0d0d',
    border: '1px solid #1a1a1a',
    borderRadius: 20,
    padding: '4px 10px',
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 6px #22c55e',
  },
  healthLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  openApp: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: '#9ca3af',
    textDecoration: 'none',
    background: '#0d0d0d',
    border: '1px solid #1a1a1a',
    borderRadius: 8,
    padding: '5px 12px',
  },

  // ── Title block ──
  titleBlock: {
    padding: '36px 28px 24px',
  },
  pageTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  pageSubtitle: {
    margin: '6px 0 0',
    fontSize: 14,
    color: '#4b5563',
    fontWeight: 400,
  },

  // ── Remove unused ComplianceSnapshot reference ──

  // ── Bento rows ──
  row1: {
    display: 'grid',
    gridTemplateColumns: '5fr 7fr',
    gap: 14,
    padding: '0 28px',
  },
  uploadCol: {
    minHeight: 300,
  },
  analysisCol: {
    minHeight: 300,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 14,
    padding: '14px 28px 0',
  },
  row3: {
    padding: '14px 28px 0',
  },

  // ── Stat card ──
  statCard: {
    background: '#111111',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    padding: '18px 18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 160,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statValue: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    margin: 0,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500,
  },
  statSub: {
    margin: '2px 0 0',
    fontSize: 11,
    color: '#374151',
  },
  trend: {
    fontSize: 11,
    fontWeight: 600,
    alignSelf: 'flex-end',
    fontVariantNumeric: 'tabular-nums',
  },
  // ── Toast ──
  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
    minWidth: 200,
  },
  toastDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  toastMsg: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: 500,
  },
};
