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
  WifiOff
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
      background: 'var(--background-alt)', 
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '11px',
      fontFamily: 'monospace',
      color: 'var(--text-secondary)',
      overflowY: 'auto'
    }}>
      {logs.slice(-5).map((log, i) => (
        <div key={i} style={{ marginBottom: '4px', opacity: 0.7 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span> {log.msg}
        </div>
      ))}
      {active && <div style={{ color: 'var(--accent)', fontWeight: 800 }} className="pulse">ANALYZING_SOLICITATION_STRUCTURE...</div>}
    </div>
  );
};

const ComplianceHeatmap = ({ intensity = [] }) => {
  return (
    <div className="heatmap-container">
      {Array.from({ length: 142 }).map((_, i) => (
        <div 
          key={i} 
          className={`heatmap-cell ${i < 10 ? 'high' : i < 30 ? 'med' : 'low'}`}
          title={`Clause ${i + 1} Assessment`}
        />
      ))}
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
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  const STAGES = [
    { id: 'INGEST', label: 'Ingesting Solicitation Data', icon: <Globe size={16} /> },
    { id: 'PARSE', label: 'Parsing Structural Components', icon: <Layers size={16} /> },
    { id: 'EXTRACT', label: 'Extracting Section L/M Requirements', icon: <FileText size={16} /> },
    { id: 'SHRED', label: 'Executing Regulatory Cross-Check', icon: <ShieldCheck size={16} /> },
    { id: 'SYNTH', label: 'Finalizing Intelligence Synthesis', icon: <Zap size={16} /> }
  ];
  const [showFatalError, setShowFatalError] = useState(false);
  const [fatalErrorData, setFatalErrorData] = useState(null);
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [dynamicPrice, setDynamicPrice] = useState(99);
  const [logs, setLogs] = useState([{ msg: "BS_BOOT_SEQUENCE_COMPLETE", type: "success" }]);
  
  const esRef = useRef(null);

  useEffect(() => {
    if (initialFile) {
      startAuditWithFile(initialFile);
    } else if (initialUrl) {
      startAudit(initialUrl);
    }
  }, []);

  const startAuditWithFile = async (file) => {
    setIsLoading(true);
    addLog(`UPLOADING_RFP: ${file.name}`, "info");
    
    // Fake logs for effect
    const stages = ["EXTRACTING_TEXT_LAYERS...", "RUNNING_SHALL_MUST_SCAN...", "MAPPING_COMPLIANCE_VECTOR..."];
    stages.forEach((s, i) => setTimeout(() => addLog(s), i * 1500));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("PDF_ANALYSIS_FAILED");
      const data = await res.json();
      
      setResult(data);
      addLog("EXTRACTION_COMPLETE", "success");
      setIsLoading(false);
      streamReport(data);
    } catch (e) {
      setError(e.message);
      addLog(`FATAL_ERROR: ${e.message}`, "error");
      setIsLoading(false);
    }
  };

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev.slice(-15), { msg, type }]);
  };

  const calculateDisplayPrice = (val) => {
    let num = 0;
    if (typeof val === 'string') {
      const clean = val.replace(/[$,]/g, '').toUpperCase();
      if (clean.endsWith('M')) num = parseFloat(clean) * 1000000;
      else if (clean.endsWith('K')) num = parseFloat(clean) * 1000;
      else if (clean.endsWith('B')) num = parseFloat(clean) * 1000000000;
      else num = parseFloat(clean);
    } else {
      num = Number(val) || 0;
    }

    if (num >= 10000000) return 299;
    return 99;
  };

  const handlePurchase = async () => {
    if (isCheckoutLoading) return;
    
    const estimatedValue = result?.value || result?.pillars?.estimated_value?.value || "45000000";
    const opportunityTitle = result?.title || "RFP Audit";

    setIsCheckoutLoading(true);
    addLog("ESTABLISHING_SECURE_CHECKOUT_BRIDGE...", "info");
    
    try {
      const res = await fetch("/api/create-dynamic-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estimatedValue, 
          packType: 'pro',
          opportunityTitle
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gateway failure");
      }

      const data = await res.json();
      if (data.url) {
        // PERSIST STATE FOR REDIRECT RECOVERY
        if (result) {
          localStorage.setItem('bs_pending_audit', JSON.stringify(result));
        }
        
        addLog("BRIDGE_ESTABLISHED_REDIRECTING...", "success");
        window.location.href = data.url;
        trackEvent('purchase_initiated', { 
          value: calculateDisplayPrice(estimatedValue), 
          currency: 'USD',
          estimated_value: estimatedValue
        });
      }
    } catch (e) {
      console.error("Checkout failed:", e);
      addLog(`CHECKOUT_FATAL: ${e.message.toUpperCase()}`, "error");
      setIsCheckoutLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!result || !result.compliance) {
      addLog("NO_COMPLIANCE_DATA_TO_EXPORT", "error");
      return;
    }

    addLog("GENERATING_INDUSTRIAL_RTM_MATRIX...", "info");
    
    try {
      const res = await fetch("/api/export-rtm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complianceData: result.compliance }),
      });
      
      if (!res.ok) throw new Error("EXCEL_GEN_FAILURE");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BidSmith_Compliance_Matrix_${result.id || 'Audit'}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      addLog("RTM_EXPORT_SUCCESSFUL", "success");
      trackEvent('rtm_export_complete', { solicitation_id: result.id });
    } catch (e) {
      addLog(`EXPORT_FATAL: ${e.message.toUpperCase()}`, "error");
    }
  };

  const isSupportedUrl = (url) => {
    const normalized = url.toLowerCase().trim();
    return normalized.includes('sam.gov') || normalized.endsWith('.pdf');
  };

  const startAudit = async (url) => {
    const finalUrl = url || samUrl;
    if (!finalUrl.trim()) return;
    
    if (!isSupportedUrl(finalUrl)) {
      addLog("UNSUPPORTED_SOURCE: PLEASE PROVIDE A SAM.GOV LINK OR PDF URL.", "error");
      setError("Unsupported URL. Please use a SAM.gov solicitation or a direct PDF link.");
      return;
    }

    setSamUrl(finalUrl);
    setIsLoading(true);
    setError("");
    setResult(null);
    setReport(null);
    addLog(`INITIATING_AUDIT_ON: ${finalUrl.split('/').pop()}`, "info");
    trackAuditStart();
    
    // Simulate streaming logs and progress
    const stagesCount = STAGES.length;
    STAGES.forEach((stage, i) => {
      setTimeout(() => {
        if (isLoading) {
          setCurrentStage(i);
          setProgress(((i + 1) / stagesCount) * 100);
          addLog(`${stage.id}_${PIPELINE_LOGS[i]}`, i === stagesCount - 1 ? "success" : "info");
        }
      }, i * 3000); // 3s per stage visual transition
    });

    try {
      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl.trim() }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("SERVER_COMMUNICATION_FORMAT_ERROR: GATEWAY RETURNED NON-JSON RESPONSE.");
      }

      if (!res.ok) {
        // Handle payment required response
        if (data.paymentRequired) {
          setShowPaymentModal(true);
          setPaymentInfo({
            message: data.message,
            paymentLink: data.paymentLink,
            reportsUsed: data.reportsUsed,
            reportsLimit: data.reportsLimit,
            nextReset: data.nextReset
          });
          addLog("PAYMENT_REQUIRED: MONTHLY_LIMIT_REACHED", "warning");
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.error || "WE COULD NOT ACCESS GATEWAY. TRY DIRECT UPLOAD.");
      }
      
      setResult(data);
      const price = calculateDisplayPrice(data.value || data.pillars?.estimated_value?.value || "45000000");
      setDynamicPrice(price);
      streamReport(data);
      
      // ─── Mercury 2 Compliance Kill-Switch: Trigger Fatal Error for RED-FLAG ───────
      if (data.fatalError && data.riskAssessment) {
        addLog(`FATAL_ERROR: ${data.riskAssessment.verdict} - Score: ${data.riskAssessment.score}`, "error");
        addLog(`DELTA_ANALYSIS: ${data.riskAssessment.delta_analysis}`, "warning");
        setShowFatalError(true);
        setFatalErrorData({
          verdict: data.riskAssessment.verdict,
          score: data.riskAssessment.score,
          breakdown: data.riskAssessment.breakdown,
          deltaAnalysis: data.riskAssessment.delta_analysis
        });
      }
      
      addLog("INTELLIGENCE_SYNTHESIS_COMPLETE", "success");
      trackAuditComplete();
      setIsLoading(false);

    } catch (e) {
      const errMsg = e.message || "UNKNOWN_ERROR";
      if (errMsg.toLowerCase().includes("capacity") || errMsg.toLowerCase().includes("blackout")) {
        setShowFatalError(true);
        setFatalErrorData({
          verdict: "SYSTEM_AT_CAPACITY",
          score: "503",
          breakdown: ["All BidSmith clusters are currently processing high-concurrency audits.", "Intelligence Gateway is queueing requests for cluster stability."],
          deltaAnalysis: "We will be live again momentarily. Please refresh in 60 seconds."
        });
        addLog("SYSTEM_OVER_CAPACITY: DEFERRING_INTELLIGENCE", "warning");
      } else {
        setError(errMsg);
        addLog(`PIPELINE_FATAL_ERROR: ${errMsg}`, "error");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cleanup EventSource on unmount
    return () => {
      if (esRef.current) {
        console.log("Terminating Mercury Audit Stream...");
        esRef.current.close();
      }
    };
  }, []);

  const handleTerminate = () => {
    if (esRef.current) esRef.current.close();
    setResult(null);
    setLogs([]);
    setReport(null);
    setSamUrl("");
    onBack();
  };

  useEffect(() => {
    // Check for post-checkout success
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const savedResult = localStorage.getItem('bs_pending_audit');
      if (savedResult) {
        try {
          const data = JSON.parse(savedResult);
          setResult(data);
          const price = calculateDisplayPrice(data.value || data.pillars?.estimated_value?.value || "45000000");
          setDynamicPrice(price);
          
          // Clear it so we don't re-trigger on refresh
          localStorage.removeItem('bs_pending_audit');
          
          // Resume streaming the full report
          addLog("CHECKOUT_VERIFIED: RESUMING_MERCURY_FLOW", "success");
          streamReport(data);
          trackEvent('purchase_complete', { 
            value: price,
            notice_id: data.noticeId 
          });
        } catch (e) {
          console.error("Failed to restore pending audit:", e);
        }
      }
    }
  }, []);

  const streamReport = (auditData) => {
    if (esRef.current) esRef.current.close();
    const fdicOid =
      auditData.fdicOid ||
      auditData.oid ||
      auditData?.compliance?.fdic_oid?.value ||
      auditData?.compliance?.fdicOid?.value ||
      "";
    const json = JSON.stringify({
      pillars: auditData.compliance,
      title: auditData.title || "",
      agency: auditData.agency || "",
      executiveSummary: auditData.executiveSummary || "",
      fdicOid,
    });
    const ctx = btoa(encodeURIComponent(json));
    const es = new EventSource(`/api/generate-report-stream?ctx=${encodeURIComponent(ctx)}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "agent_done") {
          if (msg.data?.proposal_draft) setReport(prev => ({ ...(prev || {}), proposal_draft: msg.data.proposal_draft }));
        } else if (msg.type === "pipeline_complete") {
          es.close();
          addLog("MERCURY_FLOW_FINALIZED", "success");
        } else if (msg.type === "error") {
          addLog(`STREAM_AGENT_ERROR: ${msg.message}`, "error");
          es.close();
        }
      } catch (err) {
        console.error("Stream parse error:", err);
      }
    };

    es.onerror = (err) => {
      console.error("EventSource failed:", err);
      addLog("STREAM_CONNECTION_INTERRUPTED - RECOVERY_IDLE", "error");
      es.close();
    };

    es.onopen = () => {
      addLog("MERCURY_LIVE_STREAM_ESTABLISHED", "success");
    };
  };

  return (
    <div className="bidsmith-audit-workspace" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* GLOBAL HEADER */}
      {result && !isLoading && (
        <SovereignGlobalHeader 
          title={result.id} 
          agency={result.agency} 
          status={isLoading ? "LIVE" : "FINAL"} 
          onBack={handleTerminate}
          onExport={handleExportExcel}
        />
      )}

      {/* INGESTION VIEW */}
      {!result && !isLoading ? (
        <div className="ingestion-view" style={{ flex: 1 }}>
          <div className="ingestion-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '60px 40px', background: '#ffffff', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,34,68,0.08)', border: '1px solid #e2e8f0' }}>
            <div className="logo-section" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0,34,68,0.05)', borderRadius: '20px', marginBottom: '24px' }}>
                <Globe size={40} color="#002244" />
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#002244', letterSpacing: '-0.02em', margin: 0 }}>METRIC_AUDIT_INFRA</h1>
              <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500, marginTop: '12px' }}>Institutional Grade RFP Intelligence & Stateless Audit Chain</p>
            </div>
            
            <div className="cyber-input-wrapper" style={{ position: 'relative', marginBottom: '16px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '18px', color: '#94a3b8' }} size={20} />
              <input 
                className="cyber-input" 
                placeholder="Paste SAM.gov Opportunity URL..." 
                value={samUrl} 
                onChange={e => setSamUrl(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && startAudit()}
                style={{
                  width: '100%', padding: '18px 20px 18px 52px', background: '#f1f5f9',
                  border: '2px solid transparent', borderRadius: '14px', fontSize: '16px',
                  outline: 'none', transition: 'all 0.2s ease', fontWeight: 500
                }}
              />
            </div>
            
            <button 
              className="cyber-btn" 
              onClick={() => startAudit()}
              style={{
                width: '100%', background: '#002244', color: 'white', padding: '18px',
                borderRadius: '14px', border: 'none', fontWeight: 800, fontSize: '16px',
                cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,34,68,0.15)'
              }}
            >
              DEPLOY MERCURY_2 INTELLIGENCE
            </button>
            
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
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>LATENCY: 42ms | CLUSTER: US-EAST-1_HS</div>
                    </div>
                  </div>

                  {/* HIGH PRECISION PROGRESS BAR */}
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #002244, #2563eb)', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    {STAGES.map((stage, i) => (
                      <div key={stage.id} style={{ opacity: i <= currentStage ? 1 : 0.3, transition: 'all 0.3s' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: i === currentStage ? '#2563eb' : '#64748b', marginBottom: '4px' }}>{stage.id}</div>
                        <div style={{ height: '4px', background: i <= currentStage ? '#2563eb' : '#e2e8f0', borderRadius: '2px' }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#0a0d14', borderRadius: '16px', padding: '32px', textAlign: 'left', border: '1px solid #1e293b', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#3b82f6' }}>
                     <Terminal size={18} />
                     <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>MERCURY_FLOW_INGESTION_STREAM</span>
                   </div>
                   <PipelineTerminal logs={logs} active={isLoading} />
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* BENTO GRID - SIGNALS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                  <ExecutiveRiskGauge 
                    score={result.riskAssessment?.score || 90} 
                    insights={result.riskAssessment?.delta_analysis || "Solicitation displaying standard procurement friction profiles."}
                  />
                  <RfpVitalSigns 
                    value={result.value || "TBD"} 
                    dueDate={result.requirements?.find(r => r.section === 'L' || r.section === 'M')?.due_date || null} 
                    complexity={result.requirements?.length > 20 ? "High" : result.requirements?.length > 10 ? "Medium" : "Low"}
                  />
                  <AuditEfficiencyCard saved={result.requirements?.length ? (result.requirements.length * 45) : 0} />
                </div>

                {/* LITMUS FEED - MAIN CONTENT */}
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <Activity size={20} color="#002244" />
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Litmus Compliance Feed</h2>
                  </div>
                  <LitmusFeed requirements={result.requirements || []} />
                </div>

                {/* STRATEGIC ANALYSIS CONTAINER */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <Zap size={20} color="#002244" />
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategic Intelligence Panels</h2>
                   </div>
                   <ExecutiveSummary summary={result.executiveSummary} />
                   <StrategicAnalysis analysis={result.strategicAnalysis} />
                </div>
                
                {/* TERMINATE SESSION CTA */}
                <div style={{ marginTop: '60px', borderTop: '1px solid #f1f5f9', paddingTop: '30px', textAlign: 'center' }}>
                    <button 
                      onClick={handleTerminate}
                      style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 24px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      TERMINATE SESSION & WIPE MEMORY
                    </button>
                </div>
              </div>
            )}
          </main>

          {/* SOVEREIGN SIDEBAR */}
          {result && !isLoading && (
            <SovereignSidebar result={result} logs={logs} onTerminate={handleTerminate} />
          )}
        </div>
      )}
      
      {/* GLOBAL OVERLAYS */}
      {showPaymentModal && paymentInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#0d0f14', border: '1px solid #333', borderRadius: '12px', padding: '32px', maxWidth: '480px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ color: '#f4f4f5', marginBottom: '16px' }}>Report Limit Reached</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>{paymentInfo.message}</p>
            <button onClick={() => window.location.href = paymentInfo.paymentLink} style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Upgrade for Unlimited Reports</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  badge: {
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
    padding: '4px 12px',
    borderRadius: '99px',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.05em'
  }
};

export default Audit;
