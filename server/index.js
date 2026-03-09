import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { okResponse, failResponse } from "./utils/response.js";
import { classifyIntent } from "./middleware/intent.js";
import { enrichFARClauses } from "./middleware/gatekeeper.js";
import { extractMetadata } from "./middleware/extractor.js";
import { computeScore } from "./middleware/scorer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS = join(__dirname, "llm");
const SYS_PROMPT = readFileSync(join(PROMPTS, "system_prompt.txt"), "utf8").trim();
const EXT_PROMPT = readFileSync(join(PROMPTS, "extract_prompt.txt"), "utf8").trim();
const VAL_PROMPT = readFileSync(join(PROMPTS, "validate_prompt.txt"), "utf8").trim();
const CODE_AUDIT_SYSTEM_PROMPT = `You are an expert coding assistant specialized in large-scale, stateless, low-latency code generation for RFP audit pipelines.

Your job is to:
1. Parse a supplied JSON or markdown excerpt of a SAM.gov RFP (or legal clause).
2. Identify missing or non-compliant fields (for example required certifications, deadline formats, and cost breakdowns).
3. Generate concise production-ready code (Python, Node, or Bash) that validates extracted data against an ARIS registry-style schema and returns a single JSON result with:
   {"status":"OK|FAIL","issues":[...],"remediation":"..."}.
4. Provide up to three alternative implementations internally and rank them by latency and memory use.
5. Select the best candidate (lowest latency, target under 5ms on a typical t4g.micro) and output only that final snippet, preceded by:
   Chosen implementation:

Constraints:
- Do not emit explanatory text after the final code block.
- Keep total response under 500 tokens.
- Use Python 3.11 or Node 18 only.
- Avoid external dependencies beyond standard library or Node built-ins.
- Generated code must be stateless, with no filesystem writes.
- If input cannot be parsed, return:
  {"status":"FAIL","issues":["unparseable_input"],"remediation":"request a clean JSON excerpt of the RFP"}.

Style:
- Follow PEP 8 (Python) or Airbnb style (Node).
- Include type hints (Python) or JSDoc (Node) for public functions.
- Use async/await where possible.`;

const STRIPE_PRODUCTS = {
  starter: { productId: "prod_Starter", priceId: "price_StarterMonthly", mode: "subscription" },
  growth: { productId: "prod_Growth", priceId: "price_GrowthMonthly", mode: "subscription" },
  pilot: { productId: "prod_Pilot", priceId: "price_PilotOneTime", mode: "payment" },
};

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = new Set([
  "https://www.bidsmith.pro",
  "https://bidsmith.pro",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const stripeMissingVars = [];
const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!process.env.STRIPE_SECRET_KEY) stripeMissingVars.push("STRIPE_SECRET_KEY");
if (!stripePublicKey) stripeMissingVars.push("VITE_STRIPE_PUBLIC_KEY (or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)");
if (stripeMissingVars.length > 0) {
  throw new Error(`[STRIPE_CONFIG] Missing required env vars: ${stripeMissingVars.join(", ")}`);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(Object.assign(new Error("CORS origin not allowed"), { status: 403, code: "cors_denied" }));
  },
  credentials: true
}));
app.use(requestId);
app.use((req, res, next) => {
  req.log = {
    info(message, extra = {}) {
      console.log(JSON.stringify({ level: "info", requestId: req.id, message, ...extra }));
    },
    error(message, extra = {}) {
      console.error(JSON.stringify({ level: "error", requestId: req.id, message, ...extra }));
    },
  };
  res.on("finish", () => {
    req.log.info("request_completed", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
    });
  });
  next();
});
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});
app.use(express.json({ limit: "2mb" }));

const analyzeLinkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window` (here, per 1 minute)
  message: {
    error: "Rate limit exceeded",
    message: "Too many compliance audits. Please wait and retry."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: failResponse("rate_limited", "Too many requests, try again later"),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, f, cb) => f.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("PDF only")),
});

function makeClient() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
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

async function llm(client, messages, maxTokens = 4096, options = {}) {
  const res = await client.chat.completions.create({
    model: options.model || "google/gemini-2.0-flash-001",
    max_tokens: maxTokens,
    temperature: options.temperature ?? 0,
    top_p: options.topP ?? 0.1,
    messages
  });
  return res.choices[0]?.message?.content || "";
}

function stripCodeFences(raw = "") {
  return raw
    .replace(/^```(?:json|python|javascript|js|bash)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", asyncHandler(async (_req, res) => {
  res.json(okResponse({ status: "ok", version: "3.0.0" }));
}));

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const index = pair.indexOf("=");
      if (index < 0) return acc;
      const key = pair.slice(0, index);
      const value = pair.slice(index + 1);
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

/**
 * Stores cookie consent state in an HttpOnly cookie for auditability.
 */
app.post("/api/privacy/consent", asyncHandler(async (req, res) => {
  const necessary = req.body?.necessary !== false;
  const analytics = req.body?.analytics === true;
  const marketing = req.body?.marketing === true;
  const source = String(req.body?.source || "banner").slice(0, 64);

  const consentState = analytics || marketing ? "custom_or_accept" : "reject_optional";
  const payload = {
    necessary,
    analytics,
    marketing,
    source,
    updatedAt: new Date().toISOString(),
  };

  const cookieValue = encodeURIComponent(Buffer.from(JSON.stringify(payload)).toString("base64url"));
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `bidsmith_consent=${cookieValue}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly${secureFlag}`);

  res.json(okResponse({ consent: payload, state: consentState }));
}));

app.get("/api/privacy/consent", asyncHandler(async (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const raw = cookies.bidsmith_consent;
  if (!raw) {
    return res.json(okResponse({ consent: null, state: "unset" }));
  }

  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    return res.json(okResponse({ consent: decoded, state: "set" }));
  } catch {
    return res.status(400).json(failResponse("invalid_consent_cookie", "Consent cookie could not be parsed"));
  }
}));

app.post("/api/arislabs/discover", async (req, res) => {
  try {
    const capability = String(req.body?.capability || "").trim();
    if (!capability) {
      return res.status(400).json({ error: "Missing capability in request body." });
    }

    const apiKey = process.env.ARIS_API_KEY;
    const apiBase = process.env.ARIS_API_BASE_URL;
    if (!apiKey || !apiBase) {
      return res.status(500).json({
        error: "Aris Labs configuration missing",
        required: ["ARIS_API_KEY", "ARIS_API_BASE_URL"],
      });
    }

    const endpoint = `${apiBase.replace(/\/$/, "")}/discover`;
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ capability }),
    });

    const raw = await upstream.text();
    let data = {};
    try { data = JSON.parse(raw); } catch { data = { raw }; }

    if (!upstream.ok) {
      return res.status(502).json({
        error: "Aris Labs upstream request failed",
        status: upstream.status,
        detail: data,
      });
    }

    return res.json({
      agent_url: data.endpoint || data.agent_url || "",
      latency_ms: Number(data.latency || data.latency_ms || 0),
      uptime_pct: Number(data.uptime || data.uptime_pct || 0),
      price_inr: Number(data.price || data.price_inr || 20),
      raw: data,
    });
  } catch (err) {
    console.error("[/api/arislabs/discover] ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Creates a Stripe Checkout session for a pricing plan.
 */
app.post("/api/checkout/session", asyncHandler(async (req, res) => {
  const plan = String(req.body?.plan || "").toLowerCase();
  const successUrl = String(req.body?.successUrl || "").trim();
  const cancelUrl = String(req.body?.cancelUrl || "").trim();
  const planConfig = STRIPE_PRODUCTS[plan];

  if (!planConfig) {
    return res.status(400).json({ error: "Unsupported plan" });
  }
  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: "Missing successUrl or cancelUrl" });
  }

  const stripeAuth = Buffer.from(`${process.env.STRIPE_SECRET_KEY}:`).toString("base64");
  const formBody = new URLSearchParams();
  formBody.append("mode", planConfig.mode);
  formBody.append("success_url", successUrl);
  formBody.append("cancel_url", cancelUrl);
  formBody.append("line_items[0][price]", planConfig.priceId);
  formBody.append("line_items[0][quantity]", "1");
  formBody.append("client_reference_id", `${plan}_${Date.now()}`);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${stripeAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  const raw = await stripeResponse.text();
  let payload = {};
  try { payload = JSON.parse(raw); } catch { payload = { raw }; }

  if (!stripeResponse.ok) {
    return res.status(502).json({
      error: "Stripe checkout session creation failed",
      detail: payload,
    });
  }

  return res.json({
    id: payload.id,
    url: payload.url,
    mode: planConfig.mode,
    productId: planConfig.productId,
    priceId: planConfig.priceId,
  });
}));

app.post("/api/audit/code", async (req, res) => {
  const client = makeClient();
  if (!client) return res.status(500).json({ error: "Server configuration incomplete" });

  try {
    const excerpt = String(req.body?.excerpt || "").trim();
    const preferredLanguage = String(req.body?.language || "python").toLowerCase();

    if (!excerpt) {
      return res.status(400).json({
        status: "FAIL",
        issues: ["missing_excerpt"],
        remediation: "Provide excerpt in request body as {excerpt: string}",
      });
    }

    const userPrompt = [
      `RFP excerpt:\n${excerpt.slice(0, 20000)}`,
      `Preferred output language: ${preferredLanguage === "node" ? "Node 18" : "Python 3.11"}.`,
      "Generate the final chosen implementation only.",
    ].join("\n\n");

    const raw = await llm(
      client,
      [
        { role: "system", content: CODE_AUDIT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      500,
      {
        model: process.env.GEMINI_CODE_MODEL || "google/gemini-3-pro-coding",
        temperature: 0.7,
        topP: 0.95,
      },
    );

    const cleaned = stripCodeFences(raw);
    let structured = null;
    try { structured = JSON.parse(cleaned); } catch {}
    if (structured?.status === "FAIL") return res.status(422).json(structured);

    return res.json({
      status: "OK",
      model: process.env.GEMINI_CODE_MODEL || "google/gemini-3-pro-coding",
      snippet: cleaned,
    });
  } catch (err) {
    console.error("[/api/audit/code] ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── /api/generate — Full proposal pipeline ──────────────────────────────────
app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  const client = makeClient();
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded." });
    let text;
    try { text = await parsePDF(req.file.buffer); }
    catch (e) { return res.status(422).json({ error: "Compliance engine incomplete", instruction: "Manual upload required" }); }
    if (!text || text.trim().length < 100)
      return res.status(422).json({ error: "Compliance engine incomplete", instruction: "Manual upload required" });

    let intent;
    try { intent = await classifyIntent(text, client); }
    catch (e) { return res.status(502).json({ error: "Compliance engine incomplete", instruction: "Manual upload required", details: "Intent classification failed" }); }
    if (!intent.isFederalRFP)
      return res.status(422).json({ error: "NOT_FEDERAL_RFP", message: `Document does not appear to be a U.S. Federal RFP. ${intent.reason}`, confidence: intent.confidence });

    const meta = extractMetadata(text);

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

    const { score, gaps } = computeScore(allReqs, {
      days_until_deadline: meta.days_until_deadline,
      page_limit: llmResult.submission_details?.page_limit || meta.page_limit
    });

    const farRaw = [...(llmResult.far_clauses_detected || []).map(f => f.clause_number), ...meta.far_clauses_raw];
    const mandatory = allReqs.filter(r => r.type === "Mandatory");
    const evaluation = allReqs.filter(r => r.type === "Evaluation");
    const high = allReqs.filter(r => r.risk_level === "High");
    const medium = allReqs.filter(r => r.risk_level === "Medium");
    const low = allReqs.filter(r => r.risk_level === "Low");
    const review = allReqs.filter(r => r.risk_level === "Review Required");
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

// ─── /api/audit — 7-Pillar Compliance Audit (file upload) ────────────────────
const AUDIT_PROMPT = `You are a federal contract compliance auditor and disqualification gatekeeper. Your primary job is to protect the firm from bidding on unwinnable contracts.

Perform a strict THREE-PASS analysis on the provided solicitation text.

PASS 1 — Extraction Matrix:
Extract the 7 pillars. For EVERY extracted value, you MUST include the exact verbatim 'source_snippet' from the text that proves it. If not explicitly found, set value to "NOT FOUND" and snippet to "".

PASS 2 — Anti-Hallucination Verification:
Review your extracted snippets. If a snippet does not explicitly support the value, change the value to "NOT FOUND" and delete the snippet. NEVER infer or guess.

PASS 3 — Disqualification Gate:
Apply these hard disqualification rules:
- Explicit eligibility barriers (e.g. "Only 8(a) certified firms eligible")
- Security clearances (e.g. "Top Secret clearance required")
- Massive bonding capacity minimums (e.g. "$40,000,000 minimum")
- Explicit past performance minimums (e.g. "Minimum 5 similar federal contracts")

Return a JSON object FIRST. EXACTLY match this structure:
{
  "solicitation_id": { "value": "<RFP/RFQ/IFB number or 'NOT FOUND'>", "snippet": "<verbatim text>" },
  "deadline_date": { "value": "<ISO 8601 YYYY-MM-DD or 'NOT FOUND'>", "snippet": "<verbatim text>" },
  "set_aside_type": { "value": "<8(a) / SDVOSB / HUBZone / WOSB / Total Small Business / Unrestricted or 'NOT FOUND'>", "snippet": "<verbatim text>" },
  "bonding_reqs": {
    "bid_bond": { "value": "<amount or 'NOT FOUND'>", "snippet": "<verbatim text>" },
    "performance_bond": { "value": "<amount or 'NOT FOUND'>", "snippet": "<verbatim text>" },
    "payment_bond": { "value": "<amount or 'NOT FOUND'>", "snippet": "<verbatim text>" }
  },
  "past_performance_threshold": { "value": "<explicit minimums or 'NOT FOUND'>", "snippet": "<verbatim text>" },
  "technical_disqualifiers": [
    { "value": "<mandatory cert/clearance>", "snippet": "<verbatim text>" }
  ],
  "disqualification_assessment": {
    "disqualified": <true or false>,
    "risk_level": "<HIGH/MEDIUM/LOW>",
    "trigger_category": "<SET_ASIDE/CLEARANCE/BONDING/PAST_PERFORMANCE or NONE>",
    "matched_phrase": "<exact phrase that triggered it or "">",
    "confidence": "<HIGH/MEDIUM/LOW or NONE>",
    "reason": "<If disqualified, state the exact explicit barrier. Otherwise empty string.>"
  }
}
If no technical disqualifiers exist, return an empty array for 'technical_disqualifiers'.

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

function enforceDisqualification(compliance, text) {
  if (!compliance) {
    compliance = {
      solicitation_id: "NOT FOUND",
      deadline_date: "NOT FOUND",
      set_aside_type: "NOT FOUND",
      bonding_reqs: { bid_bond: "NOT FOUND", performance_bond: "NOT FOUND", payment_bond: "NOT FOUND" },
      past_performance_threshold: "NOT FOUND",
      technical_disqualifiers: []
    };
  }
  if (!compliance.disqualification_assessment) {
    compliance.disqualification_assessment = {
      disqualified: false, risk_level: "UNKNOWN", reason: "",
      trigger_category: "NONE", matched_phrase: "", confidence: "NONE"
    };
  }

  const triggers = [
    {
      category: "SET_ASIDE",
      rgx: /(8\(a\)\s+Program|Total\s+Small\s+Business\s+Set-Aside\s*\(?8\(a\)\)?|Restricted\s+to\s+8\(a\)\s+participants|Only\s+certified\s+8\(a\)\s+firms|HUBZone\s+Set-Aside|SDVOSB\s+Set-Aside)/i,
      reason: "Explicit set-aside restriction detected."
    },
    {
      category: "CLEARANCE",
      rgx: /(Top\s+Secret\s+clearance\s+required|Secret\s+clearance\s+required|TS\/SCI|Facility\s+Clearance\s+Level|FCL\s+required|Active\s+clearance\s+required)/i,
      reason: "Mandatory security clearance requirement."
    },
    {
      category: "BONDING",
      rgx: /(Bonding\s+capacity\s+.*?\$?\d{1,3}(,\d{3})*(\.\d+)?|Performance\s+bond\s+.*?\$?\d{1,3}(,\d{3})*(\.\d+)?|Payment\s+bond\s+.*?\$?\d{1,3}(,\d{3})*(\.\d+)?|Minimum\s+bonding\s+.*?\$?\d{1,3}(,\d{3})*(\.\d+)?)/i,
      reason: "Requires massive bonding capacity."
    },
    {
      category: "PAST_PERFORMANCE",
      rgx: /(Minimum\s+of\s+\d+\s+similar\s+contracts|At\s+least\s+\d+\s+years\s+experience|Offeror\s+must\s+demonstrate\s+prior\s+federal\s+contracts)/i,
      reason: "Stringent past performance baseline required."
    }
  ];

  for (const trigger of triggers) {
    const match = text.match(trigger.rgx);
    if (match && !compliance.disqualification_assessment.disqualified) {
      compliance.disqualification_assessment.disqualified = true;
      compliance.disqualification_assessment.risk_level = "HIGH";
      compliance.disqualification_assessment.trigger_category = trigger.category;
      compliance.disqualification_assessment.matched_phrase = match[0];
      compliance.disqualification_assessment.confidence = "HIGH";
      compliance.disqualification_assessment.reason = trigger.reason;
    }
  }
  return compliance;
}


app.post("/api/audit", upload.single("file"), async (req, res) => {
  const client = makeClient();
  if (!client) return res.status(500).json({ error: "Server configuration incomplete" });
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    let text;
    try { text = await parsePDF(req.file.buffer); }
    catch (e) { return res.status(422).json({ error: "Compliance engine incomplete", instruction: "Manual upload required" }); }
    if (!text || text.trim().length < 50)
      return res.status(422).json({ error: "Compliance engine incomplete", instruction: "Manual upload required" });

    console.log(`[/api/audit] ${req.file.originalname} — ${text.length} chars`);

    const raw = await llm(client, [
      { role: "system", content: AUDIT_PROMPT },
      { role: "user", content: `Audit this solicitation:\n\n---\n${text.slice(0, 20000)}\n---` }
    ], 3000);

    let compliance = null;
    const deepMatch = raw.match(/\{[\s\S]*\}/);
    if (deepMatch) {
      try { compliance = JSON.parse(deepMatch[0]); }
      catch { compliance = { parse_error: "JSON extraction failed" }; }
    }

    compliance = enforceDisqualification(compliance, text);

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
    res.status(500).json({ error: "Compliance engine incomplete", instruction: "Manual upload required", details: err.message });
  }
});

// ─── /api/analyze-link — SAM.gov URL → Audit Pipeline ────────────────────────
const noticeCache = new Map();

function parseNoticeId(url) {
  const oppMatch = url.match(/\/opp\/([a-f0-9]{32})/i);
  if (oppMatch) return oppMatch[1];
  const qMatch = url.match(/[?&]noticeId=([^&]+)/i);
  if (qMatch) return qMatch[1];
  return null;
}

function scoreByName(name) {
  const n = name.toLowerCase();
  let score = 0;
  if (/solicitation|combined|rfp/.test(n)) score += 50;
  if (/statement.of.work|sow/.test(n)) score += 30;
  if (/performance.work.statement|pws/.test(n)) score += 20;
  if (/amendment|qa|questions/.test(n)) score -= 40;
  if (/wage.determination|attachment|exhibit/.test(n)) score -= 60;
  return score;
}

async function scoreAttachments(links, apiKey) {
  const sample = links.slice(0, 15);
  const results = await Promise.all(sample.map(async (url) => {
    try {
      const fullUrl = url.includes('api_key') ? url : `${url}?api_key=${apiKey}`;
      const res = await fetch(fullUrl, { method: 'HEAD', redirect: 'manual' });
      const disp = res.headers.get('content-disposition') || '';
      const loc = res.headers.get('location') || '';
      // Filename lives in content-disposition OR encoded in S3 location header
      const dispMatch = disp.match(/filename[^;=\n]*=["']?([^"'\n]+)["']?/i);
      const locMatch = decodeURIComponent(loc).match(/filename=([^&]+)/);
      const name = (dispMatch?.[1] || locMatch?.[1] || url.split('/').pop()).trim();
      const score = scoreByName(name);
      console.log(`[scoreAttachments] "${name}" → ${score}`);
      return { url, name, score };
    } catch (e) {
      console.warn('[scoreAttachments] HEAD failed:', e.message);
      return { url, name: url.split('/').pop(), score: 0 };
    }
  }));
  return results.sort((a, b) => b.score - a.score);
}

async function downloadWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

app.post("/api/analyze-link", analyzeLinkLimiter, async (req, res) => {
  const client = makeClient();
  if (!client) return res.status(500).json({ error: "Server configuration incomplete" });
  const { url } = req.body;
  const SAM_API_KEY = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;
  if (!SAM_API_KEY) return res.status(500).json({ error: "Server configuration incomplete" });

  if (!url) return res.status(400).json({ error: "Missing url in request body." });

  const noticeId = parseNoticeId(url);
  if (!noticeId) return res.status(400).json({ error: "Compliance engine incomplete", instruction: "Manual upload required" });

  const cached = noticeCache.get(noticeId);
  if (cached && Date.now() - cached.ts < 86400000) {
    console.log(`[/api/analyze-link] Cache hit: ${noticeId}`);
    return res.json(cached.data);
  }

  console.log(`[/api/analyze-link] Fetching SAM.gov: ${noticeId}`);

  let samData;
  try {
    const samRes = await fetch(
      `https://api.sam.gov/opportunities/v2/search?noticeid=${noticeId}&limit=1&api_key=${SAM_API_KEY}`,
      { headers: { Accept: "application/json" } }
    );

    if (!samRes.ok) {
      console.log(`[/api/analyze-link] SAM.gov API Error (${samRes.status}). Attempting Firecrawl fallback.`);
      const fcKey = process.env.FIRECRAWL_API_KEY;
      if (fcKey) {
        try {
          const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fcKey}` },
            body: JSON.stringify({ url: `https://sam.gov/opp/${noticeId}/view`, formats: ["markdown"] })
          });
          if (fcRes.ok) {
            const fcData = await fcRes.json();
            return res.json({
              noticeId,
              title: `Opportunity: ${noticeId}`,
              agency: "Extracted via Secondary Source",
              primaryDoc: "firecrawl_extraction.md",
              source: "scraper_fallback",
              attachmentsFound: 0,
              compliance: enforceDisqualification(null, fcData.data?.markdown || ""),
              executiveSummary: "Generated via Fallback Data.",
              auditedAt: new Date().toISOString()
            });
          }
          console.warn(`[/api/analyze-link] Firecrawl returned ${fcRes.status}`);
        } catch (fcErr) {
          console.warn(`[/api/analyze-link] Firecrawl failed:`, fcErr.message);
        }
      } else {
        console.warn(`[/api/analyze-link] No FIRECRAWL_API_KEY set, skipping fallback.`);
      }
      return res.status(503).json({ error: "SAM.gov temporarily unavailable", instruction: "Manual upload required", details: `SAM.gov returned ${samRes.status}. Please upload the solicitation PDF directly.` });
    }
    samData = await samRes.json();
  } catch (e) {
    console.error(`[/api/analyze-link] Fetch failed:`, e);
    return res.status(502).json({ error: "Compliance engine incomplete", instruction: "Manual upload required", details: "Failed to reach SAM.gov API and Fallback" });
  }

  const opportunity = samData?.opportunitiesData?.[0];
  if (!opportunity) return res.status(404).json({ error: "Compliance engine incomplete", instruction: "Manual upload required", details: "No opportunity found" });

  const title = opportunity.title || "Unknown";
  const agency = opportunity.fullParentPathName || opportunity.organizationName || "Unknown Agency";
  const description = opportunity.description || "";

  const rawLinks = [
    ...(opportunity.resourceLinks || []),
    ...(opportunity.attachments || []).map(a => a.accessPointUrl || a.downloadUrl || "").filter(Boolean),
  ].filter(l => l && l.startsWith("http"));

  console.log(`[/api/analyze-link] ${rawLinks.length} attachment links found`);

  const ranked = await scoreAttachments(rawLinks, SAM_API_KEY);
  console.log(`[/api/analyze-link] Top ranked: "${ranked[0]?.name}" score=${ranked[0]?.score}`);

  let auditText = "";
  let primaryDoc = "description_text";
  let source = "description_text";

  // Try to download top-scored PDF (score must be > 0)
  const pdfCandidates = ranked.filter(r => r.score > 0 && /\.pdf$/i.test(r.name));
  if (pdfCandidates.length > 0) {
    const target = pdfCandidates[0];
    const downloadUrl = target.url.includes("api_key") ? target.url : `${target.url}?api_key=${SAM_API_KEY}`;
    try {
      console.log(`[/api/analyze-link] Downloading: ${target.name}`);
      const buffer = await downloadWithRetry(downloadUrl);
      auditText = await parsePDF(buffer);
      primaryDoc = target.name;
      source = "pdf";
      console.log(`[/api/analyze-link] PDF extracted: ${auditText.length} chars`);
    } catch (e) {
      console.warn(`[/api/analyze-link] PDF download failed: ${e.message}`);
    }
  }

  // Fallback to description
  if (!auditText || auditText.trim().length < 100) {
    auditText = description;
    source = "description_text";
    console.log(`[/api/analyze-link] Fallback to description: ${auditText.length} chars`);
  }

  if (!auditText || auditText.trim().length < 50)
    return res.status(422).json({ error: "Compliance engine incomplete", instruction: "Manual upload required" });

  const raw = await llm(client, [
    { role: "system", content: AUDIT_PROMPT },
    { role: "user", content: `Audit this solicitation:\n\n---\n${auditText.slice(0, 20000)}\n---` }
  ], 3000);

  let compliance = null;
  const deepMatch = raw.match(/\{[\s\S]*\}/);
  if (deepMatch) {
    try { compliance = JSON.parse(deepMatch[0]); }
    catch { compliance = { parse_error: "JSON extraction failed" }; }
  }

  compliance = enforceDisqualification(compliance, auditText);

  let executiveSummary = "";
  if (deepMatch) {
    const jsonEnd = raw.indexOf(deepMatch[0]) + deepMatch[0].length;
    executiveSummary = raw.slice(jsonEnd).trim();
  }

  const result = {
    noticeId, title, agency, primaryDoc, source,
    attachmentsFound: ranked.length,
    compliance, executiveSummary,
    auditedAt: new Date().toISOString(),
  };

  noticeCache.set(noticeId, { ts: Date.now(), data: result });
  res.json(result);
});

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ARIS v3 → http://localhost:${PORT}`);
  console.log(`   Pipeline: Intent → Extract → Validate → Score`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY not set");
});
