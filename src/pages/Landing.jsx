import {
  Rocket,
  FileText,
  Shield,
  Zap,
  AlertTriangle,
  Search,
  ArrowRight,
  Globe,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import FaqSection from "../components/FaqSection";
import GovernmentBanner from "../components/GovernmentBanner";
import DemoVideo from "../components/DemoVideo";
import "./Landing.css";

const heroStats = [
  { label: "SLA", value: "90 sec" },
  { label: "Detections", value: "FAR/DFARS" },
  { label: "Compliance", value: "Section L/M" },
];

const reportTabs = ["Executive Audit", "Compliance Matrix"];

export default function Landing({ onEnterApp, onViewSample, onBidSmithBeta, onBidSmithSearch, onAnalyze, onAnalyzeFile }) {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processWithLogs(() => onAnalyzeFile(file));
  };

  const processWithLogs = (callback) => {
    setIsProcessing(true);
    setLogs(["[BIDSMITH] Initializing secure bridge...", "[MERCURY2] Connecting to ingestion pipeline..."]);
    
    const mockLogs = [
      { ms: 1200, msg: "[BIDSMITH] Scanning document structure..." },
      { ms: 2800, msg: "[SHREDDER] Extracting 'shall/must' requirements..." },
      { ms: 4500, msg: "[RISK] Analyzing Section L compliance triggers..." },
      { ms: 6000, msg: "[BIDSMITH] Building requirements matrix..." },
      { ms: 7500, msg: "[OK] Analysis complete. Rendering workspace..." }
    ];

    mockLogs.forEach(log => {
      setTimeout(() => setLogs(prev => [...prev, log.msg]), log.ms);
    });

    setTimeout(() => {
      callback();
    }, 8500);
  };

  const handleStartAnalysis = (e) => {
    e.preventDefault();
    if (!inputUrl && !isProcessing) return;
    processWithLogs(() => onAnalyze(inputUrl));
  };

  return (
    <div style={styles.page}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf"
        onChange={handleFileChange}
      />
      {!isMobile && (
        <header style={styles.navbar}>
          <div style={styles.navInner}>
            <a href="/" style={styles.brand}>
              <Shield size={22} color="#0f172a" />
              <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>BidSmith [AUDIT ENGINE]</span>
            </a>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={styles.navLink} onClick={() => window.location.href = '/about'}>About BidSmith</span>
              <span style={styles.navLink} onClick={() => window.location.href = '/bid-search'}>Bid Search</span>
              <span style={styles.navLink} onClick={() => window.location.href = '/beta'}>Join Beta</span>
              <button style={styles.navCta} onClick={onEnterApp}>Launch Workspace</button>
            </div>
          </div>
        </header>
      )}

      <section className="landing-hero" style={{ ...styles.heroSection, paddingBottom: 0 }}>
        <div className="landing-hero-layout">
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={styles.title}>
              Turn any RFP into a <br/>compliance matrix in 90s.
            </h1>
            <p style={styles.subtitle}>
              Find missing requirements, risks, and gaps instantly. <br/>
              Zero-knowledge security. Federal Prime Ready.
            </p>

            {!isProcessing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    style={{ ...styles.heroBtn, padding: '20px 48px', fontSize: '1.1rem', width: isMobile ? '100%' : 'auto', marginBottom: '12px' }}
                  >
                    Upload an RFP → Get Compliance Matrix
                  </button>
                  <p style={{ fontSize: '13px', color: '#71717a', fontWeight: 600 }}>
                    Takes ~90 seconds • No Account Needed • Zero Fluff
                  </p>
                </div>

                {/* Trust Strip - Gov-Tier Trust Marker */}
                <div style={styles.trustStrip}>
                  <div style={styles.trustItem}><Shield size={14} color="#002244" /> Institutional-Grade Security</div>
                  <div style={styles.trustDivider} />
                  <div style={styles.trustItem}><Zap size={14} color="#002244" /> Zero-Knowledge Data Architecture</div>
                  <div style={styles.trustDivider} />
                  <div style={styles.trustItem}><CheckCircle size={14} color="#002244" /> Built for Federal Contractors</div>
                </div>

                <div style={styles.heroSecondaryLinks}>
                   <div style={styles.heroLinkItem} onClick={() => setInputUrl("https://sam.gov/opp/")}>
                      <Globe size={14} /> Analyze SAM.gov
                   </div>
                   <div style={{ width: 1, height: 14, background: '#e2e8f0' }} />
                   <div style={styles.heroLinkItem} onClick={() => window.location.href = '/bid-search'}>
                      <Search size={14} /> Search Bids
                   </div>
                </div>
              </div>
            ) : (
              <div style={styles.processingWrapper}>
                <div style={styles.terminalHeader}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>BIDSMITH SECURE SESSION</span>
                </div>
                <div style={styles.terminalBody}>
                  {logs.map((log, i) => (
                    <div key={i} style={styles.terminalLine}>{log}</div>
                  ))}
                  <div style={{ color: 'var(--accent)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={14} className="animate-spin" /> Shredding RFP...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premium Showcase Showcase */}
          <div className="showcase-section">
             <div className="showcase-frame">
               <div className="showcase-ui-dots">
                 <div className="showcase-dot" />
                 <div className="showcase-dot" />
                 <div className="showcase-dot" />
               </div>
               
               <div className="showcase-badge">
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 2s infinite' }} />
                 LIVE AUDIT: $18.5M GSA SOLICITATION
               </div>

               {!isMobile && (
                 <>
                   <div className="feature-tag feature-tag-risk">
                     <AlertTriangle size={14} color="#f59e0b" />
                     <span>6 High-Risk Clauses Flagged</span>
                   </div>
                   <div className="feature-tag feature-tag-compliance">
                     <CheckCircle size={14} color="#10b981" />
                     <span>100% CMMC 2.0 Mapping</span>
                   </div>
                 </>
               )}

               <DemoVideo />
             </div>
          </div>
        </div>

        {/* Hero Stats */}
        <div style={{ maxWidth: 1200, margin: '60px auto 0', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
            <div style={styles.heroStatsGrid}>
              {heroStats.map((stat) => (
                <div key={stat.label} style={styles.heroStatCard}>
                  <p style={styles.heroStatValue}>{stat.value}</p>
                  <p style={styles.heroStatLabel}>{stat.label}</p>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* Pain Points */}
      <section style={{ ...styles.section, background: '#05070a' }}>
        <div style={styles.sectionInner}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '32px' }}>
            <div style={styles.painCard}>
              <Zap size={32} color="var(--accent)" style={{ marginBottom: '16px' }} />
              <h3>Clerical Exhaustion</h3>
              <p>Stop burning BD budget on manual requirement extraction. BidSmith automates the clerical so you can focus on the win.</p>
            </div>
            <div style={styles.painCard}>
              <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '16px' }} />
              <h3>Hidden Bid-Killers</h3>
              <p>Identify facility clearance dependencies and mandatory SLA risks buried in Page 400 of Section L.</p>
            </div>
            <div style={styles.painCard}>
              <Shield size={32} color="#10b981" style={{ marginBottom: '16px' }} />
              <h3>Zero-Knowledge Security</h3>
              <p>Federal prime standard security. Your RFP data remains in transient memory and is wiped post-execution.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.finalCta}>
        <div style={styles.sectionInner}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#002244', marginBottom: '32px' }}>Stop reading. Start bidding.</h2>
          <button style={{ ...styles.heroBtn, background: '#002244', padding: '20px 48px', fontSize: '1.25rem', margin: '0 auto' }} onClick={onEnterApp}>
            Launch BidSmith Session <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Gov-Style Footer */}
      <footer style={styles.govFooter}>
        <div style={{...styles.footerGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '40px' : '24px' }}>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>BidSmith Portal</h4>
            <ul style={styles.footerList}>
              <li onClick={() => window.location.href = '/app'} style={{ cursor: 'pointer' }}>Compliance Workspace</li>
              <li onClick={() => window.location.href = '/sam-rep'} style={{ cursor: 'pointer' }}>Sample Audit (DHA)</li>
              <li onClick={() => window.location.href = '/sam-scraper'} style={{ cursor: 'pointer' }}>SAM.gov Toolset</li>
              <li onClick={() => window.location.href = '/bid-search'} style={{ cursor: 'pointer' }}>Intelligence Search</li>
            </ul>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Institutional</h4>
            <ul style={styles.footerList}>
              <li onClick={() => window.location.href = '/about'} style={{ cursor: 'pointer' }}>About BidSmith</li>
              <li onClick={() => window.location.href = '/soc'} style={{ cursor: 'pointer' }}>Security Protocol</li>
              <li onClick={() => window.location.href = '/govcon-guide'} style={{ cursor: 'pointer' }}>GovCon Guide</li>
            </ul>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerHeading}>Support</h4>
            <ul style={styles.footerList}>
              <li>Grievance Portal</li>
              <li>Enterprise Sales</li>
              <li>Careers</li>
            </ul>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <div style={styles.footerLegal}>
            <div style={styles.govLogoMini}>
              <Shield size={20} color="#fff" />
              <span>bidsmith.pro</span>
            </div>
            <p>© 2026 BidSmith. All Rights Reserved. Built for Government Contractors.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: { 
    background: "#f8fafc", 
    minHeight: "100vh", 
    color: "#0f172a", 
    fontFamily: "Inter, sans-serif",
    overflowX: 'hidden'
  },
  brandingBanner: { 
    background: '#f1f5f9', 
    padding: '8px 12px', 
    textAlign: 'center', 
    fontSize: 'clamp(9px, 2vw, 11px)', 
    color: '#64748b', 
    borderBottom: '1px solid #e2e8f0', 
    letterSpacing: '0.05em' 
  },
  navbar: { 
    padding: '16px 0', 
    borderBottom: '1px solid #e2e8f0', 
    background: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navInner: { 
    maxWidth: 1200, 
    margin: '0 auto', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '0 24px' 
  },
  brand: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    color: '#0f172a', 
    fontWeight: 800, 
    textDecoration: 'none', 
    fontSize: 'clamp(1rem, 4vw, 1.25rem)' 
  },
  navLink: { fontSize: '14px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  navCta: { background: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' },
  heroSection: { 
    padding: 'clamp(60px, 10vw, 100px) 24px', 
    position: 'relative', 
    background: '#fff',
    textAlign: 'center'
  },
  title: { 
    fontWeight: 900, 
    lineHeight: 1.1, 
    letterSpacing: '-0.04em', 
    color: '#0f172a',
    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
    maxWidth: '900px',
    margin: '0 auto 24px'
  },
  subtitle: { 
    fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
    color: '#475569', 
    lineHeight: 1.6,
    maxWidth: '640px',
    margin: '0 auto 40px'
  },
  heroInputWrapper: { 
    display: 'flex', 
    flexDirection: 'row',
    maxWidth: '800px', 
    margin: '12px auto 40px', 
    gap: '8px', 
    background: '#fff', 
    padding: '8px', 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
    flexWrap: 'wrap'
  },
  inputContainer: { 
    flex: '1 1 300px', 
    position: 'relative', 
    display: 'flex', 
    alignItems: 'center' 
  },
  inputIcon: { position: 'absolute', left: '16px', color: '#94a3b8' },
  heroInput: { width: '100%', background: 'transparent', border: 'none', padding: '16px 16px 16px 48px', color: '#0f172a', fontSize: '1.1rem', outline: 'none' },
  heroBtn: { 
    flex: '1 1 200px',
    background: '#002244', 
    color: '#fff', 
    border: 'none', 
    padding: '16px 32px', 
    borderRadius: '12px', 
    fontWeight: 800, 
    fontSize: '1rem', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '8px', 
    transition: 'all 0.2s ease', 
    boxShadow: '0 4px 12px rgba(0, 34, 68, 0.15)' 
  },
  heroSecondaryLinks: { 
    display: 'flex', 
    gap: 'clamp(12px, 4vw, 24px)', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '60px'
  },
  heroLinkItem: { fontSize: '13px', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  trustLayer: { 
    display: 'flex', 
    gap: 'clamp(12px, 3vw, 24px)', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: '#f1f5f9', 
    padding: '8px 20px', 
    borderRadius: '100px', 
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap'
  },
  trustItem: { fontSize: '11px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
  heroStatsGrid: { display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 5vw, 48px)', marginTop: '60px', flexWrap: 'wrap' },
  heroStatCard: { textAlign: 'center', flex: '1 1 120px' },
  heroStatValue: { fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 900, color: '#0f172a', marginBottom: '4px' },
  heroStatLabel: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#dbeafe',
    color: '#1e40af',
    fontSize: '10px',
    fontWeight: 800,
    borderRadius: '4px',
    letterSpacing: '0.1em'
  },
  section: { padding: '120px 24px' },
  sectionInner: { maxWidth: 1200, margin: '0 auto' },
  painCard: { background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  finalCta: { padding: '120px 24px', textAlign: 'center', borderTop: '1px solid #e2e8f0', background: '#fff' },
  processingWrapper: { maxWidth: '600px', margin: '0 auto 48px', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' },
  terminalHeader: { background: '#f1f5f9', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' },
  terminalBody: { background: '#fff', padding: '24px', textAlign: 'left', fontFamily: 'Inter, sans-serif', fontSize: '12px', minHeight: '180px', color: '#002244' },
  terminalLine: { color: '#002244', marginBottom: '6px' },
  trustStrip: { 
    display: 'flex', 
    gap: '24px', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: '#f8fafc', 
    padding: '12px 24px', 
    borderRadius: '8px', 
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    marginTop: '12px'
  },
  trustDivider: { width: 1, height: 16, background: '#e2e8f0' },
  trustItem: { fontSize: '12px', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' },
  govFooter: { background: '#0f172a', padding: '80px 24px 40px', color: '#fff' },
  footerGrid: { maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '80px' },
  footerCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  footerHeading: { fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' },
  footerList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#e2e8f0', fontWeight: 500 },
  footerBottom: { borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px', maxWidth: 1200, margin: '0 auto' },
  footerLegal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', fontSize: '12px', color: '#94a3b8' },
  govLogoMini: { display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontWeight: 800, fontSize: '1rem' }
};
