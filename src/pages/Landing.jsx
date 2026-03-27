import { Shield, Search, Globe, CheckCircle, Loader2, ArrowRight, ChevronDown, Check, AlertTriangle, FileText, Zap, Lock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import FaqSection from "../components/FaqSection";
import "./Landing.css";
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
    setLogs(["[BIDSMITH] Initializing secure bridge...", "[MERCURY2] Connecting to ingestion pipeline..."]);
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

  return (
    <main style={styles.page}>
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf" onChange={handleFileChange} />

      {/* Navigation */}
      <header style={styles.navbar}>
        <div style={styles.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={styles.navLogo}>BIDSMITH</span>
          </div>
          <nav style={{ display: "flex", gap: isMobile ? "12px" : "24px", alignItems: "center" }}>
            {!isMobile && (
              <>
                <button style={styles.navLinkBtn} onClick={onBidSmithSearch}>Search Bids</button>
                <button style={styles.navLinkBtn} onClick={onBidSmithBeta}>Gov Admin</button>
              </>
            )}
            <button style={styles.navCta} onClick={onEnterApp}>Upload RFP (Free)</button>
          </nav>
        </div>
      </header>

      {/* 🚀 Hero Section (Conversion Skeleton) */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>INSTITUTIONAL GRADE • BUILT FOR GOVCON</div>
          <h1 style={styles.heroTitle}>
            Turn RFPs into compliance <br />
            matrices in minutes.
          </h1>
          <p style={styles.heroSubtitle}>
            Built for government contractors. Stop losing bids to manual review errors. <br />
            BidSmith identifies every requirement, clause, and risk factor in seconds.
          </p>
          
          <div style={styles.heroCtaGroup}>
             <button onClick={onEnterApp} style={styles.mainBtn}>Upload RFP (Free)</button>
             <button onClick={onBidSmithSearch} style={styles.secBtn}>Search Federal Bids</button>
          </div>

          {!isProcessing ? (
            <div style={styles.videoContainer}>
              <div style={styles.videoSub}>Watch BidSmith shred a 200-page solicitation in 90s:</div>
              <div style={styles.videoFrame}>
                <video autoPlay muted loop playsInline style={styles.video}>
                  <source src="/assets/demo/aris-demo.mp4" type="video/mp4" />
                </video>
                <div style={styles.videoOverlay}>
                  <Shield size={12} color="#fff" />
                  <span>SECURE SESSION: AUDIT_PIPELINE_v2.2</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.terminal}>
              <div style={styles.terminalHead}>BIDSMITH SECURE SESSION</div>
              <div style={styles.terminalBody}>
                {logs.map((l, i) => <div key={i} style={styles.terminalLine}>{l}</div>)}
                <div style={styles.terminalLine}><Loader2 size={12} className="animate-spin" /> Working...</div>
              </div>
            </div>
          )}

          <div style={styles.trustBar}>
            <div style={styles.trustItem}><Check size={14} color="#16a34a" /> 100% Secure</div>
            <div style={styles.trustItem}><Check size={14} color="#16a34a" /> Zero Data Persistence</div>
            <div style={styles.trustItem}><Check size={14} color="#16a34a" /> FAR/DFARS Compliant</div>
          </div>
        </div>
      </section>

      {/* ⚡ Pain -> Solution Block */}
      <section style={styles.painSection}>
        <div style={styles.container}>
          <div style={styles.painGrid}>
            <div style={styles.painCard}>
              <AlertTriangle color="#dc2626" size={32} />
              <h3 style={styles.painTitle}>Manual Review (20h+)</h3>
              <p style={styles.painText}>Reading line-by-line is expensive and slow. One missed "shall" can disqualify your entire bid.</p>
            </div>
            <div style={styles.painCard}>
              <Zap color="#2563eb" size={32} />
              <h3 style={styles.painTitle}>BidSmith (90s)</h3>
              <p style={styles.painText}>Automatically extract every requirement into a structured matrix. Focus on winning, not shredding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 Output Preview Section */}
      <section style={styles.previewSection}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Institutional Grade Output</h2>
          <p style={styles.sectionSubtitle}>Professional compliance matrices ready for your proposal team.</p>
          
          <div style={styles.matrixPreview}>
            <div style={styles.matrixHead}>
              <span>ID</span>
              <span>Requirement Detail</span>
              <span>Ref</span>
              <span>Status</span>
            </div>
            <div style={styles.matrixRow}>
              <span style={styles.matrixId}>REQ-01</span>
              <span style={styles.matrixText}>The contractor shall provide personnel with active Top Secret/SCI clearances...</span>
              <span style={styles.matrixRef}>L.2.1</span>
              <span style={styles.matrixStatus}><Check size={12} color="#fff" /> CAPTURED</span>
            </div>
            <div style={styles.matrixRow}>
              <span style={styles.matrixId}>REQ-02</span>
              <span style={styles.matrixText}>Work must be performed at specified government facilities in the NCR...</span>
              <span style={styles.matrixRef}>C.5.2</span>
              <span style={styles.matrixStatus}><Check size={12} color="#fff" /> CAPTURED</span>
            </div>
            <div style={styles.matrixRow}>
              <span style={styles.matrixId}>REQ-03</span>
              <span style={styles.matrixText}><span style={{color: '#dc2626', fontWeight: 700}}>RISK:</span> Compliance with NIST SP 800-171 required...</span>
              <span style={styles.matrixRef}>I.1.4</span>
              <span style={styles.matrixStatusRisk}><AlertTriangle size={12} color="#fff" /> HIGH RISK</span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button onClick={onEnterApp} style={styles.mainBtn}>Generate Your Matrix Now</button>
          </div>
        </div>
      </section>

      {/* 💰 Simple Pricing */}
      <section id="pricing" style={styles.pricingSection}>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={styles.sectionTitle}>Simple, Performance-Based Pricing</h2>
            <p style={styles.sectionSubtitle}>Start with a free preview. Pay only when you're ready to export.</p>
          </div>
          <PricingComparison onPlanClick={handlePlanClick} />
        </div>
      </section>

      <FaqSection />

      {/* 🎯 Final CTA */}
      <section style={styles.finalCta}>
        <div style={styles.container}>
          <h2 style={styles.finalTitle}>Stop bleeding money on risky audits.</h2>
          <button onClick={onEnterApp} style={styles.mainBtnLarge}>Upload Your RFP & Get Matrix</button>
          <p style={styles.finalFootnote}>Institutional access. No signup required for initial analysis.</p>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <span style={styles.footerLogo}>BIDSMITH</span>
            <p style={styles.footerText}>Institutional Grade RFP Intelligence.</p>
          </div>
          <div style={styles.footerLinks}>
             <button style={styles.flBtn} onClick={onBidSmithSearch}>Search Bids</button>
             <button style={styles.flBtn} onClick={() => window.location.href='/contact'}>Contact [sid@bidsmith.pro]</button>
          </div>
        </div>
        <div style={styles.footerBottom}>© 2026 BIDSMITH. All Rights Reserved.</div>
      </footer>
    </main>
  );
}

const styles = {
  page: { background: "#f8fafc", color: "#0f172a", fontFamily: "Inter, sans-serif" },
  container: { maxWidth: 1100, margin: "0 auto", padding: "0 20px" },
  navbar: { height: 72, background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" },
  navLogo: { fontSize: 24, fontWeight: 800, color: "#0B3D91", fontFamily: "'Playfair Display', serif", textTransform: "uppercase", letterSpacing: "0.05em" },
  navLinkBtn: { fontSize: 14, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "8px 12px" },
  navCta: { background: "#0B3D91", color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  
  heroSection: { padding: "100px 24px", background: "#fff" },
  heroContent: { maxWidth: 1200, margin: "0 auto", textAlign: "center" },
  heroBadge: { fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: "0.15em", marginBottom: 24, textTransform: "uppercase" },
  heroTitle: { fontSize: "4.5rem", fontWeight: 900, color: "#002244", lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.04em" },
  heroSubtitle: { fontSize: "1.25rem", color: "#475569", lineHeight: 1.6, marginBottom: 40, maxWidth: 800, margin: "0 auto 40px" },
  heroCtaGroup: { display: "flex", gap: 16, justifyContent: "center", marginBottom: 60 },
  mainBtn: { background: "#0B3D91", color: "#fff", padding: "20px 48px", borderRadius: 12, border: "none", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", boxShadow: "0 10px 20px rgba(11,61,145,0.2)" },
  mainBtnLarge: { background: "#0B3D91", color: "#fff", padding: "24px 64px", borderRadius: 16, border: "none", fontWeight: 800, fontSize: "1.25rem", cursor: "pointer", boxShadow: "0 20px 40px rgba(11,61,145,0.3)" },
  secBtn: { background: "#fff", color: "#0B3D91", padding: "20px 48px", borderRadius: 12, border: "2px solid #0B3D91", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer" },

  videoContainer: { marginTop: 40, textAlign: 'center' },
  videoSub: { fontSize: 13, color: '#64748b', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' },
  videoFrame: { maxWidth: 900, margin: "0 auto", borderRadius: 16, overflow: "hidden", position: "relative", border: "1px solid #e2e8f0", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.15)", background: "#000" },
  video: { width: "100%", display: "block" },
  videoOverlay: { position: "absolute", top: 16, right: 16, background: "rgba(0,34,68,0.85)", padding: "8px 16px", borderRadius: 99, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 },

  trustBar: { display: "flex", gap: 32, justifyContent: "center", marginTop: 60, flexWrap: "wrap" },
  trustItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", fontWeight: 600 },

  painSection: { padding: "100px 0", background: "#f8fafc", borderTop: "1px solid #e2e8f0" },
  painGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40 },
  painCard: { padding: 40, background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", textAlign: "center" },
  painTitle: { fontSize: 24, fontWeight: 800, color: "#002244", margin: "20px 0 12px" },
  painText: { fontSize: 16, color: "#64748b", lineHeight: 1.6 },

  previewSection: { padding: "100px 0", background: "#fff" },
  sectionTitle: { fontSize: "3rem", fontWeight: 900, color: "#002244", textAlign: "center", marginBottom: 16 },
  sectionSubtitle: { fontSize: "1.25rem", color: "#475569", textAlign: "center", marginBottom: 60 },
  matrixPreview: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
  matrixHead: { display: "grid", gridTemplateColumns: "80px 1fr 100px 140px", padding: "16px 24px", background: "#0B3D91", color: "#fff", fontSize: 11, fontWeight: 800, textTransform: "uppercase" },
  matrixRow: { display: "grid", gridTemplateColumns: "80px 1fr 100px 140px", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", fontSize: 14, alignItems: "center" },
  matrixId: { fontWeight: 700, color: "#64748b" },
  matrixText: { color: "#0f172a", lineHeight: 1.5, paddingRight: 40 },
  matrixRef: { fontWeight: 700, color: "#0B3D91" },
  matrixStatus: { background: "#16a34a", color: "#fff", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800, textAlign: "center", display: "flex", alignItems: "center", gap: 6, width: "fit-content" },
  matrixStatusRisk: { background: "#dc2626", color: "#fff", padding: "4px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800, textAlign: "center", display: "flex", alignItems: "center", gap: 6, width: "fit-content" },

  pricingSection: { padding: "100px 0", background: "#f8fafc", borderTop: "1px solid #e2e8f0" },
  finalCta: { padding: "120px 24px", background: "#fff", textAlign: "center", borderTop: "1px solid #e2e8f0" },
  finalTitle: { fontSize: "3.5rem", fontWeight: 900, color: "#002244", marginBottom: 40 },
  finalFootnote: { marginTop: 20, fontSize: 13, color: "#94a3b8", fontWeight: 600 },

  footer: { padding: "80px 24px 40px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" },
  footerInner: { maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40 },
  footerBrand: { maxWidth: 300 },
  footerLogo: { fontSize: 20, fontWeight: 900, color: "#0B3D91", fontFamily: "'Playfair Display', serif", marginBottom: 12, display: 'block' },
  footerText: { fontSize: 14, color: "#64748b" },
  footerLinks: { display: "flex", gap: 24, alignItems: "center" },
  flBtn: { fontSize: 14, color: "#64748b", background: "none", border: "none", fontWeight: 600, cursor: "pointer", textDecoration: 'none' },
  footerBottom: { textAlign: "center", fontSize: 11, color: "#94a3b8", fontWeight: 700, marginTop: 60, textTransform: "uppercase", letterSpacing: "0.1em" },

  terminal: { maxWidth: 600, margin: "40px auto", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", textAlign: "left" },
  terminalHead: { background: "#f1f5f9", padding: "10px 16px", fontSize: 11, fontWeight: 800, color: "#64748b" },
  terminalBody: { padding: 24, minHeight: 180 },
  terminalLine: { fontSize: 12, color: "#0B3D91", marginBottom: 6, fontFamily: "monospace" },
};
