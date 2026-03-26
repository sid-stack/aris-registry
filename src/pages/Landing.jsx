import { Shield, Search, Globe, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import FaqSection from "../components/FaqSection";
import "./Landing.css";

const heroStats = [
  { label: "SLA", value: "90 sec" },
  { label: "Detections", value: "FAR/DFARS" },
  { label: "Compliance", value: "Section L/M" },
];

export default function Landing({
  onEnterApp,
  onViewSample,
  onBidSmithBeta,
  onBidSmithSearch,
  onAnalyze,
  onAnalyzeFile,
  onEnterDashboard,
}) {
  const [inputUrl, setInputUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const fileInputRef = useRef();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const processWithLogs = (callback) => {
    setIsProcessing(true);
    setLogs([
      "[BIDSMITH] Initializing secure bridge...",
      "[MERCURY2] Connecting to ingestion pipeline...",
    ]);

    const mockLogs = [
      { ms: 1200, msg: "[BIDSMITH] Scanning document structure..." },
      { ms: 2800, msg: "[SHREDDER] Extracting 'shall/must' requirements..." },
      { ms: 4500, msg: "[RISK] Analyzing Section L compliance triggers..." },
      { ms: 6000, msg: "[BIDSMITH] Building requirements matrix..." },
      { ms: 7500, msg: "[OK] Analysis complete. Rendering workspace..." },
    ];

    mockLogs.forEach((log) => {
      setTimeout(() => setLogs((prev) => [...prev, log.msg]), log.ms);
    });

    setTimeout(() => {
      callback();
    }, 8500);
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

  const handleQuickAnalyze = (url) => {
    if (!onAnalyze || isProcessing) return;
    setInputUrl(url);
    processWithLogs(() => onAnalyze(url));
  };

  return (
    <div style={styles.page}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf"
        onChange={handleFileChange}
      />

      <div style={styles.brandingBanner}>
        POWERED BY THE <span style={{ color: "var(--accent)", fontWeight: 700 }}>ARIS LABS AUDIT ENGINE</span>
      </div>

      <header style={styles.navbar}>
        <div style={styles.navInner}>
          <a href="/" style={styles.brand}>
            <Shield size={22} color="#0f172a" />
            <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>BidSmith [AUDIT ENGINE]</span>
          </a>
          <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            {onEnterDashboard && <span style={styles.navLink} onClick={onEnterDashboard}>Dashboard</span>}
            <span style={styles.navLink} onClick={() => window.location.href = "/about"}>About</span>
            <span style={styles.navLink} onClick={onBidSmithSearch}>Bid Search</span>
            <span style={styles.navLink} onClick={onBidSmithBeta}>Join Beta</span>
            <button style={styles.navCta} onClick={onEnterApp}>Launch Workspace</button>
          </nav>
        </div>
      </header>

      <section className="landing-hero" style={styles.heroSection}>
        <div className="landing-hero-layout" style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h1 style={styles.title}>
            Turn any RFP into a <br />compliance matrix in 90s.
          </h1>
          <p style={styles.subtitle}>
            Find missing requirements, risks, and gaps instantly. <br />
            Zero-knowledge security. Federal Prime Ready.
          </p>

          {!isProcessing ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ width: isMobile ? "100%" : "auto" }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ ...styles.heroBtn, width: isMobile ? "100%" : "auto" }}
                >
                  Upload an RFP → Get Compliance Matrix
                </button>
                <p style={{ fontSize: 13, color: "#71717a", fontWeight: 600, marginTop: 10 }}>
                  Takes ~90 seconds • No Account Needed • Zero Fluff
                </p>
              </div>

              <div style={styles.inlineInputRow}>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste SAM.gov link"
                  style={styles.urlInput}
                />
                <button
                  onClick={handleStartAnalysis}
                  disabled={!inputUrl.trim() || isProcessing}
                  style={styles.secondaryBtn}
                >
                  Analyze URL
                </button>
              </div>

              <div style={styles.trustStrip}>
                <div style={styles.trustItem}><Shield size={14} color="#002244" /> Institutional-Grade Security</div>
                <div style={styles.trustDivider} />
                <div style={styles.trustItem}><CheckCircle size={14} color="#002244" /> Built for Federal Contractors</div>
              </div>

              <div style={styles.heroSecondaryLinks}>
                <div style={styles.heroLinkItem} onClick={() => handleQuickAnalyze("https://sam.gov/opp/")}> 
                  <Globe size={14} /> Analyze SAM.gov
                </div>
                <div style={{ width: 1, height: 14, background: "#e2e8f0" }} />
                <div style={styles.heroLinkItem} onClick={onBidSmithSearch}>
                  <Search size={14} /> Search Bids
                </div>
                <div style={{ width: 1, height: 14, background: "#e2e8f0" }} />
                <div style={styles.heroLinkItem} onClick={onViewSample}>
                  View Sample Audit
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.processingWrapper}>
              <div style={styles.terminalHeader}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>BIDSMITH SECURE SESSION</span>
              </div>
              <div style={styles.terminalBody}>
                {logs.map((log, i) => (
                  <div key={i} style={styles.terminalLine}>{log}</div>
                ))}
                <div style={{ color: "var(--accent)", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={14} className="animate-spin" /> Shredding RFP...
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ maxWidth: 1200, margin: "60px auto 0", borderTop: "1px solid #e2e8f0", paddingTop: 40 }}>
          <div style={styles.heroStatsGrid}>
            {heroStats.map((stat) => (
              <div key={stat.label} style={styles.heroStatCard}>
                <div style={styles.heroStatValue}>{stat.value}</div>
                <div style={styles.heroStatLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />

      <footer style={styles.govFooter}>
        <div style={styles.footerBottom}>
          <div style={styles.footerLegal}>
            <p>© 2026 ARIS LABS. All Rights Reserved. Institutional Grade Intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: { background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "Inter, sans-serif" },
  brandingBanner: { background: "#0c0c0e", color: "#fff", textAlign: "center", padding: "10px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em" },
  navbar: { padding: "16px 0", borderBottom: "1px solid #e2e8f0", background: "#fff", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" },
  brand: { display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#0f172a" },
  navLink: { fontSize: 14, color: "#64748b", cursor: "pointer", fontWeight: 600 },
  navCta: { background: "#0f172a", color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer" },
  heroSection: { padding: "100px 24px" },
  title: { fontSize: "4.25rem", fontWeight: 900, marginBottom: 24, letterSpacing: "-0.04em" },
  subtitle: { fontSize: "1.25rem", color: "#475569", marginBottom: 40 },
  heroBtn: { background: "#002244", color: "#fff", padding: "20px 48px", borderRadius: 12, border: "none", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer" },
  secondaryBtn: { background: "#ffffff", color: "#0f172a", padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0", fontWeight: 700, cursor: "pointer" },
  urlInput: { flex: 1, minWidth: 220, padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14 },
  inlineInputRow: { display: "flex", gap: 12, alignItems: "center", width: "100%", maxWidth: 520, justifyContent: "center" },
  trustStrip: { display: "flex", gap: 24, background: "#f8fafc", padding: "12px 24px", borderRadius: 8, border: "1px solid #e2e8f0", flexWrap: "wrap", justifyContent: "center" },
  trustDivider: { width: 1, height: 16, background: "#e2e8f0" },
  trustItem: { fontSize: 12, color: "#475569", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 },
  heroSecondaryLinks: { display: "flex", gap: 16, alignItems: "center", fontSize: 13, color: "#475569", fontWeight: 600, flexWrap: "wrap", justifyContent: "center" },
  heroLinkItem: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer" },
  processingWrapper: { maxWidth: 600, margin: "40px auto", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" },
  terminalHeader: { background: "#f1f5f9", padding: "10px 16px", textAlign: "left" },
  terminalBody: { background: "#fff", padding: 24, textAlign: "left", minHeight: 180 },
  terminalLine: { marginBottom: 6, fontSize: 12, color: "#002244" },
  heroStatsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 },
  heroStatCard: { background: "#fff", borderRadius: 12, padding: 18, border: "1px solid #e2e8f0", textAlign: "center" },
  heroStatValue: { fontSize: 22, fontWeight: 800, marginBottom: 6 },
  heroStatLabel: { fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" },
  govFooter: { background: "#0f172a", padding: "60px 24px", color: "#fff" },
  footerBottom: { maxWidth: 1200, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 40 },
  footerLegal: { fontSize: 12, color: "#94a3b8" },
};
