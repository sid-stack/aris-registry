import React from 'react';

const TYPEFORM_URL = "https://form.typeform.com/to/JPolFoVE";

const services = [
  {
    index: "01",
    title: "AI Systems Diagnostic",
    price: "$1,800",
    value: "A structured assessment of your AI stack — identifying where risk accumulates, where decisions break down, and what stands between you and a production failure.",
    deliverable: "48-hour Safeguard Report with prioritised remediation path",
  },
  {
    index: "02",
    title: "Architecture Remediation",
    price: "$5,000+",
    value: "For organisations operating in regulated environments where AI cannot be a black box. We rebuild the boundary between your business logic and AI dependencies — cleanly, with full auditability.",
    deliverable: "Production deployment with documentation and handover",
  },
  {
    index: "03",
    title: "Intelligent Agent Design",
    price: "Custom",
    value: "Purpose-built automation that operates with precision and accountability. Not a chatbot. A system that acts, reasons, and reports — within boundaries you define.",
    deliverable: "End-to-end agent infrastructure, deployed and tested",
  },
];

export default function ArisConsulting() {
  return (
    <div style={s.page}>

      {/* TOP NAV */}
      <nav style={s.nav}>
        <a href="/" style={s.homeLink}>← Home</a>
        <a href="mailto:sid@bidsmith.pro" style={s.navEmail}>sid@bidsmith.pro</a>
      </nav>

      {/* LOGO */}
      <header style={s.header}>
        <img src="/aris-labs.png" alt="ARIS Labs" style={s.logo} />
      </header>

      {/* HERO */}
      <section style={s.hero}>
        <p style={s.eyebrow}>ARIS Labs: BidSmith — Contracting Made Better</p>
        <h1 style={s.headline}>
          Eliminating AI Debt<br />for High-Stakes Enterprise.
        </h1>
        <p style={s.sub}>
          Stateless architecture and deterministic logic —
          built for federal and regulated environments.
        </p>
      </section>

      <div style={s.rule} />

      {/* SERVICES */}
      <section style={s.servicesSection}>
        <p style={s.sectionLabel}>Services</p>
        <div style={s.servicesGrid}>
          {services.map((svc) => (
            <div key={svc.index} style={s.serviceCard}>
              <span style={s.serviceIndex}>{svc.index}</span>
              <div style={s.serviceBody}>
                <div style={s.serviceTop}>
                  <h2 style={s.serviceTitle}>{svc.title}</h2>
                  <span style={s.servicePrice}>{svc.price}</span>
                </div>
                <p style={s.serviceValue}>{svc.value}</p>
                <p style={s.serviceDeliverable}>
                  <span style={s.deliverableLabel}>Deliverable — </span>
                  {svc.deliverable}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={s.rule} />

      {/* CONTACT */}
      <section style={s.contactSection}>
        <div style={s.contactLeft}>
          <p style={s.sectionLabel}>Direct to Founder</p>
          <h2 style={s.contactHeadline}>
            No sales calls.<br />No discovery decks.
          </h2>
          <p style={s.contactSub}>
            Sid reviews every inquiry personally.
            Response within 4 hours.
          </p>
          <div style={s.contactMeta}>
            <span style={s.metaLine}>Sid Porwal — Founder, ARIS Labs</span>
            <a href="https://www.linkedin.com/company/aris-labs/" target="_blank" rel="noreferrer" style={s.metaLink}>LinkedIn</a>
            <a href="https://bidsmith.pro" target="_blank" rel="noreferrer" style={s.metaLink}>bidsmith.pro</a>
          </div>
        </div>

        <div style={s.contactRight}>
          <iframe
            src={TYPEFORM_URL}
            title="ARIS Labs Contact"
            style={s.iframe}
            frameBorder="0"
            allow="camera; microphone; autoplay; encrypted-media;"
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <span>ARIS Labs</span>
        <span style={s.footerDot}>·</span>
        <span>Institutional AI Engineering</span>
        <span style={s.footerDot}>·</span>
        <a href="mailto:sid@bidsmith.pro" style={s.footerLink}>sid@bidsmith.pro</a>
      </footer>

      {/* MOBILE STYLES */}
      <style>{`
        @media (max-width: 768px) {
          .aris-contact-section {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .aris-service-card {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .aris-service-top {
            flex-direction: column !important;
            gap: 4px !important;
          }
        }
      `}</style>

    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#FAFAF8',
    color: '#1a1a1a',
    fontFamily: '"Georgia", "Times New Roman", serif',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: '1px solid #eeede9',
  },
  homeLink: {
    fontSize: 12,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    color: '#888',
    textDecoration: 'none',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  navEmail: {
    fontSize: 12,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#aaa',
    textDecoration: 'none',
    letterSpacing: '0.03em',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    padding: '52px 32px 0',
  },
  logo: {
    height: 64,
    opacity: 0.92,
  },
  hero: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '56px 32px 60px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#999',
    marginBottom: 24,
    margin: '0 0 24px',
  },
  headline: {
    fontSize: 'clamp(32px, 6vw, 58px)',
    fontWeight: 400,
    lineHeight: 1.1,
    color: '#0f0f0f',
    letterSpacing: '-0.02em',
    margin: '0 0 24px',
  },
  sub: {
    fontSize: 16,
    color: '#777',
    lineHeight: 1.75,
    fontStyle: 'italic',
    margin: 0,
    maxWidth: 520,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  rule: {
    width: '100%',
    height: 1,
    background: '#e4e4e0',
  },
  servicesSection: {
    maxWidth: 880,
    margin: '0 auto',
    padding: '64px 32px',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#bbb',
    margin: '0 0 44px',
  },
  servicesGrid: {
    display: 'flex',
    flexDirection: 'column',
  },
  serviceCard: {
    display: 'flex',
    gap: 36,
    padding: '40px 0',
    borderBottom: '1px solid #e8e8e4',
    alignItems: 'flex-start',
  },
  serviceIndex: {
    fontSize: 11,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    color: '#ccc',
    letterSpacing: '0.08em',
    minWidth: 24,
    paddingTop: 5,
    flexShrink: 0,
  },
  serviceBody: {
    flex: 1,
  },
  serviceTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
    gap: 16,
    flexWrap: 'wrap',
  },
  serviceTitle: {
    fontSize: 'clamp(18px, 2.5vw, 24px)',
    fontWeight: 400,
    color: '#0f0f0f',
    margin: 0,
    letterSpacing: '-0.015em',
  },
  servicePrice: {
    fontSize: 13,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    color: '#666',
    whiteSpace: 'nowrap',
    letterSpacing: '0.03em',
  },
  serviceValue: {
    fontSize: 15,
    color: '#555',
    lineHeight: 1.75,
    margin: '0 0 16px',
    fontStyle: 'italic',
    maxWidth: 640,
  },
  serviceDeliverable: {
    fontSize: 12,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#aaa',
    margin: 0,
    letterSpacing: '0.01em',
    lineHeight: 1.5,
  },
  deliverableLabel: {
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: 9,
    color: '#ccc',
  },
  contactSection: {
    maxWidth: 880,
    margin: '0 auto',
    padding: '64px 32px',
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: 72,
    alignItems: 'start',
  },
  contactLeft: {},
  contactHeadline: {
    fontSize: 'clamp(24px, 3.5vw, 36px)',
    fontWeight: 400,
    color: '#0f0f0f',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    margin: '16px 0 20px',
  },
  contactSub: {
    fontSize: 15,
    color: '#777',
    lineHeight: 1.75,
    fontStyle: 'italic',
    margin: '0 0 36px',
  },
  contactMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  metaLine: {
    fontSize: 13,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#444',
    fontWeight: 500,
  },
  metaLink: {
    fontSize: 12,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#999',
    textDecoration: 'none',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #e0e0da',
    paddingBottom: 2,
    width: 'fit-content',
  },
  contactRight: {},
  iframe: {
    width: '100%',
    height: 540,
    border: '1px solid #e4e4e0',
    borderRadius: 6,
    background: '#fff',
  },
  footer: {
    borderTop: '1px solid #e4e4e0',
    padding: '28px 32px',
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    fontSize: 10,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#bbb',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  footerDot: {
    color: '#ddd',
  },
  footerLink: {
    color: '#bbb',
    textDecoration: 'none',
  },
};
