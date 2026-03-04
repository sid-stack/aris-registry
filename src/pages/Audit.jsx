import { useState, useEffect, useRef } from "react";

const LOADING_STEPS = [
  "Connecting to SAM.gov...",
  "Fetching opportunity data...",
  "Ranking attachments...",
  "Downloading primary document...",
  "Running 7-pillar compliance audit...",
  "Validating requirements...",
];

function useLoadingStep(active) {
  const [step, setStep] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (!active) { setStep(0); return; }
    ref.current = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 5000);
    return () => clearInterval(ref.current);
  }, [active]);
  return LOADING_STEPS[step];
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

function getRiskColor(score) {
  if (score == null || score === "NOT FOUND") return { bg: "#1e293b", text: "#64748b", label: "—" };
  if (score <= 3) return { bg: "#052e16", text: "#4ade80", label: "LOW" };
  if (score <= 6) return { bg: "#422006", text: "#fb923c", label: "MED" };
  return { bg: "#450a0a", text: "#f87171", label: "HIGH" };
}

function PillarCard({ icon, label, value, wide }) {
  const isNotFound = !value || value === "NOT FOUND";
  return (
    <div style={{ background: isNotFound ? "#0f172a" : "#0d1f2d", border: `1px solid ${isNotFound ? "#1e293b" : "#1e3a5f"}`, borderRadius: "8px", padding: "16px 20px", gridColumn: wide ? "span 2" : "span 1", display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase", fontFamily: "monospace" }}>{label}</span>
      </div>
      <div style={{ fontSize: "13px", fontFamily: "monospace", color: isNotFound ? "#374151" : "#e2e8f0", fontStyle: isNotFound ? "italic" : "normal", wordBreak: "break-word", lineHeight: 1.5 }}>
        {isNotFound ? "NOT FOUND" : value}
      </div>
    </div>
  );
}

function BondingCard({ bonding }) {
  const items = [
    { label: "Bid Bond", value: bonding?.bid_bond },
    { label: "Performance Bond", value: bonding?.performance_bond },
    { label: "Payment Bond", value: bonding?.payment_bond },
  ];
  return (
    <div style={{ background: "#0d1f2d", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "16px 20px", gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>🔒</span>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase", fontFamily: "monospace" }}>Bonding Requirements</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        {items.map(({ label, value }) => {
          const missing = !value || value === "NOT FOUND";
          return (
            <div key={label} style={{ background: missing ? "#0f172a" : "#0a2540", borderRadius: "6px", padding: "10px 12px", border: `1px solid ${missing ? "#1e293b" : "#1e4976"}` }}>
              <div style={{ fontSize: "9px", color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "12px", fontFamily: "monospace", color: missing ? "#374151" : "#93c5fd", fontStyle: missing ? "italic" : "normal" }}>
                {missing ? "NOT FOUND" : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DisqualifiersCard({ items }) {
  const hasItems = Array.isArray(items) && items.length > 0 && items[0] !== "NOT FOUND";
  return (
    <div style={{ background: hasItems ? "#1a0505" : "#0f172a", border: `1px solid ${hasItems ? "#7f1d1d" : "#1e293b"}`, borderRadius: "8px", padding: "16px 20px", gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>⛔</span>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: hasItems ? "#dc2626" : "#475569", textTransform: "uppercase", fontFamily: "monospace" }}>Technical Disqualifiers</span>
      </div>
      {hasItems ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", fontFamily: "monospace", color: "#fca5a5" }}>
              <span style={{ color: "#dc2626", marginTop: "1px", flexShrink: 0 }}>◆</span>{item}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "13px", fontFamily: "monospace", color: "#374151", fontStyle: "italic" }}>NOT FOUND</div>
      )}
    </div>
  );
}

function RiskScoreBadge({ score }) {
  const { bg, text, label } = getRiskColor(score);
  return (
    <div style={{ background: bg, border: `1px solid ${text}33`, borderRadius: "8px", padding: "16px 20px", gridColumn: "span 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase", fontFamily: "monospace" }}>Risk Score</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span style={{ fontSize: "42px", fontWeight: 900, color: text, fontFamily: "monospace", lineHeight: 1 }}>
          {score == null || score === "NOT FOUND" ? "–" : score}
        </span>
        {score != null && score !== "NOT FOUND" && <span style={{ fontSize: "16px", color: "#475569", fontFamily: "monospace" }}>/10</span>}
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", color: text, fontFamily: "monospace" }}>{label}</span>
    </div>
  );
}

function ExecutiveSummary({ text }) {
  if (!text) return null;
  const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();
  const lines = cleaned.split("\n");
  return (
    <div style={{ marginTop: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, #1e3a5f, transparent)" }} />
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "#475569", textTransform: "uppercase", fontFamily: "monospace" }}>Bid / No-Bid Executive Summary</span>
        <div style={{ height: "1px", flex: 1, background: "linear-gradient(270deg, #1e3a5f, transparent)" }} />
      </div>
      <div style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: "8px", padding: "24px", fontFamily: "monospace", fontSize: "13px", lineHeight: "1.8", color: "#94a3b8" }}>
        {lines.map((line, i) => {
          if (line.startsWith("## ") || line.startsWith("# "))
            return <div key={i} style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", margin: "12px 0 8px" }}>{line.replace(/^#+\s/, "")}</div>;
          if (line.match(/\*\*(.+?)\*\*/)) {
            const parsed = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong style="color:#e2e8f0">${m}</strong>`);
            return <div key={i} dangerouslySetInnerHTML={{ __html: parsed }} style={{ marginBottom: "2px" }} />;
          }
          if (line.startsWith("- ✅") || line.startsWith("- ⚠️") || line.startsWith("- ❌")) {
            const color = line.includes("✅") ? "#4ade80" : line.includes("⚠️") ? "#fb923c" : "#f87171";
            return <div key={i} style={{ color, marginBottom: "4px", paddingLeft: "8px" }}>{line.slice(2)}</div>;
          }
          if (line.match(/^\d+\./))
            return <div key={i} style={{ color: "#93c5fd", marginBottom: "4px", paddingLeft: "8px" }}>{line}</div>;
          if (line.trim() === "---")
            return <hr key={i} style={{ border: "none", borderTop: "1px solid #1e293b", margin: "12px 0" }} />;
          return <div key={i} style={{ marginBottom: line.trim() === "" ? "8px" : "2px" }}>{line}</div>;
        })}
      </div>
    </div>
  );
}

function FileRow({ ranked, index, isSelected, onSelect }) {
  const { file, score, matched } = ranked;
  return (
    <div onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "6px", cursor: "pointer", transition: "all 0.12s", border: isSelected ? "1px solid #2563eb" : "1px solid #1e293b", background: isSelected ? "#0a1929" : "#0a0f1e" }}>
      <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: index === 0 ? "#1d4ed8" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: index === 0 ? "#fff" : "#475569", fontFamily: "monospace", flexShrink: 0 }}>#{index + 1}</div>
      <span style={{ fontSize: "16px", flexShrink: 0 }}>📄</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontFamily: "monospace", color: isSelected ? "#e2e8f0" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isSelected ? 700 : 400 }}>{file.name}</div>
        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
          {matched.map(kw => (
            <span key={kw} style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.08em", padding: "2px 6px", borderRadius: "3px", background: "#0f2540", color: "#60a5fa", border: "1px solid #1e3a5f" }}>{kw}</span>
          ))}
          {matched.length === 0 && <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#374151" }}>no keywords matched</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "13px", fontFamily: "monospace", color: score > 0 ? "#60a5fa" : "#374151", fontWeight: 700 }}>+{score}pts</div>
        <div style={{ fontSize: "10px", color: "#374151", fontFamily: "monospace" }}>{formatBytes(file.size)}</div>
      </div>
      <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: isSelected ? "none" : "2px solid #1e293b", background: isSelected ? "#2563eb" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isSelected && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
      </div>
    </div>
  );
}

function ResultMeta({ result }) {
  if (!result?.title && !result?.agency) return null;
  const isFallback = result.source === "description_text";
  return (
    <div style={{ marginBottom: "16px", padding: "14px 18px", background: "#080f1a", border: "1px solid #1e293b", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
      {result.title && <div style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace" }}>{result.title}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        {result.agency && <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#475569" }}>🏛 {result.agency}</span>}
        {result.primaryDoc && result.primaryDoc !== "description_text" && <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#60a5fa" }}>📄 {result.primaryDoc}</span>}
        {result.attachmentsFound > 0 && <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#374151" }}>{result.attachmentsFound} attachments ranked</span>}
        {isFallback && (
          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#fb923c", background: "#1c0f00", padding: "2px 8px", borderRadius: "4px", border: "1px solid #7c2d12" }}>
            ⚠ No PDF found — audited from description text. Upload PDF for full analysis.
          </span>
        )}
      </div>
    </div>
  );
}

export default function Audit() {
  const [samUrl, setSamUrl]               = useState("");
  const [rankedFiles, setRankedFiles]     = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [result, setResult]               = useState(null);
  const [loadingUrl, setLoadingUrl]       = useState(false);
  const [loadingFile, setLoadingFile]     = useState(false);
  const [error, setError]                 = useState("");
  const loadingStep                       = useLoadingStep(loadingUrl);
  const selectedFile                      = rankedFiles[selectedIndex];
  const c                                 = result?.compliance;
  const isLoading                         = loadingUrl || loadingFile;

  function handleFilesChange(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setRankedFiles(scoreFiles(files));
    setSelectedIndex(0);
    setResult(null); setError("");
  }

  async function runUrlAudit() {
    if (!samUrl.trim()) return;
    setLoadingUrl(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: samUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "URL audit failed");
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingUrl(false); }
  }

  async function runFileAudit() {
    if (!selectedFile) return;
    setLoadingFile(true); setError(""); setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile.file);
      const res = await fetch("/api/audit", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingFile(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030711", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", padding: "40px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", background: "#3b82f6", borderRadius: "50%", boxShadow: "0 0 12px #3b82f6" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#3b82f6", textTransform: "uppercase" }}>Aris · ContractAI</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.02em" }}>7-Pillar Compliance Auditor</h1>
          <p style={{ fontSize: "12px", color: "#475569", margin: 0, letterSpacing: "0.05em" }}>Paste a SAM.gov link for instant audit — or upload PDFs directly</p>
        </div>

        {/* SAM.gov URL */}
        <div style={{ marginBottom: "24px", background: "#080f1a", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px" }}>🏛</span>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", fontFamily: "monospace" }}>SAM.gov Direct Link</span>
            <span style={{ fontSize: "10px", color: "#374151", fontFamily: "monospace", marginLeft: "auto" }}>No download needed — attachments fetched & ranked automatically</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={samUrl}
              onChange={e => setSamUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isLoading && runUrlAudit()}
              placeholder="https://sam.gov/opp/6a1fabc0700446cab376819df6feb7c3/view"
              style={{ flex: 1, background: "#030711", border: "1px solid #1e293b", borderRadius: "6px", padding: "11px 14px", color: "#94a3b8", fontSize: "13px", fontFamily: "monospace", outline: "none", minWidth: 0 }}
            />
            <button
              onClick={runUrlAudit}
              disabled={isLoading || !samUrl.trim()}
              style={{ background: isLoading || !samUrl.trim() ? "#1e293b" : "linear-gradient(135deg, #1d4ed8, #2563eb)", color: isLoading || !samUrl.trim() ? "#475569" : "#fff", border: "none", borderRadius: "6px", padding: "11px 22px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: isLoading || !samUrl.trim() ? "not-allowed" : "pointer", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}
            >
              {loadingUrl
                ? <><span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #475569", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Auditing...</>
                : "Run Audit →"}
            </button>
          </div>
          {loadingUrl && (
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "3px" }}>
                {LOADING_STEPS.map((s, i) => (
                  <div key={i} style={{ width: "20px", height: "3px", borderRadius: "2px", background: i <= LOADING_STEPS.indexOf(loadingStep) ? "#3b82f6" : "#1e293b", transition: "background 0.4s" }} />
                ))}
              </div>
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#60a5fa", letterSpacing: "0.05em" }}>{loadingStep}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
          <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#374151", letterSpacing: "0.1em" }}>OR UPLOAD PDF DIRECTLY</span>
          <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
        </div>

        {/* File Upload */}
        <label
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", border: "2px dashed #1e293b", borderRadius: "10px", padding: "28px 24px", cursor: "pointer", background: "#080f1a", transition: "border-color 0.15s", marginBottom: "16px" }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#2563eb"; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = "#1e293b"; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#1e293b"; if (e.dataTransfer.files.length) { setRankedFiles(scoreFiles(e.dataTransfer.files)); setSelectedIndex(0); setResult(null); setError(""); } }}
        >
          <span style={{ fontSize: "24px" }}>📂</span>
          <span style={{ fontSize: "13px", color: "#475569", fontFamily: "monospace" }}>Drop PDFs here or <span style={{ color: "#3b82f6" }}>click to browse</span></span>
          <span style={{ fontSize: "10px", color: "#374151", fontFamily: "monospace", letterSpacing: "0.08em" }}>Multiple files OK — keyword ranker auto-selects primary document</span>
          <input type="file" accept=".pdf" multiple onChange={handleFilesChange} style={{ display: "none" }} />
        </label>

        {/* File Ranker */}
        {rankedFiles.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase", fontFamily: "monospace" }}>Ranked Documents ({rankedFiles.length})</span>
              <div style={{ height: "1px", flex: 1, background: "#1e293b" }} />
              <span style={{ fontSize: "10px", color: "#374151", fontFamily: "monospace" }}>click to change selection</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              {rankedFiles.map((rf, i) => (
                <FileRow key={`${rf.file.name}-${i}`} ranked={rf} index={i} isSelected={i === selectedIndex} onSelect={() => setSelectedIndex(i)} />
              ))}
            </div>
            <div style={{ marginBottom: "12px", padding: "9px 14px", background: "#050e1a", border: "1px solid #1e3a5f", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace", color: "#475569", display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ color: "#3b82f6" }}>◆</span>
              <span>
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>Primary: </span>
                <span style={{ color: "#60a5fa" }}>{selectedFile?.file.name}</span>
                {selectedIndex === 0 && rankedFiles.length > 1 && <span style={{ color: "#4ade80" }}> (auto-selected)</span>}
                {selectedIndex !== 0 && <span style={{ color: "#fb923c" }}> (manually overridden)</span>}
              </span>
            </div>
            <button
              onClick={runFileAudit}
              disabled={isLoading}
              style={{ background: isLoading ? "#1e293b" : "linear-gradient(135deg, #1d4ed8, #2563eb)", color: isLoading ? "#475569" : "#fff", border: "none", borderRadius: "6px", padding: "12px 24px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "8px" }}
            >
              {loadingFile
                ? <><span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #475569", borderTopColor: "#94a3b8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Auditing {selectedFile?.file.name}...</>
                : `Audit "${selectedFile?.file.name}" →`}
            </button>
          </div>
        )}

        {error && (
          <div style={{ margin: "16px 0", background: "#1a0505", border: "1px solid #7f1d1d", borderRadius: "6px", padding: "12px 16px", color: "#f87171", fontSize: "13px", fontFamily: "monospace" }}>⚠ {error}</div>
        )}

        {result && c && (
          <div style={{ marginTop: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, #1e3a5f, transparent)" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "#475569", textTransform: "uppercase" }}>Compliance Audit — {new Date(result.auditedAt).toLocaleString()}</span>
              <div style={{ height: "1px", flex: 1, background: "linear-gradient(270deg, #1e3a5f, transparent)" }} />
            </div>
            <ResultMeta result={result} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              <PillarCard icon="🆔" label="Solicitation ID" value={c.solicitation_id} />
              <PillarCard icon="📅" label="Deadline Date" value={c.deadline_date} />
              <PillarCard icon="🏷️" label="Set-Aside Type" value={c.set_aside_type} />
              <RiskScoreBadge score={c.risk_score_1_to_10} />
              <BondingCard bonding={c.bonding_reqs} />
              <PillarCard icon="📋" label="Past Performance Threshold" value={c.past_performance_threshold} wide />
              <DisqualifiersCard items={c.technical_disqualifiers} />
            </div>
            <ExecutiveSummary text={result.executiveSummary} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
        label:hover { border-color: #1e3a5f !important; }
        input:focus { border-color: #1e3a5f !important; }
      `}</style>
    </div>
  );
}
