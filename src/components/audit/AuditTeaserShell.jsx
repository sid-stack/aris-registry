import { Lock, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";
import { useState } from "react";

export default function AuditTeaserShell({ teaser, auditId }) {
  const [showSignIn, setShowSignIn] = useState(false);
  const s = styles;

  const rec = teaser?.bidRecommendation || "CONDITIONAL";
  const recColor = rec === "BID" ? "#22c55e" : rec === "NO-BID" ? "#ef4444" : "#f59e0b";

  if (showSignIn) {
    return (
      <div style={s.root}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <button onClick={() => setShowSignIn(false)} style={s.backBtn}>← Back to preview</button>
          <SignIn
            routing="hash"
            forceRedirectUrl={`/audit/${auditId}`}
            fallbackRedirectUrl={`/audit/${auditId}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.shell}>
        {/* Header */}
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={18} color="#0B3D91" />
            <span style={s.brand}>BIDSMITH</span>
          </div>
          <div style={{ ...s.recBadge, background: `${recColor}18`, color: recColor, borderColor: `${recColor}40` }}>
            {rec}
          </div>
        </div>

        {/* Title block */}
        <div style={s.titleBlock}>
          {teaser?.title && <h1 style={s.title}>{teaser.title}</h1>}
          {teaser?.agency && <p style={s.agency}>{teaser.agency}</p>}
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          <StatCard icon={<AlertTriangle size={16} color="#f59e0b" />} label="High-Risk Items" value={teaser?.riskCount ?? "—"} />
          <StatCard icon={<Shield size={16} color="#ef4444" />} label="Disqualifiers" value={teaser?.disqualifierCount ?? "—"} />
          <StatCard icon={<TrendingUp size={16} color="#6366f1" />} label="Win Probability" value={teaser?.winProbability != null ? `${teaser.winProbability}%` : "—"} />
        </div>

        {/* Primary finding */}
        {teaser?.primaryFinding && (
          <div style={s.finding}>
            <p style={s.findingLabel}>PRIMARY FINDING</p>
            <p style={s.findingText}>{teaser.primaryFinding}</p>
          </div>
        )}

        {/* Locked cards */}
        <div style={s.lockedGrid}>
          {["Full Compliance Matrix", "FAR/DFARS Clause Analysis", "Risk Flag Details", "Action Plan"].map(label => (
            <div key={label} style={s.lockedCard}>
              <Lock size={13} color="#475569" />
              <span style={s.lockedLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={s.gate}>
          <p style={s.gateText}>{teaser?.headline || "Full intelligence brief ready"}</p>
          <button onClick={() => setShowSignIn(true)} style={s.unlockBtn}>
            Sign in to unlock full report
          </button>
          <p style={s.gateNote}>Free · No credit card required</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={styles.statCard}>
      {icon}
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", background: "#0a0d14",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24, fontFamily: "'Inter', system-ui, sans-serif",
  },
  shell: {
    width: "100%", maxWidth: 720,
    background: "rgba(13,17,24,0.97)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  brand: { fontSize: 15, fontWeight: 900, color: "#f8fafc", letterSpacing: "0.1em" },
  recBadge: { fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, border: "1px solid" },
  titleBlock: { padding: "20px 24px 0" },
  title: { fontSize: 18, fontWeight: 800, color: "#f8fafc", margin: "0 0 4px", lineHeight: 1.3 },
  agency: { fontSize: 13, color: "#64748b", margin: 0 },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "20px 24px" },
  statCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, padding: "14px 16px",
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: 800, color: "#f8fafc" },
  statLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" },
  finding: {
    margin: "0 24px 20px",
    background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 10, padding: 16,
  },
  findingLabel: { fontSize: 10, fontWeight: 800, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" },
  findingText: { fontSize: 14, color: "#e2e8f0", margin: 0, lineHeight: 1.6 },
  lockedGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 24px 20px" },
  lockedCard: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8, padding: "12px 14px",
  },
  lockedLabel: { fontSize: 12, color: "#334155", fontWeight: 600 },
  gate: { borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px", textAlign: "center" },
  gateText: { fontSize: 13, color: "#64748b", margin: "0 0 14px" },
  unlockBtn: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, #0B3D91, #1d4ed8)",
    color: "#fff", border: "none", borderRadius: 10,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(11,61,145,0.4)",
  },
  gateNote: { fontSize: 12, color: "#334155", margin: "10px 0 0" },
  backBtn: { background: "none", border: "none", color: "#60a5fa", fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 },
};
