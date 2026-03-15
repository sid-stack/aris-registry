import { ArrowLeft, Shield, Zap, CheckCircle2, FileText, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SOLICITATIONS = {
  "dha-video-archive": {
    title: "DHA Video Imaging Archive Solicitation",
    id: "HT9402-24-R-0012",
    agency: "Defense Health Agency",
    summary: "Audit of technical compliance requirements for legacy imaging system integration.",
    checklist: `
## 📄 Technical Compliance Checklist (MERCURY 2 AUDIT)

### 1. Security Requirements (Mandatory)
- [ ] **RMF / ATO Inheritance:** Must provide documentation for NIST 800-37 Rev 2 compliance.
- [ ] **Data Residency:** All video archives must reside within CONUS-based AWS GovCloud.
- [ ] **FIPS 140-2:** Encryption at rest and in transit required for all PII/PHI.

### 2. Technical Evaluation Factors
- [ ] **Latency SLA:** System must demonstrate < 200ms retrieval for high-priority clinical archives.
- [ ] **Scalability:** Must support up to 5PB of object storage with linear throughput scaling.

### 3. Submission Requirements (Section L)
- [ ] **Page Limit:** 50 pages for the Technical Volume.
- [ ] **Due Date:** May 20, 2024.
    `,
    risks: [
      "Cybersecurity (SPRS Check Required)",
      "Facility Clearance (CUI Level 4)",
      "Legacy Data Migration Latency"
    ]
  },
  "army-it-services": {
    title: "Army IT Support Services (AIC)",
    id: "W52P1J-24-R-0045",
    agency: "Department of the Army",
    summary: "Compliance audit for small business set-aside IT support services.",
    checklist: `
## 📄 Technical Compliance Checklist (MERCURY 2 AUDIT)

### 1. Personnel Requirements
- [ ] **Key Personnel:** Project Manager must hold PMP and Secret Clearance.
- [ ] **Certifications:** 80% of staff must be IAT Level II compliant at start of work.

### 2. Management Approach
- [ ] **QASP Integration:** Must include a Quality Assurance Surveillance Plan aligned with Army standards.
- [ ] **Transition Plan:** Must demonstrate a 30-day incumbency transition with zero downtime.
    `,
    risks: [
      "Key Personnel Retention",
      "IAT Level II Certification Gaps",
      "Transition Timeline Constraints"
    ]
  }
};

export default function Labs({ onBack }) {
  const [solicitation, setSolicitation] = useState(null);
  const path = window.location.pathname;
  const slug = path.split("/").pop();

  useEffect(() => {
    if (SOLICITATIONS[slug]) {
      setSolicitation(SOLICITATIONS[slug]);
    } else {
      setSolicitation(SOLICITATIONS["dha-video-archive"]); // Fallback
    }
  }, [slug]);

  if (!solicitation) return null;

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <div style={styles.navInner}>
          <button onClick={onBack} style={styles.backButton}>
            <ArrowLeft size={16} /> Back to Hub
          </button>
          <div style={styles.brand}>
            <img src="/aris-logo.png" alt="Aris" style={{ height: 20 }} />
            <span>ARIS Labs / Intel</span>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.hero}>
          <p style={styles.eyebrow}>Active Solicitation Intelligence</p>
          <h1 style={styles.title}>{solicitation.title}</h1>
          <div style={styles.meta}>
            <span style={styles.metaItem}><FileText size={14} /> ID: {solicitation.id}</span>
            <span style={styles.metaItem}><Globe size={14} /> Agency: {solicitation.agency}</span>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.contentCol}>
            <div style={styles.card}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{solicitation.checklist}</ReactMarkdown>
            </div>
          </div>

          <div style={styles.ctaCol}>
            <div style={styles.stickyCta}>
              <div style={styles.alertCard}>
                <h3 style={styles.alertTitle}>
                  <Zap size={18} color="#f59e0b" /> Risk Memorandum
                </h3>
                <ul style={styles.riskList}>
                  {solicitation.risks.map((risk, i) => (
                    <li key={i} style={styles.riskItem}>{risk}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.mainCta}>
                <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>Run Full Compliance Audit</h3>
                <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 20 }}>
                  Get the complete Sections L/M compliance matrix, win themes, and a technical response outline for this solicitation.
                </p>
                <button 
                  onClick={() => window.location.href = "/app"}
                  style={styles.primaryBtn}
                >
                  Launch ARIS Engine
                </button>
                <p style={{ fontSize: 11, color: "#52525b", marginTop: 12, textAlign: "center" }}>
                  Zero-Knowledge Execution. No data persisted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#09090b", color: "#e4e4e7", fontFamily: "Inter, sans-serif" },
  navbar: { background: "#0c0c0e", borderBottom: "1px solid #1a1a1a", padding: "16px 20px" },
  navInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" },
  backButton: { background: "none", border: "none", color: "#71717a", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 },
  brand: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#ffffff" },
  main: { maxWidth: 1200, margin: "0 auto", padding: "48px 20px" },
  hero: { marginBottom: 40 },
  eyebrow: { color: "#3b82f6", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 },
  title: { fontSize: "clamp(1.5rem, 5vw, 2.5rem)", margin: "0 0 16px", color: "#ffffff" },
  meta: { display: "flex", gap: 20, color: "#71717a", fontSize: 14 },
  metaItem: { display: "flex", alignItems: "center", gap: 6 },
  grid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 },
  contentCol: {},
  ctaCol: {},
  card: { background: "#0c0c0e", border: "1px solid #1a1a1a", borderRadius: 12, padding: 32, lineHeight: 1.6 },
  stickyCta: { position: "sticky", top: 100 },
  alertCard: { background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: 20, marginBottom: 20 },
  alertTitle: { display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px", fontSize: 16, color: "#f59e0b" },
  riskList: { padding: 0, margin: 0, listStyle: "none" },
  riskItem: { fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#d4d4d8" },
  mainCta: { background: "#ffffff", color: "#000000", borderRadius: 12, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" },
  primaryBtn: { width: "100%", background: "#3b82f6", color: "#ffffff", border: "none", borderRadius: 8, padding: "14px", fontWeight: 700, cursor: "pointer", fontSize: 15 },
};
