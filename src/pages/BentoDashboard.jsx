/**
 * BentoDashboard — The BidSmith Command Center.
 *
 * Layout:
 *   [Sidebar 220px] | [Main — scrollable]
 *     Sidebar: logo, new audit, audit history, user/logout
 *     Main:
 *       Row 1: [RFP Input / Chat] [Live Analysis]
 *       Row 2: [Win Prob] [Risk Signals] [Compliance] [Eval]
 *       Row 3: [Bid Output]
 *
 * Single source of truth — /app, /bento, /dashboard all route here.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Zap, Activity, FileSearch, ArrowUpRight, Send, RotateCcw,
         MessageSquare, Loader2, ExternalLink, AlertTriangle,
         Clock, ChevronRight, LogOut, Plus, LayoutDashboard } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
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
function MiniChatShell({ context, onReset, onAuditResult, onAuditStart, user = null }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: context.aiMessage, id: 0 },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(user?.id ? { 'x-user-id': user.id } : {}),
    ...(user?.email ? { 'x-user-email': user.email } : {}),
    'x-subscribed': user?.isSubscribed ? 'true' : 'false',
  };

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
          headers: requestHeaders,
          body: JSON.stringify({ url: text }),
        });
        const data = await res.json();
        const cacheHeader = (res.headers.get('x-bidsmith-cache') || res.headers.get('x-cache') || '').toLowerCase();
        const cacheHitFromHeader = cacheHeader.includes('hit');
        const normalized = data ? {
          ...data,
          meta: {
            ...(data.meta || {}),
            cache_hit: data?.meta?.cache_hit === true || cacheHitFromHeader || data?.isCached === true,
          },
        } : data;
        if (res.ok && !data.error) {
          onAuditResult?.(normalized);
          setMessages(m => [...m, {
            role: 'ai',
            text: `Audit complete. Verdict: **${normalized.verdict?.recommendation || 'CONDITIONAL'}** (${normalized.verdict?.win_probability ?? '?'}% win probability).\n\n${normalized.verdict?.summary || ''}`,
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
          headers: requestHeaders,
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

// ── Featured / Hot RFPs this week ─────────────────────────────────────────
const FEATURED_RFPS = [
  {
    id:       'fa462626q0009',
    demoId:   'army-cyber',
    demo:     true,
    title:    'Army Cyber Operations Support Services',
    agency:   'Dept. of the Army',
    naics:    '541519',
    value:    '$24.5M',
    setAside: 'Unrestricted',
    tag:      '🔥 Trending',
    tagColor: '#ef4444',
    url:      'https://sam.gov/opp/fa462626q0009/view',
  },
  {
    id:       '70cdsr24r00000003',
    demoId:   'dhs-ecip',
    demo:     true,
    title:    'DHS Enterprise Cloud Infrastructure (ECIP)',
    agency:   'Dept. of Homeland Security',
    naics:    '541512',
    value:    '$180M',
    setAside: 'Small Business',
    tag:      '💰 High Value',
    tagColor: '#f59e0b',
    url:      'https://sam.gov/opp/70cdsr24r00000003/view',
  },
  {
    id:       'hhsm500t0001',
    demoId:   'hhs-modernization',
    demo:     true,
    title:    'HHS Health IT Modernization — Phase III',
    agency:   'HHS / CMS',
    naics:    '541511',
    value:    '$62M',
    setAside: '8(a) Set-Aside',
    tag:      '⚡ Closing Soon',
    tagColor: '#a78bfa',
    url:      'https://sam.gov/opp/hhsm500t0001/view',
  },
  {
    id:       'va797p24q0112',
    demoId:   'va-devsecops',
    demo:     true,
    title:    'VA Enterprise DevSecOps Platform',
    agency:   'Dept. of Veterans Affairs',
    naics:    '541513',
    value:    '$38M',
    setAside: 'SDVOSB',
    tag:      '🏛️ Federal Priority',
    tagColor: '#3b82f6',
    url:      'https://sam.gov/opp/va797p24q0112/view',
  },
  {
    id:       'n0042124r0001',
    demoId:   'navsea-network',
    demo:     true,
    title:    'NAVSEA Shipyard IT Network Upgrade',
    agency:   'Dept. of the Navy',
    naics:    '334111',
    value:    '$91M',
    setAside: 'HUBZone',
    tag:      '🆕 Just Posted',
    tagColor: '#22c55e',
    url:      'https://sam.gov/opp/n0042124r0001/view',
  },
];

function FeaturedSolicitations({ onSelect }) {
  return (
    <div style={fs.wrap}>
      <div style={fs.header}>
        <span style={fs.eyebrow}>HOT RFPs THIS WEEK</span>
        <span style={fs.sub}>Click any card to instantly run a cached demo audit →</span>
      </div>
      <div style={fs.scroll}>
        {FEATURED_RFPS.map(rfp => (
          <button key={rfp.id} onClick={() => onSelect(rfp)} style={fs.card}>
            <div style={fs.cardTop}>
              <span style={{ ...fs.tag, color: rfp.tagColor, borderColor: rfp.tagColor + '40', background: rfp.tagColor + '12' }}>
                {rfp.tag}
              </span>
              <span style={fs.naics}>NAICS {rfp.naics}</span>
            </div>
            <p style={fs.title}>{rfp.title}</p>
            <p style={fs.agency}>{rfp.agency}</p>
            <div style={fs.cardBottom}>
              <span style={fs.value}>{rfp.value}</span>
                <span style={fs.setAside}>{rfp.demo ? 'Demo Instant' : rfp.setAside}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const fs = {
  wrap: {
    padding: '0 28px 20px',
  },
  header: {
    display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12,
  },
  eyebrow: {
    fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em',
    color: '#4b5563', textTransform: 'uppercase',
  },
  sub: {
    fontSize: '11px', color: '#2a2a2a',
  },
  scroll: {
    display: 'flex', gap: 10, overflowX: 'auto',
    paddingBottom: 4, scrollbarWidth: 'none',
  },
  card: {
    flexShrink: 0, width: 200,
    background: '#0f0f0f',
    border: '1px solid #1a1a1a',
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 6,
    transition: 'border-color 0.15s, background 0.15s, transform 0.12s',
  },
  cardTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  tag: {
    fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em',
    padding: '2px 6px', borderRadius: 4, border: '1px solid',
    whiteSpace: 'nowrap',
  },
  naics: {
    fontSize: '9px', color: '#374151', fontFamily: 'monospace',
  },
  title: {
    margin: 0, fontSize: '12px', fontWeight: 600,
    color: '#e5e7eb', lineHeight: 1.35,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  agency: {
    margin: 0, fontSize: '10px', color: '#6b7280',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardBottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2,
  },
  value: {
    fontSize: '12px', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.02em',
  },
  setAside: {
    fontSize: '9px', fontWeight: 600, color: '#6b7280',
    background: '#1a1a1a', border: '1px solid #222',
    borderRadius: 4, padding: '2px 6px',
  },
};

// ── Submission Checklist — "Don't miss a deliverable" ─────────────────────
function SubmissionChecklist({ auditResult, loading = false }) {
  const checklist = auditResult?.submission_checklist || [];
  const incumbentSignals = auditResult?.incumbent_signals || [];
  const [checked, setChecked] = React.useState({});

  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));
  const doneCount = Object.values(checked).filter(Boolean).length;

  if (loading) {
    return (
      <div style={cl.card}>
        <div style={cl.header}>
          <span style={cl.dot} />
          <span style={cl.title}>Submission Checklist</span>
        </div>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 18, background: '#1a1a1a', borderRadius: 4, marginBottom: 10, opacity: 0.5, animation: 'pulse 1.4s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  if (!auditResult || checklist.length === 0) {
    return (
      <div style={cl.card}>
        <div style={cl.header}>
          <span style={cl.dot} />
          <span style={cl.title}>Submission Checklist</span>
          <span style={cl.badge}>GUIDE</span>
        </div>
        <p style={{ fontSize: 11, color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
          Run an audit to generate a complete list of every document and form you must submit.
          The engine detects page limits, required volumes, signed certifications, and hidden deliverables.
        </p>
      </div>
    );
  }

  const progress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  return (
    <div style={cl.card}>
      <div style={cl.header}>
        <span style={cl.dot} />
        <span style={cl.title}>Submission Checklist</span>
        <span style={{ ...cl.badge, marginLeft: 'auto' }}>
          {doneCount}/{checklist.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#1a1a1a', borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${progress}%`,
          background: progress === 100 ? '#16a34a' : '#2563eb',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {checklist.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '5px 0', textAlign: 'left',
            }}
          >
            <span style={{
              flexShrink: 0, width: 14, height: 14, borderRadius: 3,
              border: `1.5px solid ${checked[i] ? '#16a34a' : '#374151'}`,
              background: checked[i] ? '#16a34a' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1, transition: 'all 0.15s',
            }}>
              {checked[i] && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </span>
            <span style={{
              fontSize: 11, color: checked[i] ? '#4b5563' : '#d1d5db',
              lineHeight: 1.5,
              textDecoration: checked[i] ? 'line-through' : 'none',
            }}>
              {item}
            </span>
          </button>
        ))}
      </div>

      {/* Incumbent signals — if detected */}
      {incumbentSignals.length > 0 && (
        <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 8 }}>
          <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: '#d97706', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Incumbent Signals Detected
          </p>
          {incumbentSignals.map((sig, i) => (
            <p key={i} style={{ margin: '0 0 4px', fontSize: 10, color: '#fbbf24', lineHeight: 1.5 }}>
              · {sig}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

const cl = {
  card: {
    background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14,
    padding: '18px 20px', flex: 1, minWidth: 0,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%', background: '#16a34a',
    boxShadow: '0 0 6px rgba(22,163,74,0.5)', flexShrink: 0,
  },
  title: {
    fontSize: 10, fontWeight: 700, color: '#9ca3af',
    letterSpacing: '0.1em', textTransform: 'uppercase',
  },
  badge: {
    fontSize: 9, fontWeight: 800, color: '#4b5563',
    background: '#111', border: '1px solid #222',
    borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em',
  },
};

// ── Paywall Gate — free teaser + locked full analysis ─────────────────────
function PaywallGate({
  children,
  hasAudit,
  isPaid = false,
  checkingPayment = false,
  solicitationId = '',
  opportunityTitle = '',
  uid = 'anonymous',
  unlockReason = 'payment',
}) {
  const [unlocking, setUnlocking] = useState(false);
  const reasonLabel = unlockReason === 'subscription'
    ? 'Unlocked by subscription'
    : unlockReason === 'demo'
      ? 'Unlocked for demo'
      : unlockReason === 'payment'
        ? 'Unlocked by one-time payment'
        : 'Locked';
  const badgeStyle = isPaid ? pw.statusUnlocked : pw.statusLocked;

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch('/api/create-dynamic-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitationId, opportunityTitle, uid }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url; // same-tab redirect for clean UX
      else window.open('https://bidsmith.pro/pricing', '_blank');
    } catch {
      window.open('https://bidsmith.pro/pricing', '_blank');
    } finally {
      setUnlocking(false);
    }
  };

  if (!hasAudit) return null;

  // While checking DB after payment redirect, show a subtle spinner
  if (checkingPayment) {
    return (
      <div style={pw.wrap}>
        <div style={{ ...pw.statusBadge, ...pw.statusChecking }}>Unlock status: Verifying…</div>
        <div style={pw.preview}>{children}</div>
        <div style={pw.overlay}>
          <div style={pw.lockCard}>
            <p style={{ ...pw.lockTitle, fontSize: 13 }}>Verifying payment…</p>
            <p style={pw.lockSub}>Hang tight while we confirm your unlock.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fully unlocked — render children without any gate
  if (isPaid) {
    return (
      <div style={pw.wrap}>
        <div style={{ ...pw.statusBadge, ...badgeStyle }}>Unlock status: {reasonLabel}</div>
        {children}
      </div>
    );
  }

  return (
    <div style={pw.wrap}>
      <div style={{ ...pw.statusBadge, ...badgeStyle }}>Unlock status: Locked</div>
      {/* Preview — blurred teaser of first few rows */}
      <div style={pw.preview}>{children}</div>

      {/* Lock overlay */}
      <div style={pw.overlay}>
        <div style={pw.lockCard}>
          <div style={pw.lockIcon}>🔒</div>
          <p style={pw.lockTitle}>Full Risk Analysis Locked</p>
          <p style={pw.lockSub}>
            You're seeing the teaser. Unlock the complete compliance matrix,
            proposal roadmap, disqualifier flags, and export tools.
          </p>
          <div style={pw.featureList}>
            {[
              'Full compliance matrix (all requirements)',
              'Proposal roadmap + section guidance',
              'Disqualifier deep-dive + FAR citations',
              'Export to CSV / copy bid brief',
            ].map(f => (
              <div key={f} style={pw.featureRow}>
                <span style={{ color: '#22c55e', fontSize: 11 }}>✓</span>
                <span style={pw.featureText}>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={handleUnlock} disabled={unlocking} style={{ ...pw.cta, opacity: unlocking ? 0.6 : 1 }}>
            {unlocking ? 'Redirecting to checkout…' : 'Unlock Full Analysis — $99'}
          </button>
          <p style={pw.ctaSub}>One-time · Per solicitation · Instant access</p>
        </div>
      </div>
    </div>
  );
}

const pw = {
  wrap: {
    position: 'relative',
    paddingTop: 28,
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    left: 28,
    zIndex: 2,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    borderRadius: 999,
    padding: '5px 10px',
    border: '1px solid',
    width: 'fit-content',
  },
  statusUnlocked: {
    color: '#22c55e',
    background: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.26)',
  },
  statusLocked: {
    color: '#f59e0b',
    background: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.28)',
  },
  statusChecking: {
    color: '#60a5fa',
    background: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.28)',
  },
  preview: {
    maxHeight: 240,
    overflow: 'hidden',
    maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
    pointerEvents: 'none',
  },
  overlay: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px 28px 32px',
  },
  lockCard: {
    width: '100%', maxWidth: 480,
    background: '#0f0f0f',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    padding: '28px 28px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, textAlign: 'center',
  },
  lockIcon: { fontSize: 28 },
  lockTitle: {
    margin: 0, fontSize: 16, fontWeight: 700,
    color: '#f9fafb', letterSpacing: '-0.02em',
  },
  lockSub: {
    margin: 0, fontSize: 12, color: '#6b7280',
    lineHeight: 1.6, maxWidth: 360,
  },
  featureList: {
    display: 'flex', flexDirection: 'column', gap: 6,
    alignSelf: 'stretch', margin: '4px 0',
  },
  featureRow: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    textAlign: 'left',
  },
  featureText: { fontSize: 12, color: '#9ca3af' },
  cta: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', transition: 'opacity 0.15s',
    letterSpacing: '-0.01em', marginTop: 4,
  },
  ctaSub: {
    margin: 0, fontSize: 10, color: '#374151',
  },
};

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

// ── Command Center Sidebar ─────────────────────────────────────────────────
function Sidebar({ user, auditHistory, loadingHistory, activeAuditId, onSelectAudit, onNewAudit, billingStatus = null }) {
  const { signOut } = useClerk();

  const verdictColor = (v) =>
    v === 'BID' ? '#22c55e' : v === 'NO-BID' ? '#ef4444' : '#f59e0b';

  return (
    <div style={sb.sidebar}>
      {/* Logo */}
      <div style={sb.logoRow}>
        <div style={sb.logoMark}><Shield size={13} color="#3b82f6" /></div>
        <span style={sb.logoText}>BidSmith</span>
      </div>

      {/* New Audit */}
      <button onClick={onNewAudit} style={sb.newBtn}>
        <Plus size={12} />
        New Audit
      </button>

      {/* History */}
      <div style={sb.sectionLabel}>RECENT AUDITS</div>
      <div style={sb.historyList}>
        {loadingHistory ? (
          <div style={sb.historyEmpty}>Loading…</div>
        ) : auditHistory.length === 0 ? (
          <div style={sb.historyEmpty}>No audits yet</div>
        ) : (
          auditHistory.map(a => {
            const isActive = a.id === activeAuditId;
            const rec = a.audit_result?.verdict?.recommendation || a.verdict || '–';
            return (
              <button
                key={a.id}
                onClick={() => onSelectAudit(a)}
                style={{ ...sb.historyItem, background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent', borderColor: isActive ? 'rgba(59,130,246,0.2)' : 'transparent' }}
              >
                <div style={sb.historyTop}>
                  <span style={{ ...sb.historyVerdict, color: verdictColor(rec) }}>{rec}</span>
                  <span style={sb.historyDate}>
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
                <div style={sb.historyTitle}>
                  {(a.title || a.audit_result?.title || 'Untitled Solicitation').slice(0, 36)}
                </div>
                <div style={sb.historyAgency}>
                  {(a.agency || a.audit_result?.agency || '').slice(0, 32)}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer — user + logout */}
      <div style={sb.footer}>
        <div style={sb.footerMeta}>
          {user?.email && (
            <div style={sb.userRow}>
              <div style={sb.userAvatar}>
                {(user.email[0] || 'U').toUpperCase()}
              </div>
              <span style={sb.userEmail} title={user.email}>
                {user.email.split('@')[0]}
              </span>
            </div>
          )}
          {billingStatus && (
            <div style={sb.billingPill}>
              {billingStatus}
            </div>
          )}
        </div>
        <button onClick={() => signOut()} style={sb.logoutBtn} title="Sign out">
          <LogOut size={12} />
        </button>
      </div>
    </div>
  );
}

const sb = {
  sidebar: {
    width: 220, minWidth: 220, flexShrink: 0,
    background: '#0a0a0a',
    borderRight: '1px solid #111',
    display: 'flex', flexDirection: 'column',
    height: '100vh', position: 'sticky', top: 0,
    overflowY: 'auto', padding: '16px 0 0',
    scrollbarWidth: 'none',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 16px 18px', borderBottom: '1px solid #111',
  },
  logoMark: {
    width: 26, height: 26, borderRadius: 7,
    background: 'rgba(59,130,246,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 13, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.02em' },
  newBtn: {
    margin: '14px 12px 6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 0',
    background: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 8, color: '#60a5fa',
    fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    letterSpacing: '-0.01em',
  },
  sectionLabel: {
    padding: '12px 16px 6px',
    fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
    color: '#2a2a2a', textTransform: 'uppercase',
  },
  historyList: { flex: 1, overflowY: 'auto', padding: '0 8px', scrollbarWidth: 'none' },
  historyEmpty: { fontSize: 11, color: '#2a2a2a', padding: '8px 8px', textAlign: 'center' },
  historyItem: {
    width: '100%', textAlign: 'left',
    padding: '9px 10px', borderRadius: 7,
    border: '1px solid transparent',
    cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s',
    marginBottom: 2,
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyVerdict: { fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em' },
  historyDate: { fontSize: '9px', color: '#374151' },
  historyTitle: { fontSize: '11px', fontWeight: 500, color: '#9ca3af', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  historyAgency: { fontSize: '10px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  footer: {
    borderTop: '1px solid #111',
    padding: '12px 12px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    marginTop: 'auto',
  },
  footerMeta: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: 6,
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  userAvatar: {
    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: 700, color: '#60a5fa',
  },
  userEmail: { fontSize: 11, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  billingPill: {
    fontSize: 10,
    color: '#22c55e',
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 999,
    padding: '2px 8px',
    width: 'fit-content',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 700,
  },
  logoutBtn: {
    flexShrink: 0, width: 28, height: 28, borderRadius: 7,
    background: 'transparent', border: '1px solid #1a1a1a',
    color: '#4b5563', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
};

// ── Main page ─────────────────────────────────────────────────────────────
export default function BentoDashboard({ user = null, onBack }) {
  const { user: clerkUser } = useUser();
  const [auditResult, setAuditResult] = useState(null);
  const [activeAuditId, setActiveAuditId] = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [toast, setToast]             = useState(null);
  const [health, setHealth]           = useState(null);
  const [featuredUrl, setFeaturedUrl] = useState(null); // set when featured RFP clicked

  // Payment / unlock state
  const [isPaid, setIsPaid]               = useState(false);
  const [demoUnlocked, setDemoUnlocked]   = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(false);

  // Audit history (sidebar)
  const [auditHistory, setAuditHistory]       = useState([]);
  const [loadingHistory, setLoadingHistory]   = useState(false);

  // Chat overlay state
  const [chatMode, setChatMode]       = useState(false);
  const [chatContext, setChatContext]  = useState(null);
  const [colVisible, setColVisible]   = useState(true);
  const clerkSubscribed = clerkUser?.publicMetadata?.isSubscribed === true;
  const isSubscribed = clerkSubscribed || user?.isSubscribed === true;
  const activePlan = clerkUser?.publicMetadata?.plan || user?.plan || null;
  const subscriptionUpdatedAt = clerkUser?.publicMetadata?.subscriptionUpdatedAt || user?.subscriptionUpdatedAt || null;
  const accessUnlocked = isSubscribed || isPaid || demoUnlocked;
  const billingStatus = isSubscribed ? `${activePlan || "active"}` : null;

  // Health probe
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? r.json() : null)
      .then(d => setHealth(d))
      .catch(() => setHealth(null));
  }, []);

  // Audit history — fetch on mount if user is present
  const fetchHistory = useCallback(() => {
    if (!user?.id) return;
    setLoadingHistory(true);
    fetch('/api/audits?limit=20', { headers: { 'x-user-id': user.id } })
      .then(r => r.ok ? r.json() : { audits: [] })
      .then(d => setAuditHistory(Array.isArray(d.audits) ? d.audits : []))
      .catch(() => setAuditHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [user?.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Payment status helper ──────────────────────────────────────────────────
  const fetchPaymentStatus = useCallback(async (solId) => {
    if (!user?.id || !solId) return;
    if (isSubscribed) {
      setIsPaid(true);
      setCheckingPayment(false);
      return;
    }
    setCheckingPayment(true);
    try {
      const res = await fetch(`/api/payment/status?uid=${encodeURIComponent(user.id)}&solicitation_id=${encodeURIComponent(solId)}`);
      const data = await res.json();
      setIsPaid(!!data.paid);
    } catch {
      setIsPaid(false);
    } finally {
      setCheckingPayment(false);
    }
  }, [isSubscribed, user?.id]);

  // Poll Clerk metadata after subscription checkout return.
  const syncSubscriptionStatus = useCallback(async () => {
    if (!clerkUser) return false;
    setSyncingSubscription(true);
    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await clerkUser.reload();
        const subscribed = clerkUser.publicMetadata?.isSubscribed === true;
        if (subscribed) return true;
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      return false;
    } catch {
      return false;
    } finally {
      setSyncingSubscription(false);
    }
  }, [clerkUser]);

  // ── Checkout redirect param detection ─────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const sid = params.get('sid');
    const source = params.get('source');
    const plan = params.get('plan');
    if (checkoutStatus === 'success') {
      if (source === 'subscription') {
        showToast('Payment received. Activating subscription…', 'info');
        syncSubscriptionStatus().then((ok) => {
          if (ok) {
            showToast(`Subscription active${plan ? `: ${plan}` : ''}. Full dashboard unlocked.`, 'success');
          } else {
            showToast('Payment received. Subscription sync is still processing — refresh in 10 seconds.', 'info');
          }
        });
      } else {
        showToast('Payment successful — Audit unlocked!', 'success');
      }
      if (sid) setTimeout(() => fetchPaymentStatus(sid), 1500); // slight delay for webhook
      // Clean the URL param without reloading
      const clean = window.location.pathname;
      window.history.replaceState({}, '', clean);
    } else if (checkoutStatus === 'cancelled') {
      showToast('Payment cancelled. Your audit preview is still available.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchPaymentStatus, syncSubscriptionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectAudit = (historyEntry) => {
    const result = historyEntry.audit_result;
    if (result) {
      setAuditResult(result);
      setActiveAuditId(historyEntry.id);
      setDemoUnlocked(false);
      setIsPaid(isSubscribed);
      const solId = result?.solicitation_number || result?.opportunity_id;
      if (solId) fetchPaymentStatus(solId);
      if (chatMode) resetChatMode();
      showToast(`Loaded: ${result.title?.slice(0, 40) || 'Audit'}`, 'info');
    }
  };

  const handleNewAudit = () => {
    setAuditResult(null);
    setActiveAuditId(null);
    setAnalyzing(false);
    setDemoUnlocked(false);
    if (chatMode) resetChatMode();
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Step ticker: advances every ~8s to simulate 4-stage pipeline
  const stepTimerRef = useRef(null);

  const handleStart = () => {
    setAnalyzing(true);
    setAuditResult(null);
    setDemoUnlocked(false);
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
    (stepTimerRef.current || []).forEach(clearTimeout);
    stepTimerRef.current = [];
    setAnalysisStep(ANALYSIS_STEPS.length);
    setAuditResult(data);
    setActiveAuditId(null); // fresh audit, not from history
    setAnalyzing(false);
    setIsPaid(isSubscribed); // subscribers remain unlocked on all audits
    if (chatMode) resetChatMode();
    const cacheMsg = data?.meta?.cache_hit
      ? 'Audit loaded from cache (0s latency)'
      : 'Audit complete';
    showToast(cacheMsg, 'success');
    // Check if this audit was already paid for (e.g. returning user)
    const solId = data?.solicitation_number || data?.opportunity_id;
    if (solId) fetchPaymentStatus(solId);
    // Refresh history sidebar so new audit appears immediately
    setTimeout(fetchHistory, 800);
  };

  const handleFeaturedSelect = async (rfp) => {
    if (!rfp) return;
    if (!rfp.demo || !rfp.demoId) {
      setDemoUnlocked(false);
      setFeaturedUrl(null);
      setTimeout(() => setFeaturedUrl(rfp.url), 10);
      return;
    }

    handleStart();
    try {
      const res = await fetch(`/api/featured/${encodeURIComponent(rfp.demoId)}`);
      const data = await res.json();
      const cacheHeader = (res.headers.get('x-bidsmith-cache') || res.headers.get('x-cache') || '').toLowerCase();
      const cacheHitFromHeader = cacheHeader.includes('hit');
      const normalized = {
        ...data,
        meta: {
          ...(data.meta || {}),
          cache_hit: data?.meta?.cache_hit === true || cacheHitFromHeader || data?.isCached === true,
        },
      };
      if (!res.ok || normalized?.error) {
        throw new Error(normalized?.error || 'Unable to load featured audit.');
      }
      setDemoUnlocked(true);
      handleResult(normalized);
      showToast('Demo solicitation loaded instantly (paywall bypass enabled).', 'success');
    } catch (err) {
      setDemoUnlocked(false);
      setAnalyzing(false);
      showToast(err.message || 'Featured solicitation failed to load.', 'error');
    }
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
    <div style={s.shell}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        user={user}
        auditHistory={auditHistory}
        loadingHistory={loadingHistory}
        activeAuditId={activeAuditId}
        onSelectAudit={handleSelectAudit}
        onNewAudit={handleNewAudit}
        billingStatus={billingStatus}
      />

      {/* ── Main scrollable content ──────────────────────────────────────── */}
      <div style={s.page}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header style={s.topBar}>
        <div style={s.topBarLeft}>
          <LayoutDashboard size={13} color="#4b5563" />
          <span style={s.logoSub}>Command Center</span>
          {auditResult && (
            <>
              <span style={s.logoSep}>/</span>
              <span style={{ ...s.logoSub, color: '#9ca3af', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {auditResult.title?.slice(0, 50) || auditResult.solicitation_number || 'Active Audit'}
              </span>
            </>
          )}
        </div>

        <div style={s.topBarRight}>
          {isSubscribed && (
            <div style={{ ...s.healthPill, background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.15)' }}>
              <span style={{ ...s.healthDot, background: '#22c55e' }} />
              <span style={{ ...s.healthLabel, color: '#22c55e' }}>
                Plan: {(activePlan || 'active').toUpperCase()}
              </span>
            </div>
          )}
          {syncingSubscription && (
            <div style={{ ...s.healthPill, background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <span style={{ ...s.healthDot, background: '#3b82f6' }} />
              <span style={{ ...s.healthLabel, color: '#60a5fa' }}>Syncing subscription...</span>
            </div>
          )}
          {health && (
            <div style={s.healthPill}>
              <span style={s.healthDot} />
              <span style={s.healthLabel}>API Online</span>
            </div>
          )}
          {subscriptionUpdatedAt && isSubscribed && (
            <div style={s.healthPill}>
              <span style={s.healthLabel}>
                Updated {new Date(subscriptionUpdatedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {auditResult?.meta?.cache_hit && (
            <div style={{ ...s.healthPill, background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.15)' }}>
              <span style={{ ...s.healthDot, background: '#22c55e' }} />
              <span style={{ ...s.healthLabel, color: '#22c55e' }}>Cache Hit</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <div style={s.titleBlock}>
        <h1 style={s.pageTitle}>RFP Intelligence</h1>
        <p style={s.pageSubtitle}>
          Paste a SAM.gov link or upload a PDF — bid/no-bid verdict in 90 seconds.
        </p>
      </div>

      {/* ── Hot RFPs this week ───────────────────────────────────────────── */}
      <FeaturedSolicitations onSelect={handleFeaturedSelect} />

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
              user={user}
            />
          ) : (
            <RfpUploadZone
              onStart={handleStart}
              onResult={handleResult}
              onError={handleError}
              initialUrl={featuredUrl}
              user={user}
            />
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

      {/* ── Bento Row 3 — Bid Output + Submission Checklist ────────────── */}
      <div style={s.row3}>
        <BidOutputCard auditResult={auditResult} loading={analyzing} />
        <SubmissionChecklist auditResult={auditResult} loading={analyzing} />
      </div>

      {/* ── Paywall gate — full risk analysis ───────────────────────────── */}
      <PaywallGate
        hasAudit={!!auditResult && !analyzing}
        isPaid={accessUnlocked}
        checkingPayment={checkingPayment}
        unlockReason={isSubscribed ? 'subscription' : demoUnlocked ? 'demo' : isPaid ? 'payment' : 'locked'}
        solicitationId={auditResult?.solicitation_number || auditResult?.opportunity_id || ''}
        opportunityTitle={auditResult?.title || ''}
        uid={user?.id || 'anonymous'}
      >
        <div style={{ padding: '0 28px' }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: '20px 20px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#4b5563', textTransform: 'uppercase' }}>Full Compliance Matrix</p>
            {(auditResult?.requirements || []).slice(0, 3).map((req, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: req.risk === 'HIGH' ? '#dc2626' : req.risk === 'LOW' ? '#22c55e' : '#f59e0b', width: 36, flexShrink: 0, paddingTop: 1 }}>{req.risk}</span>
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.4 }}>{req.requirement}</p>
              </div>
            ))}
          </div>
        </div>
      </PaywallGate>

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
        .bs-sidebar::-webkit-scrollbar { display: none; }
      `}</style>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
  // Outer flex container — sidebar + main
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: '#080808',
    fontFamily: '"Inter", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#f9fafb',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  // Scrollable main column
  page: {
    flex: 1,
    minWidth: 0,
    overflowX: 'hidden',
    padding: '0 0 60px',
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
    WebkitBackdropFilter: 'blur(12px)',
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
    WebkitTransform: 'translateZ(0)',
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
    WebkitTransform: 'translateZ(0)',
  },
  row3: {
    padding: '14px 28px 0',
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
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
    WebkitBackdropFilter: 'blur(8px)',
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
