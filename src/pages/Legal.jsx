import { useEffect } from "react";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "March 9, 2026",
    sections: [
      {
        heading: "Data Collection",
        body: "BidSmith collects account information, usage telemetry, and operational diagnostics required to deliver proposal-audit functionality.",
      },
      {
        heading: "Use of Data",
        body: "Data is used for product operations, quality improvement, security monitoring, and service communications.",
      },
      {
        heading: "User Rights",
        body: "You can request access, correction, or deletion of personal data by contacting sid@bidsmith.pro.",
      },
      {
        heading: "Cookies",
        body: "We use essential cookies plus optional analytics/marketing cookies controlled by consent settings.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "March 9, 2026",
    sections: [
      {
        heading: "Service Scope",
        body: "BidSmith provides software tools to assist RFP analysis and proposal workflow acceleration.",
      },
      {
        heading: "Acceptable Use",
        body: "Users must not misuse the platform, attempt unauthorized access, or submit malicious payloads.",
      },
      {
        heading: "Billing",
        body: "Pricing and plan terms are published on the landing page and can be updated with notice.",
      },
      {
        heading: "Liability",
        body: "BidSmith liability is limited to fees paid for the applicable service period to the extent permitted by law.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: "March 9, 2026",
    sections: [
      {
        heading: "Necessary Cookies",
        body: "Required for core functionality and security, including session and preference management.",
      },
      {
        heading: "Analytics Cookies",
        body: "Used to measure feature usage and improve product quality when consent is granted.",
      },
      {
        heading: "Marketing Cookies",
        body: "Used for campaign measurement and personalization when explicitly enabled.",
      },
    ],
  },
};

export default function Legal({ type = "privacy" }) {
  const page = LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;

  useEffect(() => {
    const previousTitle = document.title;
    const previousRobots = document.querySelector('meta[name="robots"]');
    const createdRobots = !previousRobots;
    const robotsTag = previousRobots || document.createElement("meta");

    robotsTag.setAttribute("name", "robots");
    robotsTag.setAttribute("content", "noindex, nofollow");
    if (createdRobots) {
      document.head.appendChild(robotsTag);
    }

    document.title = `BidSmith – ${page.title}`;

    return () => {
      document.title = previousTitle;
      if (createdRobots) {
        robotsTag.remove();
      } else if (previousRobots) {
        previousRobots.setAttribute("content", "index,follow");
      }
    };
  }, [page.title]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>{page.title}</h1>
        <p style={styles.updated}>Last updated: {page.updated}</p>
        {page.sections.map((section) => (
          <section key={section.heading} style={styles.section}>
            <h2 style={styles.heading}>{section.heading}</h2>
            <p style={styles.body}>{section.body}</p>
          </section>
        ))}
        <a href="/" style={styles.link}>Return to BidSmith home</a>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 18px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
  },
  container: { maxWidth: 820, margin: "0 auto", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28 },
  title: { margin: 0, fontSize: "2rem" },
  updated: { margin: "8px 0 22px", color: "#64748b", fontSize: "0.9rem" },
  section: { marginBottom: 16 },
  heading: { margin: "0 0 6px", fontSize: "1.05rem" },
  body: { margin: 0, lineHeight: 1.7, color: "#334155" },
  link: { color: "#4338ca", textDecoration: "none", fontWeight: 600, display: "inline-block", marginTop: 12 },
};

