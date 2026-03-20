// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-20T09:05:21Z
import express from "express";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use(cors());
app.use(express.json());
app.use(requestId);
app.use(express.static(join(__dirname, "../dist")));

// ─── Sovereign Discovery: Asynchronous Harvester ──────────────────────────────

const DISCOVERY_SEEDS = [
  // 🦅 TIER 1: HIGH PRIORITY (CEO FOCUS)
  "Artificial Intelligence", "Generative AI", "Cybersecurity", "Zero Trust",
  "Petroleum", "Oil & Gas", "Energy Security", "Land Acquisition",
  "Defense Procurement", "Weapon Systems", "Military Logistics", "Wars",
  
  // 🛡️ TIER 2: STRATEGIC DISCOVERY
  "Critical Infrastructure", "Threat Intelligence", "Advanced Technology",
  "Infrastructure", "Real Estate", "Public Lands", "Energy Intelligence",
  "UAV Detection", "Counter-UAS", "Autonomous Systems", "Defense Infrastructure",
  "Space Communications", "Satellite Technology", "Biotechnology", "Genomics",
  "Quantum Computing", "Additive Manufacturing", "Advanced Materials", "Robotics",
  "Secure Networking", "5G Technology", "Microelectronics", "Hypersonic Systems",
  "Directed Energy", "Electronic Warfare", "C4ISR", "Data Analytics", "Smart Grids"
];

let lastHarvestTime = 0;
const HARVEST_INTERVAL = 12 * 60 * 60 * 1000; // 12-hour sweep

/**
 * Perform a background harvest of federal opportunities and global intelligence.
 */
async function startHarvester() {
  console.log("[HARVESTER] Starting. Interval: 12h, Seeds:", DISCOVERY_SEEDS.length);

  const pulse = async () => {
    try {
      const now = Date.now();
      if (now - lastHarvestTime < 10 * 60 * 1000) return;

      console.log("[HARVESTER] Sweep started.");

      for (const seed of DISCOVERY_SEEDS) {
        // 1. Live SAM.gov
        try {
          const samClient = await getSamClient();
          const samMcpResult = await callMcpTool(samClient, "search_opportunities", { q: seed, limit: 30 });
          const opportunities = JSON.parse(samMcpResult.content[0].text);
          if (opportunities?.length > 0) {
            await sovereignSearch.syncSovereignTable(opportunities, "US");
          }
        } catch (err) { console.warn(`[HARVESTER] SAM.gov failed for "${seed}":`, err.message); }

        // 2. Historical USAspending
        try {
          const awards = await usaspending.getAwardsSummary(seed);
          if (awards?.length > 0) {
            await sovereignSearch.syncSovereignTable(awards, "US");
          }
        } catch (err) { console.warn(`[HARVESTER] USAspending failed for "${seed}":`, err.message); }

        await new Promise(r => setTimeout(r, 2000));
      }

      lastHarvestTime = Date.now();
      console.log("[HARVESTER] Sweep complete.");
    } catch (err) {
      console.error("[HARVESTER] Critical failure:", err.message);
    }
  };

  setTimeout(pulse, 5000); // 5s boot safety delay
  setInterval(pulse, HARVEST_INTERVAL);
}

// Start the harvester in background
startHarvester();

// ─── API Endpoints ───────────────────────────────────────────────────────────

app.post("/api/fed-search", apiLimiter, asyncHandler(async (req, res) => {
  const { query, limit = 20, expand = true, region = "US" } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  console.log(`[FED_SEARCH] [${region}] Table Lookup: "${query}"`);

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

  // 4. Executive Briefing Synthesis (Sovereign AI Overview)
  let briefing = null;
  try {
    const resultContext = topResults.length > 0
      ? topResults.map(r => `[${r.id}] ${r.title} (${r.agency}): ${r.postedDate}`).join("\n")
      : "No direct solicitations found in the immediate Sovereign Table.";

    const synthesis = await traceLLM(null, {
      model: "google/gemini-2.0-flash-001",
      messages: [
        { 
          role: "system", 
          content: "You are the ARIS Intelligence Liaison. If solicitations are provided, summarize the landscape. If NO solicitations are provided, generate a 3-bullet 'Sovereign Market Intel' briefing based on known federal trends for this industry. Max 3 concise bullets. Focus on LAND, OIL, AI, CYBER, or DEFENSE context where applicable." 
        },
        { role: "user", content: `Query: ${query}\nSystem Context:\n${resultContext}\n${awardContext}` }
      ],
      temperature: 0.1
    }, "fed_search_synthesis");
    
    briefing = synthesis || null;
  } catch (err) {
    console.warn("[FED_SEARCH] Synthesis failed:", err.message);
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

app.get("/api/sovereign-table", asyncHandler(async (req, res) => {
  const auth = req.headers["x-admin-key"];
  try {
    const data = await sovereignSearch.getTableData(auth);
    res.json({ success: true, count: data.length, table: data });
  } catch (err) {
    if (err.message === "UNAUTHORIZED") {
      res.status(401).json({ error: "UNAUTHORIZED_TERMINAL_ACCESS", message: "Invalid auth credentials provided." });
    } else {
      res.status(500).json({ error: "INFRASTRUCTURE_ERROR", message: "Sovereign Mesh (Redis) is currently unreachable or unconfigured." });
    }
  }
}));

// ─── Discovery Feed ──────────────────────────────────────────────────────────

app.get("/api/discovery/search", apiLimiter, asyncHandler(async (req, res) => {
  const { naics = "" } = req.query;
  const naicsCodes = naics.split(",").map(n => n.trim()).filter(Boolean);

  // Run mesh search and NAICS-filtered awards in parallel
  const keywordQuery = naicsCodes.join(" ") || "technology services";
  const [meshResults, naicsAwards] = await Promise.allSettled([
    sovereignSearch.search(keywordQuery, false),
    naicsCodes.length > 0 ? usaspending.getAwardsByNaics(naicsCodes) : Promise.resolve([])
  ]);

  const seen = new Set();
  const prospects = [];

  // From sovereign mesh
  const mesh = meshResults.status === "fulfilled" ? meshResults.value : [];
  mesh.slice(0, 10).forEach(r => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    prospects.push({
      id: r.id,
      title: r.title,
      type: r.matchType === "award_fallback" ? "PAST_AWARD" : "SOLICITATION",
      deadline: r.responseDeadLine || null,
      naics: naics,
      matchScore: Math.min(99, Math.round((r.authorityScore || 0.7) * 100)),
      agency: r.agency,
      url: r.url
    });
  });

  // From USAspending NAICS-filtered awards
  const awards = naicsAwards.status === "fulfilled" ? naicsAwards.value : [];
  awards.slice(0, 15).forEach(a => {
    const id = a["Award ID"] || `award:${a["Recipient Name"]}`;
    if (seen.has(id)) return;
    seen.add(id);
    prospects.push({
      id,
      title: `${a["Recipient Name"]} — ${a["Awarding Agency"]}`,
      type: "PAST_AWARD",
      deadline: a["Start Date"] || null,
      naics: naics,
      matchScore: 75,
      agency: a["Awarding Agency"] || "Federal Agency",
      url: ""
    });
  });

  res.json({ success: true, prospects, count: prospects.length });
}));

// ─── SaaS & Analytics ────────────────────────────────────────────────────────

app.post("/api/track", apiLimiter, asyncHandler(async (req, res) => {
  await recordAnalyticsEvent(req.body);
  res.json({ success: true });
}));

app.post("/api/beta-signup", asyncHandler(async (req, res) => {
  const { email, metadata } = req.body;
  await recordBetaSignup(email, metadata);
  res.json({ success: true });
}));

app.post("/api/checkout", apiLimiter, asyncHandler(async (req, res) => {
  const session = await createCheckoutSession(req.body);
  res.json({ url: session.url });
}));

app.get("/api/usage", asyncHandler(async (req, res) => {
  const clientId = req.headers["x-user-id"] || req.ip;
  const usage = await incrMonthlyUsage(clientId);
  res.json(usage);
}));

app.get("/api/analytics", asyncHandler(async (req, res) => {
  const auth = req.headers["x-admin-key"];
  if (!auth || auth !== process.env.ADMIN_PASSWORD) return res.status(401).send("Unauthorized Access Denied.");
  
  const stats = await sovereignSearch.getStats();
  const dashboard = renderAnalyticsDashboard(stats);
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
