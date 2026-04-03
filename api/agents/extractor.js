/**
 * Agent 1 — EXTRACTOR
 * Pulls structural metadata from the first 20k chars of a solicitation.
 * Runs in parallel with the Auditor.
 */

import { callLLMJson } from "../llm/openrouter.js";
import { EXTRACTOR_PROMPT } from "./agentPrompts.js";
import { logger } from "../utils/logger.js";

const EXTRACTOR_TEXT_LIMIT = 20_000;

const EXTRACTOR_DEFAULTS = {
  solicitation_number: null,
  agency: null,
  estimated_value: null,
  naics_code: null,
  set_aside_type: null,
  contract_type: null,
  due_date: null,
  response_window_days: null,
  place_of_performance: null,
  period_of_performance: null,
  detected_sections: [],
};

export async function runExtractor(text, meta = {}) {
  const preview = text.slice(0, EXTRACTOR_TEXT_LIMIT);

  try {
    const result = await callLLMJson(
      EXTRACTOR_PROMPT.system,
      EXTRACTOR_PROMPT.buildUser(preview),
      { max_tokens: 1024 }
    );

    logger.debug("extractor_completed", {
      naics_code: result.naics_code,
      agency: result.agency,
    });

    // Merge with any meta passed in from SAM.gov fetch (meta wins on identity fields)
    return {
      ...EXTRACTOR_DEFAULTS,
      ...result,
      solicitation_number: meta.id || result.solicitation_number,
      agency: meta.agency || result.agency,
      estimated_value: meta.value || result.estimated_value,
    };
  } catch (err) {
    logger.warn("extractor_failed", {
      error: err.message,
      fallback: "meta",
    });
    return {
      ...EXTRACTOR_DEFAULTS,
      solicitation_number: meta.id || null,
      agency: meta.agency || null,
      estimated_value: meta.value || null,
    };
  }
}
