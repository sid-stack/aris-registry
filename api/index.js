import express from "express";
import cors from "cors";
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
import { samClient, auditClient, callMcpTool } from "./services/mcpClient.js";
import { createCheckoutSession } from "./services/stripe.js";
import { recordAnalyticsEvent, renderAnalyticsDashboard, recordBetaSignup } from "./services/analytics.js";
import { AUDIT_PROMPT } from "./src/prompts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173", 
    /\.vercel\.app$/, // Allow all Vercel deployments
    process.env.STAGING_URL || "https://aris-protocol.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use(requestId);

// ─── Procurement & Audit Pipelines (Modularized) ──────────────────────────────

app.post("/api/analyze-link", asyncHandler(async (req, res) => {
  const { url } = req.body;
  const clientIP = req.ip || "unknown";

  // 1. Stateless Usage Guard
  const { count } = await incrMonthlyUsage(clientIP);
  if (count > 3) {
    return res.status(429).json({
      error: "LIMIT_EXCEEDED",
      message: "You've used your 3 free reports this month. Upgrade to continue.",
      paymentRequired: true
    });
  }

  // 2. Data Acquisition (MCP)
  const samData = await callMcpTool(samClient, "get_opportunity", { url });
  
  // 3. Agentic Reasoning (Traceable)
  const rawAudit = await traceLLM(null, {
    model: "claude-3-5-sonnet",
    messages: [
      { role: "system", content: AUDIT_PROMPT },
      { role: "user", content: `Audit this solicitation:\n\n${samData.description}` }
    ]
  }, "mercury_2_engine");

  // 4. Learning Layer (Institutional Distillation - BACKGROUND)
  (async () => {
    try {
      const { auditClient, callMcpTool } = await import("./services/mcpClient.js");
      const { persistLogicPattern } = await import("./services/analytics.js");
      
      const patternData = await callMcpTool(auditClient, "distill_logic", { 
        auditResult: JSON.parse(rawAudit), 
        text: samData.description 
      });
      
      const pattern = JSON.parse(patternData.content[0].text);
      await persistLogicPattern(pattern);
      console.log("[LEARNING_LAYER] Sovereign pattern distilled and persisted.");
    } catch (err) {
      console.error("[LEARNING_LAYER] Background distillation failed:", err.message);
    }
  })();

  // 5. Generate Win-Themes & Executive Brief (Phase 2 Upgrade)
  const { generateWinThemes } = await import("./services/winThemes.js");
  const { generateExecutiveBrief } = await import("./services/generateExecutiveBrief.js");
  
  const winThemes = await generateWinThemes(JSON.parse(rawAudit), []); 
  const executiveBrief = generateExecutiveBrief(JSON.parse(rawAudit), winThemes);

  // 6. Record Zero-Knowledge Analytics
  await recordAnalyticsEvent({ eventType: "audit_complete", uid: clientIP });

  res.json({
    success: true,
    data: JSON.parse(rawAudit),
    winThemes,
    executiveBrief,
    sanitized: sanitizeMarkdown(rawAudit),
    requestId: req.id,
    version: "v2.1-sovereign"
  });
}));

// ─── Traditional Services (Extracted) ────────────────────────────────────────

app.post("/api/checkout/session", asyncHandler(async (req, res) => {
  const { plan, premiumTier, context } = req.body;
  const origin = req.get("origin") || "https://www.bidsmith.pro";
  const url = await createCheckoutSession(plan, premiumTier, context, origin);
  res.json({ url });
}));

app.get("/analytics", asyncHandler(async (req, res) => {
  // logic moved to analytics.js
  const dashboard = renderAnalyticsDashboard({}); 
  res.send(dashboard);
}));

app.post("/api/beta-signup", asyncHandler(async (req, res) => {
  const { email, metadata } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  
  const success = await recordBetaSignup(email, { 
    ...metadata, 
    ip: req.ip, 
    source: "sovereign_beta_page" 
  });
  
  res.json({ success });
}));

// ─── Health & Legacy ─────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  const ua = req.get("User-Agent") || "";
  const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/.test(ua) && !/curl|wget|postman|insomnia/i.test(ua);
  if (isBrowser) return res.redirect("https://docs.bidsmith.pro");

  res.json({
    kind: "discovery#restDescription",
    name: "bidsmith",
    version: "v2.1",
    title: "Sovereign ARIS Protocol",
    description: "Modular GovCon intelligence engine with Institutional Memory."
  });
});

app.post("/api/pulse-check", asyncHandler(async (req, res) => {
  const { handlePulseCheck } = await import("./services/legacy.js");
  const result = await handlePulseCheck(req.body.uei);
  res.json({ success: true, result });
}));

app.post("/api/sam-scrape", asyncHandler(async (req, res) => {
  const { handleSamScrape } = await import("./services/legacy.js");
  const result = handleSamScrape(req.body.query, req.body.filter);
  res.json({ success: true, ...result });
}));

app.post("/api/export-rtm", asyncHandler(async (req, res) => {
  const { handleExportRtm } = await import("./services/legacy.js");
  await handleExportRtm(req.body.complianceData, res);
}));

app.post("/api/compare-amendments", asyncHandler(async (req, res) => {
  const { handleCompareAmendments } = await import("./services/legacy.js");
  const delta = await handleCompareAmendments(req.body.baseText, req.body.newText);
  res.json({ delta, generatedAt: new Date().toISOString() });
}));

app.get("/api/health", (req, res) => res.json({ status: "ok", protocol: "mercury-2.1-modular" }));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ ARIS Protocol v2.1 -> http://localhost:${PORT}`));
