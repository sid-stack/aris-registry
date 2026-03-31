// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-26T21:20:00Z
import "dotenv/config";

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./utils/asyncHandler.js";

// Stateless Utils & Infrastructure
import { traceLLM } from "./utils/tracing.js";
import { callLLM } from "./llm/openrouter.js";

// Services
import { createCheckoutSession, createDynamicCheckoutSession } from "./services/stripe.js";
import { recordAnalyticsEvent, getAdminStats } from "./services/analytics.js";
import { invokeAuditSwarm } from "./agents/coordinator.js";
import { fetchSolicitationText, parseNoticeId } from "./services/samGov.js";
import { runAudit } from "./agents/auditPipeline.js";
import { sovereignSearch } from "./services/fedSearch.js";

import multer from "multer";
import pdfParse from "pdf-parse";

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
// ─── /api/analyze-pdf ────────────────────────────────────────────────────────
app.post("/api/analyze-pdf", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const data = await pdfParse(req.file.buffer);
  const rfpText = data.text?.trim();

  if (!rfpText || rfpText.length < 100) {
    return res.status(422).json({ error: "Could not extract readable text from this PDF." });
  }

  console.log(`[PDF_AUDIT] ${req.file.originalname} — ${rfpText.length} chars`);

  const result = await runAudit(rfpText, {
    id: req.file.originalname.replace(/\.pdf$/i, ""),
    title: req.file.originalname,
    agency: "Extracted from PDF",
    value: "0",
  });

  res.json(result);
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
  if (!SAM_API_KEY) return; // Nothing to harvest without credentials
  const pulse = async () => {
    try {
      const now = Date.now();
      if (now - lastHarvestTime < 10 * 60 * 1000) return;
      for (const seed of DISCOVERY_SEEDS) {
        try {
          const res = await fetch(
            `https://api.sam.gov/opportunities/v2/search?q=${encodeURIComponent(seed)}&limit=30&api_key=${SAM_API_KEY}`,
            { signal: AbortSignal.timeout(15_000) }
          );
          if (res.ok) {
            const data = await res.json();
            const opportunities = data?.opportunitiesData || [];
            if (opportunities.length > 0) await sovereignSearch.syncSovereignTable(opportunities, "US");
          }
        } catch (err) { console.warn(`[HARVESTER] SAM failed for "${seed}":`, err.message); }
        await new Promise(r => setTimeout(r, 15000));
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
  const response = await callLLM(
    "You are a senior federal compliance auditor. Extract a compliance matrix as a JSON array. Each item: { id, requirement, source, status, strategy }. Return STRICT JSON only.",
    `Analyze this RFP and extract the compliance matrix: ${rfpText?.substring(0, 15000)}`
  );
  try { res.json(JSON.parse(response)); } catch { res.json({ raw: response }); }
}));

app.post("/api/govcon/draft-proposal", asyncHandler(async (req, res) => {
  const { rfpText, companyInfo } = req.body;
  const draft = await callLLM(
    "You are a senior proposal writer for top-tier defense contractors.",
    `Draft an Executive Summary. Company: ${companyInfo}. RFP: ${rfpText?.substring(0, 10000)}`
  );
  res.json({ draft });
}));

app.post("/api/govcon/chat", asyncHandler(async (req, res) => {
  const { messages, context } = req.body;
  const userMessage = messages[messages.length - 1].content || messages[messages.length - 1].text;
  const text = await callLLM(
    `You are GovCon AI, a specialized federal contracting assistant. RFP context: ${context?.substring(0, 5000)}`,
    userMessage
  );
  res.json({ text, response: text });
}));

// ─── /api/admin/stats ────────────────────────────────────────────────────────
app.get("/api/admin/stats", asyncHandler(async (req, res) => {
  const stats = await getAdminStats();
  res.json(stats);
}));

// ─── /api/analyze-link ───────────────────────────────────────────────────────
app.post("/api/analyze-link", apiLimiter, asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const normalized = url.toLowerCase().trim();
  let solicitationText = "";
  let meta = { id: "LINK_AUDIT", title: "Federal Solicitation", agency: "Federal Agency", value: "0" };

  if (normalized.includes("sam.gov")) {
    // Direct SAM.gov fetch — no MCP subprocess
    const { text, meta: samMeta } = await fetchSolicitationText(url);
    solicitationText = text;
    meta = samMeta;

    if (!solicitationText) {
      return res.status(422).json({
        error: "SAM.gov did not return solicitation text for this opportunity.",
        message: "Download the solicitation PDF from SAM.gov and upload it for a full audit.",
        canRetryWithUpload: true,
      });
    }
  } else if (normalized.endsWith(".pdf")) {
    const pdfRes = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!pdfRes.ok) return res.status(502).json({ error: `PDF download failed: HTTP ${pdfRes.status}` });
    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    solicitationText = pdfData.text?.trim();
    meta = { id: "PDF_LINK", title: url.split("/").pop(), agency: "Unknown", value: "0" };
  } else {
    return res.status(400).json({ error: "Unsupported URL. Provide a SAM.gov link or direct PDF URL." });
  }

  if (!solicitationText || solicitationText.length < 50) {
    return res.status(422).json({ error: "Could not extract usable text from the provided URL." });
  }

  console.log(`[LINK_AUDIT] ${meta.id} — ${solicitationText.length} chars`);
  const result = await runAudit(solicitationText, meta);
  res.json(result);
}));

// ─── /api/create-dynamic-checkout-session ────────────────────────────────────
app.post("/api/create-dynamic-checkout-session", apiLimiter, asyncHandler(async (req, res) => {
  const { estimatedValue, opportunityTitle } = req.body;
  const origin = req.headers.origin || `https://${req.headers.host}` || "https://bidsmith.pro";
  const session = await createDynamicCheckoutSession({ estimatedValue, opportunityTitle, origin });
  res.json({ url: session.url, sessionId: session.id });
}));

// ─── /api/export-rtm ─────────────────────────────────────────────────────────
app.post("/api/export-rtm", asyncHandler(async (req, res) => {
  const { complianceData } = req.body;
  if (!complianceData || !Array.isArray(complianceData)) {
    return res.status(400).json({ error: "complianceData array required" });
  }
  const rows = [
    ["Category", "Verdict", "Risk Score", "Description", "Section Reference", "Status"],
    ...complianceData.map(r => [
      r.category || "",
      r.verdict || "",
      r.risk || "",
      (r.description || "").replace(/,/g, ";"),
      r.sectionRef || "",
      "Not reviewed",
    ]),
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=BidSmith_Compliance_Matrix.csv");
  res.send(csv);
}));

// ─── /api/generate-report-stream ─────────────────────────────────────────────
app.get("/api/generate-report-stream", asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const ctxRaw = req.query.ctx;
    if (!ctxRaw) { send("error", { message: "Missing ctx" }); return res.end(); }

    const ctx = JSON.parse(decodeURIComponent(Buffer.from(decodeURIComponent(ctxRaw), "base64").toString("utf8")));
    const { pillars = [], title = "", agency = "", executiveSummary = "" } = ctx;

    const complianceSummary = Array.isArray(pillars)
      ? pillars.map(p => `- ${p.category || "Requirement"}: ${p.description || ""} (Risk: ${p.risk || "?"})`).join("\n")
      : JSON.stringify(pillars);

    const prompt = `You are an ARIS federal compliance specialist. Generate a concise remediation action plan in Markdown for this solicitation:

Title: ${title}
Agency: ${agency}
Executive Summary: ${executiveSummary}

Compliance Requirements:
${complianceSummary}

Write a prioritized P0/P1 remediation script with:
1. Executive Verdict (1-2 sentences)
2. Top 3 Disqualification Risks & Mitigation
3. Proposal Win Themes
4. Recommended Next Steps

Keep it under 600 words. Use markdown headers and bullets.`;

    const proposalDraft = await traceLLM(undefined, {
      model: "google/gemini-2.0-flash",
      messages: [
        { role: "system", content: "You are a senior federal proposal strategist." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    }, "report_stream_generation");

    send("agent_done", { data: { proposal_draft: proposalDraft } });
    send("pipeline_complete", {});
  } catch (err) {
    send("error", { message: err.message });
  }
  res.end();
}));

// ─── Contact Form ────────────────────────────────────────────────────────────
app.post("/api/contact", asyncHandler(async (req, res) => {
  const { name, email, service, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"ARIS Contact" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_TO || "sid@bidsmith.pro",
    replyTo: email,
    subject: `New Contact: ${name} — ${service || "General Inquiry"}`,
    text: `Name: ${name}\nEmail: ${email}\nService: ${service || "N/A"}\n\n${message}`,
  });

  res.json({ ok: true });
}));

app.get("*", (req, res) => res.sendFile(join(__dirname, "../dist/index.html")));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ ARIS Protocol v2.2 -> http://localhost:${PORT}`));
