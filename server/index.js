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

const __dirname  = dirname(fileURLToPath(import.meta.url));
const PROMPTS    = join(__dirname, "llm");
const SYS_PROMPT = readFileSync(join(PROMPTS, "system_prompt.txt"), "utf8").trim();
const EXT_PROMPT = readFileSync(join(PROMPTS, "extract_prompt.txt"), "utf8").trim();
const VAL_PROMPT = readFileSync(join(PROMPTS, "validate_prompt.txt"), "utf8").trim();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://www.bidsmith.pro', 'https://bidsmith.pro', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, f, cb) => f.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("PDF only")),
});

function makeClient() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: { "HTTP-Referer": "http://localhost:5173", "X-Title": "ARIS" }
  });
}

async function parsePDF(buffer) {
  const pp = (await import("pdf-parse/lib/pdf-parse.js")).default;
  return (await pp(buffer)).text;
}

function parseJSON(raw) {
  return JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
}

async function llm(client, messages, maxTokens = 4096) {
  const res = await client.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    max_tokens: maxTokens,
    temperature: 0,
    top_p: 0.1,
    messages
  });
  return res.choices[0]?.message?.content || "";
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok", version: "3.0.0" }));

// ─── /api/generate — Full proposal pipeline ──────────────────────────────────
app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  const client = makeClient();
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded." });

    let text;
    try { text = await parsePDF(req.file.buffer); }
    catch (e) { return res.status(422).json({ error: "PDF parse failed: " + e.message }); }
    if (!text || text.trim().length < 100)
      return res.status(422).json({ error: "PDF appears empty or image-only." });

    // Stage 1: Intent
    let intent;
    try { intent = await classifyIntent(text, client); }
    catch (e) { return res.status(502).json({ error: "Intent classification failed: " + e.message }); }
    if (!intent.isFederalRFP)
      return res.status(422).json({ error: "NOT_FEDERAL_RFP", message: `Document does not appear to be a U.S. Federal RFP. ${intent.reason}`, confidence: intent.confidence });

    // Stage 2: Deterministic extraction
    const meta = extractMetadata(text);

    // Stage 3: LLM extract
    let llmResult;
    try {
      const raw = await llm(client, [{ role: "user", content: SYS_PROMPT + "\n\n" + EXT_PROMPT.replace("{{RFP_TEXT}}", text.slice(0, 14000)) }]);
      llmResult = parseJSON(raw);
    } catch (e) { return res.status(502).json({ error: "Extraction failed: " + e.message }); }

    let requirements = (llmResult.requirements || []).map((r, i) => ({
      ...r,
      requirement_id: `req_${String(i + 1).padStart(3, "0")}`,
      source_excerpt: r.source_excerpt || r.text?.slice(0, 120) || ""
    }));

    // Stage 4: Validation pass
    let missed = [];
    try {
      const valRaw = await llm(client, [{ role: "user", content: VAL_PROMPT.replace("{{RFP_TEXT}}", text.slice(0, 8000)).replace("{{EXTRACTED_JSON}}", JSON.stringify(requirements)) }], 2048);
      missed = parseJSON(valRaw).missed_mandatory_requirements || [];
    } catch (e) { console.warn("Validation non-fatal:", e.message); }

    const base = requirements.length;
    const allReqs = [
      ...requirements,
      ...missed.map((m, i) => ({
        requirement_id: `req_${String(base + i + 1).padStart(3, "0")}`,
        text: m.text, section: m.section || "", page_reference: "",
        category: "Other", type: "Mandatory", is_disqualifying_if_missing: false,
        risk_level: "Review Required", source_excerpt: m.text?.slice(0, 120) || ""
      }))
    ];

    // Stage 5: Score
    const { score, gaps } = computeScore(allReqs, {
      days_until_deadline: meta.days_until_deadline,
      page_limit: llmResult.submission_details?.page_limit || meta.page_limit
    });

    const farRaw = [...(llmResult.far_clauses_detected || []).map(f => f.clause_number), ...meta.far_clauses_raw];
    const mandatory  = allReqs.filter(r => r.type === "Mandatory");
    const evaluation = allReqs.filter(r => r.type === "Evaluation");
    const high       = allReqs.filter(r => r.risk_level === "High");
    const medium     = allReqs.filter(r => r.risk_level === "Medium");
    const low        = allReqs.filter(r => r.risk_level === "Low");
    const review     = allReqs.filter(r => r.risk_level === "Review Required");
    const confidence = Math.min(1.0,
      0.4 +
      (llmResult.document_metadata?.solicitation_number ? 0.1 : 0) +
      (llmResult.submission_details?.deadline ? 0.15 : 0) +
      (farRaw.length > 0 ? 0.1 : 0) +
      (missed.length === 0 ? 0.15 : 0) +
      (!intent.usedLLM ? 0.1 : 0)
    );

    res.json({
      success: true,
      intent_check: { passed: true, confidence: intent.confidence, reason: intent.reason },
      proposal: {
        document_metadata: {
          document_type: "Federal RFP",
          solicitation_number: llmResult.document_metadata?.solicitation_number || meta.solicitation_number,
          agency: llmResult.document_metadata?.agency || meta.agency,
          naics_code: llmResult.document_metadata?.naics_code || meta.naics_code,
          set_aside_type: llmResult.document_metadata?.set_aside_type || meta.set_aside_type,
          contract_type: llmResult.document_metadata?.contract_type || meta.contract_type,
          detected_sections: llmResult.document_metadata?.detected_sections || meta.detected_sections
        },
        submission_details: {
          deadline: llmResult.submission_details?.deadline || meta.deadline,
          days_until_deadline: meta.days_until_deadline,
          page_limit: llmResult.submission_details?.page_limit || meta.page_limit,
          submission_method: llmResult.submission_details?.submission_method || "",
          late_submission_disqualifying: llmResult.submission_details?.late_submission_disqualifying ?? true
        },
        evaluation_summary: {
          evaluation_factors: llmResult.evaluation_summary?.evaluation_factors || meta.eval_factors,
          best_value_tradeoff: llmResult.evaluation_summary?.best_value_tradeoff ?? meta.best_value_tradeoff,
          lowest_price_technically_acceptable: llmResult.evaluation_summary?.lowest_price_technically_acceptable ?? meta.lpta
        },
        compliance_summary: {
          bid_score: score,
          total_requirements: allReqs.length,
          mandatory_requirements: mandatory.length,
          evaluation_requirements: evaluation.length,
          high_risk_count: high.length,
          medium_risk_count: medium.length,
          low_risk_count: low.length,
          review_required_count: review.length
        },
        requirements: allReqs,
        gaps,
        far_clauses_detected: enrichFARClauses(farRaw),
        confidence_metrics: {
          extraction_confidence: parseFloat(confidence.toFixed(2)),
          possible_missed_mandatory: missed.length,
          validator_flagged: missed.length > 0 || confidence < 0.6
        }
      }
    });
  } catch (err) {
    console.error("Unhandled:", err);
    res.status(500).json({ error: "Internal error: " + err.message });
  }
});

// ─── /api/audit — 7-Pillar Compliance Audit ──────────────────────────────────
const AUDIT_PROMPT = `You are a federal contract compliance auditor. Perform a TWO-PASS analysis.

PASS 1 — Return a JSON object FIRST. Use exactly these keys. If a pillar is not explicitly found, use "NOT FOUND" — never guess or infer.

{
  "solicitation_id": "<RFP/RFQ/IFB number or 'NOT FOUND'>",
  "deadline_date": "<ISO 8601 YYYY-MM-DD or 'NOT FOUND'>",
  "set_aside_type": "<Small Business / 8(a) / SDVOSB / HUBZone / WOSB / Unrestricted or 'NOT FOUND'>",
  "bonding_reqs": {
    "bid_bond": "<percentage or dollar amount or 'NOT FOUND'>",
    "performance_bond": "<percentage or dollar amount or 'NOT FOUND'>",
    "payment_bond": "<percentage or dollar amount or 'NOT FOUND'>"
  },
  "past_performance_threshold": "<explicit minimum projects/dollar/timeframe or 'NOT FOUND'>",
  "technical_disqualifiers": ["<mandatory cert/clearance — only explicitly disqualifying. Return ['NOT FOUND'] if none>"],
  "risk_score_1_to_10": <integer 1-10: bonding(0-2)+clearance(0-2)+past perf(0-2)+deadline urgency(0-2)+complexity(0-2)>
}

PILLAR RULES:
- bonding_reqs: look for "Bid Bond", "Performance Bond", "Payment Bond", "surety bond"
- technical_disqualifiers: MANDATORY only — "required", "shall possess", "must hold". Flag ISO certs, clearances, CMMC
- past_performance_threshold: explicit minimums only

PASS 2 — Verify every field. If inferred not explicitly stated, correct to "NOT FOUND".

After the JSON write a BID/NO-BID EXECUTIVE SUMMARY:

---
## BID/NO-BID EXECUTIVE SUMMARY

**Overall Recommendation**: [BID / NO-BID / CONDITIONAL BID]

**Strategic Rationale** (2-3 sentences referencing the pillars)

**Go/No-Go Factors**:
- ✅ [Favorable factor]
- ⚠️ [Risk or gap]
- ❌ [Disqualifying factor if applicable]

**Immediate Action Items**:
1. [Action]
2. [Action]
3. [Action]
---`;

app.post("/api/audit", upload.single("file"), async (req, res) => {
  const client = makeClient();
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

    let text;
    try { text = await parsePDF(req.file.buffer); }
    catch (e) { return res.status(422).json({ error: "PDF parse failed: " + e.message }); }
    if (!text || text.trim().length < 50)
      return res.status(422).json({ error: "Could not extract text. Try a non-scanned PDF." });

    console.log(`[/api/audit] ${req.file.originalname} — ${text.length} chars`);

    const raw = await llm(client, [
      { role: "system", content: AUDIT_PROMPT },
      { role: "user", content: `Audit this solicitation:\n\n---\n${text.slice(0, 20000)}\n---` }
    ]);

    let compliance = null;
    const deepMatch = raw.match(/\{[\s\S]*\}/);
    if (deepMatch) {
      try { compliance = JSON.parse(deepMatch[0]); }
      catch { compliance = { parse_error: "JSON extraction failed" }; }
    }

    let executiveSummary = "";
    if (deepMatch) {
      const jsonEnd = raw.indexOf(deepMatch[0]) + deepMatch[0].length;
      executiveSummary = raw.slice(jsonEnd).trim();
    }

    res.json({
      compliance,
      executiveSummary,
      auditedAt: new Date().toISOString(),
      metadata: { file: req.file.originalname, size: req.file.size }
    });

  } catch (err) {
    console.error("[/api/audit] ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ARIS v3 → http://localhost:${PORT}`);
  console.log(`   Pipeline: Intent → Extract → Validate → Score`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY not set");
});

// ─── SAM.gov URL → Audit Pipeline ────────────────────────────────────────────
const SAM_API_KEY = process.env.SAM_GOV_API_KEY || "SAM-30bd2085-030d-4ce4-9d40-8e9a1d030829";
const noticeCache = new Map(); // 24h in-memory cache

function parseNoticeId(url) {
  const oppMatch = url.match(/\/opp\/([a-f0-9]{32})/i);
  if (oppMatch) return oppMatch[1];
  const qMatch = url.match(/[?&]noticeId=([^&]+)/i);
  if (qMatch) return qMatch[1];
  return null;
}

function scoreAttachments(links) {
  return links.map(link => {
    const name = (link.split('/').pop() || link).toLowerCase();
    let score = 0;
    if (/solicitation|combined|rfp/.test(name)) score += 50;
    if (/statement.of.work|sow/.test(name)) score += 30;
    if (/performance.work.statement|pws/.test(name)) score += 20;
    if (/amendment|qa|questions/.test(name)) score -= 40;
    if (/wage.determination|attachment|exhibit/.test(name)) score -= 60;
    return { url: link, name, score };
  }).sort((a, b) => b.score - a.score);
}

async function downloadWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      return buffer;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

app.post("/api/analyze-link", async (req, res) => {
  const client = makeClient();
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "Missing url in request body." });
  if (!SAM_API_KEY) return res.status(401).json({ error: "SAM_GOV_API_KEY not configured." });

  const noticeId = parseNoticeId(url);
  if (!noticeId) return res.status(400).json({ error: "Could not parse a valid SAM.gov notice ID from URL. Expected format: sam.gov/opp/{noticeId}/view" });

  // Check cache
  const cached = noticeCache.get(noticeId);
  if (cached && Date.now() - cached.ts < 86400000) {
    console.log(`[/api/analyze-link] Cache hit: ${noticeId}`);
    return res.json(cached.data);
  }

  console.log(`[/api/analyze-link] Fetching SAM.gov: ${noticeId}`);

  // Step 1 — SAM.gov API
  let samData;
  try {
    const samRes = await fetch(
      `https://api.sam.gov/opportunities/v2/search?noticeid=${noticeId}&limit=1&api_key=${SAM_API_KEY}`,
      { headers: { "Accept": "application/json" } }
    );
    if (samRes.status === 429) return res.status(429).json({ error: "SAM.gov rate limit reached. Try again in a few minutes." });
    if (!samRes.ok) throw new Error(`SAM.gov API returned ${samRes.status}`);
    samData = await samRes.json();
  } catch (e) {
    return res.status(502).json({ error: "Failed to reach SAM.gov API: " + e.message });
  }

  const opportunity = samData?.opportunitiesData?.[0];
  if (!opportunity) return res.status(404).json({ error: "No opportunity found for this notice ID. The link may be expired or invalid." });

  const title = opportunity.title || "Unknown";
  const agency = opportunity.fullParentPathName || opportunity.organizationName || "Unknown Agency";
  const description = opportunity.description || "";

  // Step 2 — Collect attachment links
  const rawLinks = [
    ...(opportunity.resourceLinks || []),
    ...(opportunity.attachments || []).map(a => a.accessPointUrl || a.downloadUrl || "").filter(Boolean),
  ].filter(l => l && l.startsWith("http"));

  const pdfLinks = rawLinks.filter(l => l.toLowerCase().includes(".pdf") || l.toLowerCase().includes("download"));
  const ranked = scoreAttachments(pdfLinks.length ? pdfLinks : rawLinks);

  let auditText = "";
  let primaryDoc = "description_text";
  let source = "description_text";

  // Step 3 — Download primary PDF
  if (ranked.length > 0 && ranked[0].score >= -30) {
    const target = ranked[0];
    const downloadUrl = target.url.includes("api_key")
      ? target.url
      : `${target.url}${target.url.includes("?") ? "&" : "?"}api_key=${SAM_API_KEY}`;

    try {
      console.log(`[/api/analyze-link] Downloading: ${target.name}`);
      const buffer = await downloadWithRetry(downloadUrl);
      const pp = (await import("pdf-parse/lib/pdf-parse.js")).default;
      auditText = (await pp(buffer)).text;
      primaryDoc = target.name;
      source = "pdf";
      console.log(`[/api/analyze-link] PDF extracted: ${auditText.length} chars`);
    } catch (e) {
      console.warn(`[/api/analyze-link] PDF download failed, falling back to description: ${e.message}`);
    }
  }

  // Fallback to description
  if (!auditText || auditText.trim().length < 100) {
    auditText = description;
    source = "description_text";
    console.log(`[/api/analyze-link] Using description text: ${auditText.length} chars`);
  }

  if (!auditText || auditText.trim().length < 50) {
    return res.status(422).json({ error: "Could not extract enough text from this opportunity. Try downloading the PDF manually and using the upload." });
  }

  // Step 4 — 3-Pass Audit
  const raw = await llm(client, [
    { role: "system", content: AUDIT_PROMPT },
    { role: "user", content: `Audit this solicitation:\n\n---\n${auditText.slice(0, 20000)}\n---` }
  ]);

  let compliance = null;
  const deepMatch = raw.match(/\{[\s\S]*\}/);
  if (deepMatch) {
    try { compliance = JSON.parse(deepMatch[0]); }
    catch { compliance = { parse_error: "JSON extraction failed" }; }
  }

  let executiveSummary = "";
  if (deepMatch) {
    const jsonEnd = raw.indexOf(deepMatch[0]) + deepMatch[0].length;
    executiveSummary = raw.slice(jsonEnd).trim();
  }

  const result = {
    noticeId,
    title,
    agency,
    primaryDoc,
    source,
    attachmentsFound: ranked.length,
    compliance,
    executiveSummary,
    auditedAt: new Date().toISOString(),
  };

  noticeCache.set(noticeId, { ts: Date.now(), data: result });
  res.json(result);
});
