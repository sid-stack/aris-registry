import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🚀 AI STUDIO (DIRECT GEMINI 2.0 ACCESS)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 🛡️ OPENROUTER (FAILOVER / AGNOSTIC GATEWAY)
const backupClient = new OpenAI({
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
 * Prioritizes direct Google AI Studio (Gemini 2.0) for GovCon-tier precision.
 */
export async function complete(params, agentKey = "sovereign_core") {
  const { messages, temperature = 0.1, max_tokens = 2048 } = params;

  try {
    // 1. PRIMARY: Google AI Studio (Direct Gemini 2.0 Flash)
    // Extract last message and system context for Gemini SDK
    const systemPrompt = messages.find(m => m.role === 'system')?.content || "";
    const userPrompt = messages.find(m => m.role === 'user')?.content || "";
    const history = messages.filter(m => m.role !== 'system' && m.role !== 'user');

    console.log(`[SOVEREIGN_GATEWAY] [${agentKey}] Primary Inference: Gemini 2.0 Studio`);
    
    // Simple mapping for demonstration; can be expanded for full history
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: max_tokens,
      }
    });

    const responseText = result.response.text();
    if (responseText) return responseText;
    
    throw new Error("EMPTY_GEMINI_RESPONSE");

  } catch (error) {
    console.warn(`[SOVEREIGN_GATEWAY] [${agentKey}] AI Studio Fallback Triggered:`, error.message);

    try {
      // 2. SECONDARY: OpenRouter (Primary Model via OpenRouter)
      // Map generic model names to OpenRouter specific ones
      let model = params.model || "google/gemini-2.0-flash-001";
      if (!model.includes("/")) model = `google/${model}`;
      
      console.log(`[SOVEREIGN_GATEWAY] [${agentKey}] Secondary Inference: OpenRouter (${model})`);
      
      const res = await backupClient.chat.completions.create({
        ...params,
        model: model
      });
      return res.choices[0]?.message?.content || "";
    } catch (backErr) {
      console.error(`[SOVEREIGN_GATEWAY] [${agentKey}] OpenRouter Error:`, backErr.message);
      const isCreditError = backErr.status === 402 || backErr.message?.includes("credits") || backErr.status === 429;
      
      if (isCreditError) {
        // 3. TERTIARY: OpenRouter Universal Free (Flash 1.5 usually)
        try {
          console.log(`[SOVEREIGN_GATEWAY] [${agentKey}] Tertiary Inference: OpenRouter Free Tier`);
          const freeRes = await backupClient.chat.completions.create({
            ...params,
            model: "google/gemini-flash-1.5-exp" // Reliable free model on OpenRouter
          });
          return freeRes.choices[0]?.message?.content || "";
        } catch (fErr) {
          console.error(`[SOVEREIGN_GATEWAY] [${agentKey}] TOTAL INTELLIGENCE BLACKOUT`);
          throw error; // Throw the primary error
        }
      }
      throw backErr;
    }
  }
}
