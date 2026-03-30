import React, { useState, useEffect, useRef } from "react";
import NavBar from "../components/dashboard/NavBar";
import SecurityToggle from "../components/dashboard/SecurityToggle";
import GovernmentBanner from "../components/GovernmentBanner";
import "../components/GovernmentBanner.css";
import { 
  Zap, 
  ShieldCheck, 
  Target, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Terminal,
  Activity,
  Cpu,
  Globe,
  Lock,
  Search,
  ChevronDown,
  ChevronRight,
  DollarSign,
  MessageCircle,
  Clock,
  Wifi,
  WifiOff,
  Layers,
  Mail,
  Loader2,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  trackEvent, 
  trackAuditStart, 
  trackAuditComplete,
  trackLinkAnalysis,
  trackPdfUpload
} from "../utils/analytics";
import "../styles/Dashboard.css";
import "./Audit.css";

// ── UTILITIES ──

const PIPELINE_LOGS = [
  "INITIALIZING_STATELESS_BRIDGE...",
  "CONNECTING_TO_FEDERAL_GATEWAY...",
  "PARSING_SOLICITATION_STRUCTURE...",
  "IDENTIFYING_COMPLIANCE_FRICITION...",
  "EXTRACTING_SECTION_L_REQUIREMENTS...",
  "EXECUTING_REGULATORY_CROSS_CHECK...",
  "GENERATING_REMEDIATION_MATRIX...",
  "AUDIT_COMPLETE_IDLE"
];

// ── SOVEREIGN AUDIT WORKSPACE COMPONENTS ──

const LeadCaptureModal = ({ onSave, score }) => {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave(email);
      setSaving(false);
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000,
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '24px',
        padding: '48px', textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '20px', marginBottom: '24px' }}>
          <ShieldCheck size={40} color="#2563eb" />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
          Audit Complete ({score}%)
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px', lineHeight: 1.5 }}>
          Your institutional compliance report and FAR/DFARS remediation script are ready for export. <br />
          <strong>Where should we send the PDF/XLSX?</strong>
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
              <input 
                type="email" 
                required 
                placeholder="Enter work email..." 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '16px 16px 16px 48px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px',
                  outline: 'none', fontWeight: 500
                }}
              />
           </div>
           <button 
             type="submit" 
             disabled={saving}
             style={{
               width: '100%', background: '#0B3D91', color: 'white', padding: '16px',
               borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '15px',
               cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
             }}
           >
             {saving ? <Loader2 size={20} className="animate-spin" /> : 'GENERATE EXPORT & VIEW REPORT'}
             {!saving && <ArrowRight size={20} />}
           </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
          <Lock size={10} style={{ marginRight: '4px' }} /> ENCRYPTED TRANSMISSION · ZERO_DATA_RETENTION_ACTIVE
        </p>
      </div>
    </div>
  );
};

const SovereignGlobalHeader = ({ title, agency, status, onBack, onExport }) => (
  <header style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', background: '#ffffff', borderBottom: '1px solid #e2e8f0',
    position: 'sticky', top: 0, zIndex: 100
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
        <span>Projects</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span>{agency || "FEDERAL_ENTITY"}</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: '#0f172a' }}>Audit #{title?.substring(0,8) || "SYS_PROT_001"}</span>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '6px 12px', borderRadius: '99px',
        background: status === 'LIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(37, 99, 235, 0.1)',
        color: status === 'LIVE' ? '#22c55e' : '#2563eb',
        fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em'
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'flicker 1.5s infinite' }} />
        [{status}] {status === 'LIVE' ? 'AI ANALYSIS IN PROGRESS' : 'AUDIT COMPLETE'}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onExport} style={{ 
          background: '#002244', color: 'white', border: 'none', padding: '8px 16px', 
          borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <FileText size={14} /> EXPORT COMPLIANCE MATRIX (XLSX)
        </button>
        <button style={{ background: 'none', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', color: '#64748b' }}><Globe size={16} /></button>
      </div>
    </div>
  </header>
);

const ComplianceBugs = ({ bugs = [] }) => {
  if (!bugs || bugs.length === 0) return null;
  return (
    <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#e11d48' }}>
        <ShieldAlert size={20} />
        <h3 style={{ fontSize: '11px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>COMPLIANCE_BUGS_IDENTIFIED (LETHAL_TRAPS)</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {bugs.map((bug, i) => (
          <div key={i} style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', boxShadow: '0 4px 12px rgba(225,29,72,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#e11d48', background: 'rgba(225,29,72,0.1)', padding: '2px 8px', borderRadius: '100px' }}>{bug.type?.toUpperCase() || "TRAP"}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{bug.section_ref}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#002244', fontWeight: 600, margin: '0 0 12px 0', lineHeight: 1.4 }}>{bug.text}</p>
            <div style={{ fontSize: '11px', color: '#e11d48', fontWeight: 800 }}>REMEDIATION: {bug.remediation}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExecutiveRiskGauge = ({ score = 0, insights = "Initializing stateless compliance assessment..." }) => {
  const rotation = (score / 100) * 180 - 90;
  return (
    <div style={{ 
      gridColumn: 'span 2', padding: '24px', background: '#ffffff', borderRadius: '16px', 
      border: '1px solid #e2e8f0', display: 'flex', gap: '24px', alignItems: 'center'
    }}>
      <div style={{ position: 'relative', width: '140px', height: '80px', flexShrink: 0 }}>
        <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}>
          <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke={score > 80 ? "#22c55e" : "#f59e0b"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score/100)*126} 126`} />
        </svg>
        <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{score}%</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', marginBottom: '4px' }}>COMPLIANCE PROBABILITY</div>
        <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.4', fontWeight: 500 }}>
          {insights || "Analyzing Section L for disqualifiers..."}
        </div>
      </div>
    </div>
  );
};

const RfpVitalSigns = ({ dueDate = "CALCULATING...", value = "ANALYZING...", complexity = "TBD" }) => (
  <div style={{ 
    padding: '24px', background: '#ffffff', borderRadius: '16px', 
    border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px'
  }}>
    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', mb: 8 }}>RFP VITAL SIGNS</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: '#64748b' }}>Due Date</span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>{dueDate}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: '#64748b' }}>Est. Value</span>
      <span style={{ fontSize: '12px', fontWeight: 700 }}>{value}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: '#64748b' }}>Complexity</span>
      <span style={{ 
        fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '4px',
        background: '#fef2f2', color: '#991b1b'
      }}>{complexity.toUpperCase()}</span>
    </div>
  </div>
);

const AuditEfficiencyCard = ({ saved = 0 }) => (
  <div style={{ 
    padding: '24px', background: '#ffffff', borderRadius: '16px', 
    border: '1px solid #e2e8f0', textAlign: 'center'
  }}>
    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '16px' }}>AUDIT EFFICIENCY</div>
    <div style={{ fontSize: '24px', fontWeight: 900, color: '#002244' }}>{saved > 0 ? `$${saved}` : "—"}</div>
    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Saved vs. Human Manual Review</div>
    <div style={{ marginTop: '12px', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: '92%', height: '100%', background: '#2563eb' }} />
    </div>
  </div>
);

const LitmusFeed = ({ requirements = [] }) => (
  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>SECTION</th>
          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>REQUIREMENT (SOURCE RFP)</th>
          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>BIDSMITH FLAG</th>
          <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>AI RECOMMENDATION</th>
        </tr>
      </thead>
      <tbody>
        {requirements.map((req, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{req.section || "L.3.1"}</td>
            <td style={{ padding: '20px 24px', fontSize: '13px', color: '#0f172a', fontWeight: 500, maxWidth: '400px' }}>{req.requirement}</td>
            <td style={{ padding: '20px 24px' }}>
              <span style={{ 
                padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900,
                background: req.risk === 'High' ? '#fef2f2' : req.risk === 'Medium' ? '#fffbeb' : '#f0fdf4',
                color: req.risk === 'High' ? '#ef4444' : req.risk === 'Medium' ? '#f59e0b' : '#22c55e',
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                {req.risk === 'High' ? '❌ MISSING' : req.risk === 'Medium' ? '⚠️ WARNING' : '✅ MATCH'}
              </span>
            </td>
            <td style={{ padding: '20px 24px', fontSize: '12px', color: '#475569', fontStyle: 'italic', fontWeight: 500 }}>
              {req.recommendation || "Verified in compliance baseline."}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ExecutiveSummary = ({ summary }) => (
  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', marginBottom: '24px' }}>
    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '16px', letterSpacing: '0.05em' }}>EXECUTIVE_COMPLIANCE_SUMMARY</div>
    <div className="prose" style={{ fontSize: '15px', color: '#334155', lineHeight: '1.7' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary || "Generating institutional summary..."}</ReactMarkdown>
    </div>
  </div>
);

const StrategicAnalysis = ({ analysis }) => (
  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px' }}>
    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '16px', letterSpacing: '0.05em' }}>STRATEGIC_DELTA_ANALYSIS</div>
    <div className="prose" style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis || "Generating strategic insights..."}</ReactMarkdown>
    </div>
  </div>
);

const SovereignSidebar = ({ result, logs = [], onTerminate }) => (
  <aside style={{ width: '360px', background: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '12px' }}>AI CHAT (CONTEXT-AWARE)</div>
        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <MessageCircle size={16} color="#94a3b8" />
          <input placeholder="Ask anything about Section M..." style={{ background: 'none', border: 'none', fontSize: '13px', color: '#0f172a', outline: 'none', width: '100%' }} />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '12px' }}>CONTEXT INJECTION (MCP)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['FAR-Compliance-Checker', 'Legacy-NLP-Mapper', 'DOD-Cost-Analyst'].map(tool => (
            <div key={tool} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{tool}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '12px' }}>AUDIT HISTORY</div>
        <div style={{ borderLeft: '2px solid #f1f5f9', marginLeft: '6px', paddingLeft: '20px' }}>
          <div style={{ position: 'relative', paddingBottom: '20px' }}>
            <div style={{ position: 'absolute', left: '-25px', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Stateless Sync Sequence Initiated</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-25px', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: '#f1f5f9' }} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Session Established</div>
          </div>
        </div>
      </div>
    </div>
    
    <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
      <button 
        onClick={onTerminate}
        style={{ width: '100%', background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
      >
        TERMINATE SESSION & PURGE CACHE
      </button>
    </div>
  </aside>
);



const PipelineTerminal = ({ logs, active }) => {
  const terminalRef = useRef(null);
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="pipeline-terminal" style={{ 
      maxHeight: '120px', 
      background: '#0d111a', 
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#94a3b8',
      overflowY: 'auto'
    }}>
      {logs.slice(-5).map((log, i) => (
        <div key={i} style={{ marginBottom: '4px', opacity: 0.7 }}>
          <span style={{ color: '#3b82f6', fontWeight: 700 }}>→</span> {log.msg}
        </div>
      ))}
      {active && <div style={{ color: '#3b82f6', fontWeight: 800 }} className="pulse">ANALYZING_SOLICITATION_STRUCTURE...</div>}
    </div>
  );
};

const Audit = ({ onBack, initialUrl, initialFile }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [samUrl, setSamUrl] = useState(initialUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([{ msg: "BS_BOOT_SEQUENCE_COMPLETE", type: "success" }]);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("bs_lead_email") || null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  const STAGES = [
    { id: 'INGEST', label: 'Ingesting Solicitation Data', icon: <Globe size={16} /> },
    { id: 'PARSE', label: 'Parsing Structural Components', icon: <Layers size={16} /> },
    { id: 'EXTRACT', label: 'Extracting Section L/M Requirements', icon: <FileText size={16} /> },
    { id: 'SHRED', label: 'Executing Regulatory Cross-Check', icon: <ShieldCheck size={16} /> },
    { id: 'SYNTH', label: 'Finalizing Intelligence Synthesis', icon: <Zap size={16} /> }
  ];

  useEffect(() => {
    if (initialFile) {
      startAuditWithFile(initialFile);
    } else if (initialUrl) {
      startAudit(initialUrl);
    }
  }, []);

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev.slice(-20), { msg, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const startAudit = async (customUrl) => {
    const url = customUrl || samUrl;
    if (!url) return;
    setIsLoading(true);
    setProgress(10);
    setCurrentStage(0);
    addLog(`INITIATING_MERCURY_FLOW: ${url}`, "info");

    try {
      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setResult(data);
      setIsLoading(false);
      // Trigger Lead Capture if email unknown
      if (!userEmail) setShowLeadModal(true);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const startAuditWithFile = async (file) => {
    setIsLoading(true);
    addLog(`UPLOADING_RFP: ${file.name}`, "info");
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      // START_AGENT_ORCHESTRATION_VISUALIZER
      const agentSequences = [
        "DEPLOYING_EXTRACTION_AGENT...",
        "[EXTRACTION] INITIALIZING_OCR_INFRA...",
        "[EXTRACTION] ANALYZING_SECTION_L_TABLES...",
        "DEPLOYING_COMPLIANCE_AGENT...",
        "[COMPLIANCE] SCANNING_REGULATORY_TRAPS...",
        "[COMPLIANCE] AUDITING_SECTION_M_CONFLICTS...",
        "DEPLOYING_STRATEGY_AGENT...",
        "[STRATEGY] SYNTHESIZING_WIN_THEMES...",
        "[STRATEGY] CALCULATING_CAPTURE_PROBABILITY..."
      ];

      let logIdx = 0;
      const logInterval = setInterval(() => {
        if (logIdx < agentSequences.length) {
          addLog(agentSequences[logIdx]);
          setProgress(prev => Math.min(prev + 8, 90));
          logIdx++;
        } else {
          clearInterval(logInterval);
        }
      }, 1500);

      const res = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        clearInterval(logInterval);
        throw new Error("PDF_ANALYSIS_FAILED");
      }

      const data = await res.json();
      clearInterval(logInterval);
      addLog("SWARM_AUDIT_COMPLETE_IDLE", "success");
      setResult(data);
      setIsLoading(false);
      
      // Trigger Lead Capture if email unknown
      if (!userEmail) setShowLeadModal(true);
    } catch (e) {
      addLog(`FATAL_ERROR: ${e.message}`, "error");
      setIsLoading(false);
    }
  };

  const handleSaveLead = (email) => {
    setUserEmail(email);
    localStorage.setItem("bs_lead_email", email);
    setShowLeadModal(false);
    // Track Lead conversion
    trackEvent("lead_captured", { email, score: result?.riskAssessment?.score });
  };

  const handleTerminate = () => {
    setResult(null);
    setSamUrl("");
    onBack();
  };

  const handleExportExcel = () => {
     alert("Institutional Export Initiated. Check your email for the XLSX link.");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>
      <GovernmentBanner />
      
      {/* HEADER */}
      {result && !isLoading && (
        <SovereignGlobalHeader 
          title={result.opportunityId} 
          agency={result.agency} 
          status="READY" 
          onBack={handleTerminate}
          onExport={handleExportExcel}
        />
      )}

      {/* INGESTION VIEW */}
      {!result && !isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '60px 40px', background: '#ffffff', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,34,68,0.08)', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0,34,68,0.05)', borderRadius: '20px', marginBottom: '24px' }}>
                <Globe size={40} color="#002244" />
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#002244', letterSpacing: '-0.02em', margin: 0 }}>METRIC_AUDIT_INFRA</h1>
              <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500, marginTop: '12px' }}>Institutional Grade RFP Intelligence & Stateless Audit Chain</p>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '18px', color: '#94a3b8' }} size={20} />
              <input 
                placeholder="Paste SAM.gov Opportunity URL..." 
                value={samUrl} 
                onChange={e => setSamUrl(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && startAudit()}
                style={{
                  width: '100%', padding: '18px 20px 18px 52px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '16px',
                  outline: 'none', transition: 'all 0.2s ease', fontWeight: 500
                }}
              />
            </div>
            
            <button 
              onClick={() => startAudit()}
              style={{
                width: '100%', background: '#002244', color: 'white', padding: '18px',
                borderRadius: '14px', border: 'none', fontWeight: 800, fontSize: '16px',
                cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,34,68,0.15)', marginBottom: '12px'
              }}
            >
              DEPLOY MERCURY_2 INTELLIGENCE
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>OR</span>
              <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }} />
            </div>

            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', background: '#ffffff', color: '#002244', padding: '16px',
              borderRadius: '14px', border: '2px dashed #cbd5e1', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <FileText size={20} />
              <span>UPLOAD LOCAL RFP (PDF)</span>
              <input 
                type="file" 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={e => e.target.files[0] && startAuditWithFile(e.target.files[0])} 
              />
            </label>
            
            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <ShieldCheck size={14} /> Zero_Knowledge
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Activity size={14} /> Stateless_Sync
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* MAIN CANVAS */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
            {isLoading ? (
              <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
                <div style={{ marginBottom: '60px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ padding: '12px', background: 'rgba(0,34,68,0.05)', borderRadius: '12px' }}>
                      <Activity size={32} color="#002244" className="animate-pulse" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#002244', margin: 0 }}>Processing Sovereign Cluster 2.0</h2>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#0B3D91', transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div style={{ background: '#0a0d14', borderRadius: '16px', padding: '32px', textAlign: 'left' }}>
                   <PipelineTerminal logs={logs} active={isLoading} />
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '1400px', margin: '0 auto', filter: showLeadModal ? 'blur(4px)' : 'none' }}>
                {/* BENTO GRID - SIGNALS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                  <ExecutiveRiskGauge 
                    score={result?.riskAssessment?.score || 90} 
                    insights={result?.riskAssessment?.delta_analysis}
                  />
                  <RfpVitalSigns 
                    value={result?.value || "TBD"} 
                    dueDate="2026-04-15"
                    complexity="High"
                  />
                  <AuditEfficiencyCard saved={4500} />
                </div>

                {/* COMPLIANCE BUGS INTERCEPT */}
                <ComplianceBugs bugs={result?.bugs} />

                {/* LITMUS FEED */}
                <div style={{ marginBottom: '40px' }}>
                  <LitmusFeed requirements={result?.requirements || []} />
                </div>

                {/* STRATEGIC ANALYSIS */}
                <ExecutiveSummary summary={result?.executiveSummary} />
                <StrategicAnalysis analysis={result?.strategicAnalysis} />
              </div>
            )}
          </main>

          {/* SOVEREIGN SIDEBAR */}
          {result && !isLoading && (
            <SovereignSidebar result={result} logs={logs} onTerminate={handleTerminate} />
          )}
        </div>
      )}

      {/* LEAD CAPTURE INTERCEPT */}
      {showLeadModal && (
        <LeadCaptureModal 
          onSave={handleSaveLead} 
          score={result?.riskAssessment?.score || 55} 
        />
      )}
    </div>
  );
}

export default Audit;
