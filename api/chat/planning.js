/**
 * Single round-trip plan + answer JSON contract for GovCon chat.
 */

/** Bump when JSON rules or ARIS_SYSTEM_PROMPT chat behavior changes (cache bust for /api/chat). */
export const ARIS_CHAT_SCHEMA_VERSION = "1";

export const ARIS_JSON_RESPONSE_RULES = `## Response format (required)
Return a single JSON object only — no prose before or after it. Shape:
{
  "steps": [
    { "id": "1", "title": "Short actionable step", "status": "pending" }
  ],
  "answer": "Markdown string: your main reply (bullets and **bold** allowed when helpful).",
  "next_action": "One short follow-up line, or \"\" when none is needed."
}
Rules:
- **steps:** Use an **empty array []** for greetings, thanks, acknowledgments ("ok", "hi", "yes"), or other tiny talk — do **not** show a "Plan" for those. Use **2–5** steps only when the user asks a substantive GovCon / capture / compliance question. Step titles under 120 characters.
- Use status "done" only if clearly satisfied by loaded audit context; otherwise "pending".
- **Grounding:** Never invent solicitation-specific facts (dates, dollar amounts, NAICS, clauses, site visits, maintenance windows, teammates, HUBZone/CMMC claims) that are **not** in the audit context block or the user's message. If context is thin, say what you *can* infer from the loaded audit and offer to go deeper after they paste text or a SAM.gov link.
- Match **verbosity** to the user: one or two sentences for "hi" / "ok"; longer answers only when they ask for analysis, lists, or strategy.
- Keep "answer" focused; prefer under ~120 words unless the user asks for depth (then up to ~350).
- **next_action:** One sentence, or **""** (empty string) when a simple reply is enough.`;

/**
 * @returns {{ steps: Array<{id:string,title:string,status:string}>, answer: string, next_action: string, raw: string }}
 */
export function parseArisPlanJson(raw) {
  if (!raw || typeof raw !== "string") {
    return { steps: [], answer: "", next_action: "", raw: raw || "" };
  }
  const trimmed = raw.trim();
  try {
    return normalizePlan(JSON.parse(trimmed), raw);
  } catch {
    /* try fenced or embedded JSON */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return normalizePlan(JSON.parse(fence[1].trim()), raw);
    } catch {
      /* */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return normalizePlan(JSON.parse(trimmed.slice(start, end + 1)), raw);
    } catch {
      /* */
    }
  }
  return { steps: [], answer: trimmed, next_action: "", raw };
}

function normalizePlan(parsed, raw) {
  if (!parsed || typeof parsed !== "object") {
    return { steps: [], answer: String(raw), next_action: "", raw };
  }
  const steps = Array.isArray(parsed.steps)
    ? parsed.steps.map((s, i) => ({
        id: String(s?.id ?? i + 1),
        title: String(s?.title || `Step ${i + 1}`).slice(0, 200),
        status: s?.status === "done" ? "done" : "pending",
      }))
    : [];
  return {
    steps,
    answer: typeof parsed.answer === "string" ? parsed.answer : "",
    next_action: typeof parsed.next_action === "string" ? parsed.next_action : "",
    raw,
  };
}
