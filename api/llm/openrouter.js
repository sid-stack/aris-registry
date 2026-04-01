/**
 * LLM Client — OpenRouter gateway + Mercury 2 direct fallback.
 *
 * Model priority (OpenRouter):
 *   1. google/gemini-2.5-flash       (primary — fast, 1M ctx, strong JSON)
 *   2. inception/mercury-2           (generous credits, fast diffusion model)
 *   3. google/gemini-2.0-flash-001   (proven stable)
 *   4. anthropic/claude-3.5-haiku    (strong instruction follow)
 *
 * Mercury 2 is also called directly via its own API if MERCURY_API_KEY is set.
 */

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";
const MERCURY_BASE    = "https://api.inceptionlabs.ai/v1/chat/completions";

// OpenRouter model priority — all verified valid IDs
const OPENROUTER_MODELS = [
  "google/gemini-2.5-flash",       // primary — fast, 1M ctx, strong JSON
  "inception/mercury-2",           // generous credits, fast diffusion
  "google/gemini-2.0-flash-001",   // proven stable fallback
  "anthropic/claude-3.5-haiku",    // strong instruction follow
];

function buildOpenRouterHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://bidsmith.pro",
    "X-Title": "BidSmith Audit Engine",
  };
}

function buildMercuryHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MERCURY_API_KEY}`,
  };
}

/**
 * Try Mercury 2 directly (fastest path if MERCURY_API_KEY is set).
 */
async function tryMercuryDirect(system, user, opts = {}) {
  if (!process.env.MERCURY_API_KEY) return null;
  const { temperature = 0.1, max_tokens = 4096 } = opts;
  try {
    const res = await fetch(MERCURY_BASE, {
      method: "POST",
      headers: buildMercuryHeaders(),
      body: JSON.stringify({
        model: "mercury-2",
        temperature,
        max_tokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[LLM] ✗ mercury-2 (direct): ${res.status} ${err.slice(0, 120)}`);
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    console.log(`[LLM] ✓ mercury-2 (direct) (${text.length} chars)`);
    return text;
  } catch (err) {
    console.warn(`[LLM] ✗ mercury-2 (direct): ${err.message}`);
    return null;
  }
}

/**
 * Call LLM with automatic fallback chain:
 *   Mercury direct → OpenRouter (gemini-2.5-flash → mercury-2 → gemini-2.0 → haiku)
 *
 * @param {string} system  - System prompt
 * @param {string} user    - User prompt
 * @param {object} opts    - { temperature, max_tokens }
 * @returns {string}       - Raw response text
 */
export async function callLLM(system, user, opts = {}) {
  const { temperature = 0.1, max_tokens = 4096 } = opts;

  // 1. Try Mercury direct API first (if key available — fastest, most credits)
  const mercuryDirect = await tryMercuryDirect(system, user, opts);
  if (mercuryDirect) return mercuryDirect;

  // 2. OpenRouter fallback chain
  let lastError;
  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_BASE, {
        method: "POST",
        headers: buildOpenRouterHeaders(),
        body: JSON.stringify({
          model,
          temperature,
          max_tokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from model");

      console.log(`[LLM] ✓ ${model} via OpenRouter (${text.length} chars)`);
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
