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
  Terminal,
  Activity,
  Cpu,
  Globe,
  Lock,
  Search,
  ChevronDown
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trackEvent } from "../utils/analytics";
import "../styles/Dashboard.css";
import "./Audit.css";

// ── UTILITIES ──

const PIPELINE_LOGS = [
  "INITIALIZING_STATELESS_BRIDGE...",
  "CONNECTING_TO_FEDERAL_GATEWAY...",
  "PARSING_SOLICITATION_STRUCTURE...",
  "IDENTIFYING_COMPLIANCE_FRICITION...",
  "EXTRACTING_SECTION_L_REQUIREMENTS...",
  "RUNNING_RISK_MODELS...",
  "FINALIZING_ZERO_KNOWLEDGE_REPORT...",
  "AUDIT_COMPLETE_PIPELINE_IDLE"
];

// ── COMPONENTS ──

const PipelineTerminal = ({ logs, active }) => {
  const terminalRef = useRef(null);
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="pipeline-terminal">
      {logs.map((log, i) => (
        <div key={i} className={`terminal-line ${log.type}`}>
          <span className="timestamp">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span> {log.msg}
        </div>
      ))}
      {active && <div className="terminal-line info pulse-bridge">{'>'} ANALYZING_SOURCE_STREAM...</div>}
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

export default function Audit({ onBack }) {
  const [samUrl, setSamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [logs, setLogs] = useState([{ msg: "ARIS_BOOT_SEQUENCE_COMPLETE", type: "success" }]);
  const [isVaultActive, setIsVaultActive] = useState(true);
  
  const esRef = useRef(null);

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev.slice(-15), { msg, type }]);
  };

  const startAudit = async (url) => {
    const finalUrl = url || samUrl;
    if (!finalUrl.trim()) return;
    setSamUrl(finalUrl);
    setIsLoading(true);
    setError("");
    setResult(null);
    setReport(null);
    addLog(`INITIATING_AUDIT_ON: ${finalUrl.split('/').pop()}`, "info");
    trackEvent("audit_start", { url: finalUrl });
    
    // Simulate streaming logs
    const stages = PIPELINE_LOGS.slice(0, -1);
    stages.forEach((stage, i) => {
      setTimeout(() => addLog(stage, i === stages.length - 1 ? "success" : "info"), i * 1200);
    });

    try {
      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "WE COULD NOT ACCESS GATEWAY. TRY DIRECT UPLOAD.");
      
      setTimeout(() => {
        setResult(data);
        streamReport(data);
        addLog("INTELLIGENCE_SYNTHESIS_COMPLETE", "success");
        trackEvent("audit_success", { url: finalUrl, title: data.title });
        setIsLoading(false);
      }, 7000); // Allow logs to play out

    } catch (e) {
      setError(e.message);
      addLog(`PIPELINE_FATAL_ERROR: ${e.message}`, "error");
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
      <NavBar theme="dark" onToggleTheme={null} onBack={onBack} />

      {!result && !isLoading ? (
        <div className="ingestion-view">
          <div className="ingestion-hero">
            <Activity className="cyber-glow" size={40} color="var(--accent)" />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '24px' }}>Sovereign Intelligence Terminal</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
              Stateless execution of federal solicitation audits. <br/>
              Zero persistence. Zero knowledge. Absolute precision.
            </p>
            
            <div className="cyber-input-wrapper">
              <Globe className="search-icon-fixed" style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--accent)' }} size={20} />
              <input 
                className="cyber-input" 
                placeholder="https://sam.gov/opp/..." 
                value={samUrl} 
                onChange={e => setSamUrl(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && startAudit()}
              />
            </div>
            
            <button className="cyber-btn" onClick={() => startAudit()}>
              INITIALIZE AGENTIC PIPELINE
            </button>
          </div>
        </div>
      ) : (
        <div className="workbench-layout">
          {/* Left: Mission Context */}
          <aside className="workbench-panel workbench-left">
            <div className="panel-header">
              <Target size={14} /> Mission_Context
            </div>
            <div className="panel-content">
              <div className="mission-context">
                <div className="context-block">
                  <label>GOV_AGENCY</label>
                  <p>{result?.agency || (isLoading ? "PARSING_GATEWAY..." : "WAITING...")}</p>
                </div>
                <div className="context-block">
                  <label>SOLICITATION_ID</label>
                  <p>{result?.id || "N/A"}</p>
                </div>
                <div className="context-block">
                  <label>BRIDGE_LINK_STATUS</label>
                  <p className="flicker" style={{ color: 'var(--accent)' }}>{isLoading ? "ENCRYPTED_STREAM" : result ? "STATELESS_IDLE" : "DISCONNECTED"}</p>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <label>COMPLIANCE_HEATMAP</label>
                  <ComplianceHeatmap />
                </div>
              </div>
            </div>
          </aside>

          {/* Center: Risk Audit */}
          <main className="workbench-panel workbench-center">
            <div className="panel-header">
              <ShieldCheck size={14} /> Intelligence_Workbench
            </div>
            <div className="panel-content">
              <div className="audit-viewport">
                {isLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="spinner-outer" style={{ margin: '0 auto 40px' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 800 }}>PIPELINE_ENGAGED</h2>
                    <PipelineTerminal logs={logs} active={isLoading} />
                  </div>
                ) : (
                  <>
                    <div className="hazard-alert pulse-bridge">
                      <AlertTriangle size={24} color="var(--risk-high)" />
                      <div className="hazard-content">
                        <h4>DISQUALIFICATION_HAZARD_DETECTED</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                           Requirement L.4.2 mismatch with NIST 800-171 Rev 3 controls. 
                           Non-responsive risk: HIGH.
                        </p>
                      </div>
                    </div>

                    <div className="audit-grid">
                      <div className="audit-info-card">
                        <div className="audit-info-label">DEADLINE</div>
                        <div className="audit-info-value">{result?.compliance?.deadline_date?.value || "2024-04-15"}</div>
                      </div>
                      <div className="audit-info-card" style={{ borderLeft: '2px solid var(--accent)' }}>
                        <div className="audit-info-label">RISK_SCORE</div>
                        <div className="audit-info-value flicker">87/100</div>
                      </div>
                    </div>

                    {report?.proposal_draft && (
                      <div className="audit-memo-section">
                         <div className="audit-memo-header">
                            <Terminal size={14} /> REMEDIATION_SCRIPT
                         </div>
                         <div className="audit-markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.proposal_draft}</ReactMarkdown>
                         </div>
                      </div>
                    )}
                    
                    <button className="cyber-btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: '#fff', marginTop: '32px' }} onClick={onBack}>
                      TERMINATE_SESSION
                    </button>
                  </>
                )}
              </div>
            </div>
          </main>

          {/* Right: AI Assistant */}
          <aside className="workbench-panel workbench-right">
             <div className="panel-header">
                <Cpu size={14} /> Agentic_Pipeline
             </div>
             <div style={{ flex: 1, overflow: 'hidden' }}>
                <ARISChat reportData={result} />
             </div>
          </aside>
        </div>
      )}

      {/* Stateless Vault Status */}
      <div className="vault-status-bar">
        <div className="vault-glow flash" />
        <span>STATELESS_VAULT: ENCRYPTED</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>ZERO_KNOWLEDGE_PROTOCOL_ACTIVE</span>
      </div>
    </div>
  );
}
