import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = join(__dirname, "..", "llm");

export const SYS_PROMPT = readFileSync(join(PROMPTS_DIR, "system_prompt.txt"), "utf8").trim();

export const CODE_AUDIT_SYSTEM_PROMPT = `You are an expert coding assistant specialized in large-scale, stateless, low-latency code generation for RFP audit pipelines.
... (rest of the prompt)
`;

export const AUDIT_PROMPT = `You are the lead federal auditor. Your task is to analyze the provided solicitation text...`;
