import React from 'react';
import { Shield, Cpu, Zap, Lock, Globe, Database, ArrowLeft } from 'lucide-react';

const Labs = ({ onBack }) => {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <Shield size={20} color="#3b82f6" />
            <span style={styles.brandText}>ARIS Intelligence Labs | Technical Protocol 1.1</span>
          </div>
          {onBack && (
            <button onClick={onBack} style={styles.backButton}>
              <ArrowLeft size={16} />
              Return to BidSmith
            </button>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.kicker}>
          <span style={styles.kickerText}>INTERNAL_SPEC_SHEET_V1.1</span>
        </div>
        
        <h1 style={styles.title}>Sovereign Infrastructure for Mission-Critical Federal Intelligence</h1>
        
        <div style={styles.divider} />

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <Cpu size={18} color="#3b82f6" />
            <h2 style={styles.sectionTitle}>1. The Stateless Bridge™ (Execution Architecture)</h2>
          </div>
          <p style={styles.body}>
            Standard AI applications store user data in persistent databases for session history and model training. 
            ARIS Intelligence Labs has engineered the <strong>Stateless Bridge</strong> to eliminate this vulnerability.
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>Ephemeral Ingestion:</strong> Data uploaded to the workbench is held in volatile memory (RAM) binary slots only for the duration of the active analysis cycle.
              </div>
            </li>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>Zero Persistence:</strong> Upon session termination or a 4-hour inactivity timeout, the execution container is cryptographically wiped to a zero-point state.
              </div>
            </li>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>Training Exclusion:</strong> ARIS is architecturally decoupled from model training loops. Your proprietary bid strategies never contribute to public or private LLM weights.
              </div>
            </li>
          </ul>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <Zap size={18} color="#3b82f6" />
            <h2 style={styles.sectionTitle}>2. Mercury 2 Diffusion (Processing Engine)</h2>
          </div>
          <p style={styles.body}>
            ARIS utilizes a proprietary implementation of <strong>Mercury 2</strong>, the world's first reasoning diffusion model optimized for GovCon complexity.
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>Non-Linear Synthesis:</strong> Unlike sequential LLMs, Mercury 2 "sculpts" responses in parallel, ensuring internal consistency across 500+ page solicitation shreds.
              </div>
            </li>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>Velocity:</strong> Optimized for {'>'}1,000 tokens/sec, reducing a 40-hour manual compliance "shred" to sub-90 seconds of machine reasoning.
              </div>
            </li>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>High-Fidelity Audit:</strong> Every output is cross-referenced against the Federal Acquisition Regulation (FAR) and DFARS database in real-time.
              </div>
            </li>
          </ul>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <Lock size={18} color="#3b82f6" />
            <h2 style={styles.sectionTitle}>3. Zero-Knowledge Compliance (The Protocol)</h2>
          </div>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>Identity-First Security:</strong> Session access is gated via multi-factor authentication and tokenized identity providers ensuring non-repudiation.
              </div>
            </li>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>SHA-256 Audit Trail:</strong> While raw data is purged, the metadata hash of the audit event is logged to provide an immutable audit trail for internal compliance officers.
              </div>
            </li>
            <li style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <div>
                <strong>Data Residency:</strong> All processing occurs within sovereign-aligned regions (US-West2 / US-East1) to ensure strict adherence to federal data residency requirements.
              </div>
            </li>
          </ul>
        </section>

        <div style={styles.divider} />

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📈 Current Deployments</h2>
          <div style={styles.deploymentGrid}>
            <div style={styles.deploymentCard}>
              <span style={styles.deploymentTag}>OK</span>
              <strong style={styles.deploymentName}>BidSmith v1.1</strong>
              <span style={styles.deploymentDesc}>Federal RFP Shredder & Compliance Linter.</span>
            </div>
            <div style={styles.deploymentCard}>
              <span style={styles.deploymentTag}>ACTIVE</span>
              <strong style={styles.deploymentName}>ARIS Specialist Agent</strong>
              <span style={styles.deploymentDesc}>Mission-tuned reasoning for GovCon strategy.</span>
            </div>
          </div>
        </section>

        <footer style={styles.contentFooter}>
          <p style={styles.terminalText}>SYSTEM_STATUS: NOMINAL // ENCRYPTION: AES-256-GCM</p>
          <p style={styles.footerNote}>© 2026 ARIS Intelligence Labs. Use of this infrastructure is subject to federal compliance override protocols.</p>
        </footer>
      </main>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050505',
    color: '#ffffff',
    fontFamily: "'Space Mono', monospace",
    lineHeight: '1.6',
    paddingBottom: '80px',
  },
  header: {
    borderBottom: '1px solid #1a1a1a',
    padding: '20px',
    background: '#050505',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandText: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#3b82f6',
  },
  backButton: {
    background: 'transparent',
    border: '1px solid #1a1a1a',
    color: '#a1a1aa',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  main: {
    maxWidth: '800px',
    margin: '60px auto 0',
    padding: '0 20px',
  },
  kicker: {
    marginBottom: '16px',
  },
  kickerText: {
    fontSize: '10px',
    background: '#1a1b26',
    color: '#3b82f6',
    padding: '4px 8px',
    borderRadius: '2px',
    fontWeight: 700,
    letterSpacing: '0.1em',
  },
  title: {
    fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
    fontWeight: 900,
    lineHeight: 1.2,
    margin: '0 0 40px',
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  divider: {
    height: '1px',
    background: '#1a1a1a',
    margin: '40px 0',
  },
  section: {
    marginBottom: '50px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  body: {
    fontSize: '14px',
    color: '#a1a1aa',
    marginBottom: '20px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  listItem: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: '#d4d4d8',
    lineHeight: 1.7,
  },
  bullet: {
    color: '#3b82f6',
    fontWeight: 800,
  },
  deploymentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  },
  deploymentCard: {
    background: '#0c0c0e',
    border: '1px solid #1a1a1a',
    padding: '20px',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  deploymentTag: {
    fontSize: '9px',
    color: '#22c55e',
    fontWeight: 800,
    letterSpacing: '0.1em',
  },
  deploymentName: {
    fontSize: '14px',
    color: '#f4f4f5',
  },
  deploymentDesc: {
    fontSize: '12px',
    color: '#71717a',
  },
  contentFooter: {
    marginTop: '100px',
    paddingTop: '40px',
    borderTop: '1px solid #1a1a1a',
    textAlign: 'center',
  },
  terminalText: {
    fontSize: '11px',
    color: '#3b82f6',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  footerNote: {
    fontSize: '10px',
    color: '#3f3f46',
    letterSpacing: '0.02em',
  }
};

export default Labs;
