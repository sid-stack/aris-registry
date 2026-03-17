/**
 * Canonical GTM pricing ladder used across landing, templates, and proposal copy.
 * Simplified to two strategic plans: $99 and $299.
 */
export const GTM_PRICING_PLANS = [
  {
    key: "standard",
    title: "Standard Audit",
    price: "$99",
    description: "Full compliance matrix, FAR/DFARS extraction, and risk score for small-to-medium RFPs.",
    buttonLabel: "Initialize Audit",
    buttonLink: "https://buy.stripe.com/6oE5kpeCz3kC9Oc144",
    tier: "standard"
  },
  {
    key: "enterprise",
    title: "Enterprise Audit",
    price: "$299",
    description: "Deep-shred analysis for high-value solicitations, including capture strategy and win themes.",
    buttonLabel: "Initialize Audit",
    buttonLink: "https://buy.stripe.com/00g5kpeCzg2C7CEcMP",
    tier: "enterprise"
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
