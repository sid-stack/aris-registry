/**
 * ArisChat — GPT-style. Light main + dark resizable/collapsible sidebar.
 * Fully responsive: mobile sidebar becomes a slide-in overlay drawer.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Shield, Send, Plus, Paperclip, Link2,
  Loader2, AlertTriangle, CheckCircle2,
  FileText, Zap, BookOpen, ChevronRight,
  Copy, Check, PanelLeftClose, PanelLeftOpen,
  MoreHorizontal, X,
} from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const S = {
  bg:      '#171717',
  bgHover: '#212121',
  border:  '#2a2a2a',
  text:    '#ececec',
  textDim: '#8e8ea0',
  accent:  '#10a37f',
};
const M = {
  bg:          '#ffffff',
  text:        '#0d0d0d',
  textSub:     '#374151',
  textDim:     '#9ca3af',
  border:      '#e5e7eb',
  userBubble:  '#f4f4f4',
  surface:     '#f9f9f9',
  accent:      '#10a37f',
  green:       '#16a34a',
  red:         '#dc2626',
  amber:       '#d97706',
};

const SBW_DEFAULT = 260;
const SBW_MIN     = 200;
const SBW_MAX     = 380;

// ─── Window size hook ─────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────
const IDLE_PROMPTS = [
  { icon: Link2,    label: 'Audit a SAM.gov link',       msg: "Paste your SAM.gov URL and I'll run a full bid/no-bid analysis." },
  { icon: FileText, label: 'Review a solicitation PDF',  msg: 'Upload an RFP PDF or paste solicitation text to get started.'   },
  { icon: BookOpen, label: 'Ask a FAR/DFARS question',   msg: 'What FAR or DFARS clause do you need help interpreting?'         },
  { icon: Zap,      label: "What's my win probability?", msg: "Tell me about your company and the opportunity — I'll score it." },
];

const POST_AUDIT_PROMPTS = (audit) => [
  { label: 'What are the top 3 risks?',       msg: 'What are the top 3 risks I should address in my proposal?' },
  { label: 'Draft an executive summary',       msg: 'Draft a 150-word executive summary for my proposal response.' },
  { label: 'What past performance do I need?', msg: 'What past performance examples would score highest?' },
  { label: `Explain ${audit?.set_aside_type || 'the set-aside'}`, msg: `Explain the ${audit?.set_aside_type || 'set-aside'} requirements and what I need to qualify.` },
];

const AUDIT_STEPS = [
  'Fetching solicitation',
  'Parsing document structure',
  'Extracting FAR/DFARS clauses',
  'Scoring risk signals',
  'Building compliance matrix',
  'Generating bid/no-bid verdict',
];

// ─── localStorage session key ─────────────────────────────────────────────────
const LS_KEY = 'aris_session_v1';

// ─── Thinking steps ───────────────────────────────────────────────────────────
function ThinkingSteps({ stepIndex }) {
  return (
    <div style={st.thinkWrap}>
      {AUDIT_STEPS.map((label, i) => {
        const done = i < stepIndex, active = i === stepIndex;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i > stepIndex ? 0.35 : 1 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: done ? M.green : active ? M.accent : '#d1d5db',
              boxShadow: active ? `0 0 0 3px rgba(16,163,127,0.15)` : 'none',
              animation: active ? 'arisPulse 1.2s ease-in-out infinite' : 'none',
              transition: 'background 0.3s',
            }} />
            <span style={{ fontSize: 13, color: done ? M.textSub : active ? M.text : M.textDim, transition: 'color 0.3s' }}>
              {label}
            </span>
            {active && <Loader2 size={12} color={M.accent} style={{ marginLeft: 'auto', animation: 'arisSpin 1s linear infinite' }} />}
            {done  && <CheckCircle2 size={12} color={M.green}  style={{ marginLeft: 'auto' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Audit result card ────────────────────────────────────────────────────────
function AuditCard({ audit }) {
  const v   = audit?.verdict || {};
  const rec = (v.recommendation || 'CONDITIONAL').replace('_', '-');
  const vc  = rec === 'BID' ? M.green : rec === 'NO-BID' ? M.red : M.amber;
  const reqs  = Array.isArray(audit?.requirements)            ? audit.requirements            : [];
  const risks = Array.isArray(audit?.intelligence?.top_risks) ? audit.intelligence.top_risks  : [];

  return (
    <div style={st.auditCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: M.textDim, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {audit?.agency || 'Federal Agency'}
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: M.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {audit?.title || audit?.solicitation_number || 'Federal Solicitation'}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: vc, letterSpacing: '-0.03em' }}>{rec}</p>
          {typeof v.win_probability === 'number' && (
            <p style={{ margin: 0, fontSize: 11, color: M.textDim }}>{v.win_probability}% win prob</p>
          )}
        </div>
      </div>

      {typeof v.win_probability === 'number' && (
        <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${v.win_probability}%`, background: vc, borderRadius: 2, transition: 'width 1s ease' }} />
        </div>
      )}

      {audit?.executiveSummary && (
        <p style={{ margin: 0, fontSize: 13, color: M.textSub, lineHeight: 1.65 }}>
          {audit.executiveSummary.slice(0, 260)}{audit.executiveSummary.length > 260 ? '…' : ''}
        </p>
      )}

      {[audit?.contract_type, audit?.set_aside_type, audit?.naics_code && `NAICS ${audit.naics_code}`, audit?.due_date && `Due ${audit.due_date}`]
        .filter(Boolean).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {[audit?.contract_type, audit?.set_aside_type, audit?.naics_code && `NAICS ${audit.naics_code}`, audit?.due_date && `Due ${audit.due_date}`]
            .filter(Boolean).map((c, i) => <span key={i} style={st.chip}>{c}</span>)}
        </div>
      )}

      {risks.slice(0, 3).map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertTriangle size={12} color={M.amber} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: M.textSub, lineHeight: 1.5 }}>{(typeof r === 'string' ? r : '').slice(0, 120)}</span>
        </div>
      ))}

      {reqs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, borderTop: `1px solid ${M.border}` }}>
          <CheckCircle2 size={12} color={M.green} />
          <span style={{ fontSize: 11, color: M.textDim }}>
            {reqs.filter(r => r.status === 'compliant' || r.met).length}/{reqs.length} requirements mapped
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, isMobile, streaming }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (msg.type === 'audit')    return <div style={{ marginBottom: 24 }}><AuditCard audit={msg.audit} /></div>;
  if (msg.type === 'thinking') return <div style={{ marginBottom: 20 }}><ThinkingSteps stepIndex={msg.stepIndex ?? 0} /></div>;
  if (msg.type === 'error')    return (
    <div style={st.errorBubble}>
      <AlertTriangle size={14} color={M.amber} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 14, color: M.textSub, lineHeight: 1.6 }}>{msg.content}</span>
    </div>
  );

  return (
    <div style={{ marginBottom: isUser ? 20 : 28 }}>
      {isUser ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ ...st.userBubble, maxWidth: isMobile ? '88%' : '72%' }}>
            {msg.content}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={st.arisAvatar}>
            <Shield size={13} color={M.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 700, color: M.text }}>ARIS</p>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p:      ({children}) => <p style={{ margin: '0 0 12px', fontSize: isMobile ? 14 : 15, lineHeight: 1.75, color: M.text }}>{children}</p>,
                ul:     ({children}) => <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>{children}</ul>,
                ol:     ({children}) => <ol style={{ margin: '0 0 12px', paddingLeft: 20 }}>{children}</ol>,
                li:     ({children}) => <li style={{ marginBottom: 6, fontSize: isMobile ? 14 : 15, lineHeight: 1.65, color: M.text }}>{children}</li>,
                strong: ({children}) => <strong style={{ fontWeight: 700, color: M.text }}>{children}</strong>,
                code:   ({children}) => <code style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 6px', fontSize: 13, fontFamily: 'monospace', color: '#0d5f8a' }}>{children}</code>,
              }}
            >
              {msg.content || (streaming ? ' ' : '')}
            </ReactMarkdown>
            {/* Blinking cursor while streaming */}
            {streaming && (
              <span style={{ display: 'inline-block', width: 2, height: 16, background: M.accent, borderRadius: 1, verticalAlign: 'middle', animation: 'arisPulse 0.8s ease-in-out infinite', marginLeft: 1 }} />
            )}
            {!streaming && msg.content && (
              <button style={st.copyBtn} onClick={copy}>
                {copied ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Welcome screen ───────────────────────────────────────────────────────────
function WelcomeState({ onPrompt, isMobile }) {
  return (
    <div style={{ ...st.welcome, padding: isMobile ? '40px 16px 24px' : '60px 24px 32px' }}>
      <div style={st.welcomeAvatar}>
        <Shield size={24} color={M.accent} />
      </div>
      <h1 style={{ ...st.welcomeTitle, fontSize: isMobile ? 22 : 28 }}>
        How can I help you today?
      </h1>
      <p style={{ ...st.welcomeSub, fontSize: isMobile ? 14 : 15 }}>
        Ask about SAM.gov opportunities, FAR/DFARS clauses, bid strategy, or compliance.
      </p>
      <div style={{ ...st.promptGrid, maxWidth: isMobile ? '100%' : 480 }}>
        {IDLE_PROMPTS.map(({ icon: Icon, label, msg }, i) => (
          <button key={i} style={st.promptCard} onClick={() => onPrompt(msg)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = M.accent; e.currentTarget.style.background = '#f0fdf9'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = M.border; e.currentTarget.style.background = M.bg; }}>
            <Icon size={15} color={M.accent} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: M.text, fontWeight: 500, textAlign: 'left' }}>{label}</span>
            <ChevronRight size={13} color={M.textDim} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Suggestion strip ─────────────────────────────────────────────────────────
function SuggestionStrip({ audit, onPrompt }) {
  return (
    <div style={st.stripWrap}>
      {POST_AUDIT_PROMPTS(audit).map(({ label, msg }, i) => (
        <button key={i} style={st.stripBtn} onClick={() => onPrompt(msg)}
          onMouseEnter={e => { e.currentTarget.style.background = M.surface; e.currentTarget.style.borderColor = '#d1d5db'; }}
          onMouseLeave={e => { e.currentTarget.style.background = M.bg;      e.currentTarget.style.borderColor = M.border; }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────
function SidebarContent({ onClose, isMobile, sidebarWidth, onResizeMouseDown, isResizing, messages, sessionTitle, auditContext, onNewChat }) {
  return (
    <>
      {/* Header */}
      <div style={st.sidebarTop}>
        <div style={st.logoRow}>
          <div style={st.logoMark}><Shield size={14} color={S.accent} /></div>
          <span style={st.logoText}>BidSmith</span>
        </div>
        <button style={st.sidebarIconBtn} onClick={onClose} title="Collapse sidebar"
          onMouseEnter={e => e.currentTarget.style.background = S.bgHover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {isMobile ? <X size={16} color={S.textDim} /> : <PanelLeftClose size={16} color={S.textDim} />}
        </button>
      </div>

      {/* New chat */}
      <div style={{ padding: '10px 10px 4px' }}>
        <button style={st.newChatBtn} onClick={onNewChat}
          onMouseEnter={e => e.currentTarget.style.background = S.bgHover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Plus size={15} color={S.text} />
          <span>New conversation</span>
        </button>
      </div>

      {/* History */}
      {messages.length > 0 && (
        <div style={{ padding: '10px 10px 0' }}>
          <p style={st.sidebarSection}>Today</p>
          <div style={{ ...st.sessionItem, background: 'rgba(255,255,255,0.06)' }}>
            <FileText size={13} color={S.textDim} style={{ flexShrink: 0 }} />
            <span style={st.sessionLabel}>{sessionTitle}</span>
            {auditContext?.verdict?.recommendation && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', flexShrink: 0,
                color: auditContext.verdict.recommendation === 'BID' ? '#4ade80' : '#f87171',
              }}>
                {auditContext.verdict.recommendation.replace('_', '-')}
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Capabilities footer */}
      <div style={st.sbCapabilities}>
        {['SAM.gov audits', 'FAR/DFARS analysis', 'Bid/no-bid strategy', 'Past performance', 'Teaming agreements'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: S.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: S.textDim }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Resize handle — desktop only */}
      {!isMobile && (
        <div
          onMouseDown={onResizeMouseDown}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,163,127,0.18)'}
          onMouseLeave={e => { if (!isResizing) e.currentTarget.style.background = 'transparent'; }}
          style={{
            position: 'absolute', top: 0, right: 0, width: 4, height: '100%',
            cursor: 'col-resize', zIndex: 10,
            background: isResizing ? 'rgba(16,163,127,0.28)' : 'transparent',
            transition: 'background 0.15s',
          }}
        />
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ArisChat({ initialPrompt: propPrompt = null }) {
  const initialPrompt = propPrompt || (() => {
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) { window.history.replaceState({}, '', '/chat'); return decodeURIComponent(q); }
    } catch {}
    return null;
  })();

  const winW         = useWindowWidth();
  const isMobile     = winW < 768;

  // ── Restore session from localStorage ──────────────────────────────────────
  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
  })();

  const [messages,        setMessages]        = useState(savedSession?.messages        || []);
  const [input,           setInput]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [streamingId,     setStreamingId]     = useState(null); // id of msg currently streaming
  const [auditContext,    setAuditContext]     = useState(savedSession?.auditContext    || null);
  const [showSuggestions, setShowSuggestions] = useState(savedSession?.auditContext != null);
  const [dragging,        setDragging]        = useState(false);
  const [collapsed,       setCollapsed]       = useState(false);
  const [sidebarWidth,    setSidebarWidth]    = useState(SBW_DEFAULT);
  const [sessionTitle,    setSessionTitle]    = useState(savedSession?.sessionTitle    || 'New conversation');
  const [isResizing,      setIsResizing]      = useState(false);
  const [inputFocused,    setInputFocused]    = useState(false);

  // Auto-collapse on mobile
  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);

  // ── Persist session to localStorage on every change ─────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ messages, auditContext, sessionTitle }));
    } catch {/* quota exceeded — ignore */}
  }, [messages, auditContext, sessionTitle]);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const fileRef     = useRef(null);
  const resizeStart = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Resize ─────────────────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback(e => {
    e.preventDefault();
    resizeStart.current = { x: e.clientX, w: sidebarWidth };
    setIsResizing(true);
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = e => {
      const next = Math.min(SBW_MAX, Math.max(SBW_MIN, resizeStart.current.w + (e.clientX - resizeStart.current.x)));
      setSidebarWidth(next);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isResizing]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addMsg = useCallback(msg =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), timestamp: new Date().toISOString(), ...msg }])
  , []);

  const updateLastMsg = useCallback(patch =>
    setMessages(prev => { const n = [...prev]; if (n.length) n[n.length - 1] = { ...n[n.length - 1], ...patch }; return n; })
  , []);

  const resetChat = useCallback(() => {
    setMessages([]); setAuditContext(null); setShowSuggestions(false);
    setSessionTitle('New conversation'); setStreamingId(null);
    try { localStorage.removeItem(LS_KEY); } catch {/* ignore */}
    inputRef.current?.focus();
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  // ── Audit ──────────────────────────────────────────────────────────────────
  const runAudit = useCallback(async (endpoint, body) => {
    setLoading(true);
    addMsg({ role: 'assistant', type: 'thinking', stepIndex: 0 });
    const timers = AUDIT_STEPS.map((_, i) => i === 0 ? null : setTimeout(() => updateLastMsg({ stepIndex: i }), i * 1800));

    try {
      const res  = await fetch(endpoint, {
        method: 'POST',
        ...(body instanceof FormData
          ? { body }
          : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      const data = await res.json().catch(() => null);
      timers.forEach(t => t && clearTimeout(t));

      if (!res.ok || data?.queued) {
        updateLastMsg({
          type: 'text', role: 'assistant', stepIndex: undefined,
          content: data?.error
            ? `I couldn't pull that document — ${data.hint || data.error}\n\nCan you paste the solicitation number or the key text from the RFP?`
            : "Something went wrong. Can you paste the solicitation number or text directly?",
        });
        return;
      }

      updateLastMsg({ type: 'audit', role: 'assistant', audit: data, content: '', stepIndex: undefined });
      setAuditContext(data);
      if (data?.title) setSessionTitle(data.title.slice(0, 40));
      setShowSuggestions(true);

      const rec = data?.verdict?.recommendation;
      const wp  = data?.verdict?.win_probability ?? '?';
      addMsg({
        role: 'assistant', type: 'text',
        content: rec === 'BID'
          ? `The verdict is **BID** at **${wp}% win probability**. What do you want to dig into — risks, compliance gaps, or a draft executive summary?`
          : (rec === 'NO-BID' || rec === 'NO_BID')
          ? `Verdict is **NO-BID** at **${wp}%**. I flagged some serious issues. Want me to walk through the top disqualifiers?`
          : `Analysis complete — came back **CONDITIONAL** at **${wp}%**. There's some uncertainty here. What do you want to focus on?`,
      });
    } catch {
      timers.forEach(t => t && clearTimeout(t));
      updateLastMsg({ type: 'text', role: 'assistant', stepIndex: undefined,
        content: "I hit a network error. Can you paste the solicitation number or text directly?" });
    } finally { setLoading(false); }
  }, [addMsg, updateLastMsg]);

  // ── ARIS chat — real SSE streaming ────────────────────────────────────────
  const callAris = useCallback(async (userContent, failedUrl = null) => {
    setLoading(true);

    const thread = messages
      .filter(m => m.type === 'text' || m.type === 'error')
      .map(m => ({ role: m.role, content: m.content }));
    thread.push({ role: 'user', content: userContent });

    const msgId = Date.now() + Math.random();
    setMessages(prev => [...prev, { id: msgId, role: 'assistant', type: 'text', content: '', timestamp: new Date().toISOString() }]);
    setStreamingId(msgId);

    const appendChunk = (chunk) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: m.content + chunk } : m));
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: thread, auditContext, failedUrl }),
      });

      if (!res.ok || !res.body) {
        // Fallback to non-streaming endpoint
        const data = await res.json().catch(() => null);
        appendChunk(data?.text || data?.response || 'Something went wrong. Please try again.');
      } else {
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   buf     = '';

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
              const { chunk } = JSON.parse(payload);
              if (chunk) appendChunk(chunk);
            } catch {/* skip malformed line */}
          }
        }
      }
    } catch {
      appendChunk('Network error — please check your connection.');
    } finally {
      setStreamingId(null);
      setLoading(false);
    }
  }, [messages, auditContext, bottomRef]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async override => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setInput(''); setShowSuggestions(false);
    if (isMobile) setCollapsed(true);
    addMsg({ role: 'user', type: 'text', content: text });

    const ir = await fetch('/api/chat/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    }).catch(() => null);
    const intent = ir ? await ir.json().catch(() => ({ intent: 'chat' })) : { intent: 'chat' };

    if (intent.intent === 'audit_url')  await runAudit('/api/audit/link', { url: intent.url });
    else if (intent.intent === 'audit_text') await runAudit('/api/audit/text', { text });
    else await callAris(text);
  }, [input, loading, isMobile, addMsg, runAudit, callAris]);

  // ── File ───────────────────────────────────────────────────────────────────
  const handleFile = useCallback(async file => {
    if (!file?.type?.includes('pdf') && !file?.name?.toLowerCase().endsWith('.pdf')) {
      addMsg({ role: 'assistant', type: 'error', content: 'Only PDF files are supported.' });
      return;
    }
    addMsg({ role: 'user', type: 'text', content: `📎 ${file.name}` });
    const form = new FormData(); form.append('file', file);
    await runAudit('/api/audit/pdf', form);
  }, [addMsg, runAudit]);

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, [handleFile]);

  // ── Init prompt ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialPrompt) return;
    if (initialPrompt.startsWith('http')) setTimeout(() => handleSubmit(initialPrompt), 120);
    else { setInput(initialPrompt); setTimeout(() => inputRef.current?.focus(), 100); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasMessages = messages.length > 0;

  // ── Sidebar visibility ────────────────────────────────────────────────────
  const sidebarVisible = !collapsed;

  return (
    <div
      style={st.root}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <style>{`
        @keyframes arisSpin  { to { transform: rotate(360deg) } }
        @keyframes arisPulse { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes arisUp    { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none} }
        @keyframes arisSlide { from{transform:translateX(-100%)}to{transform:translateX(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        textarea { resize: none; }
        textarea::placeholder { color: #9ca3af; }
      `}</style>

      {/* ── Mobile backdrop ────────────────────────────────────────────────── */}
      {isMobile && sidebarVisible && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)', zIndex: 30,
            animation: 'arisUp 0.18s ease',
          }}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      {sidebarVisible && (
        <aside style={{
          ...st.sidebar,
          width: isMobile ? Math.min(winW * 0.82, 300) : sidebarWidth,
          ...(isMobile ? {
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
            animation: 'arisSlide 0.22s cubic-bezier(0.4,0,0.2,1)',
          } : {}),
        }}>
          <SidebarContent
            onClose={() => setCollapsed(true)}
            isMobile={isMobile}
            sidebarWidth={sidebarWidth}
            onResizeMouseDown={onResizeMouseDown}
            isResizing={isResizing}
            messages={messages}
            sessionTitle={sessionTitle}
            auditContext={auditContext}
            onNewChat={resetChat}
          />
        </aside>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main style={{ ...st.main, cursor: isResizing ? 'col-resize' : 'default' }}>

        {/* Top bar */}
        <div style={st.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {collapsed && (
              <button style={st.iconBtnLight} onClick={() => setCollapsed(false)} title="Open sidebar"
                onMouseEnter={e => e.currentTarget.style.background = M.surface}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <PanelLeftOpen size={17} color={M.textSub} />
              </button>
            )}
            {(collapsed || isMobile) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(16,163,127,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={11} color={M.accent} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: M.text, letterSpacing: '-0.01em' }}>ARIS</span>
              </div>
            )}
          </div>
          <button style={st.iconBtnLight} title="Options"
            onMouseEnter={e => e.currentTarget.style.background = M.surface}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <MoreHorizontal size={17} color={M.textSub} />
          </button>
        </div>

        {/* Thread */}
        <div style={st.thread}>
          {!hasMessages ? (
            <WelcomeState onPrompt={msg => { setInput(msg); inputRef.current?.focus(); }} isMobile={isMobile} />
          ) : (
            <div style={{ ...st.threadInner, padding: isMobile ? '24px 16px 16px' : '32px 24px 20px' }}>
              {messages.map(msg => (
                <Bubble key={msg.id} msg={msg} isMobile={isMobile} streaming={msg.id === streamingId} />
              ))}
              {showSuggestions && auditContext && !loading && (
                <SuggestionStrip audit={auditContext} onPrompt={msg => handleSubmit(msg)} />
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Drag overlay */}
        {dragging && (
          <div style={st.dragOverlay}>
            <div style={st.dragBox}>
              <Paperclip size={28} color={M.accent} />
              <p style={{ margin: '10px 0 0', fontSize: 15, fontWeight: 600, color: M.text }}>Drop your RFP PDF</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: M.textDim }}>We'll audit it immediately</p>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ ...st.inputOuter, padding: isMobile ? '0 10px 14px' : '0 16px 18px' }}>
          <div style={{
            ...st.inputBox,
            borderColor: inputFocused ? M.accent : '#d1d5db',
            boxShadow: inputFocused ? `0 0 0 3px rgba(16,163,127,0.1), 0 1px 6px rgba(0,0,0,0.06)` : '0 1px 6px rgba(0,0,0,0.06)',
            transition: 'border-color 0.18s, box-shadow 0.18s',
          }}>
            {/* Toolbar */}
            <div style={st.inputToolbar}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = ''; }} />
              <button style={st.toolbarBtn} onClick={() => fileRef.current?.click()} title="Upload PDF"
                onMouseEnter={e => e.currentTarget.style.background = M.surface}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Paperclip size={15} color={M.textDim} />
                {!isMobile && <span style={{ fontSize: 12, color: M.textDim }}>Upload PDF</span>}
              </button>
              <button style={st.toolbarBtn} onClick={() => { setInput('https://sam.gov/'); inputRef.current?.focus(); }} title="SAM.gov URL"
                onMouseEnter={e => e.currentTarget.style.background = M.surface}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Link2 size={15} color={M.textDim} />
                {!isMobile && <span style={{ fontSize: 12, color: M.textDim }}>SAM.gov link</span>}
              </button>
            </div>

            {/* Input row */}
            <div style={st.inputRow}>
              <textarea
                ref={inputRef}
                style={{ ...st.textarea, fontSize: isMobile ? 15 : 15 }}
                placeholder={isMobile ? 'Ask ARIS…' : 'Ask ARIS anything — SAM.gov link, solicitation number, or any question…'}
                value={input}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                rows={1}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
              />
              <button
                style={{
                  ...st.sendBtn,
                  background: (!input.trim() || loading) ? '#e9ecef' : M.accent,
                  cursor: (!input.trim() || loading) ? 'default' : 'pointer',
                  transform: input.trim() && !loading ? 'scale(1)' : 'scale(0.95)',
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onClick={() => handleSubmit()}
                disabled={!input.trim() || loading}
              >
                {loading
                  ? <Loader2 size={15} color="#9ca3af" style={{ animation: 'arisSpin 1s linear infinite' }} />
                  : <Send size={15} color={!input.trim() ? '#9ca3af' : '#fff'} />}
              </button>
            </div>
          </div>
          <p style={{ ...st.disclaimer, fontSize: isMobile ? 10 : 11 }}>
            ARIS may make mistakes. Always verify against the original solicitation.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Static styles ────────────────────────────────────────────────────────────
const st = {
  root: {
    display: 'flex', height: '100vh', overflow: 'hidden',
    background: M.bg,
    fontFamily: '"Inter","Geist",-apple-system,BlinkMacSystemFont,sans-serif',
    WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale',
  },

  // ── Sidebar ─────────────────────────────────────────────────────────────
  sidebar: {
    display: 'flex', flexDirection: 'column', flexShrink: 0,
    background: S.bg, overflow: 'hidden',
    borderRight: `1px solid ${S.border}`,
    position: 'relative',
    userSelect: 'none',
  },
  sidebarTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 12px 10px',
    borderBottom: `1px solid ${S.border}`,
  },
  logoRow:  { display: 'flex', alignItems: 'center', gap: 9 },
  logoMark: {
    width: 28, height: 28, borderRadius: 8,
    background: 'rgba(16,163,127,0.14)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 15, fontWeight: 800, color: S.text, letterSpacing: '-0.02em' },
  sidebarIconBtn: {
    width: 30, height: 30, borderRadius: 7, background: 'transparent',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  newChatBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
    padding: '9px 12px', background: 'transparent',
    border: `1px solid ${S.border}`, borderRadius: 9,
    cursor: 'pointer', fontSize: 13, fontWeight: 500, color: S.text,
    transition: 'background 0.15s',
  },
  sidebarSection: {
    margin: '0 0 5px 2px', fontSize: 10, fontWeight: 700,
    color: S.textDim, letterSpacing: '0.1em', textTransform: 'uppercase',
  },
  sessionItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px', border: 'none', borderRadius: 8,
    cursor: 'pointer', transition: 'background 0.15s',
  },
  sessionLabel: {
    flex: 1, fontSize: 12, color: S.text, fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left',
  },
  sbCapabilities: {
    padding: '12px 14px 16px',
    borderTop: `1px solid ${S.border}`,
  },

  // ── Main ────────────────────────────────────────────────────────────────
  main: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', background: M.bg, position: 'relative', minWidth: 0,
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: `1px solid ${M.border}`,
    background: M.bg, flexShrink: 0,
  },
  iconBtnLight: {
    width: 32, height: 32, borderRadius: 7, background: 'transparent',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background 0.15s',
  },

  thread: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  threadInner: {
    maxWidth: 720, width: '100%', margin: '0 auto',
    animation: 'arisUp 0.2s ease',
  },

  // ── Welcome ──────────────────────────────────────────────────────────────
  welcome: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', maxWidth: 640, margin: '0 auto', width: '100%',
  },
  welcomeAvatar: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(16,163,127,0.08)',
    border: '1.5px solid rgba(16,163,127,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  welcomeTitle: {
    margin: '0 0 10px', fontWeight: 700,
    color: M.text, letterSpacing: '-0.025em',
  },
  welcomeSub: {
    margin: '0 0 28px', color: M.textSub, lineHeight: 1.65, maxWidth: 400,
  },
  promptGrid: { width: '100%', display: 'flex', flexDirection: 'column', gap: 8 },
  promptCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '13px 16px', background: M.bg,
    border: `1px solid ${M.border}`, borderRadius: 12,
    cursor: 'pointer', width: '100%', transition: 'border-color 0.15s, background 0.15s',
  },

  // ── Messages ─────────────────────────────────────────────────────────────
  arisAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(16,163,127,0.08)',
    border: '1.5px solid rgba(16,163,127,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  userBubble: {
    background: M.userBubble,
    borderRadius: '18px 18px 4px 18px',
    padding: '11px 16px', fontSize: 15, color: M.text,
    lineHeight: 1.65, whiteSpace: 'pre-wrap',
    animation: 'arisUp 0.18s ease',
  },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: M.textDim,
    background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px',
    marginTop: 4, borderRadius: 5, transition: 'color 0.15s, background 0.15s',
  },
  errorBubble: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    padding: '12px 16px', marginBottom: 16,
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 12, maxWidth: 520,
    animation: 'arisUp 0.18s ease',
  },

  // ── Thinking ─────────────────────────────────────────────────────────────
  thinkWrap: {
    background: M.surface, border: `1px solid ${M.border}`,
    borderRadius: 12, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
    maxWidth: 340, animation: 'arisUp 0.18s ease',
  },

  // ── Audit card ────────────────────────────────────────────────────────────
  auditCard: {
    background: M.bg, border: `1px solid ${M.border}`,
    borderRadius: 16, padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 12,
    maxWidth: '100%', animation: 'arisUp 0.25s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
  },
  chip: {
    fontSize: 11, fontWeight: 500, color: M.textSub,
    background: M.surface, border: `1px solid ${M.border}`,
    borderRadius: 5, padding: '3px 8px',
  },

  // ── Suggestions ───────────────────────────────────────────────────────────
  stripWrap: {
    display: 'flex', flexWrap: 'wrap', gap: 7, padding: '4px 0 20px',
    animation: 'arisUp 0.2s ease',
  },
  stripBtn: {
    fontSize: 13, fontWeight: 500, color: M.textSub,
    background: M.bg, border: `1px solid ${M.border}`,
    borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s', whiteSpace: 'nowrap',
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  inputOuter: { background: M.bg, flexShrink: 0 },
  inputBox: {
    maxWidth: 720, margin: '0 auto',
    background: M.bg, border: `1px solid #d1d5db`,
    borderRadius: 14, overflow: 'hidden',
  },
  inputToolbar: {
    display: 'flex', alignItems: 'center', gap: 2,
    padding: '8px 10px 6px',
    borderBottom: `1px solid ${M.border}`,
  },
  toolbarBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 8px', borderRadius: 7,
    background: 'transparent', border: 'none',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  inputRow: {
    display: 'flex', alignItems: 'flex-end', gap: 8,
    padding: '8px 10px 10px',
  },
  textarea: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    lineHeight: 1.65, fontFamily: 'inherit', color: M.text,
    minHeight: 28, maxHeight: 160, overflowY: 'auto',
  },
  sendBtn: {
    width: 34, height: 34, flexShrink: 0, borderRadius: 9, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  disclaimer: {
    margin: '6px auto 0', textAlign: 'center',
    color: M.textDim, maxWidth: 720,
  },

  // ── Drag overlay ──────────────────────────────────────────────────────────
  dragOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(6px)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },
  dragBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '40px 64px', background: M.bg,
    border: `2px dashed ${M.accent}`, borderRadius: 20,
    boxShadow: '0 8px 32px rgba(16,163,127,0.12)',
  },
};
