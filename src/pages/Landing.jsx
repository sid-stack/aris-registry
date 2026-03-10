import {
  Rocket,
  CheckCircle2,
  PiggyBank,
  PlugZap,
  Search,
  KeyRound,
  BadgeCheck,
  BriefcaseBusiness,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import FaqSection from "../components/FaqSection";
import { trackEvent } from "../utils/analytics";
import PricingCard from "../components/PricingCard";
import { trackKPI } from "../lib/analytics";
import { GTM_PRICING_PLANS } from "../lib/pricing";
import { createCheckoutSession } from "../lib/stripe";

const benefits = [
  {
    title: "Speed",
    description: "Generate a compliant bid draft in seconds, not hours.",
    icon: <Rocket size={42} color="#4f46e5" />,
  },
  {
    title: "Accuracy",
    description: "Validation checks keep submissions aligned with SAM.gov requirements.",
    icon: <CheckCircle2 size={42} color="#4f46e5" />,
  },
  {
    title: "Cost Effective",
    description: "Fixed INR 20 per transaction with transparent usage pricing.",
    icon: <PiggyBank size={42} color="#4f46e5" />,
  },
  {
    title: "Easy Integration",
    description: "One-line aris-sdk usage for Python, Node, or Rust workflows.",
    icon: <PlugZap size={42} color="#4f46e5" />,
  },
];

const steps = [
  {
    title: "Discover",
    description: "Call /discover?capability=... and get healthy, low-latency agents.",
    icon: <Search size={42} color="#4f46e5" />,
  },
  {
    title: "Handshake",
    description: "Aris issues a short-lived JWT so agents connect without exposing payloads.",
    icon: <KeyRound size={42} color="#4f46e5" />,
  },
  {
    title: "Settle",
    description: "Every transaction is logged, marked SUCCESS, and billed at INR 20.",
    icon: <BadgeCheck size={42} color="#4f46e5" />,
  },
];

const heroStats = [
  { label: "Avg. draft turnaround", value: "< 10 min" },
  { label: "Pilot compliance accuracy", value: "95%+" },
  { label: "Implementation window", value: "30 days" },
];

function IconCard({ title, description, icon, isDark }) {
  const s = getStyles(isDark);
  return (
    <div
      style={s.card}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
        event.currentTarget.style.boxShadow = "0 14px 34px rgba(15,23,42,0.10)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = s.card.boxShadow;
      }}
    >
      {icon}
      <h3 style={s.cardTitle}>{title}</h3>
      <p style={s.cardCopy}>{description}</p>
    </div>
  );
}

export default function Landing({ onEnterApp }) {
  const [isDark, setIsDark] = useState(true);
  const s = getStyles(isDark);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

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
    window.location.href = `mailto:support@bidsmith.pro?subject=Enterprise%20Plan%20Inquiry&body=Contact%20email:%20${encodeURIComponent(contactEmail.trim())}`;
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
    <div style={s.page}>
      <header style={s.navbar}>
        <div style={s.navInner}>
          <a href="/" style={s.brand}>
            <BriefcaseBusiness size={20} />
            <span>BidSmith</span>
          </a>
          <nav style={s.navLinksDesktop}>
            <a href="#features" style={s.navLink}>Features</a>
            <a href="#workflow" style={s.navLink}>Workflow</a>
            <a href="#pricing" style={s.navLink}>Pricing</a>
            <a href="/docs" style={s.navLink}>Docs</a>
            <a href="#contact" style={s.navLink}>Contact</a>
          </nav>
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: isDark ? "#f8fafc" : "#334155", padding: "8px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            type="button"
            aria-label="Start free trial checkout"
            style={s.navCta}
            onClick={handleStartTrial}
            disabled={isProcessing}
          >
            Start Free
          </button>
        </div>
      </header>
      <section style={s.hero}>
        <div style={s.heroGlowTop} />
        <div style={s.heroGlowBottom} />
        <div style={s.heroInner}>
          <p style={s.heroKicker}>AI capture engine for federal bid teams</p>
          <div
            style={s.cssLogo}
          >
            BidSmith
          </div>
          <h1 style={s.title}>AI‑Powered RFP and Government Contract Bidding</h1>
          <p style={s.subtitle}>
            Build compliant bids faster, reduce disqualification risk, and move from
            solicitation to submission with a repeatable AI-assisted workflow.
          </p>
          <div style={s.heroActions}>
            <button
              type="button"
              aria-label="Start free seven day trial"
              style={{
                ...s.primaryCta,
                ...(isProcessing ? s.disabledButton : {}),
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
              style={s.secondaryCta}
              disabled={isProcessing}
            >
              Open Analyst Workspace
            </button>
            <a href="#workflow" style={s.heroTextLink} aria-label="Jump to workflow section">
              Watch How It Works
            </a>
          </div>
          <div style={s.heroStatsGrid}>
            {heroStats.map((stat) => (
              <div key={stat.label} style={s.heroStatCard}>
                <p style={s.heroStatValue}>{stat.value}</p>
                <p style={s.heroStatLabel}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" style={s.sectionMuted} data-reveal>
        <div style={s.sectionInner}>
          <p style={s.sectionEyebrow}>Why teams switch from manual workflows</p>
          <h2 style={s.sectionTitle}>Why Bidsmith Lite?</h2>
          <div style={s.gridFour}>
            {benefits.map((benefit) => (
              <IconCard
                key={benefit.title}
                title={benefit.title}
                description={benefit.description}
                icon={benefit.icon}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" style={s.section} data-reveal>
        <div style={s.sectionInner}>
          <p style={s.sectionEyebrow}>Execution model</p>
          <h2 style={s.sectionTitle}>How It Works</h2>
          <div style={s.gridThree}>
            {steps.map((step) => (
              <IconCard
                key={step.title}
                title={step.title}
                description={step.description}
                icon={step.icon}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={s.sectionMuted} data-reveal>
        <div style={s.sectionInnerNarrow}>
          <p style={s.sectionEyebrow}>Commercial model</p>
          <h2 style={s.sectionTitle}>Simple, Transparent Pricing</h2>
          <p style={s.subtitleSmall}>No contracts, no hidden fees, and a clear plan progression.</p>
          <div style={s.pricingGrid}>
            {GTM_PRICING_PLANS.map((plan) => (
              <PricingCard isDark={isDark}
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
                    window.location.href = "mailto:support@bidsmith.pro?subject=Enterprise%20Plan%20Inquiry";
                    return;
                  }
                  openCheckout("landing_pricing", plan);
                }}
              />
            ))}
          </div>
          <div style={s.pilotBanner}>
            <p style={s.pilotText}>
              Pilot package: <strong>$2,500 / 30 days</strong> with onboarding and 5,000 calls.
            </p>
            <button
              type="button"
              aria-label="Request pilot plan"
              style={s.secondaryCta}
              onClick={handlePilotCta}
              disabled={isProcessing}
            >
              Request Pilot
            </button>
          </div>
          <form onSubmit={handleEnterpriseContact} style={s.enterpriseForm}>
            <label htmlFor="enterprise-email" style={s.enterpriseLabel}>Enterprise: contact sales</label>
            <input
              id="enterprise-email"
              type="email"
              required
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="you@company.com"
              style={s.enterpriseInput}
            />
            <button type="submit" style={s.planButton} aria-label="Contact enterprise sales">
              Contact Sales
            </button>
          </form>
          <p style={s.proposalCopy}>
            Need a client-ready pilot deck? See{" "}
            <a
              href="/pilot-proposal-outline.md"
              target="_blank"
              rel="noreferrer"
              style={s.inlineLink}
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

      <FaqSection isDark={isDark} />

      <footer id="contact" style={s.footer}>
        <div style={s.footerInner}>
          <div>
            <p style={s.footerBrand}>BidSmith</p>
            <p style={s.footerText}>Copyright 2026 Bidsmith Ltd. All rights reserved.</p>
            <a
              href="mailto:support@bidsmith.io"
              style={s.footerLink}
              onClick={() => trackEvent("support_email_click", { source: "landing_footer" })}
            >
              support@bidsmith.io
            </a>
          </div>
          <div>
            <p style={s.footerHeading}>Company</p>
            <a href="/privacy" style={s.footerLink}>Privacy Policy</a>
            <a href="/terms" style={s.footerLink}>Terms of Service</a>
            <a href="/cookies" style={s.footerLink}>Cookie Policy</a>
            <a href="/docs" style={s.footerLink}>Developer Docs</a>
          </div>
          <div>
            <p style={s.footerHeading}>Template Library</p>
            <a
              href="/templates"
              target="_blank"
              rel="noopener noreferrer"
              style={s.footerLink}
              onClick={() => trackEvent("templates_link_click", { source: "landing_footer" })}
            >
              Outreach & Agreement Templates
            </a>
            <a href="/pilot-proposal-outline.md" target="_blank" rel="noreferrer" style={s.footerLink}>
              Pilot Proposal Outline
            </a>
            <a href="#pricing" style={s.footerLink}>Pricing Plans</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const getStyles = (isDark) => ({
  cssLogo: {
    background: '#0f172a',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: '32px',
    letterSpacing: '-0.04em',
    padding: '16px 36px',
    borderRadius: '12px',
    display: 'inline-block',
    margin: '0 auto 18px',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.2s ease',
  },
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
  },
  navInner: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: isDark ? '#f8fafc' : '#0f172a',
    fontWeight: 800,
    textDecoration: "none",
    marginRight: "auto",
  },
  navLinksDesktop: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    flexWrap: "wrap",
  },
  navLink: {
    color: isDark ? '#e2e8f0' : '#334155',
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  navCta: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid #0f172a",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  page: {
    minHeight: "100vh",
    background: isDark ? '#0f172a' : '#f8fafc',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  hero: {
    padding: "72px 20px 56px",
    background: "linear-gradient(160deg, #f8fafc 0%, #ecfeff 42%, #eff6ff 100%)",
    borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    position: "relative",
    overflow: "hidden",
  },
  heroGlowTop: {
    position: "absolute",
    top: -80,
    left: "12%",
    width: 280,
    height: 280,
    background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0) 70%)",
    pointerEvents: "none",
  },
  heroGlowBottom: {
    position: "absolute",
    right: "8%",
    bottom: -110,
    width: 320,
    height: 320,
    background: "radial-gradient(circle, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0) 70%)",
    pointerEvents: "none",
  },
  heroInner: { maxWidth: 920, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 },
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
  title: { margin: 0, fontSize: "clamp(2rem, 6vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-0.02em" },
  logo: {
    height: 72,
    width: "auto",
    margin: "0 auto 14px",
    display: "block",
  },
  subtitle: { margin: "18px auto 0", maxWidth: 760, color: isDark ? '#cbd5e1' : '#475569', fontSize: "clamp(1rem, 2.3vw, 1.25rem)", lineHeight: 1.6 },
  subtitleSmall: { margin: "10px 0 0", color: isDark ? '#94a3b8' : '#64748b', fontSize: "1rem" },
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
    background: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#334155',
    fontWeight: 600,
    borderRadius: 10,
    padding: "12px 22px",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
  },
  heroTextLink: {
    color: isDark ? '#f8fafc' : '#0f172a',
    textDecoration: "underline",
    fontWeight: 600,
    padding: "12px 6px",
  },
  section: { padding: "56px 20px", background: isDark ? '#1e293b' : '#ffffff' },
  sectionMuted: { padding: "56px 20px", background: isDark ? '#0b1120' : '#f1f5f9' },
  sectionInner: { maxWidth: 1080, margin: "0 auto" },
  sectionInnerNarrow: { maxWidth: 860, margin: "0 auto", textAlign: "center" },
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
    background: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 14,
    padding: "24px 20px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
  cardTitle: { margin: "12px 0 8px", fontSize: "1.05rem" },
  cardCopy: { margin: 0, color: isDark ? '#94a3b8' : '#64748b', fontSize: "0.95rem", lineHeight: 1.5 },
  pricingGrid: {
    marginTop: 28,
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
  planCard: {
    background: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
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
    background: "rgba(255,255,255,0.88)",
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 12,
    padding: "12px 10px",
    boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    backdropFilter: "blur(2px)",
  },
  heroStatValue: {
    margin: 0,
    color: "#1e1b4b",
    fontWeight: 800,
    fontSize: "1.05rem",
  },
  heroStatLabel: {
    margin: "4px 0 0",
    color: isDark ? '#cbd5e1' : '#475569',
    fontSize: "0.76rem",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  proposalCopy: { marginTop: 18, color: isDark ? '#94a3b8' : '#64748b' },
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
    color: isDark ? '#e2e8f0' : '#334155',
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
    borderTop: `1px solid ${isDark ? '#334155' : '#1e293b'}`,
    padding: "34px 20px",
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
});
