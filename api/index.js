// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-20T09:05:21Z
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
import { sovereignSearch } from "./services/fedSearch.js";
import { usaspending } from "./services/usaspending.js";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Initialize LLM Client
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(requestId);
app.use(express.static(join(__dirname, "../dist")));

// ─── Sovereign Discovery: Asynchronous Harvester ──────────────────────────────

const DISCOVERY_SEEDS = [
  "artificial intelligence",
  "cybersecurity",
  "drone technology",
  "defense infrastructure",
  "autonomous systems",
  "biotech",
  "space communications"
];

let lastHarvestTime = 0;
const HARVEST_INTERVAL = 15 * 60 * 1000; // 15 mins

/**
 * Perform a background harvest of federal opportunities to keep the mesh fresh.
 */
async function startHarvester() {
  console.log("🚢 [HARVESTER] Initializing Sovereign Discovery Loop...");
  
  // Restore from Archive on Startup
  await sovereignSearch.loadFromArchive();

  const pulse = async () => {
    const now = Date.now();
    if (now - lastHarvestTime < HARVEST_INTERVAL) return;
    
    console.log("🚢 [HARVESTER] Pulse started. Walking the Federal Mesh...");
    
    for (const seed of DISCOVERY_SEEDS) {
      // 1. Live SAM.gov (Discovery Mode)
      try {
        const samClient = await getSamClient();
        const samMcpResult = await callMcpTool(samClient, "search_opportunities", { q: seed, limit: 50 });
        const opportunities = JSON.parse(samMcpResult.content[0].text);
        if (opportunities?.length > 0) {
          await sovereignSearch.syncSovereignTable(opportunities, "US");
          console.log(`🚢 [HARVESTER] [US] SAM.gov Sync: "${seed}" (+${opportunities.length})`);
        }
      } catch (err) {
        console.warn(`🚢 [HARVESTER] [US] SAM.gov bypass for "${seed}":`, err.message);
      }

      // 2. Historical USAspending (Resilience Mode)
      try {
        const awards = await usaspending.getAwardsSummary(seed);
        if (awards?.length > 0) {
          await sovereignSearch.syncSovereignTable(awards, "US");
          console.log(`🚢 [HARVESTER] [US] USAspending Sync: "${seed}" (+${awards.length})`);
        }
      } catch (err) {
        console.warn(`🚢 [HARVESTER] [US] USAspending bypass for "${seed}":`, err.message);
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
    
    lastHarvestTime = Date.now();
    await sovereignSearch.persistToArchive();
  };

  setTimeout(pulse, 1000);
  setInterval(pulse, HARVEST_INTERVAL);
}

// Start the harvester in background
startHarvester();

// ─── API Endpoints ───────────────────────────────────────────────────────────

app.post("/api/fed-search", asyncHandler(async (req, res) => {
  const { query, limit = 20, expand = true } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  console.log(`[FED_SEARCH] [US] Table Lookup: "${query}"`);

  // 1. STRICT READ-ONLY LOOKUP
  // This is sub-millisecond and never rate-limited.
  const results = await sovereignSearch.search(query, expand);
  const topResults = results.slice(0, limit);

  // 3. Historical Award Analysis (USAspending)
  let awardContext = "";
  if (region === "US") {
    try {
      const awards = await usaspending.getAwardsSummary(query);
      if (awards?.length > 0) {
        awardContext = "\nHistorical Awards (Last Winners):\n" + 
          awards.slice(0, 5).map(a => `- ${a["Recipient Name"]}: $${Number(a["Award Amount"]).toLocaleString()} (${a["Awarding Agency"]} - ${a["Start Date"]})`).join("\n");
      }
    } catch (err) {
      console.warn("[US_DISCOVERY] Award Context Retrieval Failed:", err.message);
    }
  }

  // 4. Executive Briefing Synthesis
  let briefing = null;
  if (topResults.length > 0) {
    try {
      const resultContext = topResults.map(r => `[${r.id}] ${r.title} (${r.agency}): ${r.postedDate}`).join("\n");
      const synthesis = await traceLLM(openai, {
        model: "google/gemini-2.0-flash:free",
        messages: [
          { role: "system", content: "You are the ARIS Intelligence Liaison. Summarize the procurement landscape for a CEO. Cross-reference live RFPs with historical awards. Max 3 concise bullet points. Use citations [DocumentID]." },
          { role: "user", content: `Query: ${query}\nResults:\n${resultContext}\n${awardContext}` }
        ],
        temperature: 0.1
      }, "fed_search_synthesis");
      
      briefing = synthesis;
    } catch (err) {
      console.warn("[FED_SEARCH] Synthesis failed:", err.message);
    }
  }
  
  res.json({
    success: true,
    query,
    results: topResults,
    briefing,
    version: "v4.1-harvester"
  });
}));

app.get("/api/mesh-status", asyncHandler(async (req, res) => {
  res.json(sovereignSearch.getStats());
}));

// ─── SaaS & Analytics ────────────────────────────────────────────────────────

app.post("/api/track", asyncHandler(async (req, res) => {
  await recordAnalyticsEvent(req.body);
  res.json({ success: true });
}));

app.post("/api/beta-signup", asyncHandler(async (req, res) => {
  await recordBetaSignup(req.body);
  res.json({ success: true });
}));

app.post("/api/checkout", asyncHandler(async (req, res) => {
  const session = await createCheckoutSession(req.body);
  res.json({ url: session.url });
}));

app.get("/api/usage", asyncHandler(async (req, res) => {
  const usage = await incrMonthlyUsage(req.ip);
  res.json(usage);
}));

app.get("/api/analytics", asyncHandler(async (req, res) => {
  const dashboard = await renderAnalyticsDashboard();
  res.send(dashboard);
}));

// Previous endpoints...
app.post("/api/audit", asyncHandler(async (req, res) => {
  const { url, section = "M" } = req.body;
  const { getAuditClient, callMcpTool } = await import("./services/mcpClient.js");
  const auditClient = await getAuditClient();
  const result = await callMcpTool(auditClient, "analyze_solicitation", { url, section });
  res.json({ success: true, analysis: result.content[0].text });
}));

app.post("/api/chat", asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  const aiResponse = await traceLLM(openai, {
    model: "anthropic/claude-3.5-sonnet",
    messages: [{ role: "system", content: SYS_PROMPT }, ...(history || []), { role: "user", content: message }]
  }, "sovereign_chat");
  res.json({ success: true, response: aiResponse });
}));

app.get("*", (req, res) => res.sendFile(join(__dirname, "../dist/index.html")));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ ARIS Protocol v2.1 -> http://localhost:${PORT}`));
