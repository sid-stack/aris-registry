// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-20T00:46:21Z
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
import { getSamClient, getAuditClient, callMcpTool } from "./services/mcpClient.js";
import { createCheckoutSession } from "./services/stripe.js";
import { recordAnalyticsEvent, renderAnalyticsDashboard, recordBetaSignup } from "./services/analytics.js";
import { AUDIT_PROMPT, SYS_PROMPT } from "./src/prompts.js";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Initialize LLM Client (OpenRouter by default)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
  defaultHeaders: {
    "HTTP-Referer": "https://bidsmith.pro",
    "X-Title": "ARIS Sovereign v2.1",
  }
});

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

// Global Request Logger (Sovereign Observability)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// ─── Analytics & Tracking ───────────────────────────────────────────────────

app.post("/api/track", asyncHandler(async (req, res) => {
  const { uid, event, value, page, metadata } = req.body;
  await recordAnalyticsEvent({
    uid,
    eventType: event,
    value,
    page,
    path: metadata?.path || page,
    metadata
  });
  res.json({ success: true });
}));

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
  const samClient = await getSamClient();
  const samMcpResult = await callMcpTool(samClient, "get_opportunity", { url });
  const samData = JSON.parse(samMcpResult.content[0].text);
  
  if (!samData.description) {
    throw new Error("Solicitation content is empty or unreadable.");
  }

  // 3. Agentic Reasoning (Traceable)
  const rawAudit = await traceLLM(openai, {
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      { role: "system", content: AUDIT_PROMPT },
      { role: "user", content: `Audit this solicitation:\n\n${samData.description}` }
    ]
  }, "mercury_2_engine");

  // Sanitize LLM JSON (Resilient to Markdown/Bold/Comments from smaller models)
  let auditData;
  try {
    const jsonMatch = rawAudit.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : rawAudit.replace(/```json\n?|```/g, "").trim();
    auditData = JSON.parse(cleanJson);
  } catch (pErr) {
    console.warn("[SOVEREIGN_GATEWAY] JSON Parse Failed. Fallback to raw string.", pErr.message);
    throw new Error("Audit generation failed to yield structured data. System at high capacity. Please retry.");
  }

  // 4. Learning Layer (Institutional Distillation - BACKGROUND)
  (async () => {
    try {
      const { getAuditClient, callMcpTool } = await import("./services/mcpClient.js");
      const { persistLogicPattern } = await import("./services/analytics.js");
      
      const auditClient = await getAuditClient();
      const patternData = await callMcpTool(auditClient, "distill_logic", { 
        auditResult: auditData, 
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
  
  const winThemes = await generateWinThemes(auditData, []); 
  const executiveBrief = generateExecutiveBrief(auditData, winThemes);

  // 6. Record Zero-Knowledge Analytics
  await recordAnalyticsEvent({ eventType: "audit_complete", uid: clientIP });

  res.json({
    success: true,
    data: auditData,
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

app.post("/api/chat", asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const aiResponse = await traceLLM(openai, {
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      { role: "system", content: SYS_PROMPT },
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ]
  }, "sovereign_chat");

  // Sovereign Learning Layer: Distill logic from chat in background
  (async () => {
    try {
      const { getAuditClient, callMcpTool } = await import("./services/mcpClient.js");
      const { persistLogicPattern } = await import("./services/analytics.js");
      
      const auditClient = await getAuditClient();
      const sessionContext = history?.map(h => h.content).join("\n") || "";
      const learningInput = `Context: ${sessionContext}\nUser: ${message}\nAssistant: ${aiResponse}`;
      
      // Only distill if the interaction contains high-value analysis
      if (learningInput.length > 500) {
        const patternData = await callMcpTool(auditClient, "distill_logic", { 
          text: learningInput,
          auditResult: { intent: "chat_interaction" }
        });
        
        const pattern = JSON.parse(patternData.content[0].text);
        await persistLogicPattern(pattern);
        console.log("[LEARNING_LAYER] Chat logic distilled and persisted.");
      }
    } catch (err) {
      console.error("[LEARNING_LAYER] Chat distillation failed:", err.message);
    }
  })();

  res.json({ message: aiResponse });
}));

// ─── Admin & Data Governance ───────────────────────────────────────────────

app.get("/api/admin/signups", asyncHandler(async (req, res) => {
  const adminSecret = req.query.secret;
  if (adminSecret !== process.env.ANALYTICS_DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: "UNAUTHORIZED_INTEL_ACCESS" });
  }

  const { analyticsDb } = await import("./services/analytics.js");
  const result = await analyticsDb.query("SELECT email, created_at, metadata FROM beta_signups ORDER BY created_at DESC");
  res.json({ count: result.rows.length, signups: result.rows });
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

app.post("/api/privacy/consent", (req, res) => res.json({ success: true, timestamp: new Date().toISOString() }));

app.get("/api/health", (req, res) => res.json({ status: "ok", protocol: "mercury-2.1-modular" }));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ ARIS Protocol v2.1 -> http://localhost:${PORT}`));
