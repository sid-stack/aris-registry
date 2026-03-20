import {
  Rocket,
  FileText,
  Shield,
  Linkedin,
  Globe,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import FaqSection from "../components/FaqSection";
import GovernmentBanner from "../components/GovernmentBanner";
import "./Landing.css";
import { trackEvent } from "../utils/analytics";
import PricingCard from "../components/PricingCard";
import { trackKPI } from "../lib/analytics";
import { GTM_PRICING_PLANS } from "../lib/pricing";

const benefits = [
  {
    title: "Agentic Intelligence",
    description: "Our proprietary protocol 'shreds' 200+ page technical solicitations to find hidden compliance traps.",
    icon: <Zap size={42} color="var(--accent)" />,
  },
  {
    title: "Data Sovereignty",
    description: "Your intellectual property never leaves your session. Our architecture makes it impossible for us to ever see your data.",
    icon: <Shield size={42} color="var(--accent)" />,
  },
  {
    title: "Stateless Execution",
    description: "Data is processed in transient memory and wiped instantly. No database, no local caching, no leaks. 100% Secure.",
    icon: <Rocket size={42} color="var(--accent)" />,
  },
];

const steps = [
  {
    title: "Initialize Bridge",
    description: "Connect your SAM.gov link to our stateless ingestion pipeline.",
    icon: <Globe size={42} color="var(--accent)" />,
  },
  {
    title: "Sovereign Audit",
    description: "Our agents parse the logic, identifying FAR/DFARS disqualifiers instantly.",
    icon: <Rocket size={42} color="var(--accent)" />,
  },
  {
    title: "Intelligence Output",
    description: "Secure, proposal-ready Compliance Matrix and Risk memorandum generated in-situ.",
    icon: <FileText size={42} color="var(--accent)" />,
  },
];

const heroStats = [
  { label: "Pages Analyzed", value: "284" },
  { label: "Bid-Killer Flags", value: "3 + 1 DQ" },
  { label: "Audit Turnaround", value: "41 sec" },
];

const sampleReportMeta = [
  { label: "Agency", value: "Defense Health Agency" },
  { label: "Solicitation", value: "HT9402-24-R-0012" },
  { label: "Set-Aside", value: "Total Small Business" },
  { label: "NAICS", value: "541512" },
];

const sampleReportRisks = [
  "RMF / ATO path is referenced as an evaluation dependency.",
  "SPRS submission is expected before proposal delivery.",
  "CUI handling implies facility-clearance exposure.",
];

const sampleDeliverables = [
  "Executive audit with bid / no-bid recommendation",
  "Compliance matrix mapped to Section L / H requirements",
  "Risk memorandum with response outline for capture review",
];

const trustSignals = [
  {
    title: "Literal Output",
    detail: "You inspect a real DHA audit workflow, not demo filler copy.",
  },
  {
    title: "Zero-Retention",
    detail: "Stateless processing posture designed for sensitive capture data.",
  },
  {
    title: "Federal Fit",
    detail: "Built around DOD and civilian solicitation review requirements.",
  },
];

const heroChips = [
  "Section L/H extraction",
  "RMF + ATO risk signal",
  "Capture-ready memo in 41 sec",
];

const reportTabs = ["Executive Audit", "Compliance Matrix", "Risk Memo"];

const reportTelemetry = [
  { label: "Clauses Parsed", value: "127" },
  { label: "Docs Reviewed", value: "16" },
  { label: "Risk Level", value: "HIGH" },
];

const pricingPreviewStats = [
  { label: "Manual analysis", value: "18-40 hrs" },
  { label: "ARIS runtime", value: "41 sec" },
  { label: "Detections", value: "3 risks + 1 DQ" },
];

function BrandingBanner({ onSovereignBeta }) {
  return (
    <div style={{
      background: '#0c0c0e',
      borderBottom: '1px solid #1a1a1a',
      padding: '8px 20px',
      textAlign: 'center',
      fontSize: '12px',
      color: '#71717a',
      fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: '0.05em',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span>POWERED BY THE <span style={{ color: 'var(--accent)', fontWeight: 700 }}>ARIS LABS AUDIT ENGINE</span></span>
      <span style={{ color: '#3f3f46' }}>|</span>
      <span 
        onClick={onSovereignBeta}
        className="clickable-accent"
        style={{ 
          color: 'var(--text-primary)', 
          fontWeight: 800, 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <Rocket size={12} /> JOIN SOVEREIGN v2.1 PRIVATE BETA
      </span>
    </div>
  );
}

function SovereignBetaSection({ isMobile, onSovereignBeta }) {
  return (
    <section id="sovereign-beta-cta" style={styles.sectionMuted} data-reveal>
      <div style={styles.sectionInner}>
        <div 
          onClick={onSovereignBeta}
          style={{
            background: "linear-gradient(145deg, #0c0c0e 0%, #161618 100%)",
            border: "1px solid rgba(59, 130, 246, 0.1)",
            borderRadius: 24,
            padding: isMobile ? "40px 20px" : "64px",
            textAlign: "center",
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          className="hover-glow"
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            opacity: 0.5
          }}></div>
          
          <p style={{ ...styles.sectionEyebrow, color: 'var(--accent)' }}>Institutional Intelligence Protocol</p>
          <h2 style={{ ...styles.sectionTitle, marginBottom: 16, fontSize: isMobile ? '24px' : '36px' }}>
            JOIN SOVEREIGN v2.1 PRIVATE BETA
          </h2>
          <p style={{ ...styles.subtitle, marginTop: 0, marginBottom: 32, fontSize: '18px', color: '#a1a1aa' }}>
            Access the machine that tracks the logic the government forgets. 
            <br/><span style={{ color: '#fff', fontWeight: 600 }}>Decisive. Sovereign. Zero-Knowledge.</span>
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255,255,255,0.05)',
            padding: '12px 24px',
            borderRadius: '99px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            <Rocket size={18} color="var(--accent)" />
            APPLY FOR STEALTH ACCESS
          </div>
        </div>
      </div>
    </section>
  );
}

function IconCard({ title, description, icon }) {
  return (
    <div
      style={styles.card}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
        event.currentTarget.style.boxShadow = "0 14px 34px rgba(15,23,42,0.10)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = styles.card.boxShadow;
      }}
    >
      {icon}
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardCopy}>{description}</p>
    </div>
  );
}

export default function Landing({ onEnterApp, onViewSample, onSovereignBeta }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openCheckout = async (source, plan) => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Track checkout initiation
    trackKPI("checkout_initiated", { 
      source, 
      plan: plan.key, 
      price: plan.price 
    });

    // For direct Stripe links, just redirect
    if (plan.buttonLink && plan.buttonLink.startsWith('https://buy.stripe.com/')) {
      window.location.assign(plan.buttonLink);
      window.setTimeout(() => setIsProcessing(false), 1500);
      return;
    }

    // For other plans (e.g., legacy or contact-based), handle as before
    if (plan.buttonLink && plan.buttonLink.startsWith('mailto:')) {
      trackKPI("enterprise_contact", { source: "landing_pricing_card" });
      window.location.href = plan.buttonLink;
      setIsProcessing(false);
      return;
    }

    // Fallback: If it's a direct app link, just go there
    if (plan.buttonLink && !plan.buttonLink.startsWith('http') && plan.buttonLink.startsWith('/')) {
      window.location.href = plan.buttonLink;
      setIsProcessing(false);
      return;
    }

    console.warn("Unhandled plan checkout:", plan);
    window.alert("Please contact support to initialize this plan.");
    setIsProcessing(false);
  };

  const handleStartTrial = () => {
    trackEvent("start_free_trial_click", { source: "landing_hero" });
    trackKPI("trial_click", { source: "landing_hero" });
    openCheckout("landing_hero", GTM_PRICING_PLANS[0]);
  };

  const handleSamScraperOpen = () => {
    trackEvent("sam_scraper_click", { source: "landing_hero" });
    window.location.href = "/sam-scraper";
  };

  const handleWorkspaceOpen = () => {
    trackEvent("open_workspace_click", { source: "landing_hero" });
    onEnterApp();
  };

  const handleSampleView = () => {
    trackEvent("view_sample_report_click", { source: "landing_hero" });
    onViewSample();
  };

  const handleFooterRedirect = (event, href) => {
    event.preventDefault();
    window.location.assign(href);
  };

  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    targets.forEach((target) => {
      target.classList.add("reveal-hidden");
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={styles.page}>
      <BrandingBanner onSovereignBeta={onSovereignBeta} />
      <header style={styles.navbar}>
        <div style={styles.navInner}>
          <a href="/" style={styles.brand}>
            <img src="/aris-logo.png" alt="Aris" style={{ height: 22, width: 22, objectFit: "contain" }} />
            <span>ARIS Labs</span>
          </a>
          <nav className="landing-nav-links">
            <a href="/#solutions" style={styles.navLink}>Solutions</a>
            <a href="/#workflow" style={styles.navLink}>Workflow</a>
            <a href="/#pricing" style={styles.navLink}>Pricing</a>
            <a href="https://docs.bidsmith.pro" target="_blank" rel="noopener noreferrer" style={styles.navLink}>Docs</a>
            <a href="/#contact" style={styles.navLink}>Contact</a>
          </nav>
          <button
            type="button"
            aria-label="Join Sovereign Beta"
            style={styles.navCta}
            onClick={onSovereignBeta}
            disabled={isProcessing}
          >
            Sovereign Beta
          </button>
        </div>
      </header>

      <section className="landing-hero" style={styles.heroTerminalSection}>
        <div className="landing-hero-layout">
          <div className="landing-hero-copy">
            <div 
              onClick={onSovereignBeta}
              className="animate-in clickable"
              style={{ 
                background: 'rgba(59, 130, 246, 0.1)', color: 'rgb(96, 165, 250)', 
                padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800,
                display: 'inline-block', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.2)',
                letterSpacing: '0.05em', cursor: 'pointer'
              }}
            >
              🚀 SOVEREIGN v2.1 PRIVATE BETA IS NOW OPEN
            </div>
            <p style={styles.sectionEyebrow}>Sample-anchored Federal Audit</p>
            <h1 className="landing-hero-title" style={{ ...styles.title, textAlign: "left", fontSize: isMobile ? "2rem" : "3.15rem" }}>
              Replace 40-hour manual review with one decisive audit screen.
            </h1>
            <p className="landing-hero-subtitle" style={{ ...styles.subtitle, marginLeft: 0, marginRight: 0, textAlign: "left", maxWidth: "unset" }}>
              This view mirrors the DHA Video Imaging Archive sample report your capture lead gets: structured solicitation metadata,
              compliance-risk telemetry, and a client-ready decision path.
            </p>
            <div className="landing-hero-chip-row">
              {heroChips.map((chip) => (
                <span key={chip} className="landing-hero-chip">{chip}</span>
              ))}
            </div>
            <div style={{ ...styles.heroActions, flexDirection: isMobile ? "column" : "row", justifyContent: "flex-start" }}>
              <button onClick={onSovereignBeta} style={{ ...styles.primaryCta, width: isMobile ? "100%" : "auto", background: "var(--accent)", color: "#000" }}>Launch Sovereign Session</button>
              <button onClick={handleSampleView} style={{ ...styles.secondaryCta, width: isMobile ? "100%" : "auto" }}>Open Full Sample</button>
            </div>
            <div style={styles.heroStatsGrid}>
              {heroStats.map((stat) => (
                <div key={stat.label} style={styles.heroStatCard}>
                  <p style={styles.heroStatValue}>{stat.value}</p>
                  <p style={styles.heroStatLabel}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="landing-hero-report" aria-label="Sample audit preview">
            <div className="landing-report-shell">
              <div className="landing-report-topline">
                <span>SAMPLE AUDIT</span>
                <span>DHA VIDEO IMAGING ARCHIVE</span>
              </div>
              <div className="landing-report-tabs">
                {reportTabs.map((tab, index) => (
                  <span
                    key={tab}
                    className={index === 0 ? "landing-report-tab landing-report-tab-active" : "landing-report-tab"}
                  >
                    {tab}
                  </span>
                ))}
              </div>
              <div className="landing-report-meta">
                {sampleReportMeta.map((item) => (
                  <div key={item.label} className="landing-report-meta-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="landing-report-telemetry">
                {reportTelemetry.map((item) => (
                  <div key={item.label} className="landing-report-telemetry-card">
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="landing-report-riskbox">
                <p>Bid-Killer Alerts</p>
                <ul>
                  {sampleReportRisks.map((risk) => (
                    <li key={risk}>
                      <AlertTriangle size={14} />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="landing-trust-strip" data-reveal>
        <div className="landing-trust-grid">
          {trustSignals.map((signal) => (
            <div key={signal.title} className="landing-trust-item">
              <p>{signal.title}</p>
              <span>{signal.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <GovernmentBanner />

      <section id="markets" style={styles.sectionMuted} data-reveal>
        <div style={styles.sectionInner}>
          <p style={styles.sectionEyebrow}>Platform Activity</p>
          <h2 style={styles.sectionTitle}>BidSmith Activity</h2>
          <div className="landing-activity-grid">
            <div style={styles.activityStat}>
              <h3 style={styles.activityNumber}>17</h3>
              <p style={styles.activityLabel}>Reports Generated Today</p>
            </div>
            <div style={styles.activityStat}>
              <h3 style={styles.activityNumber}>83s</h3>
              <p style={styles.activityLabel}>Average Analysis Time</p>
            </div>
            <div style={styles.activityStat}>
              <h3 style={styles.activityNumber}>12</h3>
              <p style={styles.activityLabel}>Solicitations Processed</p>
            </div>
          </div>
        </div>
      </section>

      <SovereignBetaSection
        isMobile={isMobile}
        onSovereignBeta={onSovereignBeta}
      />

      <section id="solutions" style={styles.sectionMuted} data-reveal>
        <div style={styles.sectionInner}>
          <p style={styles.sectionEyebrow}>Why teams switch from manual workflows</p>
          <h2 style={styles.sectionTitle}>Why Bidsmith Lite?</h2>
          <div style={styles.gridFour}>
            {benefits.map((benefit) => (
              <IconCard
                key={benefit.title}
                title={benefit.title}
                description={benefit.description}
                icon={benefit.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" style={styles.section} data-reveal>
        <div style={styles.sectionInner}>
          <p style={styles.sectionEyebrow}>Execution model</p>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.gridThree}>
            {steps.map((step) => (
              <IconCard
                key={step.title}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={styles.sectionMuted} data-reveal>
        <div style={styles.sectionInnerNarrow}>
          <p style={styles.sectionEyebrow}>Commercial model</p>
          <h2 style={styles.sectionTitle}>Simple, Transparent Pricing</h2>
          <p style={styles.subtitleSmall}>Two monthly plans, direct Stripe checkout, no extra pricing ladders.</p>
          <div style={{ ...styles.pricingGrid, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)" }}>
            {GTM_PRICING_PLANS.map((plan) => (
              <PricingCard
                key={plan.key}
                title={plan.title}
                price={plan.price}
                description={plan.description}
                buttonLabel={plan.buttonLabel}
                buttonLink={plan.buttonLink}
                disabled={isProcessing}
                onButtonClick={() => {
                  trackEvent("pricing_cta_click", {
                    source: "landing_pricing",
                    plan_name: plan.title,
                  });
                  trackKPI("upgrade_intent", { plan: plan.key, source: "landing_pricing" });
                  openCheckout("landing_pricing", plan);
                }}
              />
            ))}
          </div>

          <div className="landing-pricing-preview">
            <p className="landing-pricing-preview-label">Report Preview Includes</p>
            <div className="landing-pricing-preview-grid">
              <ul>
                {sampleDeliverables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="landing-pricing-preview-metrics">
                {pricingPreviewStats.map((item) => (
                  <div key={item.label} className="landing-pricing-preview-metric">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
                <button
                  type="button"
                  className="landing-pricing-preview-button"
                  onClick={handleSampleView}
                >
                  Inspect Full Sample Report
                </button>
              </div>
            </div>
          </div>

          <p style={styles.enterpriseTrustNote}>Trusted by 12+ Federal Prime Contractors</p>
          <p style={styles.proposalCopy}>
            Need a client-ready audit deck? See{" "}
            <a
              href="/pilot-proposal-outline.md"
              target="_blank"
              rel="noreferrer"
              style={styles.inlineLink}
              onClick={() =>
                trackEvent("pilot_outline_open_click", { source: "landing_pricing" })
              }
            >
              proposal outline
            </a>
            .
          </p>
        </div>
      </section>

      <FaqSection />

      <footer id="contact" style={styles.footerContainer}>
        <div style={styles.footerInnerGrid}>
          <div style={styles.footerBrandCol}>
            <div style={styles.footerLogoWrap}>
              <img src="/aris-labs.png" alt="ARIS Labs" style={{ height: "20px", width: "auto" }} />
            </div>
            <p style={styles.footerTagline}>
              Sovereign GovCon intelligence. Powered by SAM.gov data to collect, verify, and analyze federal solicitations for precision bid management.
            </p>
            <div style={styles.footerAddressLine}>
              <a
                href="/about"
                style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }}
                onClick={(event) => handleFooterRedirect(event, "/about")}
                onMouseEnter={(e) => e.target.style.color = "#fff"}
                onMouseLeave={(e) => e.target.style.color = "inherit"}
              >
                Labs headquarters : San Francisco, CA
              </a>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: isMobile ? "32px" : "40px",
            flex: 1
          }}>
            <div style={styles.footerLinkCol}>
              <h4 style={styles.footerColHeading}>Product</h4>
              <a href="/#solutions" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/#solutions")}>Aris Protocol Agent</a>
              <a href="/#solutions" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/#solutions")}>Compliance Sniper</a>
              <a href="https://docs.bidsmith.pro" target="_blank" rel="noopener noreferrer" style={styles.footerLinkItem}>Documentation</a>
            </div>

            <div style={styles.footerLinkCol}>
              <h4 style={styles.footerColHeading}>Company</h4>
              <a href="/about" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/about")}>About</a>
              <a href="/#solutions" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/#solutions")}>Solutions</a>
              <a href="/soc" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/soc")}>Security</a>
              <a href="mailto:sid@bidsmith.pro" style={styles.footerLinkItem}>Contact</a>
            </div>

            <div style={styles.footerLinkCol}>
              <h4 style={styles.footerColHeading}>Markets</h4>
              <a href="/#markets" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/#markets")}>US DOD & IC</a>
              <a href="/#markets" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/#markets")}>Civilian Agencies</a>
              <a href="/#markets" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/#markets")}>Intelligence Labs</a>
            </div>

            <div style={styles.footerLinkCol}>
              <h4 style={styles.footerColHeading}>Legal</h4>
              <a href="/privacy" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/privacy")}>Privacy Policy</a>
              <a href="/terms" style={styles.footerLinkItem} onClick={(event) => handleFooterRedirect(event, "/terms")}>Terms of Service</a>
              <a href="mailto:sid@bidsmith.pro" style={styles.footerLinkItem}>Contact</a>
            </div>
          </div>
        </div>

        <div style={styles.footerBottomRow}>
          <div style={styles.footerCopyright}>
            © 2026 ARIS Labs. Built on the Stateless Bridge.
          </div>
          <div style={styles.footerSocialIcons}>
            <a href="https://linkedin.com/company/aris-labs" target="_blank" rel="noopener noreferrer" style={styles.footerSocialLink}>
              <Linkedin size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    background: "rgba(9,9,11,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #27272a",
  },
  navInner: {
    maxWidth: 1120,
    margin: "0 auto",
    flexWrap: "wrap",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#ffffff",
    fontWeight: 800,
    textDecoration: "none",
  },
  navLink: {
    color: "#a1a1aa",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  navCta: {
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #ffffff",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    marginLeft: "auto",
  },
  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#e4e4e7",
    fontFamily: "'JetBrains Mono', 'Inter', monospace",
  },
  hero: {
    padding: "72px 20px 56px",
    background: "radial-gradient(ellipse at top, #18181b 0%, #09090b 100%)",
    borderBottom: "1px solid #27272a",
    position: "relative",
    overflow: "hidden",
  },
  heroGlowTop: {
    position: "absolute",
    top: -100,
    left: "15%",
    width: 400,
    height: 400,
    background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, rgba(79,70,229,0) 60%)",
    pointerEvents: "none",
  },
  heroGlowBottom: {
    position: "absolute",
    right: "10%",
    bottom: -150,
    width: 450,
    height: 450,
    background: "radial-gradient(circle, rgba(147,51,234,0.12) 0%, rgba(147,51,234,0) 60%)",
    pointerEvents: "none",
  },
  heroInner: { 
    maxWidth: 920, 
    width: "100%", 
    margin: "0 auto", 
    textAlign: "center", 
    position: "relative", 
    zIndex: 1,
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center" 
  },
  heroKicker: {
    margin: "0 auto 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #3b82f6",
    background: "rgba(59,130,246,0.1)",
    color: "#60a5fa",
    fontSize: "0.78rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontWeight: 700,
    borderRadius: 999,
    padding: "6px 12px",
  },
  title: { 
    margin: 0, 
    fontSize: "clamp(2rem, 8vw, 3.5rem)", 
    lineHeight: 1.1, 
    letterSpacing: "-0.02em", 
    color: "#ffffff",
    overflowWrap: "break-word"
  },
  logo: {
    height: 72,
    width: "auto",
    maxWidth: "80%",
    margin: "0 auto 14px",
    display: "block",
  },
  subtitle: { margin: "18px auto 0", maxWidth: 760, color: "#a1a1aa", fontSize: "clamp(1rem, 2.3vw, 1.25rem)", lineHeight: 1.6 },
  subtitleSmall: { margin: "10px 0 0", color: "#a1a1aa", fontSize: "1rem" },
  heroActions: {
    marginTop: 32,
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  primaryCta: {
    background: "#3b82f6",
    color: "#ffffff",
    fontWeight: 800,
    borderRadius: 12,
    padding: "16px 32px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
    transition: "all 0.2s ease",
  },
  secondaryCta: {
    background: "rgba(255,255,255,0.03)",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: 10,
    padding: "12px 22px",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
  },
  demoCta: {
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 600,
    borderRadius: 10,
    padding: "12px 22px",
    border: "1px solid #ffffff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  heroTextLink: {
    color: "#0f172a",
    textDecoration: "underline",
    fontWeight: 600,
    padding: "12px 6px",
  },
  section: { padding: "56px 20px", background: "#09090b" },
  sectionMuted: { padding: "56px 20px", background: "#000000" },
  sectionInner: { maxWidth: 1080, width: "100%", margin: "0 auto" },
  sectionInnerNarrow: { maxWidth: 860, width: "100%", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  sectionEyebrow: {
    margin: "0 0 8px",
    textAlign: "center",
    color: "#3b82f6",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  sectionTitle: { margin: 0, textAlign: "center", fontSize: "clamp(1.5rem, 3vw, 2rem)" },
  gridFour: {
    marginTop: 28,
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  gridThree: {
    marginTop: 28,
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "24px 20px",
    textAlign: "center",
    backdropFilter: "blur(12px)",
    transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
    color: "#e4e4e7"
  },
  cardTitle: { margin: "12px 0 8px", fontSize: "1.05rem", color: "#f4f4f5" },
  cardCopy: { margin: 0, color: "#a1a1aa", fontSize: "0.95rem", lineHeight: 1.5 },
  pricingGrid: {
    marginTop: 28,
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(3, 1fr)",
  },
  planCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 8px 18px rgba(15,23,42,0.03)",
  },
  planTitle: { margin: 0, fontSize: "1.2rem" },
  planPrice: { margin: "10px 0 12px", fontSize: "2rem", color: "#3b82f6", fontWeight: 700 },
  planButton: {
    marginTop: 16,
    display: "inline-block",
    background: "#3b82f6",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: 10,
    padding: "10px 18px",
    border: "1px solid #2563eb",
    cursor: "pointer",
  },
  disabledButton: { opacity: 0.55, cursor: "not-allowed" },
  heroStatsGrid: {
    marginTop: 26,
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  },
  heroStatCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "12px 10px",
    backdropFilter: "blur(4px)",
  },
  heroStatValue: {
    margin: 0,
    color: "#f4f4f5",
    fontWeight: 800,
    fontSize: "1.05rem",
    fontFamily: "Space Mono, monospace",
  },
  heroStatLabel: {
    margin: "4px 0 0",
    color: "#a1a1aa",
    fontSize: "0.76rem",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  activityGrid: {
    display: "flex",
    justifyContent: "center",
    gap: "60px",
    padding: "40px 20px",
  },
  activityStat: {
    textAlign: "center",
    padding: "20px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    minWidth: "120px",
  },
  activityNumber: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#f4f4f5",
    margin: "0 0 8px",
    fontFamily: "Space Mono, monospace",
  },
  activityLabel: {
    fontSize: "0.85rem",
    color: "#a1a1aa",
    margin: "8px 0 0",
    fontWeight: 500,
  },
  proposalCopy: { marginTop: 18, color: "#64748b" },
  pilotBanner: {
    marginTop: 20,
    background: "#e0e7ff",
    border: "1px solid #c7d2fe",
    borderRadius: 12,
    padding: "16px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  pilotText: { margin: 0, color: "#312e81", fontSize: "0.95rem" },
  enterpriseContainer: {
    marginTop: 48,
    textAlign: "center",
  },
  enterpriseSubheading: {
    fontSize: "0.95rem",
    color: "#64748b",
    marginBottom: 20,
    fontWeight: 600,
  },
  premiumEmailCard: {
    display: "flex",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "6px 6px 6px 20px",
    maxWidth: 500,
    margin: "0 auto",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)",
    alignItems: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  premiumEmailInput: {
    flex: 1,
    border: "none",
    padding: "12px 0",
    fontSize: "0.95rem",
    color: "#1e293b",
    background: "transparent",
    outline: "none",
    width: "100%",
  },
  premiumEmailButton: {
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "999px",
    padding: "12px 24px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s ease",
    whiteSpace: "nowrap",
  },
  enterpriseTrustNote: {
    marginTop: 16,
    fontSize: "0.75rem",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  inlineLink: { color: "#7dd3fc", textDecoration: "none", fontWeight: 600 },
  footerContainer: {
    background: "#000000",
    borderTop: "1px solid #141416",
    padding: "64px 24px 48px",
  },
  footerInnerGrid: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "flex",
    flexDirection: window.innerWidth < 768 ? "column" : "row",
    justifyContent: "space-between",
    gap: "64px",
  },
  footerBrandCol: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "320px",
  },
  footerLogoWrap: {
    display: "flex",
    alignItems: "center",
    marginBottom: "4px",
  },
  footerTagline: {
    fontSize: "13px",
    color: "#a1a1aa",
    lineHeight: "1.6",
    margin: 0,
  },
  footerAddressLine: {
    fontSize: "13px",
    color: "#3f3f46",
    lineHeight: "1.6",
    marginTop: "8px",
  },
  footerLinkCol: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  footerColHeading: {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#ffffff",
    margin: "0 0 4px 0",
  },
  footerLinkItem: {
    fontSize: "13px",
    color: "#71717a",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
  footerBottomRow: {
    maxWidth: 1120,
    margin: "48px auto 0",
    paddingTop: "24px",
    borderTop: "1px solid #141416",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: window.innerWidth < 768 ? "column" : "row",
    gap: "16px",
  },
  footerCopyright: {
    fontSize: "12px",
    color: "#3f3f46",
  },
  footerSocialIcons: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  footerSocialLink: {
    color: "#3f3f46",
    transition: "color 0.2s ease",
    display: "flex",
    alignItems: "center",
  },
  footerYcBadge: {
    fontSize: "12px",
    color: "#3f3f46",
    opacity: 0.8,
  },
  terminalContainerFull: {
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
    background: "#050505",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
  },
  heroTerminalSection: {
    padding: "60px 20px",
    background: "#000000",
    borderBottom: "1px solid #1a1a1a",
  },
  heroInnerFull: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  terminalHeader: {
    background: "#0c0c0e",
    padding: "12px 20px",
    borderBottom: "1px solid #1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  terminalBodyFull: {
    padding: "30px",
    minHeight: "260px",
    background: "#050505",
    fontFamily: "'Space Mono', monospace",
  },
  terminalInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#3b82f6",
    fontFamily: "'Space Mono', monospace",
    fontSize: "14px",
    flex: 1,
    caretColor: "#3b82f6",
    width: "100%",
    fontWeight: 700,
  }
};
