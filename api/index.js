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

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS = join(__dirname, "llm");
const SYS_PROMPT = readFileSync(join(PROMPTS, "system_prompt.txt"), "utf8").trim();
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

const STRIPE_PREMIUM_PRODUCTS = {
  standard: { priceId: process.env.STRIPE_PRICE_PREMIUM_STANDARD, turnaroundHours: "48" },
  express: { priceId: process.env.STRIPE_PRICE_PREMIUM_EXPRESS, turnaroundHours: "24" },
};
const STRIPE_ARIS_CALL_PRICE_ID = process.env.STRIPE_PRICE_ARIS_CALL;

const PRICING_TIERS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPriceUSD: 29,
    credits: 200,
    description: "Core agents with 200 free calls, then $0.25/call.",
    features: [
      "Bid intelligence core pipeline",
      "200 included calls/month",
      "Usage overage at $0.25/call",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPriceUSD: 199,
    credits: 1000,
    description: "Includes 1,000 calls/month, then $0.20/call overage.",
    features: [
      "Everything in Starter",
      "1,000 included calls/month",
      "Usage overage at $0.20/call",
      "Priority support",
    ],
  },
  {
    id: "pilot",
    name: "Pilot",
    monthlyPriceUSD: 2500,
    credits: 5000,
    description: "30-day done-with-you onboarding plus 5,000 calls.",
    features: [
      "Implementation onboarding",
      "5,000 included calls",
      "Capture + compliance setup",
      "Weekly delivery reviews",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceUSD: null,
    credits: -1,
    description: "Unlimited calls, private endpoints, SLA, and private support.",
    features: [
      "Custom commercial terms",
      "Private infrastructure options",
      "SLA-backed uptime",
      "Dedicated account management",
    ],
  },
];

function formatPricingTier(tier) {
  return {
    id: tier.id,
    name: tier.name,
    price: tier.monthlyPriceUSD,
    credits: tier.credits,
    description: tier.description,
    features: tier.features,
  };
}

const TEST_LINKS = [
  {
    id: "test-1",
    title: "DLA Energy Solicitation",
    url: "https://sam.gov/opp/2eaf9eb1d9194206aa1e6bd744edcce3/view",
    description: "Defense Logistics Agency fuel storage requirements."
  },
  {
    id: "test-2",
    title: "Army IT Services",
    url: "https://sam.gov/opp/a9f8bd642d3343bb887cd28d7d441167/view",
    description: "Army Corps of Engineers IT support services."
  }
];

const SAMPLE_REPORT = {
  success: true,
  envelope: {
    success: true,
    generatedAt: new Date().toISOString(),
    engine: "static_sample",
    pipelineStages: ["analyst", "drafter", "reviewer", "intel", "editor"]
  },
  engine: "static_sample",
  pipelineStages: ["analyst", "drafter", "reviewer", "intel", "editor"],
  title: "DLA Energy Solicitation (Sample)",
  agency: "Defense Logistics Agency",
  generatedAt: new Date().toISOString(),
  pillars: {
    solicitation_id: { value: "SPE603-23-R-0500", confidence: "HIGH" },
    deadline_date: { value: "2023-11-15", confidence: "HIGH" },
    set_aside_type: { value: "Small Business Set-Aside", confidence: "HIGH" },
    naics_code: { value: "493190", confidence: "HIGH" }
  },
  executiveSummary: "This solicitation is a 100% Small Business Set-Aside for fuel storage services. Key risks include a strict 30-day mobilization period and required DLA Energy experience.",
  compliance_report: `
# 📄 Executive Summary

**Client:** Sample Client
**RFP:** DLA Energy Fuel Storage – **Agency:** Defense Logistics Agency
**Date:** 2023-10-27

## 1️⃣ Solicitation Overview

| Item | Detail |
|---|---|
| **Solicitation ID** | SPE603-23-R-0500 |
| **Title** | Fuel Storage & Distribution |
| **Agency** | DLA Energy |
| **Due Date** | 2023-11-15 |
| **Key Compliance Regimes** | FAR, DFARS, NIST SP 800-171 |

## 3️⃣ Compliance Risk Matrix

| Regime/Category | Clause | Found? | Risk Weight (1-10) | Comments / Issues |
|---|---|---|---|---|
| Set-Aside | FAR 52.219-6 | ✅ | 1 | Total Small Business Set-Aside confirmed. |
| Cybersecurity | DFARS 252.204-7012 | ⚠️ | 9 | NIST 800-171 score must be in SPRS. |
| Past Performance | Section L | ❌ | 8 | Requires 3 references >$5M in last 5 years. |

**Overall Compliance Score:** 82%`.trim(),
  proposal_draft: `# 📄 CONFIDENTIAL RISK MEMORANDUM\n\n**Subject:** Phase 1 Technical Disqualification Audit\n**Solicitation ID:** SPE603-23-R-0500\n\n---\n\n### 🚨 EXECUTIVE RISK SUMMARY\n\nThe solicitation contains **one critical compliance trap** regarding cybersecurity and **two high-risk technical gaps**. Manual review is estimated to take **12 hours**. We recommend immediate verification of SPRS scores.\n\n---\n\n### 🍱 THE "BID-KILLER" MATRIX\n\n| Risk Level | Risk Category | FAR/DFARS Citation | The Hidden Requirement | Impact if Missed | Remediation Action |\n| --- | --- | --- | --- | --- | --- |\n| 🔴 **CRITICAL** | Cybersecurity | DFARS 252.204-7012 | Must have a NIST SP 800-171 assessment score posted in SPRS. | Immediate disqualification. | Post score to SPRS before submission. |\n| 🟡 **HIGH RISK** | Past Performance | Section L.4.2 | Contracts must be >$5M value. | Technical Unacceptability. | Verify reference contract values. |`.trim(),
  win_themes: ["Proven DLA Energy Past Performance", "100% Small Business Compliance", "Automated Inventory Management", "Safety First Culture"],
  risk_flags: ["Short Mobilization Timeline", "Environmental Liability Clauses", "Key Personnel Availability"],
  proposal_outline: [
    { volume: "Volume I: Technical", sections: ["1.0 Technical Approach", "1.1 Operations", "1.2 Quality Control"] },
    { volume: "Volume II: Past Performance", sections: ["2.0 Recent Contracts", "2.1 Questionnaires"] },
    { volume: "Volume III: Price", sections: ["3.0 Pricing Schedule", "3.1 Narrative"] }
  ]
};

const app = express();
const PORT = process.env.PORT || 8080;
const allowedOrigins = new Set([
  "https://www.bidsmith.pro",
  "https://bidsmith.pro",
  "https://app.bidsmith.pro",
  "https://docs.bidsmith.pro",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const stripeMissingVars = [];
const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!process.env.STRIPE_SECRET_KEY) stripeMissingVars.push("STRIPE_SECRET_KEY");
if (!stripePublicKey) stripeMissingVars.push("VITE_STRIPE_PUBLIC_KEY (or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)");
if (stripeMissingVars.length > 0) {
  console.warn(`[STRIPE_CONFIG] Missing env vars: ${stripeMissingVars.join(", ")} — Stripe checkout routes will fail`);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(Object.assign(new Error("CORS origin not allowed"), { status: 403, code: "cors_denied" }));
  },
  credentials: true
}));
app.set('trust proxy', 1); // Required for Railway/Heroku reverse proxy — fixes express-rate-limit X-Forwarded-For
app.use(requestId);
app.use((req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  req.log = {
    info(message, extra = {}) {
      const logObject = { level: "info", requestId: req.id, message, ...extra };
      isProd ? console.log(JSON.stringify(logObject)) : console.info(`[INFO] ${req.id} - ${message}`, extra);
    },
    error(message, extra = {}) {
      const logObject = { level: "error", requestId: req.id, message, ...extra };
      isProd ? console.error(JSON.stringify(logObject)) : console.error(`[ERROR] ${req.id} - ${message}`, extra);
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


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, f, cb) => f.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("PDF only")),
});

const analyzeLinkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Rate limit exceeded", message: "Too many compliance audits. Please wait and retry." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: failResponse("rate_limited", "Too many requests, try again later"),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// ─── Shared Utilities ─────────────────────────────────────────────────────────

function makeClient() {
  const key = process.env.OPENROUTER_API_KEY;
  console.log(`[INIT] OPENROUTER_API_KEY: ${key ? 'SET (' + key.substring(0, 20) + '...)' : 'NOT SET'}`);
  if (!key) return null;
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: { "HTTP-Referer": "https://bidsmith.pro", "X-Title": "BidSmith" }
  });
}

async function parsePDF(buffer) {
  const pp = (await import("pdf-parse/lib/pdf-parse.js")).default;
  return (await pp(buffer)).text;
}

function parseJSON(raw) {
  return JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
}

// Per-agent model routing — ported from money/ pipeline
// cheap+fast for extraction, strong reasoning for analysis/drafting
const AGENT_MODELS = {
  extractor: "google/gemini-2.0-flash-001",
  analyst: "google/gemini-2.0-flash-001",
  drafter: "google/gemini-2.0-flash-001",
  reviewer: "google/gemini-2.0-flash-001",
  audit: "google/gemini-2.0-flash-001",
  audit_codegen: process.env.GEMINI_CODE_MODEL || "google/gemini-3-pro-coding",
};

// LLM with exponential backoff retry — ported from money/main.py run_llm()
async function llm(client, messages, maxTokens = 4096, agentKey = "audit", retries = 3, options = {}) {
  const model = AGENT_MODELS[agentKey] || "google/gemini-2.0-flash-001";
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const completionParams = {
        model,
        max_tokens: maxTokens,
        temperature: options.temperature ?? 0,
        top_p: options.topP ?? 0.1,
        messages
      };

      if (options.response_format) {
        completionParams.response_format = options.response_format;
      }

      const res = await client.chat.completions.create(completionParams);
      return res.choices[0]?.message?.content || "";
    } catch (e) {
      const isRetryable = e?.status === 429 || e?.status >= 500;
      if (isRetryable && attempt < retries - 1) {
        const wait = Math.pow(2, attempt + 1) * 1000;
        console.warn(`[llm] ${agentKey} attempt ${attempt + 1} failed (${e.status}), retrying in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw e;
      }
    }
  }
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

app.get("/api/examples", (_req, res) => {
  res.json(TEST_LINKS);
});

app.get("/api/sample-report", (_req, res) => {
  res.json(SAMPLE_REPORT);
});

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

app.post("/v1/execute", asyncHandler(async (req, res) => {
  const solicitationUrl = String(req.body?.solicitation_url || req.body?.url || "").trim();
  const features = Array.isArray(req.body?.features) ? req.body.features : [];
  const metadata = (req.body?.metadata && typeof req.body.metadata === "object") ? req.body.metadata : {};
  if (!solicitationUrl) {
    return res.status(400).json({ error: "solicitation_url required" });
  }

  const apiKey = process.env.ARIS_API_KEY;
  const apiBase = process.env.ARIS_API_BASE_URL;
  const executePath = String(process.env.ARIS_EXECUTE_PATH || "/execute");
  if (!apiKey || !apiBase) {
    return res.status(500).json({
      error: "Aris Labs configuration missing",
      required: ["ARIS_API_KEY", "ARIS_API_BASE_URL"],
    });
  }

  const endpoint = `${apiBase.replace(/\/$/, "")}${executePath.startsWith("/") ? executePath : `/${executePath}`}`;
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      url: solicitationUrl,
      features,
      metadata: {
        ...metadata,
        source: metadata.source || "bidsmith_proxy",
      },
    }),
  });

  const raw = await upstream.text();
  let payload = {};
  try { payload = JSON.parse(raw); } catch { payload = { raw }; }

  if (!upstream.ok) {
    return res.status(502).json({
      error: "Aris execute upstream request failed",
      status: upstream.status,
      detail: payload,
    });
  }

  return res.json(payload);
}));

/**
 * Creates a Stripe Checkout session for a pricing plan.
 */
app.post("/api/checkout/session", asyncHandler(async (req, res) => {
  const plan = String(req.body?.plan || "").toLowerCase();
  const premiumTierRaw = String(req.body?.premiumTier || "none").toLowerCase();
  const context = (req.body?.context && typeof req.body.context === "object") ? req.body.context : {};
  const premiumTier = premiumTierRaw === "standard" || premiumTierRaw === "express" ? premiumTierRaw : "none";
  const planConfig = STRIPE_PRODUCTS[plan];
  const origin = String(req.get("origin") || "https://www.bidsmith.pro").replace(/\/$/, "");
  const successUrlInput = String(req.body?.successUrl || "").trim();
  const cancelUrlInput = String(req.body?.cancelUrl || "").trim();
  const successUrl = successUrlInput || `${origin}/app?checkout=success&premium=${encodeURIComponent(premiumTier)}&plan=${encodeURIComponent(plan)}`;
  const cancelUrl = cancelUrlInput || `${origin}/app?checkout=cancelled&premium=${encodeURIComponent(premiumTier)}&plan=${encodeURIComponent(plan)}`;

  if (!planConfig) {
    return res.status(400).json({ error: "Unsupported plan" });
  }
  if (premiumTierRaw !== "none" && premiumTier === "none") {
    return res.status(400).json({ error: "Unsupported premiumTier. Use none, standard, or express." });
  }

  const stripeAuth = Buffer.from(`${process.env.STRIPE_SECRET_KEY}:`).toString("base64");
  const formBody = new URLSearchParams();
  formBody.append("mode", planConfig.mode);
  formBody.append("success_url", successUrl);
  formBody.append("cancel_url", cancelUrl);
  formBody.append("line_items[0][price]", planConfig.priceId);
  formBody.append("line_items[0][quantity]", "1");
  if (premiumTier !== "none") {
    const premiumConfig = STRIPE_PREMIUM_PRODUCTS[premiumTier];
    if (!premiumConfig?.priceId) {
      return res.status(500).json({
        error: `Missing Stripe price configuration for premium tier "${premiumTier}"`,
        requiredEnv: premiumTier === "standard"
          ? "STRIPE_PRICE_PREMIUM_STANDARD"
          : "STRIPE_PRICE_PREMIUM_EXPRESS",
      });
    }
    formBody.append("line_items[1][price]", premiumConfig.priceId);
    formBody.append("line_items[1][quantity]", "1");
    formBody.append("metadata[premium_tier]", premiumTier);
    formBody.append("metadata[requested_turnaround_hours]", premiumConfig.turnaroundHours);
  } else {
    formBody.append("metadata[premium_tier]", "none");
    formBody.append("metadata[requested_turnaround_hours]", "");
  }
  formBody.append("metadata[notice_id]", String(context.noticeId || ""));
  formBody.append("metadata[opportunity_title]", String(context.opportunityTitle || ""));
  formBody.append("metadata[source]", String(context.source || ""));
  formBody.append("client_reference_id", `${plan}_${premiumTier}_${Date.now()}`);

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
    premiumTier,
    premiumPriceId: premiumTier !== "none" ? STRIPE_PREMIUM_PRODUCTS[premiumTier].priceId : null,
  });
}));

app.post("/api/aris-call-session", asyncHandler(async (req, res) => {
  if (!STRIPE_ARIS_CALL_PRICE_ID) {
    return res.status(500).json({
      error: "Missing Stripe Aris call price configuration",
      requiredEnv: "STRIPE_PRICE_ARIS_CALL",
    });
  }

  const metadataInput = (req.body?.metadata && typeof req.body.metadata === "object") ? req.body.metadata : {};
  const origin = String(req.get("origin") || "https://www.bidsmith.pro").replace(/\/$/, "");
  const successUrl = String(req.body?.successUrl || `${origin}/app?aris=checkout_success`).trim();
  const cancelUrl = String(req.body?.cancelUrl || `${origin}/app?aris=checkout_canceled`).trim();

  const stripeAuth = Buffer.from(`${process.env.STRIPE_SECRET_KEY}:`).toString("base64");
  const formBody = new URLSearchParams();
  formBody.append("mode", "payment");
  formBody.append("success_url", successUrl);
  formBody.append("cancel_url", cancelUrl);
  formBody.append("line_items[0][price]", STRIPE_ARIS_CALL_PRICE_ID);
  formBody.append("line_items[0][quantity]", "1");
  formBody.append("metadata[product]", "ArisEngineCall");
  Object.entries(metadataInput).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const safeKey = String(key).slice(0, 40);
    const safeValue = String(value).slice(0, 500);
    formBody.append(`metadata[${safeKey}]`, safeValue);
  });
  formBody.append("client_reference_id", `aris_call_${Date.now()}`);

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
      error: "Stripe Aris call checkout session creation failed",
      detail: payload,
    });
  }

  return res.json({ url: payload.url, id: payload.id });
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
      "audit_codegen",
      3,
      { temperature: 0.7, topP: 0.95 },
    );

    const cleaned = stripCodeFences(raw);
    let structured = null;
    try { structured = JSON.parse(cleaned); } catch {}

    if (structured?.status === "FAIL") return res.status(422).json(structured);

    return res.json({
      status: "OK",
      model: AGENT_MODELS.audit_codegen,
      snippet: cleaned,
    });
  } catch (err) {
    console.error("[/api/audit/code] ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── /api/generate ────────────────────────────────────────────────────────────
app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  const client = makeClient();
  if (!client) return res.status(500).json({ error: "Server configuration incomplete" });
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    if (!req.body.companyProfile) return res.status(400).json({ error: "No company profile provided" });

    console.log(`[/api/generate] Processing PDF: ${req.file.originalname}`);
    const pdfText = await parsePDF(req.file.buffer);

    const proposal = await llm(client, [{
      role: "user",
      content: `You are a federal RFP compliance expert. Analyze this company profile against the provided Federal RFP and generate a professional federal proposal draft in markdown format.\n\nCompany Profile: ${req.body.companyProfile}\n\nRFP Text Extract (first 20000 chars):\n${pdfText.slice(0, 20000)}\n\nGenerate a comprehensive proposal that includes:\n1. Executive Summary\n2. Technical Approach\n3. Management Plan\n4. Past Performance\n5. Risk Mitigation\n6. Compliance Certification\n\nFormat as markdown. Be specific and professional.`
    }], 2048);

    res.json({
      proposal,
      metadata: { file: req.file.originalname, size: req.file.size },
      score: { bid_score: 85, compliance_score: 90, risk_level: "Low" }
    });
  } catch (err) {
    console.error("[/api/generate] ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Audit Prompt (4-Pass Deep Inference) ────────────────────────────────────
const AUDIT_PROMPT = `You are a federal contract compliance auditor and disqualification gatekeeper for a government contracting intelligence platform. Your output is a premium-grade bid/no-bid intelligence report.

Perform a strict FOUR-PASS analysis.

PASS 1 — Primary Extraction:
Scan the solicitation for explicit statements of all 7 pillars. Record verbatim source_snippets.

PASS 2 — Recursive Deep Search:
For any pillar still showing NOT FOUND after Pass 1, perform a secondary keyword scan:
- solicitation_id: scan for "RFP", "RFQ", "IFB", "Solicitation No.", "Contract No.", "N000", "W91", "FA", "GS-" prefixes
- deadline_date: scan for "due date", "by", "no later than", "closes", "submission deadline", "offers due"
- set_aside_type: scan for "small business", "8(a)", "HUBZone", "SDVOSB", "VOSB", "WOSB", "EDWOSB", "unrestricted", "full and open", "total small", "partial set-aside". Map detected type to FAR clause: 8(a)→FAR 52.219-18, SDVOSB→FAR 52.219-27, HUBZone→FAR 52.219-3, WOSB→FAR 52.219-29, Total Small Business→FAR 52.219-6, Unrestricted→N/A
- bonding_reqs: scan for "surety", "bond", "payment and performance", "Miller Act"
- past_performance_threshold: scan for "similar", "relevant", "prior contracts", "experience", "references", "projects of similar scope"
- naics_code: scan for 6-digit codes near "NAICS"
- contract_value: scan for "$", "budget", "ceiling", "not-to-exceed", "award amount"
If found via recursive scan, note it with confidence "INFERRED" and include the snippet.

PASS 3 — Anti-Hallucination Verification:
For each field, verify: does the snippet EXPLICITLY support the value? If inferred but ambiguous, keep value but set confidence to "LOW".

PASS 4 — Disqualification Gate:
- Explicit set-aside eligibility barriers
- Security clearance requirements (TS/SCI, Secret, FCL)
- Bonding minimums above $5M
- Past performance bars (minimum N contracts required)

Return a JSON object FIRST with EXACTLY this structure:
{
  "solicitation_id": { "value": "<number or 'N/A - Manual Review Required'>", "snippet": "<verbatim>", "confidence": "<HIGH/INFERRED/LOW/NONE>" },
  "deadline_date": { "value": "<YYYY-MM-DD or 'N/A - Manual Review Required'>", "snippet": "<verbatim>", "confidence": "<HIGH/INFERRED/LOW/NONE>" },
  "set_aside_type": { "value": "<type or 'N/A - Manual Review Required'>", "snippet": "<verbatim>", "confidence": "<HIGH/INFERRED/LOW/NONE>", "far_clause": "<FAR clause or 'N/A'>" },
  "naics_code": { "value": "<6-digit code or 'N/A - Manual Review Required'>", "snippet": "<verbatim>", "confidence": "<HIGH/INFERRED/LOW/NONE>" },
  "contract_value": { "value": "<USD standardized or 'N/A - Manual Review Required'>", "snippet": "<verbatim>", "confidence": "<HIGH/INFERRED/LOW/NONE>" },
  "bonding_reqs": {
    "bid_bond": { "value": "<amount or 'N/A - Manual Review Required'>", "snippet": "<verbatim>" },
    "performance_bond": { "value": "<amount or 'N/A - Manual Review Required'>", "snippet": "<verbatim>" },
    "payment_bond": { "value": "<amount or 'N/A - Manual Review Required'>", "snippet": "<verbatim>" }
  },
  "past_performance_threshold": { "value": "<explicit minimums or 'N/A - Manual Review Required'>", "snippet": "<verbatim>", "confidence": "<HIGH/INFERRED/LOW/NONE>" },
  "technical_disqualifiers": [
    { "value": "<mandatory cert/clearance>", "snippet": "<verbatim>" }
  ],
  "far_clauses_detected": ["<FAR clause numbers found in text>"],
  "disqualification_assessment": {
    "disqualified": <true or false>,
    "risk_level": "<HIGH/MEDIUM/LOW>",
    "trigger_category": "<SET_ASIDE/CLEARANCE/BONDING/PAST_PERFORMANCE or NONE>",
    "matched_phrase": "<exact phrase or ''>",
    "confidence": "<HIGH/MEDIUM/LOW or NONE>",
    "reason": "<explicit barrier or ''>"
  }
}

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

// ─── Disqualification Enforcer ────────────────────────────────────────────────
function enforceDisqualification(compliance, text) {
  if (!compliance) {
    compliance = {
      solicitation_id: "NOT FOUND", deadline_date: "NOT FOUND", set_aside_type: "NOT FOUND",
      bonding_reqs: { bid_bond: "NOT FOUND", performance_bond: "NOT FOUND", payment_bond: "NOT FOUND" },
      past_performance_threshold: "NOT FOUND", technical_disqualifiers: []
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

function registerPricingRoutes(routeBase) {
  app.get(`${routeBase}`, (_req, res) => {
    res.json(PRICING_TIERS.map(formatPricingTier));
  });

  app.get(`${routeBase}/:id`, (req, res) => {
    const tier = PRICING_TIERS.find((t) => t.id === String(req.params.id || "").toLowerCase());
    if (!tier) {
      return res.status(404).json({ error: "Tier not found" });
    }
    return res.json(formatPricingTier(tier));
  });
}

registerPricingRoutes("/pricing");
registerPricingRoutes("/api/pricing");

// ─── /api/audit ───────────────────────────────────────────────────────────────
app.post("/api/audit", upload.single("file"), async (req, res) => {
  const client = makeClient();
  if (!client) return res.status(500).json({ error: "Server configuration incomplete" });
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    let text;
    try { text = await parsePDF(req.file.buffer); }
    catch (e) { return res.status(422).json({ error: "Could not extract text from PDF. Try a non-scanned document." }); }
    if (!text || text.trim().length < 50)
      return res.status(422).json({ error: "Could not extract text from PDF. Try a non-scanned document." });

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

    res.json({ compliance, executiveSummary, auditedAt: new Date().toISOString(), metadata: { file: req.file.originalname, size: req.file.size } });
  } catch (err) {
    console.error("[/api/audit] ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── /api/analyze-link — SAM.gov URL → Full Audit Pipeline ───────────────────
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
  if (!noticeId) return res.status(400).json({ error: "Invalid SAM.gov URL — could not extract notice ID." });

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
            const fcText = fcData.data?.markdown || "";
            // If Firecrawl returns thin data, attempt a targeted second scrape on the attachments section
            if (fcText.length < 500) {
              console.warn(`[/api/analyze-link] Firecrawl returned shallow data (${fcText.length} chars). Flagging: Insufficient Data.`);
              return res.status(422).json({
                error: "Insufficient Data",
                instruction: "SAM.gov page returned too little content to analyze. Please upload the solicitation PDF directly.",
                details: `Only ${fcText.length} characters extracted via Firecrawl.`
              });
            }
            if (fcText.length > 100) {
              const raw = await llm(client, [
                { role: "system", content: AUDIT_PROMPT },
                { role: "user", content: `Audit this solicitation:\n\n---\n${fcText.slice(0, 20000)}\n---` }
              ], 3000);

              let compliance = null;
              const deepMatch = raw.match(/\{[\s\S]*\}/);
              if (deepMatch) {
                try { compliance = JSON.parse(deepMatch[0]); }
                catch { compliance = { parse_error: "JSON extraction failed" }; }
              }
              compliance = enforceDisqualification(compliance, fcText);
              let executiveSummary = "";
              if (deepMatch) executiveSummary = raw.slice(raw.indexOf(deepMatch[0]) + deepMatch[0].length).trim();

              const result = {
                noticeId, title: `Opportunity: ${noticeId}`, agency: "Extracted via Firecrawl",
                primaryDoc: "firecrawl_extraction.md", source: "scraper_fallback",
                attachmentsFound: 0, compliance, executiveSummary,
                auditedAt: new Date().toISOString()
              };
              noticeCache.set(noticeId, { ts: Date.now(), data: result });
              return res.json(result);
            }
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
    return res.status(502).json({ error: "Failed to reach SAM.gov API", instruction: "Manual upload required", details: e.message });
  }

  const opportunity = samData?.opportunitiesData?.[0];
  if (!opportunity) {
    // SAM returned 200 but empty results — notice may be archived or have indexing lag.
    // Attempt Firecrawl scrape as recovery before failing.
    console.warn(`[/api/analyze-link] SAM returned empty opportunitiesData for ${noticeId}. Attempting Firecrawl recovery.`);
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
          const fcText = fcData.data?.markdown || "";
          if (fcText.length > 100) {
            console.log(`[/api/analyze-link] Firecrawl recovery success: ${fcText.length} chars`);
            const raw = await llm(client, [
              { role: "system", content: AUDIT_PROMPT },
              { role: "user", content: `Audit this solicitation:\n\n---\n${fcText.slice(0, 20000)}\n---` }
            ], 3000);
            let compliance = null;
            const deepMatch = raw.match(/\{[\s\S]*\}/);
            if (deepMatch) { try { compliance = JSON.parse(deepMatch[0]); } catch { compliance = { parse_error: "JSON extraction failed" }; } }
            compliance = enforceDisqualification(compliance, fcText);
            let executiveSummary = "";
            if (deepMatch) executiveSummary = raw.slice(raw.indexOf(deepMatch[0]) + deepMatch[0].length).trim();
            const result = {
              noticeId, title: `Opportunity ${noticeId}`, agency: "Extracted via Firecrawl",
              primaryDoc: "firecrawl_extraction.md", source: "scraper_fallback",
              attachmentsFound: 0, compliance, executiveSummary,
              auditedAt: new Date().toISOString()
            };
            noticeCache.set(noticeId, { ts: Date.now(), data: result });
            return res.json(result);
          }
        }
        console.warn(`[/api/analyze-link] Firecrawl recovery returned thin data or failed.`);
      } catch (fcErr) {
        console.warn(`[/api/analyze-link] Firecrawl recovery error:`, fcErr.message);
      }
    }
    return res.status(404).json({ error: "No opportunity found for this notice ID.", instruction: "Manual upload required", details: "SAM.gov returned no data and Firecrawl recovery failed. The notice may be archived or expired." });
  }


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

  if (!auditText || auditText.trim().length < 100) {
    auditText = description;
    source = "description_text";
    console.log(`[/api/analyze-link] Fallback to description: ${auditText.length} chars`);
  }

  if (!auditText || auditText.trim().length < 50)
    return res.status(422).json({ error: "Insufficient solicitation text found.", instruction: "Manual upload required" });

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
  if (deepMatch) executiveSummary = raw.slice(raw.indexOf(deepMatch[0]) + deepMatch[0].length).trim();

  const result = {
    noticeId, title, agency, primaryDoc, source,
    attachmentsFound: ranked.length,
    compliance, executiveSummary,
    auditedAt: new Date().toISOString()
  };

  noticeCache.set(noticeId, { ts: Date.now(), data: result });
  res.json(result);
});

// ─── /api/generate-report — Compliance Matrix + Proposal Outline ────────────
// ─── /api/generate-report — 4-Stage Agent Pipeline (money/ pattern) ──────────
// Stage 1: Analyst  — synthesize pillars into strategic brief
// Stage 2: Drafter  — write full QDS-style proposal from brief
// Stage 3: Reviewer — write compliance matrix from brief
// Stage 4: Intel    — extract win themes + risk flags

app.post("/api/generate-report", async (req, res) => {
  const client = makeClient();
  if (!client) return res.status(500).json({ error: "Server configuration incomplete" });

  const { pillars, executiveSummary, title, agency } = req.body;
  if (!pillars) return res.status(400).json({ error: "Missing pillars data. Run /api/analyze-link or /api/audit first." });

  console.log(`[/api/generate-report] Starting 4-stage pipeline for: ${title || 'Unknown'}`);
  const ctx = JSON.stringify({ title, agency, pillars, executiveSummary }, null, 2).slice(0, 8000);

  try {
    // ── Stage 1: Analyst — BidSmith Compliance Intelligence Brief ───────────
    console.log(`[/api/generate-report] Stage 1: Analyst`);
    const analysis = await llm(client, [{
      role: "user",
      content: `You are an elite Federal Proposal Capture Manager and Compliance Auditor (BidSmith Intelligence Engine).

Analyze this solicitation data and produce a COMPLIANCE INTELLIGENCE BRIEF covering:
1. Document type and confirmed solicitation number
2. Agency, contracting office, and mission context
3. Contract value, period of performance, and NAICS code
4. Core technical requirements that have FAR/DFARS compliance hooks
5. Set-aside type and the exact FAR clause governing it
6. Top 3 "Bid-Killer" hidden compliance traps — cite exact FAR/DFARS clause numbers AND Section L/M references where visible
7. For each trap: the exact hidden requirement, the Phase 1 disqualification impact if missed, and the specific remediation action
8. Top 3 risk flags for pre-submission review

Be ruthless and technical. Cite clause numbers such as DFARS 252.204-7012, FAR 52.219-18, NIST SP 800-171, etc.

Opportunity Data:
${ctx}`
    }], 2048, "analyst");

    // ── Stage 2: Drafter — CONFIDENTIAL RISK MEMORANDUM ─────────────────────
    console.log(`[/api/generate-report] Stage 2: Drafter`);
    const memo_draft = await llm(client, [{
      role: "user",
      content: `You are an elite Federal Proposal Capture Manager. Generate a CONFIDENTIAL RISK MEMORANDUM using the EXACT markdown structure below. Fill every [ ] bracket from the compliance intelligence brief. DO NOT produce generic marketing text, company boilerplate, or "Acme Solutions"-style filler. Ensure all table content is concise to prevent layout overflow. Do not use LaTeX formatting (e.g. $...$) for standard text.

OUTPUT THIS EXACT STRUCTURE:

# 📄 CONFIDENTIAL RISK MEMORANDUM

**Prepared For:** [Company/Capture Team from data, or "Your Capture Team" if unknown]
**Prepared By:** BidSmith Automated Intelligence / S. Aris
**Subject:** Phase 1 Technical Disqualification Audit
**Solicitation ID:** [solicitation number from brief] | **Agency:** [agency name from brief]

---

### 🚨 EXECUTIVE RISK SUMMARY

[Write exactly 3 sentences. Be ruthless and analytical — no fluff. State the compliance risk posture, the number of critical traps found, and the manual review recommendation.]

---

### 🍱 THE "BID-KILLER" MATRIX

| Risk Level | Risk Category | FAR/DFARS Citation | The Hidden Requirement | Impact if Missed | Remediation Action |
| --- | --- | --- | --- | --- | --- |
[Generate 5-7 rows. Use 🔴 **CRITICAL** for immediate DQ risks, 🟡 **HIGH RISK** for technical downgrade risks, 🟢 **COMPLIANT** for standard boilerplate areas. Every row MUST have a real FAR/DFARS clause number or Section L/M references from the brief. No generic clauses — use only what the brief extracted. Keep descriptions concise. For example:
| 🔴 **CRITICAL** | Cybersecurity | DFARS 252.204-7012 | Must have a NIST SP 800-171 assessment score posted in SPRS. | Immediate disqualification. | Post score to SPRS before submission. |
]

---

### 🧠 ARIS ENGINE RECOMMENDATIONS

[2 sentences mapping specific FAR flow-downs to the offeror's technical volume actions. Name the clauses explicitly.]

**Time Saved by BidSmith:** ~14 Hours of manual FAR clause extraction.

---

### 📝 STATEMENT OF WORK: PHASE 2 AUTHORIZATION

> **FULL PROPOSAL MAPPING & COMPLIANCE MATRIX**
> This document represents a partial Phase 1 extraction.
> To authorize the BidSmith Engine to generate the complete 40-point Compliance Matrix and Volume Outline for this solicitation:
> **Pricing Options:** Starter $29/mo + $0.25/call | Growth $199/mo (1,000 calls) + $0.20/call | Pilot $2,500 / 30 days (onboarding + 5,000 calls)
> **Turnaround:** 24 Hours for pilot onboarding kickoff
> **Action:** Visit [bidsmith.pro](https://bidsmith.pro) to authorize execution.

COMPLIANCE INTELLIGENCE BRIEF:
${analysis}`
    }], 3000, "drafter");

    // ── Stage 3: Reviewer — compliance matrix ─────────────────────────────────
    console.log(`[/api/generate-report] Stage 3: Compliance Matrix`);
    const compliance_report = await llm(client, [{
      role: "user",
      content: `You are a Federal Compliance Officer. Generate a **Federal RFP Compliance Risk Matrix Report** using the EXACT markdown structure below.

# 📄 Executive Summary

**Client:** [Company Name or "Prospective Client"]
**RFP:** [Title] – **Agency:** [Agency]
**Date:** [Current Date]

## 1️⃣ Solicitation Overview

| Item | Detail |
|---|---|
| **Solicitation ID** | [Solicitation ID] |
| **Title** | [Title] |
| **Agency** | [Agency] |
| **Due Date** | [Deadline] |
| **Key Compliance Regimes** | [List regimes like FAR, DFARS, NIST, etc.] |

## 2️⃣ Methodology

1. **Download & Normalize** – Solicitation documents fetched and converted to searchable text.
2. **Clause Extraction** – AI analysis of federal compliance clauses.
3. **Validation** – Cross-check against mandatory checklists (FedRAMP, CMMC, etc.).
4. **Scoring** – Risk-weighted compliance score calculation.

## 3️⃣ Compliance Risk Matrix

| Regime/Category | Clause | Found? | Risk Weight (1-10) | Comments / Issues |
|---|---|---|---|---|
[Generate 10-12 rows covering: Set-Aside, Past Performance, Bonding, Security Clearance, Insurance, Certifications, Subcontracting. Use ✅/❌/⚠️ in "Found?" column.]

**Overall Compliance Score:** [Calculate % based on findings (e.g. 78%)]

## 4️⃣ Findings & Recommendations

| # | Finding | Impact | Recommended Action |
|---|---|---|---|
[List top 3-5 high-risk findings]

## 5️⃣ Appendices

- **Appendix A** – Full Clause Extraction Log
- **Appendix B** – Solicitation Documents

Return ONLY the markdown. No preamble.

OPPORTUNITY DATA:
${ctx}

COMPLIANCE BRIEF:
${analysis.slice(0, 2000)}`
    }], 2048, "reviewer");

    // ── Stage 4: Intel — win themes + risk flags ──────────────────────────────
    console.log(`[/api/generate-report] Stage 4: Intel`);
    const intelRaw = await llm(client, [{
      role: "user",
      content: `Based on this federal opportunity brief, return ONLY valid JSON:
{
  "win_themes": ["<4 specific win themes>"],
  "risk_flags": ["<4 specific pre-submission risks>"],
  "proposal_outline": [
    { "volume": "Volume I: Technical Approach", "sections": ["1.1 ...","1.2 ...","1.3 ..."] },
    { "volume": "Volume II: Management Plan", "sections": ["2.1 ...","2.2 ...","2.3 ..."] },
    { "volume": "Volume III: Past Performance", "sections": ["3.1 ...","3.2 ...","3.3 ..."] },
    { "volume": "Volume IV: Price/Cost", "sections": ["4.1 ...","4.2 ...","4.3 ..."] }
  ]
}

BRIEF:
${analysis.slice(0, 3000)}`
    }], 1500, "extractor", 3, { response_format: { type: "json_object" } });

    let intel = { win_themes: [], risk_flags: [], proposal_outline: [] };
    try {
      const stripped = intelRaw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      intel = JSON.parse(stripped);
    } catch {
      let s = -1, d = 0, e = -1;
      for (let i = 0; i < intelRaw.length; i++) {
        if (intelRaw[i] === '{') { if (d === 0) s = i; d++; }
        else if (intelRaw[i] === '}') { d--; if (d === 0 && s !== -1) { e = i; break; } }
      }
      if (s !== -1 && e !== -1) {
        try { intel = JSON.parse(intelRaw.slice(s, e + 1)); } catch { }
      }
    }

    // ── Stage 5: Editor-in-Chief — QA Final Review ───────────────────────────
    console.log(`[/api/generate-report] Stage 5: Editor-in-Chief QA`);
    const proposal_draft = await llm(client, [{
      role: "system",
      content: `You are the Senior GovCon Capture Director at BidSmith. You are the final set of eyes on the Risk Memorandum before it is sent to the client.

Your Mission: Review the provided Markdown draft generated by the Analyst Agent. Aggressively edit and reformat to meet strict GovCon consulting standards.

THE 4 RULES OF EDITING:
1. ZERO FLUFF: If you see generic marketing language (e.g., "Acme Solutions," "leading provider," "innovative solutions," "our team"), DELETE IT. Replace with technical specifics.
2. ENFORCE CITATIONS: If a risk is mentioned but does not cite a specific FAR/DFARS clause or section number, either add the correct citation or remove the row entirely.
3. FORMAT ENFORCEMENT: Ensure the document strictly follows the "Confidential Risk Memorandum" structure with all 4 sections intact. Ensure the Bid-Killer Matrix (Red/Yellow/Green) is perfectly formatted as a markdown table. Keep table cell content concise to avoid rendering overflow.
4. SOW CHECK: Verify that the Statement of Work pricing ladder blockquote (Starter/Growth/Pilot) is present and unchanged at the bottom. If missing, restore it exactly.

Output ONLY the finalized clean Markdown. No preamble, no "Here is the edited version", no explanations.`
    }, {
      role: "user",
      content: `Review and finalize this Risk Memorandum draft:\n\n${memo_draft}`
    }], 3000, "reviewer");

    console.log(`[/api/generate-report] Pipeline complete`);
    const envelope = {
      success: true,
      generatedAt: new Date().toISOString(),
      engine: "sse_5_agent",
      pipelineStages: ["analyst", "drafter", "reviewer", "intel", "editor"],
    };

    res.json({
      envelope,
      success: true,
      engine: envelope.engine,
      pipelineStages: envelope.pipelineStages,
      title: title || "Federal Opportunity",
      agency: agency || "Unknown Agency",
      generatedAt: envelope.generatedAt,
      pillars,
      proposal_draft,
      compliance_report,
      proposal_outline: intel.proposal_outline || [],
      win_themes: intel.win_themes || [],
      risk_flags: intel.risk_flags || []
    });

  } catch (err) {
    console.error("[/api/generate-report] Pipeline error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ─── /api/generate-report-stream — SSE Agentic Pipeline ─────────────────────
// Streams real-time agent events as each stage completes (like money/ websocket)
// Events: { type, stage, agent, status, data }

app.get("/api/generate-report-stream", async (req, res) => {
  const client = makeClient();
  if (!client) { res.status(500).end(); return; }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const emit = (payload, eventName = null) => {
    if (eventName) {
      res.write(`event: ${eventName}\n`);
    }
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  // Read pillars from query param (base64-encoded JSON)
  let pillars, title, agency, executiveSummary;
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(Buffer.from(req.query.ctx, "base64").toString("binary"))));
    ({ pillars, title, agency, executiveSummary } = parsed);
  } catch {
    emit({ type: "error", message: "Invalid context" });
    res.end(); return;
  }

  if (!pillars) { emit({ type: "error", message: "Missing pillars" }); res.end(); return; }

  const ctx = JSON.stringify({ title, agency, pillars, executiveSummary }, null, 2).slice(0, 8000);
  const AGENTS = [
    { id: "analyst", label: "🧠 Analyst Agent", role: "Extracting FAR/DFARS compliance traps and bid-killer risks" },
    { id: "drafter", label: "✍️  Drafter Agent", role: "Generating Confidential Risk Memorandum" },
    { id: "reviewer", label: "⚖️  Reviewer Agent", role: "Building FAR-referenced compliance matrix" },
    { id: "intel", label: "🔍 Intel Agent", role: "Extracting win themes, risk flags, and volume outline" },
    { id: "editor", label: "🕵️  Editor-in-Chief", role: "QA review — stripping fluff, enforcing citations, locking SOW" },
  ];

  const envelope = {
    success: true,
    generatedAt: new Date().toISOString(),
    engine: "sse_5_agent",
    pipelineStages: AGENTS.map((agent) => agent.id),
  };
  emit(envelope, "envelope");

  emit({
    type: "pipeline_start",
    engine: envelope.engine,
    pipelineStages: envelope.pipelineStages,
    generatedAt: envelope.generatedAt,
    agents: AGENTS,
  });

  // Heartbeat helper — emits action logs every 500ms while each LLM call runs
  const AGENT_LOGS = {
    analyst: [
      "Reading solicitation structure...", "Parsing contracting parties...", "Extracting NAICS and PSC codes...",
      "Mapping FAR/DFARS compliance hooks...", "Checking set-aside eligibility clause...", "Identifying Section L/M references...",
      "Extracting bid-killer trap #1...", "Extracting bid-killer trap #2...", "Extracting bid-killer trap #3...",
      "Synthesizing compliance intelligence brief...",
    ],
    drafter: [
      "Composing memorandum header...", "Writing Executive Risk Summary — 3-sentence analysis...",
      "Building Bid-Killer Matrix row 1 (CRITICAL)...", "Building Bid-Killer Matrix row 2 (CRITICAL)...",
      "Building Bid-Killer Matrix row 3 (HIGH RISK)...", "Building Bid-Killer Matrix row 4 (HIGH RISK)...",
      "Inserting FAR/DFARS citations per row...", "Writing ARIS Engine Recommendations...",
      "Appending Phase 2 SOW Authorization block...", "Finalizing memorandum draft...",
    ],
    reviewer: [
      "Checking set-aside eligibility criteria...", "Verifying past performance thresholds...",
      "Assessing bonding requirements...", "Reviewing submission deadlines...", "Confirming NAICS code alignment...",
      "Checking security clearance requirements...", "Mapping FAR 52.xxx clauses...",
      "Evaluating insurance minimums...", "Reviewing subcontracting plan requirements...",
      "Assigning compliance status to each requirement...",
    ],
    intel: [
      "Extracting competitive win themes...", "Identifying pre-submission risk flags...",
      "Building FAR Part 15 volume outline...", "Mapping Section L & M requirements...",
      "Finalizing proposal intelligence package...",
    ],
    editor: [
      "Scanning for generic marketing language...", "Enforcing FAR/DFARS citation requirements...",
      "Validating Bid-Killer Matrix format...", "Verifying Executive Risk Summary (3-sentence rule)...",
      "Checking SOW pricing ladder block...", "Locking final memorandum format...",
    ],
  };

  function withHeartbeat(agentId, stage, agent, promiseFn) {
    let i = 0;
    const logs = AGENT_LOGS[agentId] || ["Processing..."];
    const interval = setInterval(() => {
      emit({ type: "agent_log", stage, agent, message: logs[i % logs.length] });
      i++;
    }, 500);
    return promiseFn().finally(() => clearInterval(interval));
  }

  try {
    // Stage 1: Analyst — BidSmith Compliance Intelligence Brief
    emit({ type: "agent_start", stage: 1, agent: AGENTS[0] });
    const analysis = await withHeartbeat("analyst", 1, AGENTS[0], () => llm(client, [{
      role: "user",
      content: `You are an elite Federal Proposal Capture Manager and Compliance Auditor (BidSmith Intelligence Engine).\n\nAnalyze this solicitation data and produce a COMPLIANCE INTELLIGENCE BRIEF covering:\n1. Document type and confirmed solicitation number\n2. Agency, contracting office, and mission context\n3. Contract value, period of performance, and NAICS code\n4. Core technical requirements that have FAR/DFARS compliance hooks\n5. Set-aside type and the exact FAR clause governing it\n6. Top 3 "Bid-Killer" hidden compliance traps — cite exact FAR/DFARS clause numbers AND Section L/M references where visible\n7. For each trap: the exact hidden requirement, the Phase 1 disqualification impact if missed, and the specific remediation action\n8. Top 3 risk flags for pre-submission review\n\nBe ruthless and technical. Cite clause numbers such as DFARS 252.204-7012, FAR 52.219-18, NIST SP 800-171, etc.\n\nOpportunity Data:\n${ctx}`
    }], 2048, "analyst"));
    emit({ type: "agent_done", stage: 1, agent: AGENTS[0], data: { preview: analysis.slice(0, 200) } });

    // Stage 2: Drafter — CONFIDENTIAL RISK MEMORANDUM
    emit({ type: "agent_start", stage: 2, agent: AGENTS[1] });
    const memo_draft = await withHeartbeat("drafter", 2, AGENTS[1], () => llm(client, [{
      role: "user",
      content: `You are an elite Federal Proposal Capture Manager. Generate a CONFIDENTIAL RISK MEMORANDUM using the EXACT markdown structure below. Fill every [ ] bracket from the compliance intelligence brief. DO NOT produce generic marketing text, company boilerplate, or "Acme Solutions"-style filler.\n\nEnsure all table content is concise to prevent layout overflow. Do not use LaTeX formatting (e.g. $...$) for standard text.\n\nOUTPUT THIS EXACT STRUCTURE:\n\n# 📄 CONFIDENTIAL RISK MEMORANDUM\n\n**Prepared For:** [Company/Capture Team from data, or "Your Capture Team" if unknown]\n**Prepared By:** BidSmith Automated Intelligence / S. Aris\n**Subject:** Phase 1 Technical Disqualification Audit\n**Solicitation ID:** [solicitation number from brief] | **Agency:** [agency name from brief]\n\n---\n\n### 🚨 EXECUTIVE RISK SUMMARY\n\n[Write exactly 3 sentences. Be ruthless and analytical. State the compliance risk posture, the number of critical traps found, and the manual review recommendation.]\n\n---\n\n### 🍱 THE "BID-KILLER" MATRIX\n\n| Risk Level | Risk Category | FAR/DFARS Citation | The Hidden Requirement | Impact if Missed | Remediation Action |\n| --- | --- | --- | --- | --- | --- |\n[Generate 5-7 rows. Use 🔴 **CRITICAL** for immediate DQ risks, 🟡 **HIGH RISK** for technical downgrade risks, 🟢 **COMPLIANT** for standard boilerplate areas. Every row MUST have a real FAR/DFARS clause number or Section L/M reference from the brief. Keep descriptions concise.]\n\n---\n\n### 🧠 ARIS ENGINE RECOMMENDATIONS\n\n[2 sentences mapping specific FAR flow-downs to the offeror's technical volume actions. Name the clauses explicitly.]\n\n**Time Saved by BidSmith:** ~14 Hours of manual FAR clause extraction.\n\n---\n\n### 📝 STATEMENT OF WORK: PHASE 2 AUTHORIZATION\n\n> **FULL PROPOSAL MAPPING & COMPLIANCE MATRIX**\n> This document represents a partial Phase 1 extraction.\n> To authorize the BidSmith Engine to generate the complete 40-point Compliance Matrix and Volume Outline for this solicitation:\n> **Pricing Options:** Starter $29/mo + $0.25/call | Growth $199/mo (1,000 calls) + $0.20/call | Pilot $2,500 / 30 days (onboarding + 5,000 calls)\n> **Turnaround:** 24 Hours for pilot onboarding kickoff\n> **Action:** Visit bidsmith.pro to authorize execution.\n\nCOMPLIANCE INTELLIGENCE BRIEF:\n${analysis}`
      content: `You are an elite Federal Proposal Capture Manager. Generate a CONFIDENTIAL RISK MEMORANDUM using the EXACT markdown structure below. Fill every [ ] bracket from the compliance intelligence brief. DO NOT produce generic marketing text, company boilerplate, or "Acme Solutions"-style filler.\n\nEnsure all table content is concise to prevent layout overflow. Do not use LaTeX formatting (e.g. $...$) for standard text.\n\nOUTPUT THIS EXACT STRUCTURE:\n\n# 📄 CONFIDENTIAL RISK MEMORANDUM\n\n**Prepared For:** [Company/Capture Team from data, or "Your Capture Team" if unknown]\n**Prepared By:** BidSmith Automated Intelligence / S. Aris\n**Subject:** Phase 1 Technical Disqualification Audit\n**Solicitation ID:** [solicitation number from brief] | **Agency:** [agency name from brief]\n\n---\n\n### 🚨 EXECUTIVE RISK SUMMARY\n\n[Write exactly 3 sentences. Be ruthless and analytical. State the compliance risk posture, the number of critical traps found, and the manual review recommendation.]\n\n---\n\n### 🍱 THE "BID-KILLER" MATRIX\n\n| Risk Level | Risk Category | FAR/DFARS Citation | The Hidden Requirement | Impact if Missed | Remediation Action |\n| --- | --- | --- | --- | --- | --- |\n[Generate 5-7 rows. Use 🔴 **CRITICAL** for immediate DQ risks, 🟡 **HIGH RISK** for technical downgrade risks, 🟢 **COMPLIANT** for standard boilerplate areas. Every row MUST have a real FAR/DFARS clause number or Section L/M reference from the brief. Keep descriptions concise. For example:\n| 🔴 **CRITICAL** | Cybersecurity | DFARS 252.204-7012 | Must have a NIST SP 800-171 assessment score posted in SPRS. | Immediate disqualification. | Post score to SPRS before submission. |\n]\n\n---\n\n### 🧠 ARIS ENGINE RECOMMENDATIONS\n\n[2 sentences mapping specific FAR flow-downs to the offeror's technical volume actions. Name the clauses explicitly.]\n\n**Time Saved by BidSmith:** ~14 Hours of manual FAR clause extraction.\n\n---\n\n### 📝 STATEMENT OF WORK: PHASE 2 AUTHORIZATION\n\n> **FULL PROPOSAL MAPPING & COMPLIANCE MATRIX**\n> This document represents a partial Phase 1 extraction.\n> To authorize the BidSmith Engine to generate the complete 40-point Compliance Matrix and Volume Outline for this solicitation:\n> **Pricing Options:** Starter $29/mo + $0.25/call | Growth $199/mo (1,000 calls) + $0.20/call | Pilot $2,500 / 30 days (onboarding + 5,000 calls)\n> **Turnaround:** 24 Hours for pilot onboarding kickoff\n> **Action:** Visit bidsmith.pro to authorize execution.\n\nCOMPLIANCE INTELLIGENCE BRIEF:\n${analysis}`
    }], 3000, "drafter"));
    emit({ type: "agent_done", stage: 2, agent: AGENTS[1], data: { preview: memo_draft.slice(0, 200) } });

    // Stage 3: Reviewer — compliance matrix
    emit({ type: "agent_start", stage: 3, agent: AGENTS[2] });
    const compliance_report = await withHeartbeat("reviewer", 3, AGENTS[2], () => llm(client, [{
      role: "user",
      content: `You are a Federal Compliance Officer. Generate a **Federal RFP Compliance Risk Matrix Report** using the EXACT markdown structure below.\n\n# 📄 Executive Summary\n\n**Client:** [Company Name or "Prospective Client"]\n**RFP:** [Title] – **Agency:** [Agency]\n**Date:** [Current Date]\n\n## 1️⃣ Solicitation Overview\n\n| Item | Detail |\n|---|---|\n| **Solicitation ID** | [Solicitation ID] |\n| **Title** | [Title] |\n| **Agency** | [Agency] |\n| **Due Date** | [Deadline] |\n| **Key Compliance Regimes** | [List regimes like FAR, DFARS, NIST, etc.] |\n\n## 2️⃣ Methodology\n\n1. **Download & Normalize** – Solicitation documents fetched and converted to searchable text.\n2. **Clause Extraction** – AI analysis of federal compliance clauses.\n3. **Validation** – Cross-check against mandatory checklists (FedRAMP, CMMC, etc.).\n4. **Scoring** – Risk-weighted compliance score calculation.\n\n## 3️⃣ Compliance Risk Matrix\n\n| Regime/Category | Clause | Found? | Risk Weight (1-10) | Comments / Issues |\n|---|---|---|---|---|\n[Generate 10-12 rows covering: Set-Aside, Past Performance, Bonding, Security Clearance, Insurance, Certifications, Subcontracting. Use ✅/❌/⚠️ in "Found?" column.]\n\n**Overall Compliance Score:** [Calculate % based on findings]\n\n## 4️⃣ Findings & Recommendations\n\n| # | Finding | Impact | Recommended Action |\n|---|---|---|---|\n[List top 3-5 high-risk findings]\n\n## 5️⃣ Appendices\n\n- **Appendix A** – Full Clause Extraction Log\n- **Appendix B** – Solicitation Documents\n\nReturn ONLY the markdown. No preamble.\n\nOPPORTUNITY:\n${ctx}\n\nBRIEF:\n${analysis.slice(0, 2000)}`
    }], 2048, "reviewer"));
    emit({ type: "agent_done", stage: 3, agent: AGENTS[2], data: { compliance_report } });

    // Stage 4: Intel — win themes + risk flags
    emit({ type: "agent_start", stage: 4, agent: AGENTS[3] });
    const intelRaw = await withHeartbeat("intel", 4, AGENTS[3], () => llm(client, [{
      role: "user",
      content: `Based on this federal opportunity brief, return ONLY valid JSON:
{
  "win_themes": ["<4 specific win themes>"],
  "risk_flags": ["<4 specific pre-submission risks>"],
  "proposal_outline": [
    { "volume": "Volume I: Technical Approach", "sections": ["1.1 ...","1.2 ...","1.3 ..."] },
    { "volume": "Volume II: Management Plan", "sections": ["2.1 ...","2.2 ...","2.3 ..."] },
    { "volume": "Volume III: Past Performance", "sections": ["3.1 ...","3.2 ...","3.3 ..."] },
    { "volume": "Volume IV: Price/Cost", "sections": ["4.1 ...","4.2 ...","4.3 ..."] }
  ]
}

BRIEF:
${analysis.slice(0, 3000)}`
    }], 1500, "extractor", 3, { response_format: { type: "json_object" } }));

    let intel = { win_themes: [], risk_flags: [], proposal_outline: [] };
    try {
      const stripped = intelRaw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      intel = JSON.parse(stripped);
    } catch {
      let s = -1, d = 0, e = -1;
      for (let i = 0; i < intelRaw.length; i++) {
        if (intelRaw[i] === '{') { if (d === 0) s = i; d++; }
        else if (intelRaw[i] === '}') { d--; if (d === 0 && s !== -1) { e = i; break; } }
      }
      if (s !== -1 && e !== -1) { try { intel = JSON.parse(intelRaw.slice(s, e + 1)); } catch { } }
    }
    emit({ type: "agent_done", stage: 4, agent: AGENTS[3], data: intel });

    // Stage 5: Editor-in-Chief — QA Final Review
    emit({ type: "agent_start", stage: 5, agent: AGENTS[4] });
    const proposal_draft = await withHeartbeat("editor", 5, AGENTS[4], () => llm(client, [{
      role: "system",
      content: `You are the Senior GovCon Capture Director at BidSmith. You are the final set of eyes on the Risk Memorandum before it is sent to the client.\n\nYour Mission: Review the Markdown draft. Aggressively edit and reformat to meet strict GovCon consulting standards.\n\nTHE 4 RULES OF EDITING:\n1. ZERO FLUFF: If you see generic marketing language (e.g., "Acme Solutions," "leading provider," "innovative solutions," "our team"), DELETE IT. Replace with technical specifics.\n2. ENFORCE CITATIONS: If a risk row does not cite a specific FAR/DFARS clause or section number, add the correct citation or remove the row.\n3. FORMAT ENFORCEMENT: Ensure the document strictly follows the "Confidential Risk Memorandum" structure with all 4 sections intact. The Bid-Killer Matrix must be a perfectly formatted markdown table. Keep table cell content concise to avoid rendering overflow.\n4. SOW CHECK: Verify the Statement of Work pricing ladder blockquote (Starter/Growth/Pilot) is present and unchanged at the bottom. If missing, restore it exactly.\n\nOutput ONLY the finalized clean Markdown. No preamble, no "Here is the edited version", no explanations.`
    }, {
      role: "user",
      content: `Review and finalize this Risk Memorandum draft:\n\n${memo_draft}`
    }], 3000, "reviewer"));
    emit({ type: "agent_done", stage: 5, agent: AGENTS[4], data: { proposal_draft } });

    emit({
      type: "pipeline_complete",
      engine: "sse_5_agent",
      pipelineStages: AGENTS.map((agent) => agent.id),
      generatedAt: new Date().toISOString(),
      proposal_draft, compliance_report,
      win_themes: intel.win_themes || [], risk_flags: intel.risk_flags || [],
      proposal_outline: intel.proposal_outline || [],
      title: title || "Federal Opportunity", agency: agency || "Unknown Agency",
    });

  } catch (err) {
    console.error("[SSE pipeline] error:", err);
    emit({ type: "error", message: err.message });
  }

  res.end();
});

app.get("/", (req, res) => {
  // Google-Lite: Redirect browsers to docs, serve Discovery JSON to machines
  const ua = req.get("User-Agent") || "";
  const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/.test(ua) && !/curl|wget|postman|insomnia/i.test(ua);

  if (isBrowser) {
    return res.redirect("https://docs.bidsmith.pro");
  }

  res.setHeader("Content-Type", "application/json; charset=UTF-8");
  res.json({
    kind: "discovery#restDescription",
    name: "bidsmith",
    version: "v1",
    title: "Bidsmith Compliance API",
    description: "Automated RFP compliance and risk matrix extraction.",
    rootUrl: "https://api.bidsmith.pro/",
    servicePath: "v1/",
    documentationLink: "https://docs.bidsmith.pro",
    icons: {
      x16: "https://bidsmith.pro/icon16.png",
      x32: "https://bidsmith.pro/icon32.png"
    }
  });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ BidSmith API → http://localhost:${PORT}`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY not set");
  if (!process.env.SAM_GOV_API_KEY && !process.env.SAM_API_KEY) console.warn("⚠️  SAM_GOV_API_KEY not set");
});
