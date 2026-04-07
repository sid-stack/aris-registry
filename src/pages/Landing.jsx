import { Check, AlertTriangle, Zap, Loader2, Shield, FileText, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import FaqSection from "../components/FaqSection";
import "./Landing.css";
import PricingComparison from "../components/PricingComparison";

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  mintCream:   "#f0f7ee",
  paleSky:     "#c4d7f2",
  frostedBlue: "#afdedc",
  ashGrey:     "#91a8a4",
  dimGrey:     "#776871",
  navy:        "#002244",
  navyMid:     "#0B3D91",
  white:       "#ffffff",
  textPrimary: "#0f172a",
  textMuted:   "#91a8a4",
  danger:      "#dc2626",
  success:     "#16a34a",
};
const MVP_STRICT_MODE = (import.meta.env.VITE_MVP_STRICT_MODE ?? "true") !== "false";

export default function Landing({
  onEnterApp,
  onAnalyze,
  onAnalyzeFile,
  onGoHome,
}) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [heroVideoError, setHeroVideoError] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePlanClick = (plan) => {
    if (plan.buttonLink && (plan.buttonLink.startsWith("http") || plan.buttonLink.startsWith("mailto:"))) {
      window.location.href = plan.buttonLink;
    } else if (onEnterApp) {
      onEnterApp();
    }
  };

  const processWithLogs = (callback) => {
    setIsProcessing(true);
    setLogs(["[BIDSMITH] Initializing...", "[MERCURY2] Connecting to ingestion pipeline..."]);
    const mockLogs = [
      { ms: 1200, msg: "[BIDSMITH] Scanning document structure..." },
      { ms: 2800, msg: "[SHREDDER] Extracting 'shall/must' requirements..." },
      { ms: 4500, msg: "[RISK] Analyzing Section L compliance triggers..." },
      { ms: 6000, msg: "[BIDSMITH] Building requirements matrix..." },
      { ms: 7500, msg: "[OK] Analysis complete. Rendering workspace..." },
    ];
    mockLogs.forEach((log) => { setTimeout(() => setLogs((prev) => [...prev, log.msg]), log.ms); });
    setTimeout(() => { callback(); }, 8500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !onAnalyzeFile) return;
    processWithLogs(() => onAnalyzeFile(file));
  };

  const handleStartAnalysis = () => {
    if (!inputUrl.trim() || isProcessing || !onAnalyze) return;
    processWithLogs(() => onAnalyze(inputUrl.trim()));
  };

  return (
    <>
    <main style={{ background: C.mintCream, color: C.textPrimary, fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh" }}>
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf" onChange={handleFileChange} />

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header style={S.navbar}>
        <div style={S.navInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={onGoHome}>
            <img src="/logo.jpg" alt="BidSmith" style={{ height: 30, borderRadius: 4 }} />
            <span style={S.navLogo}>BidSmith</span>
          </div>

          <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!isMobile && !MVP_STRICT_MODE && (
              <>
                <a href="/pricing" style={S.navLink}>Pricing</a>
                <a href="https://arislabs.mintlify.app/" target="_blank" rel="noopener noreferrer" style={S.navLink}>Docs</a>
              </>
            )}
            <button style={S.navSignIn} onClick={onEnterApp}>Sign In</button>
            <button style={S.navCta} onClick={onEnterApp}>Get Started Free →</button>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={S.hero}>
        <div style={S.heroInner}>

          {/* Badge */}
          <div style={S.badge}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.frostedBlue, display: "inline-block" }} />
            AI for Federal Government Contracting
          </div>

          {/* Headline */}
          <h1 style={S.h1}>
            Win more RFPs.<br />
            <span style={{ color: C.navyMid }}>Waste less time.</span>
          </h1>

          <p style={S.heroSub}>
            BidSmith audits any SAM.gov solicitation in 90 seconds — instant compliance matrix,
            FAR/DFARS risk flags, and a bid/no-bid verdict before you spend a dollar on proposals.
          </p>

          {/* Primary CTA row */}
          <div style={S.heroCtas}>
            <button style={S.ctaPrimary} onClick={onEnterApp}>
              Start Free Audit →
            </button>
            <button
              style={S.ctaSecondary}
              onClick={onEnterApp}
            >
              Open Analyze Workspace
            </button>
          </div>

          {/* Trust bar */}
          <div style={S.trustBar}>
            {["No credit card required", "3 free audits/month", "FAR/DFARS coverage", "SAM.gov native"].map(t => (
              <div key={t} style={S.trustItem}>
                <Check size={13} color={C.frostedBlue} strokeWidth={2.5} />
                {t}
              </div>
            ))}
          </div>

          {/* Hero video */}
          {!heroVideoError && (
            <div style={S.videoWrap}>
              <div style={S.videoChrome}>
                <div style={S.videoBar}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#ff5f56","#ffbd2e","#27c93f"].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.ashGrey, letterSpacing: "0.06em" }}>
                    BIDSMITH AUDIT ENGINE — LIVE SESSION
                  </span>
                  <div style={{ width: 60 }} />
                </div>
                <video autoPlay muted loop playsInline
                  poster="/assets/demo/video-poster.png"
                  style={{ width: "100%", display: "block", maxHeight: 460, objectFit: "cover" }}
                  onError={() => setHeroVideoError(true)}
                >
                  <source src="/aris-demo.mp4" type="video/mp4" />
                  <source src="/assets/demo/aris-demo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          )}

          {/* Processing terminal */}
          {isProcessing && (
            <div style={S.terminal}>
              <div style={S.termHead}>BIDSMITH SECURE SESSION</div>
              <div style={{ padding: 20, minHeight: 140 }}>
                {logs.map((l, i) => <div key={i} style={{ fontSize: 12, color: C.navyMid, marginBottom: 6, fontFamily: "monospace" }}>{l}</div>)}
                <div style={{ fontSize: 12, color: C.ashGrey, fontFamily: "monospace" }}>
                  <Loader2 size={11} style={{ display: "inline", marginRight: 6 }} /> Working...
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SAM.gov Quick-Audit Bar ───────────────────────────────────────────── */}
      <section style={{ background: C.navy, padding: "28px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.frostedBlue, whiteSpace: "nowrap" }}>
            Quick audit:
          </span>
          <input
            type="text"
            placeholder="Paste SAM.gov opportunity URL..."
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleStartAnalysis()}
            style={{
              flex: 1, minWidth: 240, padding: "11px 16px", borderRadius: 8,
              border: `1px solid ${C.paleSky}`, fontSize: 14,
              background: "rgba(255,255,255,0.06)", color: "#fff",
              outline: "none",
            }}
          />
          <button onClick={handleStartAnalysis} style={{
            padding: "11px 24px", background: C.frostedBlue, color: C.navy,
            border: "none", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer",
            whiteSpace: "nowrap",
          }}>
            Audit Free
          </button>
          <button onClick={() => fileInputRef.current.click()} style={{
            padding: "11px 18px", background: "transparent", color: C.paleSky,
            border: `1px solid ${C.paleSky}`, borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
            whiteSpace: "nowrap",
          }}>
            Upload PDF
          </button>
        </div>
      </section>

      {/* ── Feature Grid ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "100px 24px" }}>
        <div style={S.container}>
          <p style={S.eyebrow}>WHAT BIDSMITH DOES</p>
          <h2 style={S.h2}>RFP to proposal starter.<br />In 90 seconds.</h2>
          <div style={S.featureGrid}>
            {[
              {
                icon: <Zap size={24} color={C.navyMid} />,
                title: "Fast Go / No-Go Signal",
                desc: "Get a decision with rationale before your team burns cycles on low-fit opportunities.",
              },
              {
                icon: <Shield size={24} color={C.navyMid} />,
                title: "Compliance Matrix",
                desc: "Every critical shall/must requirement is extracted and mapped so your team starts from a complete checklist.",
              },
              {
                icon: <FileText size={24} color={C.navyMid} />,
                title: "Proposal Starter Draft",
                desc: "Generate a first-pass structure and guidance so writers start with momentum, not a blank page.",
              },
              {
                icon: <TrendingUp size={24} color={C.navyMid} />,
                title: "Risk-First Prioritization",
                desc: "Surface disqualifiers and high-risk requirements early so your team can focus effort where it matters.",
              },
            ].map(f => (
              <div key={f.title} style={S.featureCard}>
                <div style={S.featureIcon}>{f.icon}</div>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain vs Solution ─────────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "100px 24px", borderTop: `1px solid ${C.paleSky}` }}>
        <div style={S.container}>
          <p style={S.eyebrow}>THE DIFFERENCE</p>
          <h2 style={S.h2}>Before and after BidSmith.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 48 }}>
            <div style={{ padding: 36, background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 16 }}>
              <AlertTriangle color={C.danger} size={28} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.danger, marginBottom: 12 }}>Without BidSmith</h3>
              {["18–40 hours of manual review per RFP", "One missed 'shall' disqualifies your entire bid", "$5,000–$15,000 per consultant engagement", "Gut-feel bid decisions with no data backing"].map(p => (
                <div key={p} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.danger, fontWeight: 700, marginTop: 1 }}>✕</span>
                  <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 36, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 16 }}>
              <Zap color={C.success} size={28} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.success, marginBottom: 12 }}>With BidSmith</h3>
              {["Compliance matrix in 90 seconds flat", "Every FAR/DFARS clause captured and risk-scored", "Starts at $0 — 3 free audits per month", "Win probability backed by evaluation data"].map(p => (
                <div key={p} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <Check size={14} color={C.success} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance Matrix Preview ─────────────────────────────────────────── */}
      <section style={{ background: C.mintCream, padding: "100px 24px", borderTop: `1px solid ${C.paleSky}` }}>
        <div style={S.container}>
          <p style={S.eyebrow}>SAMPLE OUTPUT</p>
          <h2 style={S.h2}>What your audit report looks like.</h2>
          <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.paleSky}`, marginTop: 48, boxShadow: "0 20px 60px -12px rgba(0,34,68,0.1)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 140px", padding: "14px 24px", background: C.navy, color: "#fff", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span>ID</span><span>Requirement</span><span>Section</span><span>Status</span>
            </div>
            {[
              { id: "REQ-01", text: "Contractor shall provide personnel with active TS/SCI clearances on Day 1", ref: "L.2.1", status: "CAPTURED", danger: false },
              { id: "REQ-02", text: "CMMC Level 2 certification required — must be documented in Technical Volume", ref: "M.3", status: "HIGH RISK", danger: true },
              { id: "REQ-03", text: "Three past performance references, $5M+ contract value, within 5 years", ref: "L.2.1", status: "CAPTURED", danger: false },
            ].map((r, i) => (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 140px", padding: "18px 24px", borderBottom: i < 2 ? `1px solid ${C.paleSky}` : "none", fontSize: 13, alignItems: "center", background: C.white }}>
                <span style={{ fontWeight: 700, color: C.ashGrey }}>{r.id}</span>
                <span style={{ color: C.textPrimary, lineHeight: 1.5, paddingRight: 32 }}>{r.text}</span>
                <span style={{ fontWeight: 700, color: C.navyMid }}>{r.ref}</span>
                <span style={{
                  background: r.danger ? C.danger : C.success,
                  color: "#fff", padding: "4px 12px", borderRadius: 99,
                  fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 5, width: "fit-content"
                }}>
                  {r.danger ? <AlertTriangle size={10} /> : <Check size={10} />}
                  {r.status}
                </span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button onClick={onEnterApp} style={S.ctaPrimary}>Generate My Compliance Matrix →</button>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: C.white, padding: "100px 24px", borderTop: `1px solid ${C.paleSky}` }}>
        <div style={S.container}>
          <p style={S.eyebrow}>PRICING</p>
          <h2 style={S.h2}>Start free. Scale when you win.</h2>
          <p style={{ textAlign: "center", color: C.ashGrey, fontSize: 16, marginBottom: 56 }}>
            A compliance consultant costs $15,000/year. BidSmith starts at $0.
          </p>
          <PricingComparison onPlanClick={handlePlanClick} />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <div style={{ background: C.mintCream, borderTop: `1px solid ${C.paleSky}` }}>
        <FaqSection />
      </div>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{ background: C.navy, padding: "120px 24px", textAlign: "center" }}>
        <div style={S.container}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.frostedBlue, letterSpacing: "0.15em", marginBottom: 20, textTransform: "uppercase" }}>
            READY TO WIN MORE?
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#fff", marginBottom: 40, lineHeight: 1.15 }}>
            Know if you should bid —<br />in 90 seconds.
          </h2>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onEnterApp} style={{ ...S.ctaPrimary, background: C.frostedBlue, color: C.navy, fontSize: "1.1rem", padding: "18px 48px" }}>
              Start Free Audit →
            </button>
            <button onClick={onEnterApp} style={{ ...S.ctaSecondary, borderColor: C.paleSky, color: C.paleSky, background: "transparent" }}>
              Go to Analyze Flow
            </button>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: C.ashGrey }}>
            No credit card required · 3 free audits/month · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#001529", padding: "60px 24px 32px", borderTop: `1px solid rgba(196,215,242,0.1)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40 }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.frostedBlue, fontFamily: "'Playfair Display', serif", letterSpacing: "0.05em" }}>
              BidSmith
            </span>
            <p style={{ fontSize: 13, color: C.ashGrey, marginTop: 8, maxWidth: 260, lineHeight: 1.6 }}>
              Federal RFP compliance audit software by ARIS Labs. Built for government contractors who want to win.
            </p>
          </div>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: C.ashGrey, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Product</p>
              {(MVP_STRICT_MODE
                ? [["Open App", "/app"]]
                : [["Pricing", "/pricing"], ["Docs", "https://arislabs.mintlify.app/"]]
              ).map(([label, href]) => (
                href
                  ? <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ display: "block", fontSize: 13, color: C.dimGrey, marginBottom: 8, textDecoration: "none" }}>{label}</a>
                  : null
              ))}
            </div>
            {!MVP_STRICT_MODE && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.ashGrey, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Company</p>
                {[["About", "/about"], ["Contact", "/contact"], ["Earn 20%", "/earn"], ["Newsletter", "/newsletter"]].map(([label, href]) => (
                  <a key={label} href={href} style={{ display: "block", fontSize: 13, color: C.dimGrey, marginBottom: 8, textDecoration: "none" }}>{label}</a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 11, color: C.dimGrey }}>© 2026 BidSmith · ARIS Labs. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 11, color: C.dimGrey, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>

    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  container: { maxWidth: 1100, margin: "0 auto", padding: "0 20px" },

  // Nav
  navbar: { height: 68, background: "rgba(240,247,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.paleSky}`, position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" },
  navLogo: { fontSize: 22, fontWeight: 900, color: C.navy, fontFamily: "'Playfair Display', serif", letterSpacing: "0.02em" },
  navLink: { fontSize: 14, color: C.dimGrey, background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "8px 12px", textDecoration: "none", display: "inline-block" },
  navSignIn: { fontSize: 14, color: C.navyMid, background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "8px 14px" },
  navCta: { background: C.navy, color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 },

  // Hero
  hero: { background: C.white, padding: "96px 24px 80px" },
  heroInner: { maxWidth: 900, margin: "0 auto", textAlign: "center" },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: C.navy, background: C.mintCream, border: `1px solid ${C.frostedBlue}`, padding: "6px 16px", borderRadius: 99, marginBottom: 28, letterSpacing: "0.02em" },
  h1: { fontSize: "clamp(2.4rem, 6vw, 4rem)", fontWeight: 900, color: C.navy, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.03em" },
  heroSub: { fontSize: "1.15rem", color: C.dimGrey, lineHeight: 1.7, maxWidth: 680, margin: "0 auto 40px" },
  heroCtas: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 },
  trustBar: { display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 },
  trustItem: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.ashGrey, fontWeight: 600 },
  videoWrap: { maxWidth: 860, margin: "0 auto" },
  videoChrome: { borderRadius: 14, overflow: "hidden", border: `1px solid ${C.paleSky}`, boxShadow: "0 32px 80px -12px rgba(0,34,68,0.12)" },
  videoBar: { height: 36, background: C.mintCream, borderBottom: `1px solid ${C.paleSky}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" },
  terminal: { maxWidth: 560, margin: "32px auto 0", background: C.white, borderRadius: 12, border: `1px solid ${C.paleSky}`, overflow: "hidden", textAlign: "left" },
  termHead: { background: C.mintCream, padding: "10px 16px", fontSize: 11, fontWeight: 800, color: C.ashGrey, borderBottom: `1px solid ${C.paleSky}` },

  // Sections
  eyebrow: { fontSize: 11, fontWeight: 800, color: C.ashGrey, letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center", marginBottom: 16 },
  h2: { fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: C.navy, textAlign: "center", marginBottom: 16, lineHeight: 1.2 },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 56 },
  featureCard: { padding: 32, background: C.mintCream, borderRadius: 16, border: `1px solid ${C.paleSky}` },
  featureIcon: { width: 48, height: 48, background: C.white, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${C.paleSky}` },
  featureTitle: { fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 10 },
  featureDesc: { fontSize: 14, color: C.dimGrey, lineHeight: 1.65 },

  // Buttons
  ctaPrimary: { background: C.navy, color: "#fff", padding: "14px 32px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", boxShadow: "0 8px 20px rgba(0,34,68,0.18)", transition: "opacity 0.15s" },
  ctaSecondary: { background: "transparent", color: C.navy, padding: "14px 28px", borderRadius: 10, border: `1.5px solid ${C.paleSky}`, fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
};
