/**
 * GovConDashboardV2.jsx — BidSmith v2
 *
 * The full capture intelligence platform.
 * Tabs: Intelligence Brief | Compliance Matrix | Proposal Forge | Agency Intel
 *
 * Wires together:
 *   - IntelligenceBrief (verdict + incumbent signal + hidden reqs + roadmap)
 *   - ComplianceMatrix (existing, enhanced)
 *   - ProposalForge (TipTap + ComplianceGutter)
 *
 * Data source: auditPipeline.js runAudit() output, stored in Supabase per session.
 */

import { useState, useEffect } from 'react';
import {
  Shield, Zap, Layers, FileText, LogOut,
  ChevronRight, Plus, TrendingUp, AlertOctagon,
  Clock, BarChart2, Eye, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import IntelligenceBrief from '../components/forge/IntelligenceBrief';
import ProposalForge from '../components/forge/ProposalForge';
import ComplianceMatrix from '../components/dashboard/ComplianceMatrix';

// ─── Demo audit data (shown when no audit is loaded) ──────────────────────────

const DEMO_AUDIT_DATA = {
  id: 'demo',
  title: 'IT Infrastructure Support Services',
  agency: 'Army Corps of Engineers',
  naics: '541512',
  value: 12400000,
  due_date: '2026-04-14',
  solicitation_number: 'W912EE-26-R-0042',
  verdict: {
    recommendation: 'BID',
    win_probability: 73,
    confidence: 'HIGH',
    summary: 'Strong alignment between your capability profile and this solicitation\'s technical requirements. Incumbent signal is low and evaluation rewards demonstrated Army IT experience.',
    rationale: 'Technical requirements match your demonstrated capabilities. Evaluation is Best Value, Technical-Led — which favors quality over price. CMMC Level 2 requirement creates a barrier most challengers can\'t meet quickly.'
  },
  intelligence: {
    incumbent_signal: {
      score: 4,
      label: 'LOW',
      signals_detected: [
        { signal: 'Short response window for complexity', found: true, evidence: '11 business days for a 5-year IT modernization solicitation — manageable but tight.' },
        { signal: 'Past performance value threshold', found: true, evidence: 'Requires 3 references at $5M+ — standard for this NAICS/size category.' },
        { signal: 'Transition minimization language', found: false, evidence: 'No "seamless transition" or "zero downtime" requirements found.' },
        { signal: 'Knowledge of existing infrastructure', found: false, evidence: 'No requirement to demonstrate familiarity with current systems.' },
        { signal: 'Named incumbent in SOW', found: false, evidence: 'No incumbent-specific tool names or acronyms detected.' },
      ],
      explanation: 'No strong incumbent language detected. The solicitation appears competitively written with requirements accessible to qualified challengers. Two moderate signals do not indicate a wired procurement.'
    },
    evaluation_type: 'Best Value — Technical-Led',
    evaluation_reality: 'Technical approach language occupies 12 pages vs. 2 pages for price. Agency evaluation factors weight technical 60%, past performance 25%, price 15%. Solution quality and past Army experience will dominate the award decision.',
    team_signal: 'OPEN-COMPETITION',
    price_to_win: {
      low: 9800000,
      high: 13100000,
      currency: 'USD',
      rationale: 'Based on 4 comparable Army IT awards at this district (FPDS). Avg award: 83% of ceiling. Recommended target: $10.3M–$11.8M.'
    },
    top_risks: [
      { risk: 'SPRS score posting required', severity: 'HIGH', action: 'Confirm current NIST SP 800-171 self-assessment is posted to SPRS before submission.' },
      { risk: 'Key personnel TS/SCI clearances must be active Day 1', severity: 'HIGH', action: 'Verify all proposed key personnel have active clearances — no interim clearances accepted.' },
      { risk: '11-day response window is aggressive', severity: 'MED', action: 'Reserve proposal team bandwidth now. Pull reusable past performance writeups from prior Army bids.' },
      { risk: 'CMMC Level 2 documentation required', severity: 'MED', action: 'Have CMMC Level 2 assessment documentation ready to reference in Technical Volume.' },
    ],
    key_discriminators: [
      'CMMC Level 2 certification — most challengers are 6–18 months behind on this requirement',
      'Army IT past performance — 3 direct references available with Army CoE clients',
      'On-site personnel already cleared at required level — no mobilization delay risk',
      'Cloud migration methodology demonstrated in prior awards',
    ],
    hidden_requirements: [
      { text: 'ITAR compliance disclosure required for any foreign national employees', found_in: 'Exhibit A — Security Addendum', risk: 'HIGH', implication: 'Must disclose ITAR-registered facilities or certify no ITAR-controlled data handling.' },
      { text: 'CMMC Level 2 certification in Technical Volume', found_in: 'PWS §3.4', risk: 'HIGH', implication: 'Not explicitly in Section L but evaluators confirmed to check via DIBCAC assessment records.' },
      { text: 'Monthly CDRL deliverable: IT Infrastructure Status Report', found_in: 'Attachment 2 — CDRL List', risk: 'MED', implication: 'Requires dedicated reporting capability. Must be staffed in Management Volume.' },
    ],
    timeline_pressure: {
      detected: true,
      days_to_respond: 11,
      explanation: 'Short for a 5-year IDIQ. Begin proposal development immediately.'
    }
  },
  requirements: [
    { id: 'REQ-01', requirement: 'SAM.gov registration active at time of submission', section: 'L.1', risk: 'LOW', is_disqualifier: true, action_required: 'Confirm active registration 48 hours before submission.' },
    { id: 'REQ-02', requirement: 'CMMC Level 2 certification or active assessment', section: 'M.3', risk: 'HIGH', is_disqualifier: true, action_required: 'Document certification in Technical Volume Section 2.' },
    { id: 'REQ-03', requirement: '3 past performance references, contract value $5M+, within 5 years', section: 'L.2.1', risk: 'HIGH', is_disqualifier: false, action_required: 'Identify 3 qualifying references with accessible POC contacts.' },
    { id: 'REQ-04', requirement: 'Key personnel TS/SCI clearances — active, no interim', section: 'M.5', risk: 'HIGH', is_disqualifier: true, action_required: 'Verify clearance status for all proposed key personnel.' },
    { id: 'REQ-05', requirement: 'NIST SP 800-171 self-assessment posted to SPRS', section: 'M.3', risk: 'HIGH', is_disqualifier: true, action_required: 'Post SPRS score before submission — evaluators verify electronically.' },
    { id: 'REQ-06', requirement: 'Small business set-aside compliance or subcontracting plan', section: 'H.8', risk: 'MED', is_disqualifier: false, action_required: 'Determine if subcontracting plan is required based on award value.' },
    { id: 'REQ-07', requirement: 'PIEE portal registration and submission', section: 'L.6', risk: 'MED', is_disqualifier: false, action_required: 'Register on PIEE portal. Confirm submission window timing.' },
    { id: 'REQ-08', requirement: 'Cloud migration experience demonstrated', section: 'M.2.1', risk: 'MED', is_disqualifier: false, action_required: 'Lead Technical Volume with cloud migration methodology and relevant case studies.' },
  ],
  proposal_roadmap: [
    { section: 'Technical Approach', recommended_pages: '10–12 pages', focus_areas: ['Cloud migration methodology', 'Zero-downtime cutover plan', 'CMMC Level 2 documentation pathway'], discriminator: 'CMMC Level 2 certification' },
    { section: 'Management Approach', recommended_pages: '4–5 pages', focus_areas: ['Named key personnel with clearances', 'Org chart and quals', 'Subcontractor management plan'], discriminator: 'Named PMs with active TS/SCI' },
    { section: 'Past Performance', recommended_pages: '3–4 pages', focus_areas: ['Army-specific IT references', 'Contract values and outcomes', 'Accessible POC contacts'], discriminator: '3 direct Army IT references' },
    { section: 'Executive Summary', recommended_pages: '1–2 pages', focus_areas: ['Agency mission alignment', 'Win theme statement', 'Discriminator summary'], discriminator: 'Lead with Army experience + CMMC' },
  ]
};

// ─── Sidebar pipeline item ─────────────────────────────────────────────────────

function PipelineItem({ item, active, onClick }) {
  const prob = item?.verdict?.win_probability ?? 0;
  const rec = item?.verdict?.recommendation || 'CONDITIONAL';
  const color = prob >= 65 ? '#16a34a' : prob >= 40 ? '#d97706' : '#dc2626';

  const daysLeft = item?.due_date
    ? Math.ceil((new Date(item.due_date) - new Date()) / 86400000)
    : null;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', background: active ? '#f1f5f9' : 'transparent',
        border: 'none', borderRadius: '8px', padding: '12px 14px',
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.15s'
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: '3px', background: '#002244', borderRadius: '0 3px 3px 0'
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
          {item.title || 'Federal Solicitation'}
        </p>
        <span style={{
          fontSize: '11px', fontWeight: 800, color,
          background: `${color}15`, padding: '2px 8px',
          borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0
        }}>
          {prob}%
        </span>
      </div>
      <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0', lineHeight: 1.3 }}>
        {item.agency || 'Agency TBD'}
      </p>
      {daysLeft !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
          <Clock size={11} color={daysLeft < 7 ? '#dc2626' : '#94a3b8'} />
          <span style={{ fontSize: '10px', color: daysLeft < 7 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>
            {daysLeft > 0 ? `${daysLeft}d left` : 'Due today'}
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Pipeline stats ────────────────────────────────────────────────────────────

function PipelineStats({ pipeline }) {
  const total = pipeline.length;
  const avgProb = total > 0
    ? Math.round(pipeline.reduce((sum, p) => sum + (p.verdict?.win_probability || 0), 0) / total)
    : 0;
  const dueSoon = pipeline.filter(p => {
    if (!p.due_date) return false;
    return Math.ceil((new Date(p.due_date) - new Date()) / 86400000) <= 7;
  }).length;

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
        {[
          { label: 'Active', value: total, color: '#0f172a' },
          { label: 'Avg Prob', value: `${avgProb}%`, color: avgProb >= 60 ? '#16a34a' : '#d97706' },
          { label: 'Due < 7d', value: dueSoon, color: dueSoon > 0 ? '#dc2626' : '#64748b' },
        ].map(stat => (
          <div key={stat.label}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Loading overlay shown during audit ────────────────────────────────────────

const AUDIT_STEPS = [
  'Fetching solicitation text…',
  'Shredding Section L/M requirements…',
  'Running compliance extraction…',
  'Scoring incumbent signals…',
  'Generating intelligence brief…',
  'Building proposal roadmap…',
];

function AuditLoadingOverlay({ step }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.96)',
      borderRadius: '16px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 10
    }}>
      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
        <svg width="64" height="64" style={{ animation: 'spin 1.4s linear infinite' }}>
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke="#002244" strokeWidth="5"
            strokeDasharray="44 132" strokeLinecap="round" />
        </svg>
        <Shield size={22} color="#002244" style={{ position: 'absolute', top: '21px', left: '21px' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
          Running Intelligence Audit
        </p>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, minHeight: '20px', transition: 'all 0.3s' }}>
          {AUDIT_STEPS[step % AUDIT_STEPS.length]}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {AUDIT_STEPS.map((_, i) => (
          <div key={i} style={{
            width: i <= step ? '20px' : '6px', height: '6px', borderRadius: '3px',
            background: i <= step ? '#002244' : '#e2e8f0',
            transition: 'all 0.4s ease'
          }} />
        ))}
      </div>
      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>~60–90 seconds</p>
    </div>
  );
}

// ─── New Audit Modal ───────────────────────────────────────────────────────────

function NewAuditModal({ onClose, onAuditComplete, userId }) {
  const [mode, setMode] = useState('url'); // 'url' | 'text'
  const [url, setUrl] = useState('');
  const [rfpText, setRfpText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState('');

  // Advance step counter while loading
  const startStepTimer = () => {
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setLoadStep(s);
      if (s >= AUDIT_STEPS.length - 1) clearInterval(iv);
    }, 9000);
    return iv;
  };

  const saveAndReturn = async (auditData) => {
    if (userId) {
      try {
        await supabase.from('audits').insert({
          user_id: userId,
          title: auditData.title || 'Federal Solicitation',
          agency: auditData.agency || 'Federal Agency',
          verdict: auditData.verdict,
          due_date: auditData.due_date || null,
          audit_data: auditData,
          created_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('[V2] Supabase save failed — showing in-memory:', dbErr.message);
      }
    }
    onAuditComplete(auditData);
    onClose();
  };

  const handleUrl = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setLoadStep(0); setError('');
    const iv = startStepTimer();
    try {
      const res = await fetch('/api/analyze-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `Server error ${res.status}`);
      }
      await saveAndReturn(await res.json());
    } catch (err) {
      setError(err.message || 'Audit failed. Check the URL and try again.');
    } finally {
      clearInterval(iv); setLoading(false);
    }
  };

  const handleText = async (e) => {
    e.preventDefault();
    if (rfpText.trim().length < 200) {
      setError('Paste at least 200 characters of RFP text.');
      return;
    }
    setLoading(true); setLoadStep(0); setError('');
    const iv = startStepTimer();
    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rfpText.trim() })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      await saveAndReturn(await res.json());
    } catch (err) {
      setError(err.message || 'Audit failed. Try again or check the pasted text.');
    } finally {
      clearInterval(iv); setLoading(false);
    }
  };

  const canSubmit = mode === 'url' ? url.trim().length > 10 : rfpText.trim().length >= 200;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '560px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        position: 'relative', overflow: 'hidden'
      }}>
        {loading && <AuditLoadingOverlay step={loadStep} />}

        <button onClick={onClose} disabled={loading} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', fontSize: '22px', lineHeight: 1
        }}>×</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Shield size={20} color="#002244" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            New Intelligence Audit
          </h2>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: '4px', background: '#f1f5f9',
          borderRadius: '10px', padding: '4px', marginBottom: '20px'
        }}>
          {[
            { id: 'url', label: 'SAM.gov URL' },
            { id: 'text', label: 'Paste RFP Text' },
          ].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setError(''); }}
              style={{
                flex: 1, padding: '8px 12px', fontSize: '13px', fontWeight: 700,
                borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: mode === m.id ? '#fff' : 'transparent',
                color: mode === m.id ? '#0f172a' : '#64748b',
                boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >{m.label}</button>
          ))}
        </div>

        {mode === 'url' ? (
          <form onSubmit={handleUrl}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
              SAM.gov Opportunity URL
            </label>
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://sam.gov/opp/..."
              disabled={loading}
              style={{
                width: '100%', padding: '11px 14px', fontSize: '13px',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                outline: 'none', color: '#0f172a', background: '#f8fafc',
                boxSizing: 'border-box', marginBottom: '8px'
              }}
              onFocus={e => e.target.style.borderColor = '#002244'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 20px 0' }}>
              Paste any SAM.gov opportunity URL — BidSmith extracts the full solicitation automatically.
            </p>
            {error && <ErrorBox msg={error} />}
            <SubmitBtn loading={loading} disabled={!canSubmit} />
          </form>
        ) : (
          <form onSubmit={handleText}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
              RFP / Solicitation Text
            </label>
            <textarea
              value={rfpText} onChange={e => setRfpText(e.target.value)}
              placeholder="Paste the full solicitation text here — Section L, Section M, PWS, or the full document..."
              disabled={loading} rows={8}
              style={{
                width: '100%', padding: '11px 14px', fontSize: '12px',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                outline: 'none', color: '#0f172a', background: '#f8fafc',
                boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
                marginBottom: '8px', fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#002244'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 20px 0' }}>
              {rfpText.length} chars — {rfpText.length < 200 ? `need at least ${200 - rfpText.length} more` : 'ready to audit'}
            </p>
            {error && <ErrorBox msg={error} />}
            <SubmitBtn loading={loading} disabled={!canSubmit} />
          </form>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background: '#fff5f5', border: '1px solid #fca5a5',
      borderRadius: '8px', padding: '10px 14px',
      fontSize: '12px', color: '#dc2626', marginBottom: '16px', lineHeight: 1.5
    }}>{msg}</div>
  );
}

function SubmitBtn({ loading, disabled }) {
  return (
    <button type="submit" disabled={disabled || loading} style={{
      width: '100%', padding: '13px',
      background: disabled || loading ? '#94a3b8' : '#002244',
      color: 'white', border: 'none', borderRadius: '10px',
      fontWeight: 800, fontSize: '14px',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      transition: 'background 0.15s', letterSpacing: '0.01em'
    }}>
      <Zap size={15} />
      Run Intelligence Audit
    </button>
  );
}

// ─── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'intelligence', label: 'Intelligence Brief', icon: Eye },
  { id: 'compliance', label: 'Compliance Matrix', icon: Layers },
  { id: 'forge', label: 'Proposal Forge', icon: Zap },
];

// ─── Main V2 Dashboard ─────────────────────────────────────────────────────────

export default function GovConDashboardV2({ onBack, user }) {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [pipeline, setPipeline] = useState([]); // list of past audits from Supabase
  const [activeAudit, setActiveAudit] = useState(DEMO_AUDIT_DATA); // current audit data
  const [session, setSession] = useState(null);
  const [showNewAudit, setShowNewAudit] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--background', '#f1f5f9');
    document.documentElement.style.setProperty('--card', '#ffffff');
    document.documentElement.style.setProperty('--border', '#e2e8f0');
    document.documentElement.style.setProperty('--text-primary', '#0f172a');
    document.documentElement.style.setProperty('--text-secondary', '#475569');
    document.documentElement.style.setProperty('--accent', '#002244');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadPipeline(session.user.id);
    });
  }, []);

  const loadPipeline = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('id, title, agency, verdict, due_date, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setPipeline(data);
    } catch (err) {
      // Table may not exist yet — fail silently, show empty state
    }
  };

  const loadAuditDetail = async (id) => {
    try {
      const { data } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .single();
      if (data?.audit_data) setActiveAudit(data.audit_data);
    } catch (err) {
      console.warn('[V2] Could not load audit detail');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('aris_authenticated');
    window.location.href = '/';
  };

  const handleAuditComplete = (auditData) => {
    setActiveAudit(auditData);
    loadPipeline(session?.user?.id);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#f1f5f9', color: '#0f172a',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>

      {/* Top bar */}
      <header style={{
        height: '60px', background: '#fff',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: '24px', zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          onClick={onBack}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <Shield size={22} color="#002244" />
          <span style={{
            fontSize: '20px', fontWeight: 900, color: '#0B3D91',
            letterSpacing: '0.05em', fontFamily: "'Playfair Display', serif",
            textTransform: 'uppercase'
          }}>
            BIDSMITH
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: '#7c3aed',
            background: '#f3e8ff', padding: '2px 8px', borderRadius: '20px',
            border: '1px solid #e9d5ff'
          }}>
            v2
          </span>
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 14px',
                  background: activeTab === tab.id ? '#f1f5f9' : 'transparent',
                  border: '1px solid ' + (activeTab === tab.id ? '#e2e8f0' : 'transparent'),
                  borderRadius: '8px',
                  color: activeTab === tab.id ? '#002244' : '#64748b',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            {session?.user?.email?.split('@')[0].toUpperCase() || 'USER'}
          </span>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left sidebar — Pipeline */}
        <nav style={{
          width: '240px', flexShrink: 0,
          background: '#fff', borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px' }}>
            <button
              onClick={() => setShowNewAudit(true)}
              style={{
                width: '100%', padding: '10px',
                background: '#002244', color: 'white',
                border: 'none', borderRadius: '8px',
                fontWeight: 700, fontSize: '12px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '7px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,34,68,0.15)'
              }}
            >
              <Plus size={14} /> New Audit
            </button>
          </div>

          <div style={{
            padding: '0 16px 8px',
            fontSize: '10px', fontWeight: 800, color: '#94a3b8',
            letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>
            My Pipeline
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
            {pipeline.length > 0 ? (
              pipeline.map(item => (
                <PipelineItem
                  key={item.id}
                  item={item}
                  active={activeAudit?.id === item.id}
                  onClick={() => loadAuditDetail(item.id)}
                />
              ))
            ) : (
              <div style={{ padding: '20px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  No audits yet. Run your first audit to build your pipeline.
                </p>
              </div>
            )}
          </div>

          <PipelineStats pipeline={pipeline} />
        </nav>

        {/* Main content */}
        <main style={{
          flex: 1, overflow: activeTab === 'forge' ? 'hidden' : 'auto',
          display: 'flex', flexDirection: 'column'
        }}>
          {activeTab !== 'forge' && (
            <div style={{ padding: '28px 32px', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
              {activeTab === 'intelligence' && (
                <IntelligenceBrief
                  auditData={activeAudit}
                  onOpenForge={() => setActiveTab('forge')}
                />
              )}
              {activeTab === 'compliance' && (
                <ComplianceMatrix auditData={activeAudit} />
              )}
            </div>
          )}

          {activeTab === 'forge' && (
            <ProposalForge
              auditData={activeAudit}
              onBack={() => setActiveTab('intelligence')}
            />
          )}
        </main>
      </div>

      {/* New Audit Modal */}
      {showNewAudit && (
        <NewAuditModal
          onClose={() => setShowNewAudit(false)}
          onAuditComplete={handleAuditComplete}
          userId={session?.user?.id}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
