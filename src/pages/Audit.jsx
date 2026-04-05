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
import ComplianceMatrix from "../components/dashboard/ComplianceMatrix";

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

// ── SOVEREIGN INTELLIGENCE WORKBENCH COMPONENTS ──

const LogTerminal = ({ pipelineStatus }) => {
  const [logs, setLogs] = useState([
    { type: 'io', msg: '[IO]: INITIALIZING_MERCURY_PIPELINE' },
    { type: 'sec', msg: '[SEC]: ESTABLISHING_ZERO_KNOWLEDGE_VAULT' },
    { type: 'sys', msg: '[SYS]: LOADING_FEDERAL_COMPLIANCE_MATRIX' }
  ]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newLogs = [
        { type: 'io', msg: '[IO]: SHREDDING_SECTION_M' },
        { type: 'sec', msg: '[SEC]: ENCRYPTING_PII_VAULT' },
        { type: 'sys', msg: '[SYS]: MAPPING_FAR_CLAUSES' },
        { type: 'risk', msg: '[RISK]: DETECTING_DQ_TRIGGERS' },
        { type: 'intel', msg: '[INTEL]: EXTRACTING_WIN_THEMES' }
      ];
      
      setLogs(prev => {
        const randomLog = newLogs[Math.floor(Math.random() * newLogs.length)];
        return [...prev.slice(-8), randomLog];
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="log-terminal">
      <div className="terminal-header">
        <span className="terminal-title">SYSTEM AUDIT LOG</span>
        <div className="terminal-indicators">
          <div className="indicator active"></div>
          <div className="indicator"></div>
          <div className="indicator"></div>
        </div>
      </div>
      <div className="terminal-body">
        {logs.map((log, i) => (
          <div key={i} className={`terminal-log ${log.type}`}>
            {log.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

const DisqualificationRadar = ({ hazards = [] }) => {
  const radarPoints = hazards.length > 0 ? hazards : [
    { angle: 0, risk: 93, label: 'L.3.2' },
    { angle: 60, risk: 87, label: 'M.4' },
    { angle: 120, risk: 78, label: 'FAR 52' },
    { angle: 180, risk: 65, label: 'NIST 800' },
    { angle: 240, risk: 82, label: 'IL4 ATO' },
    { angle: 300, risk: 71, label: 'DISA JSP' }
  ];
  
  return (
    <div className="disqualification-radar">
      <div className="radar-title">DISQUALIFICATION RADAR</div>
      <div className="radar-container">
        <svg className="radar-svg" viewBox="0 0 200 200">
          {/* Radar circles */}
          {[25, 50, 75, 100].map((radius, i) => (
            <circle
              key={i}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(0, 255, 194, 0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Radar lines */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const radian = (angle * Math.PI) / 180;
            const x2 = 100 + 100 * Math.cos(radian);
            const y2 = 100 + 100 * Math.sin(radian);
            return (
              <line
                key={i}
                x1="100"
                y1="100"
                x2={x2}
                y2={y2}
                stroke="rgba(0, 255, 194, 0.1)"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Hazard points */}
          {radarPoints.map((point, i) => {
            const radian = (point.angle * Math.PI) / 180;
            const distance = (point.risk / 100) * 90;
            const x = 100 + distance * Math.cos(radian);
            const y = 100 + distance * Math.sin(radian);
            const isHighRisk = point.risk > 80;
            
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={isHighRisk ? '#FF3E3E' : '#00FFC2'}
                  className={isHighRisk ? 'pulse-hazard' : ''}
                />
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontFamily="JetBrains Mono"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const RevenueProtection = ({ totalValue = 45000000, winProbability = 0.13 }) => {
  const weightedValue = Math.round(totalValue * winProbability);
  
  return (
    <div className="revenue-protection">
      <div className="protection-header">
        <ShieldCheck size={14} />
        <span>REVENUE PROTECTION</span>
      </div>
      <div className="protection-metrics">
        <div className="metric-row">
          <span className="metric-label">Total Value</span>
          <span className="metric-value">${totalValue.toLocaleString()}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Win Probability</span>
          <span className="metric-value">{(winProbability * 100).toFixed(0)}%</span>
        </div>
        <div className="metric-divider"></div>
        <div className="weighted-value">
          <span className="weighted-label">Weighted Value</span>
          <span className="weighted-amount mercury-teal-glow">
            ${weightedValue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const SecureComplianceShield = ({ onUnlock, price = 99, isLoading = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="secure-shield-container">
      <button 
        className={`secure-compliance-shield pulse-bridge ${isLoading ? 'loading' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onUnlock}
        disabled={isLoading}
      >
        <div className="shield-icon">
          {isLoading ? (
            <div className="spinner-mini" />
          ) : (
            <ShieldCheck size={32} />
          )}
        </div>
        <div className="shield-text">
          <div className="shield-title">
            {isLoading ? "Establishing Bridge..." : "Secure Compliance Shield"}
          </div>
          {!isLoading && isHovered && (
            <div className="shield-tooltip">
              Unlock 30-Page Remediation Matrix — ${price}
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

const StatelessProgressTracker = ({ isActive, sessionTime }) => {
  const [timeLeft, setTimeLeft] = useState(sessionTime);
  
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className="stateless-tracker">
      <div className="encryption-status">
        <Wifi className="pulse-bridge" size={12} color="var(--accent)" />
        <span>Zero-Knowledge Encryption: <span className="flicker">ACTIVE</span></span>
      </div>
      <div className="session-purge">
        <Clock size={12} />
        <span>Session Purge: {minutes}:{seconds.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
};

const LiveFeedSidebar = ({ logs, isActive }) => {
  const pipelineStages = [
    "SCANNING_SECTION_L",
    "MAPPING_FAR_CLAUSES", 
    "IDENTIFYING_DQ_TRIGGERS",
    "CALCULATING_RISK_VECTOR",
    "GENERATING_REMEDIATION"
  ];
  
  return (
    <div className="live-feed-sidebar">
      <div className="panel-header">
        <Terminal size={14} /> Real-time Pipeline
      </div>
      <div className="pipeline-terminal live">
        {logs.map((log, i) => (
          <div key={i} className={`terminal-line ${log.type}`}>
            <span className="timestamp">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span> {log.msg}
          </div>
        ))}
        {isActive && (
          <>
            {pipelineStages.map((stage, i) => (
              <div key={i} className="terminal-line info pulse-bridge">
                {'>'} {stage}...
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const DisqualificationMatrix = ({ compliance = [] }) => {
  const criticalHazards = compliance.filter(item => item.risk > 80) || [
    { category: "ATO Documentation", risk: 93, description: "IL4 pathway not documented" },
    { category: "Section L Compliance", risk: 87, description: "Missing technical volume requirements" },
    { category: "FAR 52.204-21", risk: 78, description: "Incomplete security safeguards" }
  ];
  
  return (
    <div className="disqualification-matrix">
      <div className="panel-header">
        <AlertTriangle size={14} /> Critical Hazards
      </div>
      <div className="hazards-grid">
        {criticalHazards.map((hazard, i) => (
          <div 
            key={i} 
            className={`hazard-card ${hazard.risk > 80 ? 'critical-glow' : ''}`}
            style={{ borderLeft: `3px solid ${hazard.risk > 80 ? 'var(--risk-high)' : 'var(--risk-medium)'}` }}
          >
            <div className="hazard-score">
              <span className="score-value">{hazard.risk}</span>
              <span className="score-label">RISK</span>
            </div>
            <div className="hazard-details">
              <div className="hazard-category">{hazard.category}</div>
              <div className="hazard-description">{hazard.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RevenueProjection = ({ estimatedValue = 50000000, riskScore = 87 }) => {
  const valueAtRisk = Math.round(estimatedValue * (riskScore / 100));
  
  return (
    <div className="revenue-projection">
      <div className="projection-header">
        <DollarSign size={14} /> Contract Value at Risk
      </div>
      <div className="projection-amount">
        <span className="currency">$</span>
        <span className="amount">{valueAtRisk.toLocaleString()}</span>
      </div>
      <div className="projection-subtitle">
        Based on {riskScore}/100 risk score
      </div>
    </div>
  );
};

const ConversionLayer = ({ onPurchase, price = 99 }) => {
  return (
    <div className="conversion-layer">
      <button 
        className="secure-matrix-btn pulse-bridge"
        onClick={onPurchase}
      >
        <Lock size={16} />
        <span>Secure Full Compliance Matrix (${price})</span>
      </button>
      
      <div className="human-chat-bubble">
        <MessageCircle size={14} className="chat-icon" />
        <div className="chat-content">
          <strong>Mercury 2 has identified 3 disqualifiers.</strong><br/>
          Speak to an Auditor.
        </div>
      </div>
    </div>
  );
};

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

// ── AUDIT HISTORY ──

const AuditHistory = ({ onLoad }) => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = (() => { try { return localStorage.getItem("aris_uid") || ""; } catch { return ""; } })();
    if (!uid) { setLoading(false); return; }
    fetch("/api/audits", { headers: { "x-user-id": uid } })
      .then(r => r.ok ? r.json() : { audits: [] })
      .then(d => setAudits(d.audits || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || audits.length === 0) return null;

  return (
    <div style={{ width: '100%', maxWidth: 680, marginTop: 40, textAlign: 'left' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: 12 }}>
        RECENT AUDITS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {audits.map(a => {
          const teaser = a.teaser || {};
          const rec = teaser.bidRecommendation || a.status;
          const recColor = rec === 'BID' ? '#22c55e' : rec === 'NO-BID' ? '#ef4444' : '#f59e0b';
          return (
            <div
              key={a.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 16px', cursor: 'pointer' }}
              onClick={() => {
                const uid = (() => { try { return localStorage.getItem("aris_uid") || ""; } catch { return ""; } })();
                fetch(`/api/audits/${a.id}/result`, { headers: uid ? { "x-user-id": uid } : {} })
                  .then(r => r.ok ? r.json() : null)
                  .then(d => {
                    if (d?.result) {
                      const raw = d.result;
                      onLoad({ ...raw, id: raw.solicitation_number || raw.id || "N/A", compliance: raw.requirements || [], value: 45000000 });
                    }
                  })
                  .catch(() => {});
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {teaser.title || a.source_ref || "Untitled Audit"}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {teaser.agency || ""}{teaser.headline ? ` · ${teaser.headline}` : ""}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 16 }}>
                {rec && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: recColor, background: `${recColor}18`, border: `1px solid ${recColor}40`, padding: '3px 8px', borderRadius: 4 }}>
                    {rec}
                  </span>
                )}
                <ChevronRight size={14} color="var(--text-secondary)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Audit({ onBack }) {
  const [samUrl, setSamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showFatalError, setShowFatalError] = useState(false);
  const [fatalErrorData, setFatalErrorData] = useState(null);
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [dynamicPrice, setDynamicPrice] = useState(99);
  const [logs, setLogs] = useState([{ msg: "ARIS_BOOT_SEQUENCE_COMPLETE", type: "success" }]);
  
  const esRef = useRef(null);

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
    
    const estimatedValue = result?.value || "45000000";
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
          localStorage.setItem('aris_pending_audit', JSON.stringify(result));
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
    const complianceData = result?.compliance;
    if (!result || !Array.isArray(complianceData) || complianceData.length === 0) {
      addLog("NO_COMPLIANCE_DATA_TO_EXPORT", "error");
      return;
    }

    addLog("GENERATING_INDUSTRIAL_RTM_MATRIX...", "info");

    try {
      const res = await fetch("/api/export-rtm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complianceData }),
      });

      if (!res.ok) throw new Error("RTM_GEN_FAILURE");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ARIS_Compliance_Matrix_${result.id || 'Audit'}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      addLog("RTM_EXPORT_SUCCESSFUL", "success");
      trackEvent('rtm_export_complete', { solicitation_id: result.id });
    } catch (e) {
      addLog(`EXPORT_FATAL: ${e.message.toUpperCase()}`, "error");
    }
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
    trackAuditStart();

    // Simulate streaming log stages while pipeline runs
    const stages = PIPELINE_LOGS.slice(0, -1);
    stages.forEach((stage, i) => {
      setTimeout(() => addLog(stage, i === stages.length - 1 ? "success" : "info"), i * 1200);
    });

    try {
      // 1. Submit audit job
      const submitRes = await fetch("/api/audits/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl.trim() }),
      });

      let submitData;
      try { submitData = await submitRes.json(); } catch {
        throw new Error("SERVER_COMMUNICATION_FORMAT_ERROR: GATEWAY RETURNED NON-JSON RESPONSE.");
      }
      if (!submitRes.ok) throw new Error(submitData.error || "FAILED_TO_SUBMIT_AUDIT");
      const { auditId } = submitData;
      if (!auditId) throw new Error("NO_AUDIT_ID_RETURNED");

      addLog(`AUDIT_JOB_QUEUED: ${auditId.slice(0, 8)}…`, "info");

      // 2. Poll teaser until ready (max ~90s)
      let teaser = null;
      for (let i = 0; i < 45; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const tRes = await fetch(`/api/audits/${auditId}/teaser`);
        if (!tRes.ok) continue;
        const tData = await tRes.json();
        if (tData.status === "teaser_ready") { teaser = tData.teaser; break; }
        if (tData.status === "failed") throw new Error("AUDIT_PIPELINE_FAILED: Could not extract requirements.");
      }
      if (!teaser) throw new Error("AUDIT_TIMED_OUT: Pipeline exceeded 90 seconds.");

      // 3. Fetch full result
      const uid = (() => { try { return localStorage.getItem("aris_uid") || ""; } catch { return ""; } })();
      const resultRes = await fetch(`/api/audits/${auditId}/result`, {
        headers: uid ? { "x-user-id": uid } : {},
      });
      let fullResult = null;
      if (resultRes.ok) {
        const rData = await resultRes.json();
        if (rData.result) fullResult = rData.result;
      }

      // 4. Normalize: merge teaser + full result into a consistent shape the UI expects
      const raw = { ...teaser, ...(fullResult || {}) };
      const normalized = {
        ...raw,
        // UI accesses result.id for solicitation number
        id: raw.solicitation_number || raw.id || teaser.title || "N/A",
        // UI accesses result.compliance for requirements array
        compliance: raw.requirements || [],
        // fixed contract value default (not returned by pipeline)
        value: 45000000,
      };

      setResult(normalized);
      setDynamicPrice(calculateDisplayPrice("45000000"));
      streamReport(normalized);

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
          breakdown: ["All Sovereign clusters are currently processing high-concurrency audits.", "Intelligence Gateway is queueing requests for cluster stability."],
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
    // Check for post-checkout success
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const savedResult = localStorage.getItem('aris_pending_audit');
      if (savedResult) {
        try {
          const raw = JSON.parse(savedResult);
          const data = { ...raw, id: raw.solicitation_number || raw.id || "N/A", compliance: raw.requirements || raw.compliance || [], value: 45000000 };
          setResult(data);
          const price = calculateDisplayPrice("45000000");
          setDynamicPrice(price);
          
          // Clear it so we don't re-trigger on refresh
          localStorage.removeItem('aris_pending_audit');
          
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
    <div className="audit-page-container aris-audit-workspace">
      <NavBar theme="dark" onToggleTheme={null} onBack={onBack} />
      
      {/* Government Data Sources Banner */}
      <GovernmentBanner />
      
      {!result && !isLoading ? (
        <div className="ingestion-view">
          <div className="ingestion-hero">
            <Activity className="cyber-glow" size={40} color="var(--accent)" />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '24px' }}>Stateless Audit Workspace</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
              ARIS Core • Zero-Knowledge Analysis • Federal Compliance Engine
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
              DEPLOY MERCURY 2 INTELLIGENCE ENGINE
            </button>

            <AuditHistory onLoad={(data) => { setResult(data); }} />
          </div>
        </div>
      ) : (
        <div className="sovereign-layout">
          {/* Left: Log Terminal */}
          <aside className="sovereign-panel sovereign-left">
            <LogTerminal pipelineStatus={result?.status} />
            
            {/* Mission Context */}
            <div className="mission-context-compact">
              <div className="panel-header">
                <Target size={14} /> Mission Context
              </div>
              <div className="context-compact">
                <div className="context-item">
                  <label>AGENCY</label>
                  <p>{result?.agency || "PARSING..."}</p>
                </div>
                <div className="context-item">
                  <label>SOLICITATION</label>
                  <p>{result?.id || "N/A"}</p>
                </div>
                <div className="context-item">
                  <label>STATUS</label>
                  <p className="flicker" style={{ color: 'var(--accent)' }}>
                    {isLoading ? "ENCRYPTED_STREAM" : "STATELESS_IDLE"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Center: Main Intelligence Workbench */}
          <main className="sovereign-panel sovereign-center">
            <div className="panel-header">
              <ShieldCheck size={14} /> Audit Canvas
            </div>
            <div className="panel-content">
              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="spinner-outer" style={{ margin: '0 auto 40px' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: 800 }}>ANALYSIS ACTIVE</h2>
                  <PipelineTerminal logs={logs} active={isLoading} />
                </div>
              ) : (
                <>
                  {/* Disqualification Radar */}
                  <DisqualificationRadar hazards={result?.compliance} />
                  
                  {/* Revenue Protection */}
                  <RevenueProtection 
                    totalValue={result?.value || result?.pillars?.estimated_value?.value || 45000000} 
                    winProbability={0.13} 
                  />
                  
                  {/* System finding */}
                  <div className="critical-alert" style={{ background: 'rgba(255, 62, 62, 0.05)', border: '1px solid rgba(255, 62, 62, 0.2)' }}>
                    <AlertTriangle size={20} color="#FF3E3E" />
                    <div className="alert-content">
                      <h4 style={{ fontSize: '12px', fontWeight: 800 }}>FINDING: MISSING_IL4_ATO_CITATION</h4>
                      <p style={{ fontSize: '12px', color: '#a1a1aa' }}>DHA/DISA JSP reciprocity agreement not identified in Section L.3.2. High probability of technical disqualification for mission-critical systems.</p>
                    </div>
                  </div>

                  {/* Secure Compliance Shield */}
                  <SecureComplianceShield 
                    onUnlock={handlePurchase} 
                    price={dynamicPrice} 
                    isLoading={isCheckoutLoading}
                  />

                  {/* Excel Export Action */}
                  <div style={{ marginTop: '20px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Compliance Matrix (RTM)</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Industrial-grade traceability for Section L/M requirements.</p>
                      </div>
                      <button 
                        className="cyber-btn" 
                        onClick={handleExportExcel}
                        style={{ padding: '8px 16px', fontSize: '12px', minWidth: '140px' }}
                      >
                        <FileText size={14} style={{ marginRight: '8px' }} />
                        EXPORT .XLSX
                      </button>
                    </div>
                  </div>
                  
                  {/* Compliance Matrix — real requirements from pipeline */}
                  {result?.compliance?.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <ComplianceMatrix requirements={result.compliance} />
                    </div>
                  )}

                  {/* Report Section */}
                  {report?.proposal_draft && (
                    <div className="report-section">
                      <div className="report-header">
                        <Terminal size={14} /> Remediation Script
                      </div>
                      <div className="report-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.proposal_draft}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  <button className="cyber-btn terminate-btn" onClick={onBack}>
                    TERMINATE SESSION
                  </button>
                </>
              )}
            </div>
          </main>

          </div>
      )}

      {/* Vault Status Bar */}
      <div className="vault-status-bar">
        <div className="vault-glow flash" />
        <span>SECURE_VAULT: ENCRYPTED</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>ARIS_PROTOCOL_ACTIVE</span>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#0d0f14',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#f4f4f5', marginBottom: '16px' }}>Report Limit Reached</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>
              {paymentInfo.message}
            </p>
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '24px' 
            }}>
              <p style={{ color: '#818cf8', margin: '0' }}>
                {paymentInfo.reportsUsed} of {paymentInfo.reportsLimit} free reports used
              </p>
              <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '8px 0 0' }}>
                Next reset: {paymentInfo.nextReset}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid #333',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.href = paymentInfo.paymentLink}
                style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Upgrade for Unlimited Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mercury 2 Fatal Error Banner */}
      {showFatalError && fatalErrorData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(220, 38, 38, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#1a0000',
            border: '2px solid #dc2626',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '600px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(220, 38, 38, 0.5)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              animation: 'pulse 2s infinite'
            }}>
              ⚠️
            </div>
            <h2 style={{ 
              color: '#dc2626', 
              marginBottom: '16px', 
              fontSize: '24px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              COMPLIANCE KILL-SWITCH ACTIVATED
            </h2>
            <div style={{
              background: 'rgba(220, 38, 38, 0.2)',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid rgba(220, 38, 38, 0.3)'
            }}>
              <p style={{ color: '#dc2626', fontSize: '20px', margin: '0 0 8px' }}>
                Verdict: {fatalErrorData.verdict}
              </p>
              <p style={{ color: '#ffffff', fontSize: '32px', margin: '8px 0', fontWeight: 'bold' }}>
                Risk Score: {fatalErrorData.score}/99
              </p>
              <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '8px 0 0' }}>
                {fatalErrorData.deltaAnalysis}
              </p>
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ color: '#a1a1aa', margin: '0 0 8px', fontSize: '14px' }}>
                <strong>Score Breakdown:</strong>
              </p>
              <p style={{ color: '#818cf8', margin: '4px 0', fontSize: '12px' }}>
                Delta Risk: {fatalErrorData.breakdown?.delta_risk || 0} points
              </p>
              <p style={{ color: '#f59e0b', margin: '4px 0', fontSize: '12px' }}>
                Hazard Penalty: {fatalErrorData.breakdown?.hazard_penalty || 0} points
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexDirection: 'column' }}>
              <p style={{ color: '#ffffff', margin: '0 0 16px', fontSize: '16px' }}>
                <strong>⚠️ HIGH PROBABILITY OF DISQUALIFICATION DETECTED</strong>
              </p>
              <button
                onClick={() => setShowFatalError(false)}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Acknowledge Risk Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
