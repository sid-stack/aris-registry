import {
  Rocket,
  CheckCircle2,
  PiggyBank,
  PlugZap,
  Search,
  KeyRound,
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FaqSection from "../components/FaqSection";
import "./Landing.css";
import { trackEvent } from "../utils/analytics";
import PricingCard from "../components/PricingCard";
import { trackKPI } from "../lib/analytics";
import { GTM_PRICING_PLANS } from "../lib/pricing";
import { createCheckoutSession } from "../lib/stripe";
import Proposal from "./Proposal";

const benefits = [
  {
    title: "Zero Token Trust",
    description: "Built on ARIS Zero Token. We never save your data or store your contract bids—ever.",
    icon: <BadgeCheck size={42} color="#4338ca" />,
  },
  {
    title: "Stateless Bridge",
    description: "Your competitive intel runs via a stateless bridge. No caching, no leak surface.",
    icon: <Rocket size={42} color="#4338ca" />,
  },
  {
    title: "Audit Rigor",
    description: "Far/DFARS extraction and risk weighting using Aris audit protocols.",
    icon: <FileText size={42} color="#4338ca" />,
  },
  {
    title: "Capture Intel",
    description: "The ARIS-SDK was built for this: independent audit data without the data liability.",
    icon: <Search size={42} color="#4338ca" />,
  },
];

const steps = [
  {
    title: "Handshake",
    description: "Aris issues a short-lived Zero Token so you connect without exposing your full payload.",
    icon: <KeyRound size={42} color="#4f46e5" />,
  },
  {
    title: "Bridge",
    description: "Analyzes occur over a stateless bridge—we route the request but never store a byte.",
    icon: <Rocket size={42} color="#4f46e5" />,
  },
  {
    title: "Purge",
    description: "Upon SUCCESS, all session data is purged. Your bid stays private, local, and secure.",
    icon: <BadgeCheck size={42} color="#4f46e5" />,
  },
];

const heroStats = [
  { label: "Avg. draft turnaround", value: "< 10 min" },
  { label: "Pilot compliance accuracy", value: "95%+" },
  { label: "Implementation window", value: "30 days" },
];

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

export default function Landing({ onEnterApp, onViewSample }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [viewingSample, setViewingSample] = useState(false);
  const [sampleReport, setSampleReport] = useState(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchSampleReport = async () => {
    setLoadingSample(true);
    trackEvent("view_sample_report_click", { source: "landing_hero" });
    try {
      const response = await fetch("https://api.bidsmith.pro/api/sample-report");
      if (!response.ok) throw new Error("Failed to fetch sample report");
      const data = await response.json();
      setSampleReport(data);
      setViewingSample(true);
    } catch (error) {
      console.error("Error fetching sample report:", error);
      alert("Unable to load demo report. Please try again.");
    } finally {
      setLoadingSample(false);
    }
  };

  const handleBackToLanding = () => {
    setViewingSample(false);
    setSampleReport(null);
  };

  const openCheckout = async (source, plan) => {
    if (isProcessing) return;
    setIsProcessing(true);
    trackEvent("checkout_click", { source, plan_name: plan.title || plan.key || "trial" });
    const successUrl = `${window.location.origin}/?checkout=success&plan=${plan.key}`;
    const cancelUrl = `${window.location.origin}/?checkout=cancelled&plan=${plan.key}`;

    try {
      const url = await createCheckoutSession(plan.key, successUrl, cancelUrl);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      trackEvent("checkout_error", {
        source,
        plan_name: plan.title || plan.key || "trial",
        message: error instanceof Error ? error.message : "checkout_failed",
      });
      window.alert("Unable to start checkout right now. Please try again in a minute.");
    } finally {
      window.setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleStartTrial = () => {
    trackEvent("start_free_trial_click", { source: "landing_hero" });
    trackKPI("trial_click", { source: "landing_hero" });
    openCheckout("landing_hero", GTM_PRICING_PLANS[0]);
  };

  const handleWorkspaceOpen = () => {
    trackEvent("open_workspace_click", { source: "landing_hero" });
    onEnterApp();
  };

  const handlePilotCta = () => {
    trackKPI("pilot_cta", { source: "landing_pricing_banner" });
    openCheckout("landing_pilot_banner", GTM_PRICING_PLANS[2]);
  };

  const handleEnterpriseContact = (event) => {
    event.preventDefault();
    if (!contactEmail.trim()) return;

    trackKPI("enterprise_contact", { source: "landing_enterprise_form" });
    window.location.href = `mailto:sid@bidsmith.pro?subject=Enterprise%20Plan%20Inquiry&body=Contact%20email:%20${encodeURIComponent(contactEmail.trim())}`;
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
      {viewingSample && sampleReport ? (
        <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
          <div style={{ ...styles.navbar, position: "relative" }}>
            <div style={{ ...styles.navInner, justifyContent: isMobile ? "center" : "space-between" }}>
              <button
                onClick={handleBackToLanding}
                style={{
                  ...styles.secondaryCta,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: isMobile ? 12 : undefined,
                  padding: isMobile ? "6px 10px" : undefined
                }}
              >
                <ArrowLeft size={16} />
                {isMobile ? "Back" : "Back to Home"}
              </button>
              {!isMobile && (
                <span style={{ marginLeft: "auto", color: "#4f46e5", fontWeight: 600 }}>
                  Demo: DLA Energy Solicitation
                </span>
              )}
            </div>
          </div>
          <Proposal
            proposal={{
              document_metadata: {
                agency: sampleReport.agency,
                solicitation_number: sampleReport.pillars?.solicitation_id?.value,
                naics_code: sampleReport.pillars?.naics_code?.value,
                set_aside_type: sampleReport.pillars?.set_aside_type?.value,
              },
              submission_details: {
                deadline: sampleReport.pillars?.deadline_date?.value,
                days_until_deadline: null,
                page_limit: null,
              },
              evaluation_summary: {
                evaluation_factors: [],
                lowest_price_technically_acceptable: false,
              },
              compliance_summary: {
                bid_score: 85,
                high_risk_count: 2,
                mandatory_requirements: 12,
                review_required_count: 1,
              },
              requirements: [],
              gaps: sampleReport.risk_flags?.map((flag, i) => ({
                severity: "Medium",
                gap_reason: flag,
                recommended_action: "Review in compliance matrix",
              })) || [],
              far_clauses_detected: [],
              confidence_metrics: {
                validator_flagged: false,
                extraction_confidence: 0.95,
              },
            }}
            onReset={handleBackToLanding}
          />
          <div className="sample-report-container">
            <div className="sample-report-panel" style={{ background: "#ffffff", border: "1px solid #e5e5e5", borderRadius: 8, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600 }}>Sample Compliance Report</h3>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                p: ({ children }) => <p style={{ marginBottom: 14, lineHeight: 1.6, color: "#334155" }}>{children}</p>,
                h1: ({ children }) => <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20, marginBottom: 10, color: "#1e40af" }}>{children}</h2>,
                table: ({ children }) => <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>{children}</table></div>,
                th: ({ children }) => <th style={{ background: "#f8fafc", padding: "10px 12px", border: "1px solid #e2e8f0", fontWeight: 600, textAlign: "left" }}>{children}</th>,
                td: ({ children }) => <td style={{ padding: "10px 12px", border: "1px solid #e2e8f0", color: "#334155" }}>{children}</td>,
                blockquote: ({ children }) => <blockquote style={{ margin: "12px 0", padding: "12px 16px", background: "#eff6ff", borderLeft: "3px solid #3b82f6", color: "#1e40af", fontStyle: "italic" }}>{children}</blockquote>,
              }}>
                {sampleReport.compliance_report}
              </ReactMarkdown>
            </div>
            <div className="sample-report-panel" style={{ background: "#ffffff", border: "1px solid #e5e5e5", borderRadius: 8 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600 }}>Risk Memorandum</h3>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                p: ({ children }) => <p style={{ marginBottom: 14, lineHeight: 1.6, color: "#334155" }}>{children}</p>,
                h1: ({ children }) => <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 20, marginBottom: 10, color: "#1e40af" }}>{children}</h2>,
                table: ({ children }) => <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>{children}</table></div>,
                th: ({ children }) => <th style={{ background: "#f8fafc", padding: "10px 12px", border: "1px solid #e2e8f0", fontWeight: 600, textAlign: "left" }}>{children}</th>,
                td: ({ children }) => <td style={{ padding: "10px 12px", border: "1px solid #e2e8f0", color: "#334155" }}>{children}</td>,
                blockquote: ({ children }) => <blockquote style={{ margin: "12px 0", padding: "12px 16px", background: "#eff6ff", borderLeft: "3px solid #3b82f6", color: "#1e40af", fontStyle: "italic" }}>{children}</blockquote>,
              }}>
                {sampleReport.proposal_draft}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header style={styles.navbar}>
            <div style={styles.navInner}>
              <a href="/" style={styles.brand}>
                <img src="/aris-logo.png" alt="Aris" style={{ height: 22, width: 22, objectFit: "contain" }} />
                <span>BidSmith</span>
              </a>
              <nav className="landing-nav-links">
                <a href="#features" style={styles.navLink}>Features</a>
                <a href="#workflow" style={styles.navLink}>Workflow</a>
                <a href="#pricing" style={styles.navLink}>Pricing</a>
                <a href="https://docs.bidsmith.pro" target="_blank" rel="noopener noreferrer" style={styles.navLink}>Docs</a>
                <a href="#contact" style={styles.navLink}>Contact</a>
              </nav>
              <button
                type="button"
                aria-label="Start free trial checkout"
                style={styles.navCta}
                onClick={handleStartTrial}
                disabled={isProcessing}
              >
                Start Free
              </button>
            </div>
          </header>
          <section className="landing-hero">
            <div style={styles.heroGlowTop} />
            <div style={styles.heroGlowBottom} />
            <div style={styles.heroInner}>
              <p style={styles.heroKicker}>Zero Token Security · Stateless Bridge</p>
              <img
                src="/aris-logo.png"
                alt="BidSmith logo"
                style={styles.logo}
              />
              <h1 style={styles.title}>We get you Contracts</h1>
              <p style={styles.subtitle}>
                Trust built on the ARIS Zero Token architecture. We don't save your data or store your contract bids. 
                Everything runs via a stateless bridge—this is the moat that powers the BidSmith audit.
              </p>
              <div style={styles.heroActions}>
                <button
                  type="button"
                  aria-label="Start free seven day trial"
                  style={{
                    ...styles.primaryCta,
                    ...(isProcessing ? styles.disabledButton : {}),
                  }}
                  onClick={handleStartTrial}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Start Free 7-Day Trial"}
                </button>
                <button
                  type="button"
                  aria-label="Open analyst workspace"
                  onClick={handleWorkspaceOpen}
                  style={styles.secondaryCta}
                  disabled={isProcessing}
                >
                  Open Analyst Workspace
                </button>
                <button
                  type="button"
                  aria-label="View demo sample report"
                  onClick={() => window.open("/sam-rep", "_blank", "noopener,noreferrer")}
                  style={styles.demoCta}
                  disabled={isProcessing}
                >
                  <FileText size={16} style={{ marginRight: 6 }} />
                  View Demo Report
                </button>
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
          </section>

          <section id="activity" style={styles.sectionMuted} data-reveal>
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

          <section id="features" style={styles.sectionMuted} data-reveal>
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
              <p style={styles.subtitleSmall}>No contracts, no hidden fees, and a clear plan progression.</p>
              <div style={styles.pricingGrid}>
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
                      if (plan.key === "enterprise") {
                        trackKPI("enterprise_contact", { source: "landing_pricing_card" });
                        window.location.href = "mailto:sid@bidsmith.pro?subject=Enterprise%20Plan%20Inquiry";
                        return;
                      }
                      openCheckout("landing_pricing", plan);
                    }}
                  />
                ))}
              </div>
              <form onSubmit={handleEnterpriseContact} style={styles.enterpriseForm}>
                <label htmlFor="enterprise-email" style={styles.enterpriseLabel}>Enterprise: contact sales</label>
                <input
                  id="enterprise-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="you@company.com"
                  style={styles.enterpriseInput}
                />
                <button type="submit" style={styles.planButton} aria-label="Contact enterprise sales">
                  Contact Sales
                </button>
              </form>
              <p style={styles.proposalCopy}>
                Need a client-ready pilot deck? See{" "}
                <a
                  href="/pilot-proposal-outline.md"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.inlineLink}
                  onClick={() =>
                    trackEvent("pilot_outline_open_click", { source: "landing_pricing" })
                  }
                >
                  pilot proposal outline
                </a>
                .
              </p>
            </div>
          </section>

          <FaqSection />

          <footer id="contact" style={styles.footer}>
            <div style={styles.footerInner}>
              <div>
                <p style={styles.footerBrand}>BidSmith</p>
                <p style={styles.footerText}>Copyright 2026 Bidsmith Ltd. All rights reserved.</p>
                <a
                  href="mailto:sid@bidsmith.pro"
                  style={styles.footerLink}
                  onClick={() => trackEvent("support_email_click", { source: "landing_footer" })}
                >
                  sid@bidsmith.pro
                </a>
              </div>
              <div>
                <p style={styles.footerHeading}>Company</p>
                <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
                <a href="/terms" style={styles.footerLink}>Terms of Service</a>
                <a href="/cookies" style={styles.footerLink}>Cookie Policy</a>
                <a href="/docs" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Developer Docs</a>
              </div>
              <div>
                <p style={styles.footerHeading}>Template Library</p>
                <a
                  href="/templates"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.footerLink}
                  onClick={() => trackEvent("templates_link_click", { source: "landing_footer" })}
                >
                  Outreach & Agreement Templates
                </a>
                <a href="/pilot-proposal-outline.md" target="_blank" rel="noreferrer" style={styles.footerLink}>
                  Pilot Proposal Outline
                </a>
                <a href="#pricing" style={styles.footerLink}>Pricing Plans</a>
              </div>
            </div>
          </footer>
        </>
      )}
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
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "nowrap",
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
    background: "#09090b",
    color: "#e4e4e7",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "0.78rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontWeight: 700,
    borderRadius: 999,
    padding: "6px 12px",
  },
  title: { margin: 0, fontSize: "clamp(2rem, 6vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#ffffff" },
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
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: 10,
    padding: "12px 22px",
    border: "1px solid #4338ca",
    cursor: "pointer",
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
    color: "#4f46e5",
    fontWeight: 600,
    borderRadius: 10,
    padding: "12px 22px",
    border: "1px solid #4f46e5",
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
    color: "#4f46e5",
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
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
  planCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 8px 18px rgba(15,23,42,0.03)",
  },
  planTitle: { margin: 0, fontSize: "1.2rem" },
  planPrice: { margin: "10px 0 12px", fontSize: "2rem", color: "#4f46e5", fontWeight: 700 },
  planButton: {
    marginTop: 16,
    display: "inline-block",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 600,
    borderRadius: 10,
    padding: "10px 18px",
    border: "1px solid #4338ca",
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
  enterpriseForm: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  enterpriseLabel: {
    fontSize: "0.85rem",
    color: "#334155",
    fontWeight: 600,
  },
  enterpriseInput: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "9px 12px",
    minWidth: 220,
  },
  inlineLink: { color: "#4338ca", textDecoration: "none", fontWeight: 600 },
  footer: {
    background: "#0f172a",
    borderTop: "1px solid #1e293b",
    padding: "34px 20px 80px", /* Extra bottom padding for readability */
  },
  footerInner: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 22,
  },
  footerBrand: { margin: "0 0 8px", color: "#ffffff", fontWeight: 800, fontSize: "1.1rem" },
  footerText: { margin: "0 0 8px", color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.5 },
  footerHeading: { margin: "0 0 10px", color: "#cbd5e1", fontWeight: 700, fontSize: "0.9rem" },
  footerLink: {
    color: "#e2e8f0",
    textDecoration: "none",
    fontSize: "0.92rem",
    display: "block",
    marginBottom: 8,
  },
};
