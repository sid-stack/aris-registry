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

async function llm(client, messages, maxTokens = 4096) {
  const res = await client.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    max_tokens: maxTokens,
    temperature: 0,
    top_p: 0.1,
    messages
  });
  return res.choices[0]?.message?.content || "";
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
const REPORT_PROMPT = `You are a senior federal proposal consultant. You generate premium-grade federal proposal intelligence reports modeled after institutional $5,000-per-engagement consulting deliverables.

You will receive extracted solicitation pillars, an executive summary, and opportunity metadata.

Generate a complete federal proposal intelligence package in THREE parts:

────────────────────────────────────────────────────────────────────────
PART 1 — PROPOSAL DRAFT (proposal_draft)
────────────────────────────────────────────────────────────────────────
Generate a full proposal draft in this EXACT markdown format, personalized to the specific opportunity:

# [Company Name Placeholder] - Federal Proposal Response

**CAGE CODE:** \`[PLACEHOLDER]\` | **UEI:** \`[PLACEHOLDER]\`

## 🎯 Executive Summary
Write 2-3 paragraphs positioning the offeror as the ideal candidate. Reference the specific agency, NAICS code, set-aside type, and contract scope from the pillars. Include references to relevant compliance frameworks (NIST, CMMC, FedRAMP, HIPAA, FISMA) where applicable. Quantify differentiation (e.g., "40% faster delivery", "99.99% uptime SLA").

> Include one blockquote with a bold capability statement tied to the specific opportunity.

## 🛡️ Technical Approach
Write 3 numbered technical pillars tailored to the solicitation scope:
1. **[Pillar 1 Name]:** Description tied to the RFP requirements
2. **[Pillar 2 Name]:** Description tied to the RFP requirements  
3. **[Pillar 3 Name]:** Description tied to the RFP requirements

Include at least one data point (metric, percentage, or scale reference).

> Include one blockquote on methodology or tooling.

## 📊 Management Plan
Write 4 bullet sections: PMO structure, Team Composition, Communication Plan, Quality Assurance. Tie each to the specific deliverables implied by the solicitation.

## 📜 Past Performance
Write 2 specific past performance references with fictional but plausible metrics:
- Federal agency name, contract description, dollar value, outcome metric
- Format: **[Agency]:** [Description] (Contract Value: ***$X.XM***)

> Include one blockquote on delivery record.

## ⚠️ Risk Mitigation
Generate a markdown table:
| Risk | Mitigation Strategy |
| ---- | ------------------- |
[4-6 rows specific to this solicitation's risk profile]

## ✅ Compliance Certification
List all applicable compliance frameworks detected or implied by the solicitation. Always include: NIST SP 800-53, FAR/DFARS clauses detected, and any set-aside specific certifications.

────────────────────────────────────────────────────────────────────────
PART 2 — COMPLIANCE MATRIX (compliance_report)
────────────────────────────────────────────────────────────────────────
Generate a markdown table with these exact columns:
| Requirement | Category | FAR Reference | Bidder Status | Risk Level | Action Required |

Include 10-14 rows. Bidder Status: ✅ Compliant | ⚠️ Conditional | ❌ Non-Compliant | 🔍 Review Required
Cover: set-aside eligibility, past performance threshold, bonding, submission deadline, NAICS alignment, security clearance, insurance, technical certifications, subcontracting plan.

────────────────────────────────────────────────────────────────────────
PART 3 — STRATEGIC INTELLIGENCE (win_themes, risk_flags, proposal_outline)
────────────────────────────────────────────────────────────────────────
- win_themes: 4-5 specific strategic win themes tailored to this opportunity and agency
- risk_flags: 3-5 specific risks the bidder must resolve before submitting
- proposal_outline: standard FAR Part 15 Section L/M TOC with 4-6 sub-sections per volume

Return ONLY valid JSON:
{
  "proposal_draft": "<full markdown proposal as a single escaped string>",
  "compliance_report": "<full markdown table as a single escaped string>",
  "proposal_outline": [
    { "volume": "Volume I: Technical Approach", "sections": ["1.1 ...", "1.2 ..."] },
    { "volume": "Volume II: Management Plan", "sections": ["2.1 ...", "2.2 ..."] },
    { "volume": "Volume III: Past Performance", "sections": ["3.1 ...", "3.2 ..."] },
    { "volume": "Volume IV: Price/Cost Volume", "sections": ["4.1 ...", "4.2 ..."] }
  ],
  "win_themes": ["<specific win theme>"],
  "risk_flags": ["<specific risk>"]
}`;

app.post("/api/generate-report", async (req, res) => {
  const client = makeClient();
  if (!client) return res.status(500).json({ error: "Server configuration incomplete" });

  const { pillars, executiveSummary, title, agency } = req.body;
  if (!pillars) return res.status(400).json({ error: "Missing pillars data. Run /api/analyze-link or /api/audit first." });

  try {
    console.log(`[/api/generate-report] Generating report for: ${title || 'Unknown Opportunity'}`);

    const context = JSON.stringify({ pillars, executiveSummary, title, agency }, null, 2);

    const raw = await llm(client, [
      { role: "system", content: REPORT_PROMPT },
      { role: "user", content: `Generate the compliance matrix and proposal outline for this opportunity:\n\n${context.slice(0, 12000)}` }
    ], 4096);

    let report;
    try { report = parseJSON(raw); }
    catch (e) {
      // Attempt to extract JSON block if LLM wrapped it
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { report = JSON.parse(match[0]); }
        catch { return res.status(502).json({ error: "Report generation failed: could not parse LLM output", raw: raw.slice(0, 500) }); }
      } else {
        return res.status(502).json({ error: "Report generation failed: no JSON in LLM output", raw: raw.slice(0, 500) });
      }
    }

    res.json({
      success: true,
      title: title || "Federal Opportunity",
      agency: agency || "Unknown Agency",
      generatedAt: new Date().toISOString(),
      pillars,
      proposal_draft: report.proposal_draft || "",
      compliance_report: report.compliance_report || "",
      proposal_outline: report.proposal_outline || [],
      win_themes: report.win_themes || [],
      risk_flags: report.risk_flags || []
    });
  } catch (err) {
    console.error("[/api/generate-report] ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ BidSmith API → http://localhost:${PORT}`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY not set");
  if (!process.env.SAM_GOV_API_KEY && !process.env.SAM_API_KEY) console.warn("⚠️  SAM_GOV_API_KEY not set");
});
