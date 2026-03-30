import { Client } from "langsmith";
import { traceable } from "langsmith/traceable";

/**
 * ARIS Observability & Traceability Layer
 * Powered by LangSmith. Turns the "Stateless Bridge" into a transparent audit trail.
 */

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
  endpoint: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
});

import { complete as sovereignComplete } from "../services/intelligence.js";

/**
 * Traceable wrapper for LLM calls with Sovereign Orchestration.
 * Delegates to intelligence.js for provider-agnostic failover.
 */
const baseTraceLLM = async (clientOpenAI, params, agentKey) => {
  return await sovereignComplete(params, agentKey);
};

export const traceLLM = process.env.LANGSMITH_API_KEY
  ? traceable(baseTraceLLM, {
      name: "ARIS_Agentic_Trajectory",
      project_name: process.env.LANGSMITH_PROJECT || "ARIS_Core",
    })
  : baseTraceLLM;

/**
 * Manual span for logging intermediate logic steps (e.g., "Step 2: identified Section L").
 */
export async function logStep(sessionId, stepName, metadata = {}) {
  // LangSmith manual event logging logic
  console.log(`[TRACE] [${sessionId}] ${stepName}`, metadata);
}
