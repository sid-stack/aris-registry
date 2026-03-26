import { useEffect, useState } from "react";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { getStoredTheme, applyTheme } from "../lib/theme";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "March 21, 2026",
    sections: [
      {
        id: "data-sovereignty",
        heading: "Data Sovereignty & Zero-Knowledge Architecture",
        body: "BidSmith is built on the principle of Data Sovereignty. Our architecture uses a Stateless Bridge protocol where all sensitive RFP and solicitation data is processed in transient memory only. We do not persist, store, or cache your competitive intelligence or proposal payloads on any server-side database. Once your session terminates, all cryptographic traces of the analysis are purged.",
      },
      {
        id: "what-we-collect",
        heading: "What Information We Collect",
        body: "We collect account-level information — specifically your email address — required for authentication and subscription management. We also collect anonymized usage telemetry and operational diagnostics to maintain system health. We never collect or view the contents of documents you analyze via the BidSmith Audit Workspace.",
      },
      {
        id: "data-retention",
        heading: "Data Retention",
        body: "We retain your email address for as long as your account remains active or as needed to provide subscription services. If you close your account, your email is deleted within 30 days. No solicitation content, proposal drafts, or audit outputs are retained on our servers at any time — these exist only transiently during your active session.",
      },
      {
        id: "your-rights",
        heading: "Your Rights",
        body: "You have the right to access, correct, or delete the personal data we hold about you (limited to your email address and subscription metadata). You may also request a portable copy of your account data. To exercise these rights, contact sid@bidsmith.pro. We will respond within 30 days. If you are located in the European Economic Area, you have additional rights under GDPR including the right to object to processing and to lodge a complaint with your local supervisory authority.",
      },
      {
        id: "third-party",
        heading: "Third-Party Processors",
        body: "We use the following third-party service providers who may process limited data on our behalf: Stripe (payment processing — handles billing data under their own privacy policy and PCI-DSS compliance), Upstash (serverless Redis and vector storage — stores anonymized document index data), OpenRouter (LLM routing — processes query text transiently for AI analysis, no persistent storage), Railway (cloud infrastructure hosting — servers where the application runs), and Plausible Analytics (privacy-first, cookieless analytics — no personal data collected, no cross-site tracking). None of these processors receive your solicitation content or proposal data.",
      },
      {
        id: "stateless-model",
        heading: "Stateless Execution Model",
        body: "Analyses are routed through a secure execution layer that transforms inputs into structured outputs without persistence. Your intellectual property remains yours; our engine only sees the logic required for processing, never the proprietary context.",
      },
      {
        id: "information-security",
        heading: "Information Security",
        body: "We implement defense-grade security measures including end-to-end encryption for session handshakes and short-lived tokens to prevent unauthorized payload access. Our infrastructure is hosted on Railway with enforced TLS and security headers conforming to OWASP recommendations.",
      },
      {
        id: "contact-privacy",
        heading: "Contact",
        body: "For privacy inquiries, data deletion requests, or questions about our data handling practices, contact us at sid@bidsmith.pro. We respond to all privacy requests within 30 days.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "March 21, 2026",
    sections: [
      {
        id: "workspace",
        heading: "Audit Workspace",
        body: "BidSmith provides a high-performance workspace for federal capture management. By using the platform, you agree to utilize the services for lawful proposal development and analysis only.",
      },
      {
        id: "subscription",
        heading: "Subscription & Licensing",
        body: "Access to BidSmith and associated workspace tools is granted via tiered subscription. Free tier provides 3 audits per month. Paid tiers (Starter, Standard, Enterprise) are billed monthly or annually. Subscriptions auto-renew unless cancelled. Pilot programs are governed by specific 30-day non-persistent execution terms. You may cancel your subscription at any time from your account dashboard; access continues until the end of the current billing period.",
      },
      {
        id: "acceptable-use",
        heading: "Acceptable Use",
        body: "You may not use BidSmith to process classified government information, to reverse-engineer competitors' proposals obtained without authorization, to generate fraudulent representations or certifications, or for any purpose that violates applicable law including the False Claims Act. Automated scraping of the platform or API abuse that exceeds published rate limits is prohibited. We reserve the right to suspend accounts that violate these terms.",
      },
      {
        id: "intellectual-property",
        heading: "Intellectual Property",
        body: "The BidSmith platform, its underlying algorithms, compliance engine, and all associated software are proprietary to BidSmith and protected by copyright and trade secret law. You retain full ownership of all content you input into the platform. The audit outputs, compliance matrices, and briefings generated by BidSmith are licensed to you for your internal business use. You may not resell, sublicense, or publicly redistribute BidSmith-generated outputs as a standalone product.",
      },
      {
        id: "liability",
        heading: "Limitation of Liability",
        body: "ARIS provides precision-grade risk analysis as an analytical aid, not legal advice or a guarantee of compliance. Users are responsible for final verification of all compliance claims against official FAR/DFARS regulations and applicable law. BidSmith's total liability to you for any claim arising from use of the platform is limited to the amount you paid us in the three months preceding the claim. We are not liable for indirect, consequential, or incidental damages including lost contract awards.",
      },
      {
        id: "governing-law",
        heading: "Governing Law",
        body: "These Terms are governed by the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or your use of the platform shall be resolved through binding arbitration administered by the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction for intellectual property violations.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: "March 21, 2026",
    sections: [
      {
        id: "what-are-cookies",
        heading: "What Are Cookies",
        body: "Cookies are small text files placed on your device by websites you visit. They are widely used to make websites function efficiently and to provide reporting information to site operators. We use cookies and similar technologies (such as local storage) to maintain your session, remember your preferences, and understand how the platform is used.",
      },
      {
        id: "essential-cookies",
        heading: "Essential Cookies",
        body: "Essential cookies are required for the platform to function. They include session authentication tokens that keep you logged in, CSRF protection tokens, and subscription state indicators. You cannot opt out of essential cookies while using the platform — disabling them will break authentication and session management.",
      },
      {
        id: "analytics",
        heading: "Analytics",
        body: "We use Plausible Analytics, a privacy-first analytics tool that does not use cookies and does not collect personally identifiable information. Plausible measures page views and general usage patterns using only anonymized, aggregated data derived from IP addresses (which are not stored). No cross-site tracking, no persistent identifiers, and no data is sold to advertisers. You can review Plausible's data policy at plausible.io/data-policy.",
      },
      {
        id: "how-to-control",
        heading: "How to Control Cookies",
        body: "You can control and delete cookies through your browser settings. Most browsers allow you to block or delete all cookies, or to accept cookies only from specific sites. Note that blocking essential cookies will prevent you from logging in to the platform. For browsers like Chrome, Firefox, and Safari, visit the browser's help documentation to manage cookie preferences. Since we use Plausible for analytics (which is cookieless), blocking cookies does not affect our analytics collection.",
      },
    ],
  },
};

export default function Legal({ type = "privacy" }) {
  const page = LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;
  const [isDark, setIsDark] = useState(() => getStoredTheme() === "dark");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `BidSmith | ${page.title}`;
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
    };
  }, [page.title]);

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    setIsDark(!isDark);
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>

      <div style={styles.page}>
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <a href="/" style={styles.brand} aria-label="BidSmith home">
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#f8fafc' }}>BidSmith</span>
            </a>
            <nav aria-label="Page navigation" style={styles.headerRight}>
              <a href="/" style={styles.backLink}>
                <ArrowLeft size={14} aria-hidden="true" />
                Back to Dashboard
              </a>
              <button
                onClick={toggleTheme}
                style={styles.themeButton}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark
                  ? <Sun size={16} aria-hidden="true" />
                  : <Moon size={16} aria-hidden="true" />
                }
              </button>
            </nav>
          </div>
        </header>

        <div className="legal-layout" style={styles.layout}>
          {/* Table of Contents sidebar */}
          <aside className="legal-sidebar" style={styles.sidebar} aria-label="Table of contents">
            <nav>
              <p style={styles.tocLabel}>Contents</p>
              <ul style={styles.tocList}>
                {page.sections.map((section) => (
                  <li key={section.id} style={styles.tocItem}>
                    <a href={`#${section.id}`} style={styles.tocLink}>
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main id="main-content" role="main" style={styles.content}>
            <article>
              <header style={styles.articleHeader}>
                <p style={styles.badge}>Legal Document</p>
                <h1 style={styles.title}>{page.title}</h1>
                <p style={styles.updated}>Last updated: {page.updated}</p>
              </header>

              <hr style={styles.divider} />

              {page.sections.map((section) => (
                <section key={section.id} id={section.id} style={styles.section} aria-labelledby={`heading-${section.id}`}>
                  <h2 id={`heading-${section.id}`} style={styles.heading}>{section.heading}</h2>
                  <p style={styles.body}>{section.body}</p>
                </section>
              ))}

              <footer style={styles.articleFooter}>
                <p style={styles.footerText}>
                  Questions? Contact us at{" "}
                  <a href="mailto:sid@bidsmith.pro" style={styles.inlineLink}>
                    sid@bidsmith.pro
                  </a>
                </p>
              </footer>
            </article>
          </main>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-page)",
    color: "var(--text-primary)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "1rem",
    lineHeight: 1.8,
    paddingBottom: "80px",
  },
  header: {
    borderBottom: "1px solid var(--border-faint)",
    background: "var(--bg-card)",
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  backLink: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "color 0.2s ease",
  },
  themeButton: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px",
    transition: "color 0.2s ease, border-color 0.2s ease",
  },
  layout: {
    maxWidth: "1080px",
    margin: "48px auto 0",
    padding: "0 20px",
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "48px",
    alignItems: "start",
  },
  sidebar: {
    position: "sticky",
    top: "80px",
  },
  tocLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "var(--text-faint)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  tocList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tocItem: {
    margin: 0,
  },
  tocLink: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    textDecoration: "none",
    display: "block",
    padding: "4px 0",
    lineHeight: 1.4,
    transition: "color 0.2s ease",
  },
  content: {
    maxWidth: "680px",
  },
  articleHeader: {
    marginBottom: "32px",
  },
  badge: {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "var(--accent)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
  },
  updated: {
    marginTop: "10px",
    color: "var(--text-faint)",
    fontSize: "0.85rem",
  },
  divider: {
    border: "none",
    borderTop: "1px solid var(--border-faint)",
    margin: "32px 0",
  },
  section: {
    marginBottom: "48px",
    scrollMarginTop: "96px",
  },
  heading: {
    margin: "0 0 14px",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.3,
  },
  body: {
    margin: 0,
    lineHeight: 1.8,
    color: "var(--text-body)",
    fontSize: "1rem",
  },
  articleFooter: {
    marginTop: "64px",
    paddingTop: "24px",
    borderTop: "1px solid var(--border-faint)",
  },
  footerText: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    margin: 0,
  },
  inlineLink: {
    color: "var(--link)",
    textDecoration: "none",
  },
};
