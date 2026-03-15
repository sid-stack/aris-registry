/**
 * Canonical GTM pricing ladder used across landing, templates, and proposal copy.
 */
export const GTM_PRICING_PLANS = [
  {
    key: "free_tier",
    title: "Lead Generation Starter",
    price: "Free",
    description: "5 SAM.gov searches per month. Basic filters and contact information preview.",
    buttonLabel: "Start Free",
    buttonLink: "/sam-scraper",
    callout: "Free - 5 searches per month",
    tier: "free"
  },
  {
    key: "professional",
    title: "Professional",
    price: "$299/month",
    description: "Unlimited SAM.gov searches, advanced filters, full contact export, vector recommendations, and AI analysis.",
    buttonLabel: "Start Professional",
    buttonLink: "/api/checkout/session?plan=professional",
    callout: "Professional - $299/month",
    tier: "professional"
  },
  {
    key: "enterprise",
    title: "Enterprise",
    price: "$999/month",
    description: "Everything in Professional plus bulk search (1000 contractors), API access, custom vector models, and dedicated support.",
    buttonLabel: "Start Enterprise",
    buttonLink: "/api/checkout/session?plan=enterprise",
    callout: "Enterprise - $999/month",
    tier: "enterprise"
  },
  {
    key: "quick_audit",
    title: "Quick Risk Scan",
    price: "$750",
    description: "Bid risk score, 3–5 critical compliance alerts, and basic matrix. Turned around instantly.",
    buttonLabel: "Get Quick Scan",
    buttonLink: "/api/checkout/session?plan=quick_audit",
    callout: "Quick Risk Scan - $750 per engagement",
    tier: "audit"
  },
  {
    key: "full_audit",
    title: "Full Compliance Audit",
    price: "$2,500",
    description: "Full matrix, FAR/DFARS extraction, risk weighting, and response outline. The industry standard.",
    buttonLabel: "Start Full Audit",
    buttonLink: "/api/checkout/session?plan=full_audit",
    callout: "Full Compliance Audit - $2,500 per engagement",
    tier: "audit"
  },
  {
    key: "deep_dive",
    title: "Capture Deep Dive",
    price: "$5,000+",
    description: "Bid/No-bid recommendation, competitor signals, and detailed capture strategy report.",
    buttonLabel: "Request Deep Dive",
    buttonLink: "mailto:sid@bidsmith.pro?subject=Deep%20Dive%20Inquiry",
    callout: "Capture Deep Dive - Starting at $5,000",
    tier: "audit"
  }
];

// Credit packs for pay-per-use model
export const CREDIT_PACKS = [
  {
    key: "starter_pack",
    title: "Starter Pack",
    credits: 50,
    price: "$99",
    description: "Perfect for testing the platform. Includes basic searches.",
    callout: "50 searches - $99"
  },
  {
    key: "professional_pack", 
    title: "Professional Pack",
    credits: 200,
    price: "$299",
    description: "Ideal for regular users. Best value for medium usage.",
    callout: "200 searches - $299"
  },
  {
    key: "enterprise_pack",
    title: "Enterprise Pack", 
    credits: 500,
    price: "$499",
    description: "Maximum value for heavy users and teams.",
    callout: "500 searches - $499"
  }
];

