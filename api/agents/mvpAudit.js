/**
 * MVP audit — single LLM round, Flash-first (skip Mercury).
 * Schema and framing inspired by GovCon AI Studio zip: document wrapper,
 * compliance-matrix-style rows (source / status / strategy), and key_details
 * (Red Flag, Evaluation Criteria, Win Theme, Constraint) in one JSON response.
 */

import { callLLMJson } from "../llm/openrouter.js";
import { logger } from "../utils/logger.js";

/** Match zip-style excerpt cap (chars sent to the model). */
export const MVP_AUDIT_CHAR_BUDGET = 15_000;

const DOC_TYPES = ["RFP", "SOW", "QA", "Other"];

const MVP_SYSTEM = `You are BidSmith's federal solicitation auditor in cost-efficient MVP mode.
Return ONLY valid JSON. No markdown fences. No prose before or after the JSON.

The user message will contain one block:
[Document: <name> (<type>)]
<body>

Required JSON shape:
{
  "document_metadata": {
    "solicitation_number": "",
    "agency": "",
    "title": "",
    "due_date": "",
    "naics_code": "",
    "set_aside_type": "",
    "contract_type": ""
  },
  "verdict": {
    "recommendation": "BID" | "NO_BID" | "CONDITIONAL",
    "win_probability": <number 0-100>,
    "confidence": "HIGH" | "MEDIUM" | "LOW",
    "summary": "",
    "rationale": ""
  },
  "executive_summary": "Professional exec-style blurb. Use [Value] or [Metric] placeholders where numbers are unknown.",
  "requirements": [
    {
      "id": "req_001",
      "requirement": "",
      "source": "e.g. Section L.1, M.2, PWS 3.1",
      "status": "unknown" | "Meets" | "Partially Meets" | "Does Not Meet" | "Not Applicable",
      "strategy": "brief compliance approach",
      "section": "",
      "category": "",
      "risk": "HIGH" | "MED" | "LOW" | "DISQUALIFIER",
      "is_disqualifier": false,
      "action_required": "",
      "source_excerpt": ""
    }
  ],
  "key_details": [
    {
      "id": "kd_001",
      "type": "Red Flag" | "Evaluation Criteria" | "Win Theme" | "Constraint",
      "detail": "the finding",
      "source": "where in the document",
      "impact": "why it matters for bid/no-bid or proposal"
    }
  ],
  "key_insights": {
    "evaluation_type": "e.g. Best Value LPTA, TA Lowest Price",
    "evaluation_reality": "one sentence on how evaluators will actually score",
    "top_risks": [],
    "hidden_requirements": [],
    "timeline_days": null,
    "timeline_note": ""
  },
  "proposal_roadmap": [
    {
      "section": "",
      "recommended_pages": "",
      "focus_areas": [],
      "discriminator": ""
    }
  ]
}

Rules:
- requirements: 8–18 rows max; prioritize shall/must/mandatory and Section L/M.
- key_details: 6–14 items max; focus on buried risks, evaluation weights, win angles, hard constraints.
- Merge overlapping ideas — do not repeat the same finding in requirements and key_details unless one is matrix row and one is strategic insight.
- If excerpt is incomplete, set confidence LOW and say so in rationale.
- top_risks in key_insights can be short strings OR objects { "risk", "action", "severity" }; hidden_requirements strings OR { "found_in", "text", "implication" }.`;

function documentBlock(text, meta = {}) {
  const name = (meta.title || meta.id || "Solicitation").toString().slice(0, 200);
  let docType = "RFP";
  if (meta.document_type && DOC_TYPES.includes(meta.document_type)) {
    docType = meta.document_type;
  } else if (meta.source === "pdf" || (meta.title || "").toLowerCase().endsWith(".pdf")) {
    docType = "RFP";
  }
  return `[Document: ${name} (${docType})]\n${text}`;
}

function mapToMvpRawShape(data, meta, inputCharLength) {
  const dm = data.document_metadata || {};
  const verdict = data.verdict || {};
  const ki = data.key_insights || {};
  const reqs = Array.isArray(data.requirements) ? data.requirements : [];
  const keyDetails = Array.isArray(data.key_details) ? data.key_details : [];

  const requirements = reqs.map((r, idx) => ({
    id: r.id || `REQ-${idx + 1}`,
    requirement: r.requirement || r.text || "",
    text: r.requirement || r.text || "",
    source: r.source || r.section || null,
    status: r.status || "unknown",
    strategy: r.strategy || "",
    section: r.section || null,
    category: r.category || "Other",
    risk: r.risk === "DISQUALIFIER" ? "DISQUALIFIER" : (r.risk || "MED"),
    is_disqualifier: Boolean(r.is_disqualifier || r.risk === "DISQUALIFIER"),
    action_required: r.action_required || r.strategy || "",
    source_excerpt: r.source_excerpt || "",
  }));

  const timelineDays = ki.timeline_days != null && ki.timeline_days !== ""
    ? Number(ki.timeline_days)
    : null;

  const keyDetailsNorm = keyDetails
    .filter((k) => k && (k.detail || k.text))
    .map((k, i) => ({
      id: k.id || `KD-${i + 1}`,
      type: k.type || "Red Flag",
      detail: k.detail || k.text || "",
      source: k.source || "",
      impact: k.impact || "",
    }));

  const keyDiscriminators = [];
  const topFromDetails = [];
  const hiddenFromDetails = [];

  for (const k of keyDetailsNorm) {
    const t = k.type;
    if (t === "Win Theme" || t === "Evaluation Criteria") {
      keyDiscriminators.push(k.detail);
    } else if (t === "Red Flag") {
      topFromDetails.push({
        risk: k.detail,
        action: k.impact || "Validate before bid decision.",
        severity: "HIGH",
      });
    } else if (t === "Constraint") {
      hiddenFromDetails.push({
        found_in: k.source || "Solicitation",
        text: k.detail,
        implication: k.impact || "",
      });
    }
  }

  const topRisksRaw = Array.isArray(ki.top_risks) ? ki.top_risks : [];
  const topRisksMerged = [...topFromDetails];
  for (const r of topRisksRaw) {
    if (typeof r === "string") {
      topRisksMerged.push({ risk: r, action: "", severity: "MED" });
    } else if (r && typeof r === "object") {
      topRisksMerged.push({
        risk: r.risk || r.text || "",
        action: r.action || "",
        severity: r.severity || "MED",
      });
    }
  }

  const hiddenRaw = Array.isArray(ki.hidden_requirements) ? ki.hidden_requirements : [];
  const hiddenMerged = [...hiddenFromDetails];
  for (const h of hiddenRaw) {
    if (typeof h === "string") {
      hiddenMerged.push({ found_in: "Solicitation", text: h, implication: "" });
    } else if (h && typeof h === "object") {
      hiddenMerged.push({
        found_in: h.found_in || h.source || "Other",
        text: h.text || h.detail || "",
        implication: h.implication || h.impact || "",
      });
    }
  }

  return {
    id: dm.solicitation_number || meta?.id || "MVP_AUDIT",
    solicitation_number: dm.solicitation_number || meta?.id || null,
    title: dm.title || meta?.title || "Federal Solicitation",
    agency: dm.agency || meta?.agency || "Federal Agency",
    contract_type: dm.contract_type || null,
    set_aside_type: dm.set_aside_type || null,
    due_date: dm.due_date || null,
    naics_code: dm.naics_code || null,
    executiveSummary: data.executive_summary || "",
    verdict: {
      recommendation: verdict.recommendation || "CONDITIONAL",
      win_probability: typeof verdict.win_probability === "number" ? verdict.win_probability : 50,
      confidence: verdict.confidence || "MEDIUM",
      rationale: verdict.rationale || "",
      summary: verdict.summary || "",
    },
    intelligence: {
      evaluation_type: ki.evaluation_type || "",
      evaluation_reality: ki.evaluation_reality || "",
      top_risks: topRisksMerged,
      hidden_requirements: hiddenMerged,
      key_details: keyDetailsNorm,
      key_discriminators: keyDiscriminators,
      timeline_pressure: {
        detected: Number.isFinite(timelineDays) && timelineDays > 0,
        days_to_respond: Number.isFinite(timelineDays) ? timelineDays : null,
        explanation: ki.timeline_note || "",
      },
    },
    requirements,
    proposal_roadmap: Array.isArray(data.proposal_roadmap) ? data.proposal_roadmap : [],
    generated_at: new Date().toISOString(),
    meta: {
      mvp_pipeline: true,
      mvp_char_budget: MVP_AUDIT_CHAR_BUDGET,
      mvp_input_chars: inputCharLength,
    },
  };
}

export async function runMvpAudit(fullText, meta = {}) {
  const text = (fullText || "").trim();
  if (text.length < 50) {
    throw new Error("Solicitation text too short to audit (< 50 chars)");
  }

  const snippet = text.length > MVP_AUDIT_CHAR_BUDGET
    ? text.slice(0, MVP_AUDIT_CHAR_BUDGET)
    : text;

  const userPayload = documentBlock(snippet, meta);

  logger.info("mvp_audit_started", {
    chars_total: text.length,
    chars_to_model: snippet.length,
    audit_id: meta?.id || null,
    document_framing: true,
  });
  const t0 = Date.now();

  let data;
  try {
    data = await callLLMJson(
      MVP_SYSTEM,
      `${userPayload}\n\n(Excerpt is ${snippet.length} of ${text.length} total characters.)`,
      {
        skipMercury: true,
        max_tokens: 8192,
        temperature: 0.15,
      },
    );
  } catch (err) {
    logger.error("mvp_audit_llm_failed", { error: err.message });
    throw err;
  }

  if (!data || typeof data !== "object") {
    throw new Error("MVP audit: model returned invalid payload");
  }

  const reqs = Array.isArray(data.requirements) ? data.requirements : [];
  if (reqs.length === 0) {
    logger.warn("mvp_audit_no_requirements", { chars: text.length });
    return {
      error: "insufficient_text",
      message:
        "Could not extract requirements from this excerpt. Paste more solicitation text (Sections L/M/C) or disable MVP mode for full-document analysis.",
      requirements: [],
      verdict: { recommendation: "INSUFFICIENT_DATA", win_probability: 0 },
    };
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  logger.info("mvp_audit_completed", {
    elapsed_s: Number(elapsed),
    requirements: reqs.length,
    key_details: Array.isArray(data.key_details) ? data.key_details.length : 0,
    recommendation: data.verdict?.recommendation || "CONDITIONAL",
  });

  return mapToMvpRawShape(data, meta, text.length);
}

export function mvpAuditEnabled() {
  const v = (process.env.BIDSMITH_MVP_AUDIT || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
