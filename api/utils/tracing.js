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

/**
 * Traceable wrapper for OpenRouter / OpenAI calls.
 * Captures inputs, outputs, and agentic metadata.
 */
export const traceLLM = traceable(
  async (clientOpenAI, params, agentKey) => {
    const res = await clientOpenAI.chat.completions.create(params);
    return res.choices[0]?.message?.content || "";
  },
  {
    name: "ARIS_Agentic_Trajectory",
    project_name: process.env.LANGSMITH_PROJECT || "ARIS_Core",
  }
);

/**
 * Manual span for logging intermediate logic steps (e.g., "Step 2: identified Section L").
 */
export async function logStep(sessionId, stepName, metadata = {}) {
  // LangSmith manual event logging logic
  console.log(`[TRACE] [${sessionId}] ${stepName}`, metadata);
}
