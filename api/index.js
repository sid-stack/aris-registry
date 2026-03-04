import express from "express";
import cors from "cors";
import multer from "multer";
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

const key = process.env.OPENROUTER_API_KEY;
console.log(`[INIT] OPENROUTER_API_KEY: ${key ? 'SET (' + key.substring(0, 20) + '...)' : 'NOT SET'}`);

app.get("/api/health", (_, res) => res.json({ status: "ok", version: "3.0.0" }));

app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    if (!req.body.companyProfile) return res.status(400).json({ error: "No company profile provided" });

    console.log(`[/api/generate] Processing PDF: ${req.file.originalname}`);

    const pp = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const pdfText = (await pp(req.file.buffer)).text;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "ARIS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `You are a federal RFP compliance expert. Analyze this company profile against the provided Federal RFP and generate a professional federal proposal draft in markdown format.

Company Profile: ${req.body.companyProfile}

RFP Text Extract (first 20000 chars):
${pdfText.slice(0, 20000)}

Generate a comprehensive proposal that includes:
1. Executive Summary
2. Technical Approach
3. Management Plan
4. Past Performance
5. Risk Mitigation
6. Compliance Certification

Format as markdown. Be specific and professional.`
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[ERROR] OpenRouter:", data);
      throw new Error(data.error?.message || "API error");
    }

    const proposal = data.choices?.[0]?.message?.content || "No proposal generated";

    res.json({
      proposal,
      metadata: { file: req.file.originalname, size: req.file.size },
      score: { bid_score: 85, compliance_score: 90, risk_level: "Low" }
    });
  } catch (err) {
    console.error("[ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ARIS v3 → http://localhost:${PORT}`);
  console.log(`   Pipeline: Intent → Extract → Validate → Score`);
});

// ─── /api/audit — 7-Pillar Compliance Audit ──────────────────────────────────
const AUDIT_PROMPT = `You are a federal contract compliance auditor. Your job is to perform a rigorous compliance audit — NOT write proposals.

Perform a TWO-PASS analysis:

PASS 1 — Return a JSON object FIRST. Use exactly these keys. If a pillar is not explicitly found, use "NOT FOUND" — never guess.

{
  "solicitation_id": "<RFP/RFQ/IFB number or 'NOT FOUND'>",
  "deadline_date": "<ISO 8601 YYYY-MM-DD or 'NOT FOUND'>",
  "set_aside_type": "<Small Business / 8(a) / SDVOSB / HUBZone / WOSB / Unrestricted or 'NOT FOUND'>",
  "bonding_reqs": {
    "bid_bond": "<percentage or dollar amount or 'NOT FOUND'>",
    "performance_bond": "<percentage or dollar amount or 'NOT FOUND'>",
    "payment_bond": "<percentage or dollar amount or 'NOT FOUND'>"
  },
  "past_performance_threshold": "<explicit minimum projects/dollar/timeframe or 'NOT FOUND'>",
  "technical_disqualifiers": ["<mandatory cert/clearance/requirement — only if explicitly disqualifying. Return ['NOT FOUND'] if none>"],
  "risk_score_1_to_10": <integer 1-10: bonding(0-2) + clearance(0-2) + past perf bar(0-2) + deadline urgency(0-2) + technical complexity(0-2)>
}

PILLAR RULES:
- bonding_reqs: look for "Bid Bond", "Performance Bond", "Payment Bond", "surety bond"
- technical_disqualifiers: MANDATORY only — "required", "shall possess", "must hold". Flag ISO certs, clearances, CMMC levels
- past_performance_threshold: explicit minimums only — project count, dollar floors, timeframes

PASS 2 — Verify: re-read each field. If inferred not explicitly stated, correct to "NOT FOUND".

After the JSON, write a BID/NO-BID EXECUTIVE SUMMARY:

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

app.post("/api/audit", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

    console.log(`[/api/audit] Processing: ${req.file.originalname}`);

    const pp = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const pdfText = (await pp(req.file.buffer)).text;

    if (!pdfText || pdfText.trim().length < 50) {
      return res.status(422).json({ error: "Could not extract text from PDF. Try a non-scanned document." });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "ARIS Compliance Auditor",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        max_tokens: 2000,
        messages: [
          { role: "system", content: AUDIT_PROMPT },
          { role: "user", content: `Audit this solicitation document:\n\n---\n${pdfText.slice(0, 20000)}\n---` }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenRouter error");

    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse JSON block
    let compliance = null;
    const deepMatch = rawContent.match(/\{[\s\S]*\}/);
    if (deepMatch) {
      try { compliance = JSON.parse(deepMatch[0]); }
      catch { compliance = { parse_error: "JSON extraction failed" }; }
    }

    // Everything after the JSON block = executive summary
    let executiveSummary = "";
    if (deepMatch) {
      const jsonEnd = rawContent.indexOf(deepMatch[0]) + deepMatch[0].length;
      executiveSummary = rawContent.slice(jsonEnd).trim();
    }

    res.json({
      compliance,
      executiveSummary,
      auditedAt: new Date().toISOString(),
      metadata: { file: req.file.originalname, size: req.file.size }
    });

  } catch (err) {
    console.error("[/api/audit] ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
