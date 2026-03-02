import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { classifyIntent } from "./middleware/intent.js";
import { enrichFARClauses } from "./middleware/gatekeeper.js";
import { extractMetadata } from "./middleware/extractor.js";
import { computeScore } from "./middleware/scorer.js";

const __dirname   = dirname(fileURLToPath(import.meta.url));
const PROMPTS     = join(__dirname, "llm");
const SYS_PROMPT  = readFileSync(join(PROMPTS, "system_prompt.txt"), "utf8").trim();
const EXT_PROMPT  = readFileSync(join(PROMPTS, "extract_prompt.txt"), "utf8").trim();
const VAL_PROMPT  = readFileSync(join(PROMPTS, "validate_prompt.txt"), "utf8").trim();

const app  = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, f, cb) => f.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("PDF only")),
});

function makeClient() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  return new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: key, defaultHeaders: { "HTTP-Referer": "http://localhost:5173", "X-Title": "ARIS" } });
}

async function parsePDF(buffer) {
  const pp = (await import("pdf-parse/lib/pdf-parse.js")).default;
  return (await pp(buffer)).text;
}

function parseJSON(raw) {
  return JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
}

async function llm(client, messages, maxTokens = 4096) {
  const res = await client.chat.completions.create({ model: "google/gemini-2.0-flash-001", max_tokens: maxTokens, temperature: 0, top_p: 0.1, messages });
  return res.choices[0]?.message?.content || "";
}

app.get("/api/health", (_, res) => res.json({ status: "ok", version: "3.0.0" }));

app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  const client = makeClient();
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded." });

    let text;
    try { text = await parsePDF(req.file.buffer); }
    catch (e) { return res.status(422).json({ error: "PDF parse failed: " + e.message }); }
    if (!text || text.trim().length < 100) return res.status(422).json({ error: "PDF appears empty or image-only." });

    // Stage 1: Intent
    let intent;
    try { intent = await classifyIntent(text, client); }
    catch (e) { return res.status(502).json({ error: "Intent classification failed: " + e.message }); }
    if (!intent.isFederalRFP) return res.status(422).json({ error: "NOT_FEDERAL_RFP", message: `Document does not appear to be a U.S. Federal RFP. ${intent.reason}`, confidence: intent.confidence });

    // Stage 2: Deterministic extraction
    const meta = extractMetadata(text);

    // Stage 3: LLM extract
    let llmResult;
    try {
      const raw = await llm(client, [{ role: "user", content: SYS_PROMPT + "\n\n" + EXT_PROMPT.replace("{{RFP_TEXT}}", text.slice(0, 14000)) }]);
      llmResult = parseJSON(raw);
    } catch (e) { return res.status(502).json({ error: "Extraction failed: " + e.message }); }

    let requirements = (llmResult.requirements || []).map((r, i) => ({ ...r, requirement_id: `req_${String(i + 1).padStart(3, "0")}`, source_excerpt: r.source_excerpt || r.text?.slice(0, 120) || "" }));

    // Stage 4: Validation pass
    let missed = [];
    try {
      const valRaw = await llm(client, [{ role: "user", content: VAL_PROMPT.replace("{{RFP_TEXT}}", text.slice(0, 8000)).replace("{{EXTRACTED_JSON}}", JSON.stringify(requirements)) }], 2048);
      missed = parseJSON(valRaw).missed_mandatory_requirements || [];
    } catch (e) { console.warn("Validation non-fatal:", e.message); }

    const base = requirements.length;
    const allReqs = [...requirements, ...missed.map((m, i) => ({ requirement_id: `req_${String(base + i + 1).padStart(3, "0")}`, text: m.text, section: m.section || "", page_reference: "", category: "Other", type: "Mandatory", is_disqualifying_if_missing: false, risk_level: "Review Required", source_excerpt: m.text?.slice(0, 120) || "" }))];

    // Stage 5: Score
    const { score, gaps } = computeScore(allReqs, { days_until_deadline: meta.days_until_deadline, page_limit: llmResult.submission_details?.page_limit || meta.page_limit });

    const farRaw = [...(llmResult.far_clauses_detected || []).map(f => f.clause_number), ...meta.far_clauses_raw];
    const mandatory = allReqs.filter(r => r.type === "Mandatory");
    const evaluation = allReqs.filter(r => r.type === "Evaluation");
    const high = allReqs.filter(r => r.risk_level === "High");
    const medium = allReqs.filter(r => r.risk_level === "Medium");
    const low = allReqs.filter(r => r.risk_level === "Low");
    const review = allReqs.filter(r => r.risk_level === "Review Required");
    const confidence = Math.min(1.0, 0.4 + (llmResult.document_metadata?.solicitation_number ? 0.1 : 0) + (llmResult.submission_details?.deadline ? 0.15 : 0) + (farRaw.length > 0 ? 0.1 : 0) + (missed.length === 0 ? 0.15 : 0) + (!intent.usedLLM ? 0.1 : 0));

    res.json({ success: true, intent_check: { passed: true, confidence: intent.confidence, reason: intent.reason },
      proposal: {
        document_metadata: { document_type: "Federal RFP", solicitation_number: llmResult.document_metadata?.solicitation_number || meta.solicitation_number, agency: llmResult.document_metadata?.agency || meta.agency, naics_code: llmResult.document_metadata?.naics_code || meta.naics_code, set_aside_type: llmResult.document_metadata?.set_aside_type || meta.set_aside_type, contract_type: llmResult.document_metadata?.contract_type || meta.contract_type, detected_sections: llmResult.document_metadata?.detected_sections || meta.detected_sections },
        submission_details: { deadline: llmResult.submission_details?.deadline || meta.deadline, days_until_deadline: meta.days_until_deadline, page_limit: llmResult.submission_details?.page_limit || meta.page_limit, submission_method: llmResult.submission_details?.submission_method || "", late_submission_disqualifying: llmResult.submission_details?.late_submission_disqualifying ?? true },
        evaluation_summary: { evaluation_factors: llmResult.evaluation_summary?.evaluation_factors || meta.eval_factors, best_value_tradeoff: llmResult.evaluation_summary?.best_value_tradeoff ?? meta.best_value_tradeoff, lowest_price_technically_acceptable: llmResult.evaluation_summary?.lowest_price_technically_acceptable ?? meta.lpta },
        compliance_summary: { bid_score: score, total_requirements: allReqs.length, mandatory_requirements: mandatory.length, evaluation_requirements: evaluation.length, high_risk_count: high.length, medium_risk_count: medium.length, low_risk_count: low.length, review_required_count: review.length },
        requirements: allReqs, gaps, far_clauses_detected: enrichFARClauses(farRaw),
        confidence_metrics: { extraction_confidence: parseFloat(confidence.toFixed(2)), possible_missed_mandatory: missed.length, validator_flagged: missed.length > 0 || confidence < 0.6 },
      }
    });
  } catch (err) {
    console.error("Unhandled:", err);
    res.status(500).json({ error: "Internal error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ARIS v3 → http://localhost:${PORT}`);
  console.log(`   Pipeline: Intent → Extract → Validate → Score`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY not set");
});
