/**
 * Agent 2 — AUDITOR
 * Extracts compliance requirements, L/M conflicts, FAR flags from the full text.
 * Runs in parallel with the Extractor.
 */

import { callLLMJson } from "../llm/openrouter.js";
import { AUDITOR_PROMPT } from "./agentPrompts.js";
import { logger } from "../utils/logger.js";

const AUDITOR_TEXT_LIMIT = 120_000;

const AUDITOR_DEFAULTS = {
  requirements: [],
  section_lm_conflicts: [],
  far_dfars_flags: [],
  formatting_constraints: {},
  hidden_requirements: [],
};

// Regex fallback — runs when LLM fails entirely
function regexFallback(text) {
  const KEYWORDS = /\b(shall|must|required|mandatory|will be rejected|not acceptable|failure to)\b/i;
  const HIGH_RISK = /\b(clearance|cmmc|nist|cybersecurity|secret|top.secret|ato|il[2-6])\b/i;

  const reqs = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && KEYWORDS.test(l))
    .slice(0, 12)
    .map((line, i) => ({
      id: `REQ-F${String(i + 1).padStart(3, "0")}`,
      text: line.slice(0, 250),
      section: "Unknown",
      category: "Other",
      risk: HIGH_RISK.test(line) ? "HIGH" : "MED",
      is_disqualifier: false,
      action_required: "",
      source_excerpt: line.slice(0, 150),
    }));

  return { ...AUDITOR_DEFAULTS, requirements: reqs };
}

export async function runAuditor(text) {
  const fullText = text.slice(0, AUDITOR_TEXT_LIMIT);

  try {
    const result = await callLLMJson(
      AUDITOR_PROMPT.system,
      AUDITOR_PROMPT.buildUser(fullText),
      { max_tokens: 4096 }
    );

    const reqCount = result.requirements?.length || 0;
    logger.debug("auditor_completed", {
      requirements: reqCount,
      lm_conflicts: result.section_lm_conflicts?.length || 0,
    });

    // If LLM returned nothing useful, fall back
    if (reqCount === 0) {
      logger.warn("auditor_empty_requirements", {
        fallback: "regex",
      });
      const fallback = regexFallback(text);
      return { ...AUDITOR_DEFAULTS, ...result, requirements: fallback.requirements };
    }

    return { ...AUDITOR_DEFAULTS, ...result };
  } catch (err) {
    logger.warn("auditor_failed", {
      error: err.message,
      fallback: "regex",
    });
    return regexFallback(text);
  }
}
