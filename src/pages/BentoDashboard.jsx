/**
 * BentoDashboard — The BidSmith Command Center.
 *
 * Layout: collapsible left rail (files, solicitation, history) |
 *   center conversation + hot RFPs + paywall |
 *   collapsible right rail (agents, sources, brief, eval).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Shield, ArrowUpRight, Send, RotateCcw,
         Loader2, ExternalLink, AlertTriangle,
         Clock, ChevronRight, LogOut, Plus, LayoutDashboard,
         PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Cpu, Download } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
import RfpUploadZone   from '../components/bento/RfpUploadZone';
import LiveAnalysisCard from '../components/bento/LiveAnalysisCard';
import EvalStatusCard  from '../components/bento/EvalStatusCard';
import BidOutputCard   from '../components/bento/BidOutputCard';
import HumanWalkthroughCTA from '../components/HumanWalkthroughCTA.jsx';
import { downloadComplianceMatrixXlsx } from '../utils/complianceMatrixXlsx';
import { trackEvent } from '../utils/analytics';

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

const DEFAULT_CHAT_WELCOME =
  "I'm ARIS — your GovCon advisor inside BidSmith.\n\nPaste a **SAM.gov opportunity URL** here, upload a **PDF** from the **Files** tab on the left, or ask a federal contracting question. I'll use your loaded audit when you have one.";

const RAIL_W = 300;

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

// ── Center column: conversational ARIS (messages driven by parent) ────────────
function WorkspaceChat({
  messages,
  loading,
  onSend,
  placeholder,
  headerBadge,
  headerBadgeColor,
  headerTitle = 'Conversation',
  onClearThread,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const submit = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    onSend(text);
  };

  return (
    <div style={cs.shell}>
      <div style={cs.header}>
        <div style={cs.headerLeft}>
          <span style={{
            ...cs.badge,
            color: headerBadgeColor,
            borderColor: `${headerBadgeColor}44`,
            background: `${headerBadgeColor}14`,
          }}>
            {headerBadge}
          </span>
          <span style={cs.headerTitle}>{headerTitle}</span>
        </div>
        {onClearThread && (
          <button type="button" onClick={onClearThread} style={cs.resetBtn} title="Reset conversation">
            <RotateCcw size={12} style={{ marginRight: 5 }} /> Clear chat
          </button>
        )}
      </div>

      <div style={cs.thread} className="workspace-chat-thread">
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={cs.aiAvatar}>
                <Shield size={10} color="#1a73e8" />
              </div>
            )}
            <div style={{
              ...cs.bubble,
              background: msg.role === 'user' ? '#e8f0fe' : '#f8f9fa',
              borderColor: msg.role === 'user' ? '#d2e3fc' : '#e8eaed',
              color: '#202124',
              maxWidth: msg.role === 'user' ? '82%' : '92%',
              borderRadius: 8,
            }}>
              {msg.role === 'ai' && (msg.plan?.steps?.length > 0 || msg.plan?.next_action) && (
                <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: '#e8f0fe', border: '1px solid #d2e3fc' }}>
                  {msg.plan.steps?.length > 0 && (
                    <>
                      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, color: '#1967d2' }}>Plan</p>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#202124', lineHeight: 1.45 }}>
                        {msg.plan.steps.map((s) => (
                          <li key={s.id} style={{ marginBottom: 2 }}>{s.status === 'done' ? '✓ ' : '○ '}{s.title}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {msg.plan.next_action ? (
                    <p style={{ margin: msg.plan.steps?.length ? '6px 0 0' : 0, fontSize: 13, color: '#1967d2', fontWeight: 500 }}>Next: {msg.plan.next_action}</p>
                  ) : null}
                </div>
              )}
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
              ))}
              {msg.role === 'ai' && msg.externalLinks?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {msg.externalLinks.map((link, i) => (
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
            <div style={cs.aiAvatar}><Shield size={10} color="#1a73e8" /></div>
            <div style={{ ...cs.bubble, background: '#f1f3f4', borderColor: '#e8eaed' }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#80868b', animation: `bounce 1.2s ${i * 0.2}s infinite`, display: 'inline-block' }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={cs.inputWrap}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={placeholder}
          rows={1}
          style={cs.textarea}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!input.trim() || loading}
          style={{ ...cs.sendBtn, opacity: !input.trim() || loading ? 0.4 : 1 }}
        >
          {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}

const cs = {
  shell: {
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    flex: 1,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderBottom: '1px solid #e8eaed',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 13, fontWeight: 500, color: '#5f6368' },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.04em',
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid',
    textTransform: 'uppercase',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: '#1a73e8',
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    padding: '6px 8px',
    cursor: 'pointer',
  },
  thread: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '12px 14px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    scrollbarWidth: 'thin',
  },
  aiAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    flexShrink: 0,
    background: '#e8f0fe',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    fontSize: 14,
    lineHeight: 1.55,
    color: '#202124',
    padding: '10px 14px',
    border: '1px solid #e8eaed',
    wordBreak: 'break-word',
    borderRadius: 8,
    background: '#f8f9fa',
  },
  extLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    color: '#1967d2',
    background: '#e8f0fe',
    border: '1px solid #d2e3fc',
    borderRadius: 4,
    padding: '4px 8px',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  inputWrap: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    padding: '10px 12px 12px',
    borderTop: '1px solid #e8eaed',
    flexShrink: 0,
    background: '#fff',
  },
  textarea: {
    flex: 1,
    background: '#f8f9fa',
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#202124',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none',
    lineHeight: 1.45,
    maxHeight: 100,
    overflowY: 'auto',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
    background: '#1a73e8',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s',
  },
};

const rail = {
  outer: (open) => ({
    width: open ? RAIL_W : 0,
    minWidth: open ? RAIL_W : 0,
    flexShrink: 0,
    borderRight: '1px solid #dadce0',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'width 0.2s ease, min-width 0.2s ease',
  }),
  outerRight: (open) => ({
    width: open ? RAIL_W : 0,
    minWidth: open ? RAIL_W : 0,
    flexShrink: 0,
    borderLeft: '1px solid #dadce0',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'width 0.2s ease, min-width 0.2s ease',
  }),
  inner: {
    width: RAIL_W,
    minWidth: RAIL_W,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid #e8eaed',
    flexShrink: 0,
  },
  headTitle: { fontSize: 13, fontWeight: 500, color: '#202124' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #dadce0',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#5f6368',
  },
  tabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid #e8eaed',
    flexShrink: 0,
    padding: '0 6px',
  },
  tab: (on) => ({
    flex: 1,
    padding: '8px 4px',
    fontSize: 11,
    fontWeight: on ? 600 : 400,
    color: on ? '#1967d2' : '#5f6368',
    background: 'transparent',
    border: 'none',
    borderBottom: on ? '2px solid #1a73e8' : '2px solid transparent',
    cursor: 'pointer',
    marginBottom: -1,
  }),
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '10px 12px',
    scrollbarWidth: 'thin',
  },
  sourceRow: {
    padding: '10px 0',
    borderBottom: '1px solid #e8eaed',
    fontSize: 12,
    color: '#202124',
    lineHeight: 1.45,
  },
  sourceMeta: { fontSize: 10, color: '#80868b', marginBottom: 4, fontWeight: 500 },
  agentRow: {
    padding: '8px 0',
    fontSize: 12,
    color: '#5f6368',
    borderBottom: '1px solid #f1f3f4',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  detailLabel: { fontSize: 11, color: '#80868b', marginBottom: 2 },
  detailVal: { fontSize: 13, color: '#202124', marginBottom: 10, lineHeight: 1.4 },
  edgeToggle: (side) => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [side]: 0,
    zIndex: 20,
    width: 22,
    height: 48,
    border: '1px solid #dadce0',
    background: '#fff',
    borderRadius: side === 'left' ? '0 8px 8px 0' : '8px 0 0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#5f6368',
    boxShadow: '0 1px 2px rgba(60,64,67,0.12)',
  }),
};

function LeftWorkspaceRail({
  open,
  onToggle,
  tab,
  setTab,
  user,
  auditHistory,
  loadingHistory,
  activeAuditId,
  onSelectAudit,
  onNewAudit,
  billingStatus,
  onStart,
  onResult,
  onError,
  initialUrl,
  auditResult,
}) {
  const { signOut } = useClerk();
  const verdictColor = (v) =>
    v === 'BID' ? '#1e8e3e' : v === 'NO-BID' ? '#d93025' : '#f9ab00';

  return (
    <div style={rail.outer(open)}>
      <div style={rail.inner}>
        <div style={rail.head}>
          <span style={rail.headTitle}>Workspace</span>
          <button type="button" style={rail.iconBtn} onClick={onToggle} title="Collapse panel">
            <PanelLeftClose size={16} />
          </button>
        </div>
        <div style={rail.tabs}>
          <button type="button" style={rail.tab(tab === 'files')} onClick={() => setTab('files')}>Files</button>
          <button type="button" style={rail.tab(tab === 'details')} onClick={() => setTab('details')}>Solicitation</button>
          <button type="button" style={rail.tab(tab === 'history')} onClick={() => setTab('history')}>History</button>
        </div>
        <div style={rail.body}>
          {tab === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button type="button" onClick={onNewAudit} style={sb.newBtn}>
                <Plus size={12} /> New audit
              </button>
              <RfpUploadZone
                variant="card"
                onStart={onStart}
                onResult={onResult}
                onError={onError}
                initialUrl={initialUrl}
                user={user}
              />
            </div>
          )}
          {tab === 'details' && (
            <div>
              {!auditResult ? (
                <p style={{ margin: 0, fontSize: 13, color: '#80868b', lineHeight: 1.5 }}>
                  Run an audit or pick one from History. Extracted solicitation fields and summary appear here.
                </p>
              ) : (
                <>
                  <p style={rail.detailLabel}>Title</p>
                  <p style={rail.detailVal}>{auditResult.title || '—'}</p>
                  <p style={rail.detailLabel}>Solicitation</p>
                  <p style={rail.detailVal}>{auditResult.solicitation_number || auditResult.opportunity_id || '—'}</p>
                  <p style={rail.detailLabel}>Agency</p>
                  <p style={rail.detailVal}>{auditResult.agency || '—'}</p>
                  <p style={rail.detailLabel}>Due date</p>
                  <p style={rail.detailVal}>{auditResult.due_date || '—'}</p>
                  <p style={rail.detailLabel}>Set-aside</p>
                  <p style={rail.detailVal}>{auditResult.set_aside_type || '—'}</p>
                  <p style={rail.detailLabel}>Contract type</p>
                  <p style={rail.detailVal}>{auditResult.contract_type || '—'}</p>
                  <p style={rail.detailLabel}>Executive summary</p>
                  <p style={{ ...rail.detailVal, fontSize: 12, color: '#5f6368' }}>
                    {(auditResult.executiveSummary || '').slice(0, 520)}{(auditResult.executiveSummary || '').length > 520 ? '…' : ''}
                  </p>
                  {auditResult.sam_url && (
                    <a href={auditResult.sam_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1967d2' }}>
                      Open SAM.gov →
                    </a>
                  )}
                </>
              )}
            </div>
          )}
          {tab === 'history' && (
            <div>
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
                      type="button"
                      onClick={() => onSelectAudit(a)}
                      style={{
                        ...sb.historyItem,
                        background: isActive ? '#e8f0fe' : 'transparent',
                        borderColor: 'transparent',
                      }}
                    >
                      <div style={sb.historyTop}>
                        <span style={{ ...sb.historyVerdict, color: verdictColor(rec) }}>{rec}</span>
                        <span style={sb.historyDate}>
                          {a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                      <div style={sb.historyTitle}>
                        {(a.title || a.audit_result?.title || 'Untitled').slice(0, 40)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        <div style={{ ...sb.footer, marginTop: 'auto', borderTop: '1px solid #e8eaed' }}>
          <div style={sb.footerMeta}>
            {user?.email && (
              <div style={sb.userRow}>
                <div style={sb.userAvatar}>{(user.email[0] || 'U').toUpperCase()}</div>
                <span style={sb.userEmail} title={user.email}>{user.email.split('@')[0]}</span>
              </div>
            )}
            {billingStatus && <div style={sb.billingPill}>{billingStatus}</div>}
          </div>
          <button type="button" onClick={() => signOut()} style={sb.logoutBtn} title="Sign out">
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RightWorkspaceRail({
  open,
  onToggle,
  tab,
  setTab,
  auditResult,
  analyzing,
  analysisStep,
}) {
  const reqs = Array.isArray(auditResult?.requirements) ? auditResult.requirements : [];
  return (
    <div style={rail.outerRight(open)}>
      <div style={rail.inner}>
        <div style={rail.head}>
          <span style={rail.headTitle}>Analysis</span>
          <button type="button" style={rail.iconBtn} onClick={onToggle} title="Collapse panel">
            <PanelRightClose size={16} />
          </button>
        </div>
        <div style={rail.tabs}>
          <button type="button" style={rail.tab(tab === 'agents')} onClick={() => setTab('agents')}>Agents</button>
          <button type="button" style={rail.tab(tab === 'sources')} onClick={() => setTab('sources')}>Sources</button>
          <button type="button" style={rail.tab(tab === 'brief')} onClick={() => setTab('brief')}>Brief</button>
          <button type="button" style={rail.tab(tab === 'eval')} onClick={() => setTab('eval')}>Eval</button>
        </div>
        <div style={rail.body}>
          {tab === 'agents' && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 500, color: '#80868b' }}>Pipeline</p>
              {ANALYSIS_STEPS.map((step, i) => (
                <div key={step.id} style={rail.agentRow}>
                  <Cpu size={14} color={i <= analysisStep ? '#1a73e8' : '#dadce0'} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: i === analysisStep && analyzing ? 600 : 400, color: '#202124' }}>{step.label}</div>
                    <div style={{ fontSize: 11, color: '#80868b', marginTop: 2 }}>{step.detail}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, borderTop: '1px solid #e8eaed', paddingTop: 12 }}>
                <LiveAnalysisCard
                  auditResult={auditResult}
                  loading={analyzing}
                  inquiryMode={!auditResult && !analyzing}
                  analysisProgress={analyzing ? <AnalysisProgress activeStep={analysisStep} /> : null}
                />
              </div>
            </div>
          )}
          {tab === 'sources' && (
            <div>
              {!reqs.length ? (
                <p style={{ margin: 0, fontSize: 13, color: '#80868b' }}>Requirement citations and excerpts appear after an audit.</p>
              ) : (
                reqs.map((r, i) => (
                  <div key={r.id || i} style={rail.sourceRow}>
                    <div style={rail.sourceMeta}>
                      {r.id || `REQ-${i + 1}`}
                      {r.section ? ` · ${r.section}` : ''}
                      {r.risk ? ` · ${r.risk}` : ''}
                    </div>
                    <div>{r.requirement || r.text || '—'}</div>
                    {(r.source_excerpt || r.sourceExcerpt) && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#5f6368', fontStyle: 'italic', lineHeight: 1.4 }}>
                        “{String(r.source_excerpt || r.sourceExcerpt).slice(0, 280)}{String(r.source_excerpt || r.sourceExcerpt).length > 280 ? '…' : ''}”
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {tab === 'brief' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <BidOutputCard auditResult={auditResult} loading={analyzing} />
              <SubmissionChecklist auditResult={auditResult} loading={analyzing} />
            </div>
          )}
          {tab === 'eval' && <EvalStatusCard />}
        </div>
      </div>
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

function FeaturedSolicitations({ onSelect, dock = false }) {
  const cards = FEATURED_RFPS.map((rfp) => (
    <button
      key={rfp.id}
      type="button"
      onClick={() => onSelect(rfp)}
      style={dock ? fs.cardDock : fs.card}
    >
      <div style={fs.cardTop}>
        <span
          style={{
            ...fs.tag,
            color: rfp.tagColor,
            borderColor: `${rfp.tagColor}40`,
            background: `${rfp.tagColor}12`,
          }}
        >
          {rfp.tag}
        </span>
        <span style={fs.naics}>NAICS {rfp.naics}</span>
      </div>
      <p style={dock ? fs.titleDock : fs.title}>{rfp.title}</p>
      <p style={dock ? fs.agencyDock : fs.agency}>{rfp.agency}</p>
      <div style={fs.cardBottom}>
        <span style={fs.value}>{rfp.value}</span>
        <span style={fs.setAside}>{rfp.demo ? 'Demo' : rfp.setAside}</span>
      </div>
    </button>
  ));

  if (dock) {
    return (
      <div style={fs.dockWrap}>
        <div style={fs.dockHeader}>
          <span style={fs.dockEyebrow}>Hot RFPs</span>
          <span style={fs.dockSub}>Demo audits — tap a card</span>
        </div>
        <div style={fs.scrollDock}>{cards}</div>
      </div>
    );
  }

  return (
    <div style={fs.wrap}>
      <div style={fs.header}>
        <span style={fs.eyebrow}>HOT RFPs THIS WEEK</span>
        <span style={fs.sub}>Click any card to instantly run a cached demo audit →</span>
      </div>
      <div style={fs.scroll}>{cards}</div>
    </div>
  );
}

const fs = {
  wrap: {
    padding: '0 0 24px',
  },
  dockWrap: {
    width: '100%',
    maxWidth: 768,
    margin: '0 auto',
    paddingTop: 4,
  },
  dockHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 8,
    paddingLeft: 2,
  },
  dockEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#a3a3a3',
    textTransform: 'uppercase',
  },
  dockSub: {
    fontSize: 12,
    color: '#737373',
  },
  scrollDock: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 2,
    scrollbarWidth: 'thin',
  },
  header: {
    display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.02em',
    color: '#5f6368',
    textTransform: 'none',
  },
  sub: {
    fontSize: 13,
    color: '#80868b',
  },
  scroll: {
    display: 'flex', gap: 10, overflowX: 'auto',
    paddingBottom: 4, scrollbarWidth: 'none',
  },
  card: {
    flexShrink: 0,
    width: 200,
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 8,
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
  cardDock: {
    flexShrink: 0,
    width: 168,
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: '10px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    transition: 'border-color 0.15s, background 0.15s',
  },
  title: {
    margin: 0,
    fontSize: 13,
    fontWeight: 400,
    color: '#202124',
    lineHeight: 1.35,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  titleDock: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: '#ececec',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  agency: {
    margin: 0,
    fontSize: 12,
    color: '#5f6368',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  agencyDock: {
    margin: 0,
    fontSize: 10,
    color: '#a3a3a3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardBottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: 500,
    color: '#137333',
    letterSpacing: '-0.02em',
  },
  setAside: {
    fontSize: 11,
    fontWeight: 500,
    color: '#5f6368',
    background: '#f1f3f4',
    border: 'none',
    borderRadius: 4,
    padding: '2px 8px',
  },
};

// ── Submission Checklist — "Don't miss a deliverable" ─────────────────────
function SubmissionChecklist({ auditResult, loading = false }) {
  const checklist = auditResult?.submission_checklist || [];
  const incumbentSignals = auditResult?.incumbent_signals || [];
  const [checked, setChecked] = useState({});

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
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: '18px 20px',
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#1e8e3e',
    flexShrink: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 500,
    color: '#5f6368',
    letterSpacing: '0',
    textTransform: 'none',
  },
  badge: {
    fontSize: 11,
    fontWeight: 500,
    color: '#5f6368',
    background: '#f1f3f4',
    border: 'none',
    borderRadius: 4,
    padding: '2px 8px',
    letterSpacing: '0',
  },
};

// ── Paywall Gate — free teaser + locked full analysis ─────────────────────
function PaywallGate({
  children,
  hasAudit,
  isPaid = false,
  checkingPayment = false,
  reconcileOffered = false,
  onSyncPayment,
  syncPaymentBusy = false,
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
            <p style={{ ...pw.lockTitle, fontSize: 13 }}>Verifying your purchase with Stripe…</p>
            <p style={pw.lockSub}>Hang tight — we are confirming your payment in our system.</p>
          </div>
        </div>
      </div>
    );
  }

  // Webhook slow — offer manual sync (user already charged)
  if (reconcileOffered && !isPaid && onSyncPayment) {
    return (
      <div style={pw.wrap}>
        <div style={{ ...pw.statusBadge, ...pw.statusChecking }}>Unlock status: Confirming…</div>
        <div style={pw.preview}>{children}</div>
        <div style={pw.overlay}>
          <div style={pw.lockCard}>
            <p style={{ ...pw.lockTitle, fontSize: 13 }}>Almost there</p>
            <p style={pw.lockSub}>
              Your payment succeeded, but our servers are still catching up. Tap below to sync your
              access — or wait a moment and refresh.
            </p>
            <button
              type="button"
              onClick={onSyncPayment}
              disabled={syncPaymentBusy}
              style={{ ...pw.cta, opacity: syncPaymentBusy ? 0.6 : 1, marginTop: 6 }}
            >
              {syncPaymentBusy ? 'Syncing…' : 'Sync payment & unlock'}
            </button>
            <p style={pw.ctaSub}>Uses your Stripe receipt — no double charge</p>
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
          <p style={pw.lockTitle}>Full analysis</p>
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
                <span style={{ color: '#1e8e3e', fontSize: 12 }}>✓</span>
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
    paddingTop: 24,
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0',
    textTransform: 'none',
    borderRadius: 4,
    padding: '4px 10px',
    border: '1px solid #dadce0',
    width: 'fit-content',
    background: '#fff',
  },
  statusUnlocked: {
    color: '#137333',
    background: '#e6f4ea',
    borderColor: '#ceead6',
  },
  statusLocked: {
    color: '#b06000',
    background: '#fef7e0',
    borderColor: '#fdd663',
  },
  statusChecking: {
    color: '#1967d2',
    background: '#e8f0fe',
    borderColor: '#d2e3fc',
  },
  preview: {
    maxHeight: 240,
    overflow: 'hidden',
    maskImage: 'linear-gradient(to bottom, black 35%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, black 35%, transparent 100%)',
    pointerEvents: 'none',
  },
  overlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 0 24px',
  },
  lockCard: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: '24px 22px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    textAlign: 'left',
    boxShadow: '0 1px 2px rgba(60,64,67,0.08)',
  },
  lockIcon: { fontSize: 28 },
  lockTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 400,
    color: '#202124',
    letterSpacing: '-0.02em',
  },
  lockSub: {
    margin: 0,
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 1.5,
    maxWidth: 'none',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignSelf: 'stretch',
    margin: '4px 0',
  },
  featureRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    textAlign: 'left',
  },
  featureText: { fontSize: 14, color: '#202124' },
  cta: {
    padding: '10px 24px',
    background: '#1a73e8',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.15s, background 0.15s',
    letterSpacing: '0',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  ctaSub: {
    margin: 0,
    fontSize: 12,
    color: '#80868b',
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
              background: done ? '#e6f4ea' : active ? '#e8f0fe' : '#f1f3f4',
              border: `1.5px solid ${done ? '#ceead6' : active ? '#d2e3fc' : '#dadce0'}`,
            }}>
              {done ? (
                <span style={{ fontSize: 9, color: '#137333', fontWeight: 700 }}>✓</span>
              ) : active ? (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a73e8', animation: 'pulse 1.2s ease-in-out infinite', display: 'block' }} />
              ) : (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#dadce0', display: 'block' }} />
              )}
            </div>
            {/* Label */}
            <div style={{ minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: active ? 600 : 500,
                color: done ? '#80868b' : active ? '#202124' : '#5f6368',
                letterSpacing: '-0.01em',
              }}>{step.label}</p>
              {active && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#80868b', letterSpacing: '-0.01em' }}>
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

const sb = {
  newBtn: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 0',
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 24,
    color: '#1a73e8',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s, box-shadow 0.15s',
    letterSpacing: '-0.01em',
  },
  historyList: { flex: 1, overflowY: 'auto', padding: '0 8px', scrollbarWidth: 'thin' },
  historyEmpty: { fontSize: 13, color: '#80868b', padding: '12px 8px', textAlign: 'center' },
  historyItem: {
    width: '100%',
    textAlign: 'left',
    padding: '10px 10px',
    borderRadius: 8,
    border: '1px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background 0.12s',
    marginBottom: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyVerdict: { fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' },
  historyDate: { fontSize: 11, color: '#80868b' },
  historyTitle: {
    fontSize: 13,
    fontWeight: 400,
    color: '#202124',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  footer: {
    borderTop: '1px solid #dadce0',
    padding: '12px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
    background: '#fff',
  },
  footerMeta: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: 6,
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    flexShrink: 0,
    background: '#e8f0fe',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: '#1a73e8',
  },
  userEmail: {
    fontSize: 13,
    color: '#5f6368',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  billingPill: {
    fontSize: 11,
    color: '#137333',
    background: '#e6f4ea',
    border: 'none',
    borderRadius: 999,
    padding: '4px 10px',
    width: 'fit-content',
    textTransform: 'none',
    letterSpacing: '0',
    fontWeight: 500,
  },
  logoutBtn: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'transparent',
    border: '1px solid #dadce0',
    color: '#5f6368',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
};

// ── Main page ─────────────────────────────────────────────────────────────
export default function BentoDashboard({ user = null, onBack }) {
  const { user: clerkUser } = useUser();
  const billingUid = user?.id || clerkUser?.id || null;
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
  const [showPaymentSyncCta, setShowPaymentSyncCta] = useState(false);
  const [syncPaymentBusy, setSyncPaymentBusy] = useState(false);
  const pendingCheckoutSessionIdRef = useRef(null);
  const pendingCheckoutSidRef = useRef(null);

  // Audit history (left rail)
  const [auditHistory, setAuditHistory]       = useState([]);
  const [loadingHistory, setLoadingHistory]   = useState(false);

  // Three-panel workspace
  const [leftRailOpen, setLeftRailOpen]   = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [leftRailTab, setLeftRailTab]     = useState('files');
  const [rightRailTab, setRightRailTab]   = useState('agents');

  const [workspaceMessages, setWorkspaceMessages] = useState(() => [
    { role: 'ai', text: DEFAULT_CHAT_WELCOME, id: Date.now() },
  ]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [sessionApiContext, setSessionApiContext] = useState(null);
  const [chatHeaderBadge, setChatHeaderBadge]     = useState('ARIS');
  const [chatHeaderBadgeColor, setChatHeaderBadgeColor] = useState('#1a73e8');
  const [chatPlaceholder, setChatPlaceholder] = useState(
    'Paste a SAM.gov URL, ask a question, or use Files to upload a PDF…'
  );
  const wsMessagesRef = useRef(workspaceMessages);
  useEffect(() => { wsMessagesRef.current = workspaceMessages; }, [workspaceMessages]);

  const requestHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(user?.id ? { 'x-user-id': user.id } : {}),
    ...(user?.email ? { 'x-user-email': user.email } : {}),
    'x-subscribed': user?.isSubscribed ? 'true' : 'false',
  }), [user?.id, user?.email, user?.isSubscribed]);

  const resetWorkspaceChat = useCallback(() => {
    setWorkspaceMessages([{ role: 'ai', text: DEFAULT_CHAT_WELCOME, id: Date.now() }]);
    setSessionApiContext(null);
    setChatHeaderBadge('ARIS');
    setChatHeaderBadgeColor('#1a73e8');
    setChatPlaceholder('Paste a SAM.gov URL, ask a question, or use Files to upload a PDF…');
  }, []);
  const clerkSubscribed = clerkUser?.publicMetadata?.isSubscribed === true;
  const isSubscribed = clerkSubscribed || user?.isSubscribed === true;
  const activePlan = clerkUser?.publicMetadata?.plan || user?.plan || null;
  const subscriptionUpdatedAt = clerkUser?.publicMetadata?.subscriptionUpdatedAt || user?.subscriptionUpdatedAt || null;
  const accessUnlocked = isSubscribed || isPaid || demoUnlocked;
  const billingStatus = isSubscribed ? `${activePlan || "active"}` : null;

  const [exportMatrixXlsxLoading, setExportMatrixXlsxLoading] = useState(false);
  const exportMatrixBusyRef = useRef(false);
  const handleExportComplianceMatrixXlsx = useCallback(async () => {
    if (!auditResult || exportMatrixBusyRef.current) return;
    const rows = Array.isArray(auditResult?.requirements) ? auditResult.requirements : [];
    if (rows.length === 0) {
      setToast({ msg: 'Not enough data to export — run a full audit first', type: 'warning' });
      return;
    }
    trackEvent('export_compliance_matrix_xlsx', {
      category: 'conversion',
      solicitation: auditResult?.solicitation_number || auditResult?.id || null,
    });
    exportMatrixBusyRef.current = true;
    setExportMatrixXlsxLoading(true);
    try {
      await downloadComplianceMatrixXlsx(auditResult);
    } catch (e) {
      if (e?.code !== 'NO_COMPLIANCE_ROWS') {
        setToast({ msg: 'Export failed. Please try again.', type: 'error' });
      }
    } finally {
      exportMatrixBusyRef.current = false;
      setExportMatrixXlsxLoading(false);
    }
  }, [auditResult]);

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
    if (!billingUid || !solId) return;
    if (isSubscribed) {
      setIsPaid(true);
      setCheckingPayment(false);
      return;
    }
    setCheckingPayment(true);
    try {
      const res = await fetch(
        `/api/payment/status?uid=${encodeURIComponent(billingUid)}&solicitation_id=${encodeURIComponent(solId)}`
      );
      const data = await res.json();
      setIsPaid(!!data.paid);
    } catch {
      setIsPaid(false);
    } finally {
      setCheckingPayment(false);
    }
  }, [billingUid, isSubscribed]);

  /** Exponential backoff polling: 1s, 2s, 4s, 8s between checks (matches anti-fragile spec). */
  const pollPaymentStatus = useCallback(
    async (solId) => {
      if (!billingUid || !solId) return false;
      const gapsMs = [1000, 2000, 4000, 8000];
      for (let i = 0; i <= gapsMs.length; i += 1) {
        if (i > 0) await new Promise((r) => setTimeout(r, gapsMs[i - 1]));
        try {
          const res = await fetch(
            `/api/payment/status?uid=${encodeURIComponent(billingUid)}&solicitation_id=${encodeURIComponent(solId)}`
          );
          const data = await res.json();
          if (data.paid) {
            setIsPaid(true);
            return true;
          }
        } catch {
          /* retry */
        }
      }
      return false;
    },
    [billingUid]
  );

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

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Checkout redirect param detection (active reconciliation, not happy-path only) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const sid = params.get('sid');
    const sessionId = params.get('session_id');
    const source = params.get('source');
    const plan = params.get('plan');
    if (checkoutStatus !== 'success' && checkoutStatus !== 'cancelled') return;

    if (checkoutStatus === 'cancelled') {
      showToast('Payment cancelled. Your audit preview is still available.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const uid = billingUid;
    window.history.replaceState({}, '', window.location.pathname);

    (async () => {
      pendingCheckoutSessionIdRef.current = sessionId || null;
      pendingCheckoutSidRef.current = sid || null;

      if (sessionId && uid) {
        try {
          const res = await fetch('/api/payment/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
            body: JSON.stringify({ session_id: sessionId }),
          });
          await res.json().catch(() => ({}));
        } catch {
          /* polling / manual sync still available */
        }
      }

      if (source === 'subscription') {
        showToast('Payment received. Activating subscription…', 'info');
        const ok = await syncSubscriptionStatus();
        if (ok) {
          showToast(`Subscription active${plan ? `: ${plan}` : ''}. Full dashboard unlocked.`, 'success');
          setShowPaymentSyncCta(false);
        } else {
          showToast(
            'Payment received. Subscription sync is still processing — tap “Sync payment” below or refresh.',
            'info'
          );
          if (sessionId) setShowPaymentSyncCta(true);
        }
        if (sid) await fetchPaymentStatus(sid);
        return;
      }

      if (!sid || !uid) {
        showToast('Payment received. Open your audit to verify access.', 'info');
        return;
      }

      showToast('Verifying your purchase with Stripe…', 'info');
      setShowPaymentSyncCta(false);

      let paid = false;
      try {
        const res = await fetch(
          `/api/payment/status?uid=${encodeURIComponent(uid)}&solicitation_id=${encodeURIComponent(sid)}`
        );
        const data = await res.json();
        paid = !!data.paid;
      } catch {
        paid = false;
      }
      if (paid) {
        setIsPaid(true);
        showToast('Audit unlocked — full analysis is yours.', 'success');
        return;
      }

      setCheckingPayment(true);
      const ok = await pollPaymentStatus(sid);
      setCheckingPayment(false);
      if (ok) {
        showToast('Audit unlocked — full analysis is yours.', 'success');
        setShowPaymentSyncCta(false);
      } else if (pendingCheckoutSessionIdRef.current) {
        setShowPaymentSyncCta(true);
        showToast('Still confirming — use “Sync payment” if this doesn’t clear in a moment.', 'info');
      } else {
        showToast('We could not confirm access yet — refresh or contact support.', 'info');
      }
    })();
  }, [billingUid, fetchPaymentStatus, pollPaymentStatus, syncSubscriptionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSyncPayment = useCallback(async () => {
    const sessionId = pendingCheckoutSessionIdRef.current;
    const solId = pendingCheckoutSidRef.current;
    if (!sessionId || !billingUid) {
      showToast('Missing checkout session — refresh the page after payment.', 'error');
      return;
    }
    setSyncPaymentBusy(true);
    try {
      const res = await fetch('/api/payment/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': billingUid },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        showToast(data.error || 'Sync failed — try again or contact support.', 'error');
        return;
      }
      if (solId) await fetchPaymentStatus(solId);
      await syncSubscriptionStatus();
      setShowPaymentSyncCta(false);
      showToast('Access synced.', 'success');
    } catch {
      showToast('Sync failed — try again.', 'error');
    } finally {
      setSyncPaymentBusy(false);
    }
  }, [billingUid, fetchPaymentStatus, syncSubscriptionStatus]);

  const handleSelectAudit = (historyEntry) => {
    const result = historyEntry.audit_result;
    if (result) {
      setAuditResult(result);
      setActiveAuditId(historyEntry.id);
      setDemoUnlocked(false);
      setIsPaid(isSubscribed);
      const solId = result?.solicitation_number || result?.opportunity_id;
      if (solId) fetchPaymentStatus(solId);
      const title = result.title?.slice(0, 80) || result.solicitation_number || 'Audit';
      setWorkspaceMessages([{
        role: 'ai',
        text: `Loaded **${title}**. Ask questions about this audit in the thread — context is attached.`,
        id: Date.now(),
      }]);
      setSessionApiContext(null);
      setChatHeaderBadge('ARIS');
      setChatHeaderBadgeColor('#1a73e8');
      setChatPlaceholder('Ask about requirements, risks, or bid strategy…');
      showToast(`Loaded: ${result.title?.slice(0, 40) || 'Audit'}`, 'info');
    }
  };

  const handleNewAudit = useCallback(() => {
    setAuditResult(null);
    setActiveAuditId(null);
    setAnalyzing(false);
    setDemoUnlocked(false);
    resetWorkspaceChat();
  }, [resetWorkspaceChat]);

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
    setSessionApiContext(null);
    setChatHeaderBadge('ARIS');
    setChatHeaderBadgeColor('#1a73e8');
    setChatPlaceholder('Ask about requirements, risks, or bid strategy…');
    setWorkspaceMessages(m => [...m, {
      role: 'ai',
      text: `Audit complete. Verdict: **${data.verdict?.recommendation || 'CONDITIONAL'}** (${data.verdict?.win_probability ?? '?'}% win probability).\n\n${data.verdict?.summary || data.executiveSummary?.slice(0, 240) || ''}${(data.executiveSummary || '').length > 240 ? '…' : ''}`,
      id: Date.now(),
    }]);
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

    setSessionApiContext(ctx.apiContext);
    setChatHeaderBadge(ctx.badge);
    setChatHeaderBadgeColor(ctx.badgeColor);
    setChatPlaceholder(ctx.placeholder);
    setWorkspaceMessages(m => [...m, {
      role: 'ai',
      text: ctx.aiMessage,
      id: Date.now(),
      externalLinks: ctx.externalLinks || [],
    }]);
  };

  const sendWorkspaceMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || workspaceLoading) return;

    const prior = wsMessagesRef.current;
    const userMsg = { role: 'user', text: trimmed, id: Date.now() };
    const threadAfterUser = [...prior, userMsg];
    setWorkspaceMessages(threadAfterUser);
    wsMessagesRef.current = threadAfterUser;
    setWorkspaceLoading(true);

    try {
      const isUrl = trimmed.startsWith('http') || trimmed.includes('sam.gov');

      if (isUrl) {
        handleStart();
        try {
          const res = await fetch('/api/audit/link', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({ url: trimmed }),
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
            handleResult(normalized);
          } else {
            const nextClass = classifyError(data);
            const nextCtx = (CHAT_CONTEXTS[nextClass] || CHAT_CONTEXTS._DEFAULT)(data);
            setSessionApiContext(nextCtx.apiContext);
            setChatHeaderBadge(nextCtx.badge);
            setChatHeaderBadgeColor(nextCtx.badgeColor);
            setChatPlaceholder(nextCtx.placeholder);
            setWorkspaceMessages(m => [...m, {
              role: 'ai',
              text: nextCtx.aiMessage,
              id: Date.now(),
              externalLinks: nextCtx.externalLinks || [],
            }]);
          }
        } catch {
          setWorkspaceMessages(m => [...m, { role: 'ai', text: 'Connection error. Check your network and try again.', id: Date.now() }]);
        }
      } else {
        try {
          const hist = prior
            .filter(m => m.role === 'user' || m.role === 'ai')
            .slice(-8)
            .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({
              messages: [...hist, { role: 'user', content: trimmed }],
              context: sessionApiContext,
              auditContext: auditResult && typeof auditResult === 'object' ? auditResult : null,
            }),
          });
          const data = await res.json();
          const plan = data.plan && typeof data.plan === 'object' ? data.plan : null;
          setWorkspaceMessages(m => [...m, {
            role: 'ai',
            text: data.text || data.response || 'No response received.',
            plan,
            id: Date.now(),
          }]);
        } catch {
          setWorkspaceMessages(m => [...m, { role: 'ai', text: 'Connection error.', id: Date.now() }]);
        }
      }
    } finally {
      setWorkspaceLoading(false);
    }
  }, [workspaceLoading, sessionApiContext, auditResult, requestHeaders, handleStart, handleResult]);

  return (
    <div style={s.shell}>
      <div style={s.page}>
      <header style={s.topBar}>
        <div style={s.topBarLeft}>
          <LayoutDashboard size={16} color="#5f6368" />
          <span style={s.logoSub}>BidSmith</span>
          {auditResult && (
            <>
              <span style={s.logoSep}>·</span>
              <span style={{ ...s.logoSub, color: '#80868b', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {auditResult.title?.slice(0, 56) || auditResult.solicitation_number || 'Audit'}
              </span>
            </>
          )}
        </div>

        <div style={s.topBarRight}>
          {isSubscribed && (
            <div style={{ ...s.healthPill, background: '#e6f4ea', borderColor: '#ceead6' }}>
              <span style={{ ...s.healthDot, background: '#1e8e3e' }} />
              <span style={{ ...s.healthLabel, color: '#137333' }}>
                {(activePlan || 'active')}
              </span>
            </div>
          )}
          {syncingSubscription && (
            <div style={{ ...s.healthPill, background: '#e8f0fe', borderColor: '#d2e3fc' }}>
              <span style={{ ...s.healthDot, background: '#1a73e8' }} />
              <span style={{ ...s.healthLabel, color: '#1967d2' }}>Syncing…</span>
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
            <div style={{ ...s.healthPill, background: '#e6f4ea', borderColor: '#ceead6' }}>
              <span style={{ ...s.healthDot, background: '#1e8e3e' }} />
              <span style={{ ...s.healthLabel, color: '#137333' }}>Cached</span>
            </div>
          )}
        </div>
      </header>

      {showPaymentSyncCta && !accessUnlocked && (!auditResult || analyzing) && (
        <div
          style={{
            margin: '0 24px 12px',
            padding: '12px 16px',
            background: '#e8f0fe',
            border: '1px solid #dadce0',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 13, color: '#1967d2', lineHeight: 1.5 }}>
            Payment received — finishing account link. Sync or refresh.
          </span>
          <button
            type="button"
            onClick={handleSyncPayment}
            disabled={syncPaymentBusy}
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              background: '#1a73e8',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: syncPaymentBusy ? 'wait' : 'pointer',
              opacity: syncPaymentBusy ? 0.7 : 1,
            }}
          >
            {syncPaymentBusy ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      )}

      <div style={s.workspaceRow}>
        <LeftWorkspaceRail
          open={leftRailOpen}
          onToggle={() => setLeftRailOpen(o => !o)}
          tab={leftRailTab}
          setTab={setLeftRailTab}
          user={user}
          auditHistory={auditHistory}
          loadingHistory={loadingHistory}
          activeAuditId={activeAuditId}
          onSelectAudit={handleSelectAudit}
          onNewAudit={handleNewAudit}
          billingStatus={billingStatus}
          onStart={handleStart}
          onResult={handleResult}
          onError={handleError}
          initialUrl={featuredUrl}
          auditResult={auditResult}
        />

        <div style={s.centerWrap}>
          {!leftRailOpen && (
            <button
              type="button"
              aria-label="Open workspace panel"
              style={rail.edgeToggle('left')}
              onClick={() => setLeftRailOpen(true)}
            >
              <PanelLeft size={16} />
            </button>
          )}
          <div style={s.centerColumn}>
            <div style={s.featuredStrip}>
              <FeaturedSolicitations onSelect={handleFeaturedSelect} dock />
            </div>
            <WorkspaceChat
              messages={workspaceMessages}
              loading={workspaceLoading}
              onSend={sendWorkspaceMessage}
              placeholder={chatPlaceholder}
              headerBadge={chatHeaderBadge}
              headerBadgeColor={chatHeaderBadgeColor}
              headerTitle="Conversation"
              onClearThread={resetWorkspaceChat}
            />
            <PaywallGate
              hasAudit={!!auditResult && !analyzing}
              isPaid={accessUnlocked}
              checkingPayment={checkingPayment}
              reconcileOffered={showPaymentSyncCta}
              onSyncPayment={handleSyncPayment}
              syncPaymentBusy={syncPaymentBusy}
              unlockReason={isSubscribed ? 'subscription' : demoUnlocked ? 'demo' : isPaid ? 'payment' : 'locked'}
              solicitationId={auditResult?.solicitation_number || auditResult?.opportunity_id || ''}
              opportunityTitle={auditResult?.title || ''}
              uid={billingUid || 'anonymous'}
            >
              <div style={{ padding: 0 }}>
                <div style={{ background: '#fff', border: '1px solid #dadce0', borderRadius: 8, padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 500, color: '#5f6368' }}>Compliance matrix</p>
                  {(accessUnlocked ? (auditResult?.requirements || []) : (auditResult?.requirements || []).slice(0, 3)).map((req, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #e8eaed', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: req.risk === 'HIGH' ? '#d93025' : req.risk === 'LOW' ? '#1e8e3e' : '#f9ab00', width: 40, flexShrink: 0, paddingTop: 2 }}>{req.risk}</span>
                      <p style={{ margin: 0, fontSize: 13, color: '#202124', lineHeight: 1.45 }}>{req.requirement}</p>
                    </div>
                  ))}
                  {accessUnlocked && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e8eaed' }}>
                      <button
                        type="button"
                        onClick={handleExportComplianceMatrixXlsx}
                        disabled={exportMatrixXlsxLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          color: '#1a73e8',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: exportMatrixXlsxLoading ? 'wait' : 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {exportMatrixXlsxLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                        Export Compliance Matrix (.xlsx)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </PaywallGate>
            <HumanWalkthroughCTA
              visible={!!(auditResult && !analyzing && auditResult.verdict)}
              solicitationId={auditResult?.solicitation_number || auditResult?.id || auditResult?.opportunity_id || null}
            />
          </div>
          {!rightRailOpen && (
            <button
              type="button"
              aria-label="Open analysis panel"
              style={rail.edgeToggle('right')}
              onClick={() => setRightRailOpen(true)}
            >
              <PanelRight size={16} />
            </button>
          )}
        </div>

        <RightWorkspaceRail
          open={rightRailOpen}
          onToggle={() => setRightRailOpen(o => !o)}
          tab={rightRailTab}
          setTab={setRightRailTab}
          auditResult={auditResult}
          analyzing={analyzing}
          analysisStep={analysisStep}
        />
      </div>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.type === 'error' ? '#fce8e6' : toast.type === 'success' ? '#e6f4ea' : '#fff',
          borderColor: toast.type === 'error' ? '#f9ab00' : toast.type === 'success' ? '#ceead6' : '#dadce0',
        }}>
          <span style={{
            ...s.toastDot,
            background: toast.type === 'error' ? '#d93025' : toast.type === 'success' ? '#1e8e3e' : '#80868b',
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
        ::placeholder { color: #80868b; }
        textarea:focus, input:focus { border-color: #1a73e8 !important; outline: none; }
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
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    background: '#f8f9fa',
    fontFamily:
      'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#202124',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  page: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 0,
    background: '#f8f9fa',
  },
  workspaceRow: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  centerWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    minWidth: 0,
    minHeight: 0,
    background: '#f8f9fa',
  },
  centerColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    padding: '0 16px 20px',
    gap: 12,
    overflow: 'hidden',
  },
  featuredStrip: {
    flexShrink: 0,
    paddingTop: 8,
  },

  // ── Top bar ──
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid #dadce0',
    position: 'sticky',
    top: 0,
    background: '#fff',
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
    color: '#dadce0',
    fontSize: 14,
    padding: '0 2px',
  },
  logoSub: {
    fontSize: 14,
    color: '#5f6368',
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
    background: '#f1f3f4',
    border: '1px solid #dadce0',
    borderRadius: 16,
    padding: '4px 12px',
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#1e8e3e',
  },
  healthLabel: {
    fontSize: 12,
    color: '#5f6368',
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
    padding: '32px 0 20px',
    textAlign: 'center',
  },
  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 400,
    color: '#202124',
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
  },
  pageSubtitle: {
    margin: '8px 0 0',
    fontSize: 14,
    color: '#5f6368',
    fontWeight: 400,
    lineHeight: 1.5,
  },

  // ── Remove unused ComplianceSnapshot reference ──

  // ── Bento rows ──
  row1: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    padding: 0,
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
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
    padding: '20px 0 0',
    WebkitTransform: 'translateZ(0)',
  },
  row3: {
    padding: '16px 0 0',
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  // ── Stat card ──
  statCard: {
    background: '#fff',
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minHeight: 120,
    boxShadow: 'none',
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
    fontSize: 24,
    fontWeight: 400,
    color: '#202124',
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    margin: 0,
    fontSize: 12,
    color: '#5f6368',
    fontWeight: 500,
  },
  statSub: {
    margin: '2px 0 0',
    fontSize: 12,
    color: '#80868b',
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
    gap: 10,
    padding: '12px 20px',
    borderRadius: 4,
    border: '1px solid #dadce0',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(60,64,67,0.15)',
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
    fontSize: 13,
    color: '#202124',
    fontWeight: 400,
  },
};
