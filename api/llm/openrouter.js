/**
 * LLM Client — priority chain:
 *   1. Mercury 2 direct (Inception Labs) — fastest, no per-call cost on credits plan
 *   2. Gemini direct (Google AI Studio)  — free tier, 1M ctx
 *   3. OpenRouter fallback chain         — backup when above fail
 */

import { logger } from "../utils/logger.js";

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
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      logger.debug("llm_provider_failed", {
        provider: "mercury_direct",
        status: res.status,
        detail: (await res.text()).slice(0, 120),
      });
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      logger.debug("llm_provider_failed", {
        provider: "mercury_direct",
        detail: "empty content",
      });
      return null;
    }
    logger.debug("llm_provider_succeeded", {
      provider: "mercury_direct",
      chars: text.length,
    });
    return text;
  } catch (err) {
    logger.debug("llm_provider_failed", {
      provider: "mercury_direct",
      error: err.message,
    });
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
        signal: AbortSignal.timeout(30_000),
      }
    );
    if (!res.ok) {
      logger.debug("llm_provider_failed", {
        provider: "gemini_direct",
        status: res.status,
        detail: (await res.text()).slice(0, 120),
      });
      return null;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logger.debug("llm_provider_failed", {
        provider: "gemini_direct",
        detail: "empty content",
      });
      return null;
    }
    logger.debug("llm_provider_succeeded", {
      provider: "gemini_direct",
      chars: text.length,
    });
    return text;
  } catch (err) {
    logger.debug("llm_provider_failed", {
      provider: "gemini_direct",
      error: err.message,
    });
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
        logger.debug("llm_provider_failed", {
          provider: "openrouter",
          model,
          status: res.status,
        });
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        logger.debug("llm_provider_failed", {
          provider: "openrouter",
          model,
          detail: "empty content",
        });
        continue;
      }
      logger.debug("llm_provider_succeeded", {
        provider: "openrouter",
        model,
        chars: text.length,
      });
      return text;
    } catch (err) {
      logger.debug("llm_provider_failed", {
        provider: "openrouter",
        model,
        error: err.message,
      });
    }
  }
  return null;
}

// ─── Streaming: Mercury SSE → forward chunks, fallback to chunked text ────────

/**
 * callLLMStream — calls Mercury with stream:true and forwards SSE chunks via
 * onChunk(text). Falls back to full-text providers (Gemini, OpenRouter) and
 * simulates streaming by splitting words into 4-word bursts.
 */
export async function callLLMStream(system, user, opts = {}, onChunk, onDone) {
  const key = process.env.MERCURY_API_KEY;
  const { temperature = 0.1, max_tokens = 4096 } = opts;

  // ── Attempt Mercury native streaming ──────────────────────────────────────
  if (key) {
    try {
      const res = await fetch(MERCURY_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "mercury-2",
          temperature,
          max_tokens,
          stream: true,
          messages: [
            { role: "system", content: system },
            { role: "user",   content: user   },
          ],
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (res.ok && res.body) {
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   buf     = "";
        let   got     = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          // SSE lines are separated by "\n\n" or "\n"
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") { got = true; break; }
            try {
              const chunk = JSON.parse(payload);
              const text  = chunk.choices?.[0]?.delta?.content;
              if (text) { got = true; onChunk(text); }
            } catch {/* skip malformed line */}
          }
        }

        if (got) { onDone(); return; }
      } else {
        logger.debug("llm_stream_mercury_failed", { status: res.status });
      }
    } catch (err) {
      logger.debug("llm_stream_mercury_error", { error: err.message });
    }
  }

  // ── Fallback: get full text, simulate streaming in word bursts ────────────
  let fullText = null;
  try { fullText = await tryGemini(system, user, opts); }    catch {/* continue */}
  if (!fullText) {
    try { fullText = await tryOpenRouter(system, user, opts); } catch {/* continue */}
  }
  if (!fullText) {
    onChunk("I'm having trouble reaching my knowledge base right now. Please try again in a moment.");
    onDone();
    return;
  }

  // Emit in ~4-word bursts to simulate streaming
  const words = fullText.split(" ");
  const BURST = 4;
  for (let i = 0; i < words.length; i += BURST) {
    const slice = words.slice(i, i + BURST).join(" ") + (i + BURST < words.length ? " " : "");
    onChunk(slice);
    await new Promise(r => setTimeout(r, 28)); // ~28ms between bursts ≈ realistic speed
  }
  onDone();
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

  logger.warn("llm_all_providers_failed", {
    mercury_configured: Boolean(process.env.MERCURY_API_KEY),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    openrouter_configured: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_KEY),
  });

  throw new Error("All LLM providers failed. Check MERCURY_API_KEY, GEMINI_API_KEY, and OPENROUTER_API_KEY in Railway env vars.");
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
