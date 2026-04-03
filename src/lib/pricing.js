/**
 * Canonical GTM pricing ladder used across landing, templates, and proposal copy.
 * 4-tier funnel: Free → Starter → Standard → Enterprise
 */
export const STRIPE_PAYMENT_LINKS = {
  starter:    null, // TODO: create $99/mo Stripe price — mailto CTA until set
  standard:   "https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00",
  enterprise: "https://buy.stripe.com/cNibJ19id8369XvfLy2Fa01",
};

export const GTM_PRICING_PLANS = [
  {
    key: "starter",
    title: "Starter",
    price: "$99",
    annualNote: "1 audit session",
    description: "Perfect for single-bid verification. Includes 1 full audit + basic compliance matrix.",
    buttonLabel: "Get Started",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Starter Plan",
    badge: null,
    tier: "starter",
    callout: "Starter - $99",
  },
  {
    key: "pro",
    title: "Pro",
    price: "$299",
    annualNote: "Multi-section extraction",
    description: "For active capture teams. Includes multi-section extraction, full exports, and collaborative edits.",
    buttonLabel: "Go Pro",
    buttonLink: STRIPE_PAYMENT_LINKS.standard, // Mapping to existing standard for now or update if needed
    badge: "Most Popular",
    tier: "pro",
    callout: "Pro - $299",
  },
  {
    key: "enterprise",
    title: "Enterprise",
    price: "$999",
    annualNote: "Full RFP breakdown",
    description: "The complete bid acceleration engine. Full RFP breakdown, team workflows, and priority processing.",
    buttonLabel: "Contact Sales",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Enterprise Plan",
    badge: null,
    tier: "enterprise",
    callout: "Enterprise - $999",
  },
];

// Credit packs for pay-per-use model
export const CREDIT_PACKS = [
  {
    key: "starter_pack",
    title: "Starter",
    credits: 1,
    price: "$99",
    description: "1 full audit session.",
    callout: "Starter - $99"
  },
  {
    key: "professional_pack",
    title: "Pro",
    credits: 1,
    price: "$299",
    description: "Multi-section extraction + export.",
    callout: "Pro - $299"
  },
  {
    key: "enterprise_pack",
    title: "Enterprise",
    credits: 1,
    price: "$999",
    description: "Full RFP breakdown + priority.",
    callout: "Enterprise - $999"
  }
];
