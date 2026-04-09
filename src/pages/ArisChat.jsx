/**
 * ArisChat — BidSmith AI-first GovCon advisor.
 *
 * MoSCoW:
 *  MUST:   intake → audit → chat in one shell, SAM.gov failure recovery,
 *          audit result cards inline, contextual suggested prompts
 *  SHOULD: typewriter stream effect, session context threading, thinking steps
 *  COULD:  export conversation
 *  WON'T:  persistent history (no DB), multi-file, auth gate
 *
 * API surface:
 *  POST /api/chat          — ARIS AI response (full thread)
 *  POST /api/chat/intent   — detect URL / sol-number / text audit
 *  POST /api/audit/link    — SAM.gov / PDF URL → audit result
 *  POST /api/audit/pdf     — file upload → audit result
 *  POST /api/audit/text    — pasted text → audit result
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Shield, Send, Plus, Paperclip, Link2, X,
  Loader2, AlertTriangle, CheckCircle2, TrendingUp,
  FileText, Zap, BookOpen, ChevronRight, Copy, Check,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        '#080808',
  surface:   '#111111',
  surfaceHi: '#161616',
  border:    '#1f1f1f',
  borderHi:  '#2a2a2a',
  text:      '#f9fafb',
  textSub:   '#9ca3af',
  textDim:   '#4b5563',
  accent:    '#3b82f6',
  green:     '#22c55e',
  red:       '#ef4444',
  amber:     '#f59e0b',
  purple:    '#a78bfa',
};

// ─── Suggested prompts (idle + post-audit) ────────────────────────────────────
const IDLE_PROMPTS = [
  { icon: Link2,    label: 'Audit a SAM.gov link',         msg: 'Paste your SAM.gov URL and I\'ll run a full bid/no-bid analysis.'   },
  { icon: FileText, label: 'Review a solicitation',         msg: 'Upload an RFP PDF or paste solicitation text to get started.'       },
  { icon: BookOpen, label: 'Ask a FAR/DFARS question',      msg: 'What FAR or DFARS clause do you need help interpreting?'             },
  { icon: Zap,      label: 'What\'s my win probability?',   msg: 'Tell me about your company and the opportunity — I\'ll score it.'   },
];

const POST_AUDIT_PROMPTS = (audit) => [
  { label: 'What are the top 3 risks?',            msg: 'What are the top 3 risks I should address in my proposal?' },
  { label: 'Write an executive summary',            msg: 'Draft a 150-word executive summary for my proposal response.' },
  { label: 'What past performance do I need?',     msg: 'What past performance examples would score highest for this solicitation?' },
  { label: `Explain ${audit?.set_aside_type || 'the set-aside'}`, msg: `Explain the ${audit?.set_aside_type || 'set-aside'} requirements and what I need to qualify.` },
];

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(text, active) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    if (!active || !text) { setDisplayed(text || ''); return; }
    idx.current = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      idx.current += 3; // 3 chars per tick = ~60wpm feel
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [text, active]);

  return displayed;
}

// ─── Thinking steps ───────────────────────────────────────────────────────────
const AUDIT_STEPS = [
  { id: 'fetch',    label: 'Fetching solicitation'       },
  { id: 'parse',    label: 'Parsing document structure'  },
  { id: 'clauses',  label: 'Extracting FAR/DFARS clauses'},
  { id: 'risks',    label: 'Scoring risk signals'        },
  { id: 'matrix',   label: 'Building compliance matrix'  },
  { id: 'verdict',  label: 'Generating bid/no-bid verdict'},
];

function ThinkingSteps({ stepIndex }) {
  return (
    <div style={s.thinkWrap}>
      {AUDIT_STEPS.map((step, i) => {
        const done    = i < stepIndex;
        const active  = i === stepIndex;
        const pending = i > stepIndex;
        return (
          <div key={step.id} style={{ ...s.thinkRow, opacity: pending ? 0.35 : 1 }}>
            <div style={{
              ...s.thinkDot,
              background: done ? T.green : active ? T.accent : T.borderHi,
              boxShadow: active ? `0 0 8px ${T.accent}` : done ? `0 0 6px ${T.green}` : 'none',
              animation: active ? 'pulse 1s ease-in-out infinite' : 'none',
            }} />
            <span style={{ ...s.thinkLabel, color: done ? T.textSub : active ? T.text : T.textDim }}>
              {step.label}
            </span>
            {active && <Loader2 size={11} color={T.accent} style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
            {done   && <CheckCircle2 size={11} color={T.green} style={{ marginLeft: 'auto' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Inline audit result card ─────────────────────────────────────────────────
function AuditCard({ audit }) {
  const v = audit?.verdict || {};
  const reqs  = Array.isArray(audit?.requirements) ? audit.requirements : [];
  const risks = Array.isArray(audit?.intelligence?.top_risks) ? audit.intelligence.top_risks : [];
  const rec   = v.recommendation || 'CONDITIONAL';
  const verdictColor = rec === 'BID' ? T.green : rec === 'NO-BID' || rec === 'NO_BID' ? T.red : T.amber;

  return (
    <div style={s.auditCard}>
      {/* Header row */}
      <div style={s.auditHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {audit?.agency || 'Federal Agency'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>
            {audit?.title || audit?.solicitation_number || 'Federal Solicitation'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: verdictColor, letterSpacing: '-0.03em' }}>
            {rec.replace('_', '-')}
          </span>
          {typeof v.win_probability === 'number' && (
            <span style={{ fontSize: 11, color: T.textDim }}>
              {v.win_probability}% win prob
            </span>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      {typeof v.win_probability === 'number' && (
        <div style={s.auditBar}>
          <div style={{ ...s.auditBarFill, width: `${v.win_probability}%`, background: verdictColor }} />
        </div>
      )}

      {/* Summary */}
      {audit?.executiveSummary && (
        <p style={s.auditSummary}>
          {audit.executiveSummary.slice(0, 260)}{audit.executiveSummary.length > 260 ? '…' : ''}
        </p>
      )}

      {/* Meta chips */}
      <div style={s.auditChips}>
        {[audit?.contract_type, audit?.set_aside_type, audit?.naics_code && `NAICS ${audit.naics_code}`, audit?.due_date && `Due ${audit.due_date}`]
          .filter(Boolean)
          .map((chip, i) => <span key={i} style={s.auditChip}>{chip}</span>)
        }
      </div>

      {/* Top risks */}
      {risks.length > 0 && (
        <div style={s.auditRisks}>
          {risks.slice(0, 3).map((r, i) => (
            <div key={i} style={s.auditRiskRow}>
              <AlertTriangle size={11} color={T.amber} style={{ flexShrink: 0 }} />
              <span style={s.auditRiskText}>{typeof r === 'string' ? r.slice(0, 100) : 'Risk factor'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Requirements count */}
      {reqs.length > 0 && (
        <div style={s.auditFooter}>
          <CheckCircle2 size={12} color={T.green} />
          <span style={{ fontSize: 11, color: T.textDim }}>
            {reqs.filter(r => r.status === 'compliant' || r.met).length}/{reqs.length} requirements mapped
          </span>
          <span style={{ fontSize: 11, color: T.accent, marginLeft: 'auto', cursor: 'pointer' }}>
            View full matrix →
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, isLatestAI }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);
  const displayed = useTypewriter(msg.content, isLatestAI && !isUser && msg.type === 'text');

  const copy = async () => {
    await navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.type === 'audit') return (
    <div style={{ marginBottom: 24 }}>
      <AuditCard audit={msg.audit} />
    </div>
  );

  if (msg.type === 'thinking') return (
    <div style={{ marginBottom: 16 }}>
      <ThinkingSteps stepIndex={msg.stepIndex ?? 0} />
    </div>
  );

  if (msg.type === 'error') return (
    <div style={s.errorBubble}>
      <AlertTriangle size={14} color={T.amber} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>{msg.content}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 20, alignItems: 'flex-start' }}>
      {!isUser && (
        <div style={s.arisAvatar}>
          <Shield size={13} color={T.accent} />
        </div>
      )}

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          ...s.bubble,
          background: isUser ? T.accent : T.surfaceHi,
          color: isUser ? '#fff' : T.text,
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          border: isUser ? 'none' : `1px solid ${T.border}`,
        }}>
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{msg.content}</span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p:    ({ children }) => <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.7 }}>{children}</p>,
                ul:   ({ children }) => <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>{children}</ul>,
                ol:   ({ children }) => <ol style={{ margin: '0 0 10px', paddingLeft: 18 }}>{children}</ol>,
                li:   ({ children }) => <li style={{ marginBottom: 5, fontSize: 14, lineHeight: 1.6 }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: T.text, fontWeight: 700 }}>{children}</strong>,
                code: ({ children }) => <code style={{ background: '#0d0d0d', border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'monospace', color: T.purple }}>{children}</code>,
              }}
            >
              {isLatestAI ? displayed : msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Copy button on AI messages */}
        {!isUser && msg.content && (
          <button style={s.copyMsgBtn} onClick={copy} title="Copy">
            {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Empty / welcome state ────────────────────────────────────────────────────
function WelcomeState({ onPrompt }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={s.welcome}>
      <div style={s.welcomeAvatar}>
        <Shield size={28} color={T.accent} />
        <div style={s.welcomeOnline} />
      </div>

      <h1 style={s.welcomeTitle}>{greeting}.</h1>
      <p style={s.welcomeSub}>
        I'm ARIS — your AI capture manager. Drop a SAM.gov link, upload an RFP, or ask me anything about federal contracting.
      </p>

      <div style={s.promptGrid}>
        {IDLE_PROMPTS.map(({ icon: Icon, label, msg }, i) => (
          <button key={i} style={s.promptCard} onClick={() => onPrompt(msg)}>
            <Icon size={16} color={T.accent} style={{ flexShrink: 0 }} />
            <span style={s.promptLabel}>{label}</span>
            <ChevronRight size={13} color={T.textDim} style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Post-audit suggestion strip ──────────────────────────────────────────────
function SuggestionStrip({ audit, onPrompt }) {
  const prompts = POST_AUDIT_PROMPTS(audit);
  return (
    <div style={s.stripWrap}>
      {prompts.map(({ label, msg }, i) => (
        <button key={i} style={s.stripBtn} onClick={() => onPrompt(msg)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ArisChat({ initialPrompt: propPrompt = null }) {
  // Pick up ?q= from URL (e.g. redirected from failed Bento upload)
  const initialPrompt = propPrompt || (() => {
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) {
        // Clean the URL without reload
        window.history.replaceState({}, '', '/chat');
        return decodeURIComponent(q);
      }
    } catch {}
    return null;
  })();
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [auditContext, setAuditContext] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dragging, setDragging]       = useState(false);
  const [sessions, setSessions]       = useState([]);   // in-memory session log
  const [sessionTitle, setSessionTitle] = useState('New Conversation');
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const fileRef    = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initialPrompt — auto-submit if it looks like a URL (from Bento failure redirect)
  useEffect(() => {
    if (!initialPrompt) return;
    const isUrl = initialPrompt.startsWith('http');
    if (isUrl) {
      // Give the component a tick to mount, then fire submit
      setTimeout(() => handleSubmit(initialPrompt), 120);
    } else {
      setInput(initialPrompt);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Message helpers ─────────────────────────────────────────────────────────
  const addMsg = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), timestamp: new Date().toISOString(), ...msg }]);
  }, []);

  const updateLastMsg = useCallback((patch) => {
    setMessages(prev => {
      const next = [...prev];
      if (next.length) next[next.length - 1] = { ...next[next.length - 1], ...patch };
      return next;
    });
  }, []);

  // ── Audit pipeline ──────────────────────────────────────────────────────────
  const runAudit = useCallback(async (endpoint, body, failedUrl = null) => {
    setLoading(true);
    addMsg({ role: 'assistant', type: 'thinking', stepIndex: 0 });

    // Animate thinking steps
    const stepTimers = [];
    AUDIT_STEPS.forEach((_, i) => {
      if (i === 0) return;
      stepTimers.push(setTimeout(() => updateLastMsg({ stepIndex: i }), i * 1800));
    });

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        ...(body instanceof FormData ? { body } : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      });

      const data = await res.json().catch(() => null);
      stepTimers.forEach(clearTimeout);

      if (!res.ok || data?.queued) {
        // Swap thinking → AI recovery message
        updateLastMsg({
          type: 'text',
          role: 'assistant',
          content: data?.error
            ? `I couldn't pull that document automatically — ${data.hint || data.error}\n\nCan you paste the solicitation number (e.g. **W912DY-25-R-0001**) or drop in the key text from the RFP?`
            : "Something went wrong fetching that solicitation. Can you paste the solicitation number or text directly?",
          stepIndex: undefined,
        });
        if (failedUrl) {
          // Ask ARIS to guide recovery
          await callAris(
            `The user tried to audit this URL but it failed: ${failedUrl}. Guide them to the next step.`,
            failedUrl
          );
        }
        return;
      }

      // Show audit card
      updateLastMsg({ type: 'audit', role: 'assistant', audit: data, content: '', stepIndex: undefined });
      setAuditContext(data);
      if (data?.title) {
        setSessionTitle(data.title.slice(0, 40));
      }
      setShowSuggestions(true);

      // Auto follow-up from ARIS
      const rec = data?.verdict?.recommendation;
      const followUp = rec === 'BID'
        ? `The analysis is in. **${rec}** at ${data?.verdict?.win_probability ?? '?'}% win probability. What aspect do you want to dig into first — risks, compliance requirements, or the executive summary?`
        : rec === 'NO-BID' || rec === 'NO_BID'
        ? `The verdict is **${rec.replace('_', '-')}** at ${data?.verdict?.win_probability ?? '?'}%. I flagged some serious issues — want me to walk through the top disqualifiers, or are you looking to challenge the recommendation?`
        : `Analysis complete. The solicitation has some uncertainty that pushed this to **CONDITIONAL**. Let me know what you want to focus on.`;

      addMsg({ role: 'assistant', type: 'text', content: followUp });

    } catch (err) {
      stepTimers.forEach(clearTimeout);
      updateLastMsg({
        type: 'text',
        role: 'assistant',
        content: `I hit a network error trying to fetch that document. Can you paste the solicitation number or text directly?`,
        stepIndex: undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [addMsg, updateLastMsg]);

  // ── ARIS chat call ──────────────────────────────────────────────────────────
  const callAris = useCallback(async (userContent, failedUrl = null) => {
    setLoading(true);

    // Build thread from current messages (excluding thinking/audit bubbles)
    const thread = messages
      .filter(m => m.type === 'text' || m.type === 'error')
      .map(m => ({ role: m.role, content: m.content }));

    thread.push({ role: 'user', content: userContent });

    addMsg({ role: 'assistant', type: 'text', content: '…' });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: thread, auditContext, failedUrl }),
      });

      const data = await res.json().catch(() => null);
      const text = data?.text || data?.response || 'Something went wrong. Please try again.';
      updateLastMsg({ content: text });
    } catch {
      updateLastMsg({ content: 'Network error — please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  }, [messages, auditContext, addMsg, updateLastMsg]);

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    setInput('');
    setShowSuggestions(false);
    addMsg({ role: 'user', type: 'text', content: text });

    // Detect intent
    const intentRes = await fetch('/api/chat/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    }).catch(() => null);

    const intent = intentRes ? await intentRes.json().catch(() => ({ intent: 'chat' })) : { intent: 'chat' };

    if (intent.intent === 'audit_url') {
      await runAudit('/api/audit/link', { url: intent.url }, intent.url);
    } else if (intent.intent === 'audit_text') {
      await runAudit('/api/audit/text', { text });
    } else {
      await callAris(text);
    }
  }, [input, loading, addMsg, runAudit, callAris]);

  // ── File drop / upload ──────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file?.type?.includes('pdf') && !file?.name?.toLowerCase().endsWith('.pdf')) {
      addMsg({ role: 'assistant', type: 'error', content: 'Only PDF files are supported for direct upload.' });
      return;
    }
    addMsg({ role: 'user', type: 'text', content: `📎 ${file.name}` });
    const form = new FormData();
    form.append('file', file);
    await runAudit('/api/audit/pdf', form);
  }, [addMsg, runAudit]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Keyboard shortcut ───────────────────────────────────────────────────────
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const hasMessages = messages.length > 0;
  const lastAIIdx   = [...messages].reverse().findIndex(m => m.role === 'assistant' && m.type === 'text');
  const lastAIId    = lastAIIdx >= 0 ? messages[messages.length - 1 - lastAIIdx]?.id : null;

  return (
    <div
      style={s.root}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <style>{`
        @keyframes spin    { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
        textarea { resize: none; }
        textarea::placeholder { color: #374151; }
      `}</style>

      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside style={s.sidebar}>
        {/* Logo */}
        <div style={s.sidebarLogo}>
          <div style={s.logoMark}><Shield size={14} color={T.accent} /></div>
          <span style={s.logoText}>BidSmith</span>
        </div>

        {/* New chat */}
        <div style={{ padding: '10px 12px' }}>
          <button style={s.newChatBtn} onClick={() => { setMessages([]); setAuditContext(null); setShowSuggestions(false); setSessionTitle('New Conversation'); inputRef.current?.focus(); }}>
            <Plus size={14} /> New conversation
          </button>
        </div>

        {/* Session info */}
        {hasMessages && (
          <div style={{ padding: '0 12px 8px' }}>
            <div style={s.sidebarSection}>Today</div>
            <div style={s.sessionItem}>
              <span style={s.sessionItemText}>{sessionTitle}</span>
              {auditContext?.verdict?.recommendation && (
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
                  color: auditContext.verdict.recommendation === 'BID' ? T.green : T.red,
                }}>
                  {auditContext.verdict.recommendation.replace('_', '-')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Capabilities hint */}
        <div style={{ flex: 1 }} />
        <div style={s.sidebarHint}>
          {[
            'SAM.gov opportunity audit',
            'PDF solicitation analysis',
            'FAR/DFARS interpretation',
            'Bid/no-bid strategy',
            'Past performance guidance',
          ].map((item, i) => (
            <div key={i} style={s.hintRow}>
              <div style={s.hintDot} />
              <span style={s.hintText}>{item}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main chat area ──────────────────────────────────────────────── */}
      <main style={s.main}>

        {/* Thread */}
        <div style={s.thread}>
          {!hasMessages ? (
            <WelcomeState onPrompt={(msg) => { setInput(msg); inputRef.current?.focus(); }} />
          ) : (
            <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '40px 24px 20px', animation: 'fadeIn 0.2s ease' }}>
              {messages.map((msg) => (
                <Bubble
                  key={msg.id}
                  msg={msg}
                  isLatestAI={msg.id === lastAIId}
                />
              ))}

              {/* Post-audit suggestions */}
              {showSuggestions && auditContext && !loading && (
                <SuggestionStrip
                  audit={auditContext}
                  onPrompt={(msg) => handleSubmit(msg)}
                />
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Drag overlay */}
        {dragging && (
          <div style={s.dragOverlay}>
            <div style={s.dragInner}>
              <Paperclip size={32} color={T.accent} />
              <p style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 600, color: T.text }}>Drop your RFP PDF here</p>
            </div>
          </div>
        )}

        {/* ── Input bar ──────────────────────────────────────────────────── */}
        <div style={s.inputOuter}>
          <div style={s.inputWrap}>

            {/* File + URL attach row */}
            <div style={s.attachRow}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = ''; }} />
              <button style={s.attachBtn} onClick={() => fileRef.current?.click()} title="Upload PDF">
                <Paperclip size={15} color={T.textDim} />
              </button>
              <button style={s.attachBtn} onClick={() => { setInput('https://sam.gov/'); inputRef.current?.focus(); }} title="Paste SAM.gov URL">
                <Link2 size={15} color={T.textDim} />
              </button>
              <span style={s.attachHint}>Drop a PDF or paste a SAM.gov link</span>
            </div>

            {/* Text input + send */}
            <div style={s.inputRow}>
              <textarea
                ref={inputRef}
                style={s.textarea}
                placeholder="Ask ARIS anything — paste a SAM.gov link, a solicitation number, or a question…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                }}
              />
              <button
                style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
                onClick={() => handleSubmit()}
                disabled={!input.trim() || loading}
              >
                {loading
                  ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={16} />
                }
              </button>
            </div>

          </div>
          <p style={s.inputFooter}>
            ARIS may make mistakes. Verify critical compliance decisions against the original solicitation.
          </p>
        </div>

      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: {
    display: 'flex',
    height: '100vh',
    background: T.bg,
    fontFamily: '"Inter","Geist",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    color: T.text,
    overflow: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    position: 'relative',
  },

  // ── Sidebar ──
  sidebar: {
    width: 240,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: T.surface,
    borderRight: `1px solid ${T.border}`,
    overflow: 'hidden',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 16px 12px',
    borderBottom: `1px solid ${T.border}`,
  },
  logoMark: {
    width: 28, height: 28, borderRadius: 8,
    background: 'rgba(59,130,246,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: '-0.02em',
  },
  newChatBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '9px 12px',
    background: 'transparent',
    border: `1px solid ${T.border}`,
    borderRadius: 9, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, color: T.textSub,
    transition: 'all 0.15s',
  },
  sidebarSection: {
    fontSize: 10, fontWeight: 700, color: T.textDim,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '4px 4px 6px',
  },
  sessionItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 10px', borderRadius: 8,
    background: T.surfaceHi, border: `1px solid ${T.border}`,
    cursor: 'pointer',
  },
  sessionItemText: {
    flex: 1, fontSize: 12, color: T.text, fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  sidebarHint: {
    padding: '16px 16px 20px',
    borderTop: `1px solid ${T.border}`,
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  hintRow: { display: 'flex', alignItems: 'center', gap: 8 },
  hintDot: {
    width: 4, height: 4, borderRadius: '50%',
    background: T.accent, flexShrink: 0,
  },
  hintText: { fontSize: 11, color: T.textDim },

  // ── Main ──
  main: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', position: 'relative',
  },
  thread: {
    flex: 1, overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  },

  // ── Welcome ──
  welcome: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 24px 32px', textAlign: 'center',
    maxWidth: 600, margin: '0 auto', width: '100%',
  },
  welcomeAvatar: {
    position: 'relative', marginBottom: 24,
    width: 68, height: 68, borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, rgba(59,130,246,0.2), rgba(59,130,246,0.05))',
    border: '1px solid rgba(59,130,246,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 40px rgba(59,130,246,0.12)',
  },
  welcomeOnline: {
    position: 'absolute', bottom: 3, right: 3,
    width: 13, height: 13, borderRadius: '50%',
    background: T.green, border: `2px solid ${T.bg}`,
    boxShadow: `0 0 8px ${T.green}`,
  },
  welcomeTitle: {
    margin: '0 0 10px', fontSize: 30, fontWeight: 800,
    color: T.text, letterSpacing: '-0.03em',
  },
  welcomeSub: {
    margin: '0 0 36px', fontSize: 15, color: T.textSub,
    lineHeight: 1.7, maxWidth: 420,
  },
  promptGrid: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
  },
  promptCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
    transition: 'border-color 0.15s, background 0.15s',
    width: '100%',
  },
  promptLabel: {
    fontSize: 14, fontWeight: 500, color: T.text,
  },

  // ── Bubbles ──
  arisAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(59,130,246,0.12)',
    border: `1px solid rgba(59,130,246,0.25)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  bubble: {
    padding: '12px 16px',
    animation: 'fadeIn 0.18s ease',
  },
  copyMsgBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, color: T.textDim,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '2px 4px',
    alignSelf: 'flex-start',
    transition: 'color 0.15s',
  },
  errorBubble: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 16px', marginBottom: 16,
    background: 'rgba(245,158,11,0.06)',
    border: `1px solid rgba(245,158,11,0.2)`,
    borderRadius: 12, maxWidth: 520,
  },

  // ── Thinking steps ──
  thinkWrap: {
    background: T.surfaceHi, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
    maxWidth: 340,
    animation: 'fadeIn 0.18s ease',
  },
  thinkRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    transition: 'opacity 0.3s',
  },
  thinkDot: {
    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
    transition: 'background 0.3s, box-shadow 0.3s',
  },
  thinkLabel: {
    fontSize: 12, fontWeight: 500,
    transition: 'color 0.3s',
  },

  // ── Audit card ──
  auditCard: {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 16, padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 12,
    maxWidth: 520,
    animation: 'fadeIn 0.25s ease',
  },
  auditHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
  },
  auditBar: {
    height: 4, background: T.borderHi, borderRadius: 2, overflow: 'hidden',
  },
  auditBarFill: {
    height: '100%', borderRadius: 2,
    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
  },
  auditSummary: {
    margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.65,
  },
  auditChips: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  auditChip: {
    fontSize: 10, fontWeight: 500, color: T.textDim,
    background: T.surfaceHi, border: `1px solid ${T.border}`,
    borderRadius: 5, padding: '3px 7px',
  },
  auditRisks: { display: 'flex', flexDirection: 'column', gap: 6 },
  auditRiskRow: { display: 'flex', alignItems: 'flex-start', gap: 7 },
  auditRiskText: { fontSize: 12, color: T.textSub, lineHeight: 1.5 },
  auditFooter: {
    display: 'flex', alignItems: 'center', gap: 6,
    borderTop: `1px solid ${T.border}`, paddingTop: 10,
  },

  // ── Suggestions ──
  stripWrap: {
    display: 'flex', flexWrap: 'wrap', gap: 7,
    padding: '4px 0 16px',
    animation: 'fadeIn 0.2s ease',
  },
  stripBtn: {
    fontSize: 12, fontWeight: 500, color: T.textSub,
    background: T.surfaceHi, border: `1px solid ${T.border}`,
    borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  },

  // ── Input ──
  inputOuter: {
    padding: '0 24px 16px',
    background: `linear-gradient(to top, ${T.bg} 80%, transparent)`,
    flexShrink: 0,
  },
  inputWrap: {
    maxWidth: 720, margin: '0 auto',
    background: T.surface,
    border: `1px solid ${T.borderHi}`,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.03)',
  },
  attachRow: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '10px 12px 4px',
    borderBottom: `1px solid ${T.border}`,
  },
  attachBtn: {
    width: 30, height: 30, borderRadius: 8,
    background: 'none', border: `1px solid ${T.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'border-color 0.15s',
  },
  attachHint: {
    fontSize: 11, color: T.textDim, marginLeft: 4,
  },
  inputRow: {
    display: 'flex', alignItems: 'flex-end', gap: 10, padding: '10px 12px',
  },
  textarea: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: 14, color: T.text, lineHeight: 1.6,
    fontFamily: 'inherit', minHeight: 24, maxHeight: 160,
    overflowY: 'auto',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: T.accent, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', transition: 'opacity 0.15s',
  },
  inputFooter: {
    margin: '8px auto 0', textAlign: 'center',
    fontSize: 10, color: T.textDim,
    maxWidth: 720,
  },

  // ── Drag overlay ──
  dragOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(8,8,8,0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  dragInner: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '40px 60px',
    background: T.surface, border: `2px dashed ${T.accent}`,
    borderRadius: 20,
  },
};
