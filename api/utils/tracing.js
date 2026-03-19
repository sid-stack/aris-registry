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
      
      if (isCreditError && process.env.GEMINI_API_KEY) {
        console.warn(`[FAILOVER] [${agentKey}] Primary LLM failed (${error.status}). Activating Sovereign Gemini Fallback...`);
        
        // 2. Fallback Attempt (Direct Gemini API Call to avoid dependency overhead)
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
          
          const gRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ 
                role: "user",
                parts: [{ text: params.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n") }] 
              }]
            })
          });

          if (!gRes.ok) {
            const errData = await gRes.json().catch(() => ({}));
            throw new Error(`Gemini Fallback Failed: ${gRes.status} - ${JSON.stringify(errData)}`);
          }
          
          const gData = await gRes.json();
          return gData.candidates?.[0]?.content?.parts?.[0]?.text || "FALLBACK_FAILED_NO_CANDIDATE";
        } catch (gErr) {
          console.error(`[CRITICAL] [${agentKey}] Gemini Fallback also failed:`, gErr.message);
          throw error; // Rethrow original credit error if fallback fails
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
