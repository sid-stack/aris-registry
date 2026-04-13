/**
 * Lightweight SEO strings for /compliance/:slug — keeps `App.jsx` from importing the full Compliance page module.
 * Keep in sync with `src/pages/CompliancePage.jsx` GUIDES metaTitle / metaDesc.
 */
const ROUTES = {
  "far-52-212-1": {
    metaTitle: "FAR 52.212-1 Compliance Checklist | BidSmith Federal Audit",
    metaDesc:
      "Complete guide to FAR 52.212-1 for government contractors. Offeror instructions, compliance requirements, and how BidSmith auto-checks clause conformance in 90 seconds.",
  },
  "section-l-analysis": {
    metaTitle: "Section L Compliance Matrix Guide for GovCon | ARIS",
    metaDesc:
      "How to read Section L of a federal RFP and build a compliance matrix. ARIS automates Section L requirement extraction and maps every item to Section M evaluation criteria.",
  },
  "compliance-matrix-guide": {
    metaTitle: "Compliance Matrix Generator for Federal RFPs | ARIS GovCon Tool",
    metaDesc:
      "Learn how to build a federal RFP compliance matrix. ARIS generates a full compliance matrix from any SAM.gov solicitation in under 90 seconds — free to try.",
  },
  "bid-no-bid-framework": {
    metaTitle: "Bid No-Bid Decision Framework for Federal Contracts | ARIS",
    metaDesc:
      "A structured bid/no-bid decision framework for GovCon capture teams. ARIS auto-scores every solicitation for compliance risk, win probability, and go/no-go recommendation.",
  },
  "dfars-252-204-7012": {
    metaTitle: "DFARS 252.204-7012 Compliance Guide | ARIS Federal Contractor Tool",
    metaDesc:
      "DFARS 252.204-7012 compliance requirements for defense contractors. Safeguarding covered defense information, NIST SP 800-171, and cyber incident reporting. ARIS flags this clause automatically.",
  },
  "rtm-generator": {
    metaTitle: "RTM Generator for Federal RFPs — Free Compliance Matrix Export | ARIS",
    metaDesc:
      "Generate a Requirements Traceability Matrix (RTM) from any SAM.gov solicitation in seconds. ARIS exports RTMs as CSV — ready for your proposal management system.",
  },
};

export function getComplianceRouteMeta(slug) {
  const g = ROUTES[slug];
  if (!g) return null;
  let title = g.metaTitle.includes("BidSmith")
    ? g.metaTitle
    : `${g.metaTitle.replace(/\s*\|\s*ARIS\b.*$/i, "").trim()} | BidSmith`;
  if (title.length > 60) title = `${title.slice(0, 57).trim()}…`;
  let description = g.metaDesc.length > 160 ? `${g.metaDesc.slice(0, 157)}…` : g.metaDesc;
  if (description.length < 140) {
    description = `${description} RFP bid management & government contract compliance.`.slice(0, 160);
  }
  return { title, description, path: `/compliance/${slug}` };
}
