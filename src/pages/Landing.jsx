import React, { useState, useRef, useEffect } from 'react';
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
import FaqSection from "../components/FaqSection";
import GovernmentBanner from "../components/GovernmentBanner";
import DemoVideo from "../components/DemoVideo";
import "./Landing.css";

const heroStats = [
  { label: "SLA", value: "90 sec" },
  { label: "Detections", value: "FAR/DFARS" },
  { label: "Compliance", value: "Section L/M" },
];

const reportTabs = ["Executive Audit", "Compliance Matrix", "Risk Memo"];

export default function Landing({ onEnterApp, onViewSample, onSovereignBeta, onSovereignSearch, onEnterDashboard }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [inputUrl, setInputUrl] = useState("");
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
      
      <div style={styles.brandingBanner}>
        POWERED BY THE <span style={{ color: 'var(--accent)', fontWeight: 700 }}>ARIS LABS AUDIT ENGINE</span>
      </div>

      <header style={styles.navbar}>
        <div style={styles.navInner}>
          <a href="/" style={styles.brand}>
             <Shield size={22} color="#0f172a" />
             <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>ARIS [GOV-TIER]</span>
          </a>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={styles.navLink} onClick={onEnterDashboard}>Dashboard</span>
            <span style={styles.navLink} onClick={onSovereignSearch}>Bid Search</span>
            <button style={styles.navCta} onClick={onEnterApp}>Launch Workspace</button>
          </nav>
        </div>
      </header>

      <section className="landing-hero" style={styles.heroSection}>
        <div className="landing-hero-layout" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={styles.title}>
            Turn any RFP into a <br/>compliance matrix in 90s.
          </h1>
          <p style={styles.subtitle}>
            Find missing requirements, risks, and gaps instantly. <br/>
            Zero-knowledge security. Federal Prime Ready.
          </p>

          {!isProcessing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <button 
                onClick={() => fileInputRef.current.click()}
                style={styles.heroBtn}
              >
                Upload an RFP → Get Compliance Matrix
              </button>
              
              <div style={styles.trustStrip}>
                <div style={styles.trustItem}><Shield size={14} color="#002244" /> Institutional-Grade Security</div>
                <div style={styles.trustDivider} />
                <div style={styles.trustItem}><CheckCircle size={14} color="#002244" /> Built for Federal Contractors</div>
              </div>
            </div>
          ) : (
            <div style={styles.processingWrapper}>
              <div style={styles.terminalHeader}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ARIS LABS SECURE SESSION</span>
              </div>
              <div style={styles.terminalBody}>
                {logs.map((log, i) => (
                  <div key={i} style={styles.terminalLine}>{log}</div>
                ))}
                <div style={{ color: 'var(--accent)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={14} className="animate-spin" /> Analyzing RFP Payload...
                </div>
              </div>
            </div>
          )}
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
  brandingBanner: { background: '#0c0c0e', color: '#fff', textAlign: 'center', padding: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' },
  navbar: { padding: '16px 0', borderBottom: '1px solid #e2e8f0', background: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#0f172a' },
  navLink: { fontSize: '14px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  navCta: { background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' },
  heroSection: { padding: '100px 24px' },
  title: { fontSize: '4.5rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' },
  subtitle: { fontSize: '1.25rem', color: '#475569', marginBottom: '40px' },
  heroBtn: { background: '#002244', color: '#fff', padding: '20px 48px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' },
  trustStrip: { display: 'flex', gap: '24px', background: '#f8fafc', padding: '12px 24px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  trustDivider: { width: 1, height: 16, background: '#e2e8f0' },
  trustItem: { fontSize: '12px', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' },
  processingWrapper: { maxWidth: '600px', margin: '40px auto', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  terminalHeader: { background: '#f1f5f9', padding: '10px 16px', textAlign: 'left' },
  terminalBody: { background: '#fff', padding: '24px', textAlign: 'left', minHeight: '180px' },
  terminalLine: { marginBottom: '6px', fontSize: '12px', color: '#002244' },
  govFooter: { background: '#0f172a', padding: '60px 24px', color: '#fff' },
  footerBottom: { maxWidth: 1200, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' },
  footerLegal: { fontSize: '12px', color: '#94a3b8' }
};
