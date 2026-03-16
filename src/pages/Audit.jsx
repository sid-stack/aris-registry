import React, { useState, useEffect, useRef } from "react";
import ARISChat from "../components/dashboard/ARISChat";
import NavBar from "../components/dashboard/NavBar";
import SecurityToggle from "../components/dashboard/SecurityToggle";
import { 
  Zap, 
  ShieldCheck, 
  Target, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  Laptop, 
  Globe, 
  Search, 
  Copy, 
  Download, 
  Share2,
  Terminal,
  Activity,
  User,
  Cpu
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trackEvent } from "../utils/analytics";
import "../styles/Dashboard.css";
import "./Audit.css";

// ── UTILITIES ──

const LOADING_STEPS = [
  "INITIALIZING_QUANTUM_SCAN...",
  "CONNECTING_TO_FEDERAL_GATEWAY...",
  "PARSING_SOLICITATION_STRUCTURE...",
  "IDENTIFYING_COMPLIANCE_FRICITION...",
  "EXTRACTING_SECTION_L_REQUIREMENTS...",
  "RUNNING_RISK_MODELS...",
  "FINALIZING_ZERO_KNOWLEDGE_REPORT..."
];

function useLoadingStep(active) {
  const [step, setStep] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (!active) { setStep(0); return; }
    ref.current = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 1500);
    return () => clearInterval(ref.current);
  }, [active]);
  return { stepText: LOADING_STEPS[step], stepIndex: step };
}

// ── COMPONENTS ──

function FeatureTip({ icon, title, text }) {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  );
}

function StatusBadge({ assessment }) {
  if (!assessment) return null;
  const { disqualified, risk_level } = assessment;
  const isDanger = disqualified || risk_level === "HIGH";
  
  return (
    <div className={`audit-status-strip ${isDanger ? 'danger' : 'success'}`}>
      {isDanger ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
      <span>{disqualified ? "STATUS: NON-RESPONSIVE DETECTED" : risk_level === "HIGH" ? "STATUS: HIGH_RISK_PROFILE" : "STATUS: RESPONSIBILITY_VERIFIED"}</span>
    </div>
  );
}

export default function Audit({ onBack }) {
  const [theme, setTheme] = useState("dark");
  const [samUrl, setSamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  
  const { stepText, stepIndex } = useLoadingStep(isLoading);
  const esRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const startAudit = async (url) => {
    const finalUrl = url || samUrl;
    if (!finalUrl.trim()) return;
    setSamUrl(finalUrl);
    setIsLoading(true);
    setError("");
    setResult(null);
    setReport(null);
    trackEvent("audit_start", { url: finalUrl });
    
    try {
      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "WE COULD NOT ACCESS GATEWAY. TRY DIRECT UPLOAD.");
      setResult(data);
      streamReport(data);
      trackEvent("audit_success", { url: finalUrl, title: data.title });
    } catch (e) {
      setError(e.message);
      setShowUpload(true);
      trackEvent("audit_error", { url: finalUrl, error: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const streamReport = (auditData) => {
    if (esRef.current) esRef.current.close();
    const json = JSON.stringify({ pillars: auditData.compliance, title: auditData.title || "" });
    const ctx = btoa(unescape(encodeURIComponent(json)));
    const es = new EventSource(`/api/generate-report-stream?ctx=${encodeURIComponent(ctx)}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "agent_done") {
        if (msg.data?.proposal_draft) setReport(prev => ({ ...(prev || {}), proposal_draft: msg.data.proposal_draft }));
      } else if (msg.type === "pipeline_complete") {
        es.close();
      }
    };
  };

  return (
    <div className="audit-page-container">
      <NavBar theme="dark" onToggleTheme={toggleTheme} onBack={onBack} />

      <div className="audit-workspace">
        
        {/* Masthead Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '-16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', background: '#1e1b4b', borderRadius: '4px', border: '1px solid #312e81' }}>
            <Activity size={10} color="#818cf8" />
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', color: '#52525b', textTransform: 'uppercase' }}>Zero-Knowledge Audit Suite</span>
        </div>

        {!result && !isLoading && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="audit-hero-card">
              <h1 className="audit-hero-title">Federal Opportunity Audit</h1>
              <p className="audit-hero-subtitle">
                Deploying stateless intelligence to verify contract eligibility. 
                Paste a SAM.gov link to identify risk friction and compliance traps.
              </p>
              
              <div className="audit-input-group">
                <Globe className="audit-input-icon" size={20} />
                <input 
                  type="text"
                  value={samUrl}
                  onChange={e => setSamUrl(e.target.value)}
                  placeholder="Paste SAM.gov Opportunity Link..."
                  className="audit-main-input"
                />
              </div>

              <button 
                onClick={() => startAudit()}
                disabled={!samUrl}
                className="audit-action-btn"
              >
                <Cpu size={18} /> INITIALIZE AUDIT PROTOCOL
              </button>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <input 
                  type="file" 
                  id="audit-file-upload" 
                  hidden 
                  accept=".pdf" 
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      trackEvent("audit_file_upload_select", { fileName: file.name });
                      // Add file processing logic here if needed
                    }
                  }} 
                />
                <label 
                  htmlFor="audit-file-upload"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                >
                  <FileText size={14} /> or upload solicitation PDF
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <FeatureTip icon={<ShieldCheck />} title="STATLESS ARCHITECTURE" text="Aris processes data in transient memory. No bid data is persisted server-side." />
              <FeatureTip icon={<Target />} title="COMPLIANCE LINTING" text="Automated scanning for disqualifying clauses and structural requirement mismatches." />
              <FeatureTip icon={<TrendingUp />} title="WIN PROBABILITY" text="Predictive modeling based on agency spending history and competitive density." />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="audit-loading-view fade-in">
            <div className="audit-spinner-container">
              <div className="audit-spinner-outer" />
              <div className="audit-spinner-inner">
                <ShieldCheck color="var(--accent)" size={40} />
              </div>
            </div>
            
            <h2 className="audit-loading-title">{stepText}</h2>
            <p className="audit-loading-subtitle">ARIS Engine is parsing federal source of truth. Validating solicitation integrity...</p>
            
            <div className="audit-log-sequence">
              {LOADING_STEPS.map((s, idx) => (
                <div key={idx} className="audit-log-item" style={{ opacity: idx <= stepIndex ? 1 : 0.15 }}>
                  <div className="audit-log-dot" style={{ background: idx < stepIndex ? 'var(--success)' : 'var(--accent)' }} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="fade-in" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="var(--risk-high)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>CONNECTION_INTERRUPTED</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
            <button 
              onClick={() => setShowUpload(true)}
              style={{ background: 'var(--risk-high)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              UPLOAD PDF TO BYPASS GATEWAY
            </button>
          </div>
        )}

        {result && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>{result.title}</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <div className="audit-info-label" style={{ background: 'rgba(30,127,255,0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px' }}>SOLICITATION: READY</div>
                   <div className="audit-info-label" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px' }}>VAULT: ENCRYPTED</div>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="audit-action-btn"
                style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }}
              >
                <Zap size={14} fill="white" /> OPEN WORKBENCH
              </button>
            </div>

            <StatusBadge assessment={result.compliance?.disqualification_assessment} />
            
            <div className="audit-grid">
              <div className="audit-info-card">
                <div className="audit-info-label">SUBMISSION DEADLINE</div>
                <div className="audit-info-value">{result.compliance?.deadline_date?.value || "—"}</div>
              </div>
              <div className="audit-info-card">
                <div className="audit-info-label">GOVERNMENT SET-ASIDE</div>
                <div className="audit-info-value">{result.compliance?.set_aside_type?.value || "NO_LIMITS"}</div>
              </div>
            </div>

            {report?.proposal_draft && (
              <div className="audit-memo-section">
                <div className="audit-memo-header">
                  <Terminal size={18} color="var(--accent)" />
                  <span className="audit-memo-title">EXECUTIVE RISK SUMMARY</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                     <button onClick={() => {}} className="theme-toggle"><Copy size={12} /></button>
                     <button onClick={() => {}} className="theme-toggle"><Download size={12} /></button>
                  </div>
                </div>
                <div className="audit-markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.proposal_draft}</ReactMarkdown>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
               <button onClick={onBack} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Generate New Audit</button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Interface (Themed) */}
      {isChatOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '900px', height: '90vh', background: 'var(--background)', border: '1px solid var(--border)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--nav-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Zap size={18} color="var(--accent)" fill="var(--accent)" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>ARIS_INTELLIGENCE_WORKBENCH</div>
                  <div style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 700 }}>SESSION_ACTIVE // ZERO_KNOWLEDGE</div>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="theme-toggle"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                DISMISS
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }} className="aris-chat-enhanced">
              <ARISChat reportData={result} />
            </div>
          </div>
        </div>
      )}
      
      {!isChatOpen && result && (
        <button 
          onClick={() => setIsChatOpen(true)}
          style={{ position: 'fixed', bottom: '32px', right: '32px', width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Zap size={28} fill="white" />
        </button>
      )}
    </div>
  );
}
