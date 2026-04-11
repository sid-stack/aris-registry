/**
 * Client-side parse of ARIS chat JSON (mirrors api/chat/planning.js).
 */

export function parseArisPlanJson(raw) {
  if (!raw || typeof raw !== "string") {
    return { steps: [], answer: "", next_action: "", raw: raw || "" };
  }
  const trimmed = raw.trim();
  try {
    return normalizePlan(JSON.parse(trimmed), raw);
  } catch {
    /* */
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
