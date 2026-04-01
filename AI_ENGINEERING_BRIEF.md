# BidSmith — AI Engineering Brief
**Version:** 2.0 (post-FAANG refactor)
**Date:** April 1, 2026
**Author:** ARIS Labs
**Audience:** AI Engineer / Technical Reviewer

---

## 1. System Overview

BidSmith is a federal RFP audit platform. The AI pipeline ingests government solicitation text (via PDF upload or SAM.gov URL) and produces a structured compliance matrix with risk scoring and bid/no-bid recommendation.

**Primary User Flow:**
```
User uploads PDF or pastes SAM.gov URL
        ↓
Text extraction (pdf-parse / SAM.gov API)
        ↓
AI Audit Pipeline (single-pass LLM + validation + regex)
        ↓
Structured compliance matrix rendered in UI
```

---

## 2. Architecture: Before vs After

### Before (broken — 3-agent MCP swarm)
```
invokeAuditSwarm()
  → extractionAgent()     [MCP stdio subprocess, 30s timeout]
      → LLM call 1: extract raw requirements
  → complianceAgent()     [MCP stdio subprocess, 30s timeout]
      → LLM call 2: classify requirements
  → strategyAgent()       [MCP stdio subprocess, 30s timeout]
      → LLM call 3: generate response strategies
  → synthesizeSwarmResults()
      → merge 3 outputs (field name mismatches silently dropped data)
```
**Why it failed:**
- MCP stdio subprocesses cannot spawn reliably in Railway (containerized, serverless-adjacent)
- 3 × 30s timeout = 90s max wait, all silently returning `{}`
- `extractionAgent` hardcoded `requirements: []` on failure
- Field name mismatch: agents returned `compliance_bugs`, UI expected `bugs`
- Textract called with UTF-8 text buffer (not PDF binary) — always fell to mock

### After (current — single-pass pipeline)
```
runAudit(text, meta)
  → Phase 1: callLLMJson(AUDIT_PROMPT)     [primary extraction]
  → Phase 2: callLLMJson(VALIDATE_PROMPT)  [only if Phase 1 < 3 requirements]
  → Phase 3: shredText(text)               [regex supplement, deduped]
  → toUIFormat(parsed, meta)               [maps to ComplianceMatrix.jsx shape]
```

---

## 3. Agents & Prompts

### 3.1 Primary Audit Agent
**File:** `api/agents/auditPipeline.js` → calls `api/llm/prompts.js`

**System Prompt:**
```
You are a senior federal capture manager and compliance specialist with 20+ years
of experience reviewing government solicitations.

Your job: analyze the given solicitation text and extract ALL compliance requirements
with precision. Miss nothing. Be conservative — when in doubt, flag it.

Rules:
- HIGH risk = disqualifying if missed (clearance, cage code, certifications, bonding, deadlines)
- MED risk = significant but potentially waivable
- LOW risk = formatting, minor administrative
- is_disqualifier = true only for absolute go/no-go requirements
- source_excerpt: copy the exact sentence from the solicitation
- Do NOT invent requirements not present in the text
```

**User Prompt (dynamic — built with solicitation text):**
Asks for structured JSON with this schema:
```json
{
  "solicitation_number": "string",
  "agency": "string",
  "requirements": [{
    "id": "REQ-001",
    "text": "requirement description",
    "section": "L|M|C|H|SOW|CDRL|Other",
    "category": "Personnel|Clearance|Technical|Formatting|Certification|Bonding|Pricing|Past Performance|Other",
    "risk": "HIGH|MED|LOW",
    "is_disqualifier": false,
    "source_excerpt": "exact quote from solicitation"
  }],
  "section_lm_conflicts": ["string"],
  "formatting_constraints": ["string"],
  "far_dfars_flags": [{ "clause": "string", "title": "string", "risk": "HIGH|MED|LOW" }],
  "executive_summary": "string",
  "bid_no_bid": "BID|NO-BID|CONDITIONAL",
  "risk_score": 50
}
```

**Risk Score Formula:**
```
start = 50
+ 20 per disqualifier requirement
+ 10 per HIGH risk requirement
+ 5  per MED risk requirement
- 2  per LOW risk requirement
capped 10–95
```

---

### 3.2 Validation Agent
**File:** `api/agents/auditPipeline.js` → `VALIDATE_PROMPT`

**Trigger condition:** Only fires if Phase 1 returns < 3 requirements (sparse result).

**Purpose:** Second pass specifically hunting for missed FAR/DFARS clauses, security requirements, and disqualifiers that are commonly buried in contract terms.

**System Prompt:**
```
You are a federal contract compliance auditor reviewing a solicitation for
missed compliance requirements. Focus specifically on:
1. FAR/DFARS clauses (52.xxx, 252.xxx)
2. Security clearance requirements
3. Certifications (ISO, CMMC, NIST SP 800-171)
4. Registration requirements (SAM, CAGE, DUNS/UEI)
5. Insurance and bonding
6. Small business set-aside qualifications
```

Returns same schema as Phase 1, merged with deduplication by `id` field.

---

### 3.3 Regex Fallback (Phase 3)
**File:** `api/agents/auditPipeline.js` → `shredText()`

Not an LLM agent. Pure regex pattern matching as a safety net. Always runs and supplements LLM output.

**Patterns detected:**
- FAR/DFARS clauses: `/(?:FAR|DFARS)\s+\d{2,3}\.\d{3}[-\d]*/gi`
- Security clearances: `/(secret|top secret|ts\/sci|public trust|clearance required)/gi`
- Certifications: `/(cmmc|iso\s*9001|iso\s*27001|nist\s*sp\s*800|fedramp)/gi`
- Registrations: `/(cage\s*code|sam\.gov|uei\s*number|duns\s*number)/gi`
- Past performance: `/(past\s*performance|similar\s*contracts|prior\s*experience)/gi`
- Deadlines: `/(submit\s*by|due\s*date|proposal\s*due|deadline)/gi`

Deduped against LLM output by normalized text comparison before merge.

---

## 4. LLM Infrastructure

**File:** `api/llm/openrouter.js`

### Model Fallback Chain
| Priority | Model | Provider | Reason |
|----------|-------|----------|--------|
| 1 | `mercury-2` | Inception (direct API) | 10M free tokens, fast diffusion architecture |
| 2 | `google/gemini-2.5-flash` | OpenRouter | Fast, 1M context window, strong JSON output |
| 3 | `google/gemini-2.0-flash-001` | OpenRouter | Proven stable, reliable JSON |
| 4 | `anthropic/claude-3.5-haiku` | OpenRouter | Strong instruction following, fallback |

### Failure Handling
- Each model: `AbortSignal.timeout(45_000)` — 45s hard timeout
- HTTP non-2xx: logs warning, tries next model
- Empty response: logs warning, tries next model
- All fail: throws `Error("All LLM models failed")`
- JSON parsing: strips markdown fences (` ```json ` / ` ``` `) before parse, regex extracts first `{...}` block as last resort

### Key Settings
```js
temperature: 0.1   // Low — we want deterministic JSON, not creative output
max_tokens: 4096   // Enough for full compliance matrix
context_limit: 120,000 chars  // ~90k tokens, safe for Gemini 1M ctx window
```

---

## 5. Data Ingestion

### PDF Route
**File:** `api/index.js` → `/api/analyze-pdf`
- Accepts: `multipart/form-data` with `file` field (PDF)
- Extracts text: `pdf-parse` library
- Min text threshold: 100 chars (rejects image-only PDFs)
- Passes to: `runAudit(rfpText, meta)`

### SAM.gov URL Route
**File:** `api/services/samGov.js` → `fetchSolicitationText(url)`

**Step 1 — Parse URL:**
```
https://sam.gov/opp/{32-char-hex-uuid}/view
                    ↑ extracted via regex
```

**Step 2 — Fetch opportunity metadata:**
```
GET https://api.sam.gov/opportunities/v2/{noticeId}
    Headers: X-Api-Key: {SAM_API_KEY}
    Timeout: 15s
```

**Step 3 — Download best attachment:**
- Scores up to 15 attachment URLs by filename keyword match
- Keywords: `solicitation`, `rfp`, `rfo`, `pws`, `sow`, `amendment`, `section`
- Downloads top 3 PDFs, returns first with extractable text > 200 chars
- Falls back to `opportunity.description` if no PDF yields text

---

## 6. Output → UI Mapping

**File:** `api/agents/auditPipeline.js` → `toUIFormat(parsed, meta)`

The `ComplianceMatrix.jsx` component expects this shape:
```js
{
  id: string,
  title: string,
  agency: string,
  value: string,
  requirements: [{ id, text, section, category, risk, is_disqualifier, source_excerpt }],
  far_dfars_flags: [{ clause, title, risk }],
  section_lm_conflicts: string[],
  formatting_constraints: string[],
  executive_summary: string,
  bid_no_bid: "BID" | "NO-BID" | "CONDITIONAL",
  risk_score: number (0–100),
  generated_at: ISO timestamp
}
```

---

## 7. Known Failure Modes & Mitigations

| Failure | Cause | Mitigation |
|---------|-------|------------|
| LLM returns non-JSON | Model wraps in markdown or adds preamble | Fence stripping + regex JSON extraction |
| LLM returns empty requirements | Sparse solicitation or model confusion | Phase 2 validation pass + Phase 3 regex |
| SAM.gov PDF is image-only (scanned) | pdf-parse returns empty string | Error 422 returned — future: OCR via Textract |
| SAM.gov API rate limit (6 req/min) | Heavy usage | AbortSignal.timeout(15s) + error boundary |
| Mercury API down | Inception outage | Automatic fallback to OpenRouter chain |
| OpenRouter 402 (no credits) | Account empty | Mercury direct handles 99% of calls |
| RFP text > 120k chars | Very long solicitations | Truncated to 120k — covers 99%+ of solicitations |

---

## 8. Endpoints Summary

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST` | `/api/analyze-pdf` | Upload PDF → compliance matrix | None |
| `POST` | `/api/analyze-link` | SAM.gov URL → compliance matrix | None |
| `POST` | `/api/govcon/generate-matrix` | RFP text → compliance matrix (JSON) | None |
| `POST` | `/api/govcon/draft-proposal` | RFP + company info → exec summary | None |
| `POST` | `/api/govcon/chat` | GovCon AI assistant | None |
| `POST` | `/api/sam-scrape` | Search SAM.gov opportunities | None |

---

## 9. Environment Variables Required

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENROUTER_API_KEY` | OpenRouter LLM gateway | Yes (fallback chain) |
| `MERCURY_API_KEY` | Inception Mercury 2 direct | Yes (primary model) |
| `SAM_API_KEY` | SAM.gov API v2 | Yes (link audits) |
| `DATABASE_URL` | Analytics DB | Optional |
| `STRIPE_SECRET_KEY` | Payments | Optional |

---

## 10. What's NOT Done (Future Work)

1. **OCR for scanned PDFs** — AWS Textract integration exists but was disabled (was being called with text buffer, not PDF binary). Fix: pass `req.file.buffer` directly to Textract only when `pdf-parse` returns < 100 chars.

2. **Streaming responses** — Long RFP audits (120k chars) take 15-30s. `/api/audit-stream` SSE endpoint exists in index.js but `runAudit()` doesn't emit progress events yet.

3. **Caching** — Same SAM.gov notice ID audited multiple times hits LLM every time. Redis/KV cache keyed on `noticeId` + `modelVersion` would drop repeat costs to zero.

4. **Section L/M cross-reference** — The prompt asks for `section_lm_conflicts` but the UI doesn't render this yet. High-value feature: flag when Section M evaluates something Section L doesn't require.

5. **Bid/No-Bid confidence scoring** — Currently binary + CONDITIONAL. A probability score (0-100) with top 3 rationale bullets would be more actionable.
