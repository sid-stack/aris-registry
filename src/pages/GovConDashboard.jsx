import { useState, useEffect, useRef } from 'react';
import {
  Shield, FileText, MessageSquare, Layers, Zap,
  Plus, LogOut, ChevronRight, Brain, Calendar,
  Search, Link, Upload, Loader2, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ComplianceMatrix   from '../components/dashboard/ComplianceMatrix';
import BidSmithChat       from '../components/dashboard/BidSmithChat';
import ExportToolbar      from '../components/dashboard/ExportToolbar';
import IntelligenceBrief  from '../components/dashboard/IntelligenceBrief';
import ActionPlan         from '../components/dashboard/ActionPlan';

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'intelligence', label: 'Intelligence Brief', icon: <Brain size={16} /> },
  { id: 'compliance',   label: 'Compliance Matrix',  icon: <Layers size={16} /> },
  { id: 'action',       label: 'Action Plan',         icon: <Calendar size={16} /> },
  { id: 'chat',         label: 'Capture Assistant',   icon: <MessageSquare size={16} /> },
];

// ── Solicitation input bar ────────────────────────────────────────────────────
function SolicitationBar({ onAudit, auditing }) {
  const [input, setInput]   = useState('');
  const [mode,  setMode]    = useState('url'); // 'url' | 'paste'

  const handle = () => {
    if (!input.trim() || auditing) return;
    onAudit(input.trim(), mode);
  };

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
      <div style={{ maxWidth: 900, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          {[{ id: 'url', icon: <Link size={13} />, label: 'URL' }, { id: 'paste', icon: <FileText size={13} />, label: 'Text' }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              padding: '8px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              background: mode === m.id ? '#002244' : '#f8fafc',
              color: mode === m.id ? '#fff' : '#64748b',
              fontSize: 11, fontWeight: 700, transition: 'all 0.15s'
            }}>
              {m.icon}{m.label}
            </button>
          ))}
        </div>

        {/* Input */}
        {mode === 'url' ? (
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            placeholder="Paste SAM.gov opportunity URL — e.g. sam.gov/opp/abc123.../view"
            style={{
              flex: 1, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 13, color: '#0f172a', outline: 'none', background: '#f8fafc'
            }}
          />
        ) : (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste solicitation text (Section L, M, H, SOW) — minimum 200 characters"
            rows={3}
            style={{
              flex: 1, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 13, color: '#0f172a', outline: 'none', background: '#f8fafc',
              resize: 'vertical', fontFamily: 'inherit'
            }}
          />
        )}

        {/* Audit button */}
        <button
          onClick={handle}
          disabled={!input.trim() || auditing}
          style={{
            padding: '9px 18px', background: auditing ? '#94a3b8' : '#002244', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
            cursor: auditing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
            gap: 6, flexShrink: 0, whiteSpace: 'nowrap', height: 'fit-content'
          }}
        >
          {auditing ? <Loader2 size={14} className="spin" /> : <Brain size={14} />}
          {auditing ? 'Analyzing...' : 'Run Audit'}
        </button>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function GovConDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [session,   setSession]   = useState(null);
  const [auditing,  setAuditing]  = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [auditError,setAuditError]= useState(null);
  const [log,       setLog]       = useState([]);

  useEffect(() => {
    document.documentElement.style.setProperty('--background', '#ffffff');
    document.documentElement.style.setProperty('--card', '#f8fafc');
    document.documentElement.style.setProperty('--border', '#e2e8f0');
    document.documentElement.style.setProperty('--text-primary', '#0f172a');
    document.documentElement.style.setProperty('--text-secondary', '#475569');
    document.documentElement.style.setProperty('--accent', '#2563eb');
    document.documentElement.style.setProperty('--accent-soft', 'rgba(37,99,235,0.05)');
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('aris_authenticated');
    window.location.href = '/';
  };

  const runAudit = async (input, mode) => {
    setAuditing(true);
    setAuditError(null);
    setLog(['[AUDIT] Starting intelligence analysis...']);
    setActiveTab('intelligence');

    try {
      let res;
      if (mode === 'url') {
        setLog(l => [...l, '[AUDIT] Fetching solicitation from SAM.gov...']);
        res = await fetch('/api/analyze-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input }),
        });
      } else {
        setLog(l => [...l, '[AUDIT] Processing solicitation text...']);
        // Use govcon/generate-matrix for raw text — returns compliance + intelligence
        res = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setLog(l => [...l, `[AUDIT] Complete — ${data.requirements?.length || 0} requirements extracted`, '[AUDIT] Intelligence brief ready']);
      setAuditData(data);
    } catch (err) {
      setAuditError(err.message);
      setLog(l => [...l, `[ERROR] ${err.message}`]);
    } finally {
      setAuditing(false);
    }
  };

  const tabLabel = TABS.find(t => t.id === activeTab)?.label || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9', color: '#0f172a', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 24px', height: 64, borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onBack}>
            <Shield size={24} color="#002244" />
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0B3D91', letterSpacing: '0.05em', fontFamily: "'Playfair Display', serif", textTransform: 'uppercase' }}>BIDSMITH</span>
          </div>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, color: '#64748b' }}>
            <span>Workspace</span><ChevronRight size={12} />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{tabLabel}</span>
          </div>
          {auditData && (
            <>
              <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>ANALYSIS LOADED</span>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {auditData && <ExportToolbar auditData={auditData} />}
          <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{session?.user?.email?.split('@')[0].toUpperCase() || 'OFFICIAL'}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>INSTITUTIONAL ACCESS</div>
            </div>
            <img src="/aris-logo.png" alt="ARIS" style={{ height: 28 }} />
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }} title="Secure Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Solicitation input bar ──────────────────────────────────────────── */}
      <SolicitationBar onAudit={runAudit} auditing={auditing} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left sidebar ──────────────────────────────────────────────────── */}
        <nav style={{ width: 220, borderRight: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
          <div style={{ padding: '0 20px 20px 20px' }}>
            <button onClick={() => { setAuditData(null); setAuditError(null); setLog([]); }} style={{ width: '100%', padding: '11px', background: '#002244', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,34,68,0.15)' }}>
              <Plus size={15} />New Solicitation
            </button>
          </div>

          <div style={{ padding: '0 20px 10px', fontSize: 10, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em' }}>ANALYSIS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
            {TABS.map(t => (
              <NavButton key={t.id} active={activeTab === t.id} icon={t.icon} label={t.label} onClick={() => setActiveTab(t.id)} />
            ))}
          </div>

          {/* Log feed */}
          {log.length > 0 && (
            <div style={{ margin: '16px 12px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', maxHeight: 130, overflowY: 'auto' }}>
              {log.map((line, i) => (
                <div key={i} style={{ fontSize: 10, color: line.startsWith('[ERROR]') ? '#dc2626' : '#64748b', fontFamily: 'monospace', lineHeight: 1.7 }}>{line}</div>
              ))}
            </div>
          )}

          {/* Audit stats */}
          {auditData && (
            <div style={{ margin: '12px 12px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', marginBottom: 8 }}>ANALYSIS SUMMARY</div>
              <StatRow label="Requirements" value={auditData.requirements?.length || 0} />
              <StatRow label="HIGH Risk" value={auditData.requirements?.filter(r => r.risk === 'HIGH').length || 0} valueColor="#dc2626" />
              <StatRow label="Disqualifiers" value={auditData.requirements?.filter(r => r.is_disqualifier).length || 0} valueColor="#dc2626" />
              <StatRow label="Win Probability" value={`${auditData.verdict?.win_probability || 50}%`} valueColor="#16a34a" />
              <StatRow label="Risk Score" value={auditData.riskAssessment?.score || 50} valueColor="#d97706" />
            </div>
          )}

          <div style={{ marginTop: 'auto', padding: '16px 12px 0' }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Zap size={12} color="#f59e0b" />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>COMPUTE QUOTA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 3 }}>
                  <div style={{ width: '85%', height: '100%', background: '#002244', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>85%</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>Mercury 2 · Gemini 2.5 Flash</div>
            </div>
          </div>
        </nav>

        {/* ── Main workspace ──────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9', padding: '24px 28px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Error banner */}
            {auditError && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                <AlertTriangle size={16} color="#dc2626" />
                <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>{auditError}</div>
              </div>
            )}

            {/* Loading overlay */}
            {auditing && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 20px' }}>
                <div style={{ position: 'relative', width: 64, height: 64 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #e2e8f0' }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #002244', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  <Brain size={22} color="#002244" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Analyzing solicitation...</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Mercury 2 is reading between the lines</div>
              </div>
            )}

            {/* Tab content */}
            {!auditing && (
              <>
                {activeTab === 'intelligence' && <IntelligenceBrief auditData={auditData} />}
                {activeTab === 'compliance'   && <ComplianceMatrix  auditData={auditData} />}
                {activeTab === 'action'       && <ActionPlan        auditData={auditData} />}
                {activeTab === 'chat'         && <BidSmithChat      auditData={auditData} />}
              </>
            )}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { margin: 0; background: #f1f5f9; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .dashboard-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 24px; }
        :root {
          --background: #ffffff; --card: #ffffff; --border: #e2e8f0;
          --text-primary: #0f172a; --text-secondary: #475569;
          --accent: #002244; --accent-soft: rgba(0,34,68,0.05);
          --success: #16a34a; --risk-high: #dc2626; --risk-medium: #d97706;
        }
      `}} />
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: active ? '#f1f5f9' : 'transparent', border: 'none', borderRadius: 8, color: active ? '#002244' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 600, transition: 'all 0.15s', position: 'relative' }}>
      {icon}<span>{label}</span>
      {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#002244', borderRadius: '0 4px 4px 0' }} />}
    </button>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: valueColor || '#0f172a' }}>{value}</span>
    </div>
  );
}
