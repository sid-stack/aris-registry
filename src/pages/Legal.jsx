import { useEffect } from "react";
import { Shield, ArrowLeft } from "lucide-react";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "December 12, 2025",
    sections: [
      {
        heading: "Data Sovereignty & Zero-Knowledge",
        body: "BidSmith is built on the principle of Data Sovereignty. Our architecture utilizes a Stateless Bridge protocol where all sensitive RFP and solicitation data is processed in transient memory only. We do not persist, store, or cache your competitive intelligence or proposal payloads on any server-side database. Once your session is terminated, all cryptographic traces of the analysis are purged.",
      },
      {
        heading: "What Information We Collect",
        body: "We collect account-level information (email address) required for authentication and subscription management. We also collect anonymized usage telemetry and operational diagnostics to maintain system health. We NEVER collect or view the contents of the documents you shred via the Intelligence Workbench.",
      },
      {
        heading: "Stateless Execution Model",
        body: "Analyses are routed through a secure execution layer that transforms inputs into structured outputs without persistence. Your intellectual property remains yours; our engine only sees the logic required for processing, never the proprietary context.",
      },
      {
        heading: "Information Security",
        body: "We implement defense-grade security measures including end-to-end encryption for session handshakes and short-lived Zero Tokens to prevent unauthorized payload access.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "December 12, 2025",
    sections: [
      {
        heading: "The Intelligence Workbench",
        body: "BidSmith provides a high-performance workbench for federal capture management. By using the platform, you agree to utilize the services for lawful proposal development and analysis.",
      },
      {
        heading: "Subscription & Licensing",
        body: "Access to the ARIS OS and associated workbench tools is granted via tiered subscription models. Pilot programs are governed by specific 30-day non-persistent execution terms.",
      },
      {
        heading: "Liability & Precision",
        body: "While BidSmith provides precision-grade risk auditing, users are responsible for final verification of all compliance claims against official FAR/DFARS regulations.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: "December 12, 2025",
    sections: [
      {
        heading: "Operational Cookies",
        body: "We use essential session tokens to maintain your authentication state and preferences within the sovereign workbench.",
      },
      {
        heading: "Telemetry Cookies",
        body: "Anonymous telemetry is used to optimize the agentic pipeline and identify throughput bottlenecks.",
      },
    ],
  },
};

export default function Legal({ type = "privacy" }) {
  const page = LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `BidSmith | ${page.title}`;
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
    };
  }, [page.title]);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <a href="/" style={styles.brand}>
            <Shield size={18} color="#ffffff" fill="#ffffff" fillOpacity={0.1} />
            <span style={styles.brandName}>REGISTRY.BIDSMITH.PRO</span>
          </a>
          <a href="/" style={styles.backLink}>
            <ArrowLeft size={14} /> Back to Home
          </a>
        </div>
      </header>

      <div style={styles.container}>
        <div style={styles.contentCard}>
          <div style={styles.badge}>LEGAL DOCUMENT</div>
          <h1 style={styles.title}>{page.title}</h1>
          <p style={styles.updated}>Effective Version: {page.updated}</p>
          
          <div style={styles.divider} />

          {page.sections.map((section) => (
            <section key={section.heading} style={styles.section}>
              <h2 style={styles.heading}>{section.heading}</h2>
              <p style={styles.body}>{section.body}</p>
            </section>
          ))}

          <div style={styles.footer}>
            <p style={styles.footerText}>
              For inquiries regarding data sovereignty or CMMC compliance, contact <a href="mailto:sid@bidsmith.pro" style={styles.inlineLink}>sid@bidsmith.pro</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000000",
    color: "#e4e4e7",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    paddingBottom: "80px",
  },
  header: {
    borderBottom: "1px solid #141416",
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: "1120px",
    margin: "0 auto",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
  },
  brandName: {
    fontSize: "0.75rem",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "0.15em",
  },
  backLink: {
    fontSize: "0.85rem",
    color: "#71717a",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "color 0.2s ease",
  },
  container: {
    maxWidth: "800px",
    margin: "60px auto 0",
    padding: "0 20px",
  },
  contentCard: {
    background: "#050505",
    border: "1px solid #141416",
    borderRadius: "2px",
    padding: "60px",
  },
  badge: {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#3b82f6",
    letterSpacing: "0.1em",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "2.5rem",
    fontWeight: 400,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  updated: {
    margin: "12px 0 0",
    color: "#3f3f46",
    fontSize: "0.85rem",
  },
  divider: {
    height: "1px",
    background: "#141416",
    margin: "40px 0",
  },
  section: {
    marginBottom: "48px",
  },
  heading: {
    margin: "0 0 16px",
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  body: {
    margin: 0,
    lineHeight: 1.8,
    color: "#71717a",
    fontSize: "0.95rem",
  },
  footer: {
    marginTop: "80px",
    paddingTop: "24px",
    borderTop: "1px solid #141416",
  },
  footerText: {
    fontSize: "0.85rem",
    color: "#3f3f46",
    margin: 0,
  },
  inlineLink: {
    color: "#3b82f6",
    textDecoration: "none",
  },
};

