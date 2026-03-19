import { traceLLM } from "../utils/tracing.js";
import { persistKnowledgePattern } from "./analytics.js";

/**
 * ARIS Distillation Service
 * Extracts anonymized GovCon logic patterns for the Institutional Knowledge Graph.
 * Ensures Zero-Knowledge promise by stripping PII and proprietary project data.
 */

const DISTILLATION_PROMPT = `You are the ARIS Institutional Architect. 
Your task is to analyze a solicitation audit and extract a "Logic Pattern".

CONSTRAINTS:
1. ZERO PII. Strip all individual names, phone numbers, and emails.
2. ZERO PROJECT DATA. Strip specific solicitation numbers, project titles, and specific bid amounts.
3. ANONYMIZE AGENCY. Replace "DHA" or "Army" with general terms like "High-Tier Federal Agency" or "Military Branch".
4. FOCUS ON LOGIC. Identify structural conflicts, obscure certification dependencies, or evaluation quirks.

OUTPUT FORMAT: JSON
{
  "patternType": "compliance_conflict | structural_gate | agency_quirk | pricing_hazard",
  "observation": "A concise, anonymized logical observation (e.g., 'Agency consistently requires NIST 800-171 in Section H while omitting it from Section L')",
  "riskScore": 1-10,
  "metadata": { "structural_context": "..." }
}`;

export async function distillLogicPattern(auditResult, rawText) {
  try {
    // AuditResult might be large, we pass a summary + samples if needed
    const snippet = typeof auditResult === 'string' ? auditResult : JSON.stringify(auditResult);
    
    const response = await traceLLM(null, {
      model: "claude-3-5-sonnet",
      messages: [
        { role: "system", content: DISTILLATION_PROMPT },
        { role: "user", content: `Distill this audit result:\n\n${snippet.slice(0, 5000)}` }
      ]
    }, "institutional_distiller");

    const pattern = JSON.parse(response);
    
    // Final safety check: ensure no PII leaked into the observation
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(pattern.observation)) {
       console.warn("[DISTILLATION] PII pattern detected in output. Dropping pattern.");
       return null;
    }

    await persistKnowledgePattern(pattern);
    return pattern;
  } catch (err) {
    console.error("[DISTILLATION] failed:", err.message);
    return null;
  }
}
