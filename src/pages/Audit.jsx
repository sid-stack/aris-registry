import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

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

function PillarCard({ icon, label, data, wide }) {
  const value = typeof data === 'object' && data !== null ? data.value : data;
  const snippet = typeof data === 'object' && data !== null ? data.snippet : null;
  const isNotFound = !value || value === "NOT FOUND";

  return (
    <div style={{ background: isNotFound ? "#f8fafc" : "#ffffff", border: `1px solid #e2e8f0`, borderRadius: "6px", padding: "16px 20px", gridColumn: wide ? "span 2" : "span 1", display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", fontFamily: "monospace" }}>{label}</span>
      </div>
      <div style={{ fontSize: "13px", fontFamily: "monospace", color: isNotFound ? "#94a3b8" : "#0f172a", fontStyle: isNotFound ? "italic" : "normal", wordBreak: "break-word", lineHeight: 1.5, fontWeight: isNotFound ? 400 : 600 }}>
        {isNotFound ? "NOT FOUND" : value}
      </div>
      {snippet && !isNotFound && (
        <div style={{ marginTop: "8px", padding: "8px 12px", background: "#f1f5f9", borderLeft: "2px solid #3b82f6", fontSize: "11px", color: "#475569", fontStyle: "italic", fontFamily: "monospace", wordBreak: "break-word" }}>
          "{snippet}"
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
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "16px 20px", gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>🔒</span>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", fontFamily: "monospace" }}>Bonding Requirements</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        {items.map(({ label, data }) => {
          const value = typeof data === 'object' && data !== null ? data.value : data;
          const snippet = typeof data === 'object' && data !== null ? data.snippet : null;
          const missing = !value || value === "NOT FOUND";
          return (
            <div key={label} style={{ background: missing ? "#f8fafc" : "#f0f9ff", borderRadius: "4px", padding: "10px 12px", border: `1px solid ${missing ? "#e2e8f0" : "#bae6fd"}` }}>
              <div style={{ fontSize: "9px", color: "#64748b", fontFamily: "monospace", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "12px", fontFamily: "monospace", color: missing ? "#94a3b8" : "#0f172a", fontStyle: missing ? "italic" : "normal", fontWeight: missing ? 400 : 700 }}>
                {missing ? "NOT FOUND" : value}
              </div>
              {snippet && !missing && (
                <div style={{ marginTop: "6px", fontSize: "10px", color: "#475569", fontStyle: "italic", wordBreak: "break-word" }} title={snippet}>
                  "{snippet}"
                </div>
              )}
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

export default function Audit({ onProceed }) {
  const [samUrl, setSamUrl] = useState("");
  const [rankedFiles, setRankedFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const { stepText, stepIndex } = useLoadingStep(loadingUrl);
  const selectedFile = rankedFiles[selectedIndex];
  const c = result?.compliance;
  const isLoading = loadingUrl || loadingFile;

  function handleFilesChange(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setRankedFiles(scoreFiles(files));
    setSelectedIndex(0);
    setResult(null); setError("");
    setShowUpload(true);
  }

  async function fetchReport(auditData) {
    if (!auditData?.compliance) return;
    setLoadingReport(true); setReport(null);
    try {
      const res = await fetch("https://api.bidsmith.pro/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillars: auditData.compliance,
          executiveSummary: auditData.executiveSummary || "",
          title: auditData.title || "",
          agency: auditData.agency || ""
        })
      });
      const data = await res.json();
      if (res.ok && data.success) setReport(data);
    } catch (e) { console.warn("Report generation failed:", e.message); }
    finally { setLoadingReport(false); }
  }

  async function runUrlAudit() {
    if (!samUrl.trim()) return;
    setLoadingUrl(true); setError(""); setResult(null); setReport(null); setShowUpload(false);
    try {
      const res = await fetch("https://api.bidsmith.pro/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: samUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShowUpload(true);
        throw new Error(data.error || "Compliance Engine verification failed. Manual extraction required.");
      }
      setResult(data);
      fetchReport(data);
    } catch (e) {
      if (e.message.includes("Compliance engine incomplete") || e.message.includes("Manual upload required") || e.message.includes("fetch")) {
        setError("Automatic retrieval failed. Upload the solicitation PDF below.");
        setShowUpload(true);
      } else {
        setError(e.message);
      }
    }
    finally { setLoadingUrl(false); }
  }

  async function runFileAudit() {
    if (!selectedFile) return;
    setLoadingFile(true); setError(""); setResult(null); setReport(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile.file);
      const res = await fetch("https://api.bidsmith.pro/api/audit", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Compliance evaluation failed");
      setResult(data);
      fetchReport(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingFile(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", padding: "40px 24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "8px", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em", fontFamily: "'Inter', sans-serif" }}>BidSmith</div>
              <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", fontWeight: 600 }}>Aris Protocol · Bid Intelligence</div>
            </div>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.02em", fontFamily: "'Inter', sans-serif" }}>Federal Bid Compliance Check</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, letterSpacing: "0.02em", fontFamily: "monospace" }}>Instant disqualification filtering. Execute semantic audits on live solicitations.</p>
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

            {/* Compliance Report + Matrix */}
            {(loadingReport || report) && (
              <div style={{ marginTop: "40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, #e2e8f0, transparent)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#64748b", textTransform: "uppercase" }}>Bid Intelligence Report</span>
                  <div style={{ height: "1px", flex: 1, background: "linear-gradient(270deg, #e2e8f0, transparent)" }} />
                </div>

                {loadingReport && (
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "32px", textAlign: "center" }}>
                    <div style={{ display: "inline-block", width: "20px", height: "20px", border: "2px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "12px" }} />
                    <div style={{ fontSize: "13px", fontFamily: "monospace", color: "#64748b" }}>Generating premium bid intelligence report...</div>
                  </div>
                )}

                {report && (
                  <>
                    {/* Proposal Draft */}
                    {report.proposal_draft && (
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "32px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#2563eb", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>📄 Proposal Draft</div>
                        <div style={{ fontSize: "13px", lineHeight: 1.7, color: "#1e293b", fontFamily: "'IBM Plex Mono', monospace" }}>
                          <ReactMarkdown>{report.proposal_draft}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Compliance Matrix */}
                    {report.compliance_report && (
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "32px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflowX: "auto" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#2563eb", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>📊 Compliance Matrix</div>
                        <div style={{ fontSize: "12px", lineHeight: 1.6, color: "#1e293b", fontFamily: "'IBM Plex Mono', monospace" }}>
                          <ReactMarkdown>{report.compliance_report}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Win Themes + Risk Flags */}
                    {(report.win_themes?.length > 0 || report.risk_flags?.length > 0) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                        {report.win_themes?.length > 0 && (
                          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "20px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#166534", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "12px" }}>🏆 Win Themes</div>
                            <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                              {report.win_themes.map((t, i) => <li key={i} style={{ fontSize: "12px", fontFamily: "monospace", color: "#166534", lineHeight: 1.5 }}>{t}</li>)}
                            </ul>
                          </div>
                        )}
                        {report.risk_flags?.length > 0 && (
                          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "20px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9a3412", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "12px" }}>⚠️ Risk Flags</div>
                            <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                              {report.risk_flags.map((r, i) => <li key={i} style={{ fontSize: "12px", fontFamily: "monospace", color: "#9a3412", lineHeight: 1.5 }}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        button:hover:not(:disabled) { filter: brightness(1.05); }
        input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}
