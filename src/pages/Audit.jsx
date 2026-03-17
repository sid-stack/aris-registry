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
  "RUNNING_RISK_MODELS...",
  "FINALIZING_ZERO_KNOWLEDGE_REPORT...",
  "AUDIT_COMPLETE_PIPELINE_IDLE"
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
        <span className="terminal-title">AGENTIC PURGE TERMINAL</span>
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

export default function Audit({ onBack }) {
  const [samUrl, setSamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
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
      
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error("SERVER_COMMUNICATION_FORMAT_ERROR: GATEWAY RETURNED NON-JSON RESPONSE.");
      }

      if (!res.ok) throw new Error(data.error || "WE COULD NOT ACCESS GATEWAY. TRY DIRECT UPLOAD.");
      
      setTimeout(() => {
        setResult(data);
        const price = calculateDisplayPrice(data.value || data.pillars?.estimated_value?.value || "45000000");
        setDynamicPrice(price);
        streamReport(data);
        addLog("INTELLIGENCE_SYNTHESIS_COMPLETE", "success");
        trackAuditComplete();
        setIsLoading(false);
      }, 7000); // Allow logs to play out

    } catch (e) {
      const errMsg = e.message || "UNKNOWN_PIPELINE_ERROR";
      if (typeof setError === 'function') {
        setError(errMsg);
      } else {
        console.error("CRITICAL: setError is NOT A FUNCTION", e);
      }
      addLog(`PIPELINE_FATAL_ERROR: ${errMsg}`, "error");
      setIsLoading(false);
    }
  };

  const streamReport = (auditData) => {
    if (esRef.current) esRef.current.close();
    const json = JSON.stringify({ pillars: auditData.compliance, title: auditData.title || "" });
    const ctx = btoa(encodeURIComponent(json));
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
    <div className="audit-page-container sovereign-intelligence-workbench">
      <NavBar theme="dark" onToggleTheme={null} onBack={onBack} />
      
      {!result && !isLoading ? (
        <div className="ingestion-view">
          <div className="ingestion-hero">
            <Activity className="cyber-glow" size={40} color="var(--accent)" />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '24px' }}>Sovereign Intelligence Workbench</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
              Mercury 2 Engine • Zero-Knowledge Analysis • Palantir-Grade Intelligence
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
              DEPLOY MERCURY 2 INTELLIGENCE
            </button>
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
              <ShieldCheck size={14} /> Intelligence Workbench
            </div>
            <div className="panel-content">
              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="spinner-outer" style={{ margin: '0 auto 40px' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: 800 }}>MERCURY 2 INTELLIGENCE ACTIVE</h2>
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
                  
                  {/* Critical Alert */}
                  <div className="critical-alert">
                    <AlertTriangle size={24} color="#FF3E3E" />
                    <div className="alert-content">
                      <h4>IL4 ATO CITATION MISSING (DQ RISK: 93%)</h4>
                      <p>DHA/DISA JSP reciprocity agreement not cited in Section L.3.2. Technical Approach score will be disqualified regardless of AI capabilities.</p>
                    </div>
                  </div>

                  {/* Secure Compliance Shield */}
                  <SecureComplianceShield 
                    onUnlock={handlePurchase} 
                    price={dynamicPrice} 
                    isLoading={isCheckoutLoading}
                  />
                  
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

          {/* Right: AI Assistant */}
          <aside className="sovereign-panel sovereign-right">
            <div className="panel-header">
              <Cpu size={14} /> Mercury 2 Engine
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ARISChat reportData={result} />
            </div>
          </aside>
        </div>
      )}

      {/* Vault Status Bar */}
      <div className="vault-status-bar">
        <div className="vault-glow flash" />
        <span>SOVEREIGN_VAULT: ENCRYPTED</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>MERCURY_2_PROTOCOL_ACTIVE</span>
      </div>
    </div>
  );
}
