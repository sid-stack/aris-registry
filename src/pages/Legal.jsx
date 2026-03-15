import React, { useEffect } from "react";
import { Shield, ArrowLeft, Lock, FileText, BadgeCheck } from "lucide-react";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "March 15, 2026",
    sections: [
      {
        heading: "Sovereign Ingestion Protocol",
        body: "ARIS Intelligence Labs operates on a Zero-Knowledge architecture. We collect account information and base telemetry required to maintain secure session handshakes. We do not persist contract bids, sensitive technical payloads, or proprietary win-themes. All analysis occurs via the Stateless Bridge™.",
      },
      {
        heading: "Data Sovereignty",
        body: "Data processed via ARIS is encrypted using AES-256-GCM. We never utilize your proprietary data for training public or private LLM weights. User identity is protected via tokenized handshake protocols.",
      },
      {
        heading: "User Termination Rights",
        body: "Users maintain total sovereignty over their account meta-data. Requests for purge can be dispatched to sid@bidsmith.pro.",
      },
      {
        heading: "Telemetry & Cookies",
        body: "We use high-security essential cookies to maintain the Stateless Bridge connection. Anonymous telemetry is collected only to ensure infrastructure stability.",
      },
    ],
  },
  terms: {
    title: "Corporate Terms of Service",
    updated: "March 15, 2026",
    sections: [
      {
        heading: "1. Infrastructure Access",
        body: "BidSmith (powered by ARIS Intelligence Labs) provides autonomous intelligence infrastructure for federal solicitation analysis. Access is granted on a per-session sovereign basis.",
      },
      {
        heading: "2. Intellectual Property",
        body: "Users retain 100% ownership of inputs and machine-synthesized outputs. ARIS Labs claims no right, title, or interest in any data processed via the Stateless Bridge.",
      },
      {
        heading: "3. Service Integrity",
        body: "Users must not attempt to reverse-engineer Mercury 2 protocols or utilize the infrastructure for unauthorized adversarial testing against federal systems.",
      },
      {
        heading: "4. Liability Limitation",
        body: "ARIS Intelligence Labs provides an extraction layer for technical synthesis. Final compliance remains the responsibility of the Prime Contractor's legal and capture teams.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: "March 15, 2026",
    sections: [
      {
        heading: "Session Handshake",
        body: "Required for the Aris Zero Token handshake and stateless session management.",
      },
      {
        heading: "Performance Monitoring",
        body: "Non-identifying cookies used to monitor Mercury 2 diffusion velocity and infrastructure health.",
      },
      {
        heading: "Consent Governance",
        body: "We respect the Global Privacy Control and local jurisdictional directives.",
      },
    ],
  },
};

export default function Legal({ type = "privacy", onBack }) {
  const page = LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `ARIS Labs – ${page.title}`;
    return () => { document.title = previousTitle; };
  }, [page.title]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <Shield size={18} color="#3b82f6" />
            <span style={styles.brandText}>LABS.BIDSMITH.PRO</span>
          </div>
          <button onClick={onBack || (() => window.location.href = '/')} style={styles.backButton}>
            <ArrowLeft size={14} />
            {type === 'terms' ? 'Exit Corporate Portal' : 'Back'}
          </button>
        </div>
      </header>

      <main style={styles.container}>
        <div style={styles.kicker}>
          <BadgeCheck size={12} color="#3b82f6" />
          <span style={styles.kickerText}>GOVERNANCE_PROTOCOL_v3.4</span>
        </div>
        
        <h1 style={styles.title}>{page.title}</h1>
        <p style={styles.updated}>SPECIFICATION UPDATED: {page.updated}</p>
        
        <div style={styles.divider} />

        {page.sections.map((section) => (
          <section key={section.heading} style={styles.section}>
            <h2 style={styles.heading}>{section.heading}</h2>
            <p style={styles.body}>{section.body}</p>
          </section>
        ))}

        <div style={styles.footerInfo}>
          <Lock size={14} color="#3f3f46" />
          <span style={styles.footerInfoText}>ALL DATA PROCESSED VIA STATELESS_BRIDGE IS CRYPTOGRAPHICALLY PURGED UPON EXIT.</span>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#09090b",
    color: "#a1a1aa",
    fontFamily: "'Space Mono', monospace",
    lineHeight: '1.6',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #1a1a1a',
    background: '#0c0c0e',
  },
  headerInner: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandText: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#3b82f6',
    letterSpacing: '0.1em',
  },
  backButton: {
    background: 'transparent',
    border: '1px solid #27272a',
    color: '#52525b',
    padding: '5px 12px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
  },
  container: { 
    maxWidth: 720, 
    margin: "0 auto", 
    padding: "60px 24px" 
  },
  kicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  kickerText: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#3b82f6',
    letterSpacing: '0.1em',
  },
  title: { 
    margin: '0 0 8px', 
    fontSize: "28px", 
    fontWeight: 900, 
    color: '#f4f4f5',
    letterSpacing: '-0.01em'
  },
  updated: { 
    margin: "0 0 32px", 
    color: "#3f3f46", 
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: '0.05em'
  },
  divider: {
    height: '1px',
    background: '#1a1a1a',
    marginBottom: '40px',
  },
  section: { 
    marginBottom: "40px" 
  },
  heading: { 
    margin: "0 0 12px", 
    fontSize: "14px", 
    fontWeight: 800, 
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  body: { 
    margin: 0, 
    lineHeight: 1.8, 
    color: "#a1a1aa",
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif'
  },
  footerInfo: {
    marginTop: '60px',
    padding: '24px',
    background: '#0c0c0e',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  footerInfoText: {
    fontSize: '10px',
    color: '#3f3f46',
    fontWeight: 700,
    letterSpacing: '0.05em',
  }
};


