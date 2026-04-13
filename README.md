# BidSmith — Federal RFP Intelligence Platform
**by ARIS Labs** · [bidsmith.pro](https://bidsmith.pro)

AI-powered audit engine for government contractors. Instant compliance matrix, FAR/DFARS risk flags, and bid/no-bid recommendation from any SAM.gov link or PDF.

---

## Quick Start

### Golden Run — one command to start everything

```bash
npm run dev & npm start
```

- `npm run dev` — Vite dev server on **:5173** (hot-reload, proxies `/api` → :8080)
- `npm start`   — Express API server on **:8080**

> **Note:** This is a Vite + React frontend with an Express.js API backend.
> There is no Python/uvicorn server. The API lives in `api/index.js`.

### Environment

Copy `.env.example` to `.env` and fill in:

```bash
OPENROUTER_API_KEY=         # LLM inference
VITE_CLERK_PUBLISHABLE_KEY= # Auth
CLERK_SECRET_KEY=
SAM_GOV_API_KEY=            # Optional — SAM.gov enrichment
```

---

## Bento Dashboard

The intelligence dashboard lives at **`/bento`**. It provides:

| Card | Route wired |
|------|-------------|
| RFP Upload Zone | `POST /api/audit/pdf` · `POST /api/audit/link` |
| Live Analysis (confidence scores + citations) | Reactive to upload result |
| Bid Brief + Copy to Clipboard | Reactive to upload result |
| Eval Status (5 dots, live poll) | `GET /api/evals/status` |

---

## Inference Regression Testing (Evals)

Run the Golden Set against the live API before shipping any prompt or RAG change.

### Run evals (local)

```bash
python scripts/run_evals.py
```

### Run against production

```bash
EVAL_API_URL=https://bidsmith.pro python scripts/run_evals.py
```

### Save a baseline (do this after a known-good state)

```bash
python scripts/run_evals.py --baseline
```

### Compare against baseline (regression check)

```bash
python scripts/run_evals.py --compare --verbose
```

### CI gate (exits 1 if overall fails)

```bash
python scripts/run_evals.py || echo "REGRESSION DETECTED — do not ship"
```

### Output

Results are written to `tests/eval_results.json` and immediately reflected in the `/bento` dashboard Eval Status card (polls every 30 seconds).

### The 5 Golden Evals

| # | Label | Tests |
|---|-------|-------|
| 1 | SHALL vs WILL Compliance Extraction | Parsing precision — must distinguish SHALL, WILL, ambiguous |
| 2 | Bid/No-Bid Under Competing Constraints | Reasoning under conflicting eligibility signals |
| 3 | Cross-Section Requirement Conflict | Cross-document reasoning, FAR section hierarchy |
| 4 | NIST SP 800-53 Scope Interpretation | Domain knowledge depth (cybersecurity controls) |
| 5 | Teaming Agreement Compliance | FAR 52.219 limitation on subcontracting, affiliation risk |

**Rule:** If any eval regresses below its `min_keyword_score`, do not ship.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/audit/pdf` | Upload PDF → full audit result |
| `POST` | `/api/audit/link` | SAM.gov URL → full audit result |
| `POST` | `/api/audit/text` | Raw text → full audit result (used by evals) |
| `GET`  | `/api/evals/status` | Serves `tests/eval_results.json` to the dashboard |
| `GET`  | `/api/health` | API + provider key status |
| `POST` | `/api/chat` | Follow-up chat with audit context |

### Audit Pipeline — 3 Logged Stages

Every `/api/audit/pdf` and `/api/audit/link` call emits structured JSON logs:

```
stage: 1_retrieval  — PDF parse or SAM.gov fetch
stage: 2_chunking   — Text preparation and size estimation
stage: 3_inference  — 3-agent LLM pipeline (Extractor → Auditor → Strategist)
```

Search logs for `"audit_stage"` to trace any request end-to-end.

### Error format

All API errors return consistent JSON:

```json
{ "error": "Human-readable message", "code": 422 }
```

---

## Project Structure

```
aris-core/
├── api/                    # Express.js API
│   ├── agents/             # 3-agent pipeline (coordinator, extractor, auditor, strategist)
│   ├── services/           # SAM.gov, analytics, waitlist, stripe
│   ├── utils/              # logger, tracing, mailer, asyncHandler
│   └── index.js            # Entry point, all routes
├── src/                    # Vite + React frontend
│   ├── components/
│   │   └── bento/          # Bento dashboard components
│   │       ├── RfpUploadZone.jsx
│   │       ├── LiveAnalysisCard.jsx
│   │       ├── BidOutputCard.jsx
│   │       └── EvalStatusCard.jsx
│   └── pages/
│       ├── BentoDashboard.jsx   # /bento
│       └── GovConDashboardV2.jsx # /app (full chat UI)
├── scripts/
│   └── run_evals.py        # Inference regression tester
└── tests/
    ├── evals.json           # Golden Set definitions
    └── eval_results.json    # Latest run output (auto-generated)
```

---

## Deployment

Deployed on **Railway** (API + static). CI via `ci.yml`.

```bash
# Build
npm run build

# Preview build locally
npm run preview
```

---

*Force Railway rebuild — see railway.json for config.*
