/**
 * Canonical pricing ladder — $99 / $499 / $999
 *
 * Tier 1 ($99):  Single-audit unlock (PaywallGate — one-time payment)
 * Tier 2 ($499): Pro subscription — unlimited audits / mo
 * Tier 3 ($999): Enterprise — team + priority + consultant
 */

// Single-audit unlock price (matches AUDIT_PRICE_CENTS in api/services/stripe.js)
export const SINGLE_AUDIT_PRICE = 99;

export const GTM_PRICING_PLANS = [
  {
    key: "starter",
    title: "Starter",
    price: "$99",
    annualNote: "1 audit unlock",
    description: "Perfect for single-bid verification. One-time unlock for 1 full compliance audit.",
    buttonLabel: "Unlock Audit",
    buttonLink: null, // dynamic — triggers PaywallGate checkout
    badge: null,
    tier: "starter",
    callout: "Starter - $99",
    mode: "payment",
  },
  {
    key: "pro",
    title: "Pro",
    price: "$499",
    annualNote: "/mo · unlimited audits",
    description: "For active capture teams. Unlimited audits, multi-section extraction, and full exports.",
    buttonLabel: "Go Pro",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Pro Plan - $499",
    badge: "Most Popular",
    tier: "pro",
    callout: "Pro - $499/mo",
    mode: "subscription",
  },
  {
    key: "enterprise",
    title: "Enterprise",
    price: "$999",
    annualNote: "/mo · team + consultant",
    description: "The complete bid acceleration engine. Full RFP breakdown, team workflows, and priority processing.",
    buttonLabel: "Contact Sales",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Enterprise Plan - $999",
    badge: null,
    tier: "enterprise",
    callout: "Enterprise - $999/mo",
    mode: "subscription",
  },
];

// Legacy alias — kept so any existing import of STRIPE_PAYMENT_LINKS doesn't break
export const STRIPE_PAYMENT_LINKS = {
  starter:    null,
  standard:   "mailto:sid@bidsmith.pro?subject=Pro Plan",
  enterprise: "mailto:sid@bidsmith.pro?subject=Enterprise Plan",
};

// Credit packs (pay-per-use copy)
export const CREDIT_PACKS = GTM_PRICING_PLANS;
