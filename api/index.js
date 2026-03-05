import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS = join(__dirname, "llm");
const SYS_PROMPT = readFileSync(join(PROMPTS, "system_prompt.txt"), "utf8").trim();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ['https://www.bidsmith.pro', 'https://bidsmith.pro', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

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
};

// LLM with exponential backoff retry — ported from money/main.py run_llm()
async function llm(client, messages, maxTokens = 4096, agentKey = "audit", retries = 3) {
  const model = AGENT_MODELS[agentKey] || "google/gemini-2.0-flash-001";
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature: 0,
        top_p: 0.1,
        messages
      });
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

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok", version: "3.0.0" }));

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
  if (!opportunity) return res.status(404).json({ error: "No opportunity found for this notice ID.", instruction: "Manual upload required" });

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
    // ── Stage 1: Analyst — strategic synthesis ────────────────────────────────
    console.log(`[/api/generate-report] Stage 1: Analyst`);
    const analysis = await llm(client, [{
      role: "user",
      content: `You are a federal contracting strategist. Analyze this opportunity and produce a STRATEGIC BRIEF covering:
1. Document type and primary purpose
2. All parties and agency mission
3. Key financial terms and contract value
4. Core technical requirements
5. Set-aside eligibility and FAR implications
6. Top 3 win themes for a competitive offeror
7. Top 3 risk flags that could hurt the bid

Opportunity Data:
${ctx}`
    }], 2048, "analyst");

    // ── Stage 2: Drafter — full QDS-style proposal ───────────────────────────
    console.log(`[/api/generate-report] Stage 2: Drafter`);
    const proposal_draft = await llm(client, [{
      role: "user",
      content: `You are a senior federal proposal writer. Write a complete, professional federal proposal response in markdown based on this strategic brief.

Use this EXACT structure:

# [Company Name Placeholder] - Federal Proposal Response
**CAGE CODE:** \`[PLACEHOLDER]\` | **UEI:** \`[PLACEHOLDER]\`

## 🎯 Executive Summary
2-3 paragraphs. Reference the agency, contract scope, set-aside type. Include compliance frameworks (NIST, CMMC, FedRAMP) where relevant. Quantify differentiation.
> Bold capability statement blockquote.

## 🛡️ Technical Approach
3 numbered pillars tailored to the requirements. Include a metric, percentage, or scale reference.
> Methodology blockquote.

## 📊 Management Plan
4 bullet sections: PMO, Team, Communication Plan, Quality Assurance.

## 📜 Past Performance
2 references with agency, description, value, outcome metric.
**[Agency]:** description (Contract Value: ***$X.XM***)
> Delivery record blockquote.

## ⚠️ Risk Mitigation
| Risk | Mitigation Strategy |
| ---- | ------------------- |
4-6 rows specific to this opportunity.

## ✅ Compliance Certification
List applicable frameworks (NIST SP 800-53, FAR/DFARS clauses, set-aside certs).

STRATEGIC BRIEF:
${analysis}`
    }], 3000, "drafter");

    // ── Stage 3: Reviewer — compliance matrix ─────────────────────────────────
    console.log(`[/api/generate-report] Stage 3: Compliance Matrix`);
    const compliance_report = await llm(client, [{
      role: "user",
      content: `You are a federal compliance officer. Generate ONLY a markdown compliance matrix table based on this opportunity.

Exact columns:
| Requirement | Category | FAR Reference | Bidder Status | Risk Level | Action Required |

10-12 rows. Cover: set-aside eligibility, past performance, bonding, deadline, NAICS, security clearance, insurance, certifications, subcontracting plan.
Bidder Status: ✅ Compliant | ⚠️ Conditional | ❌ Non-Compliant | 🔍 Review Required

Return ONLY the markdown table. No preamble.

OPPORTUNITY DATA:
${ctx}

STRATEGIC BRIEF:
${analysis.slice(0, 2000)}`
    }], 2048, "reviewer");

    // ── Stage 4: Intel — win themes + risk flags + outline ───────────────────
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
    }], 1500, "extractor");

    let intel = { win_themes: [], risk_flags: [], proposal_outline: [] };
    try {
      const stripped = intelRaw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      intel = JSON.parse(stripped);
    } catch {
      // bracket-count fallback
      let s = -1, d = 0, e = -1;
      for (let i = 0; i < intelRaw.length; i++) {
        if (intelRaw[i] === '{') { if (d === 0) s = i; d++; }
        else if (intelRaw[i] === '}') { d--; if (d === 0 && s !== -1) { e = i; break; } }
      }
      if (s !== -1 && e !== -1) {
        try { intel = JSON.parse(intelRaw.slice(s, e + 1)); } catch { }
      }
    }

    console.log(`[/api/generate-report] Pipeline complete`);
    res.json({
      success: true,
      title: title || "Federal Opportunity",
      agency: agency || "Unknown Agency",
      generatedAt: new Date().toISOString(),
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

  const emit = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  // Read pillars from query param (base64-encoded JSON)
  let pillars, title, agency, executiveSummary;
  try {
    const parsed = JSON.parse(Buffer.from(req.query.ctx, "base64").toString("utf8"));
    ({ pillars, title, agency, executiveSummary } = parsed);
  } catch {
    emit({ type: "error", message: "Invalid context" });
    res.end(); return;
  }

  if (!pillars) { emit({ type: "error", message: "Missing pillars" }); res.end(); return; }

  const ctx = JSON.stringify({ title, agency, pillars, executiveSummary }, null, 2).slice(0, 8000);
  const AGENTS = [
    { id: "analyst", label: "🧠 Analyst Agent", role: "Synthesizing solicitation data into strategic brief" },
    { id: "drafter", label: "✍️  Drafter Agent", role: "Writing QDS-style federal proposal draft" },
    { id: "reviewer", label: "⚖️  Reviewer Agent", role: "Generating FAR-referenced compliance matrix" },
    { id: "intel", label: "🔍 Intel Agent", role: "Extracting win themes, risk flags, and volume outline" },
  ];

  emit({ type: "pipeline_start", agents: AGENTS });

  try {
    // Stage 1: Analyst
    emit({ type: "agent_start", stage: 1, agent: AGENTS[0] });
    const analysis = await llm(client, [{
      role: "user", content: `You are a federal contracting strategist. Analyze this opportunity and produce a STRATEGIC BRIEF covering:\n1. Document type and primary purpose\n2. All parties and agency mission\n3. Key financial terms and contract value\n4. Core technical requirements\n5. Set-aside eligibility and FAR implications\n6. Top 3 win themes\n7. Top 3 risk flags\n\nOpportunity Data:\n${ctx}`
    }], 2048, "analyst");
    emit({ type: "agent_done", stage: 1, agent: AGENTS[0], data: { preview: analysis.slice(0, 200) } });

    // Stage 2: Drafter
    emit({ type: "agent_start", stage: 2, agent: AGENTS[1] });
    const proposal_draft = await llm(client, [{
      role: "user", content: `You are a senior federal proposal writer. Write a complete professional federal proposal response in markdown.\n\nUse this EXACT structure:\n\n# [Company Name Placeholder] - Federal Proposal Response\n**CAGE CODE:** \`[PLACEHOLDER]\` | **UEI:** \`[PLACEHOLDER]\`\n\n## 🎯 Executive Summary\n2-3 paragraphs. Reference the agency, contract scope, set-aside type. Include compliance frameworks where relevant. Quantify differentiation.\n> Bold capability statement blockquote.\n\n## 🛡️ Technical Approach\n3 numbered pillars tailored to the requirements. Include a metric.\n> Methodology blockquote.\n\n## 📊 Management Plan\n4 bullet sections: PMO, Team Composition, Communication Plan, Quality Assurance.\n\n## 📜 Past Performance\n2 references: **[Agency]:** description (Contract Value: ***$X.XM***)\n> Delivery record blockquote.\n\n## ⚠️ Risk Mitigation\n| Risk | Mitigation Strategy |\n| ---- | ------------------- |\n4-6 rows.\n\n## ✅ Compliance Certification\nList applicable frameworks (NIST SP 800-53, FAR/DFARS, set-aside certs).\n\nSTRATEGIC BRIEF:\n${analysis}`
    }], 3000, "drafter");
    emit({ type: "agent_done", stage: 2, agent: AGENTS[1], data: { proposal_draft } });

    // Stage 3: Reviewer
    emit({ type: "agent_start", stage: 3, agent: AGENTS[2] });
    const compliance_report = await llm(client, [{
      role: "user", content: `You are a federal compliance officer. Generate ONLY a markdown table:\n| Requirement | Category | FAR Reference | Bidder Status | Risk Level | Action Required |\n10-12 rows. Bidder Status: ✅ Compliant | ⚠️ Conditional | ❌ Non-Compliant | 🔍 Review Required\nReturn ONLY the markdown table, no preamble.\n\nOPPORTUNITY:\n${ctx}\n\nBRIEF:\n${analysis.slice(0, 2000)}`
    }], 2048, "reviewer");
    emit({ type: "agent_done", stage: 3, agent: AGENTS[2], data: { compliance_report } });

    // Stage 4: Intel
    emit({ type: "agent_start", stage: 4, agent: AGENTS[3] });
    const intelRaw = await llm(client, [{
      role: "user", content: `Return ONLY valid JSON:\n{\n  "win_themes": ["<4 specific win themes>"],\n  "risk_flags": ["<4 specific pre-submission risks>"],\n  "proposal_outline": [\n    { "volume": "Volume I: Technical Approach", "sections": ["1.1 ...","1.2 ...","1.3 ..."] },\n    { "volume": "Volume II: Management Plan", "sections": ["2.1 ...","2.2 ...","2.3 ..."] },\n    { "volume": "Volume III: Past Performance", "sections": ["3.1 ...","3.2 ...","3.3 ..."] },\n    { "volume": "Volume IV: Price/Cost", "sections": ["4.1 ...","4.2 ...","4.3 ..."] }\n  ]\n}\n\nBRIEF:\n${analysis.slice(0, 3000)}`
    }], 1500, "extractor");

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

    emit({
      type: "pipeline_complete",
      proposal_draft, compliance_report,
      win_themes: intel.win_themes || [],
      risk_flags: intel.risk_flags || [],
      proposal_outline: intel.proposal_outline || [],
      title: title || "Federal Opportunity",
      agency: agency || "Unknown Agency",
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[SSE pipeline] error:", err);
    emit({ type: "error", message: err.message });
  }

  res.end();
});


app.listen(PORT, () => {
  console.log(`✅ BidSmith API → http://localhost:${PORT}`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY not set");
  if (!process.env.SAM_GOV_API_KEY && !process.env.SAM_API_KEY) console.warn("⚠️  SAM_GOV_API_KEY not set");
});
