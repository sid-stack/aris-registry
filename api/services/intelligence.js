import OpenAI from "openai";

const primaryClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://bidsmith.pro",
    "X-Title": "ARIS Sovereign v2.1"
  }
});

/**
 * Sovereign Intelligence Gateway
 * Centralized model orchestration with multi-provider failover.
 */
export async function complete(params, agentKey = "sovereign_core") {
  try {
    // 1. Primary Inference (Primary Model via OpenRouter)
    const res = await primaryClient.chat.completions.create(params);
    return res.choices[0]?.message?.content || "";
  } catch (error) {
    const isCreditError = error.status === 402 || error.message?.includes("credits") || error.status === 429;
    
    if (isCreditError) {
      console.warn(`[SOVEREIGN_GATEWAY] [${agentKey}] Primary Fallback Triggered: ${error.status}`);
      
      // 2. Secondary Inference (Gemini 2.0 Flash Free - Premium capability, zero cost)
      try {
        const freeRes = await primaryClient.chat.completions.create({
          ...params,
          model: "google/gemini-2.0-flash:free"
        });
        return freeRes.choices[0]?.message?.content || "";
      } catch (fErr) {
        console.warn(`[SOVEREIGN_GATEWAY] [${agentKey}] Secondary Fallback Failed:`, fErr.message);
        
        // 3. Tertiary Inference (Llama 3.3 70B Free - High accuracy fallback)
        try {
          const tRes = await primaryClient.chat.completions.create({
            ...params,
            model: "meta-llama/llama-3.3-70b-instruct:free"
          });
          return tRes.choices[0]?.message?.content || "";
        } catch (tErr) {
          console.error(`[SOVEREIGN_GATEWAY] [${agentKey}] TOTAL INTELLIGENCE BLACKOUT`);
          throw error;
        }
      }
    }
    throw error;
  }
}
