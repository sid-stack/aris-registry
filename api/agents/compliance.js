import { complete } from "../llm/gemini.js";

/**
 * COMPLIANCE_AGENT
 * Focus: Regulatory traps, lethal disqualifiers, Section L/M conflicts.
 */
export const complianceAgent = {
  async process(ctx, log) {
    log("SCANNING_REGULATORY_TRAPS...");
    
    const prompt = `You are the COMPLIANCE_AGENT (Federal Auditor). 
Audit the following RFP text for:
1. "Compliance Bugs": Section L/M conflicts, formatting traps, lethal disqualifiers.
2. High-priority requirements from Section L.

TEXT:
${ctx.rawText.slice(0, 20000)}

Return strict JSON with fields: bugs (array), requirements (array), riskAssessment (object).`;

    const result = await complete(prompt, "Compliance Agent Context", { json: true });
    
    log(`AUDIT_COMPLETE: ${result.bugs?.length || 0} traps identified.`);
    return result;
  }
};
