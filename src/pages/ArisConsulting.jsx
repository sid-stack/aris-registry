import React from 'react';

const TYPEFORM_URL = "YOUR_TYPEFORM_URL_HERE"; // replace with your Typeform embed URL

const services = [
  {
    index: "01",
    title: "Infrastructure Audit",
    price: "$1,800",
    value: "Identify data residency leaks and hallucination risks in your RAG pipeline.",
    deliverable: "48-hour Technical Safeguard Report",
  },
  {
    index: "02",
    title: "Stateless Bridge Implementation",
    price: "$5,000+",
    value: "Decouple core business logic from the LLM layer for Federal and FinTech compliance.",
    deliverable: "Production-ready deployment on FastAPI / Railway",
  },
  {
    index: "03",
    title: "MCP Registry & Tool Injection",
    price: "Custom",
    value: "Move from chat-wrappers to deterministic agents with real-time tool access.",
    deliverable: "Custom Model Context Protocol server",
  },
];

export default function ArisConsulting() {
  return (
    <div style={s.page}>

      {/* LOGO */}
      <header style={s.header}>
        <img src="/aris-labs.png" alt="ARIS Labs" style={s.logo} />
      </header>

      {/* HERO */}
      <section style={s.hero}>
        <p style={s.eyebrow}>Sovereign AI Infrastructure</p>
        <h1 style={s.headline}>
          Eliminating AI Debt<br />for High-Stakes Enterprise.
        </h1>
        <p style={s.sub}>
          Stateless bridge architecture and deterministic logic —<br />
          built for federal and regulated environments.
        </p>
      </section>

      {/* DIVIDER */}
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
                  <span style={s.deliverableLabel}>Deliverable</span>{" "}
                  {svc.deliverable}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div style={s.rule} />

      {/* CONTACT */}
      <section style={s.contactSection}>
        <div style={s.contactLeft}>
          <p style={s.sectionLabel}>Direct to Founder</p>
          <h2 style={s.contactHeadline}>
            No sales calls.<br />No discovery decks.
          </h2>
          <p style={s.contactSub}>
            Sid reviews every inquiry personally.<br />
            Response within 4 hours.
          </p>
          <div style={s.contactMeta}>
            <span style={s.metaLine}>Sid Porwal — Founder, ARIS Labs</span>
            <a href="https://www.linkedin.com/company/aris-labs/" target="_blank" rel="noreferrer" style={s.metaLink}>LinkedIn</a>
            <a href="https://bidsmith.pro" target="_blank" rel="noreferrer" style={s.metaLink}>bidsmith.pro</a>
          </div>
        </div>

        <div style={s.contactRight}>
          {TYPEFORM_URL === "YOUR_TYPEFORM_URL_HERE" ? (
            <div style={s.formPlaceholder}>
              <p style={s.placeholderText}>Typeform embed will appear here.</p>
              <p style={s.placeholderSub}>Paste your Typeform URL to activate.</p>
            </div>
          ) : (
            <iframe
              src={TYPEFORM_URL}
              title="ARIS Labs Contact"
              style={s.iframe}
              frameBorder="0"
              allow="camera; microphone; autoplay; encrypted-media;"
            />
          )}
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
  header: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px 40px 0',
  },
  logo: {
    height: 36,
    opacity: 0.9,
  },
  hero: {
    maxWidth: 780,
    margin: '0 auto',
    padding: '72px 40px 64px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: 28,
  },
  headline: {
    fontSize: 'clamp(36px, 5vw, 60px)',
    fontWeight: 400,
    lineHeight: 1.12,
    color: '#0f0f0f',
    letterSpacing: '-0.02em',
    margin: '0 0 28px',
  },
  sub: {
    fontSize: 17,
    color: '#666',
    lineHeight: 1.7,
    fontStyle: 'italic',
    margin: 0,
  },
  rule: {
    width: '100%',
    height: 1,
    background: '#e4e4e0',
  },
  servicesSection: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '72px 40px',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#aaa',
    marginBottom: 48,
  },
  servicesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  serviceCard: {
    display: 'flex',
    gap: 40,
    padding: '36px 0',
    borderBottom: '1px solid #e4e4e0',
    alignItems: 'flex-start',
  },
  serviceIndex: {
    fontSize: 11,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    color: '#bbb',
    letterSpacing: '0.08em',
    minWidth: 28,
    paddingTop: 4,
  },
  serviceBody: {
    flex: 1,
  },
  serviceTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 16,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: 400,
    color: '#0f0f0f',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  servicePrice: {
    fontSize: 13,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    color: '#444',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
  serviceValue: {
    fontSize: 15,
    color: '#555',
    lineHeight: 1.65,
    margin: '0 0 12px',
    fontStyle: 'italic',
  },
  serviceDeliverable: {
    fontSize: 12,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#999',
    margin: 0,
    letterSpacing: '0.01em',
  },
  deliverableLabel: {
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: 10,
    color: '#bbb',
    marginRight: 4,
  },
  contactSection: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '72px 40px',
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: 80,
    alignItems: 'start',
  },
  contactLeft: {},
  contactHeadline: {
    fontSize: 'clamp(26px, 3vw, 38px)',
    fontWeight: 400,
    color: '#0f0f0f',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    margin: '16px 0 20px',
  },
  contactSub: {
    fontSize: 15,
    color: '#666',
    lineHeight: 1.7,
    fontStyle: 'italic',
    margin: '0 0 36px',
  },
  contactMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
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
    color: '#888',
    textDecoration: 'none',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #ddd',
    paddingBottom: 1,
    width: 'fit-content',
  },
  contactRight: {},
  iframe: {
    width: '100%',
    height: 520,
    border: '1px solid #e4e4e0',
    borderRadius: 4,
    background: '#fff',
  },
  formPlaceholder: {
    height: 520,
    border: '1px dashed #d0d0cc',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#aaa',
    margin: 0,
  },
  placeholderSub: {
    fontSize: 12,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#ccc',
    margin: 0,
  },
  footer: {
    borderTop: '1px solid #e4e4e0',
    padding: '28px 40px',
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    fontSize: 11,
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    color: '#aaa',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  footerDot: {
    color: '#ddd',
  },
  footerLink: {
    color: '#aaa',
    textDecoration: 'none',
  },
};
