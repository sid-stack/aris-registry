/**
 * Canonical GTM pricing ladder used across landing, templates, and proposal copy.
 */
export const GTM_PRICING_PLANS = [
  {
    key: "starter",
    title: "Starter",
    price: "$29/mo",
    description: "Core agents with 200 free calls, then $0.25/call.",
    buttonLabel: "Start Starter",
    buttonLink: "/api/checkout/session?plan=starter",
    callout: "Starter - $29/mo + $0.25/call",
  },
  {
    key: "growth",
    title: "Growth",
    price: "$199/mo",
    description: "Includes 1,000 calls/month, then $0.20/call overage.",
    buttonLabel: "Upgrade to Growth",
    buttonLink: "/api/checkout/session?plan=growth",
    callout: "Growth - $199/mo (1,000 calls) + $0.20/call overage",
  },
  {
    key: "pilot",
    title: "Pilot",
    price: "$2,500 / 30 days",
    description: "Done-with-you onboarding plus 5,000 calls.",
    buttonLabel: "Request Pilot",
    buttonLink: "/api/checkout/session?plan=pilot",
    callout: "Pilot - $2,500 / 30 days (onboarding + 5,000 calls)",
  },
  {
    key: "enterprise",
    title: "Enterprise",
    price: "Custom",
    description: "Unlimited calls, private endpoints, SLA, and private support.",
    buttonLabel: "Contact Sales",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Enterprise%20Plan%20Inquiry",
    callout: "Enterprise - Custom (no fixed price)",
  },
];

