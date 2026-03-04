const FAR_KNOWN = {
  "52.204-7":  "System for Award Management",
  "52.204-21": "Basic Safeguarding of Covered Contractor Information Systems",
  "52.212-4":  "Contract Terms — Commercial Products",
  "52.215-1":  "Instructions to Offerors — Competitive Acquisition",
  "52.222-26": "Equal Opportunity",
  "52.232-33": "Payment by Electronic Funds Transfer",
  "52.204-13": "SAM Maintenance",
  "52.209-6":  "Protecting the Government's Interest — Subcontractors",
  "252.204-7012": "DFARS — Safeguarding Covered Defense Information",
};
export function enrichFARClauses(clauseNumbers) {
  return [...new Set(clauseNumbers)].map(num => ({
    clause_number: num,
    title: FAR_KNOWN[num] || "See FAR/DFARS reference",
    risk_note: num === "52.204-21" ? "Requires cyber safeguarding controls"
      : num === "252.204-7012" ? "DFARS — strict cybersecurity obligations for defense contractors"
      : num === "52.204-7" ? "Active SAM registration required at time of award"
      : "Review clause obligations before submission",
  }));
}
