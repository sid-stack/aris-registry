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
 * Traceable wrapper for LLM calls with Automatic Failover.
 * Tries Primary (OpenRouter/Claude) -> Fallback (Google Gemini).
 */
export const traceLLM = traceable(
  async (clientOpenAI, params, agentKey) => {
    try {
      // 1. Primary Attempt (OpenRouter)
      const res = await clientOpenAI.chat.completions.create(params);
      return res.choices[0]?.message?.content || "";
    } catch (error) {
      const isCreditError = error.status === 402 || error.message?.includes("credits") || error.status === 429;
      
      if (isCreditError) {
        console.warn(`[FAILOVER] [${agentKey}] Primary LLM failed (${error.status}). Activating Sovereign FREE-Tier Fallback...`);
        
        // 2. Fallback Attempt (OpenRouter FREE model - works with 0 balance)
        try {
          const freeParams = {
            ...params,
            model: "google/gemma-7b-it:free" // Highest quality free model on OpenRouter
          };
          
          const freeRes = await clientOpenAI.chat.completions.create(freeParams);
          return freeRes.choices[0]?.message?.content || "FALLBACK_FAILED_EMPTY_RESPONSE";
        } catch (fErr) {
          console.error(`[CRITICAL] [${agentKey}] Free Fallback also failed:`, fErr.message);
          
          // 3. Final Hail Mary (Mistral 7B Free)
          try {
            const finalRes = await clientOpenAI.chat.completions.create({
              ...params,
              model: "mistralai/mistral-7b-instruct:free"
            });
            return finalRes.choices[0]?.message?.content || "SHREDDED_OUTPUT_FAILURE";
          } catch (mErr) {
            throw error; // Rethrow original credit error if all fallbacks fail
          }
        }
      }
      
      throw error;
    }
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
