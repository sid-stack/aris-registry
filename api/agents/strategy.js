import { complete } from "../llm/gemini.js";

/**
 * STRATEGY_AGENT
 * Focus: Win-themes, Capture strategy, Executive Summary.
 */
export const strategyAgent = {
  async process(ctx, log) {
    log("SYNTHESIZING_WIN_THEMES...");
    
    const extractionResults = JSON.stringify(ctx.results.extraction);
    const complianceResults = JSON.stringify(ctx.results.compliance);

    const prompt = `You are the STRATEGY_AGENT. 
Based on these extraction and compliance findings, generate a McKinsey-grade capture strategy.

EXTRACTION: ${extractionResults}
COMPLIANCE: ${complianceResults}

Return strict JSON with fields: summary (markdown string), analysis (markdown string).`;

    const result = await complete(prompt, "Strategy Agent Context", { json: true });
    
    log("STRATEGIC_DELTA_ANALYSIS_LOCKED.");
    return result;
  }
};
