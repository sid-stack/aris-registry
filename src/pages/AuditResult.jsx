import { Shield, AlertTriangle, CheckCircle, Download, ArrowLeft, TrendingUp, FileText } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";

export default function AuditResult({ result, auditId, onBack }) {
  const { user } = useUser();
  const [exportingRtm, setExportingRtm] = useState(false);

  const verdict = result?.verdict || {};
  const rec = verdict.recommendation || "CONDITIONAL";
  const recColor = rec === "BID" ? "#22c55e" : rec === "NO-BID" ? "#ef4444" : "#f59e0b";
  const requirements = result?.requirements || [];
  const riskFlags = result?.risk_flags || [];
  const farClauses = result?.far_clauses || [];
  const sub = result?.submission_details || {};
  const highRisk = requirements.filter(r => r.risk_level === "High" || r.is_disqualifying_if_missing);
  const mandatory = requirements.filter(r => r.type === "Mandatory");

  const handleExport = async () => {
    if (exportingRtm) return;
    setExportingRtm(true);
    try {
      const res = await fetch("/api/export-rtm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complianceData: requirements }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BidSmith_RTM_${result.solicitation_number || auditId}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExportingRtm(false);
    }
  };

  const s = styles;

  return (
    <div style={s.page}>
      {/* Nav */}
      <header style={s.nav}>
        <button onClick={onBack} style={s.backBtn}><ArrowLeft size={16} /> Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={18} color="#0B3D91" />
          <span style={s.brand}>BIDSMITH</span>
        </div>
        <button onClick={handleExport} disabled={exportingRtm} style={s.exportBtn}>
          <Download size={14} />
          {exportingRtm ? "Exporting…" : "Export RTM (.xlsx)"}
        </button>
      </header>

      <div style={s.body}>
        {/* Verdict banner */}
        <div style={{ ...s.verdictBanner, borderColor: `${recColor}30`, background: `${recColor}0a` }}>
          <div style={s.verdictLeft}>
            <div style={{ ...s.verdictBadge, background: `${recColor}18`, color: recColor, borderColor: `${recColor}40` }}>
              {rec}
            </div>
            <div>
              <h1 style={s.titleText}>{result.title || "Federal Solicitation"}</h1>
              <p style={s.agencyText}>{result.agency}{result.solicitation_number ? ` · ${result.solicitation_number}` : ""}</p>
            </div>
          </div>
          <div style={s.statsStrip}>
            <Stat label="Win Probability" value={`${verdict.win_probability ?? "—"}%`} color="#6366f1" />
            <Stat label="Risk Score" value={verdict.risk_score ?? "—"} color="#f59e0b" />
            <Stat label="Requirements" value={requirements.length} color="#22c55e" />
            <Stat label="Disqualifiers" value={highRisk.filter(r => r.is_disqualifying_if_missing).length} color="#ef4444" />
          </div>
        </div>

        {/* Submission details */}
        {(sub.deadline || sub.page_limit || sub.submission_method) && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}><FileText size={14} /> Submission Details</h2>
            <div style={s.detailGrid}>
              {sub.deadline && <DetailCard label="Deadline" value={sub.deadline} />}
              {sub.page_limit && <DetailCard label="Page Limit" value={sub.page_limit} />}
              {sub.submission_method && <DetailCard label="Method" value={sub.submission_method} />}
              {sub.late_submission_disqualifying && <DetailCard label="Late Submission" value="Disqualifying" color="#ef4444" />}
            </div>
          </section>
        )}

        {/* Risk flags */}
        {highRisk.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}><AlertTriangle size={14} color="#f59e0b" /> High-Risk Items ({highRisk.length})</h2>
            <div style={s.flagList}>
              {highRisk.map((r, i) => (
                <div key={i} style={{ ...s.flagCard, borderColor: r.is_disqualifying_if_missing ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)" }}>
                  <div style={s.flagTop}>
                    <span style={{ ...s.riskPill, background: r.is_disqualifying_if_missing ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", color: r.is_disqualifying_if_missing ? "#ef4444" : "#f59e0b" }}>
                      {r.is_disqualifying_if_missing ? "DISQUALIFIER" : "HIGH RISK"}
                    </span>
                    <span style={s.flagSection}>{r.section || r.category || ""}</span>
                  </div>
                  <p style={s.flagText}>{r.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full compliance matrix */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}><CheckCircle size={14} color="#22c55e" /> Compliance Matrix ({requirements.length} requirements)</h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Requirement</th>
                  <th style={s.th}>Section</th>
                  <th style={s.th}>Type</th>
                  <th style={s.th}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((r, i) => (
                  <tr key={i} style={{ ...s.tr, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <td style={{ ...s.td, color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>{r.requirement_id || `req_${String(i + 1).padStart(3, "0")}`}</td>
                    <td style={{ ...s.td, maxWidth: 420 }}>{r.text}</td>
                    <td style={{ ...s.td, color: "#64748b" }}>{r.section || "—"}</td>
                    <td style={s.td}>
                      <span style={{ ...s.typePill, background: r.type === "Mandatory" ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)", color: r.type === "Mandatory" ? "#818cf8" : "#64748b" }}>
                        {r.type || "—"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.riskPill, background: r.risk_level === "High" ? "rgba(239,68,68,0.12)" : r.risk_level === "Medium" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)", color: r.risk_level === "High" ? "#ef4444" : r.risk_level === "Medium" ? "#f59e0b" : "#64748b" }}>
                        {r.risk_level || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAR Clauses */}
        {farClauses.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}><Shield size={14} color="#6366f1" /> FAR/DFARS Clauses ({farClauses.length})</h2>
            <div style={s.clauseGrid}>
              {farClauses.map((c, i) => (
                <div key={i} style={s.clauseCard}>
                  <span style={s.clauseNum}>{c.clause_number}</span>
                  <span style={s.clauseTitle}>{c.title}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || "#f8fafc" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DetailCard({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: color || "#f8fafc" }}>{value}</div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0a0d14", fontFamily: "'Inter', system-ui, sans-serif", color: "#f8fafc" },
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(13,17,24,0.98)", position: "sticky", top: 0, zIndex: 10,
  },
  backBtn: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#60a5fa", fontSize: 13, cursor: "pointer", padding: 0 },
  brand: { fontSize: 15, fontWeight: 900, color: "#f8fafc", letterSpacing: "0.1em" },
  exportBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
    color: "#818cf8", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
  },
  body: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  verdictBanner: {
    border: "1px solid", borderRadius: 14, padding: "24px",
    marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20,
  },
  verdictLeft: { display: "flex", alignItems: "center", gap: 16 },
  verdictBadge: { fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", padding: "6px 14px", borderRadius: 20, border: "1px solid", whiteSpace: "nowrap" },
  titleText: { fontSize: 18, fontWeight: 800, color: "#f8fafc", margin: 0, lineHeight: 1.3 },
  agencyText: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  statsStrip: { display: "flex", gap: 28, flexWrap: "wrap" },
  section: { marginBottom: 32 },
  sectionTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  flagList: { display: "flex", flexDirection: "column", gap: 10 },
  flagCard: { border: "1px solid", borderRadius: 10, padding: "14px 16px", background: "rgba(255,255,255,0.02)" },
  flagTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  flagText: { fontSize: 13, color: "#e2e8f0", margin: 0, lineHeight: 1.6 },
  flagSection: { fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" },
  riskPill: { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 12 },
  tableWrap: { overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  thead: { borderBottom: "1px solid rgba(255,255,255,0.07)" },
  th: { padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(255,255,255,0.02)" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  td: { padding: "10px 14px", verticalAlign: "top", lineHeight: 1.5, color: "#e2e8f0" },
  typePill: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 },
  clauseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 },
  clauseCard: {
    display: "flex", gap: 10, alignItems: "flex-start",
    background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 8, padding: "10px 14px",
  },
  clauseNum: { fontSize: 12, fontWeight: 700, color: "#818cf8", whiteSpace: "nowrap" },
  clauseTitle: { fontSize: 12, color: "#94a3b8" },
};
