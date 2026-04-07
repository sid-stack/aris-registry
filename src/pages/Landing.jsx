import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowRight, Search, Brain, FileText, Bell, BarChart3, Users } from "lucide-react";

const BG = "#10182a";
const PANEL = "#141d31";
const BORDER = "#28324a";
const PRIMARY = "#f8f9ff";
const PRIMARY_TEXT = "#10182a";
const TEXT = "#f5f7ff";
const MUTED = "#a1acc2";

const features = [
  {
    icon: Search,
    title: "Smart Contract Discovery",
    description: "AI scans opportunities and surfaces the solicitations that actually match your profile.",
  },
  {
    icon: Brain,
    title: "AI Opportunity Scoring",
    description: "Prioritize bids with a go/no-go recommendation and rationale before writers spend hours.",
  },
  {
    icon: FileText,
    title: "Compliance Matrix",
    description: "Extract critical requirements into a structured matrix so teams stop missing mandatory clauses.",
  },
  {
    icon: Bell,
    title: "Risk Alerts",
    description: "Catch disqualifiers and deadline pressure early so you can act before it is too late.",
  },
  {
    icon: BarChart3,
    title: "Proposal Starter",
    description: "Generate a section-by-section starter draft to accelerate kickoff and first pass writing.",
  },
  {
    icon: Users,
    title: "Team Alignment",
    description: "Give capture, proposal, and leadership one shared audit narrative from day one.",
  },
];

const steps = [
  {
    step: "01",
    title: "Paste a SAM.gov link",
    description: "Start with a live opportunity URL and let BidSmith ingest the solicitation context.",
  },
  {
    step: "02",
    title: "Review decision + matrix",
    description: "Get go/no-go rationale and a structured compliance matrix in the same workflow.",
  },
  {
    step: "03",
    title: "Export proposal starter",
    description: "Use the generated starter as your first draft foundation for proposal execution.",
  },
];

const testimonials = [
  {
    quote: "We reduced first-pass review time from half a day to under an hour on every federal opportunity.",
    author: "Capture Lead",
    company: "Mid-Market GovCon",
  },
  {
    quote: "The matrix caught a mandatory requirement we nearly missed. That alone saved this bid cycle.",
    author: "Proposal Manager",
    company: "Federal IT Prime",
  },
  {
    quote: "The starter draft gave writers immediate direction instead of starting from a blank page.",
    author: "BD Director",
    company: "Defense Services Team",
  },
];

export default function Landing({ onEnterApp, onAnalyze, onAnalyzeFile, onGoHome }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [inputUrl, setInputUrl] = useState("");
  const fileInputRef = useRef();

  const handleStartAnalysis = () => {
    if (!inputUrl.trim() || !onAnalyze) return;
    onAnalyze(inputUrl.trim());
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !onAnalyzeFile) return;
    onAnalyzeFile(file);
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, system-ui, sans-serif" }}>
      <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />

      <nav style={{ position: "sticky", top: 0, zIndex: 20, borderBottom: `1px solid ${BORDER}`, background: "rgba(6,11,24,0.88)", backdropFilter: "blur(8px)" }}>
        <div style={S.wrap}>
          <button onClick={onGoHome} style={S.brandButton}>
            <span style={S.brandBadge}>B</span>
            <span style={S.brandText}>BidSmith</span>
          </button>
          {!isMobile && <div style={S.desktopLinks}>
            <a href="#features" style={S.navLink}>Features</a>
            <a href="#how-it-works" style={S.navLink}>How It Works</a>
            <button onClick={onEnterApp} style={S.navGhost}>Log in</button>
            <button onClick={onEnterApp} style={S.navCta}>Get Started</button>
          </div>}
          {isMobile && <button style={S.mobileToggle} onClick={() => setMobileMenuOpen((v) => !v)}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>}
        </div>
        {isMobile && mobileMenuOpen && (
          <div style={{ ...S.wrap, paddingTop: 12, paddingBottom: 12, display: "grid", gap: 10 }}>
            <a href="#features" style={S.navLink}>Features</a>
            <a href="#how-it-works" style={S.navLink}>How It Works</a>
            <button onClick={onEnterApp} style={S.navGhost}>Log in</button>
            <button onClick={onEnterApp} style={S.navCta}>Get Started</button>
          </div>
        )}
      </nav>

      <section style={{ ...S.wrap, paddingTop: 96, paddingBottom: 72, textAlign: "center" }}>
        <div style={S.badge}>AI-Powered Federal RFP Intelligence</div>
        <h1 style={S.h1}>
          Win more federal contracts.
          <br />
          <span style={{ color: MUTED }}>Spend less time on manual review.</span>
        </h1>
        <p style={S.sub}>
          BidSmith audits federal opportunities end-to-end: decision, rationale,
          compliance matrix, and proposal starter in one workflow.
        </p>
        <button onClick={onEnterApp} style={S.heroPrimary}>
          Start Free Trial <ArrowRight size={15} />
        </button>
        <p style={{ color: MUTED, fontSize: 13, marginTop: 10 }}>No credit card required. 14-day free trial.</p>

        <div style={S.quickAudit}>
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStartAnalysis()}
            placeholder="Paste SAM.gov opportunity URL..."
            style={S.input}
          />
          <button onClick={handleStartAnalysis} style={S.secondaryAction}>Analyze Link</button>
          <button onClick={() => fileInputRef.current?.click()} style={S.secondaryAction}>Analyze PDF</button>
        </div>
      </section>

      <section id="features" style={{ ...S.wrap, paddingTop: 24, paddingBottom: 64 }}>
        <h2 style={S.h2}>Everything you need to win federal contracts</h2>
        <div style={S.grid3}>
          {features.map((item) => (
            <article key={item.title} style={S.card}>
              <item.icon size={18} color={PRIMARY} />
              <h3 style={S.cardTitle}>{item.title}</h3>
              <p style={S.cardText}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ ...S.wrap, paddingTop: 24, paddingBottom: 64 }}>
        <h2 style={S.h2}>How BidSmith works</h2>
        <div style={S.grid3}>
          {steps.map((item) => (
            <article key={item.step} style={S.stepCard}>
              <div style={S.stepNum}>{item.step}</div>
              <h3 style={S.cardTitle}>{item.title}</h3>
              <p style={S.cardText}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...S.wrap, paddingTop: 24, paddingBottom: 74 }}>
        <h2 style={S.h2}>Trusted by government contractors</h2>
        <div style={S.grid3}>
          {testimonials.map((t) => (
            <article key={t.author + t.company} style={S.card}>
              <p style={S.cardText}>"{t.quote}"</p>
              <p style={{ ...S.cardText, marginTop: 12, color: TEXT }}>
                <strong>{t.author}</strong> · {t.company}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...S.wrap, paddingTop: 10, paddingBottom: 90, textAlign: "center" }}>
        <h2 style={S.h2}>Ready to win more contracts?</h2>
        <p style={S.sub}>Join contractors using AI to move from discovery to proposal starter in minutes.</p>
        <button onClick={onEnterApp} style={S.heroPrimary}>
          Start Free Trial <ArrowRight size={15} />
        </button>
      </section>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "28px 20px 40px", color: MUTED }}>
        <div style={S.wrap}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>© {new Date().getFullYear()} BidSmith · ARIS Labs</div>
            <div style={{ display: "flex", gap: 14 }}>
              <a href="/privacy" style={S.footerLink}>Privacy</a>
              <a href="/terms" style={S.footerLink}>Terms</a>
              <a href="/cookies" style={S.footerLink}>Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

const S = {
  wrap: { maxWidth: 1120, margin: "0 auto", paddingLeft: 20, paddingRight: 20 },
  brandButton: { display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", color: TEXT, cursor: "pointer", padding: "14px 0" },
  brandBadge: { width: 28, height: 28, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", background: PRIMARY, color: "#0b1221", fontWeight: 800 },
  brandText: { fontSize: 18, fontWeight: 700 },
  desktopLinks: { display: "flex", alignItems: "center", gap: 14 },
  navLink: { color: MUTED, textDecoration: "none", fontSize: 14 },
  navGhost: { border: "none", background: "none", color: MUTED, cursor: "pointer", fontSize: 14 },
  navCta: { background: PRIMARY, color: PRIMARY_TEXT, border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, cursor: "pointer" },
  mobileToggle: { background: "none", border: "none", color: TEXT, cursor: "pointer" },
  badge: { display: "inline-block", padding: "7px 12px", borderRadius: 999, border: `1px solid ${BORDER}`, background: PANEL, color: MUTED, fontSize: 12, fontWeight: 600, marginBottom: 20 },
  h1: { fontSize: "clamp(2.1rem, 5vw, 4rem)", lineHeight: 1.1, margin: "0 0 18px", fontWeight: 800, letterSpacing: "-0.03em" },
  sub: { maxWidth: 760, margin: "0 auto", color: MUTED, fontSize: 18, lineHeight: 1.6 },
  heroPrimary: { marginTop: 26, background: PRIMARY, color: PRIMARY_TEXT, border: "none", borderRadius: 12, padding: "13px 22px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 },
  quickAudit: { marginTop: 34, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, maxWidth: 920, marginInline: "auto" },
  input: { background: PANEL, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 10, padding: "12px 14px", fontSize: 14, outline: "none" },
  secondaryAction: { background: "transparent", color: PRIMARY, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", fontWeight: 600, cursor: "pointer" },
  h2: { textAlign: "center", fontSize: "clamp(1.7rem, 3.6vw, 2.6rem)", margin: "0 0 28px", fontWeight: 800, letterSpacing: "-0.02em" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 },
  card: { border: `1px solid ${BORDER}`, background: PANEL, borderRadius: 14, padding: 18 },
  stepCard: { border: `1px solid ${BORDER}`, background: PANEL, borderRadius: 14, padding: 18 },
  stepNum: { fontSize: 28, fontWeight: 800, color: PRIMARY, marginBottom: 6 },
  cardTitle: { margin: "10px 0 8px", fontSize: 17, color: TEXT },
  cardText: { margin: 0, color: MUTED, fontSize: 14, lineHeight: 1.65 },
  footerLink: { color: MUTED, textDecoration: "none", fontSize: 13 },
};
