import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createCheckoutSession } from "../lib/stripe";
import { createArisCallSession } from "../lib/stripe";

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Audit component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#fff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          margin: '20px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', marginBottom: '10px' }}>
            Audit System Error
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            We encountered an error loading the audit system. Please try refreshing the page.
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = API_URL.replace(/\/$/, "");
const PREMIUM_BASE_PLAN = "starter";
const ARIS_EXECUTE_URL = import.meta.env.VITE_ARIS_EXECUTE_URL || "https://api.bidsmith.pro/v1/execute";

const LOADING_STEPS = [
  "Connecting to SAM.gov...",
  "Fetching opportunity data...",
  "Ranking attachments...",
  "Extracting primary document...",
  "Running compliance audit...",
  "Validating requirements...",
];

function useLoadingStep(active) {
  const [step, setStep] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (!active) { setStep(0); return; }
    ref.current = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 3000);
    return () => clearInterval(ref.current);
  }, [active]);
  return { stepText: LOADING_STEPS[step], stepIndex: step };
}

const KEYWORD_SCORES = {
  solicitation: 10, rfp: 10, pws: 10, sow: 10, combined: 10,
  rfq: 8, ifb: 8, amendment: 4, attachment: 2, exhibit: 2,
};

function scoreFiles(files) {
  return Array.from(files).map(file => {
    const n = file.name.toLowerCase().replace(/[^a-z0-9]/g, " ");
    let score = 0; const matched = [];
    for (const [kw, pts] of Object.entries(KEYWORD_SCORES))
      if (n.includes(kw)) { score += pts; matched.push(kw.toUpperCase()); }
    return { file, score, matched };
  }).sort((a, b) => b.score - a.score);
}

function formatBytes(b) {
  return b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
}

function ExecutiveBanner({ assessment }) {
  if (!assessment) return null;
  const { disqualified, risk_level, reason } = assessment;

  let bgStr = "", borderStr = "", textStr = "", label = "", icon = "", explanation = "";
  if (disqualified) {
    bgStr = "#fff1f2";
    borderStr = "1px solid #fda4af";
    textStr = "#9f1239";
    label = "DISQUALIFIED — HIGH RISK";
    icon = "🔴";
    explanation = "Do not bid. Explicit disqualifiers detected based on firm eligibility or core technical/bonding thresholds.";
  } else if (risk_level === "HIGH" || risk_level === "MEDIUM") {
    bgStr = "#fffbeb";
    borderStr = "1px solid #fcd34d";
    textStr = "#92400e";
    label = "HIGH RISK";
    icon = "🟡";
    explanation = "Proceed with caution. Severe compliance hurdles or ambiguities detected.";
  } else {
    bgStr = "#f0fdf4";
    borderStr = "1px solid #86efac";
    textStr = "#166534";
    label = "ELIGIBLE TO BID";
    icon = "🟢";
    explanation = "No explicit disqualifying barriers found. Final manual vetting advised before proposal preparation.";
  }

  return (
    <div style={{ background: bgStr, border: borderStr, borderRadius: "6px", padding: "20px 24px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.02em", color: textStr, fontFamily: "monospace" }}>{label}</span>
      </div>
      <div style={{ fontSize: "13px", color: textStr, opacity: 0.9, fontFamily: "monospace", marginTop: "2px" }}>
        {explanation}
      </div>
      {reason && (
        <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(0,0,0,0.03)", borderLeft: `2px solid ${textStr}`, fontSize: "12px", color: textStr, fontFamily: "monospace" }}>
          <strong>Trigger:</strong> {reason}
        </div>
      )}
    </div>
  );
}

// Strip raw error snippets — SAM.gov 404 pages or "Sorry..." strings should never render
const ERROR_STRINGS = ["sorry", "couldn't find", "not found on sam", "error", "404"];
function isBadSnippet(s) { const l = (s || "").toLowerCase(); return ERROR_STRINGS.some(e => l.includes(e)); }
function isNullValue(v) {
  if (!v) return true;
  const l = (v || "").toLowerCase();
  return l === "not found" || l.startsWith("n/a") || l === "null" || l === "undefined" || l === "none";
}

function PillarCard({ icon, label, data }) {
  const value = typeof data === 'object' && data !== null ? data.value : data;
  const snippet = typeof data === 'object' && data !== null ? data.snippet : null;
  const isNotFound = isNullValue(value);
  const cleanSnippet = !isBadSnippet(snippet) ? snippet : null;

  return (
    <div style={{ background: "#ffffff", border: `1px solid ${isNotFound ? "#f1f5f9" : "#e2e8f0"}`, borderRadius: "8px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
        <span style={{ fontSize: "15px" }}>{icon}</span>
        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
      </div>
      <div style={{ fontSize: "13px", fontFamily: "'IBM Plex Mono', monospace", color: isNotFound ? "#cbd5e1" : "#0f172a", fontStyle: isNotFound ? "italic" : "normal", wordBreak: "break-word", lineHeight: 1.5, fontWeight: isNotFound ? 400 : 600 }}>
        {isNotFound ? "—" : value}
      </div>
      {cleanSnippet && !isNotFound && (
        <div style={{ marginTop: "4px", padding: "6px 10px", background: "#f8fafc", borderLeft: "2px solid #bfdbfe", fontSize: "10px", color: "#64748b", fontFamily: "monospace", wordBreak: "break-word", lineHeight: 1.5 }}>
          {cleanSnippet}
        </div>
      )}
    </div>
  );
}

function BondingCard({ bonding }) {
  const items = [
    { label: "Bid Bond", data: bonding?.bid_bond },
    { label: "Performance Bond", data: bonding?.performance_bond },
    { label: "Payment Bond", data: bonding?.payment_bond },
  ];
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px 20px", gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "15px" }}>🔒</span>
        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>Bonding Requirements</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        {items.map(({ label, data }) => {
          const value = typeof data === 'object' && data !== null ? data.value : data;
          const missing = isNullValue(value);
          return (
            <div key={label} style={{ background: missing ? "#f8fafc" : "#f0f9ff", borderRadius: "6px", padding: "10px 12px", border: `1px solid ${missing ? "#f1f5f9" : "#bae6fd"}` }}>
              <div style={{ fontSize: "9px", color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", color: missing ? "#cbd5e1" : "#0f172a", fontStyle: missing ? "italic" : "normal", fontWeight: missing ? 400 : 700 }}>
                {missing ? "—" : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DisqualifiersCard({ items }) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const hasItems = normalizedItems.length > 0 &&
    (typeof normalizedItems[0] === 'string' ? normalizedItems[0] !== "NOT FOUND" : normalizedItems[0].value !== "NOT FOUND");

  return (
    <div style={{ background: hasItems ? "#fff1f2" : "#ffffff", border: `1px solid ${hasItems ? "#fecaca" : "#e2e8f0"}`, borderRadius: "6px", padding: "16px 20px", gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>⛔</span>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: hasItems ? "#e11d48" : "#64748b", textTransform: "uppercase", fontFamily: "monospace" }}>Technical Disqualifiers</span>
      </div>
      {hasItems ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {normalizedItems.map((item, i) => {
            const value = typeof item === 'object' ? item.value : item;
            const snippet = typeof item === 'object' ? item.snippet : null;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", fontFamily: "monospace", color: "#be123c", fontWeight: 600 }}>
                  <span style={{ color: "#e11d48", marginTop: "1px", flexShrink: 0 }}>◆</span>{value}
                </div>
                {snippet && (
                  <div style={{ marginLeft: "14px", padding: "6px 8px", background: "#fef1f2", borderLeft: "2px solid #e11d48", fontSize: "11px", color: "#9f1239", fontStyle: "italic", fontFamily: "monospace", wordBreak: "break-word" }}>
                    "{snippet}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: "13px", fontFamily: "monospace", color: "#94a3b8", fontStyle: "italic" }}>No explicit disqualifiers found</div>
      )}
    </div>
  );
}

function ResultMeta({ result }) {
  if (!result?.title && !result?.agency) return null;
  const isFallback = result.source === "description_text";
  return (
    <div style={{ marginBottom: "20px", padding: "16px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {result.title && <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }}></span>
        {result.title}
      </div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
        {result.agency && <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#475569", fontWeight: 600 }}>🏛 {result.agency}</span>}
        {result.primaryDoc && result.primaryDoc !== "description_text" && <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#2563eb", fontWeight: 600 }}>📄 {result.primaryDoc}</span>}
        {result.attachmentsFound > 0 && <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#64748b" }}>{result.attachmentsFound} attachments logged</span>}
        {isFallback && (
          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#b45309", background: "#fef3c7", padding: "4px 8px", borderRadius: "4px", border: "1px solid #fde68a" }}>
            ⚠ Source text derived from description only. Document retrieval failed.
          </span>
        )}
      </div>
    </div>
  );
}

function FileRow({ ranked, index, isSelected, onSelect }) {
  const { file, score, matched } = ranked;
  return (
    <div onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "6px", cursor: "pointer", transition: "all 0.12s", border: isSelected ? "1px solid #2563eb" : "1px solid #e2e8f0", background: isSelected ? "#eff6ff" : "#ffffff" }}>
      <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: index === 0 ? "#2563eb" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: index === 0 ? "#fff" : "#64748b", fontFamily: "monospace", flexShrink: 0 }}>#{index + 1}</div>
      <span style={{ fontSize: "16px", flexShrink: 0 }}>📄</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontFamily: "monospace", color: isSelected ? "#1e3a8a" : "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isSelected ? 700 : 500 }}>{file.name}</div>
        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
          {matched.map(kw => (
            <span key={kw} style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.08em", padding: "2px 6px", borderRadius: "3px", background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>{kw}</span>
          ))}
          {matched.length === 0 && <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#94a3b8" }}>no keywords matched</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "13px", fontFamily: "monospace", color: score > 0 ? "#2563eb" : "#64748b", fontWeight: 700 }}>+{score}pts</div>
        <div style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>{formatBytes(file.size)}</div>
      </div>
      <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: isSelected ? "none" : "2px solid #cbd5e1", background: isSelected ? "#2563eb" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isSelected && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
      </div>
    </div>
  );
}

export default function Audit({ onProceed, onBack }) {
  return (
    <ErrorBoundary>
      <AuditContent onProceed={onProceed} onBack={onBack} />
    </ErrorBoundary>
  );
}

function AuditContent({ onProceed, onBack }) {
  // Load KaTeX CSS dynamically to avoid import issues
  useEffect(() => {
    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.38/dist/katex.min.css';
      document.head.appendChild(link);
      
      return () => {
        try {
          document.head.removeChild(link);
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (e) {
      console.warn('Failed to load KaTeX CSS:', e);
    }
  }, []);

  const [samUrl, setSamUrl] = useState("");
  const [rankedFiles, setRankedFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [agents, setAgents] = useState([]);       // pipeline agent definitions
  const [agentSteps, setAgentSteps] = useState({}); // { stageId: "idle"|"running"|"done" }
  const [terminalLog, setTerminalLog] = useState([]); // live action lines
  const logEndRef = useRef(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [premiumTier, setPremiumTier] = useState(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [arisLoading, setArisLoading] = useState(false);
  const [arisError, setArisError] = useState("");
  const [arisResult, setArisResult] = useState(null);
  const [arisStatus, setArisStatus] = useState("");
  const [componentReady, setComponentReady] = useState(false);
  const esRef = useRef(null);

  // Ensure component is ready
  useEffect(() => {
    setComponentReady(true);
  }, []);

  const { stepText, stepIndex } = useLoadingStep(loadingUrl);
  const selectedFile = rankedFiles[selectedIndex];
  const c = result?.compliance;
  const isLoading = loadingUrl || loadingFile;

  // Show loading state while component initializes
  if (!componentReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e2e8f0', 
            borderTopColor: '#2563eb', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            Loading Audit System...
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const aris = params.get("aris");
    const hasFlags = Boolean(checkout || aris);

    if (checkout === "success") {
      const premium = params.get("premium");
      setCheckoutStatus({
        kind: "success",
        text: premium && premium !== "none"
          ? `Payment confirmed. Premium ${premium} memo order received.`
          : "Payment confirmed.",
      });
    } else if (checkout === "cancelled") {
      setCheckoutStatus({
        kind: "cancelled",
        text: "Checkout was cancelled. You can retry anytime.",
      });
    }

    if (aris === "checkout_success") {
      const raw = sessionStorage.getItem("bidsmith_audit_context");
      let ctx = {};
      try { ctx = raw ? JSON.parse(raw) : {}; } catch { ctx = {}; }
      if (!ctx.samUrl) {
        setArisStatus("Aris checkout complete, but missing solicitation URL context.");
      } else {
        setArisStatus("Aris checkout complete. Running engine...");
        setArisLoading(true);
        setArisError("");
        fetch(ARIS_EXECUTE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            solicitation_url: ctx.samUrl,
            metadata: {
              noticeId: ctx.noticeId || "",
              source: "audit_page",
              user_id: ctx.userId || "anonymous",
            },
          }),
        })
          .then(async (resp) => {
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || "Aris execute failed");
            setArisResult(data);
            setArisStatus("Aris execution complete.");
          })
          .catch((e) => {
            setArisError(e?.message || "Aris execution failed.");
            setArisStatus("");
          })
          .finally(() => setArisLoading(false));
      }
    } else if (aris === "checkout_canceled") {
      setArisStatus("Aris checkout was canceled.");
    }

    if (!hasFlags) return;
    params.delete("checkout");
    params.delete("premium");
    params.delete("plan");
    params.delete("aris");
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", next);
  }, []);

  // ── Parse markdown compliance table into row objects ──────────────────────
  function parseComplianceTable(md) {
    if (!md) return [];
    const lines = md.split("\n").filter(l => l.trim().startsWith("|") && !l.match(/^\|[-\s|]+\|$/));
    const headers = lines[0]?.split("|").map(h => h.trim()).filter(Boolean);
    return lines.slice(1).map(line => {
      const cells = line.split("|").map(c => c.trim()).filter(Boolean);
      const row = {};
      headers?.forEach((h, i) => row[h] = cells[i] || "");
      return row;
    }).filter(r => Object.values(r).some(v => v));
  }

  function statusBadge(status) {
    if (!status) return null;
    if (status.includes("✅") || status.toLowerCase().includes("compliant") && !status.includes("⚠️") && !status.includes("❌"))
      return { icon: "✅", bg: "#f0fdf4", color: "#166534", border: "#86efac" };
    if (status.includes("❌") || status.toLowerCase().includes("non-compliant"))
      return { icon: "❌", bg: "#fff1f2", color: "#9f1239", border: "#fda4af" };
    if (status.includes("⚠️") || status.toLowerCase().includes("conditional"))
      return { icon: "⚠️", bg: "#fffbeb", color: "#92400e", border: "#fcd34d" };
    return { icon: "🔍", bg: "#f0f9ff", color: "#0c4a6e", border: "#bae6fd" };
  }

  function riskBadge(risk) {
    const r = (risk || "").toUpperCase();
    if (r.includes("HIGH")) return { bg: "#fff1f2", color: "#9f1239" };
    if (r.includes("MED")) return { bg: "#fffbeb", color: "#92400e" };
    return { bg: "#f0fdf4", color: "#166534" };
  }

  function handleFilesChange(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setRankedFiles(scoreFiles(files));
    setSelectedIndex(0);
    setResult(null); setError("");
    setShowUpload(true);
  }

  function copyProposal() {
    if (!report?.proposal_draft) return;
    navigator.clipboard.writeText(report.proposal_draft).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  function exportMarkdown() {
    if (!report?.proposal_draft) return;
    const blob = new Blob([report.proposal_draft], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `proposal-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── SSE-based agentic report stream ──────────────────────────────────────
  function streamReport(auditData) {
    if (!auditData?.compliance) return;
    if (esRef.current) esRef.current.close();

    setLoadingReport(true); setReport(null); setAgents([]); setAgentSteps({}); setTerminalLog([]);

    // Unicode-safe base64: encodeURIComponent handles multibyte chars, unescape maps to Latin1
    const json = JSON.stringify({
      pillars: auditData.compliance,
      executiveSummary: auditData.executiveSummary || "",
      title: auditData.title || "",
      agency: auditData.agency || ""
    });
    const ctx = btoa(unescape(encodeURIComponent(json)));

    const streamUrl = API_BASE
      ? `${API_BASE}/api/generate-report-stream?ctx=${encodeURIComponent(ctx)}`
      : `/api/generate-report-stream?ctx=${encodeURIComponent(ctx)}`;
    const es = new EventSource(streamUrl);
    esRef.current = es;

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "pipeline_start") {
        setAgents(msg.agents);
        const steps = {}; msg.agents.forEach(a => { steps[a.id] = "idle"; });
        setAgentSteps(steps);
        setTerminalLog([{ ts: Date.now(), text: "▶ Pipeline initialized. 4 agents queued.", kind: "system" }]);
      } else if (msg.type === "agent_start") {
        setAgentSteps(prev => ({ ...prev, [msg.agent.id]: "running" }));
        setTerminalLog(prev => [...prev, { ts: Date.now(), text: `→ ${msg.agent.label} started`, kind: "start" }]);
      } else if (msg.type === "agent_log") {
        setTerminalLog(prev => [...prev, { ts: Date.now(), text: `  ${msg.message}`, kind: "log" }]);
        // auto-scroll
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      } else if (msg.type === "agent_done") {
        setAgentSteps(prev => ({ ...prev, [msg.agent.id]: "done" }));
        setTerminalLog(prev => [...prev, { ts: Date.now(), text: `✓ ${msg.agent.label} complete`, kind: "done" }]);
        if (msg.data?.proposal_draft) setReport(prev => ({ ...(prev || {}), proposal_draft: msg.data.proposal_draft }));
        if (msg.data?.compliance_report) setReport(prev => ({ ...(prev || {}), compliance_report: msg.data.compliance_report }));
      } else if (msg.type === "pipeline_complete") {
        setTerminalLog(prev => [...prev, { ts: Date.now(), text: "✦ Pipeline complete. Report ready.", kind: "system" }]);
        setReport(msg);
        setLoadingReport(false);
        es.close();
      } else if (msg.type === "error") {
        setTerminalLog(prev => [...prev, { ts: Date.now(), text: `✕ Error: ${msg.message}`, kind: "error" }]);
        setLoadingReport(false);
        es.close();
      }
    };
    es.onerror = () => { setLoadingReport(false); es.close(); };
  }

  async function runUrlAudit() {
    if (!samUrl.trim()) return;
    setLoadingUrl(true); setError(""); setResult(null); setReport(null); setAgents([]); setAgentSteps({}); setShowUpload(false);
    try {
      const endpoint = API_BASE ? `${API_BASE}/api/analyze-link` : "/api/analyze-link";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: samUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setShowUpload(true); throw new Error(data.error || "Compliance Engine verification failed."); }
      setResult(data);
      sessionStorage.setItem("bidsmith_audit_context", JSON.stringify({
        samUrl: samUrl.trim(),
        noticeId: data?.noticeId || "",
        title: data?.title || "",
        userId: "anonymous",
      }));
      streamReport(data);
    } catch (e) {
      if (e.message.includes("Compliance engine incomplete") || e.message.includes("Manual upload required") || e.message.includes("fetch")) {
        setError("Automatic retrieval failed. Upload the solicitation PDF below."); setShowUpload(true);
      } else { setError(e.message); }
    }
    finally { setLoadingUrl(false); }
  }

  async function runFileAudit() {
    if (!selectedFile) return;
    setLoadingFile(true); setError(""); setResult(null); setReport(null); setAgents([]); setAgentSteps({});
    try {
      const formData = new FormData();
      formData.append("file", selectedFile.file);
      const endpoint = API_BASE ? `${API_BASE}/api/audit` : "/api/audit";
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Compliance evaluation failed");
      setResult(data);
      sessionStorage.setItem("bidsmith_audit_context", JSON.stringify({
        samUrl: "",
        noticeId: "",
        title: data?.metadata?.file || "Manual Upload",
        userId: "anonymous",
      }));
      streamReport(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingFile(false); }
  }

  async function startPremiumCheckout() {
    if (!premiumTier || !result) return;
    setPremiumLoading(true);
    setPremiumError("");
    try {
      const url = await createCheckoutSession({
        plan: PREMIUM_BASE_PLAN,
        premiumTier,
        context: {
          noticeId: result?.noticeId || "",
          opportunityTitle: result?.title || result?.metadata?.file || "Unknown Opportunity",
          source: "audit_page",
        },
      });
      window.location.assign(url);
    } catch (e) {
      setPremiumError(e?.message || "Unable to start premium checkout.");
    } finally {
      setPremiumLoading(false);
    }
  }

  async function startArisCheckout() {
    if (!result) return;
    setArisLoading(true);
    setArisError("");
    try {
      const session = await createArisCallSession({
        successUrl: `${window.location.origin}/app?aris=checkout_success`,
        cancelUrl: `${window.location.origin}/app?aris=checkout_canceled`,
        metadata: {
          noticeId: result?.noticeId || "",
          source: "audit_page",
        },
      });
      window.location.assign(session.url);
    } catch (e) {
      setArisError(e?.message || "Aris checkout failed.");
      setArisLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", padding: "40px 24px 100px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "8px", flexShrink: 0 }}>
                <img src="/aris-logo.png" alt="BidSmith logo" style={{ width: 22, height: 22, objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em", fontFamily: "'Inter', sans-serif" }}>BidSmith</div>
                <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", fontWeight: 600 }}>Aris Protocol · Bid Intelligence</div>
              </div>
            </div>
            {onBack && (
              <button 
                onClick={onBack}
                style={{
                  background: "transparent",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "#64748b",
                  cursor: "pointer",
                  fontFamily: "monospace"
                }}
              >
                ← Home
              </button>
            )}
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.02em", fontFamily: "'Inter', sans-serif" }}>Federal Bid Compliance Check</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, letterSpacing: "0.02em", fontFamily: "monospace" }}>Zero Token Security · Stateless Bridge. We don't save your data or store your contract bids.</p>
        </div>

        {/* SAM.gov URL */}
        <div style={{ marginBottom: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="text"
              value={samUrl}
              onChange={e => setSamUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isLoading && runUrlAudit()}
              placeholder="Paste SAM.gov Opportunity Link (e.g., https://sam.gov/opp/...)"
              style={{ flex: 1, background: "#ffffff", border: "2px solid #cbd5e1", borderRadius: "6px", padding: "14px 16px", color: "#0f172a", fontSize: "14px", fontFamily: "monospace", outline: "none", minWidth: 0, transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#cbd5e1"}
            />
            <button
              onClick={runUrlAudit}
              disabled={isLoading || !samUrl.trim()}
              style={{ width: "100%", background: isLoading || !samUrl.trim() ? "#e2e8f0" : "#0f172a", color: isLoading || !samUrl.trim() ? "#94a3b8" : "#ffffff", border: "none", borderRadius: "6px", padding: "16px", fontSize: "14px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", cursor: isLoading || !samUrl.trim() ? "not-allowed" : "pointer", fontFamily: "monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              Run Compliance Audit
            </button>
            <div style={{ textAlign: "center", fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>
              No upload required. We fetch documents automatically.
            </div>
          </div>

          {/* Vertical Loading State */}
          {loadingUrl && (
            <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {LOADING_STEPS.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", opacity: i <= stepIndex ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: i < stepIndex ? "#22c55e" : i === stepIndex ? "#3b82f6" : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {i < stepIndex && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                  </div>
                  <span style={{ fontSize: "13px", fontFamily: "monospace", color: i <= stepIndex ? "#0f172a" : "#94a3b8", fontWeight: i === stepIndex ? 700 : 400 }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Fallback Link */}
        {!showUpload && !isLoading && !result && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button onClick={() => setShowUpload(true)} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "12px", fontFamily: "monospace", textDecoration: "underline", cursor: "pointer", padding: "8px" }}>
              Upload PDF manually instead
            </button>
          </div>
        )}

        {error && (
          <div style={{ margin: "24px 0", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "14px 18px", color: "#b91c1c", fontSize: "13px", fontFamily: "monospace", fontWeight: 600 }}>⚠ {error}</div>
        )}
        {checkoutStatus && (
          <div
            style={{
              margin: "18px 0 0",
              background: checkoutStatus.kind === "success" ? "#f0fdf4" : "#fffbeb",
              border: checkoutStatus.kind === "success" ? "1px solid #86efac" : "1px solid #fcd34d",
              borderRadius: "6px",
              padding: "12px 14px",
              color: checkoutStatus.kind === "success" ? "#166534" : "#92400e",
              fontSize: "12px",
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {checkoutStatus.kind === "success" ? "✓ " : "⚠ "}
            {checkoutStatus.text}
          </div>
        )}
        {arisStatus && (
          <div style={{ margin: "10px 0 0", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: "6px", padding: "10px 12px", color: "#155e75", fontSize: "12px", fontFamily: "monospace", fontWeight: 700 }}>
            {arisStatus}
          </div>
        )}
        {arisError && (
          <div style={{ margin: "10px 0 0", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "10px 12px", color: "#b91c1c", fontSize: "12px", fontFamily: "monospace", fontWeight: 700 }}>
            {arisError}
          </div>
        )}

        {/* Main Manual Upload Box Triggered Only Upon Failure or Request */}
        {showUpload && (
          <div style={{ marginTop: "32px", animation: "fadeIn 0.3s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b", letterSpacing: "0.1em" }}>MANUAL COMPLIANCE OVERRIDE</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </div>

            <label
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "32px 24px", cursor: "pointer", background: "#ffffff", transition: "all 0.15s", marginBottom: "16px" }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#f0fdf4"; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#ffffff"; if (e.dataTransfer.files.length) handleFilesChange({ target: { files: e.dataTransfer.files } }); }}
            >
              <span style={{ fontSize: "28px" }}>📂</span>
              <span style={{ fontSize: "14px", color: "#334155", fontFamily: "monospace", fontWeight: 600 }}>Drop PDFs here or <span style={{ color: "#2563eb", textDecoration: "underline" }}>click to browse</span></span>
              <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", letterSpacing: "0.05em" }}>Keyword ranker will isolate the primary solicitation</span>
              <input type="file" accept=".pdf" multiple onChange={handleFilesChange} style={{ display: "none" }} />
            </label>

            {/* File Ranker */}
            {rankedFiles.length > 0 && (
              <div style={{ marginBottom: "16px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 4px -1px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#475569", textTransform: "uppercase", fontFamily: "monospace" }}>Ranked Documents</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {rankedFiles.map((rf, i) => (
                    <FileRow key={`${rf.file.name}-${i}`} ranked={rf} index={i} isSelected={i === selectedIndex} onSelect={() => setSelectedIndex(i)} />
                  ))}
                </div>
                <button
                  onClick={runFileAudit}
                  disabled={isLoading}
                  style={{ width: "100%", background: isLoading ? "#e2e8f0" : "#2563eb", color: isLoading ? "#64748b" : "#fff", border: "none", borderRadius: "6px", padding: "14px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {loadingFile
                    ? <><span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #64748b", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Analyzing {selectedFile?.file.name}...</>
                    : `Evaluate "${selectedFile?.file.name}"`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Audit Output Render */}
        {result && c && (
          <div style={{ marginTop: "40px" }}>
            <ExecutiveBanner assessment={c.disqualification_assessment} />
            <ResultMeta result={result} />

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", marginTop: "10px" }}>
              <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, #e2e8f0, transparent)" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#64748b", textTransform: "uppercase" }}>7-Pillar Verification Grid</span>
              <div style={{ height: "1px", flex: 1, background: "linear-gradient(270deg, #e2e8f0, transparent)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              <PillarCard icon="🆔" label="Solicitation ID" data={c.solicitation_id} />
              <PillarCard icon="📅" label="Deadline Date" data={c.deadline_date} />
              <PillarCard icon="🏷️" label="Set-Aside Type" data={c.set_aside_type} />
              <PillarCard icon="📋" label="Past Performance Threshold" data={c.past_performance_threshold} />
              <DisqualifiersCard items={c.technical_disqualifiers} />
              <BondingCard bonding={c.bonding_reqs} />
            </div>

            <div style={{ marginTop: "18px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "18px", boxShadow: "0 2px 6px rgba(15,23,42,0.04)" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#312e81", fontFamily: "'Inter', sans-serif", marginBottom: "6px" }}>
                Premium Risk-Memo PDF
              </div>
              <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.6, marginBottom: "10px", fontFamily: "monospace" }}>
                Executive-ready, FAR-cited compliance memo delivered in 24-48 hours.
              </div>

              <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#0f172a", fontFamily: "monospace", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="premium-tier"
                    checked={premiumTier === "standard"}
                    onChange={() => setPremiumTier("standard")}
                  />
                  <span>Standard - $199</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#0f172a", fontFamily: "monospace", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="premium-tier"
                    checked={premiumTier === "express"}
                    onChange={() => setPremiumTier("express")}
                  />
                  <span>Express (24h) - $299</span>
                </label>
              </div>

              <img
                src="/premium-preview.svg"
                alt="Premium report preview"
                style={{ width: "100%", maxWidth: "460px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "12px", display: "block" }}
              />

              <button
                type="button"
                onClick={startPremiumCheckout}
                disabled={!premiumTier || premiumLoading}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "none",
                  padding: "12px 14px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: !premiumTier || premiumLoading ? "not-allowed" : "pointer",
                  background: !premiumTier || premiumLoading ? "#cbd5e1" : "#4f46e5",
                  color: !premiumTier || premiumLoading ? "#475569" : "#ffffff",
                }}
              >
                {premiumLoading ? "Redirecting..." : "Add to order"}
              </button>
              {premiumError && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#b91c1c", fontFamily: "monospace", fontWeight: 700 }}>
                  {premiumError}
                </div>
              )}
            </div>

            <div style={{ marginTop: "12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#166534", marginBottom: "6px", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                Aris SDK Pay-Per-Call
              </div>
              <div style={{ fontSize: "12px", color: "#166534", marginBottom: "10px", fontFamily: "monospace" }}>
                Run full Aris execution for this opportunity at USD 0.25 per call.
              </div>
              <button
                type="button"
                onClick={startArisCheckout}
                disabled={arisLoading}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "none",
                  padding: "11px 14px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: arisLoading ? "not-allowed" : "pointer",
                  background: arisLoading ? "#bbf7d0" : "#16a34a",
                  color: arisLoading ? "#166534" : "#ffffff",
                }}
              >
                {arisLoading ? "Redirecting..." : "Run Aris Engine (USD 0.25)"}
              </button>
            </div>

            {arisResult && (
              <div style={{ marginTop: "12px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Aris Execution Output
                </div>
                <pre style={{ margin: 0, maxHeight: "260px", overflow: "auto", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px", fontSize: "11px", lineHeight: 1.55, color: "#1e293b", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {JSON.stringify(arisResult, null, 2)}
                </pre>
              </div>
            )}

            {/* ── Bid Intelligence Report ── */}
            {(loadingReport || agents.length > 0 || report) && (
              <div style={{ marginTop: "48px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                  <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, #e2e8f0, transparent)" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color: "#64748b", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>🤖 Agentic Pipeline</span>
                  <div style={{ height: "1px", flex: 1, background: "linear-gradient(270deg, #e2e8f0, transparent)" }} />
                </div>

                {/* ── Agent pipeline panel ── */}
                {agents.length > 0 && (
                  <div style={{ background: "#0f172a", borderRadius: "10px", padding: "20px 24px", marginBottom: "28px", border: "1px solid #1e293b" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {agents.map((agent) => {
                        const st = agentSteps[agent.id] || "idle";
                        return (
                          <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{
                              width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                              background: st === "done" ? "#22c55e" : st === "running" ? "#3b82f6" : "#1e293b",
                              border: st === "running" ? "2px solid #60a5fa" : "2px solid transparent",
                              animation: st === "running" ? "pulse 1s ease infinite" : "none"
                            }}>
                              {st === "done" && <span style={{ fontSize: "11px" }}>✓</span>}
                              {st === "running" && <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#fff", animation: "ping 1s ease infinite" }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: st === "idle" ? "#475569" : st === "running" ? "#93c5fd" : "#86efac", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.02em" }}>{agent.label}</div>
                              <div style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace", marginTop: "1px" }}>{agent.role}</div>
                            </div>
                            <div style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", color: st === "done" ? "#22c55e" : st === "running" ? "#60a5fa" : "#334155", textTransform: "uppercase" }}>
                              {st === "done" ? "DONE" : st === "running" ? "RUNNING" : "QUEUED"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Live Agent Terminal Log ── */}
                {terminalLog.length > 0 && (
                  <div style={{ background: "#020617", borderRadius: "10px", border: "1px solid #1e293b", marginBottom: "28px", overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid #0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
                      </div>
                      <span style={{ fontSize: "10px", color: "#334155", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em" }}>aris-agent — pipeline log</span>
                      {loadingReport && <span style={{ marginLeft: "auto", display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", animation: "ping 1s ease infinite" }} />}
                    </div>
                    <div style={{ maxHeight: "240px", overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      {terminalLog.map((line, i) => {
                        const colors = {
                          system: "#60a5fa", start: "#c084fc", log: "#4ade80",
                          done: "#86efac", error: "#f87171",
                        };
                        return (
                          <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "9px", color: "#1e3a5f", fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, marginTop: "2px", letterSpacing: "0.05em" }}>
                              {new Date(line.ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            <span style={{ fontSize: "11px", color: colors[line.kind] || "#64748b", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, letterSpacing: "0.02em" }}>
                              {line.text}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                )}

                {/* loading fallback if SSE didn't send agents yet */}
                {loadingReport && agents.length === 0 && (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", textAlign: "center", marginBottom: "20px" }}>
                    <div style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#64748b", marginTop: "10px" }}>Initializing agent pipeline...</div>
                  </div>
                )}

                {report && (
                  <>
                    {/* ── Proposal Draft ── */}
                    {report.proposal_draft && (
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)" }}>
                        <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>🔐</div>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}>Risk Memorandum</div>
                              <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>Phase 1 Disqualification Audit · BidSmith Intelligence</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={copyProposal} style={{ padding: "7px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: copied ? "#166534" : "#475569", cursor: "pointer", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}>
                              {copied ? "✓ COPIED" : "⎘ COPY"}
                            </button>
                            <button onClick={() => window.print()} style={{ padding: "7px 14px", background: "#dc2626", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#fff", cursor: "pointer", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "5px" }}>
                              ↓ EXPORT PDF
                            </button>
                          </div>
                        </div>
                        <div id="risk-memo-print" style={{ padding: "32px 36px", fontSize: "14px", lineHeight: 1.8, color: "#1e293b", fontFamily: "'Inter', sans-serif", overflowX: "auto", maxWidth: "100%", wordBreak: "break-word" }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{
                            h1: ({ children }) => <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.02em", fontFamily: "'Inter', sans-serif" }}>{children}</h1>,
                            h2: ({ children }) => <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1e40af", marginTop: "28px", marginBottom: "12px", letterSpacing: "-0.01em", fontFamily: "'Inter', sans-serif", borderBottom: "1px solid #e0f2fe", paddingBottom: "8px" }}>{children}</h2>,
                            p: ({ children }) => <p style={{ marginBottom: "14px", lineHeight: 1.8, color: "#334155", wordBreak: "break-word" }}>{children}</p>,
                            blockquote: ({ children }) => <blockquote style={{ margin: "16px 0", padding: "12px 20px", background: "#eff6ff", borderLeft: "3px solid #3b82f6", borderRadius: "0 6px 6px 0", color: "#1e40af", fontStyle: "italic", fontSize: "13px", lineHeight: 1.6 }}>{children}</blockquote>,
                            strong: ({ children }) => <strong style={{ fontWeight: 700, color: "#0f172a" }}>{children}</strong>,
                            li: ({ children }) => <li style={{ marginBottom: "6px", lineHeight: 1.7, color: "#334155" }}>{children}</li>,
                            ul: ({ children }) => <ul style={{ paddingLeft: "20px", marginBottom: "14px" }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ paddingLeft: "20px", marginBottom: "14px" }}>{children}</ol>,
                            code: ({ children }) => <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", color: "#334155" }}>{children}</code>,
                            table: ({ children }) => (<div style={{ overflowX: "auto", marginBottom: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "640px" }}>{children}</table></div>),
                            th: ({ children }) => <th style={{ padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", fontWeight: 700, color: "#475569", textAlign: "left", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</th>,
                            td: ({ children }) => <td style={{ padding: "8px 12px", border: "1px solid #e2e8f0", color: "#334155", verticalAlign: "top", minWidth: "80px", maxWidth: "220px", wordBreak: "break-word", lineHeight: 1.5, overflowWrap: "break-word" }}>{children}</td>,
                          }}>{report.proposal_draft}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* ── Compliance Matrix ── */}
                    {report.compliance_report && (() => {
                      const rows = parseComplianceTable(report.compliance_report);
                      const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
                      return (
                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                          <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>📊</div>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", fontFamily: "'Inter', sans-serif" }}>Compliance Matrix</div>
                              <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>{rows.length} Requirements · FAR-Referenced</div>
                            </div>
                          </div>
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace" }}>
                              <thead>
                                <tr style={{ background: "#f8fafc" }}>
                                  {cols.map(col => <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#475569", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{col}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, ri) => (
                                  <tr key={ri} style={{ background: ri % 2 === 0 ? "#ffffff" : "#fafafa", transition: "background 0.1s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                                    onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? "#ffffff" : "#fafafa"}>
                                    {cols.map((col, ci) => {
                                      const val = row[col] || "";
                                      const isStatus = col.toLowerCase().includes("status");
                                      const isRisk = col.toLowerCase().includes("risk") && !col.toLowerCase().includes("requirement");
                                      const badge = isStatus ? statusBadge(val) : null;
                                      const rb = isRisk ? riskBadge(val) : null;
                                      return (
                                        <td key={ci} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle", color: "#334155", maxWidth: ci === 0 ? "200px" : undefined }}>
                                          {badge ? (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
                                              {badge.icon} {val.replace(/[✅❌⚠️🔍]/g, "").trim()}
                                            </span>
                                          ) : rb ? (
                                            <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: rb.bg, color: rb.color, whiteSpace: "nowrap" }}>{val}</span>
                                          ) : (
                                            <span style={{ lineHeight: 1.5 }}>{val}</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Win Themes + Risk Flags ── */}
                    {(report.win_themes?.length > 0 || report.risk_flags?.length > 0) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                        {report.win_themes?.length > 0 && (
                          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "24px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#166534", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>🏆 Win Themes</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              {report.win_themes.map((t, i) => (
                                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#166534", color: "#fff", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
                                  <div style={{ fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#14532d", lineHeight: 1.5, fontWeight: 500 }}>{t}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {report.risk_flags?.length > 0 && (
                          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "24px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#9a3412", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>⚠️ Pre-Submission Risk Flags</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              {report.risk_flags.map((r, i) => (
                                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                  <div style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>⚡</div>
                                  <div style={{ fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#7c2d12", lineHeight: 1.5, fontWeight: 500 }}>{r}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "12px", textAlign: "center" }}>
                      <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                        Audit Note: This report was generated via the <strong style={{ color: "#2563eb" }}>ARIS Stateless Bridge</strong>. Zero Storage. High Conviction.
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); } }
          @keyframes ping { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1); opacity: 0.6; } }
          button:hover:not(:disabled) { filter: brightness(1.05); }
          input::placeholder { color: #94a3b8; }

          @media print {
            body * { visibility: hidden !important; }
            #risk-memo-print, #risk-memo-print * { visibility: visible !important; }
            #risk-memo-print {
              position: fixed !important;
              top: 0; left: 0;
              width: 100% !important;
              padding: 48px 56px !important;
              font-family: 'Times New Roman', Times, serif !important;
              font-size: 12pt !important;
              line-height: 1.7 !important;
              color: #000 !important;
              background: #fff !important;
            }
            #risk-memo-print h1 { font-size: 16pt !important; font-weight: 900 !important; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
            #risk-memo-print h3 { font-size: 13pt !important; font-weight: 700 !important; margin-top: 24px !important; }
            #risk-memo-print table { width: 100% !important; border-collapse: collapse !important; font-size: 10pt !important; page-break-inside: avoid; }
            #risk-memo-print th { background: #f0f0f0 !important; border: 1px solid #999 !important; padding: 6px 8px !important; font-weight: 700 !important; text-align: left !important; }
            #risk-memo-print td { border: 1px solid #ccc !important; padding: 5px 8px !important; vertical-align: top !important; }
            #risk-memo-print blockquote { border-left: 3px solid #000 !important; padding: 10px 16px !important; margin: 16px 0 !important; background: #f8f8f8 !important; page-break-inside: avoid; }
            #risk-memo-print hr { border: none !important; border-top: 1px solid #ccc !important; margin: 20px 0 !important; }
            @page { margin: 0.75in; size: letter; }
          }
        `}</style>
      </div>
    </div>
  );
}
