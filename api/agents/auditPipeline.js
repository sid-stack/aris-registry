/**
 * BidSmith Audit Pipeline — Single-pass compliance extraction.
 *
 * Architecture:
 *   input text → ONE LLM call (AUDIT_PROMPT) → structured JSON → UI format
 *
 * Why single-pass instead of 3 agents?
 *   - 3 agents called sequentially = 3× latency, 3× failure surface
 *   - Agents shared no context — each saw the same text independently
 *   - Field name mismatches between agents caused silent empty results
 *   - One well-structured prompt with explicit schema is more reliable
 *
 * Failure handling:
 *   - If first pass returns < 3 requirements, run VALIDATE_PROMPT second pass
 *   - If LLM fails entirely, run shredText() regex fallback on the raw text
 *   - Never return an empty compliance array silently
 */

import { callLLMJson } from "../llm/openrouter.js";
import { AUDIT_PROMPT, VALIDATE_PROMPT } from "../llm/prompts.js";

// ─── Regex fallback ───────────────────────────────────────────────────────────
// Last resort when all LLM calls fail. Extracts "shall/must/required" lines.

function shredText(text) {
  const KEYWORDS = /\b(shall|must|required|mandatory|will be rejected|not acceptable|failure to)\b/i;
  const HIGH_RISK = /\b(clearance|cmmc|nist|cybersecurity|secret|top.secret|ato|il[2-6])\b/i;

  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && KEYWORDS.test(l))
    .slice(0, 20)
    .map((line, i) => ({
      id: `REQ-${String(i + 1).padStart(3, "0")}`,
      text: line.slice(0, 250),
      section: "Other",
      category: "Other",
      risk: HIGH_RISK.test(line) ? "HIGH" : "MED",
      is_disqualifier: false,
      source_excerpt: line.slice(0, 150),
    }));
}

// ─── UI format mapper ─────────────────────────────────────────────────────────
// Maps the LLM JSON schema to the shape the frontend ComplianceMatrix expects.

function toUIFormat(parsed, meta) {
  const requirements = parsed.requirements || [];

  return {
    // Identity
    id: parsed.solicitation_number || meta?.id || "AUDIT",
    title: meta?.title || parsed.agency || "Federal Solicitation",
    agency: parsed.agency || meta?.agency || "Federal Agency",
    value: parsed.estimated_value || meta?.value || "0",

    // Compliance matrix rows (for the radar/table in ComplianceMatrix.jsx)
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

    // Full requirement rows (for the matrix table)
    requirements: requirements.map((r) => ({
      id: r.id,
      requirement: r.text,
      section: r.section,
      category: r.category,
      status: "Not reviewed",
      risk: r.risk,
      is_disqualifier: r.is_disqualifier,
      owner: "",
    })),

    // L/M conflicts
    bugs: (parsed.section_lm_conflicts || []).map((c) => ({
      type: "L/M Conflict",
      text: c.description,
      section_ref: `${c.section_l_ref} ↔ ${c.section_m_ref}`,
      risk_score: c.risk === "HIGH" ? 0.9 : 0.6,
      remediation: "Resolve conflict before submission",
    })),

    // FAR/DFARS flags
    farFlags: parsed.far_dfars_flags || [],

    // Formatting constraints
    formattingConstraints: parsed.formatting_constraints || {},

    // Narrative outputs
    executiveSummary: parsed.executive_summary || "",
    strategicAnalysis: parsed.bid_no_bid_rationale || "",

    // Risk scoring
    riskAssessment: {
      verdict: parsed.bid_no_bid || "CONDITIONAL",
      score: parsed.risk_score || deriveScore(requirements),
      breakdown: {
        high_count: requirements.filter((r) => r.risk === "HIGH").length,
        disqualifier_count: requirements.filter((r) => r.is_disqualifier).length,
        total: requirements.length,
      },
      delta_analysis: parsed.bid_no_bid_rationale || "",
    },

    fatalError: (parsed.section_lm_conflicts?.length || 0) > 2,

    // Metadata
    naics_code: parsed.naics_code,
    set_aside_type: parsed.set_aside_type,
    contract_type: parsed.contract_type,
    due_date: parsed.due_date,
  };
}

function deriveScore(requirements) {
  let score = 50;
  for (const r of requirements) {
    if (r.is_disqualifier) score += 20;
    else if (r.risk === "HIGH") score += 10;
    else if (r.risk === "MED") score += 5;
    else score -= 2;
  }
  return Math.min(95, Math.max(10, score));
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run the full audit pipeline on solicitation text.
 *
 * @param {string} text  - Full solicitation text (no length limit applied here)
 * @param {object} meta  - { id, title, agency, value } from SAM.gov or upload
 * @returns {object}     - UI-formatted audit result
 */
export async function runAudit(text, meta = {}) {
  if (!text || text.length < 50) {
    throw new Error("Solicitation text too short to audit (< 50 chars)");
  }

  // Gemini 2.0 Flash has 1M token context. We trim to ~120k chars (~90k tokens)
  // to stay comfortably inside the limit while keeping full solicitation coverage.
  const trimmedText = text.slice(0, 120_000);

  console.log(`[AUDIT_PIPELINE] Starting audit (${trimmedText.length} chars)`);

  // ── Phase 1: Primary extraction ──────────────────────────────────────────
  let parsed;
  try {
    parsed = await callLLMJson(
      AUDIT_PROMPT.system,
      AUDIT_PROMPT.buildUser(trimmedText)
    );
    console.log(`[AUDIT_PIPELINE] Phase 1 complete: ${parsed.requirements?.length || 0} requirements`);
  } catch (err) {
    console.error(`[AUDIT_PIPELINE] Phase 1 LLM failed: ${err.message}`);
    // Full LLM failure → regex fallback
    const fallbackReqs = shredText(text);
    if (fallbackReqs.length === 0) {
      throw new Error("Could not extract any requirements from this solicitation");
    }
    return toUIFormat(
      {
        requirements: fallbackReqs,
        executive_summary: "Automated extraction used (LLM unavailable). Manual review recommended.",
        bid_no_bid: "CONDITIONAL",
        bid_no_bid_rationale: "LLM extraction failed; regex fallback results shown.",
        risk_score: 55,
      },
      meta
    );
  }

  // ── Phase 2: Validation pass (only if Phase 1 returned sparse results) ───
  if ((parsed.requirements?.length || 0) < 3) {
    console.log(`[AUDIT_PIPELINE] Sparse results (${parsed.requirements?.length}), running validation pass`);
    try {
      const validation = await callLLMJson(
        VALIDATE_PROMPT.system,
        VALIDATE_PROMPT.buildUser(trimmedText, parsed.requirements || [])
      );
      if (validation.additional_requirements?.length) {
        parsed.requirements = [
          ...(parsed.requirements || []),
          ...validation.additional_requirements,
        ];
        console.log(`[AUDIT_PIPELINE] Validation added ${validation.additional_requirements.length} requirements`);
      }
    } catch (err) {
      console.warn(`[AUDIT_PIPELINE] Validation pass failed (non-fatal): ${err.message}`);
    }
  }

  // ── Phase 3: Regex supplement (catches anything LLM missed at low cost) ──
  const regexReqs = shredText(text);
  const existingTexts = new Set((parsed.requirements || []).map((r) => r.text?.slice(0, 80)));
  const newRegexReqs = regexReqs.filter((r) => !existingTexts.has(r.text?.slice(0, 80)));

  if (newRegexReqs.length > 0) {
    // Re-number supplemental requirements
    const offset = parsed.requirements?.length || 0;
    const renumbered = newRegexReqs.slice(0, 5).map((r, i) => ({
      ...r,
      id: `REQ-S${String(offset + i + 1).padStart(3, "0")}`,
    }));
    parsed.requirements = [...(parsed.requirements || []), ...renumbered];
  }

  return toUIFormat(parsed, meta);
}
