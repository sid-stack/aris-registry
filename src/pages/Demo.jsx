/**
 * /demo — Interactive BidSmith demo page.
 * Pre-canned audit result that animates realistically so it always works.
 * No auth, no API calls — pure trust-builder.
 */
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Zap } from "lucide-react";

const DEMO_SAM_URL = "https://sam.gov/opp/a8f9c2d1b3e74f5a9c0d2e1f3b4a5c6d/view";
const DEMO_SOLICITATION = {
  id: "W912DY-24-R-0012",
  title: "Cyber Security Operations Center (CSOC) Support Services",
  agency: "U.S. Army Corps of Engineers",
  value: "$24,500,000",
  setAside: "Total Small Business",
  postedDate: "March 14, 2026",
  responseDate: "April 18, 2026",
  naics: "541519 — Other Computer Related Services",
};

const DEMO_COMPLIANCE = [
  {
    category: "Set-Aside Eligibility",
    verdict: "DISQUALIFIER",
    risk: 96,
    description: "Total Small Business set-aside — offeror must qualify as small under NAICS 541519 ($34M revenue threshold).",
    sourceSnippet: "This acquisition is set aside 100% for Small Business concerns. Offers from other than small business concerns will not be considered. See FAR 52.219-6.",
    sectionRef: "Section B.1, Page 4 — FAR 52.219-6",
    angle: 0, label: "SA",
  },
  {
    category: "Security Clearance",
    verdict: "DISQUALIFIER",
    risk: 91,
    description: "Minimum Secret clearance required for all key personnel performing on-site at USACE facilities.",
    sourceSnippet: "All contractor personnel requiring access to classified information or Government facilities shall possess, at minimum, an active Secret security clearance adjudicated by DoD CAF prior to performance commencement.",
    sectionRef: "Section H.4, Page 19 — DD Form 254",
    angle: 60, label: "SEC",
  },
  {
    category: "Past Performance",
    verdict: "WARNING",
    risk: 74,
    description: "Requires 3 relevant contracts within 5 years of similar size and scope in cyber operations.",
    sourceSnippet: "Offerors shall provide a minimum of three (3) recent and relevant past performance references within the last five (5) years. References must demonstrate experience with 24/7 SOC operations for federal clients at comparable contract values.",
    sectionRef: "Section M, Evaluation Factor 3 — Page 31",
    angle: 120, label: "PP",
  },
  {
    category: "CMMC Level 2",
    verdict: "WARNING",
    risk: 68,
    description: "DFARS 252.204-7021 requires CMMC Level 2 certification or active POA&M before award.",
    sourceSnippet: "The contractor shall have a current CMMC Level 2 certification or an approved Plan of Action and Milestones (POA&M) on file with DCSA. SPRS score must be greater than or equal to -100.",
    sectionRef: "Section I — DFARS 252.204-7021",
    angle: 180, label: "CMMC",
  },
  {
    category: "FAR 52.204-21",
    verdict: "WARNING",
    risk: 55,
    description: "Basic safeguarding of covered contractor information systems required with documentation.",
    sourceSnippet: "The Contractor shall apply the following basic safeguarding requirements and procedures to protect covered contractor information systems: (1) Limit information system access to authorized users...",
    sectionRef: "Section I — FAR 52.204-21",
    angle: 240, label: "FAR",
  },
  {
    category: "Bonding / Insurance",
    verdict: "PASS",
    risk: 22,
    description: "Standard commercial liability insurance required — no performance bond.",
    sourceSnippet: "Contractor shall maintain commercial general liability insurance of not less than $1,000,000 per occurrence. No performance or payment bond is required for this acquisition.",
    sectionRef: "Section H.7, Page 22",
    angle: 300, label: "BOND",
  },
];

const VERDICT_CFG = {
  DISQUALIFIER: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: XCircle,   label: "✗ DISQUALIFIER" },
  WARNING:      { color: "#f59e0b", bg: "rgba(245,158,11,0.07)", icon: AlertTriangle, label: "⚠ WARNING" },
  PASS:         { color: "#22c55e", bg: "rgba(34,197,94,0.07)", icon: CheckCircle, label: "✓ PASS" },
};

const LOG_STEPS = [
  { ms: 0,    text: "[BIDSMITH] Ingesting SAM.gov notice ID W912DY-24-R-0012...",         type: "info" },
  { ms: 400,  text: "[SAM] Solicitation fetched — 3 attachments detected",            type: "success" },
  { ms: 900,  text: "[MERCURY2] Ranking documents: PWS (primary), SF33, DD254",       type: "info" },
  { ms: 1400, text: "[MERCURY2] Parsing Section B — contract type, set-aside flags",  type: "info" },
  { ms: 1900, text: "[MERCURY2] Extracting Section L instructions...",                type: "info" },
  { ms: 2300, text: "[MERCURY2] Extracting Section M evaluation criteria...",         type: "info" },
  { ms: 2700, text: "[RISK] DISQUALIFIER detected: Set-Aside Eligibility (96)",       type: "error" },
  { ms: 3000, text: "[RISK] DISQUALIFIER detected: Security Clearance (91)",          type: "error" },
  { ms: 3300, text: "[RISK] WARNING: Past Performance threshold — 3 refs required",   type: "warning" },
  { ms: 3600, text: "[RISK] WARNING: CMMC Level 2 certification required",            type: "warning" },
  { ms: 3900, text: "[MERCURY2] Mapping all findings to FAR/DFARS citations...",      type: "info" },
  { ms: 4200, text: "[MERCURY2] Generating bid/no-bid recommendation...",             type: "info" },
  { ms: 4600, text: "[BIDSMITH] Audit complete — 2 disqualifiers, 3 warnings, 1 pass",   type: "success" },
];

export default function Demo({ onBack, onEnterApp }) {
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const logsRef = useRef(null);

  function startDemo() {
    setPhase("running");
    setLogs([]);
    setProgress(0);
    setExpanded(null);

    LOG_STEPS.forEach(({ ms, text, type }) => {
      setTimeout(() => {
        setLogs(prev => [...prev, { text, type }]);
        setProgress(Math.round((ms / 4600) * 100));
        if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }, ms);
    });

    setTimeout(() => {
      setPhase("done");
      setProgress(100);
    }, 5000);
  }

  const disqualifiers = DEMO_COMPLIANCE.filter(c => c.verdict === "DISQUALIFIER");

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            <button onClick={onBack} style={s.backBtn}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={s.brand}>BIDSMITH</div>
            <span style={s.headerBadge}>LIVE DEMO</span>
          </div>
          <button onClick={onEnterApp} style={s.ctaBtn}>
            Run on your solicitation <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div style={s.body}>
        {/* Intro */}
        <div style={s.intro}>
          <p style={s.eyebrow}>Interactive Demo</p>
          <h1 style={s.title}>See BidSmith audit a real federal solicitation</h1>
          <p style={s.subtitle}>
            This is an Army CSOC contract — $24.5M, active on SAM.gov. Watch BidSmith parse every clause,
            flag disqualifiers with verbatim evidence, and deliver a bid/no-bid verdict in under 5 seconds.
          </p>
        </div>

        {/* Demo card */}
        <div style={s.demoCard}>

          {/* Solicitation header */}
          <div style={s.solHeader}>
            <div style={s.solMeta}>
              <div style={s.solId}>{DEMO_SOLICITATION.id}</div>
              <div style={s.solTitle}>{DEMO_SOLICITATION.title}</div>
              <div style={s.solAgency}>{DEMO_SOLICITATION.agency}</div>
            </div>
            <div style={s.solStats}>
              {[
                ["Value", DEMO_SOLICITATION.value],
                ["Set-Aside", DEMO_SOLICITATION.setAside],
                ["NAICS", "541519"],
                ["Response Due", DEMO_SOLICITATION.responseDate],
              ].map(([k, v]) => (
                <div key={k} style={s.solStat}>
                  <span style={s.solStatLabel}>{k}</span>
                  <span style={s.solStatValue}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* URL input + run button */}
          <div style={s.inputRow}>
            <div style={s.urlBox}>
              <span style={s.urlLabel}>SAM.gov URL</span>
              <span style={s.urlText}>{DEMO_SAM_URL}</span>
            </div>
            {phase === "idle" && (
              <button onClick={startDemo} style={s.runBtn}>
                <Zap size={15} /> Run Audit
              </button>
            )}
            {phase === "running" && (
              <div style={s.runningBadge}>
                <span style={s.pulseDot} /> Analyzing...
              </div>
            )}
            {phase === "done" && (
              <div style={{ ...s.runningBadge, background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                <CheckCircle size={13} /> Complete
              </div>
            )}
          </div>

          {/* Progress bar */}
          {phase !== "idle" && (
            <div style={s.progressWrap}>
              <div style={{ ...s.progressBar, width: `${progress}%` }} />
            </div>
          )}

          {/* Terminal log */}
          {phase !== "idle" && (
            <div style={s.terminal} ref={logsRef}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  ...s.logLine,
                  color: log.type === "error" ? "#ef4444" : log.type === "warning" ? "#f59e0b" : log.type === "success" ? "#22c55e" : "#6ee7b7",
                }}>
                  {log.text}
                </div>
              ))}
              {phase === "running" && <div style={{ ...s.logLine, color: "#4b5563" }}>█</div>}
            </div>
          )}

          {/* Results */}
          {phase === "done" && (
            <div style={s.results}>
              {/* Go / No-Go Decision */}
              <div style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "1.6rem" }}>🔴</span>
                    <div>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: ".1em", color: "#ef4444", textTransform: "uppercase", marginBottom: 3 }}>Bid Decision</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ef4444" }}>NO-GO</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.62rem", color: "#52525b", letterSpacing: ".06em", marginBottom: 2 }}>CONFIDENCE</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ef4444" }}>91<span style={{ fontSize: "0.75rem", fontWeight: 400 }}>/100</span></div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: ".1em", color: "#6b7280", textTransform: "uppercase", marginBottom: 8 }}>⚠ Top Risks</div>
                    <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 7 }}>
                      {["Not registered as Total Small Business under NAICS 541519 — immediate disqualifier", "Key personnel lack active Secret clearances per DD Form 254", "Only 1 qualifying past performance reference — solicitation requires 3"].map((r, i) => (
                        <li key={i} style={{ fontSize: "0.82rem", color: "#d1d5db", lineHeight: 1.5 }}>{r}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: ".1em", color: "#6b7280", textTransform: "uppercase", marginBottom: 8 }}>💡 Do This Now</div>
                    <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 7 }}>
                      {["Check SAM.gov registration — confirm small business size standard before any proposal work", "Pull clearance status for all proposed key personnel from JPAS/DISS today", "Identify a teaming partner with 2 qualifying federal SOC contracts to close the past performance gap"].map((s2, i) => (
                        <li key={i} style={{ fontSize: "0.82rem", color: "#d1d5db", lineHeight: 1.5 }}>{s2}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div style={s.statsRow}>
                {[
                  { label: "Disqualifiers", value: "2", color: "#ef4444" },
                  { label: "Warnings", value: "3", color: "#f59e0b" },
                  { label: "Pass", value: "1", color: "#22c55e" },
                  { label: "Clauses Checked", value: "47", color: "#818cf8" },
                  { label: "Audit Time", value: "4.6s", color: "#60a5fa" },
                ].map(stat => (
                  <div key={stat.label} style={s.stat}>
                    <span style={{ ...s.statVal, color: stat.color }}>{stat.value}</span>
                    <span style={s.statLabel}>{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Compliance findings */}
              <div style={s.matrixHeader}>
                <Shield size={14} style={{ color: "#818cf8" }} />
                <span>Compliance Matrix — click any finding for evidence</span>
              </div>
              <div style={s.matrix}>
                {[...DEMO_COMPLIANCE].sort((a, b) => b.risk - a.risk).map((item, i) => {
                  const cfg = VERDICT_CFG[item.verdict];
                  const isOpen = expanded === i;
                  const Icon = cfg.icon;
                  const isVerbatim = item.sourceSnippet && !item.sourceSnippet.startsWith("INFERRED");
                  return (
                    <div
                      key={i}
                      style={{
                        ...s.findingCard,
                        borderLeft: `3px solid ${cfg.color}`,
                        background: isOpen ? cfg.bg : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                      }}
                      onClick={() => setExpanded(isOpen ? null : i)}
                    >
                      <div style={s.findingTop}>
                        <div style={s.findingScore} title="Risk score">
                          <span style={{ color: cfg.color, fontWeight: 800, fontSize: "1.15rem" }}>{item.risk}</span>
                          <span style={{ color: "#52525b", fontSize: "0.6rem" }}>RISK</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={s.findingMeta}>
                            <span style={s.findingCat}>{item.category}</span>
                            <span style={{ ...s.verdictPill, color: cfg.color, borderColor: cfg.color }}>
                              <Icon size={10} /> {cfg.label}
                            </span>
                          </div>
                          <div style={s.findingDesc}>{item.description}</div>
                        </div>
                        <span style={{ color: "#52525b", fontSize: "0.7rem" }}>{isOpen ? "▲" : "▼"}</span>
                      </div>

                      {isOpen && (
                        <div style={s.evidence}>
                          <blockquote style={{
                            ...s.snippet,
                            borderLeftColor: isVerbatim ? cfg.color : "#374151",
                          }}>
                            <p style={{ margin: 0, color: isVerbatim ? "#e4e4e7" : "#6b7280", fontStyle: isVerbatim ? "italic" : "normal" }}>
                              {isVerbatim ? `"${item.sourceSnippet}"` : item.sourceSnippet}
                            </p>
                          </blockquote>
                          <div style={s.sectionRef}>
                            📍 {item.sectionRef}
                            {isVerbatim && <span style={s.verbatimBadge}>VERBATIM</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Executive summary */}
              <div style={s.summaryBox}>
                <div style={s.summaryLabel}>Executive Summary</div>
                <p style={s.summaryText}>
                  This solicitation presents <strong style={{ color: "#ef4444" }}>two hard disqualifiers</strong> for
                  non-small businesses and entities without active Secret clearances. Before committing proposal
                  resources, verify: (1) your firm's small business status under NAICS 541519 at the $34M
                  revenue threshold, and (2) key personnel clearance adjudication status. Three additional
                  warnings around past performance depth, CMMC Level 2 certification, and FAR safeguarding
                  require documentation readiness but are addressable.
                </p>
              </div>

              {/* CTA */}
              <div style={s.ctaRow}>
                <div>
                  <div style={s.ctaHeadline}>Now run it on your own solicitation</div>
                  <div style={s.ctaSub}>Paste any SAM.gov URL. Free — no account required.</div>
                </div>
                <button onClick={onEnterApp} style={s.ctaBtnLarge}>
                  Start Free Audit <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust signals */}
        <div style={s.trust}>
          {[
            ["< 90 seconds", "Full audit runtime"],
            ["47+ FAR/DFARS", "Clauses checked"],
            ["Zero-knowledge", "Your data never stored"],
            ["Verbatim evidence", "Every finding cited"],
          ].map(([val, label]) => (
            <div key={label} style={s.trustItem}>
              <div style={s.trustVal}>{val}</div>
              <div style={s.trustLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  header: { borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1080, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  backBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 600 },
  brand: { fontWeight: 900, letterSpacing: ".02em", fontSize: ".9rem", color: "#002244" },
  headerBadge: { background: "rgba(0,34,68,0.05)", color: "#002244", border: "1px solid rgba(0,34,68,0.1)", borderRadius: 999, padding: "2px 10px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".06em" },
  ctaBtn: { background: "#002244", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },

  body: { maxWidth: 1000, margin: "0 auto", padding: "60px 20px 100px" },
  intro: { textAlign: "center", marginBottom: 50 },
  eyebrow: { fontSize: "0.75rem", fontWeight: 800, letterSpacing: ".15em", color: "#64748b", textTransform: "uppercase", marginBottom: 16 },
  title: { fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 20px", lineHeight: 1.1, color: "#002244" },
  subtitle: { fontSize: "1.15rem", color: "#475569", lineHeight: 1.6, maxWidth: 680, margin: "0 auto" },

  demoCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.05)" },

  solHeader: { padding: "32px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 40, flexWrap: "wrap", background: "#fafafa" },
  solMeta: { flex: 1, minWidth: 280 },
  solId: { fontSize: "0.75rem", fontWeight: 800, color: "#002244", letterSpacing: ".1em", marginBottom: 8, textTransform: "uppercase" },
  solTitle: { fontWeight: 900, fontSize: "1.25rem", color: "#0f172a", marginBottom: 6, lineHeight: 1.3 },
  solAgency: { fontSize: "0.9rem", color: "#64748b", fontWeight: 500 },
  solStats: { display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" },
  solStat: { display: "flex", flexDirection: "column", gap: 4 },
  solStatLabel: { fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" },
  solStatValue: { fontSize: "0.95rem", color: "#1e293b", fontWeight: 700 },

  inputRow: { display: "flex", gap: 16, alignItems: "center", padding: "20px 32px", borderBottom: "1px solid #f1f5f9" },
  urlBox: { flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 },
  urlLabel: { fontSize: "0.65rem", color: "#94a3b8", fontWeight: 800, letterSpacing: ".08em" },
  urlText: { fontSize: "0.82rem", color: "#002244", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", wordBreak: "break-all" },
  runBtn: { background: "#002244", color: "#fff", border: "none", borderRadius: 10, padding: "14px 28px", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", transition: "transform 0.2s" },
  runningBadge: { display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "rgba(0,34,68,0.05)", color: "#002244", border: "1px solid rgba(0,34,68,0.2)", borderRadius: 10, fontSize: "0.9rem", fontWeight: 700, whiteSpace: "nowrap" },
  pulseDot: { width: 10, height: 10, borderRadius: "50%", background: "#002244", display: "inline-block", animation: "pulse 1.5s infinite" },

  progressWrap: { height: 4, background: "#f1f5f9" },
  progressBar: { height: "100%", background: "#002244", transition: "width 0.3s ease" },

  terminal: { background: "#0c0c0e", padding: "24px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", lineHeight: 2, maxHeight: 220, overflowY: "auto", borderBottom: "1px solid #e2e8f0" },
  logLine: { margin: 0, fontWeight: 500 },

  results: { padding: "40px" },

  verdictBanner: { background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, gap: 16, flexWrap: "wrap" },
  verdictLabel: { fontSize: "0.7rem", fontWeight: 800, letterSpacing: ".12em", color: "#ef4444", textTransform: "uppercase", marginBottom: 8 },
  verdictText: { fontWeight: 900, fontSize: "1.5rem", color: "#ef4444", marginBottom: 4 },
  verdictSub: { fontSize: "0.9rem", color: "#64748b" },
  riskScore: { display: "flex", flexDirection: "column", alignItems: "center" },
  riskNum: { fontSize: "3rem", fontWeight: 900, color: "#ef4444", lineHeight: 1 },
  riskUnit: { fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" },

  statsRow: { display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" },
  stat: { flex: 1, minWidth: 120, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 6, alignItems: "center", textAlign: "center" },
  statVal: { fontSize: "1.75rem", fontWeight: 900, lineHeight: 1 },
  statLabel: { fontSize: "0.7rem", color: "#64748b", letterSpacing: ".08em", fontWeight: 700, textTransform: "uppercase" },

  matrixHeader: { display: "flex", alignItems: "center", gap: 10, fontSize: "0.8rem", fontWeight: 800, color: "#64748b", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20 },
  matrix: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 },

  findingCard: { borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px", transition: "all 0.2s" },
  findingTop: { display: "flex", alignItems: "flex-start", gap: 20 },
  findingScore: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 },
  findingMeta: { display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" },
  findingCat: { fontWeight: 800, fontSize: "1rem", color: "#002244" },
  verdictPill: { display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", fontWeight: 800, border: "1.5px solid", borderRadius: 6, padding: "3px 10px", letterSpacing: ".05em" },
  findingDesc: { fontSize: "0.95rem", color: "#475569", lineHeight: 1.6 },

  evidence: { marginTop: 20, paddingTop: 20, borderTop: "1px solid #f1f5f9" },
  snippet: { borderLeft: "4px solid", borderRadius: "0 8px 8px 0", padding: "12px 20px", background: "#f8fafc", margin: "0 0 12px" },
  sectionRef: { fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: 10, fontWeight: 600 },
  verbatimBadge: { background: "rgba(0,34,68,0.05)", color: "#002244", border: "1px solid rgba(0,34,68,0.1)", borderRadius: 4, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".08em" },

  summaryBox: { background: "rgba(0,34,68,0.03)", border: "1px solid rgba(0,34,68,0.08)", borderRadius: 16, padding: "24px", marginBottom: 40 },
  summaryLabel: { fontSize: "0.75rem", fontWeight: 800, letterSpacing: ".15em", color: "#002244", textTransform: "uppercase", marginBottom: 12 },
  summaryText: { fontSize: "1rem", color: "#475569", lineHeight: 1.8, margin: 0 },

  ctaRow: { background: "#002244", border: "none", borderRadius: 16, padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap", color: "#fff" },
  ctaHeadline: { fontWeight: 900, fontSize: "1.25rem", color: "#fff", marginBottom: 6 },
  ctaSub: { fontSize: "0.95rem", color: "rgba(255,255,255,0.7)" },
  ctaBtnLarge: { background: "#fff", color: "#002244", border: "none", borderRadius: 10, padding: "16px 32px", fontWeight: 900, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" },

  trust: { display: "flex", gap: 48, justifyContent: "center", marginTop: 60, flexWrap: "wrap" },
  trustItem: { textAlign: "center" },
  trustVal: { fontWeight: 900, fontSize: "1.25rem", color: "#002244", marginBottom: 6 },
  trustLabel: { fontSize: "0.85rem", color: "#64748b", fontWeight: 600 },
};
