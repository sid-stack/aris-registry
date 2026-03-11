/**
 * Canonical GTM pricing ladder used across landing, templates, and proposal copy.
 */
export const GTM_PRICING_PLANS = [
  {
    key: "quick_audit",
    title: "Quick Risk Scan",
    price: "$750",
    description: "Bid risk score, 3–5 critical compliance alerts, and basic matrix. Turned around instantly.",
    buttonLabel: "Get Quick Scan",
    buttonLink: "/api/checkout/session?plan=quick_audit",
    callout: "Quick Risk Scan - $750 per engagement",
  },
  {
    key: "full_audit",
    title: "Full Compliance Audit",
    price: "$2,500",
    description: "Full matrix, FAR/DFARS extraction, risk weighting, and response outline. The industry standard.",
    buttonLabel: "Start Full Audit",
    buttonLink: "/api/checkout/session?plan=full_audit",
    callout: "Full Compliance Audit - $2,500 per engagement",
  },
  {
    key: "deep_dive",
    title: "Capture Deep Dive",
    price: "$5,000+",
    description: "Bid/No-bid recommendation, competitor signals, and detailed capture strategy report.",
    buttonLabel: "Request Deep Dive",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Deep%20Dive%20Inquiry",
    callout: "Capture Deep Dive - Starting at $5,000",
  }
];

