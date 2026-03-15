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
  Shield,
  Linkedin,
  Github,
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
import Proposal from "./Proposal";

const benefits = [
  {
    title: "Sovereignty Protocol",
    description: "Built on ARIS Zero Token. We never save your data or store your contract bids—our architecture makes it impossible for us to ever see it.",
    icon: <BadgeCheck size={42} color="#4338ca" />,
  },
  {
    title: "Stateless Execution",
    description: "Your competitive intel runs via a stateless bridge. No database, no local caching, no leak surface.",
    icon: <Rocket size={42} color="#4338ca" />,
  },
  {
    title: "Risk Mitigation",
    description: "FAR/DFARS extraction and precision risk weighting using official Aris labs audit protocols.",
    icon: <FileText size={42} color="#4338ca" />,
  },
  {
    title: "Intelligence Workbench",
    description: "Automate technical narratives and compliance matrices in 90 seconds without the data liability.",
    icon: <Search size={42} color="#4338ca" />,
  },
];

const steps = [
  {
    title: "Aris Protocol Agent",
    description: "Manages the back-and-forth of compliance verification—automatically resolving missing docs and technical discrepancies to deliver high-quality bid sets.",
    icon: <Shield size={42} color="#4f46e5" />,
  },
  {
    title: "Compliance Sniper",
    description: "Agentic Vision AI that reads solicitations the way your best analyst would, then extracts every FAR/DFARS field and flags risk signals with 0 manual input.",
    icon: <FileText size={42} color="#4f46e5" />,
  },
];

const platformMetrics = [
  { label: "Extraction Accuracy", value: "98%" },
  { label: "Processing Speed", value: "<30s", sub: "Per Document" },
  { label: "Compliance Coverage", value: "100+", sub: "Reg Patterns" },
];

const problemPoints = [
  {
    title: "Endless Back-and-Forth",
    description: "Incomplete source documents and missing annexes trigger rounds of tedious verification that drag turnaround times out to weeks.",
  },
  {
    title: "Manual Review",
    description: "Analysts pull data points by hand from complex formats that change across every agency. Human error compounds into slow approval times.",
  },
  {
    title: "No Ground Truth",
    description: "Government solicitation portals can be unstable or confusing. There is no single source of truth to verify compliance against.",
  },
  {
    title: "Legacy Tools Break",
    description: "Legacy OCR fails on scanned PDFs and messy tables. Generic AI misses subtle risk patterns unique to federal contracting.",
  },
];


const heroStats = [
  { label: "Audit Turnaround", value: "4 Hours" },
  { label: "Constraint Accuracy", value: "99%+" },
  { label: "Execution Layer", value: "Stateless" },
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
    
    // Redirect to the app for the Standard Plan
    if (plan.key === "standard") {
      window.location.href = "/app";
      setIsProcessing(false);
      return;
    }

    // For other plans (e.g., Enterprise), handle as before or with mailto
    if (plan.buttonLink && plan.buttonLink.startsWith('mailto:')) {
      trackKPI("enterprise_contact", { source: "landing_pricing_card" });
      window.location.href = plan.buttonLink;
      setIsProcessing(false);
      return;
    }

    // Fallback for any other plans that might have previously used Stripe checkout
    // Since createCheckoutSession is removed, this path should ideally not be reached
    // or should be handled differently (e.g., redirect to a generic signup page)
    console.warn("Attempted to open checkout for a plan without a direct app redirect or mailto link. Plan:", plan);
    window.alert("Unable to process this plan. Please contact support.");
    setIsProcessing(false);
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

  const [pstTime, setPstTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setPstTime(now.toLocaleString('en-US', options) + " PST");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);


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
              <a href="/" className="brand-link" style={styles.brand}>
                <img src="/aris-logo.png" alt="Aris" className="brand-logo" style={{ height: 28, width: 28, objectFit: "contain" }} />
                <span className="brand-name">BidSmith</span>
              </a>
              <nav className="landing-nav-links">
                <a href="#solutions" style={styles.navLink}>Solutions</a>
                <a href="/soc" style={styles.navLink}>Security</a>
                <a href="#markets" style={styles.navLink}>Markets</a>
                <a href="#about" style={styles.navLink}>About</a>
                <a href="https://docs.bidsmith.pro" target="_blank" rel="noopener noreferrer" style={styles.navLink}>Docs</a>
              </nav>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={styles.secondaryNavCta} onClick={handleStartTrial}>Try Aris</button>
                <button style={styles.navCta} onClick={handleEnterpriseContact}>Request Demo</button>
              </div>
            </div>
          </header>

          <section className="landing-hero" style={styles.heroSection}>
            <div style={styles.heroInnerFull}>
              {/* Trust Badge */}
              <div style={styles.ycBadge}>
                <span style={{ fontWeight: 800 }}>ARIS GEN 2</span>
                <span style={{ color: '#52525b', marginLeft: '8px' }}>Sovereign Infrastructure For Federal Intel</span>
              </div>

              <h1 style={styles.megaTitle}>Sovereign Intelligence for Mission-Critical Federal Analysis.</h1>
              <p style={styles.megaSubtitle}>
                Aris streamlines solicitation analysis and transforms messy RFP documents into clean compliance matrices, using best-in-class agentic AI protocols. Cut turnaround times by 90%.
              </p>

              <div style={styles.heroActions}>
                <button onClick={handleEnterpriseContact} style={styles.primaryMegaCta}>Request a Demo</button>
                <button onClick={() => window.open('https://docs.bidsmith.pro', '_blank')} style={styles.secondaryMegaCta}>View Documentation</button>
              </div>

              {/* Stats Bar */}
              <div style={styles.statsBar}>
                {platformMetrics.map((m, i) => (
                  <div key={i} style={styles.statItem}>
                    <div style={styles.statValue}>{m.value}</div>
                    <div style={styles.statLabel}>
                      {m.label}
                      {m.sub && <span style={styles.statSub}>{m.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="solutions" style={styles.sectionDark} data-reveal>
            <div style={styles.sectionInner}>
              <p style={styles.sectionEyebrow}>The Problem</p>
              <h2 style={styles.sectionTitleLarge}>Documents are still the source of truth for GovCon.</h2>
              <p style={styles.sectionSubtitle}>Manual underwriting for federal contracts remains legacy, manual, and prone to error. Aris replaces manual document review end-to-end.</p>
              
              <div style={styles.problemGrid}>
                {problemPoints.map((p, i) => (
                  <div key={i} style={styles.problemCard}>
                    <div style={styles.problemIcon}>0{i+1}</div>
                    <h3 style={styles.problemTitle}>{p.title}</h3>
                    <p style={styles.problemText}>{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={styles.sectionMuted} data-reveal>
            <div style={styles.sectionInner}>
              <p style={styles.sectionEyebrow}>The Platform</p>
              <h2 style={styles.sectionTitleLarge}>Collect. Verify. Decide. In seconds.</h2>
              <p style={styles.sectionSubtitle}>Two protocols that replace manual document review end-to-end. Aris Protocol Agent handles compliance verification while Compliance Sniper extracts structured data.</p>
              
              <div style={styles.productGrid}>
                <div style={styles.productCard}>
                  <div style={styles.productBadge}>PROTOCOL AGENT</div>
                  <h3 style={styles.productTitle}>Aris Protocol Agent</h3>
                  <p style={styles.productText}>Manages the back-and-forth of solicitation verification in bid origination—delivering high-quality applications and rich data inputs.</p>
                  <button style={styles.productLink} onClick={onViewSample}>See Sample Workflow →</button>
                </div>
                <div style={styles.productCard}>
                  <div style={styles.productBadge}>COMPLIANCE SNIPER</div>
                  <h3 style={styles.productTitle}>Compliance Sniper</h3>
                  <p style={styles.productText}>Agentic AI that reads documents the way your best analyst would, then extracts every field and flags risk signals calibrated to FedRAMP/FAR.</p>
                  <button style={styles.productLink} onClick={onEnterApp}>Trial Capture →</button>
                </div>
              </div>
            </div>
          </section>

          <section id="markets" style={styles.sectionDark} data-reveal>
            <div style={styles.sectionInner}>
              <p style={styles.sectionEyebrow}>Global Reach</p>
              <h2 style={styles.sectionTitleLarge}>Where we operate.</h2>
              <div style={styles.reachGrid}>
                <div style={styles.reachCard}>
                  <div style={styles.reachStatus}>LIVE</div>
                  <h3 style={styles.reachTitle}>US DOD & IC</h3>
                  <p style={styles.reachText}>Sovereign infrastructure for mission-critical mission support and intelligence analysis.</p>
                </div>
                <div style={styles.reachCard}>
                  <div style={styles.reachStatus}>ACTIVE</div>
                  <h3 style={styles.reachTitle}>Civilian Agencies</h3>
                  <p style={styles.reachText}>Modernizing document extraction for major federal civilian departments and legacy systems.</p>
                </div>
                <div style={styles.reachCard}>
                  <div style={styles.reachStatusAlt}>COMING SOON</div>
                  <h3 style={styles.reachTitle}>Intelligence Labs</h3>
                  <p style={styles.reachText}>Next-gen edge computing protocols for disconnected environments and tactical analysis.</p>
                </div>
              </div>
            </div>
          </section>


          <section id="solutions" style={styles.sectionDark} data-reveal>
            <div style={styles.sectionInner}>
              <p style={styles.sectionEyebrow}>Why Aris</p>
              <h2 style={styles.sectionTitleLarge}>Built for the reality of federal contracting.</h2>
              <p style={styles.sectionSubtitle}>Standard AI was never trained on your solicitation documents. Aris's Vision AI understands every format—with the intuition of your best analyst.</p>
              
              <div style={styles.problemGrid}>
                <div style={styles.problemCard}>
                  <div style={styles.problemIcon}>01</div>
                  <h3 style={styles.problemTitle}>Any Document, Any Quality</h3>
                  <p style={styles.problemText}>Handwritten ledgers, blurry phone captures, and nested PDF annexes. Aris doesn't just read documents—it understands them.</p>
                </div>
                <div style={styles.problemCard}>
                  <div style={styles.problemIcon}>02</div>
                  <h3 style={styles.problemTitle}>Every Agency Format</h3>
                  <p style={styles.problemText}>DOD, IC, Civilian, and GSA. From any agency, any portal. One API that speaks every federal format.</p>
                </div>
                <div style={styles.problemCard}>
                  <div style={styles.problemIcon}>03</div>
                  <h3 style={styles.problemTitle}>Hyperlocal Signals</h3>
                  <p style={styles.problemText}>Risk flags, FAR compliance scores, and past performance verification calibrated to federal standards, not generic defaults.</p>
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
              <div style={{ ...styles.pricingGrid, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)" }}>
                {GTM_PRICING_PLANS.map((plan) => (
                  <PricingCard
                    key={plan.key}
                    title={plan.title}
                    price={plan.price}
                    billingCycle={plan.billingCycle}
                    description={plan.description}
                    buttonLabel={plan.buttonLabel}
                    buttonLink={plan.buttonLink}
                    featured={plan.featured}
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
              <div style={styles.enterpriseContainer}>
                <p style={styles.enterpriseSubheading}>Enterprise: Custom Registry & Private Cloud</p>
                <form 
                  onSubmit={handleEnterpriseContact} 
                  style={{
                    ...styles.premiumEmailCard,
                    flexDirection: isMobile ? "column" : "row",
                    borderRadius: isMobile ? "24px" : "999px",
                    padding: isMobile ? "12px" : "6px 6px 6px 20px",
                    gap: isMobile ? "12px" : "0",
                    width: isMobile ? "100%" : "500px",
                    maxWidth: "100%"
                  }}
                >
                  <input
                    id="enterprise-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="Work email (e.g. you@company.com)"
                    style={{
                      ...styles.premiumEmailInput,
                      textAlign: isMobile ? "center" : "left",
                      padding: isMobile ? "14px 0" : "12px 0"
                    }}
                  />
                  <button 
                    type="submit" 
                    style={{
                      ...styles.premiumEmailButton,
                      width: isMobile ? "100%" : "auto"
                    }} 
                    aria-label="Contact enterprise sales"
                  >
                    Contact Sales
                  </button>
                </form>
                <p style={styles.enterpriseTrustNote}>Trusted by 12+ Federal Prime Contractors</p>
              </div>
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
            <div className="footer-inner" style={styles.footerGrid}>
              <div className="footer-brand-col">
                <p style={styles.footerBrandLogo}>BidSmith</p>
                <p style={styles.footerTagline}>
                  Vision AI agents that collect, verify, and analyze federal solicitations, so contractors close faster and lower risk.
                </p>
                <div style={styles.addressBlock}>
                  <p style={styles.footerAddress}>Labs Headquarters</p>
                  <p style={styles.footerAddress}>High-Sovereignty Node</p>
                </div>
              </div>

              <div className="footer-links-col">
                <p style={styles.footerHeading}>Product</p>
                <a href="#solutions" style={styles.footerLink}>Aris Protocol Agent</a>
                <a href="#solutions" style={styles.footerLink}>Compliance Sniper</a>
                <a href="https://docs.bidsmith.pro" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Documentation</a>
              </div>

              <div className="footer-links-col">
                <p style={styles.footerHeading}>Company</p>
                <a href="#about" style={styles.footerLink}>About</a>
                <a href="#solutions" style={styles.footerLink}>Solutions</a>
                <a href="/soc" style={styles.footerLink}>Security</a>
                <a href="mailto:sid@bidsmith.pro" style={styles.footerLink}>Contact</a>
              </div>

              <div className="footer-links-col">
                <p style={styles.footerHeading}>Markets</p>
                <a href="#markets" style={styles.footerLink}>US DOD & IC</a>
                <a href="#markets" style={styles.footerLink}>Civilian Agencies</a>
                <a href="#markets" style={styles.footerLink}>Intelligence Labs</a>
              </div>

              <div className="footer-links-col">
                <p style={styles.footerHeading}>Legal</p>
                <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
                <a href="/terms" style={styles.footerLink}>Terms of Service</a>
                <div style={styles.footerSocials}>
                   <a href="https://linkedin.com/company/aris-labs" style={styles.footerSocialIcon}><Linkedin size={16} /></a>
                   <a href="https://github.com/ARIS-Labs-HQ" style={styles.footerSocialIcon}><Github size={16} /></a>
                </div>
              </div>
            </div>

            <div style={styles.footerBottom}>
              <p style={styles.footerCopyright}>
                © 2026 Aris Labs. Backed by Federal Intelligence Standards.
              </p>
              <p style={styles.footerTime}>{pstTime}</p>
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
    maxWidth: 1200,
    margin: "0 auto",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 32,
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
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    transition: "color 0.2s ease",
  },
  navCta: {
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #ffffff",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  secondaryNavCta: {
    background: "transparent",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  heroSection: {
    padding: "100px 24px 80px",
    background: "#000000",
    textAlign: "center",
    borderBottom: "1px solid #141416",
  },
  heroInnerFull: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  megaTitle: {
    fontSize: "clamp(2.5rem, 8vw, 5rem)",
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    color: "#ffffff",
    margin: "24px 0",
    maxWidth: 1000,
  },
  megaSubtitle: {
    fontSize: "clamp(1rem, 2vw, 1.25rem)",
    color: "#71717a",
    lineHeight: 1.6,
    maxWidth: 720,
    margin: "0 auto 40px",
  },
  ycBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 16px",
    background: "#0c0c0e",
    border: "1px solid #141416",
    borderRadius: 999,
    fontSize: "11px",
    letterSpacing: "0.05em",
    fontFamily: "'Space Mono', monospace",
  },
  primaryMegaCta: {
    background: "#3b82f6",
    color: "#ffffff",
    padding: "16px 32px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: "1.05rem",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
  },
  secondaryMegaCta: {
    background: "transparent",
    color: "#ffffff",
    padding: "16px 32px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: "1.05rem",
    border: "1px solid #141416",
    cursor: "pointer",
  },
  statsBar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "60px",
    marginTop: "80px",
    width: "100%",
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "#71717a",
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statSub: {
    fontSize: "0.75rem",
    opacity: 0.6,
  },
  sectionDark: {
    padding: "100px 24px",
    background: "#000000",
  },
  sectionTitleLarge: {
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#ffffff",
    textAlign: "center",
    maxWidth: 800,
    margin: "0 auto 24px",
    lineHeight: 1.1,
  },
  sectionSubtitle: {
    fontSize: "1.1rem",
    color: "#71717a",
    textAlign: "center",
    maxWidth: 600,
    margin: "0 auto 60px",
    lineHeight: 1.6,
  },
  problemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "32px",
    marginTop: "40px",
  },
  problemCard: {
    padding: "32px",
    background: "#0c0c0e",
    border: "1px solid #141416",
    borderRadius: 20,
    transition: "all 0.3s ease",
  },
  problemIcon: {
    fontSize: "0.85rem",
    fontFamily: "'Space Mono', monospace",
    color: "#3b82f6",
    marginBottom: "24px",
  },
  problemTitle: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: "16px",
  },
  problemText: {
    fontSize: "0.95rem",
    color: "#71717a",
    lineHeight: 1.6,
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "40px",
  },
  productCard: {
    padding: "48px",
    background: "#09090b",
    border: "1px solid #141416",
    borderRadius: 24,
    textAlign: "left",
  },
  productBadge: {
    display: "inline-block",
    padding: "4px 12px",
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    color: "#3b82f6",
    fontSize: "10px",
    fontWeight: 800,
    borderRadius: 4,
    marginBottom: "24px",
    letterSpacing: "0.1em",
  },
  productTitle: {
    fontSize: "2rem",
    fontWeight: 900,
    color: "#ffffff",
    marginBottom: "16px",
    letterSpacing: "-0.02em",
  },
  productText: {
    fontSize: "1.1rem",
    color: "#71717a",
    lineHeight: 1.6,
    marginBottom: "32px",
  },
  productLink: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    padding: 0,
  },
  reachGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  reachCard: {
    padding: "32px",
    background: "#09090b",
    border: "1px solid #141416",
    borderRadius: 16,
  },
  reachStatus: {
    color: "#22c55e",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    marginBottom: "12px",
  },
  reachStatusAlt: {
    color: "#71717a",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    marginBottom: "12px",
  },
  reachTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: "12px",
  },
  reachText: {
    fontSize: "0.95rem",
    color: "#71717a",
    lineHeight: 1.6,
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
  inlineLink: { color: "#4338ca", textDecoration: "none", fontWeight: 600 },
  footer: {
    padding: "80px 24px 40px",
    background: "#000000",
    borderTop: "1px solid #141416",
  },
  footerGrid: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "40px",
  },
  footerBrandLogo: {
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.02em",
    marginBottom: "16px",
  },
  footerTagline: {
    fontSize: "0.9rem",
    color: "#71717a",
    lineHeight: 1.6,
    maxWidth: 240,
    marginBottom: "24px",
  },
  addressBlock: {
    marginTop: "24px",
  },
  footerAddress: {
    fontSize: "0.8rem",
    color: "#3f3f46",
    margin: "4px 0",
    fontFamily: "'Space Mono', monospace",
  },
  footerHeading: {
    fontSize: "0.75rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#3b82f6",
    marginBottom: "20px",
  },
  footerLink: {
    display: "block",
    fontSize: "0.9rem",
    color: "#71717a",
    textDecoration: "none",
    marginBottom: "12px",
    transition: "color 0.2s ease",
  },
  footerSocials: {
    display: "flex",
    gap: "16px",
    marginTop: "20px",
  },
  footerSocialIcon: {
    color: "#3f3f46",
    transition: "color 0.2s ease",
  },
  footerBottom: {
    maxWidth: 1200,
    margin: "60px auto 0",
    paddingTop: "32px",
    borderTop: "1px solid #141416",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  footerCopyright: {
    fontSize: "0.8rem",
    color: "#3f3f46",
  },
  footerTime: {
    fontSize: "0.8rem",
    color: "#3f3f46",
    fontFamily: "'Space Mono', monospace",
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

const TerminalSequence = () => {
  const [lines, setLines] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  const bootLogs = [
    "ARIS OS v1.1 : INITIALIZED",
    "PROTOCOL : STATELESS_BRIDGE",
    "DECOY_READY : ACTIVE",
    "MERCURY_2_DIFFUSION_ACTIVE // ZERO_KNOWLEDGE_READY",
    "ANALYSIS COMPLETE. SYSTEM PURGE IN 120s."
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootLogs.length) {
        setLines(prev => [...prev, bootLogs[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400); // Faster typing
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: 'left' }}>
      {lines.map((line, i) => (
        <div key={i} style={{ marginBottom: '8px', fontSize: '14px', color: '#a1a1aa', letterSpacing: '0.02em' }}>
          <span style={{ color: '#3f3f46', marginRight: '10px' }}>[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
          <span style={{ color: i === bootLogs.length - 1 ? '#22c55e' : '#a1a1aa' }}>{line}</span>
        </div>
      ))}
      {lines.length === bootLogs.length && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', background: '#0c0c0e', padding: '12px 16px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
          <span style={{ color: '#3b82f6', fontWeight: 900, fontSize: '16px' }}>{'>'}</span>
          <input 
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="[ Enter SAM.gov Link to Shred ]"
            style={styles.terminalInput}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const hasSession = localStorage.getItem('aris_session_active') === 'true';
                if (hasSession) {
                  window.location.href = '/app';
                } else {
                  // Redirect to the app for non-session users as well, removing direct Stripe link
                  window.location.href = '/app';
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
