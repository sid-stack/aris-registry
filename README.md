# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## FDIC Enrichment

FDIC runtime enrichment is available in the API layer.

- Endpoint: `GET /api/enrich/fdic/:oid`
- Alias: `GET /enrich/fdic/:oid`
- Required path param: `oid` (FDIC institution identifier)
- Success payload shape:
  - `success: true`
  - `data: { oid, name, city, state, cert, totalAssets, totalDeposits, totalLoans, netIncome, roa, roe, financialPeriod, source, retrievedAt }`

Configuration (optional):

- `FDIC_API_BASE` (default: `https://api.fdic.gov/v1`)
- `FDIC_API_KEY`
- `FDIC_API_TIMEOUT_MS` (default: `15000`)
- `FDIC_BANKFIND_CACHE_TTL_MS` (default: `86400000`)

FDIC is also injected into the SSE report pipeline (`/api/generate-report-stream`) when `fdicOid` (or `oid`) is present in the report context payload.
# Force Railway rebuild - Tue Mar 17 20:43:38 IST 2026
