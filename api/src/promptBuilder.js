// /Users/sid/Desktop/aris-core/api/src/promptBuilder.js
// ------------------------------------------------------------
//  Production-grade prompt builder for the Bidsmith “Risk Memorandum”
// ------------------------------------------------------------

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load the static part of the prompt from a file.
 * This lets you edit the template without touching code.
 */
async function loadTemplate() {
  const tmplPath = join(__dirname, "risk-memorandum.md");
  return await readFile(tmplPath, "utf8");
}

/**
 * Build the final prompt that will be sent to the LLM.
 *
 * @param {string} analysis   – the raw compliance-intelligence brief (already trimmed)
 * @returns {string}           – full prompt ready for the LLM
 */
export async function buildRiskMemoPrompt(analysis) {
  if (!analysis || typeof analysis !== "string") {
    throw new TypeError("analysis must be a non-empty string");
  }

  const staticTemplate = await loadTemplate();

  const placeholder = "${analysis}";
  if (!staticTemplate.includes(placeholder)) {
    throw new Error(`Template is missing the placeholder ${placeholder}`);
  }

  const finalPrompt = staticTemplate.replace(placeholder, analysis.trim());

  const MAX_BYTES = 30 * 1024;
  if (Buffer.byteLength(finalPrompt, "utf8") > MAX_BYTES) {
    throw new Error(`Prompt size (${Buffer.byteLength(finalPrompt, "utf8")} bytes) exceeds the safe limit of ${MAX_BYTES} bytes`);
  }

  return finalPrompt;
}