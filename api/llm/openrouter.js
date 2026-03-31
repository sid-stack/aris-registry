/**
 * OpenRouter LLM Client — Primary inference gateway.
 *
 * Model priority:
 *   1. google/gemini-2.0-flash-001  (fast, 1M ctx, excellent JSON)
 *   2. anthropic/claude-3-5-haiku   (fallback, strong instruction follow)
 *   3. google/gemini-flash-1.5      (free tier, last resort)
 *
 * All calls enforce JSON mode where supported.
 */

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
  "google/gemini-2.5-flash",         // primary — fast, 1M ctx, strong JSON
  "google/gemini-2.0-flash-001",     // fallback — proven stable
  "anthropic/claude-3.5-haiku",      // fallback — strong instruction follow
];

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://bidsmith.pro",
    "X-Title": "BidSmith Audit Engine",
  };
}

/**
 * Call OpenRouter with automatic model fallback.
 *
 * @param {string} system  - System prompt
 * @param {string} user    - User prompt (the RFP text + instructions)
 * @param {object} opts    - { temperature, max_tokens, json }
 * @returns {string}       - Raw response text
 */
export async function callLLM(system, user, opts = {}) {
  const { temperature = 0.1, max_tokens = 4096 } = opts;

  let lastError;
  for (const model of MODELS) {
    try {
      const body = {
        model,
        temperature,
        max_tokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };

      const res = await fetch(OPENROUTER_BASE, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) throw new Error("Empty response from model");
      console.log(`[LLM] ✓ ${model} (${text.length} chars)`);
      return text;
    } catch (err) {
      console.warn(`[LLM] ✗ ${model}: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`All LLM models failed. Last error: ${lastError?.message}`);
}

/**
 * Like callLLM but parses and returns JSON.
 * Handles markdown-wrapped responses (```json ... ```) automatically.
 */
export async function callLLMJson(system, user, opts = {}) {
  const raw = await callLLM(system, user, opts);

  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract first JSON object/array from response
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {/* fall through */}
    }
    throw new Error(`LLM returned non-JSON: ${cleaned.slice(0, 300)}`);
  }
}
