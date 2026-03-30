import { complete } from "../llm/gemini.js";
import { analyzeSolicitationStructure } from "../services/aws.js";

/**
 * EXTRACTION_AGENT
 * Focus: Structural integrity, metadata, and initial matrix.
 */
export const extractionAgent = {
  async process(ctx, log) {
    log("INITIALIZING_OCR_INFRA...");
    
    // 1. AWS Textract / Mock Structural Pass
    const structure = await analyzeSolicitationStructure(ctx.buffer);
    log(`TEXTRACT_PASS_COMPLETE: ${structure.DocumentMetadata?.Pages || 1} pages analyzed.`);

    // 2. LLM Semantic Refinement
    log("REFINING_SEMANTIC_MODEL...");
    const prompt = `You are the EXTRACTION_AGENT. Using the text below, extract:
- Solicitation Number
- Agency / Entity
- Estimated Value
- Primary NAICS
- Detected Sections (L, M, C, etc.)

TEXT:
${ctx.rawText.slice(0, 15000)}

Return strict JSON.`;

    const result = await complete(prompt, "Extraction Agent Context", { json: true });
    log("METADATA_LOCKED.");
    
    return {
      document_metadata: result,
      requirements: [], // Handled by Compliance Agent
      executiveSummary: `Structural analysis complete. Detected ${result.detected_sections?.join(", ") || "various"} sections.`
    };
  }
};
