/**
 * BentoDashboard — The BidSmith Command Center.
 *
 * Layout: collapsible left rail (files, solicitation, history) |
 *   center conversation + hot RFPs + paywall |
 *   collapsible right rail (agents, sources, brief, eval).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowUpRight, Loader2, AlertTriangle,
         Clock, ChevronRight, LogOut, Plus, LayoutDashboard,
         PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Cpu, Download } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
import RfpUploadZone   from '../components/bento/RfpUploadZone';
import LiveAnalysisCard from '../components/bento/LiveAnalysisCard';
import EvalStatusCard  from '../components/bento/EvalStatusCard';
import BidOutputCard   from '../components/bento/BidOutputCard';
import HumanWalkthroughCTA from '../components/HumanWalkthroughCTA.jsx';
import WorkspaceChat from '../components/bento/WorkspaceChat.jsx';
import { downloadComplianceMatrixXlsx, complianceMatrixXlsxBuffer } from '../utils/complianceMatrixXlsx';
import { track, trackEvent } from '../utils/analytics';
import { BENTO_WORKSPACE_WELCOME_MARKDOWN } from '../content/bentoWorkspaceWelcome.js';
import { BD } from '../theme/bentoDarkTheme.js';
import '../styles/bento-dashboard.css';

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

const rail = {
  outer: (open) => ({
    width: open ? RAIL_W : 0,
    minWidth: open ? RAIL_W : 0,
    flexShrink: 0,
    borderRight: `1px solid ${BD.border}`,
    background: BD.bgRail,
    boxShadow: open ? '4px 0 24px rgba(0, 0, 0, 0.35)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'width 0.2s ease, min-width 0.2s ease, box-shadow 0.2s ease',
  }),
  outerRight: (open) => ({
    width: open ? RAIL_W : 0,
    minWidth: open ? RAIL_W : 0,
    flexShrink: 0,
    borderLeft: `1px solid ${BD.border}`,
    background: BD.bgRail,
    boxShadow: open ? '-4px 0 24px rgba(0, 0, 0, 0.35)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'width 0.2s ease, min-width 0.2s ease, box-shadow 0.2s ease',
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
    padding: '12px 14px',
    borderBottom: `1px solid ${BD.border}`,
    flexShrink: 0,
    background: BD.bgRailHead,
  },
  headTitle: { fontSize: 13, fontWeight: 700, color: BD.textBright, letterSpacing: '-0.02em' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${BD.border}`,
    background: BD.bgPanelHi,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: BD.textSecondary,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },
  tabs: {
    display: 'flex',
    gap: 6,
    borderBottom: 'none',
    flexShrink: 0,
    padding: '8px 10px',
    background: BD.bgRailTabs,
    margin: '0 8px 8px',
    borderRadius: 12,
  },
  tab: (on) => ({
    flex: 1,
    minWidth: 0,
    padding: '7px 4px',
    fontSize: 10,
    fontWeight: on ? 700 : 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: on ? BD.tabActiveFg : BD.textMuted,
    background: on ? BD.paywallCtaBg : 'transparent',
    border: 'none',
    borderRadius: 8,
    boxShadow: on ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none',
    cursor: 'pointer',
    marginBottom: 0,
    transition: 'color 0.15s, background 0.15s, box-shadow 0.15s',
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
    borderBottom: `1px solid ${BD.borderSoft}`,
    fontSize: 12,
    color: BD.textPrimary,
    lineHeight: 1.45,
  },
  sourceMeta: { fontSize: 10, color: BD.textDim, marginBottom: 4, fontWeight: 500 },
  agentRow: {
    padding: '8px 0',
    fontSize: 12,
    color: BD.textSecondary,
    borderBottom: `1px solid ${BD.borderSoft}`,
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  detailLabel: { fontSize: 11, color: BD.textDim, marginBottom: 2 },
  detailVal: { fontSize: 13, color: BD.textPrimary, marginBottom: 10, lineHeight: 1.4 },
  edgeToggle: (side) => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [side]: 0,
    zIndex: 20,
    width: 26,
    height: 52,
    border: `1px solid ${BD.border}`,
    background: BD.bgPanelHi,
    borderRadius: side === 'left' ? '0 10px 10px 0' : '10px 0 0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: BD.textSecondary,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
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
    v === 'BID' ? BD.success : v === 'NO-BID' ? BD.danger : BD.warning;

  return (
    <div style={rail.outer(open)}>
      <div style={rail.inner}>
        <div style={rail.head}>
          <span style={rail.headTitle}>Workspace</span>
          <button type="button" className="bento-focus" style={rail.iconBtn} onClick={onToggle} title="Collapse panel">
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
                <p style={{ margin: 0, fontSize: 13, color: BD.textMuted, lineHeight: 1.5 }}>
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
                  <p style={{ ...rail.detailVal, fontSize: 12, color: BD.textSecondary }}>
                    {(auditResult.executiveSummary || '').slice(0, 520)}{(auditResult.executiveSummary || '').length > 520 ? '…' : ''}
                  </p>
                  {auditResult.sam_url && (
                    <a href={auditResult.sam_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: BD.link }}>
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
                        background: isActive ? BD.accentSoft : 'transparent',
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
        <div style={{ ...sb.footer, marginTop: 'auto', borderTop: `1px solid ${BD.border}` }}>
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
          <button type="button" className="bento-focus" style={rail.iconBtn} onClick={onToggle} title="Collapse panel">
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
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 500, color: BD.textDim }}>Pipeline</p>
              {ANALYSIS_STEPS.map((step, i) => (
                <div key={step.id} style={rail.agentRow}>
                  <Cpu size={14} color={i <= analysisStep ? BD.accent : BD.borderHi} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: i === analysisStep && analyzing ? 600 : 400, color: BD.textPrimary }}>{step.label}</div>
                    <div style={{ fontSize: 11, color: BD.textMuted, marginTop: 2 }}>{step.detail}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, borderTop: `1px solid ${BD.border}`, paddingTop: 12 }}>
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
                <p style={{ margin: 0, fontSize: 13, color: BD.textMuted }}>Requirement citations and excerpts appear after an audit.</p>
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
                      <div style={{ marginTop: 6, fontSize: 11, color: BD.textSecondary, fontStyle: 'italic', lineHeight: 1.4 }}>
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
      className="bento-featured-card bento-focus"
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

/** Hot RFP strip — Inter-first to match global fonts in index.html. */
const FS_UI_FONT =
  'Inter, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const fs = {
  wrap: {
    padding: '0 0 24px',
    fontFamily: FS_UI_FONT,
  },
  dockWrap: {
    width: '100%',
    maxWidth: 768,
    margin: '0 auto',
    paddingTop: 4,
    fontFamily: FS_UI_FONT,
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
    color: BD.textMuted,
    textTransform: 'uppercase',
  },
  dockSub: {
    fontSize: 12,
    fontWeight: 500,
    color: BD.textDim,
  },
  scrollDock: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 2,
    scrollbarWidth: 'thin',
    fontFamily: FS_UI_FONT,
  },
  header: {
    display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: BD.textMuted,
    textTransform: 'uppercase',
    fontFamily: FS_UI_FONT,
  },
  sub: {
    fontSize: 13,
    fontWeight: 500,
    color: BD.textDim,
    fontFamily: FS_UI_FONT,
  },
  scroll: {
    display: 'flex', gap: 10, overflowX: 'auto',
    paddingBottom: 4, scrollbarWidth: 'none',
    fontFamily: FS_UI_FONT,
  },
  card: {
    flexShrink: 0,
    width: 200,
    background: BD.bgCard,
    border: `1px solid ${BD.border}`,
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 6,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
    fontFamily: FS_UI_FONT,
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
    fontSize: 10,
    color: BD.textSecondary,
    fontFamily: 'ui-monospace, "Cascadia Code", "Segoe UI Mono", monospace',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  cardDock: {
    flexShrink: 0,
    width: 168,
    background: BD.bgCard,
    border: `1px solid ${BD.border}`,
    borderRadius: 12,
    padding: '10px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
    fontFamily: FS_UI_FONT,
  },
  title: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: BD.textPrimary,
    lineHeight: 1.35,
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  titleDock: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: BD.textPrimary,
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  agency: {
    margin: 0,
    fontSize: 12,
    color: BD.textSecondary,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  agencyDock: {
    margin: 0,
    fontSize: 11,
    color: BD.textMuted,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardBottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: 600,
    color: BD.success,
    letterSpacing: '-0.02em',
  },
  setAside: {
    fontSize: 11,
    fontWeight: 600,
    color: BD.textSecondary,
    background: BD.bgPanelHi,
    border: `1px solid ${BD.border}`,
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
          <div key={i} style={{ height: 18, background: BD.bgPanelHi, borderRadius: 4, marginBottom: 10, opacity: 0.5, animation: 'pulse 1.4s ease-in-out infinite' }} />
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
        <p style={{ fontSize: 11, color: BD.textMuted, margin: 0, lineHeight: 1.6 }}>
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
      <div style={{ height: 3, background: BD.trackBar, borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
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
              border: `1.5px solid ${checked[i] ? BD.success : BD.borderHi}`,
              background: checked[i] ? BD.success : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1, transition: 'all 0.15s',
            }}>
              {checked[i] && <span style={{ color: BD.textBright, fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </span>
            <span style={{
              fontSize: 11, color: checked[i] ? BD.textDim : BD.textMuted,
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
    background: BD.bgCard,
    border: `1px solid ${BD.border}`,
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
    background: BD.success,
    flexShrink: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 500,
    color: BD.textSecondary,
    letterSpacing: '0',
    textTransform: 'none',
  },
  badge: {
    fontSize: 11,
    fontWeight: 500,
    color: BD.textMuted,
    background: BD.bgPanelHi,
    border: `1px solid ${BD.border}`,
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
    track('checkout_started', {
      plan_name: 'audit_unlock_99',
      billing_cycle: 'one_time',
    });
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
                <span style={{ color: BD.success, fontSize: 12 }}>✓</span>
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
    border: `1px solid ${BD.border}`,
    width: 'fit-content',
    background: BD.bgPanel,
    color: BD.textSecondary,
  },
  statusUnlocked: {
    color: BD.success,
    background: BD.bgToastSuccess,
    borderColor: BD.border,
  },
  statusLocked: {
    color: BD.warning,
    background: '#2a2318',
    borderColor: '#5c4d2e',
  },
  statusChecking: {
    color: BD.accent,
    background: BD.accentSoft,
    borderColor: BD.accentBorder,
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
    background: BD.bgCard,
    border: `1px solid ${BD.border}`,
    borderRadius: 8,
    padding: '24px 22px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    textAlign: 'left',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
  lockIcon: { fontSize: 28 },
  lockTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 400,
    color: BD.textBright,
    letterSpacing: '-0.02em',
  },
  lockSub: {
    margin: 0,
    fontSize: 14,
    color: BD.textSecondary,
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
  featureText: { fontSize: 14, color: BD.textPrimary },
  cta: {
    padding: '10px 24px',
    background: BD.paywallCtaBg,
    border: 'none',
    borderRadius: 4,
    color: BD.textBright,
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
    color: BD.textMuted,
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
              background: done ? BD.successSoft : active ? BD.accentSoft : BD.bgPanelHi,
              border: `1.5px solid ${done ? BD.success : active ? BD.accentBorder : BD.border}`,
            }}>
              {done ? (
                <span style={{ fontSize: 9, color: BD.success, fontWeight: 700 }}>✓</span>
              ) : active ? (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: BD.accent, animation: 'pulse 1.2s ease-in-out infinite', display: 'block' }} />
              ) : (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: BD.borderHi, display: 'block' }} />
              )}
            </div>
            {/* Label */}
            <div style={{ minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: active ? 600 : 500,
                color: done ? BD.textDim : active ? BD.textBright : BD.textMuted,
                letterSpacing: '-0.01em',
              }}>{step.label}</p>
              {active && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: BD.textMuted, letterSpacing: '-0.01em' }}>
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
    gap: 8,
    padding: '11px 14px',
    background: BD.bgPanelHi,
    border: `1px solid ${BD.accentBorder}`,
    borderRadius: 12,
    color: BD.link,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
  },
  historyList: { flex: 1, overflowY: 'auto', padding: '0 8px', scrollbarWidth: 'thin' },
  historyEmpty: { fontSize: 13, color: BD.textMuted, padding: '12px 8px', textAlign: 'center' },
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
  historyDate: { fontSize: 11, color: BD.textDim },
  historyTitle: {
    fontSize: 13,
    fontWeight: 400,
    color: BD.textPrimary,
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  footer: {
    borderTop: `1px solid ${BD.border}`,
    padding: '12px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
    background: BD.bgRailHead,
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
    background: BD.chipBg,
    border: `1px solid ${BD.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: BD.accent,
  },
  userEmail: {
    fontSize: 13,
    color: BD.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  billingPill: {
    fontSize: 11,
    color: BD.billingFg,
    background: BD.billingBg,
    border: `1px solid ${BD.border}`,
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
    border: `1px solid ${BD.border}`,
    color: BD.textSecondary,
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
    { role: 'ai', text: BENTO_WORKSPACE_WELCOME_MARKDOWN, id: Date.now() },
  ]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [sessionApiContext, setSessionApiContext] = useState(null);
  const [chatHeaderBadge, setChatHeaderBadge]     = useState('ARIS');
  const [chatHeaderBadgeColor, setChatHeaderBadgeColor] = useState(BD.accent);
  const [chatPlaceholder, setChatPlaceholder] = useState(
    'Paste a SAM.gov URL, ask a question, or use Files to upload a PDF…'
  );
  const wsMessagesRef = useRef(workspaceMessages);
  useEffect(() => { wsMessagesRef.current = workspaceMessages; }, [workspaceMessages]);

  const dashboardLoadFiredRef = useRef(false);
  const successfulAuditCountRef = useRef(0);
  const firstAuditSuccessAtRef = useRef(null);
  const checkoutSuccessTrackedRef = useRef(new Set());

  const requestHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(user?.id ? { 'x-user-id': user.id } : {}),
    ...(user?.email ? { 'x-user-email': user.email } : {}),
    'x-subscribed': user?.isSubscribed ? 'true' : 'false',
  }), [user?.id, user?.email, user?.isSubscribed]);

  const resetWorkspaceChat = useCallback(() => {
    setWorkspaceMessages([{ role: 'ai', text: BENTO_WORKSPACE_WELCOME_MARKDOWN, id: Date.now() }]);
    setSessionApiContext(null);
    setChatHeaderBadge('ARIS');
    setChatHeaderBadgeColor(BD.accent);
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
    const plan = isSubscribed ? (activePlan || "pro") : "free";
    track("export_matrix_clicked", { requirement_count: rows.length, plan });
    trackEvent('export_compliance_matrix_xlsx', {
      category: 'conversion',
      solicitation: auditResult?.solicitation_number || auditResult?.id || null,
    });
    exportMatrixBusyRef.current = true;
    setExportMatrixXlsxLoading(true);
    try {
      await downloadComplianceMatrixXlsx(auditResult);
      let file_size_kb = null;
      try {
        const buf = complianceMatrixXlsxBuffer(auditResult);
        file_size_kb = Math.round(buf.byteLength / 1024);
      } catch {
        /* optional size */
      }
      track("export_matrix_success", file_size_kb != null ? { file_size_kb } : {});
    } catch (e) {
      if (e?.code !== 'NO_COMPLIANCE_ROWS') {
        setToast({ msg: 'Export failed. Please try again.', type: 'error' });
      }
    } finally {
      exportMatrixBusyRef.current = false;
      setExportMatrixXlsxLoading(false);
    }
  }, [auditResult, isSubscribed, activePlan]);

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

  useEffect(() => {
    dashboardLoadFiredRef.current = false;
    successfulAuditCountRef.current = 0;
    firstAuditSuccessAtRef.current = null;
  }, [billingUid]);

  useEffect(() => {
    const uid = user?.id || clerkUser?.id;
    if (!uid || dashboardLoadFiredRef.current) return;
    if (loadingHistory) return;
    dashboardLoadFiredRef.current = true;
    const plan = isSubscribed ? (activePlan || "pro") : "free";
    track("dashboard_load", { plan, audit_count: auditHistory.length });
  }, [user?.id, clerkUser?.id, loadingHistory, isSubscribed, activePlan, auditHistory.length]);

  useEffect(() => {
    const v = auditResult?.verdict;
    if (!v) return;
    const rec = String(v.recommendation || "").toUpperCase().replace(/[\s-]+/g, "_");
    let decision = "conditional";
    if (rec === "NO_BID" || rec === "NOBID") decision = "no_bid";
    else if (rec === "BID" || rec === "GO") decision = "bid";
    track("bid_no_bid_shown", {
      decision,
      score: v.win_probability ?? null,
    });
  }, [auditResult?.verdict, auditResult?.solicitation_number, auditResult?.opportunity_id]);

  useEffect(() => {
    const n = auditResult?.requirements?.length;
    if (!n) return;
    track("compliance_matrix_shown", { requirement_count: n });
  }, [auditResult?.requirements?.length, auditResult?.solicitation_number, auditResult?.opportunity_id]);

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

  // Marketing site → workspace: run queued SAM.gov URL or focus Files for PDF upload
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout')) return;

    let u = params.get('url')?.trim();
    if (!u) {
      try {
        const stored = sessionStorage.getItem('bidsmith_queued_audit_url')?.trim();
        if (stored) {
          u = stored;
          sessionStorage.removeItem('bidsmith_queued_audit_url');
        }
      } catch {
        /* ignore */
      }
    }

    if (u && /^https?:\/\//i.test(u)) {
      try {
        sessionStorage.removeItem('bidsmith_queued_audit_url');
      } catch {
        /* ignore */
      }
      setLeftRailTab('files');
      setFeaturedUrl(null);
      setTimeout(() => setFeaturedUrl(u), 10);
      window.history.replaceState(window.history.state || {}, '', window.location.pathname);
      return;
    }

    if (params.get('intent') === 'upload') {
      setLeftRailTab('files');
      showToast('Drop your PDF under Files (left panel) to run an audit.', 'info');
      window.history.replaceState(window.history.state || {}, '', window.location.pathname);
    }
  // Mount only — consumes one-shot deep links from the marketing site
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      track("checkout_abandoned", {
        plan_name: plan || (source === "subscription" ? "subscription" : "audit_unlock_99"),
      });
      showToast('Payment cancelled. Your audit preview is still available.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const uid = billingUid;
    window.history.replaceState({}, '', window.location.pathname);

    const markCheckoutCompleted = (payload) => {
      const key = sessionId || (source === "subscription" ? `sub:${plan || "pro"}` : sid ? `sol:${sid}` : "checkout");
      if (checkoutSuccessTrackedRef.current.has(key)) return;
      checkoutSuccessTrackedRef.current.add(key);
      track("checkout_completed", payload);
    };

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
          markCheckoutCompleted({
            plan_name: plan || "pro",
            amount_usd: null,
            billing_cycle: "monthly",
          });
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
        if (sessionId) {
          markCheckoutCompleted({
            plan_name: plan || "unknown",
            amount_usd: null,
            billing_cycle: source === "subscription" ? "monthly" : "one_time",
          });
        }
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
        markCheckoutCompleted({
          plan_name: "audit_unlock_99",
          amount_usd: 99,
          billing_cycle: "one_time",
        });
        showToast('Audit unlocked — full analysis is yours.', 'success');
        return;
      }

      setCheckingPayment(true);
      const ok = await pollPaymentStatus(sid);
      setCheckingPayment(false);
      if (ok) {
        markCheckoutCompleted({
          plan_name: "audit_unlock_99",
          amount_usd: 99,
          billing_cycle: "one_time",
        });
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
      setChatHeaderBadgeColor(BD.accent);
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
    const inputGuess = data?.meta?.cache_hit != null || data?.solicitation_number
      ? 'url'
      : 'pdf';
    track('audit_success', { input_type: inputGuess, latency_ms: null });
    successfulAuditCountRef.current += 1;
    if (!firstAuditSuccessAtRef.current) firstAuditSuccessAtRef.current = Date.now();
    if (successfulAuditCountRef.current >= 2) {
      track("audit_repeat", {
        audit_count: successfulAuditCountRef.current,
        days_since_first: Math.floor(
          (Date.now() - firstAuditSuccessAtRef.current) / 86400000
        ),
      });
    }
    setAuditResult(data);
    setActiveAuditId(null); // fresh audit, not from history
    setAnalyzing(false);
    setIsPaid(isSubscribed); // subscribers remain unlocked on all audits
    setSessionApiContext(null);
    setChatHeaderBadge('ARIS');
    setChatHeaderBadgeColor(BD.accent);
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

    if (
      errObj?.code === "FREE_MONTHLY_LIMIT"
      || errObj?.status === 429
      || String(errObj?.code) === "429"
    ) {
      track("upgrade_prompt_shown", {
        quota_limit: errObj?.quota_limit ?? errObj?.limit ?? null,
        audits_used: errObj?.audits_used ?? errObj?.used ?? null,
      });
    } else {
      track("audit_error", {
        error_code: String(errObj?.code || errObj?.message || "unknown").slice(0, 80),
        input_type: errObj?.input_type || "unknown",
      });
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

    const userMsgIndex = prior.filter((m) => m.role === "user").length;
    const hasCtx = !!(auditResult && typeof auditResult === "object");
    track("chat_message_sent", { message_index: userMsgIndex, has_context: hasCtx });

    try {
      const isUrl = trimmed.startsWith('http') || trimmed.includes('sam.gov');

      if (isUrl) {
        handleStart();
        track("audit_submitted", { input_type: "url", source: "sam" });
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
            if (res.status === 429 || data?.code === "FREE_MONTHLY_LIMIT") {
              track("upgrade_prompt_shown", {
                quota_limit: data?.quota_limit ?? data?.limit ?? null,
                audits_used: data?.audits_used ?? data?.used ?? null,
              });
            } else {
              track("audit_error", {
                error_code: String(data?.code || res.status || "audit_failed").slice(0, 80),
                input_type: "url",
              });
            }
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
          track("audit_error", { error_code: "network", input_type: "url" });
          setWorkspaceMessages(m => [...m, { role: 'ai', text: 'Connection error. Check your network and try again.', id: Date.now() }]);
        }
      } else {
        const chatStarted = Date.now();
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
          if (res.ok) {
            track("chat_reply_received", { latency_ms: Date.now() - chatStarted });
          }
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
    <div style={s.shell} className="bento-app">
      <div style={s.page}>
      <header style={s.topBar}>
        <div style={s.topBarLeft}>
          <LayoutDashboard size={18} color={BD.accent} strokeWidth={2} />
          <span style={s.logoBrand}>BidSmith</span>
          {auditResult && (
            <>
              <span style={s.logoSep}>·</span>
              <span style={s.logoCrumb}>
                {auditResult.title?.slice(0, 56) || auditResult.solicitation_number || 'Audit'}
              </span>
            </>
          )}
        </div>

        <div style={s.topBarRight}>
          {isSubscribed && (
            <div style={{ ...s.healthPill, background: BD.billingBg, borderColor: BD.border }}>
              <span style={{ ...s.healthDot, background: BD.billingFg }} />
              <span style={{ ...s.healthLabel, color: BD.billingFg }}>
                {(activePlan || 'active')}
              </span>
            </div>
          )}
          {syncingSubscription && (
            <div style={{ ...s.healthPill, background: BD.accentSoft, borderColor: BD.accentBorder }}>
              <span style={{ ...s.healthDot, background: BD.accent }} />
              <span style={{ ...s.healthLabel, color: BD.accent }}>Syncing…</span>
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
            <div style={{ ...s.healthPill, background: BD.billingBg, borderColor: BD.border }}>
              <span style={{ ...s.healthDot, background: BD.billingFg }} />
              <span style={{ ...s.healthLabel, color: BD.billingFg }}>Cached</span>
            </div>
          )}
        </div>
      </header>

      {showPaymentSyncCta && !accessUnlocked && (!auditResult || analyzing) && (
        <div
          style={{
            margin: '0 24px 12px',
            padding: '12px 16px',
            background: BD.accentSoft,
            border: `1px solid ${BD.border}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 13, color: BD.accent, lineHeight: 1.5 }}>
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
              background: BD.paywallCtaBg,
              color: BD.textBright,
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
              className="bento-focus"
              aria-label="Open workspace panel"
              style={rail.edgeToggle('left')}
              onClick={() => setLeftRailOpen(true)}
            >
              <PanelLeft size={16} />
            </button>
          )}
          <div style={s.centerColumn}>
            <div style={s.featuredStrip}>
              <div style={s.featuredPanel}>
                <FeaturedSolicitations onSelect={handleFeaturedSelect} dock />
              </div>
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
                <div style={{ background: BD.bgCard, border: `1px solid ${BD.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: BD.textSecondary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Compliance matrix</p>
                  {(accessUnlocked ? (auditResult?.requirements || []) : (auditResult?.requirements || []).slice(0, 3)).map((req, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BD.matrixRowBorder}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: req.risk === 'HIGH' ? BD.danger : req.risk === 'LOW' ? BD.success : BD.warning, width: 40, flexShrink: 0, paddingTop: 2 }}>{req.risk}</span>
                      <p style={{ margin: 0, fontSize: 13, color: BD.textPrimary, lineHeight: 1.45 }}>{req.requirement}</p>
                    </div>
                  ))}
                  {accessUnlocked && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BD.matrixRowBorder}` }}>
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
                          color: BD.link,
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
              variant="bento"
              visible={!!(auditResult && !analyzing && auditResult.verdict)}
              solicitationId={auditResult?.solicitation_number || auditResult?.id || auditResult?.opportunity_id || null}
            />
          </div>
          {!rightRailOpen && (
            <button
              type="button"
              className="bento-focus"
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
          background: toast.type === 'error' ? BD.bgToastError : toast.type === 'success' ? BD.bgToastSuccess : BD.bgToastNeutral,
          borderColor: toast.type === 'error' ? BD.danger : toast.type === 'success' ? BD.success : BD.border,
        }}>
          <span style={{
            ...s.toastDot,
            background: toast.type === 'error' ? BD.danger : toast.type === 'success' ? BD.success : BD.textMuted,
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
        ::placeholder { color: ${BD.textDim}; }
        textarea:focus, input:focus { border-color: ${BD.accent} !important; outline: none; }
        a { transition: opacity 0.15s; }
        a:hover { opacity: 0.75; }
        .mini-thread::-webkit-scrollbar { display: none; }
        .bs-sidebar::-webkit-scrollbar { display: none; }
        .workspace-chat-md p { margin-bottom: 8px; }
        .workspace-chat-md p:last-child { margin-bottom: 0; }
        .workspace-chat-md ul, .workspace-chat-md ol { margin-top: 4px; margin-bottom: 8px; }
        .workspace-chat-md a { word-break: break-word; }
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
    background: BD.bgShell,
    fontFamily:
      'Inter, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: BD.textPrimary,
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
    background: 'transparent',
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
    background: 'transparent',
  },
  centerColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    padding: '0 16px 20px',
    gap: 14,
    overflow: 'hidden',
  },
  featuredStrip: {
    flexShrink: 0,
    paddingTop: 4,
  },
  featuredPanel: {
    background: BD.bgFeatured,
    border: `1px solid ${BD.border}`,
    borderRadius: 16,
    padding: '14px 14px 12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },

  // ── Top bar ──
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 22px',
    borderBottom: `1px solid ${BD.border}`,
    position: 'sticky',
    top: 0,
    background: `linear-gradient(180deg, ${BD.bgRailHead} 0%, ${BD.bgPanel} 100%)`,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
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
    background: BD.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: 700,
    color: BD.textBright,
    letterSpacing: '-0.02em',
  },
  logoSep: {
    color: BD.textMuted,
    fontSize: 14,
    padding: '0 2px',
    fontWeight: 300,
  },
  logoSub: {
    fontSize: 14,
    color: BD.textSecondary,
    fontWeight: 400,
  },
  logoBrand: {
    fontSize: 15,
    fontWeight: 800,
    color: BD.textBright,
    letterSpacing: '-0.03em',
  },
  logoCrumb: {
    fontSize: 13,
    color: BD.textMuted,
    fontWeight: 500,
    maxWidth: 320,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    background: BD.bgPanelHi,
    border: `1px solid ${BD.border}`,
    borderRadius: 999,
    padding: '6px 14px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: BD.success,
    boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.25)',
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: BD.textSecondary,
    letterSpacing: '0.01em',
  },
  openApp: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: BD.textMuted,
    textDecoration: 'none',
    background: BD.bgInput,
    border: `1px solid ${BD.border}`,
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
    color: BD.textBright,
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
  },
  pageSubtitle: {
    margin: '8px 0 0',
    fontSize: 14,
    color: BD.textSecondary,
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
    background: BD.bgCard,
    border: `1px solid ${BD.border}`,
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
    color: BD.textBright,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    margin: 0,
    fontSize: 12,
    color: BD.textSecondary,
    fontWeight: 500,
  },
  statSub: {
    margin: '2px 0 0',
    fontSize: 12,
    color: BD.textMuted,
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
    border: `1px solid ${BD.border}`,
    background: BD.bgToastNeutral,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
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
    color: BD.textPrimary,
    fontWeight: 400,
  },
};
