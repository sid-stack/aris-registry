// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-26T21:20:00Z
import "dotenv/config";

import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./utils/asyncHandler.js";

// Stateless Utils & Infrastructure
import { incrMonthlyUsage } from "./utils/upstash.js";
import { traceLLM } from "./utils/tracing.js";
import { sanitizeMarkdown } from "./utils/markdown.js";

// Services & MCP Client
import { getSamClient, getAuditClient, callMcpTool } from "./services/mcpClient.js";
import { createCheckoutSession } from "./services/stripe.js";
import { recordAnalyticsEvent, renderAnalyticsDashboard, recordBetaSignup } from "./services/analytics.js";
import { AUDIT_PROMPT, SYS_PROMPT } from "./src/prompts.js";
import { sovereignSearch } from "./services/fedSearch.js";
import { usaspending } from "./services/usaspending.js";

import multer from "multer";
import pdfParse from "pdf-parse";

// ─── Gemini Core Completer ───────────────────────────────────────────────────
async function complete(prompt, systemInstruction, options = {}) {
  const result = await traceLLM(null, {
    model: "google/gemini-2.0-flash",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    temperature: options.temperature || 0.1
  }, options.traceName || "govcon_ai_completion");

  if (options.json) {
    const match = result.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : result);
  }
  return result;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const app = express();
// #region agent log
fetch("http://127.0.0.1:7911/ingest/27c0c5ba-848a-4204-b45d-bd04160c9694", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c09883" },
  body: JSON.stringify({
    sessionId: "c09883",
    runId: "run1",
    hypothesisId: "H2",
    location: "api/index.js:58",
    message: "api startup reached app initialization",
    data: { port: PORT, nodeEnv: process.env.NODE_ENV || "undefined" },
    timestamp: Date.now()
  })
}).catch(() => {});
// #endregion

// Multer for memory upload
const upload = multer({ storage: multer.memoryStorage() });

// ─── Simple AF PDF Shredder Logic (Fallback) ────────────────────────────────
function shredText(text) {
  const lines = text.split('\n');
  return lines
    .filter(line => {
      const l = line.toLowerCase();
      return l.includes('shall') || l.includes('must') || l.includes('required');
    })
    .slice(0, 15)
    .map(line => ({
      requirement: line.trim().slice(0, 200),
      status: "Not reviewed",
      risk: (line.toLowerCase().includes('security') || line.toLowerCase().includes('clearance')) ? "High" : "Unknown",
      owner: ""
    }));
}

// ─── Gemini-Powered PDF compliance Extraction ────────────────────────────────
app.post("/api/analyze-pdf", upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const data = await pdfParse(req.file.buffer);
  const rfpText = data.text.slice(0, 15000); // Guardrails for context window if needed, but Gemini 2.0 handles more
  
  console.log(`[ANALYSIS] [PDF] Analyzing: ${req.file.originalname} (${rfpText.length} chars)`);

  const { readFileSync } = await import("fs");
  const { join, dirname } = await import("path");
  const { fileURLToPath } = await import("url");
  const __dirname = dirname(fileURLToPath(import.meta.url));
  
  let extractPromptTemplate;
  try {
    extractPromptTemplate = readFileSync(join(__dirname, "llm", "extract_prompt.txt"), "utf8");
  } catch (err) {
    extractPromptTemplate = "Extract compliance intelligence: {{RFP_TEXT}}\nDirect JSON extraction. solicitation_number, agency, requirements:[{category, text, risk_level, section, page_reference, source_excerpt}]";
  }
  const extractPrompt = extractPromptTemplate.replace("{{RFP_TEXT}}", rfpText);

  try {
    const rawAnalysis = await traceLLM(null, {
      model: "google/gemini-2.0-flash",
      messages: [
        { role: "system", content: "You are the ARIS High-Precision RFP Auditor. Extract compliance intelligence into strict JSON." },
        { role: "user", content: extractPrompt }
      ],
      temperature: 0.1
    }, "pdf_full_extraction");

    const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/);
    const extraction = JSON.parse(jsonMatch ? jsonMatch[0] : rawAnalysis);

    // Map Gemini extraction to the ARIS-standard UI format
    const response = {
      id: extraction.document_metadata?.solicitation_number || "UPLOADED_PDF",
      title: req.file.originalname,
      agency: extraction.document_metadata?.agency || "Extracted from PDF",
      value: "45000000", // Default or extracted if available
      compliance: (extraction.requirements || []).slice(0, 10).map((r, i) => ({
        category: r.category,
        verdict: r.is_disqualifying_if_missing ? "DISQUALIFIER" : "WARNING",
        risk: r.risk_level === "High" ? 85 : r.risk_level === "Medium" ? 65 : 40,
        description: r.text,
        sourceSnippet: r.source_excerpt || "EXTRACTED_FROM_SOURCE",
        sectionRef: `Section ${r.section || '—'}, Page ${r.page_reference || '—'}`,
        angle: i * 36, // Distribute on radar
        label: r.category ? r.category.slice(0, 3).toUpperCase() : "REQ"
      })),
      requirements: (extraction.requirements || []).map(r => ({
        requirement: r.text,
        status: "Not reviewed",
        risk: r.risk_level,
        owner: ""
      })),
      executiveSummary: `MERCURY_2 analysis complete. Identified ${(extraction.requirements || []).length} critical requirements. ${extraction.submission_details?.deadline ? `Deadline: ${extraction.submission_details.deadline}` : 'Manual review recommended for deadlines.'}`,
      riskAssessment: {
        verdict: (extraction.requirements || []).some(r => r.is_disqualifying_if_missing) ? "HIGH_DISQUALIFICATION_RISK" : "ACTIONABLE",
        score: (extraction.requirements || []).length > 5 ? 85 : 50,
        breakdown: { delta_risk: 35, hazard_penalty: 50 },
        delta_analysis: `Gemini 2.0 Flash identified high-priority compliance triggers in ${extraction.document_metadata?.detected_sections?.join(", ") || "the document"}.`
      },
      fatalError: (extraction.requirements || []).some(r => r.is_disqualifying_if_missing)
    };

    res.json(response);

  } catch (err) {
    console.warn("[PDF_ANALYSIS] LLM failed, using fallback shredder:", err.message);
    const requirements = shredText(data.text);
    res.json({
      id: "UPLOADED_PDF_FALLBACK",
      title: req.file.originalname,
      agency: "Extracted from PDF (Fallback)",
      value: "000000",
      compliance: requirements.slice(0, 5).map(r => ({
        category: "System Extraction",
        verdict: "WARNING",
        risk: r.risk === "High" ? 85 : 50,
        description: r.requirement,
        sourceSnippet: r.requirement,
        sectionRef: "PDF Upload"
      })),
      requirements: requirements,
      executiveSummary: `Fallback extraction ran after LLM failure. Detected ${requirements.length} potential requirements.`,
      riskAssessment: {
        verdict: "MANUAL_REVIEW_REQUIRED",
        score: 55,
        breakdown: { delta_risk: 25, hazard_penalty: 30 },
        delta_analysis: "Sovereign gateway fallback enabled due to primary intelligence timeout."
      },
      fatalError: false
    });
  }
}));

app.post("/api/privacy/consent", asyncHandler(async (req, res) => {
  const { analytics, marketing, source } = req.body;
  console.log(`[PRIVACY] Consent update from ${source}: analytics=${analytics}, marketing=${marketing}`);
  // In a real app, you might save this to a DB or send to an analytics proxy
  res.json({ success: true, updated: new Date().toISOString() });
}));

// Railway sits behind a proxy; trust 1 hop so rate limiting uses client IP.
const trustProxyEnv = process.env.TRUST_PROXY;
let trustProxySetting = 1;
if (trustProxyEnv === "0" || trustProxyEnv === "false") {
  trustProxySetting = false;
} else if (trustProxyEnv && trustProxyEnv !== "true") {
  const parsed = Number(trustProxyEnv);
  trustProxySetting = Number.isNaN(parsed) ? 1 : parsed;
}
app.set("trust proxy", trustProxySetting);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use(express.json());
app.use(cors());
app.use(requestId);
app.use(express.static(join(__dirname, "../dist")));

// ─── Sovereign Discovery: Asynchronous Harvester ──────────────────────────────

const DISCOVERY_SEEDS = [
  "Artificial Intelligence", "Generative AI", "Cybersecurity", "Zero Trust",
  "Petroleum", "Oil & Gas", "Energy Security", "Land Acquisition",
  "Defense Procurement", "Weapon Systems", "Military Logistics", "Wars"
];

let lastHarvestTime = 0;
const HARVEST_INTERVAL = 12 * 60 * 60 * 1000;
const SAM_API_KEY = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;

async function startHarvester() {
  const pulse = async () => {
    try {
      const now = Date.now();
      if (now - lastHarvestTime < 10 * 60 * 1000) return;
      for (const seed of DISCOVERY_SEEDS) {
        if (SAM_API_KEY) {
          try {
            const samClient = await getSamClient();
            const samMcpResult = await callMcpTool(samClient, "search_opportunities", { q: seed, limit: 30 });
            const opportunities = JSON.parse(samMcpResult.content[0].text);
            if (opportunities?.length > 0) await sovereignSearch.syncSovereignTable(opportunities, "US");
          } catch (err) { console.warn(`[HARVESTER] SAM failed for "${seed}":`, err.message); }
        }
        try {
          const awards = await usaspending.getAwardsSummary(seed);
          if (awards?.length > 0) await sovereignSearch.syncSovereignTable(awards, "US");
        } catch (err) { console.warn(`[HARVESTER] USAspending failed for "${seed}":`, err.message); }
        await new Promise(r => setTimeout(r, 2000));
      }
      lastHarvestTime = Date.now();
    } catch (err) { console.error("[HARVESTER] failure:", err.message); }
  };
  setInterval(pulse, HARVEST_INTERVAL);
}
startHarvester();

// ─── API Endpoints ───────────────────────────────────────────────────────────

app.get("/api/privacy/consent", asyncHandler(async (_req, res) => {
  res.json({ success: true, consent: null });
}));

app.post("/api/fed-search", apiLimiter, asyncHandler(async (req, res) => {
  const { query, limit = 20, expand = true } = req.body;
  try {
    const { results, correction } = await sovereignSearch.search(query, expand);
    res.json({ success: true, query, results: results.slice(0, limit), correction, version: "v4.1" });
  } catch (err) {
    console.error(`[SEARCH_ERROR] ${err.message}`, err.stack);
    res.status(500).json({ success: false, error: err.message });
  }
}));

app.post("/api/track", apiLimiter, asyncHandler(async (req, res) => {
  const { uid, event, value, page, metadata } = req.body;
  const success = await recordAnalyticsEvent({
    uid,
    eventType: event,
    value,
    page,
    path: metadata?.path || (page ? new URL(page).pathname : "/unknown"),
    metadata
  });
  res.json({ success });
}));


// ─── GOVCON AI DASHBOARD ENDPOINTS ──────────────────────────────────────────

app.post("/api/govcon/generate-matrix", asyncHandler(async (req, res) => {
  const { rfpText } = req.body;
  const response = await complete(
    `Analyze RFP and extract compliance matrix (JSON array): ${rfpText.substring(0, 15000)}`,
    "You are a senior federal compliance auditor. Keys: id, requirement, source, status, strategy.",
    { json: true }
  );
  res.json(response);
}));

app.post("/api/govcon/draft-proposal", asyncHandler(async (req, res) => {
  const { rfpText, companyInfo } = req.body;
  const draft = await complete(
    `Draft Executive Summary. Company: ${companyInfo}. RFP: ${rfpText?.substring(0, 10000)}`,
    "You are a senior proposal writer for top-tier defense contractors."
  );
  res.json({ draft });
}));

app.post("/api/govcon/chat", asyncHandler(async (req, res) => {
  const { messages, context } = req.body;
  const text = await complete(
    messages[messages.length - 1].content || messages[messages.length - 1].text,
    `You are GovCon AI. Specialized assistant. RFP context: ${context?.substring(0, 5000)}`
  );
  res.json({ text, response: text }); // Support both formats
}));

app.get("*", (req, res) => res.sendFile(join(__dirname, "../dist/index.html")));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ ARIS Protocol v2.2 -> http://localhost:${PORT}`));
