import React from 'react';
import { Shield, Lock, Server, RefreshCw, BadgeCheck, Database, Cpu, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';

const PROTOCOL_STEPS = [
  {
    icon: <Lock size={24} color="#818cf8" />,
    title: "Zero-Knowledge Vault",
    description: "Raw solicitations and competitive technical data are never persisted. BidSmith uses ephemeral RAM slots that exist only for the duration of the audit cycle — wiped on session end."
  },
  {
    icon: <Server size={24} color="#818cf8" />,
    title: "Stateless Bridge",
    description: "Linguistic processing occurs over a stateless execution layer. We route the logic but never store a single byte of your intellectual property in a permanent database."
  },
  {
    icon: <RefreshCw size={24} color="#818cf8" />,
    title: "Cryptographic Purge",
    description: "Upon session termination, a tiered cryptographic wipe is initiated across all processing buffers. Zero data residue by architecture, not policy."
  },
  {
    icon: <Database size={24} color="#818cf8" />,
    title: "Local-Out Delivery",
    description: "Compliance matrices and risk reports stream directly to your session for local download. BidSmith holds no copy of generated intelligence after delivery."
  }
];

const SUBPROCESSORS = [
  { name: "Railway", purpose: "Infrastructure & container hosting", location: "US", link: "https://railway.app/legal/privacy" },
  { name: "Upstash", purpose: "Redis cache & vector search (session-scoped, no PII)", location: "US", link: "https://upstash.com/trust/privacy.pdf" },
  { name: "OpenRouter", purpose: "LLM routing (Gemini/Claude — stateless API calls)", location: "US", link: "https://openrouter.ai/privacy" },
  { name: "Stripe", purpose: "Payment processing (PCI-DSS Level 1 certified)", location: "US", link: "https://stripe.com/privacy" },
  { name: "Plausible Analytics", purpose: "Privacy-first web analytics (no cookies, no PII)", location: "EU", link: "https://plausible.io/privacy-focused-web-analytics" },
];

const CONTROLS = [
  { label: "Encryption in transit", status: "active", detail: "TLS 1.2+ enforced on all endpoints via Railway" },
  { label: "Encryption at rest", status: "active", detail: "AES-256 on all Upstash persistence layers" },
  { label: "API rate limiting", status: "active", detail: "Express-rate-limit on all public endpoints" },
  { label: "Session isolation", status: "active", detail: "Upstash vector namespaced per session ID" },
  { label: "Security headers", status: "active", detail: "HSTS, X-Frame-Options, nosniff, Referrer-Policy" },
  { label: "No RFP data storage", status: "active", detail: "Solicitation content processed in-memory only" },
  { label: "Dependency audits", status: "active", detail: "npm audit on every build via CI" },
  { label: "SOC 2 Type I audit", status: "planned", detail: "Target: Q3 2026 — Vanta gap analysis underway" },
  { label: "Penetration test", status: "planned", detail: "Scheduled: Q2 2026" },
  { label: "SOC 2 Type II", status: "roadmap", detail: "Observation period begins after Type I certification" },
];

const DATA_FLOW = `
  USER BROWSER
       │  HTTPS / TLS 1.2+
       ▼
  RAILWAY CDN  ──→  Express API (api/index.js)
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
          Upstash      OpenRouter   Stripe
          (Redis/      (LLM call —  (payments
          Vector)      stateless)   only)
              │
         Session-scoped
         No PII stored
              │
              ▼
       RESULT STREAMED TO CLIENT SESSION
       (not stored server-side)
`;

const Security = ({ onBack }) => {
  return (
    <div style={s.page}>
      <NavBar onBack={onBack} />

      <main style={s.main}>

        {/* Hero */}
        <section style={s.hero}>
          <div style={s.badge}>
            <BadgeCheck size={14} color="#818cf8" />
            <span>SOC 2 AUDIT IN PROGRESS · Q3 2026</span>
          </div>
          <h1 style={s.h1}>Security &amp; Compliance</h1>
          <p style={s.heroSub}>
            BidSmith is built for federal contractors who can't afford data exposure. Our stateless architecture makes solicitation data leaks architecturally impossible — not just a policy promise.
          </p>
          <a href="mailto:sid@bidsmith.pro?subject=Security%20Whitepaper%20Request" style={s.whitepaperBtn}>
            Request Security Whitepaper
          </a>
        </section>

        {/* Protocol cards */}
        <section style={s.section}>
          <h2 style={s.h2}>The BidSmith Security Protocol</h2>
          <div style={s.grid4}>
            {PROTOCOL_STEPS.map((step, i) => (
              <div key={i} style={s.card}>
                <div style={{ marginBottom: 16 }}>{step.icon}</div>
                <h3 style={s.cardTitle}>{step.title}</h3>
                <p style={s.cardBody}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Controls status table */}
        <section style={s.section}>
          <h2 style={s.h2}>Security Controls Status</h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Control</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {CONTROLS.map((c, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                    <td style={s.td}>{c.label}</td>
                    <td style={s.td}>
                      <span style={c.status === "active" ? s.statusActive : c.status === "planned" ? s.statusPlanned : s.statusRoadmap}>
                        {c.status === "active" ? "✓ Active" : c.status === "planned" ? "⏳ Planned" : "📋 Roadmap"}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: "#71717a", fontSize: "0.82rem" }}>{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Data flow */}
        <section style={s.section}>
          <h2 style={s.h2}>Data Flow Architecture</h2>
          <pre style={s.dataFlow}>{DATA_FLOW}</pre>
          <p style={{ marginTop: 16, fontSize: "0.9rem", color: "#71717a", lineHeight: 1.6 }}>
            Every request is stateless. Solicitation content enters the processing layer and is never written to disk or logged. The only persistent data is your account email and anonymized usage telemetry.
          </p>
        </section>

        {/* Subprocessors */}
        <section style={s.section}>
          <h2 style={s.h2}>Sub-processors</h2>
          <p style={{ marginBottom: 20, fontSize: "0.9rem", color: "#71717a" }}>
            BidSmith uses the following third-party processors. No solicitation content or PII is shared with any subprocessor except as described.
          </p>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Vendor</th>
                  <th style={s.th}>Purpose</th>
                  <th style={s.th}>Location</th>
                  <th style={s.th}>Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map((sp, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                    <td style={{ ...s.td, fontWeight: 600, color: "#f4f4f5" }}>{sp.name}</td>
                    <td style={{ ...s.td, fontSize: "0.85rem" }}>{sp.purpose}</td>
                    <td style={{ ...s.td, fontSize: "0.85rem" }}>{sp.location}</td>
                    <td style={s.td}>
                      <a href={sp.link} target="_blank" rel="noopener noreferrer" style={s.extLink}>
                        View <ExternalLink size={10} style={{ marginLeft: 4 }} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Incident response */}
        <section style={{ ...s.section, ...s.incidentBox }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 700, color: "#f4f4f5" }}>Incident Response</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#a1a1aa", lineHeight: 1.6 }}>
                Security incidents are triaged within <strong>4 hours</strong> of discovery. Affected users are notified within <strong>24 hours</strong>. Critical vulnerabilities receive a patch within <strong>72 hours</strong>. Report security issues to{" "}
                <a href="mailto:security@bidsmith.pro" style={s.extLink}>security@bidsmith.pro</a> or via{" "}
                <a href="/.well-known/security.txt" style={s.extLink}>security.txt</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Compliance roadmap */}
        <section style={s.section}>
          <h2 style={s.h2}>Compliance Roadmap</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { q: "Q2 2026", label: "Penetration Test", status: "active" },
              { q: "Q3 2026", label: "SOC 2 Type I Audit", status: "active" },
              { q: "Q4 2026", label: "SOC 2 Type II Observation Begins", status: "planned" },
              { q: "Q3 2027", label: "SOC 2 Type II Certification", status: "roadmap" },
              { q: "TBD", label: "NIST 800-171 Rev 2 Self-Assessment", status: "roadmap" },
            ].map((item, i) => (
              <div key={i} style={s.roadmapRow}>
                <span style={s.roadmapQ}>{item.q}</span>
                <CheckCircle2 size={16} color={item.status === "active" ? "#00FFC2" : item.status === "planned" ? "#818cf8" : "#3f3f46"} />
                <span style={{ fontSize: "0.95rem", color: "#d4d4d8" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: "center", padding: "40px 0", borderTop: "1px solid #1a1a1a" }}>
          <p style={{ fontSize: "0.95rem", color: "#71717a", marginBottom: 20 }}>
            Have specific compliance requirements? We'll provide documentation for your security review.
          </p>
          <a
            href="mailto:sid@bidsmith.pro?subject=Security%20Review%20Request"
            style={s.whitepaperBtn}
          >
            Contact Security Team
          </a>
        </section>

      </main>

      <footer style={s.footer}>
        <span>BIDSMITH SECURITY PROTOCOL v1.0 · STATELESS BRIDGE ARCHITECTURE</span>
        <span>AES-256-GCM · TLS 1.2+ · SOC 2 IN PROGRESS</span>
      </footer>
    </div>
  );
};

export default Security;

const s = {
  page: { backgroundColor: "#09090b", color: "#a1a1aa", minHeight: "100vh", fontFamily: "Inter, sans-serif" },
  main: { maxWidth: 960, margin: "0 auto", padding: "80px 24px 40px" },
  hero: { textAlign: "center", marginBottom: 80 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
    background: "#1e1b4b", border: "1px solid #312e81", borderRadius: 999, marginBottom: 24,
    fontSize: "0.65rem", fontWeight: 800, color: "#818cf8", letterSpacing: "0.1em",
  },
  h1: { fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 800, color: "#f4f4f5", margin: "0 0 20px", letterSpacing: "-0.02em" },
  heroSub: { fontSize: "1.05rem", color: "#71717a", maxWidth: 640, margin: "0 auto 28px", lineHeight: 1.6 },
  whitepaperBtn: {
    display: "inline-block", padding: "12px 28px", background: "#f4f4f5",
    color: "#09090b", borderRadius: 8, fontSize: "0.9rem", fontWeight: 700, textDecoration: "none",
  },
  section: { marginBottom: 64 },
  h2: { fontSize: "1.3rem", fontWeight: 700, color: "#f4f4f5", margin: "0 0 24px" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 },
  card: { padding: 28, background: "#0c0c0e", border: "1px solid #1a1a1a", borderRadius: 12 },
  cardTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#f4f4f5", margin: "0 0 10px" },
  cardBody: { fontSize: "0.85rem", color: "#71717a", lineHeight: 1.6, margin: 0 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" },
  th: { textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #27272a", color: "#52525b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" },
  td: { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#a1a1aa", verticalAlign: "middle" },
  rowEven: { background: "rgba(255,255,255,0.015)" },
  statusActive: { color: "#34d399", fontWeight: 700, fontSize: "0.8rem" },
  statusPlanned: { color: "#818cf8", fontWeight: 600, fontSize: "0.8rem" },
  statusRoadmap: { color: "#52525b", fontSize: "0.8rem" },
  dataFlow: {
    background: "#0c0c0e", border: "1px solid #27272a", borderRadius: 10,
    padding: 24, fontSize: "0.78rem", color: "#00FFC2", lineHeight: 1.6,
    overflowX: "auto", fontFamily: "monospace",
  },
  extLink: { color: "#818cf8", textDecoration: "none", display: "inline-flex", alignItems: "center" },
  incidentBox: {
    background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 12, padding: 24,
  },
  roadmapRow: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8 },
  roadmapQ: { fontSize: "0.75rem", fontWeight: 700, color: "#52525b", width: 70, flexShrink: 0, fontFamily: "monospace" },
  footer: {
    borderTop: "1px solid #1a1a1a", background: "#09090b",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 32px", fontSize: "0.65rem", color: "#3f3f46", flexWrap: "wrap", gap: 8,
  },
};
