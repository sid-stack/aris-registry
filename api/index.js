// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-25T15:20:00Z
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
import { recordAnalyticsEvent, renderAnalyticsDashboard, recordBetaSignup, createAuditSession, updateAuditSession, getAuditSession, getUserAuditSessions } from "./services/analytics.js";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { AUDIT_PROMPT, SYS_PROMPT } from "./src/prompts.js";
import { sovereignSearch } from "./services/fedSearch.js";
import { usaspending } from "./services/usaspending.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

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
const SAM_API_KEY = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;
let samRateLimitedUntil = 0;
let samKeyMissingLogged = false;

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

      let samRateLimitLogged = false;
      for (const seed of DISCOVERY_SEEDS) {
        // 1. Live SAM.gov
        if (!SAM_API_KEY) {
          if (!samKeyMissingLogged) {
            console.warn("[HARVESTER] SAM.gov disabled: SAM_API_KEY not configured.");
            samKeyMissingLogged = true;
          }
        } else if (Date.now() < samRateLimitedUntil) {
          if (!samRateLimitLogged) {
            console.warn("[HARVESTER] SAM.gov rate-limited. Skipping until cooldown expires.");
            samRateLimitLogged = true;
          }
        } else {
          try {
            const samClient = await getSamClient();
            const samMcpResult = await callMcpTool(samClient, "search_opportunities", { q: seed, limit: 30 });
            const opportunities = JSON.parse(samMcpResult.content[0].text);
            if (opportunities?.length > 0) {
              await sovereignSearch.syncSovereignTable(opportunities, "US");
            }
          } catch (err) {
            const msg = err?.message || "";
            if (msg.includes("RATE_LIMIT_HIT") || msg.includes("429")) {
              samRateLimitedUntil = Date.now() + 15 * 60 * 1000;
              console.warn("[HARVESTER] SAM.gov rate limit hit. Cooling down for 15 minutes.");
            } else {
              console.warn(`[HARVESTER] SAM.gov failed for "${seed}":`, msg);
            }
          }
        }

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

app.get("/api/privacy/consent", asyncHandler(async (_req, res) => {
  res.json({ success: true, consent: null });
}));

app.post("/api/privacy/consent", asyncHandler(async (req, res) => {
  const { necessary = true, analytics = false, marketing = false, source = "unknown" } = req.body || {};
  await recordAnalyticsEvent({
    eventType: "privacy_consent",
    value: analytics ? 1 : 0,
    page: "privacy",
    path: req.path,
    metadata: { necessary: !!necessary, analytics: !!analytics, marketing: !!marketing, source }
  });
  res.status(204).end();
}));

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
  const aiResponse = await traceLLM(null, {
    model: "google/gemini-2.0-flash-001",
    messages: [{ role: "system", content: SYS_PROMPT }, ...(history || []), { role: "user", content: message }]
  }, "sovereign_chat");
  res.json({ success: true, response: aiResponse });
}));

// ─── Health ──────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ─── User Audit History ──────────────────────────────────────────────────────

app.get("/api/audits", asyncHandler(async (req, res) => {
  const uid = req.headers["x-user-id"] || null;
  if (!uid) return res.json({ audits: [] });
  const sessions = await getUserAuditSessions(uid);
  res.json({ audits: sessions });
}));

// ─── Dynamic Checkout (per-audit purchase) ───────────────────────────────────

app.post("/api/create-dynamic-checkout-session", apiLimiter, asyncHandler(async (req, res) => {
  const { estimatedValue, packType, opportunityTitle } = req.body || {};
  // map packType → existing plan keys
  const planKey = packType === "enterprise" ? "growth" : "starter";
  const session = await createCheckoutSession({
    plan: planKey,
    context: {
      opportunityTitle: opportunityTitle || "",
      estimated_value: String(estimatedValue || ""),
    },
    origin: `${req.protocol}://${req.get("host")}`,
  });
  res.json({ url: session.url });
}));

// ─── RTM / Compliance Matrix CSV Export ──────────────────────────────────────

app.post("/api/export-rtm", asyncHandler(async (req, res) => {
  const { complianceData } = req.body || {};
  if (!Array.isArray(complianceData) || complianceData.length === 0) {
    return res.status(400).json({ error: "no compliance data provided" });
  }

  const escape = (v) => `"${String(v || "").replace(/"/g, '""')}"`;

  const headers = ["ID", "Requirement Text", "Section", "Category", "Type", "Risk Level", "Disqualifying If Missing", "Source Excerpt"];
  const rows = complianceData.map((r) => [
    escape(r.requirement_id || ""),
    escape(r.text || ""),
    escape(r.section || ""),
    escape(r.category || ""),
    escape(r.type || ""),
    escape(r.risk_level || ""),
    escape(r.is_disqualifying_if_missing ? "YES" : "NO"),
    escape(r.source_excerpt || ""),
  ]);

  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="ARIS_Compliance_Matrix.csv"');
  res.send(csv);
}));

// ─── Audit Session Pipeline ───────────────────────────────────────────────────

const uploadSingle = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const SAM_API_KEY_VAL = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;

function extractNoticeId(url) {
  const m = String(url || "").match(/sam\.gov\/opp\/([a-f0-9]{32})/i);
  return m ? m[1] : null;
}

async function fetchSamText(url) {
  const noticeId = extractNoticeId(url);
  if (noticeId && SAM_API_KEY_VAL) {
    try {
      const r = await fetch(`https://api.sam.gov/opportunities/v2/search?noticeid=${noticeId}&api_key=${SAM_API_KEY_VAL}&limit=1`);
      if (r.ok) {
        const d = await r.json();
        const opp = d.opportunitiesData?.[0];
        if (opp) {
          return {
            text: [opp.title, opp.description, opp.additionalInfoLink].filter(Boolean).join("\n\n"),
            title: opp.title || "",
            agency: opp.fullParentPathName || opp.organizationName || "",
          };
        }
      }
    } catch { /* fall through */ }
  }
  // Try plain fetch as fallback (works for some pages)
  try {
    const r = await fetch(url, { headers: { "User-Agent": "BidSmith/1.0" }, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const html = await r.text();
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s{3,}/g, " ").slice(0, 30000);
      return { text, title: "", agency: "" };
    }
  } catch { /* fall through */ }
  return null;
}

async function runAuditPipeline(sessionId, url, fileBuffer) {
  try {
    let text = "", title = "", agency = "";

    if (fileBuffer) {
      const parsed = await pdfParse(fileBuffer);
      text = parsed.text || "";
    } else if (url) {
      const fetched = await fetchSamText(url);
      if (fetched) { text = fetched.text; title = fetched.title; agency = fetched.agency; }
    }

    if (!text || text.trim().length < 50) {
      await updateAuditSession(sessionId, { status: "failed" });
      return;
    }

    const extractPromptTemplate = await import("fs").then(fs =>
      fs.promises.readFile(new URL("./llm/extract_prompt.txt", import.meta.url), "utf-8")
    );
    const promptText = extractPromptTemplate.replace("{{RFP_TEXT}}", text.slice(0, 18000));

    const raw = await traceLLM(null, {
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: "You are a federal procurement compliance analyst. Extract requirements from RFP text. Return only valid JSON matching the schema exactly. No markdown code fences." },
        { role: "user", content: promptText }
      ],
      temperature: 0.1
    }, "audit_extract");

    let extracted;
    try {
      extracted = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
    } catch {
      await updateAuditSession(sessionId, { status: "failed" });
      return;
    }

    const requirements = extracted.requirements || [];
    const highRisk = requirements.filter(r => r.risk_level === "High" || r.is_disqualifying_if_missing);
    const disqualifiers = requirements.filter(r => r.is_disqualifying_if_missing);
    const riskScore = Math.min(100, highRisk.length * 10 + disqualifiers.length * 15);

    let recommendation = "BID";
    let winProbability = 72;
    if (disqualifiers.length >= 3 || riskScore >= 65) { recommendation = "NO-BID"; winProbability = 18; }
    else if (disqualifiers.length >= 1 || riskScore >= 35) { recommendation = "CONDITIONAL"; winProbability = 44; }

    const resolvedTitle = title || extracted.document_metadata?.solicitation_number || "Federal Solicitation";
    const resolvedAgency = agency || extracted.document_metadata?.agency || "Federal Agency";
    const primaryFinding = highRisk[0]
      ? highRisk[0].text.slice(0, 150) + (highRisk[0].text.length > 150 ? "…" : "")
      : `${requirements.length} requirements extracted across ${extracted.document_metadata?.detected_sections?.length || 0} sections.`;

    const teaser = {
      title: resolvedTitle,
      agency: resolvedAgency,
      bidRecommendation: recommendation,
      winProbability,
      riskCount: highRisk.length,
      disqualifierCount: disqualifiers.length,
      primaryFinding,
      headline: `${requirements.length} requirements · ${disqualifiers.length} disqualifiers`,
    };

    const result = {
      solicitation_number: extracted.document_metadata?.solicitation_number || "",
      title: resolvedTitle,
      agency: resolvedAgency,
      naics_code: extracted.document_metadata?.naics_code || "",
      contract_type: extracted.document_metadata?.contract_type || "",
      set_aside_type: extracted.document_metadata?.set_aside_type || "",
      requirements,
      far_clauses: extracted.far_clauses_detected || [],
      submission_details: extracted.submission_details || {},
      evaluation_summary: extracted.evaluation_summary || {},
      verdict: { recommendation, win_probability: winProbability, risk_score: riskScore },
      risk_flags: highRisk.slice(0, 12),
    };

    await updateAuditSession(sessionId, { status: "teaser_ready", teaser, result });
  } catch (err) {
    console.error("[AUDIT_PIPELINE] error:", err.message);
    await updateAuditSession(sessionId, { status: "failed" });
  }
}

app.post("/api/audits/run", uploadSingle.single("file"), asyncHandler(async (req, res) => {
  const url = req.body?.url || "";
  const fileBuffer = req.file?.buffer || null;
  if (!url && !fileBuffer) return res.status(400).json({ error: "url or file required" });

  const session = await createAuditSession(fileBuffer ? "file" : "url", url || req.file?.originalname || "upload");
  if (!session?.id) return res.status(500).json({ error: "could not create session" });

  // Fire-and-forget — don't await
  runAuditPipeline(session.id, url, fileBuffer).catch(err => console.error("[AUDIT] unhandled:", err.message));

  res.json({ auditId: session.id });
}));

app.get("/api/audits/:id/teaser", asyncHandler(async (req, res) => {
  const session = await getAuditSession(req.params.id);
  if (!session) return res.status(404).json({ error: "session not found" });

  if (session.status === "teaser_ready" || session.status === "result_ready") {
    return res.json({ status: "teaser_ready", teaser: session.teaser });
  }
  if (session.status === "failed") {
    return res.json({ status: "failed" });
  }
  res.json({ status: "processing" });
}));

app.get("/api/audits/:id/result", asyncHandler(async (req, res) => {
  const session = await getAuditSession(req.params.id);
  if (!session) return res.status(404).json({ error: "session not found" });

  const uid = req.headers["x-user-id"] || null;
  if (uid && session.status === "teaser_ready") {
    // Claim session for this user
    await updateAuditSession(req.params.id, { uid, status: "result_ready" });
  }

  if (session.result) {
    return res.json({ status: "ready", result: session.result });
  }
  res.json({ status: session.status });
}));

app.get("*", (req, res) => res.sendFile(join(__dirname, "../dist/index.html")));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ ARIS Protocol v2.1 -> http://localhost:${PORT}`));
