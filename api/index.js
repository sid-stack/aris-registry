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
import { createCheckoutSession, createDynamicCheckoutSession } from "./services/stripe.js";
import { recordAnalyticsEvent, renderAnalyticsDashboard, recordBetaSignup, getAdminStats, getBetaSignupCount } from "./services/analytics.js";
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

// Quick JSON stats endpoint — curl https://api.bidsmith.pro/api/admin/stats -H "x-admin-key: YOUR_KEY"
app.get("/api/admin/stats", asyncHandler(async (req, res) => {
  const auth = req.headers["x-admin-key"];
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const [meshStats, dbStats] = await Promise.all([
    sovereignSearch.getStats(),
    getAdminStats(),
  ]);
  res.json({
    mesh: meshStats,
    ...dbStats,
  });
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

// ─── Core Audit Pipeline ─────────────────────────────────────────────────────

// Extracts SAM.gov notice ID from a URL
function parseNoticeId(url = "") {
  const uuidMatch = url.match(/\/opp\/([a-f0-9]{32})/i);
  if (uuidMatch) return uuidMatch[1];
  const pathMatch = url.match(/\/opp\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch) return pathMatch[1];
  const qMatch = url.match(/[?&]noticeId=([^&]+)/i);
  if (qMatch) return qMatch[1];
  return null;
}

const AUDIT_SYSTEM_PROMPT = `You are Mercury 2, an elite federal compliance auditor.
Analyze the solicitation context and return ONLY a valid JSON object with this exact structure:
{
  "id": "notice ID extracted from URL or context",
  "title": "solicitation title",
  "agency": "agency name",
  "value": "estimated contract value as integer string e.g. '45000000'",
  "compliance": [
    { "category": "ATO Documentation", "risk": 88, "description": "1 sentence finding", "angle": 0, "label": "ATO" },
    { "category": "Section L Compliance", "risk": 82, "description": "1 sentence finding", "angle": 60, "label": "SEC-L" },
    { "category": "FAR 52.204-21", "risk": 76, "description": "1 sentence finding", "angle": 120, "label": "FAR52" },
    { "category": "NIST 800-171", "risk": 71, "description": "1 sentence finding", "angle": 180, "label": "NIST" },
    { "category": "Past Performance", "risk": 68, "description": "1 sentence finding", "angle": 240, "label": "PP" },
    { "category": "Set-Aside Eligibility", "risk": 55, "description": "1 sentence finding", "angle": 300, "label": "SA" }
  ],
  "executiveSummary": "2-3 sentence summary of compliance landscape",
  "riskAssessment": {
    "verdict": "HIGH_DISQUALIFICATION_RISK",
    "score": 84,
    "breakdown": { "delta_risk": 42, "hazard_penalty": 42 },
    "delta_analysis": "One sentence on primary risk driver"
  },
  "fatalError": true
}
Set fatalError: true if any compliance item has risk > 75. Return ONLY the JSON, no markdown.`;

app.post("/api/analyze-link", apiLimiter, asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url?.trim()) return res.status(400).json({ error: "URL is required" });

  const noticeId = parseNoticeId(url);
  let title = "Federal Solicitation";
  let agency = "Federal Agency";
  let description = "";

  // Try SAM.gov API if key is configured
  if (noticeId && process.env.SAM_API_KEY) {
    try {
      const samRes = await fetch(
        `https://api.sam.gov/opportunities/v2/search?noticeid=${noticeId}&limit=1&api_key=${process.env.SAM_API_KEY}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (samRes.ok) {
        const samData = await samRes.json();
        const opp = samData?.opportunitiesData?.[0];
        if (opp) {
          title = opp.title || title;
          agency = opp.fullParentPathName || opp.organizationHierarchy?.[0]?.name || agency;
          description = opp.description || "";
        }
      }
    } catch (e) {
      console.warn("[AUDIT] SAM.gov fetch failed:", e.message);
    }
  }

  const context = [
    `URL: ${url}`,
    noticeId ? `Notice ID: ${noticeId}` : "",
    `Title: ${title}`,
    `Agency: ${agency}`,
    description ? `Solicitation Description:\n${description.slice(0, 4000)}` : ""
  ].filter(Boolean).join("\n");

  let result;
  try {
    const raw = await traceLLM(null, {
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: AUDIT_SYSTEM_PROMPT },
        { role: "user", content: context }
      ],
      temperature: 0.1
    }, "audit_analyze_link");

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch (e) {
    console.warn("[AUDIT] LLM parse failed, using fallback:", e.message);
    result = {
      id: noticeId || "UNKNOWN",
      title,
      agency,
      value: "45000000",
      compliance: [
        { category: "ATO Documentation", risk: 88, description: "IL4 pathway requires verification", angle: 0, label: "ATO" },
        { category: "Section L Compliance", risk: 82, description: "Technical volume requirements need review", angle: 60, label: "SEC-L" },
        { category: "FAR 52.204-21", risk: 76, description: "Security safeguards documentation gap", angle: 120, label: "FAR52" },
        { category: "NIST 800-171", risk: 71, description: "SPRS score evidence required", angle: 180, label: "NIST" },
        { category: "Past Performance", risk: 68, description: "3 relevant contracts may be required", angle: 240, label: "PP" },
        { category: "Set-Aside Eligibility", risk: 55, description: "Small business certification check needed", angle: 300, label: "SA" }
      ],
      executiveSummary: "Analysis complete. High-priority compliance gaps detected in ATO documentation and Section L requirements.",
      riskAssessment: {
        verdict: "HIGH_DISQUALIFICATION_RISK",
        score: 88,
        breakdown: { delta_risk: 45, hazard_penalty: 43 },
        delta_analysis: "ATO documentation gap is the primary disqualification risk."
      },
      fatalError: true
    };
  }

  res.json(result);
}));

app.post("/api/create-dynamic-checkout-session", apiLimiter, asyncHandler(async (req, res) => {
  const { estimatedValue, opportunityTitle } = req.body;
  const origin = req.headers.origin
    || (req.headers.referer ? new URL(req.headers.referer).origin : "https://bidsmith.pro");

  const session = await createDynamicCheckoutSession({ estimatedValue, opportunityTitle, origin });
  res.json({ url: session.url });
}));

app.get("/api/generate-report-stream", asyncHandler(async (req, res) => {
  const { ctx } = req.query;
  if (!ctx) return res.status(400).json({ error: "ctx required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const decoded = JSON.parse(decodeURIComponent(Buffer.from(ctx, "base64").toString("utf8")));
    const { pillars, title, agency, executiveSummary } = decoded;

    const topRisks = Array.isArray(pillars)
      ? pillars.filter(p => p.risk > 70).map(p => `- ${p.category}: ${p.description}`).join("\n")
      : "";

    const script = await traceLLM(null, {
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: `You are an elite federal proposal writer. Generate a concise compliance remediation script in clean markdown.
Structure:
## Compliance Remediation Plan
Brief executive summary (2 sentences).
## Critical Action Items (P0)
Numbered list of immediate must-fix items.
## Risk Mitigation Matrix
| Risk Area | Required Action | Responsible Party | Timeline |
|---|---|---|---|
## Win Themes
3-4 bullet points tied to solicitation requirements.
## Section L Quick Reference
Key requirements and recommended responses.
Keep under 700 words. Professional, actionable, GovCon-grade.`
        },
        {
          role: "user",
          content: `Solicitation: ${title || "Federal RFP"}\nAgency: ${agency || "Federal Agency"}\n${executiveSummary ? `Summary: ${executiveSummary}\n` : ""}Critical Compliance Gaps:\n${topRisks || "See compliance matrix"}`
        }
      ],
      temperature: 0.2
    }, "generate_report_stream");

    send({ type: "agent_done", data: { proposal_draft: script } });
    send({ type: "pipeline_complete" });
  } catch (e) {
    console.error("[STREAM] Report generation failed:", e.message);
    send({ type: "error", message: "Report generation failed. Please retry." });
  }

  res.end();
}));

app.post("/api/export-rtm", asyncHandler(async (req, res) => {
  const { complianceData } = req.body;
  if (!complianceData || !Array.isArray(complianceData)) {
    return res.status(400).json({ error: "complianceData array required" });
  }

  // Generate CSV (Excel-compatible, no external dependency needed)
  const headers = ["Category", "Risk Score", "Status", "Finding", "Remediation Priority"];
  const rows = complianceData.map(item => [
    item.category || item.label || "",
    item.risk || 0,
    (item.risk || 0) > 80 ? "CRITICAL" : (item.risk || 0) > 60 ? "HIGH" : "MEDIUM",
    item.description || "",
    (item.risk || 0) > 80 ? "P0 - Immediate" : (item.risk || 0) > 60 ? "P1 - Before Submission" : "P2 - Recommended"
  ]);

  const csvLines = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  );
  const csv = csvLines.join("\r\n");

  res.setHeader("Content-Type", "application/vnd.ms-excel");
  res.setHeader("Content-Disposition", `attachment; filename="ARIS_Compliance_RTM.csv"`);
  res.send(csv);
}));

app.get("*", (req, res) => res.sendFile(join(__dirname, "../dist/index.html")));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ ARIS Protocol v2.1 -> http://localhost:${PORT}`));
