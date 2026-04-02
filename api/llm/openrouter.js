/**
 * LLM Client — priority chain:
 *   1. Mercury 2 direct (Inception Labs) — fastest, no per-call cost on credits plan
 *   2. Gemini direct (Google AI Studio)  — free tier, 1M ctx
 *   3. OpenRouter fallback chain         — backup when above fail
 */

const MERCURY_BASE    = "https://api.inceptionlabs.ai/v1/chat/completions";
const GEMINI_BASE     = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

// OpenRouter models (backup only — requires credits)
const OPENROUTER_MODELS = [
  "google/gemini-2.5-flash",
  "inception/mercury-2",
  "google/gemini-2.0-flash-001",
  "anthropic/claude-3.5-haiku",
];

// ─── Mercury 2 direct ─────────────────────────────────────────────────────────

async function tryMercury(system, user, opts = {}) {
  const key = process.env.MERCURY_API_KEY;
  if (!key) return null;
  const { temperature = 0.1, max_tokens = 4096 } = opts;
  try {
    const res = await fetch(MERCURY_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "mercury-2",
        temperature,
        max_tokens,
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.warn(`[LLM] ✗ mercury-2 direct: ${res.status} ${(await res.text()).slice(0, 120)}`);
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) { console.warn("[LLM] ✗ mercury-2 direct: empty content"); return null; }
    console.log(`[LLM] ✓ mercury-2 direct (${text.length} chars)`);
    return text;
  } catch (err) {
    console.warn(`[LLM] ✗ mercury-2 direct: ${err.message}`);
    return null;
  }
}

// ─── Gemini direct ────────────────────────────────────────────────────────────

async function tryGemini(system, user, opts = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const { max_tokens = 4096 } = opts;
  const model = "gemini-2.0-flash";
  try {
    const res = await fetch(
      `${GEMINI_BASE}/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: max_tokens, temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(60_000),
      }
    );
    if (!res.ok) {
      console.warn(`[LLM] ✗ gemini direct: ${res.status} ${(await res.text()).slice(0, 120)}`);
      return null;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) { console.warn("[LLM] ✗ gemini direct: empty content"); return null; }
    console.log(`[LLM] ✓ gemini direct (${text.length} chars)`);
    return text;
  } catch (err) {
    console.warn(`[LLM] ✗ gemini direct: ${err.message}`);
    return null;
  }
}

// ─── OpenRouter fallback ──────────────────────────────────────────────────────

async function tryOpenRouter(system, user, opts = {}) {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_KEY;
  if (!key) return null;
  const { temperature = 0.1, max_tokens = 4096 } = opts;

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://bidsmith.pro",
          "X-Title": "BidSmith Audit Engine",
        },
        body: JSON.stringify({
          model, temperature, max_tokens,
          messages: [
            { role: "system", content: system },
            { role: "user",   content: user   },
          ],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        console.warn(`[LLM] ✗ openrouter/${model}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) { console.warn(`[LLM] ✗ openrouter/${model}: empty`); continue; }
      console.log(`[LLM] ✓ openrouter/${model} (${text.length} chars)`);
      return text;
    } catch (err) {
      console.warn(`[LLM] ✗ openrouter/${model}: ${err.message}`);
    }
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function callLLM(system, user, opts = {}) {
  // 1. Mercury 2 direct (fastest — diffusion model, generous credits)
  const mercury = await tryMercury(system, user, opts);
  if (mercury) return mercury;

  // 2. Gemini 2.0 Flash direct (free tier, 1M context)
  const gemini = await tryGemini(system, user, opts);
  if (gemini) return gemini;

  // 3. OpenRouter (requires account credits)
  const openrouter = await tryOpenRouter(system, user, opts);
  if (openrouter) return openrouter;

  throw new Error("All LLM providers failed. Check MERCURY_API_KEY and GEMINI_API_KEY in Railway env vars.");
}

export async function callLLMJson(system, user, opts = {}) {
  const raw = await callLLM(system, user, opts);

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {/* fall through */}
    }
    throw new Error(`LLM returned non-JSON: ${cleaned.slice(0, 300)}`);
  }
}
