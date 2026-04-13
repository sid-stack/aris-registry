import {
  Check, AlertTriangle, Zap, Loader2, Shield,
  Search, Star, Link2, Play
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import FaqSection from "../components/FaqSection";
import "./Landing.css";
import DemoSection from "../components/DemoSection";
import { WORKSPACE_PATH } from "../lib/routes";

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

// ─── Deep Dive tab data ───────────────────────────────────────────────────────
const CALENDLY_URL = "https://calendly.com/bidsmith";

const DEEP_DIVE_TABS = [
  {
    id: "matrix",
    label: "Compliance Matrix",
    headline: "Automated Compliance Matrix",
    body: "Upload any federal solicitation and BidSmith instantly parses every FAR/DFARS clause. It flags missing certifications, conflicting requirements, and potential disqualification risks — giving your capture team a complete compliance roadmap before the first proposal draft.",
    preview: [
      { id: "REQ-01", text: "Contractor shall provide TS/SCI-cleared personnel on Day 1", ref: "L.2.1", status: "CAPTURED", danger: false },
      { id: "REQ-02", text: "CMMC Level 2 certification required — document in Technical Volume", ref: "M.3", status: "HIGH RISK", danger: true },
      { id: "REQ-03", text: "Three past performance references, $5M+, within 5 years", ref: "L.2.1", status: "CAPTURED", danger: false },
    ],
  },
  {
    id: "bidnobid",
    label: "Bid/No-Bid Engine",
    headline: "Go/No-Go Decision in Minutes",
    body: "Surfaces an estimated fit score against evaluation criteria, set-aside type, incumbency language, and past-performance requirements. The output is decision support with a structured rationale — your leadership still owns the go/no-go.",
    verdict: {
      rec: "BID",
      prob: 73,
      rationale: "Technical requirements match your demonstrated capabilities. Evaluation is Best Value, Technical-Led. CMMC Level 2 requirement creates a barrier most challengers can't meet quickly.",
      signals: ["Strong NAICS alignment", "No incumbent language detected", "Best Value — Technical-Led evaluation", "Set-aside: Total Small Business"],
    },
  },
  {
    id: "samgov",
    label: "SAM.gov Integration",
    headline: "SAM.gov Native Integration",
    body: "Paste any SAM.gov notice ID or URL. BidSmith retrieves the full opportunity — attachments, amendments, and all — and audits it automatically. No manual downloads. No copy-paste.",
    steps: [
      "Paste SAM.gov notice ID or full URL",
      "BidSmith fetches solicitation + all attachments",
      "Amendments detected and flagged automatically",
      "Full audit triggered in under 90 seconds",
    ],
  },
  {
    id: "search",
    label: "Opportunity Search",
    headline: "Federal Opportunity Search",
    body: "Search active solicitations and award history across all federal agencies by keyword, NAICS code, or agency. Surfaces opportunities your pipeline hasn't found yet.",
    filters: ["NAICS 541512 — Computer Systems", "Agency: Army Corps of Engineers", "Set-aside: Small Business", "Value: $1M–$25M"],
  },
];

// ─── Customer Stories (anonymized composites — no fictitious named customers) ──
const STORIES = [
  {
    tag: "COMPOSITE · DEFENSE SERVICES",
    headline: "Same-day structured pass instead of a multi-day manual shred",
    body: "Representative workflow: a services prime runs every new SAM notice through BidSmith before staffing capture hours.",
    story: {
      challenge: "First-pass review meant senior leads reading hundreds of pages of Section L/M and attachments before the team could align on scope and risk — often 1–3 business days per opportunity.",
      solution: "Paste the SAM.gov URL (or upload PDF). BidSmith returns a compliance-oriented requirement list, risk highlights, and a bid/no-bid recommendation with rationale in about 90 seconds — then humans refine.",
      result: "The team moves to color-team decisions with a shared artifact on day one instead of losing the week to parallel manual notes. (Figures anonymized; outcomes vary by solicitation complexity.)",
    },
  },
  {
    tag: "COMPOSITE · IT SERVICES",
    headline: "Disqualifiers and set-aside fit before proposal staffing",
    body: "Representative workflow: BD gates pursuits once structured signals are visible, not after weeks of draft effort.",
    story: {
      challenge: "Low-probability pursuits consumed the same proposal hours as winnable ones; set-aside and evaluation mismatches surfaced late.",
      solution: "Bid/no-bid output and requirement risk tags are generated on the same run as the matrix so capture can defend a no-bid early with a paper trail.",
      result: "Fewer staffed losses on unwinnable shapes; more calendar for pursuits that match certifications and past performance. (Anonymized composite — your metrics depend on pipeline discipline.)",
    },
  },
  {
    tag: "COMPOSITE · SMALL BUSINESS",
    headline: "Shared requirement list from one upload — less PDF archaeology",
    body: "Representative workflow: a small GovCon shop replaces ad-hoc screenshots with one structured starting point.",
    story: {
      challenge: "Kickoff meetings burned time hunting clauses across PDFs; version control across teammates was messy.",
      solution: "One upload or link produces a single structured baseline the whole team references — still human-reviewed before submission.",
      result: "Internal alignment meetings start with the same requirement rows instead of re-reading attachments cold. (Composite; time savings vary by team size and RFP volume.)",
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Landing({
  onEnterApp,
  onEnterDashboard,
  onViewSample,
  onAnalyze,
  onAnalyzeFile,
  onGoHome,
  isAuthenticated = false,
  userEmail = "",
}) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [heroVideoError, setHeroVideoError] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("matrix");
  const [expandedStory, setExpandedStory] = useState(null);
  const fileInputRef = useRef();
  const userHandle = userEmail ? userEmail.split("@")[0] : "";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const tab = DEEP_DIVE_TABS.find(t => t.id === activeTab);

  return (
    <>
    <main className="landing-root" style={{ background: C.mintCream, color: C.textPrimary, fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", width: "100%", overflowX: "hidden" }}>
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf" onChange={handleFileChange} />

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header style={S.navbar}>
        <div style={S.navInner}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }} onClick={onGoHome}>
            <img src="/logo.jpg" alt="BidSmith" style={{ height: 28, borderRadius: 4 }} />
            <span style={S.navLogo}>BidSmith</span>
          </div>

          {/* Nav links — desktop only */}
          {!isMobile && (
            <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <a href="/pricing" style={S.navLink} className="landing-nav-link-item">Pricing</a>
              <button style={S.navLink} className="landing-nav-link-item" onClick={() => onViewSample?.()}>Demo</button>
              <a href="/resources" style={S.navLink} className="landing-nav-link-item">Resources</a>
              <a href="/newsletter" style={S.navLink} className="landing-nav-link-item">Newsletter</a>
              <a href="/traffic-brief" style={S.navLink} className="landing-nav-link-item">Traffic Brief</a>
              <a href="https://arislabs.mintlify.app/" target="_blank" rel="noopener noreferrer" style={S.navLink} className="landing-nav-link-item">Docs</a>
            </nav>
          )}

          {/* Auth CTAs */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button type="button" style={S.navSignIn} onClick={() => (isAuthenticated ? onEnterDashboard?.() : onEnterApp?.("nav_signin"))}>
              {isAuthenticated ? `Hi, ${userHandle || "there"}` : "Sign In"}
            </button>
            {!isMobile && (
              <button
                className="btn-nav-meeting"
                style={S.navCta}
                onClick={() => (isAuthenticated ? onEnterDashboard?.() : window.open(CALENDLY_URL, "_blank", "noopener"))}
              >
                {isAuthenticated ? "Dashboard" : "Book a Meeting"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.badge}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Decision support · Small and growing GovCon
          </div>

          <h1 style={S.h1}>
            A faster first read on federal pursuits.<br />
            <span style={{ color: C.navyMid }}>Bid/no-bid guidance you can defend.</span>
          </h1>

          <p style={S.heroSub}>
            Paste a SAM.gov URL or upload a PDF — get a structured compliance-oriented pass, risk flags, and a bid/no-bid recommendation with rationale in minutes. Built for teams that cannot afford to misread Section L/M. We do not guarantee awards; we compress the first-pass grind so you decide with eyes open.
          </p>

          <div style={S.heroCtas}>
            <button
              className="btn-land-primary"
              style={S.ctaPrimary}
              type="button"
              onClick={() => onEnterDashboard?.()}
            >
              Start your free audit →
            </button>
            <button
              className="btn-land-secondary"
              style={{ ...S.ctaSecondary, display: "inline-flex", alignItems: "center", gap: 8, borderColor: C.navyMid, color: C.navyMid }}
              type="button"
              onClick={() => onViewSample?.()}
            >
              <Play size={15} fill={C.navyMid} strokeWidth={0} aria-hidden />
              Watch live demo
            </button>
            <button
              className="btn-meeting"
              type="button"
              style={{ ...S.ctaPrimary, padding: "14px 28px" }}
              onClick={() => window.open(CALENDLY_URL, "_blank", "noopener")}
            >
              Book a meeting
            </button>
            {isAuthenticated && (
              <button className="btn-land-secondary" type="button" style={S.ctaSecondary} onClick={() => onEnterApp?.("hero_run_audit")}>
                Run new audit
              </button>
            )}
          </div>

          <div style={S.trustBar}>
            {["No credit card required", "Fair-use limits (guest by IP)", "3/mo when signed in", "Audit history when signed in"].map(t => (
              <div key={t} style={S.trustItem}>
                <Check size={13} color={C.frostedBlue} strokeWidth={2.5} />
                {t}
              </div>
            ))}
          </div>

          {/* Hero video */}
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
              {heroVideoError ? (
                <div style={{
                  position: "relative", background: "#001529", aspectRatio: "16/9",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
                }}>
                  <img
                    src="/assets/demo/video-poster.png"
                    alt="BidSmith audit workspace preview"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: C.paleSky, marginBottom: 16, fontWeight: 600 }}>
                      Live demo available inside the app
                    </p>
                    <button
                      className="btn-land-primary"
                      onClick={() => onEnterApp?.("hero_demo_fallback_cta")}
                      style={{ ...S.ctaPrimary, background: C.frostedBlue, color: C.navy }}
                    >
                      Open Audit Engine
                    </button>
                  </div>
                </div>
              ) : (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/assets/demo/video-poster.png"
                  aria-label="BidSmith product demo: federal RFP audit workflow"
                  style={{ width: "100%", display: "block", maxHeight: 460, objectFit: "cover" }}
                  onError={() => setHeroVideoError(true)}
                >
                  <source src="/assets/demo/aris-demo.mp4" type="video/mp4" />
                  <source src="/aris-demo.mp4" type="video/mp4" />
                </video>
              )}
            </div>
          </div>

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

      {/* ── Live Demo Section ────────────────────────────────────────────────── */}
      <DemoSection onTryDemo={() => onViewSample?.()} />

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

      {/* ── Why BidSmith — 4 Feature Cards ───────────────────────────────────── */}
      <section id="features" style={{ background: C.white, padding: "100px 24px" }}>
        <div style={S.container}>
          <p style={S.eyebrow}>WHY BIDSMITH</p>
          <h2 style={S.h2}>Everything You Need to Dominate Federal Bids</h2>
          <div style={S.featureGrid}>
            {[
              {
                icon: <Shield size={24} color={C.navyMid} />,
                title: "Compliance Matrix Generation",
                desc: "Parses every FAR/DFARS clause in your solicitation. Flags missing certifications, conflicting requirements, and disqualification risks before you write a single word of proposal.",
              },
              {
                icon: <Zap size={24} color={C.navyMid} />,
                title: "Bid/No-Bid Scoring",
                desc: "Scores win probability against evaluation criteria, set-aside type, incumbency signals, and past performance requirements. Go/no-go in minutes.",
              },
              {
                icon: <Link2 size={24} color={C.navyMid} />,
                title: "SAM.gov Native Integration",
                desc: "Paste any SAM.gov notice ID or URL. BidSmith retrieves the full opportunity — attachments, amendments, and all — and audits it automatically.",
              },
              {
                icon: <Search size={24} color={C.navyMid} />,
                title: "Federal Opportunity Search",
                desc: "Search active solicitations and award history across all federal agencies by keyword, NAICS code, or agency. Surfaces opportunities your pipeline hasn't found yet.",
              },
            ].map(f => (
              <div key={f.title} className="landing-feature-card" style={S.featureCard}>
                <div style={S.featureIcon}>{f.icon}</div>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deep Dive Tabs ────────────────────────────────────────────────────── */}
      <section id="workflow" style={{ background: C.mintCream, padding: "100px 24px", borderTop: `1px solid ${C.paleSky}` }}>
        <div style={S.container}>
          <p style={S.eyebrow}>DEEP DIVE</p>
          <h2 style={S.h2}>See How BidSmith Works</h2>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 40, marginBottom: 40 }}>
            {DEEP_DIVE_TABS.map(t => (
              <button
                key={t.id}
                className="landing-tab-btn"
                data-active={activeTab === t.id ? "true" : "false"}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "10px 20px", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: `1.5px solid ${activeTab === t.id ? C.navyMid : C.paleSky}`,
                  background: activeTab === t.id ? C.navy : C.white,
                  color: activeTab === t.id ? "#fff" : C.dimGrey,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 40, alignItems: "start" }}>
            {/* Left: text */}
            <div>
              <h3 style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 900, color: C.navy, marginBottom: 16, lineHeight: 1.25 }}>
                {tab.headline}
              </h3>
              <p style={{ fontSize: 15, color: C.dimGrey, lineHeight: 1.75, marginBottom: 28 }}>{tab.body}</p>
              <button className="btn-land-primary" style={S.ctaPrimary} onClick={() => onEnterApp?.(`deepdive_${activeTab}_cta`)}>
                Try It Free
              </button>
            </div>

            {/* Right: visual preview */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.paleSky}`, overflow: "hidden", boxShadow: "0 20px 60px -12px rgba(0,34,68,0.08)" }}>
              {/* chrome bar */}
              <div style={{ background: C.navy, padding: "12px 16px", display: "flex", gap: 6, alignItems: "center" }}>
                {["#ff5f56","#ffbd2e","#27c93f"].map(c => (
                  <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
                ))}
                <span style={{ marginLeft: 10, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em" }}>
                  BIDSMITH — {tab.label.toUpperCase()}
                </span>
              </div>

              {/* Compliance Matrix preview */}
              {activeTab === "matrix" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 80px 100px", padding: "10px 16px", background: "#f8fafc", borderBottom: `1px solid ${C.paleSky}`, fontSize: 10, fontWeight: 800, color: C.ashGrey, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <span>ID</span><span>Requirement</span><span>Section</span><span>Status</span>
                  </div>
                  {tab.preview.map((r, i) => (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: "72px 1fr 80px 100px", padding: "14px 16px", borderBottom: i < tab.preview.length - 1 ? `1px solid ${C.paleSky}` : "none", fontSize: 12, alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: C.ashGrey }}>{r.id}</span>
                      <span style={{ color: C.textPrimary, lineHeight: 1.45, paddingRight: 12, fontSize: 11 }}>{r.text}</span>
                      <span style={{ fontWeight: 700, color: C.navyMid, fontSize: 11 }}>{r.ref}</span>
                      <span style={{ background: r.danger ? "#fee2e2" : "#dcfce7", color: r.danger ? C.danger : C.success, padding: "3px 8px", borderRadius: 99, fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4, width: "fit-content" }}>
                        {r.danger ? <AlertTriangle size={8} /> : <Check size={8} />}
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bid/No-Bid preview */}
              {activeTab === "bidnobid" && (
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 16, background: "#f0fdf4", borderRadius: 10, border: "1px solid #86efac" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: C.success }}>BID</div>
                    <div>
                      <div style={{ fontSize: 11, color: C.ashGrey, fontWeight: 700, marginBottom: 4 }}>WIN PROBABILITY</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: C.success }}>{tab.verdict.prob}%</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: C.dimGrey, lineHeight: 1.65, marginBottom: 14 }}>{tab.verdict.rationale}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {tab.verdict.signals.map(s => (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textPrimary }}>
                        <Check size={12} color={C.success} />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SAM.gov integration preview */}
              {activeTab === "samgov" && (
                <div style={{ padding: 20 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 8, border: `1px solid ${C.paleSky}`, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <Link2 size={14} color={C.navyMid} />
                    <span style={{ fontSize: 11, color: C.dimGrey, fontFamily: "monospace" }}>
                      sam.gov/opp/W912EE-26-R-0042/view
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {tab.steps.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 12, color: C.textPrimary, lineHeight: 1.5, paddingTop: 3 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunity Search preview */}
              {activeTab === "search" && (
                <div style={{ padding: 20 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 8, border: `1px solid ${C.paleSky}`, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <Search size={13} color={C.ashGrey} />
                    <span style={{ fontSize: 12, color: C.ashGrey }}>Search federal opportunities...</span>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.ashGrey, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Active Filters</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {tab.filters.map(f => (
                      <span key={f} style={{ fontSize: 11, color: C.navyMid, background: C.mintCream, border: `1px solid ${C.paleSky}`, borderRadius: 6, padding: "5px 10px", fontWeight: 600 }}>{f}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: 14, background: C.mintCream, borderRadius: 8, border: `1px solid ${C.paleSky}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.navy, marginBottom: 4 }}>14 matching opportunities found</div>
                    <div style={{ fontSize: 11, color: C.dimGrey }}>Sorted by response deadline · Updated 4 min ago</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics Strip ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.navy, padding: "70px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ ...S.eyebrow, color: C.frostedBlue, marginBottom: 48 }}>THE NUMBERS BEHIND THE CONFIDENCE</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, textAlign: "center" }}>
            {[
              { stat: "90s", label: "Average audit time" },
              { stat: "40hrs", label: "Saved per RFP review" },
              { stat: "$0", label: "To start auditing" },
              { stat: "100%", label: "FAR/DFARS clause coverage" },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <div style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 900, color: C.frostedBlue, lineHeight: 1 }}>
                  {stat}
                </div>
                <div style={{ fontSize: 13, color: C.ashGrey, marginTop: 10, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials (anonymous, role-specific — no fictitious names) ─────── */}
      <section style={{ background: C.white, padding: "100px 24px", borderTop: `1px solid ${C.paleSky}` }}>
        <div style={S.container}>
          <p style={S.eyebrow}>WHAT OPERATORS SAY</p>
          <h2 style={S.h2}>Anonymous feedback from GovCon teams.</h2>
          <p style={{ fontSize: 13, color: C.ashGrey, maxWidth: 640, margin: "12px 0 0", lineHeight: 1.55 }}>
            Roles and company types are real categories we hear from; names and employers are withheld. Metrics below are tied to what BidSmith actually produces on each run—not revenue or win-rate promises.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginTop: 40 }}>
            {[
              {
                id: "bd-lead",
                badge: "BD",
                quote: "We paste the SAM.gov URL on day one. The first structured pass—rows, risk tags, and a defendable bid/no-bid read—comes back in about a minute so we’re not burning a capture lead on a manual shred.",
                attribution: "BD lead · IT & professional services prime · ~150 employees",
                metric: "~90s to first structured audit output",
              },
              {
                id: "capture-mgr",
                badge: "CM",
                quote: "We still decide with humans in the loop—but disqualifiers and Section L/M pain points surface before we staff writers. That’s the difference between a disciplined no-bid and a three-week sunk cost.",
                attribution: "Capture manager · defense & national security SME · ~80 employees",
                metric: "Risk + requirement flags on the same run as the matrix",
              },
              {
                id: "proposal",
                badge: "PD",
                quote: "We write every narrative ourselves. BidSmith gives us a single requirement baseline from one PDF or link so kickoff isn’t 40 people re-reading attachments in parallel.",
                attribution: "Proposal lead · small business (8(a) track) · ~45 employees",
                metric: "One shared matrix from one upload or SAM link",
              },
            ].map(t => (
              <div key={t.id} style={{ background: C.mintCream, border: `1px solid ${C.paleSky}`, borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={C.navyMid} color={C.navyMid} />
                  ))}
                </div>
                <blockquote style={{ fontSize: 15, color: C.dimGrey, lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>
                  “{t.quote}”
                </blockquote>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.navyMid, background: C.white, border: `1px solid ${C.paleSky}`, borderRadius: 8, padding: "8px 12px", lineHeight: 1.45 }}>
                  {t.metric}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, letterSpacing: "-0.02em" }}>
                    {t.badge}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, lineHeight: 1.35 }}>{t.attribution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer Stories ──────────────────────────────────────────────────── */}
      <section style={{ background: C.mintCream, padding: "100px 24px", borderTop: `1px solid ${C.paleSky}` }}>
        <div style={S.container}>
          <p style={S.eyebrow}>WORKFLOW STORIES</p>
          <h2 style={S.h2}>How teams use BidSmith (anonymized composites)</h2>
          <p style={{ fontSize: 13, color: C.dimGrey, maxWidth: 720, margin: "12px 0 0", lineHeight: 1.55 }}>
            Illustrative workflows—not named case studies. Narratives describe typical patterns, not audited win-rate or revenue claims.
          </p>
          <div className="landing-story-grid">
            {STORIES.map(s => {
              const isOpen = expandedStory === s.tag;
              return (
                <div key={s.tag} className="landing-story-stack">
                  <article className={`landing-story-surface${isOpen ? " landing-story-surface--expanded" : ""}`}>
                    <span className="landing-story-pill">{s.tag}</span>
                    <h3 className="landing-story-title">{s.headline}</h3>
                    <p className="landing-story-lead">{s.body}</p>
                    <button
                      type="button"
                      className={`landing-story-expand${isOpen ? " landing-story-expand--open" : ""}`}
                      onClick={() => setExpandedStory(isOpen ? null : s.tag)}
                    >
                      {isOpen ? "Close story" : "Read the story"}
                    </button>
                  </article>

                  {isOpen && (
                    <div className="landing-story-detail">
                      {[
                        { label: "The Challenge", text: s.story.challenge },
                        { label: "The Solution", text: s.story.solution },
                        { label: "The Result", text: s.story.result },
                      ].map(({ label, text }) => (
                        <div key={label} className="landing-story-detail-block">
                          <p className="landing-story-detail-label">{label}</p>
                          <p className="landing-story-detail-body">{text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Before / After ───────────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: "100px 24px", borderTop: `1px solid ${C.paleSky}` }}>
        <div style={S.container}>
          <p style={S.eyebrow}>THE DIFFERENCE</p>
          <h2 style={S.h2}>Before and after an AI compliance workflow.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 48 }}>
            <div style={{ padding: 36, background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 16 }}>
              <AlertTriangle color={C.danger} size={28} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.danger, marginBottom: 12 }}>Without BidSmith</h3>
              {[
                "Manual requirement extraction from dense RFP sections",
                "One missed 'shall' can derail submission quality",
                "No shared audit record across capture and proposal teams",
                "Bid decisions made without structured rationale",
              ].map(p => (
                <div key={p} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.danger, fontWeight: 700, marginTop: 1 }}>✕</span>
                  <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 36, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 16 }}>
              <Zap color={C.success} size={28} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.success, marginBottom: 12 }}>With BidSmith</h3>
              {[
                "Structured matrix and risk flags in one 90-second run",
                "Decision rationale attached to every go/no-go recommendation",
                "All audits saved and reusable across your team",
                "Proposal starter draft generated from the same audit context",
              ].map(p => (
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
          <h2 style={S.h2}>What your audit output looks like.</h2>
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
            <button className="btn-land-primary" onClick={() => onEnterApp?.("matrix_preview_cta")} style={S.ctaPrimary}>
              Generate Compliance Matrix
            </button>
          </div>
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
            STOP LOSING BIDS TO COMPLIANCE GAPS
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#fff", marginBottom: 20, lineHeight: 1.15 }}>
            Join federal prime contractors who trust<br />BidSmith to audit every solicitation in 90 seconds.
          </h2>
          <p style={{ fontSize: 16, color: C.ashGrey, marginBottom: 44 }}>
            Start free — no credit card required.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn-meeting"
              type="button"
              onClick={() => window.open(CALENDLY_URL, "_blank", "noopener")}
              style={{ ...S.ctaPrimary, fontSize: "1.1rem", padding: "18px 52px", letterSpacing: "0.01em" }}
            >
              Book a Meeting
            </button>
            <button
              className="btn-land-secondary"
              type="button"
              onClick={() => onEnterDashboard?.()}
              style={{ ...S.ctaSecondary, borderColor: C.paleSky, color: C.paleSky, background: "transparent" }}
            >
              Start your free audit →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#001529", padding: "60px 24px 32px", borderTop: `1px solid rgba(196,215,242,0.1)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40 }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.frostedBlue, fontFamily: "'Playfair Display', serif", letterSpacing: "0.05em" }}>
              BidSmith
            </span>
            <p style={{ fontSize: 13, color: "#cbd5e1", marginTop: 8, maxWidth: 260, lineHeight: 1.6 }}>
              Federal RFP compliance audit software by ARIS Labs. Built for government contractors who want to win.
            </p>
          </div>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Product</p>
              {[["Open App", WORKSPACE_PATH], ["Pricing", "/pricing"], ["Resources", "/resources"], ["Docs", "https://arislabs.mintlify.app/"]].map(([label, href]) => (
                <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ display: "block", fontSize: 13, color: "#e2e8f0", marginBottom: 8, textDecoration: "none" }}>{label}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Company</p>
              {[["About", "/about"], ["Contact", "/contact"]].map(([label, href]) => (
                <a key={label} href={href} style={{ display: "block", fontSize: 13, color: "#e2e8f0", marginBottom: 8, textDecoration: "none" }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#cbd5e1" }}>© 2026 BidSmith · ARIS Labs. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 11, color: "#cbd5e1", textDecoration: "none" }}>{l}</a>
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

  navbar: { height: 64, background: "rgba(240,247,238,0.95)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${C.paleSky}`, position: "sticky", top: 0, zIndex: 100, width: "100%" },
  navInner: { maxWidth: 1200, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "0 24px" },
  navLogo: { fontSize: 20, fontWeight: 900, color: C.navy, fontFamily: "'Playfair Display', serif", letterSpacing: "0.02em", lineHeight: 1 },
  navLink: { fontSize: 14, color: C.dimGrey, background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "8px 14px", textDecoration: "none", display: "inline-block", borderRadius: 6, whiteSpace: "nowrap" },
  navSignIn: { fontSize: 14, color: C.navyMid, background: "none", border: `1.5px solid ${C.paleSky}`, cursor: "pointer", fontWeight: 700, padding: "8px 16px", borderRadius: 8, whiteSpace: "nowrap", transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)", WebkitTransition: "all 0.18s cubic-bezier(0.4,0,0.2,1)" },
  navCta: { background: C.navy, color: "#fff", padding: "9px 22px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" },

  hero: { background: `linear-gradient(180deg, ${C.white} 0%, ${C.mintCream} 100%)`, padding: "100px 24px 80px" },
  heroInner: { maxWidth: 860, margin: "0 auto", textAlign: "center" },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: C.navy, background: C.mintCream, border: `1px solid ${C.frostedBlue}`, padding: "6px 16px", borderRadius: 99, marginBottom: 28, letterSpacing: "0.02em" },
  h1: { fontSize: "clamp(2.4rem, 6vw, 4rem)", fontWeight: 900, color: C.navy, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.03em" },
  heroSub: { fontSize: "1.12rem", color: C.dimGrey, lineHeight: 1.75, maxWidth: 700, margin: "0 auto 44px" },
  heroCtas: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 42 },
  trustBar: { display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 },
  trustItem: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.ashGrey, fontWeight: 600 },
  videoWrap: { maxWidth: 860, margin: "0 auto" },
  videoChrome: { borderRadius: 14, overflow: "hidden", border: `1px solid ${C.paleSky}`, boxShadow: "0 32px 80px -12px rgba(0,34,68,0.12)" },
  videoBar: { height: 36, background: C.mintCream, borderBottom: `1px solid ${C.paleSky}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" },
  terminal: { maxWidth: 560, margin: "32px auto 0", background: C.white, borderRadius: 12, border: `1px solid ${C.paleSky}`, overflow: "hidden", textAlign: "left" },
  termHead: { background: C.mintCream, padding: "10px 16px", fontSize: 11, fontWeight: 800, color: C.ashGrey, borderBottom: `1px solid ${C.paleSky}` },

  eyebrow: { fontSize: 11, fontWeight: 800, color: C.ashGrey, letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center", marginBottom: 16 },
  h2: { fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: C.navy, textAlign: "center", marginBottom: 16, lineHeight: 1.2 },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 52 },
  featureCard: { padding: 32, background: C.mintCream, borderRadius: 16, border: `1px solid ${C.paleSky}` },
  featureIcon: { width: 48, height: 48, background: C.white, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: `1px solid ${C.paleSky}` },
  featureTitle: { fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 10 },
  featureDesc: { fontSize: 14, color: C.dimGrey, lineHeight: 1.65 },

  ctaPrimary: { background: C.navy, color: "#fff", padding: "14px 32px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", boxShadow: "0 6px 18px rgba(0,34,68,0.18)", letterSpacing: "0.01em" },
  ctaSecondary: { background: "transparent", color: C.navy, padding: "14px 28px", borderRadius: 10, border: `1.5px solid ${C.paleSky}`, fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
};
