/**
 * Single round-trip plan + answer JSON contract for GovCon chat.
 */

export const ARIS_JSON_RESPONSE_RULES = `## Response format (required)
Return a single JSON object only — no prose before or after it. Shape:
{
  "steps": [
    { "id": "1", "title": "Short actionable step", "status": "pending" }
  ],
  "answer": "Markdown string: your main reply (bullets and **bold** allowed).",
  "next_action": "One concrete next step or single question for the user."
}
Rules:
- 2–5 steps; titles under 120 characters.
- Use status "done" only if clearly satisfied by loaded audit context; otherwise "pending".
- Ground solicitation-specific claims in the audit context when present.
- Keep answer focused; prefer under ~350 words unless the user asks for depth.
- next_action must be one sentence.`;

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
