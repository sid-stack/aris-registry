# BidSmith v2 — Session Coordination File
**Last updated:** April 1, 2026  
**Purpose:** Sync between parallel build sessions so we don't conflict.

---

## SESSION A — Claude Code (active: Mar 31 Code Fix)
**Files owned:** `api/agents/auditPipeline.js`, `api/llm/prompts.js`
**Task:** Improving LLM prompt quality + pipeline reliability

**Do NOT change without notifying v2:**
- `toUIFormat()` output schema — v2 UI depends on exact field names
- These specific fields (v2 binds to them directly):
  - `verdict.win_probability`, `verdict.recommendation`, `verdict.summary`
  - `intelligence.incumbent_signal.score`, `intelligence.incumbent_signal.signals_detected`
  - `intelligence.hidden_requirements[]`
  - `intelligence.top_risks[]`, `intelligence.key_discriminators[]`
  - `requirements[]` — each with `{ id, requirement, section, risk, is_disqualifier, action_required }`
  - `proposal_roadmap[]`
  - `intelligence.evaluation_type`, `intelligence.evaluation_reality`
  - `intelligence.price_to_win.low`, `intelligence.price_to_win.high`

**Safe to add:** New top-level fields on the output object (v2 will pick them up automatically)

---

## SESSION B — Cowork/v2 Build (this session)
**Files owned:** `src/pages/GovConDashboardV2.jsx`, `src/components/forge/*`
**Task:** Building v2 UI — Intelligence Brief, TipTap Proposal Forge, Compliance Gutter

**Not touching:** `api/agents/auditPipeline.js`, `api/llm/prompts.js`, `src/pages/Audit.jsx`

---

## Shared Data Contract

The auditPipeline.js `runAudit()` output is the **single source of truth**.  
v2 UI consumes it as-is. No transformation layer.

Key schema (DO NOT BREAK):
```js
{
  verdict: {
    recommendation: "BID | NO-BID | CONDITIONAL",
    win_probability: 0-100,     // integer
    confidence: "HIGH|MEDIUM|LOW",
    summary: "string",
    rationale: "string"
  },
  intelligence: {
    incumbent_signal: {
      score: 0-10,
      label: "LOW|MODERATE|HIGH|CRITICAL",
      signals_detected: [{ signal, found, evidence }],
      explanation: "string"
    },
    evaluation_type: "string",
    evaluation_reality: "string",
    price_to_win: { low, high, currency, rationale },
    top_risks: [{ risk, severity, action }],
    key_discriminators: ["string"],
    hidden_requirements: [{ text, found_in, risk, implication }]
  },
  requirements: [{ id, requirement, section, risk, is_disqualifier, action_required }],
  proposal_roadmap: [{ section, recommended_pages, focus_areas, discriminator }]
}
```

---

## Build Priority (v2 Session B)
1. ✅ Intelligence Brief component (IntelligenceBrief.jsx) — verdict + incumbent signal + risks
2. 🔄 ProposalForge.jsx — TipTap canvas with auditPipeline output as context
3. ⬜ ComplianceGutter — TipTap extension marking unaddressed requirements
4. ⬜ GovConDashboardV2.jsx — wrapper routing to all v2 components
