# First-Pass Feature Classification (Repo-Based)

## Keep (active MVP scope)

- Auth/login: `src/main.jsx`, `src/App.jsx`
- RFP ingestion (URL/text/PDF): `src/pages/GovConDashboardV2.jsx`, `api/index.js`, `api/services/samGov.js`
- Bid/no-bid + reasons: `api/agents/strategist.js`, `api/agents/coordinator.js`, `src/components/forge/IntelligenceBrief.jsx`
- Compliance matrix: `api/agents/auditor.js`, `src/components/dashboard/ComplianceMatrix.jsx`
- Draft proposal starter: `src/components/forge/ProposalForge.jsx`
- Save opportunity/history: `api/services/analytics.js`, `api/index.js`, `src/pages/GovConDashboardV2.jsx`
- Export output: `src/components/forge/ProposalForge.jsx`, `api/index.js` (`/api/export-rtm`)

## Freeze (useful, not required for reliable MVP path)

- Opportunity notes / admin note workflows: `api/index.js` (`/api/admin/pending-reports/:id/notes`)
- Weighted scoring and expanded intelligence overlays outside core decision payload
- Source citations and drilldown UX not needed for first reliable chain
- Company profile enrichment and advanced scoring dimensions

## Kill from active MVP surface

- Opportunity search/discovery: `src/pages/BidSmithSearch.jsx`, `src/pages/Discovery.jsx`, `api/services/fedSearch.js`, `api/index.js` (`/api/fed-search`)
- Dashboards/admin analytics: `src/pages/AdminDashboard.jsx`, `src/components/SurveyAnalytics.jsx`, `src/components/DemoAnalytics.jsx`, `api/index.js` (`/api/admin/*`, `/api/track`)
- Collaboration/chat: `api/index.js` (`/api/govcon/chat`)
- Waitlist and outreach operations in product path: `api/index.js` (`/api/waitlist/*`)
- Experimental/labs paths: `src/pages/Labs.jsx`, non-core routes in `src/App.jsx`

## Notes

- This classification is intentionally strict to improve end-to-end reliability.
- Any exception requires explicit mapping to one MVP workflow step.
