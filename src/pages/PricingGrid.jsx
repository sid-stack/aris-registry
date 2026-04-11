import { useState } from "react";
import { Shield, CheckCircle, ArrowRight, Zap, Lock } from "lucide-react";
import { GTM_PRICING_PLANS, FREE_TIER } from "../lib/pricing";
import { createCheckoutSession } from "../lib/stripe";

export default function PricingGrid({ onTryFree, userId }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  async function handlePlanClick(plan) {
    if (plan.key === "free") {
      onTryFree?.();
      return;
    }
    if (plan.key === "enterprise") {
      window.location.href = "mailto:sid@bidsmith.pro?subject=Enterprise Plan — BidSmith";
      return;
    }
    setLoading(plan.key);
    setError(null);
    try {
      const url = await createCheckoutSession({ plan: plan.key, uid: userId || undefined });
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Checkout failed. Please try again.");
      setLoading(null);
    }
  }

  const allTiers = [FREE_TIER, ...GTM_PRICING_PLANS];

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Simple, Transparent Pricing</h1>
        <p style={styles.subtitle}>
          Verdict is always free. Full intelligence starts at $99/mo.
        </p>
      </section>

      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}

      <section style={styles.pricingSection}>
        <div style={styles.grid}>
          {allTiers.map((tier) => {
            const isPro = tier.key === "pro";
            const isBusy = loading === tier.key;
            return (
              <div key={tier.key} style={{ ...styles.card, ...(isPro ? styles.proCard : {}) }}>
                {isPro && <div style={styles.badge}>MOST POPULAR</div>}
                <div style={styles.cardHeader}>
                  <h3 style={{ ...styles.cardTier, ...(isPro ? { color: "#fff" } : {}) }}>
                    {tier.title}
                  </h3>
                  <div style={{ ...styles.price, ...(isPro ? { color: "#fff" } : {}) }}>
                    {tier.price}
                    {tier.annualNote && (
                      <span style={{ fontSize: "1rem", fontWeight: 600, opacity: 0.7, marginLeft: 4 }}>
                        {tier.annualNote}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ ...styles.description, ...(isPro ? { color: "#e2e8f0" } : {}) }}>
                  {tier.description}
                </p>
                <button
                  style={{
                    ...(isPro ? styles.proBtn : styles.freeBtn),
                    ...(isBusy ? styles.btnDisabled : {}),
                  }}
                  disabled={isBusy}
                  onClick={() => handlePlanClick(tier)}
                >
                  {isBusy ? "Redirecting…" : tier.buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section style={styles.valueSection}>
        <div style={styles.valueBox}>
          <Zap size={24} color="#0B3D91" style={{ marginBottom: 16 }} />
          <p style={styles.valueText}>
            A compliance consultant costs <strong>$15,000+/year</strong> and takes <strong>3–5 days</strong> per bid.
            <br />
            BidSmith delivers the same output in <strong>90 seconds</strong>.
          </p>
        </div>
      </section>

      <section style={styles.trustSection}>
        <div style={styles.trustItem}><Lock size={18} /> Secure processing</div>
        <div style={styles.trustItem}><Shield size={18} /> No data stored</div>
        <div style={styles.trustItem}><CheckCircle size={18} /> Built for government contractors</div>
      </section>

      <section style={styles.finalCta}>
        <button style={styles.mainCta} onClick={() => onTryFree?.()}>
          Try Free — No Credit Card <ArrowRight size={20} />
        </button>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#0f172a",
    fontFamily: "Inter, sans-serif",
    padding: "80px 24px",
  },
  hero: { textAlign: "center", marginBottom: "64px" },
  title: {
    fontSize: "3.5rem",
    fontWeight: 900,
    color: "#0B3D91",
    letterSpacing: "-0.02em",
    marginBottom: "16px",
  },
  subtitle: {
    fontSize: "1.25rem",
    color: "#64748b",
    maxWidth: "600px",
    margin: "0 auto",
  },
  errorBanner: {
    maxWidth: "600px",
    margin: "0 auto 32px",
    padding: "16px",
    borderRadius: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: "0.95rem",
    textAlign: "center",
  },
  pricingSection: { maxWidth: "1100px", margin: "0 auto 80px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px",
  },
  card: {
    padding: "40px 28px",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  proCard: {
    background: "#0B3D91",
    borderColor: "#0B3D91",
    boxShadow: "0 24px 64px rgba(11,61,145,0.18)",
    transform: "scale(1.03)",
  },
  badge: {
    position: "absolute",
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#2563eb",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  },
  cardHeader: { textAlign: "center" },
  cardTier: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#64748b",
    marginBottom: "8px",
    textTransform: "uppercase",
  },
  price: {
    fontSize: "3rem",
    fontWeight: 900,
    color: "#0B3D91",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "4px",
  },
  description: {
    fontSize: "0.9rem",
    color: "#475569",
    lineHeight: 1.6,
    flex: 1,
  },
  freeBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid #0B3D91",
    background: "transparent",
    color: "#0B3D91",
    fontSize: "0.95rem",
    fontWeight: 800,
    cursor: "pointer",
    marginTop: "auto",
  },
  proBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#fff",
    color: "#0B3D91",
    fontSize: "0.95rem",
    fontWeight: 800,
    cursor: "pointer",
    marginTop: "auto",
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  valueSection: { maxWidth: "800px", margin: "0 auto 80px", textAlign: "center" },
  valueBox: {
    padding: "48px",
    background: "#f8fafc",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
  },
  valueText: { fontSize: "1.4rem", color: "#475569", lineHeight: 1.6 },
  trustSection: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    marginBottom: "80px",
    flexWrap: "wrap",
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    color: "#64748b",
    fontWeight: 600,
  },
  finalCta: { textAlign: "center" },
  mainCta: {
    padding: "20px 56px",
    borderRadius: "16px",
    border: "none",
    background: "#0B3D91",
    color: "#fff",
    fontSize: "1.15rem",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 20px 48px rgba(11,61,145,0.2)",
  },
};
