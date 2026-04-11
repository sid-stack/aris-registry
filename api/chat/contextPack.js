/**
 * Token-aware chat context: capped history + structured audit snippet for LLM + cache keys.
 */

export const CHAT_HISTORY_MAX_PAIRS = 4;

export function buildAuditStructuredSnippet(auditContext) {
  if (!auditContext || typeof auditContext !== "object") return null;
  const v = auditContext.verdict || {};
  const reqs = Array.isArray(auditContext.requirements) ? auditContext.requirements : [];
  const risks = Array.isArray(auditContext.intelligence?.top_risks)
    ? auditContext.intelligence.top_risks
    : [];
  const disqualifiers = reqs.filter(
    (r) => r.is_disqualifier || r.risk === "DISQUALIFIER"
  );
  const riskLabels = risks.slice(0, 5).map((r, i) => {
    if (typeof r === "string") return r.slice(0, 200);
    if (r && typeof r === "object") return String(r.risk || r.text || r.title || `risk_${i}`).slice(0, 200);
    return String(r);
  });
  return {
    solicitation_number: auditContext.solicitation_number || auditContext.id || null,
    title: auditContext.title || null,
    agency: auditContext.agency || null,
    verdict: v.recommendation || "PENDING",
    win_probability: v.win_probability ?? null,
    requirement_count: reqs.length,
    disqualifier_count: disqualifiers.length,
    top_risk_labels: riskLabels.slice(0, 3),
    high_risk_requirement_ids: reqs
      .filter((r) => r.risk === "HIGH" || r.risk === "DISQUALIFIER")
      .slice(0, 8)
      .map((r) => r.id)
      .filter(Boolean),
  };
}

/**
 * Prose + compact JSON for stable cache keys and model grounding.
 */
export function buildAuditContextBlock(auditContext, supplementalNote = null) {
  if (!auditContext && supplementalNote) {
    return `No structured audit loaded.\nSession note: ${supplementalNote}`;
  }
  if (!auditContext) {
    return "No audit loaded yet.";
  }
  const v = auditContext.verdict || {};
  const reqs = Array.isArray(auditContext.requirements) ? auditContext.requirements : [];
  const risks = Array.isArray(auditContext.intelligence?.top_risks)
    ? auditContext.intelligence.top_risks
    : [];
  const riskLine = risks.length
    ? risks
        .slice(0, 3)
        .map((r) => (typeof r === "string" ? r : r?.risk || r?.text || ""))
        .filter(Boolean)
        .join("; ")
    : "";
  const prose = [
    supplementalNote ? `Session note: ${supplementalNote}` : "",
    `Solicitation: ${auditContext.solicitation_number || "Unknown"} — ${auditContext.title || ""}`,
    `Agency: ${auditContext.agency || "Unknown"}`,
    `Verdict: ${v.recommendation || "PENDING"} | Win probability: ${v.win_probability ?? "?"}%`,
    `Requirements extracted: ${reqs.length}`,
    riskLine ? `Top risks: ${riskLine}` : "",
    v.rationale ? `Rationale: ${String(v.rationale).slice(0, 300)}` : "",
    auditContext.executiveSummary
      ? `Summary: ${String(auditContext.executiveSummary).slice(0, 400)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const snippet = buildAuditStructuredSnippet(auditContext);
  return `${prose}\n\nStructured audit summary (JSON):\n${JSON.stringify(snippet)}`;
}

export function capThreadMessages(messages, maxPairs = CHAT_HISTORY_MAX_PAIRS) {
  const list = Array.isArray(messages) ? messages : [];
  const maxMsgs = maxPairs * 2;
  if (list.length <= maxMsgs) return list;
  return list.slice(-maxMsgs);
}

export function applyFailedUrlToLastUser(threadMessages, failedUrl) {
  if (!failedUrl || !threadMessages.length) return threadMessages;
  const last = threadMessages[threadMessages.length - 1];
  if (last.role !== "user") return threadMessages;
  const out = [...threadMessages];
  out[out.length - 1] = {
    ...last,
    content: `[System note: The user submitted this SAM.gov URL but it could not be fetched automatically: ${failedUrl}]\n\n${last.content}`,
  };
  return out;
}

export function threadToConversationText(threadMessages) {
  return threadMessages
    .map((m) => {
      const role = m.role === "user" ? "User" : "ARIS";
      return `${role}: ${m.content}`;
    })
    .join("\n\n");
}

export function auditFingerprint(auditContext) {
  if (!auditContext || typeof auditContext !== "object") return "none";
  return String(
    auditContext.solicitation_number ||
      auditContext.id ||
      auditContext.opportunity_id ||
      "unknown"
  );
}

export function lastUserMessage(threadMessages) {
  for (let i = threadMessages.length - 1; i >= 0; i--) {
    if (threadMessages[i].role === "user") return threadMessages[i].content || "";
  }
  return "";
}

export function normalizeForChatCache(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
