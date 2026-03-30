import { complete as sovereignComplete } from "../services/intelligence.js";

/**
 * Thin wrapper matching the agents' call signature:
 * complete(userPrompt, systemPrompt, { json: true })
 */
export async function complete(userPrompt, systemPrompt = "", options = {}) {
  const result = await sovereignComplete({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: options.temperature || 0.1,
    max_tokens: options.max_tokens || 4096,
  }, "agent_complete");

  if (options.json) {
    const match = result.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error("INVALID_LLM_JSON_RESPONSE");
    return JSON.parse(match[0]);
  }
  return result;
}
