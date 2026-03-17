/**
 * Canonical GTM pricing ladder used across landing, templates, and proposal copy.
 * Simplified to two strategic plans: $99 and $299.
 */
export const STRIPE_PAYMENT_LINKS = {
  standard: "https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00",
  enterprise: "https://buy.stripe.com/cNibJ19id8369XvfLy2Fa01",
};

export const GTM_PRICING_PLANS = [
  {
    key: "standard",
    title: "Standard Audit",
    price: "$99 / month",
    description: "Full compliance matrix, FAR/DFARS extraction, and risk score for small-to-medium RFPs.",
    buttonLabel: "Subscribe",
    buttonLink: STRIPE_PAYMENT_LINKS.standard,
    tier: "standard",
    callout: "Standard Audit - $99/month",
  },
  {
    key: "enterprise",
    title: "Enterprise Audit",
    price: "$299 / month",
    description: "Deep-shred analysis for high-value solicitations, including capture strategy and win themes.",
    buttonLabel: "Subscribe",
    buttonLink: STRIPE_PAYMENT_LINKS.enterprise,
    tier: "enterprise",
    callout: "Enterprise Audit - $299/month",
  }
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
