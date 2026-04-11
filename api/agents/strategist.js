/**
 * Agent 3 — STRATEGIST
 * Synthesizes Extractor + Auditor outputs → bid/no-bid verdict + intelligence.
 * Runs AFTER Extractor and Auditor complete.
 */

import { callLLMJson } from "../llm/openrouter.js";
import { STRATEGIST_PROMPT } from "./agentPrompts.js";
import { logger } from "../utils/logger.js";

const STRATEGIST_DEFAULTS = {
  verdict: {
    recommendation: "CONDITIONAL",
    win_probability: 50,
    confidence: "LOW",
    summary: "Automated analysis complete. Manual review recommended.",
    rationale: "Insufficient data for confident recommendation.",
  },
  intelligence: {
    incumbent_signal: { score: 0, label: "LOW", signals_detected: [], explanation: "" },
    evaluation_type: "Unknown",
    evaluation_reality: "",
    price_to_win: { low: 0, high: 0, currency: "USD", rationale: "" },
    team_signal: "SELF-PERFORM",
    team_signal_explanation: "",
    timeline_pressure: { detected: false, days_to_respond: null, explanation: "" },
    top_risks: [],
    key_discriminators: [],
    hidden_requirements: [],
  },
  executive_summary: "",
  bid_no_bid_rationale: "",
  action_plan: [],
  suggested_questions: [],
  proposal_roadmap: [],
  risk_score: 50,
};

function deriveRiskScore(auditorResult, strategistResult) {
  // If strategist gave us a score, use it
  if (strategistResult?.risk_score && strategistResult.risk_score !== 50) {
    return strategistResult.risk_score;
  }
  // Derive from auditor findings
  const reqs = auditorResult.requirements || [];
  let score = 40;
  for (const r of reqs) {
    if (r.is_disqualifier || r.risk === "DISQUALIFIER") score += 22;
    else if (r.risk === "HIGH") score += 8;
    else if (r.risk === "MED") score += 4;
    else score -= 1;
  }
  score += (auditorResult.section_lm_conflicts?.length || 0) * 10;
  return Math.min(95, Math.max(10, score));
}

export async function runStrategist(extractorResult, auditorResult, text) {
  const solicitationPreview = text.slice(0, 4_000);

  try {
    const result = await callLLMJson(
      STRATEGIST_PROMPT.system,
      STRATEGIST_PROMPT.buildUser(extractorResult, auditorResult, solicitationPreview),
      { max_tokens: 3000 }
    );

    logger.debug("strategist_completed", {
      recommendation: result.verdict?.recommendation,
      win_probability: result.verdict?.win_probability,
    });

    return {
      ...STRATEGIST_DEFAULTS,
      ...result,
      intelligence: { ...STRATEGIST_DEFAULTS.intelligence, ...(result.intelligence || {}) },
      verdict: { ...STRATEGIST_DEFAULTS.verdict, ...(result.verdict || {}) },
      risk_score: deriveRiskScore(auditorResult, result),
    };
  } catch (err) {
    logger.warn("strategist_failed", {
      error: err.message,
      fallback: "safe_defaults",
    });
    return {
      ...STRATEGIST_DEFAULTS,
      risk_score: deriveRiskScore(auditorResult, null),
    };
  }
}
