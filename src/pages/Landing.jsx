import { Shield, Search, Globe, CheckCircle, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import FaqSection from "../components/FaqSection";
import "./Landing.css";

const heroStats = [
  { label: "SLA", value: "90 sec" },
  { label: "Detections", value: "FAR/DFARS" },
  { label: "Compliance", value: "Section L/M" },
];

import DemoSection from "../components/DemoSection";
import PricingComparison from "../components/PricingComparison";


export default function Landing({
  onEnterApp,
  onViewSample,
  onBidSmithBeta,
  onBidSmithSearch,
  onAnalyze,
  onAnalyzeFile,
  onEnterDashboard,
}) {
  const handlePlanClick = (plan) => {
    if (plan.buttonLink && (plan.buttonLink.startsWith("http") || plan.buttonLink.startsWith("mailto:"))) {
      window.location.href = plan.buttonLink;
    } else if (onEnterApp) {
      onEnterApp();
    }
  };


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
    <main style={styles.page}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf"
        onChange={handleFileChange}
      />

      <header style={styles.navbar}>
        <div style={styles.navInner}>
          <a href="/" style={styles.brand} aria-label="ARIS Labs Home">
            <Shield size={22} color="#002244" />
            <span style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "#002244" }}>ARIS [OS]</span>
          </a>
          <nav style={{ display: "flex", gap: isMobile ? "12px" : "24px", alignItems: "center" }} aria-label="Main Navigation">
            {!isMobile && (
              <>
                {onEnterDashboard && (
                  <button 
                    type="button"
                    style={styles.navLinkBtn} 
                    onClick={onEnterDashboard}
                    aria-label="Open GovCon Dashboard"
                  >
                    Dashboard
                  </button>
                )}
                <a 
                  href="/about"
                  style={styles.navLink} 
                  onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/about'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                >
                  Network
                </a>
                <button 
                  type="button"
                  style={styles.navLinkBtn} 
                  onClick={onBidSmithSearch}
                  aria-label="Open Sovereign Search"
                >
                  Sovereign Search
                </button>
                <button 
                  type="button"
                  style={styles.navLinkBtn} 
                  onClick={onBidSmithBeta}
                  aria-label="Early Access Intelligence"
                >
                  Intelligence
                </button>
              </>
            )}
            <button 
              type="button"
              style={{ ...styles.navCta, fontSize: isMobile ? 12 : 14, padding: isMobile ? "8px 14px" : "10px 20px" }} 
              onClick={onEnterApp}
              aria-label="Launch Workspace"
            >
              {isMobile ? "Launch" : "Launch Workspace"}
            </button>
            {!isMobile && (
              <>
                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 8px' }} aria-hidden="true" />
                <img src="/aris-logo.png" alt="ARIS Labs Institutional Logo" style={{ height: '24px', opacity: 0.9 }} />
              </>
            )}
          </nav>
        </div>
      </header>

        <section className="landing-hero" style={{ ...styles.heroSection, padding: isMobile ? "60px 20px" : "100px 24px" }}>
          <div className="landing-hero-layout" style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
            <div style={{ ...styles.heroBadge, fontSize: isMobile ? "10px" : "12px" }}>ARIS PROTOCOL v2.2 ENGINE ACTIVE</div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? "2.5rem" : "4.25rem", lineHeight: isMobile ? 1.1 : 1.2 }}>
              Turn 200-page RFPs into <br />
              <span style={{ color: '#002244' }}>compliance matrices in 90s.</span>
            </h1>
            <p style={{ ...styles.subtitle, fontSize: isMobile ? "1rem" : "1.25rem", maxWidth: "600px", margin: "0 auto 40px" }}>
              Instantly detect FAR/DFARS traps and Section L compliance gaps. <br />
              Institutional defense-tier security. Zero-knowledge execution.
            </p>

            {!isProcessing ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ ...styles.heroBtn, padding: isMobile ? "16px 32px" : "20px 48px", width: isMobile ? "100%" : "auto" }}
                    aria-label="Upload Solicitation PDF"
                  >
                    Upload Solicitation [PDF] →
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                    <Shield size={14} color="#16a34a" /> No data stored • Secure processing • Zero-knowledge
                  </div>
                  <button 
                    type="button"
                    onClick={onViewSample}
                    style={{ background: "none", border: "none", color: "#002244", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", textDecoration: "underline" }}
                  >
                    No RFP handy? Try the interactive demo →
                  </button>
                </div>

              {/* Visual Showcase: Before -> After */}
              <div style={{ ...styles.showcase, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 16 }}>
                <div style={{ ...styles.showcaseHalf, width: isMobile ? "100%" : "auto" }}>
                   <div style={styles.showcaseLabel}>BEFORE (PDF)</div>
                   <div style={styles.blurredPdf}>
                     "The contractor shall provide all personnel, equipment, supplies, facilities, transportation, tools, materials, supervision, and other items..."
                   </div>
                </div>
                <div style={{ width: isMobile ? "100%" : 40, height: isMobile ? 32 : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   {isMobile ? <ChevronDown size={20} color="#002244" /> : <ArrowRight size={20} color="#002244" />}
                </div>
                <div style={{ ...styles.showcaseHalf, width: isMobile ? "100%" : "auto" }}>
                   <div style={styles.showcaseLabel}>AFTER (ARIS)</div>
                   <div style={styles.cleanMatrix}>
                     <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 4, marginBottom: 4, fontSize: 9, fontWeight: 800, color: "#64748b" }}>SEC L-14.2</div>
                     <div style={{ fontSize: 11, fontWeight: 800, color: "#002244", lineHeight: 1.2 }}>Personnel Certs Required</div>
                     <div style={{ fontSize: 9, color: "#16a34a", fontWeight: 800, marginTop: 4 }}>DETECTED: MANDATORY SHALL</div>
                   </div>
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
                <div style={{ color: "#3b82f6", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={14} className="animate-spin" /> Shredding RFP Payload...
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

      <div id="solutions">
        <DemoSection onTryDemo={onViewSample} />
      </div>

      <section id="pricing" style={styles.pricingSection}>
        <div style={styles.pricingContainer}>
          <div style={styles.pricingHeader}>
            <div style={styles.pricingBadge}>INSTITUTIONAL PRICING</div>
            <h2 style={styles.pricingTitle}>Simple, Transparent Plans</h2>
            <p style={styles.pricingSubtitle}>
              Start free. Scale as you win. Replace weeks of manual <br />
              compliance review with institutional-grade AI.
            </p>
          </div>
          <PricingComparison onPlanClick={handlePlanClick} />
        </div>
      </section>

      <FaqSection />


      <footer style={styles.govFooter}>
        <div style={styles.footerContainer}>
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>
              <Shield size={20} color="#002244" />
              <span>ARIS LABS</span>
            </div>
            <p style={styles.footerTagline}>Institutional Grade RFP Intelligence.</p>
          </div>
          
          <div style={styles.footerGrid}>
            <div style={styles.footerColumn}>
              <h4 style={styles.footerHeading}>Protocol</h4>
              <a href="#solutions" style={styles.footerLink}>Solutions</a>
              <a href="#pricing" style={styles.footerLink}>Pricing</a>
              <a 
                href="/demo" 
                style={styles.footerLink}
                onClick={(e) => { e.preventDefault(); onViewSample(); }}
              >
                Live Demo
              </a>
              <a 
                href="/dashboard"
                style={styles.footerLink}
                onClick={(e) => { e.preventDefault(); onEnterDashboard(); }}
              >
                Open Dashboard
              </a>
              <a href="/templates" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/templates'); window.dispatchEvent(new PopStateEvent('popstate')); }}>RFP Templates</a>
            </div>
            
            <div style={styles.footerColumn}>
              <h4 style={styles.footerHeading}>Capture</h4>
              <a href="/discovery" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/discovery'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Discovery Engine</a>
              <a href="/sam-scraper" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/sam-scraper'); window.dispatchEvent(new PopStateEvent('popstate')); }}>SAM Scraper</a>
              <a href="/govcon-guide" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/govcon-guide'); window.dispatchEvent(new PopStateEvent('popstate')); }}>GovCon Guide</a>
            </div>

            <div style={styles.footerColumn}>
              <h4 style={styles.footerHeading}>Company</h4>
              <a href="/about" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/about'); window.dispatchEvent(new PopStateEvent('popstate')); }}>History & Mission</a>
              <a href="/soc" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/soc'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Security / SOC2</a>
              <a href="mailto:sid@bidsmith.pro" style={styles.footerLink}>Contact Desk</a>
            </div>
            
            <div style={styles.footerColumn}>
              <h4 style={styles.footerHeading}>Legal</h4>
              <a href="/privacy" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/privacy'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Privacy Policy</a>
              <a href="/terms" style={styles.footerLink} onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/terms'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Terms of Service</a>
            </div>
          </div>
        </div>
        
        <div style={styles.footerBottom}>
          <p>© 2026 ARIS LABS. All Rights Reserved. Built for Federal Contractors.</p>
        </div>
      </footer>
    </main>
  );
}

const styles = {
  page: { background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "Inter, sans-serif" },
  brandingBanner: { background: "#0c0c0e", color: "#fff", textAlign: "center", padding: "10px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em" },
  pricingSection: {
    padding: '100px 24px',
    background: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
  },
  pricingContainer: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  pricingHeader: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  pricingBadge: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.1em',
    marginBottom: '16px',
    textTransform: 'uppercase',
  },
  pricingTitle: {
    fontSize: '2.5rem',
    fontWeight: 900,
    color: '#002244',
    letterSpacing: '-0.02em',
    marginBottom: '16px',
    margin: 0,
  },
  pricingSubtitle: {
    fontSize: '1.1rem',
    color: '#475569',
    lineHeight: 1.6,
    margin: 0,
  },

  navbar: { padding: "16px 0", borderBottom: "1px solid #e2e8f0", background: "#fff", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" },
  brand: { display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#0f172a" },
  navLink: { fontSize: 14, color: "#64748b", cursor: "pointer", fontWeight: 600 },
  navLinkBtn: { fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 },
  navCta: { background: "#0f172a", color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer" },
  heroSection: { padding: "100px 24px" },
  title: { fontSize: "4.25rem", fontWeight: 900, marginBottom: 24, letterSpacing: "-0.04em" },
  subtitle: { fontSize: "1.25rem", color: "#475569", marginBottom: 40 },
  heroBtn: { background: "#002244", color: "#fff", padding: "20px 48px", borderRadius: 12, border: "none", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer" },
  secondaryBtn: { background: "#ffffff", color: "#0f172a", padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0", fontWeight: 700, cursor: "pointer" },
  urlInput: { flex: 1, minWidth: 220, padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14 },
  inlineInputRow: { display: "flex", gap: 12, alignItems: "center", width: "100%", maxWidth: 520, justifyContent: "center" },
  showcase: { display: "flex", gap: 16, maxWidth: 680, width: "100%", margin: "0 auto", padding: 12, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)" },
  showcaseHalf: { flex: 1, textAlign: "left", padding: 16, background: "#f8fafc", borderRadius: 8, overflow: "hidden" },
  showcaseLabel: { fontSize: 9, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 12 },
  blurredPdf: { fontSize: 9, color: "#94a3b8", filter: "blur(0.5px)", lineHeight: 1.5 },
  cleanMatrix: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
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
  govFooter: { padding: "80px 24px 40px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" },
  footerContainer: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '48px',
  },
  footerBrand: {
    maxWidth: '300px',
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '20px',
    fontWeight: 900,
    color: '#002244',
    letterSpacing: '-0.02em',
    marginBottom: '12px',
  },
  footerTagline: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.5,
    margin: 0,
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '32px',
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footerHeading: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#002244',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  footerLink: {
    fontSize: '14px',
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  footerLinkBtn: {
    fontSize: '14px',
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: 500,
    background: 'none',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  footerBottom: {
    maxWidth: '1100px',
    margin: '48px auto 0',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: 600,
  },
};

