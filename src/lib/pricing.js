/**
 * Canonical GTM pricing ladder used across landing, templates, and proposal copy.
 * 4-tier funnel: Free → Starter → Standard → Enterprise
 */
export const STRIPE_PAYMENT_LINKS = {
  starter:    null, // TODO: create $49/mo Stripe price — mailto CTA until set
  standard:   "https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00",
  enterprise: "https://buy.stripe.com/cNibJ19id8369XvfLy2Fa01",
};

export const GTM_PRICING_PLANS = [
  {
    key: "free",
    title: "Free",
    price: "Free",
    annualNote: null,
    description: "3 audits per month. No credit card required. Full compliance matrix output.",
    buttonLabel: "Start Free",
    buttonLink: "/app",
    badge: null,
    tier: "free",
    callout: "Free — 3 audits/month",
  },
  {
    key: "starter",
    title: "Starter",
    price: "$49 / month",
    annualNote: "Annual billing saves 20% — contact us",
    description: "10 audits per month. Compliance matrix and FAR/DFARS extraction. Best for solo capture managers.",
    buttonLabel: "Get Starter",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Starter Plan",
    badge: null,
    tier: "starter",
    callout: "Starter - $49/month",
  },
  {
    key: "standard",
    title: "Standard Audit",
    price: "$99 / month",
    annualNote: "Annual billing saves 20% — contact us",
    description: "Unlimited audits. Full FAR/DFARS analysis, compliance matrix, risk score, and bid/no-bid recommendation.",
    buttonLabel: "Subscribe",
    buttonLink: STRIPE_PAYMENT_LINKS.standard,
    badge: "Most Popular",
    tier: "standard",
    callout: "Standard Audit - $99/month",
  },
  {
    key: "enterprise",
    title: "Enterprise Audit",
    price: "$299 / month",
    annualNote: "Annual billing saves 20% — contact us",
    description: "Deep-shred analysis, capture strategy, win themes, and competitive positioning for high-value solicitations.",
    buttonLabel: "Subscribe",
    buttonLink: STRIPE_PAYMENT_LINKS.enterprise,
    badge: null,
    tier: "enterprise",
    callout: "Enterprise Audit - $299/month",
  },
];

// Credit packs for pay-per-use model
export const CREDIT_PACKS = [
  {
    key: "starter_pack",
    title: "Starter Pack",
    credits: 1,
    price: "$99",
    description: "Single high-fidelity audit session.",
    callout: "1 Audit - $99"
  },
  {
    key: "professional_pack",
    title: "Professional Pack",
    credits: 1,
    price: "$299",
    description: "Enterprise-grade deep shred session.",
    callout: "1 Enterprise Audit - $299"
  }
];
