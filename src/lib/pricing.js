/**
 * Canonical BidSmith pricing — synced from live Stripe account.
 *
 * Starter  $99/mo   price_1T1tb8GYLlqVJEwwysv5FuGm
 * Pro      $299/mo  price_1TC4q3GYLlqVJEww51ByLmGT
 * Enterprise $999/mo price_1TFd3CGYLlqVJEwwalABiAaa
 *
 * All "Buy" buttons must call createCheckoutSession(plan) from src/lib/stripe.js.
 * Never use hardcoded buy.stripe.com links.
 */

export const GTM_PRICING_PLANS = [
  {
    key: "starter",
    title: "Starter",
    price: "$99",
    annualNote: "/mo · 10 audits",
    description: "Full compliance matrix, FAR/DFARS risk flags, and bid/no-bid verdict for up to 10 RFPs per month.",
    buttonLabel: "Start Starter",
    badge: null,
    tier: "starter",
    callout: "Starter — $99/mo",
    mode: "subscription",
    priceId: "price_1T1tb8GYLlqVJEwwysv5FuGm",
  },
  {
    key: "pro",
    title: "Pro",
    price: "$299",
    annualNote: "/mo · unlimited audits",
    description: "Unlimited audits, multi-section extraction, full exports, and requirement editing for active capture teams.",
    buttonLabel: "Go Pro",
    badge: "Most Popular",
    tier: "pro",
    callout: "Pro — $299/mo",
    mode: "subscription",
    priceId: "price_1TC4q3GYLlqVJEww51ByLmGT",
  },
  {
    key: "enterprise",
    title: "Enterprise",
    price: "$999",
    annualNote: "/mo · team + consultant",
    description: "Everything in Pro plus team collaboration workflows, priority processing, and a dedicated GovCon consultant.",
    buttonLabel: "Contact Sales",
    badge: null,
    tier: "enterprise",
    callout: "Enterprise — $999/mo",
    mode: "subscription",
    priceId: "price_1TFd3CGYLlqVJEwwalABiAaa",
  },
];

export const FREE_TIER = {
  key: "free",
  title: "Free",
  price: "$0",
  annualNote: "No credit card",
  description: "Instant bid/no-bid verdict and win probability for any SAM.gov solicitation.",
  buttonLabel: "Start Free",
  tier: "free",
};
