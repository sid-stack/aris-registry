const STEPS = [
  "Connecting to ingestion pipeline…",
  "Parsing document structure…",
  "Extracting compliance requirements…",
  "Analyzing FAR/DFARS clauses…",
  "Scoring risk factors…",
  "Building intelligence brief…",
];

export default function AuditProcessingSkeleton({ step = 0 }) {
  const s = styles;
  return (
    <div style={s.root}>
      <div style={s.shell}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.shimmer({ w: 140, h: 14 })} />
            <div style={s.shimmer({ w: 90, h: 10, mt: 6 })} />
          </div>
          <div style={{ ...s.badge, animation: "pulse 1.5s ease-in-out infinite" }}>
            PROCESSING
          </div>
        </div>

        <div style={s.terminal}>
          {STEPS.map((msg, i) => (
            <div key={i} style={{ ...s.logLine, opacity: i <= step ? 1 : 0.25 }}>
              <span style={{ color: i <= step ? "#22c55e" : "#374151" }}>
                {i < step ? "✓" : i === step ? "›" : "·"}
              </span>
              <span style={{ color: i <= step ? "#d1fae5" : "#4b5563", marginLeft: 10 }}>
                {msg}
              </span>
            </div>
          ))}
        </div>

        <div style={s.grid}>
          {["Intelligence Brief", "Compliance Matrix", "Risk Flags", "Next Actions"].map(label => (
            <div key={label} style={s.card}>
              <div style={s.cardLabel}>{label}</div>
              <div style={s.shimmer({ w: "100%", h: 10, mt: 8 })} />
              <div style={s.shimmer({ w: "80%", h: 10, mt: 6 })} />
              <div style={s.shimmer({ w: "60%", h: 10, mt: 6 })} />
            </div>
          ))}
        </div>

        <div style={s.hint}>
          Analyzing compliance requirements · results unlocking shortly
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
      `}</style>
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
    width: "100%", maxWidth: 760,
    background: "rgba(13,17,24,0.97)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18, overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerLeft: { display: "flex", flexDirection: "column" },
  badge: {
    fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
    color: "#6366f1", background: "rgba(99,102,241,0.12)",
    padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(99,102,241,0.25)",
  },
  terminal: {
    padding: "20px 24px", background: "#050508",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.9,
  },
  logLine: { display: "flex", alignItems: "baseline", transition: "opacity 0.4s ease" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 24 },
  card: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, padding: 16,
  },
  cardLabel: { fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" },
  hint: {
    textAlign: "center", padding: "14px 24px",
    fontSize: 13, color: "#64748b",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  shimmer: ({ w, h, mt = 0 }) => ({
    width: w, height: h, marginTop: mt, borderRadius: 4,
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.8s infinite",
  }),
};
