# Ruthless MVP Enforcement Checklist

## 1) Route map pruning

- [x] Restrict non-core app views in `src/App.jsx` via `VITE_MVP_STRICT_MODE`.
- [x] Keep core destination focused on `app` (`GovConDashboardV2`).
- [x] Remove non-core CTA from active dashboard (`Request Early Access`).

## 2) API surface pruning

- [x] Add `ENABLE_NON_MVP_FEATURES` guard in `api/index.js`.
- [x] Block non-core route groups in strict MVP mode:
  - `/api/fed-search`
  - `/api/track`
  - `/api/govcon/*`
  - `/api/admin/*`
  - `/api/waitlist/*`
  - `/api/create-dynamic-checkout-session`
  - `/api/generate-report-stream`
  - `/api/contact`

## 3) Canonical audit schema

- [x] Add `toMvpAuditResult()` in `api/index.js`.
- [x] Normalize outputs for:
  - `/api/analyze-link`
  - `/api/analyze-text`
  - `/api/analyze-pdf`
- [x] Keep payload focused on MVP steps (summary, verdict, risks, requirements, proposal roadmap).

## 4) Save + export completion in V2

- [x] Keep save flow in `NewAuditModal` -> `/api/audits/save`.
- [x] Implement Proposal Forge export action as downloadable `.md` starter package.

## 5) Release gate policy

- [x] Add CI scope gate script: `scripts/mvp-scope-gate.mjs`.
- [x] Add package script: `npm run mvp:gate`.
- [x] Add gate to `.github/workflows/quality-gate.yml`.

## Operating rule for PRs

Every PR must map to one workflow step:

- `login`, `ingest`, `decision`, `matrix`, `draft`, `save`, `export`

Set `MVP_WORKFLOW_STEP` in CI for traceability. If a PR touches files outside the allowlist without explicit scope update, the gate fails.
