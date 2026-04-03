/**
 * BidSmith Audit Coordinator — 3-Agent Pipeline
 *
 * Architecture:
 *
 *   ┌─────────────────────────────────────┐
 *   │  Input: solicitation text + meta    │
 *   └──────────────┬──────────────────────┘
 *                  │
 *         ┌────────┴────────┐
 *         │  (parallel)     │
 *         ▼                 ▼
 *   [EXTRACTOR]        [AUDITOR]
 *   metadata fast-pass  compliance matrix
 *   first 20k chars     full 120k chars
 *         │                 │
 *         └────────┬────────┘
 *                  │ (both results)
 *                  ▼
 *           [STRATEGIST]
 *           bid/no-bid verdict
 *           win intelligence
 *                  │
 *                  ▼
 *           toUIFormat() → frontend shape
 *
 * Failure handling:
 *   - Extractor fail → meta fallback (non-fatal)
 *   - Auditor fail   → regex shred (non-fatal)
 *   - Strategist fail→ safe defaults (non-fatal)
 *   - All fail       → throw (only if auditor returns 0 requirements)
 */

import { runExtractor } from "./extractor.js";
import { runAuditor } from "./auditor.js";
import { runStrategist } from "./strategist.js";
import { logger } from "../utils/logger.js";

// ─── Value parser ─────────────────────────────────────────────────────────────

function parseValueToNumber(raw) {
  if (!raw) return 0;
  if (typeof raw === "number") return Math.round(raw);
  const s = String(raw).replace(/[$,\s]/g, "").toUpperCase();
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  if (s.endsWith("B")) return Math.round(num * 1_000_000_000);
  if (s.endsWith("M")) return Math.round(num * 1_000_000);
  if (s.endsWith("K")) return Math.round(num * 1_000);
  return Math.round(num);
}

// ─── UI format mapper ─────────────────────────────────────────────────────────

function toUIFormat(extractor, auditor, strategist, meta) {
  const requirements = auditor.requirements || [];
  const intel = strategist.intelligence || {};

  return {
    // ── Identity ──────────────────────────────────────────────────────────────
    id: extractor.solicitation_number || meta?.id || "AUDIT",
    solicitation_number: extractor.solicitation_number || meta?.id || null,
    title: meta?.title || extractor.agency || "Federal Solicitation",
    agency: extractor.agency || meta?.agency || "Federal Agency",
    value: parseValueToNumber(extractor.estimated_value || meta?.value),
    naics: extractor.naics_code,
    naics_code: extractor.naics_code,
    set_aside_type: extractor.set_aside_type,
    contract_type: extractor.contract_type,
    due_date: extractor.due_date,
    response_window_days: extractor.response_window_days || null,
    place_of_performance: extractor.place_of_performance || null,
    period_of_performance: extractor.period_of_performance || null,
    detected_sections: extractor.detected_sections || [],

    // ── Verdict ───────────────────────────────────────────────────────────────
    verdict: {
      recommendation: strategist.verdict?.recommendation || "CONDITIONAL",
      win_probability: strategist.verdict?.win_probability ?? 50,
      confidence: strategist.verdict?.confidence || "MEDIUM",
      summary: strategist.verdict?.summary || "",
      rationale: strategist.verdict?.rationale || "",
    },

    // ── Intelligence signals ──────────────────────────────────────────────────
    intelligence: {
      incumbent_signal: intel.incumbent_signal || { score: 0, label: "LOW", signals_detected: [], explanation: "" },
      evaluation_type: intel.evaluation_type || "Unknown",
      evaluation_reality: intel.evaluation_reality || "",
      price_to_win: intel.price_to_win || { low: 0, high: 0, currency: "USD", rationale: "" },
      team_signal: intel.team_signal || "SELF-PERFORM",
      team_signal_explanation: intel.team_signal_explanation || "",
      timeline_pressure: intel.timeline_pressure || { detected: false, days_to_respond: null, explanation: "" },
      top_risks: intel.top_risks || [],
      key_discriminators: intel.key_discriminators || [],
      hidden_requirements: intel.hidden_requirements || auditor.hidden_requirements || [],
    },

    // ── Compliance matrix ─────────────────────────────────────────────────────
    compliance: requirements.slice(0, 12).map((r, i) => ({
      category: r.category || "Other",
      verdict: r.is_disqualifier ? "DISQUALIFIER" : r.risk === "HIGH" ? "HIGH_RISK" : "WARNING",
      risk: r.risk === "HIGH" ? 85 : r.risk === "MED" ? 60 : 35,
      description: r.text,
      sourceSnippet: r.source_excerpt || r.text?.slice(0, 150),
      sectionRef: `Section ${r.section || "—"}`,
      angle: i * 30,
      label: (r.category || "REQ").slice(0, 3).toUpperCase(),
    })),

    // ── Full requirement rows ─────────────────────────────────────────────────
    requirements: requirements.map((r) => ({
      id: r.id,
      requirement: r.text,
      section: r.section,
      category: r.category,
      status: "Not reviewed",
      risk: r.risk,
      is_disqualifier: r.is_disqualifier,
      action_required: r.action_required || "",
      source_excerpt: r.source_excerpt || "",
      owner: "",
    })),

    // ── L/M conflicts ─────────────────────────────────────────────────────────
    bugs: (auditor.section_lm_conflicts || []).map((c) => ({
      type: "L/M Conflict",
      text: c.description,
      section_ref: `${c.section_l_ref} ↔ ${c.section_m_ref}`,
      implication: c.implication || "",
      risk_score: c.risk === "HIGH" ? 0.9 : 0.6,
      remediation: c.implication || "Resolve conflict before submission",
    })),

    // ── FAR/DFARS flags ───────────────────────────────────────────────────────
    farFlags: (auditor.far_dfars_flags || []).map((f) => ({
      ...f,
      note: f.plain_english || f.note || "",
    })),

    // ── Formatting constraints ────────────────────────────────────────────────
    formattingConstraints: auditor.formatting_constraints || {},

    // ── Action plan ───────────────────────────────────────────────────────────
    action_plan: strategist.action_plan || [],
    suggested_questions: strategist.suggested_questions || [],
    proposal_roadmap: strategist.proposal_roadmap || [],

    // ── Narrative ─────────────────────────────────────────────────────────────
    executiveSummary: strategist.executive_summary || "",
    strategicAnalysis: strategist.bid_no_bid_rationale || "",

    // ── Risk scoring ──────────────────────────────────────────────────────────
    riskAssessment: {
      verdict: strategist.verdict?.recommendation || "CONDITIONAL",
      score: strategist.risk_score || 50,
      breakdown: {
        high_count: requirements.filter((r) => r.risk === "HIGH").length,
        disqualifier_count: requirements.filter((r) => r.is_disqualifier).length,
        total: requirements.length,
      },
      delta_analysis: strategist.bid_no_bid_rationale || "",
    },

    fatalError: (auditor.section_lm_conflicts?.length || 0) > 2,
    generated_at: new Date().toISOString(),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runAudit(text, meta = {}) {
  if (!text || text.length < 50) {
    throw new Error("Solicitation text too short to audit (< 50 chars)");
  }

  logger.info("audit_started", {
    chars: text.length,
    audit_id: meta?.id || null,
  });
  const t0 = Date.now();

  // Phase 1 — Extractor + Auditor run in parallel
  const [extractorResult, auditorResult] = await Promise.all([
    runExtractor(text, meta),
    runAuditor(text),
  ]);

  if (auditorResult.requirements.length === 0) {
    throw new Error("Could not extract any requirements from this solicitation");
  }

  // Phase 2 — Strategist synthesizes both
  const strategistResult = await runStrategist(extractorResult, auditorResult, text);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  logger.info("audit_completed", {
    elapsed_s: Number(elapsed),
    requirements: auditorResult.requirements.length,
    recommendation: strategistResult.verdict?.recommendation || "CONDITIONAL",
  });

  return toUIFormat(extractorResult, auditorResult, strategistResult, meta);
}
