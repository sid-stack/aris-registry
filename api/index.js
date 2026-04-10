// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-26T21:20:00Z
import "dotenv/config";

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { requestId, requestLogger } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { sendEmail } from "./utils/mailer.js";
import { logger, requestMeta } from "./utils/logger.js";

// Stateless Utils & Infrastructure
import { traceLLM } from "./utils/tracing.js";
import { callLLM, callLLMStream } from "./llm/openrouter.js";

// Services
import { createDynamicCheckoutSession } from "./services/stripe.js";
import { recordAnalyticsEvent, getAdminStats, saveAudit, getAuditHistory, getAuditById, savePendingReport, getPendingReports, getPendingReportById, markReportSent, updateReportNotes } from "./services/analytics.js";
import { fetchSolicitationText } from "./services/samGov.js";
import { runAudit } from "./agents/auditPipeline.js";
import { addToWaitlist, getWaitlist, getWaitlistStats, markInvited } from "./services/waitlist.js";
import { getAuditCache, setAuditCache, auditCacheStats } from "./services/auditCache.js";

import multer from "multer";
import pdfParse from "pdf-parse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const app = express();

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
app.use(requestLogger);


// Increment with each breaking change to the audit schema / logic-gate prompt.
const LOGIC_GATE_VERSION = "v2.2";

function toMvpAuditResult(raw = {}) {
  const verdict = raw.verdict || {};
  const requirements = Array.isArray(raw.requirements) ? raw.requirements : [];
  const roadmap = Array.isArray(raw.proposal_roadmap) ? raw.proposal_roadmap : [];
  const intelligence = raw.intelligence || {};
  return {
    id: raw.id || null,
    solicitation_number: raw.solicitation_number || null,
    opportunity_id: raw.solicitation_number || raw.id || null,
    title: raw.title || "Federal Solicitation",
    agency: raw.agency || "Federal Agency",
    contract_type: raw.contract_type || null,
    set_aside_type: raw.set_aside_type || null,
    due_date: raw.due_date || null,
    executiveSummary: raw.executiveSummary || "",
    verdict: {
      recommendation: verdict.recommendation || "CONDITIONAL",
      win_probability: typeof verdict.win_probability === "number" ? verdict.win_probability : 50,
      confidence: verdict.confidence || "MEDIUM",
      rationale: verdict.rationale || "",
      summary: verdict.summary || "",
    },
    intelligence: {
      top_risks: Array.isArray(intelligence.top_risks) ? intelligence.top_risks : [],
      timeline_pressure: intelligence.timeline_pressure || { detected: false, days_to_respond: null, explanation: "" },
      hidden_requirements: Array.isArray(intelligence.hidden_requirements) ? intelligence.hidden_requirements : [],
    },
    requirements: requirements.map((item, idx) => ({
      id: item.id || `REQ-${idx + 1}`,
      requirement: item.requirement || item.text || "Requirement",
      section: item.section || null,
      category: item.category || "Other",
      risk: item.risk || "MED",
      is_disqualifier: Boolean(item.is_disqualifier),
      action_required: item.action_required || "",
      source_excerpt: item.source_excerpt || "",
    })),
    proposal_roadmap: roadmap.map((step) => ({
      section: step.section || "Proposal Section",
      recommended_pages: step.recommended_pages || "",
      focus_areas: Array.isArray(step.focus_areas) ? step.focus_areas : [],
      discriminator: step.discriminator || "",
    })),
    generated_at: raw.generated_at || new Date().toISOString(),
    // Audit provenance — shown in Metadata card
    meta: {
      logic_gate_version: LOGIC_GATE_VERSION,
      cache_hit: false,
      cache_served_at: null,
    },
  };
}

// ─── /api/evals/status — serve latest eval_results.json for the EvalStatusCard ──
app.get("/api/evals/status", asyncHandler(async (_req, res) => {
  const { readFile } = await import("fs/promises");
  const resultsPath = join(__dirname, "../tests/eval_results.json");
  try {
    const raw = await readFile(resultsPath, "utf8");
    res.json(JSON.parse(raw));
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({
        error: "No eval results found. Run: python scripts/run_evals.py",
        evals: [],
        summary: { total: 5, passed: 0, failed: 0, errored: 0, pct: 0, overall: "pending" },
      });
    } else {
      throw err;
    }
  }
}));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    ts: new Date().toISOString(),
    logic_gate_version: LOGIC_GATE_VERSION,
    providers: {
      mercury: Boolean(process.env.MERCURY_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_KEY),
    },
    audit_cache: auditCacheStats(),
  });
});

// /api/fed-search has no handler — requests fall through to 404 naturally

// ─── Block sensitive file probes ────────────────────────────────────────────
app.get(/\.env(\..*)?$|\.(git|htaccess|DS_Store)|wp-admin|phpinfo/i, (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.get("/app-config.js", (_req, res) => {
  const publicConfig = {
    VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY || "",
  };

  res.type("application/javascript");
  res.send(`window.__APP_CONFIG__ = Object.assign({}, window.__APP_CONFIG__ || {}, ${JSON.stringify(publicConfig)});`);
});

app.use(express.static(join(__dirname, "../dist")));

// Multer for memory upload
const upload = multer({ storage: multer.memoryStorage() });

// ─── /api/audit/pdf ───────────────────────────────────────────────────────────
app.post("/api/audit/pdf", upload.single("file"), asyncHandler(async (req, res) => {
  const rid = req.id || "?";

  // ── Input validation ──────────────────────────────────────────────────────
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded", code: 400 });
  }
  if (!req.file.mimetype?.includes("pdf") && !req.file.originalname?.toLowerCase().endsWith(".pdf")) {
    return res.status(422).json({ error: "Invalid file type. Only PDF files are accepted.", code: 422 });
  }
  if (req.file.size > 25 * 1024 * 1024) {
    return res.status(413).json({ error: "File too large. Maximum size is 25 MB.", code: 413 });
  }

  const filename  = req.file.originalname;
  const userEmail = req.headers["x-user-email"] || req.body?.userEmail || "unknown";
  const userId    = req.headers["x-user-id"] || "anonymous";
  const t0        = Date.now();

  // ── Stage 1: Retrieval (PDF → raw text) ──────────────────────────────────
  logger.info("audit_stage", requestMeta(req, {
    stage: "1_retrieval", source: "pdf", filename,
    file_bytes: req.file.size, user_email: userEmail,
  }));

  let rfpText;
  try {
    const parsed = await pdfParse(req.file.buffer);
    rfpText = parsed.text?.trim();
  } catch (parseErr) {
    logger.warn("audit_stage_error", requestMeta(req, {
      stage: "1_retrieval", source: "pdf", filename,
      error: parseErr.message,
    }));
    return res.status(422).json({
      error: "Could not parse this PDF. The file may be scanned, password-protected, or corrupted.",
      code: 422,
    });
  }

  if (!rfpText || rfpText.length < 100) {
    return res.status(422).json({
      error: "Could not extract readable text from this PDF. Try a text-based PDF or paste the content directly.",
      code: 422,
    });
  }

  logger.info("audit_stage", requestMeta(req, {
    stage: "1_retrieval", status: "ok",
    chars: rfpText.length, elapsed_ms: Date.now() - t0,
  }));

  // ── Stage 2: Chunking (text preparation) ─────────────────────────────────
  const t1 = Date.now();
  logger.info("audit_stage", requestMeta(req, {
    stage: "2_chunking", source: "pdf", chars: rfpText.length,
    // Estimate chunks at ~4 000 chars each (coordinator uses 120k limit)
    estimated_chunks: Math.ceil(rfpText.length / 4000),
  }));

  const meta = {
    id: filename.replace(/\.pdf$/i, ""),
    title: filename,
    agency: "Extracted from PDF",
    value: "0",
  };

  logger.info("audit_stage", requestMeta(req, {
    stage: "2_chunking", status: "ok", elapsed_ms: Date.now() - t1,
  }));

  // ── Fire-and-forget email notification ───────────────────────────────────
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  sendEmail({
    to: "sid@bidsmith.pro",
    subject: `🔔 RFP Upload — ${filename}`,
    html: `
      <h2 style="margin:0 0 16px">New RFP PDF Uploaded</h2>
      <table style="font-size:14px;line-height:1.8;border-collapse:collapse">
        <tr><td style="padding-right:16px;color:#64748b">File</td><td><strong>${filename}</strong></td></tr>
        <tr><td style="padding-right:16px;color:#64748b">User</td><td>${userEmail}</td></tr>
        <tr><td style="padding-right:16px;color:#64748b">Time</td><td>${ts} ET</td></tr>
        <tr><td style="padding-right:16px;color:#64748b">Size</td><td>${rfpText.length.toLocaleString()} chars extracted</td></tr>
      </table>
    `,
  }).catch(() => {});

  // ── Stage 3: Inference (3-agent pipeline) ────────────────────────────────
  const t2 = Date.now();
  logger.info("audit_stage", requestMeta(req, {
    stage: "3_inference", model: "coordinator", filename, req_id: rid,
  }));

  try {
    const rawResult = await runAudit(rfpText, meta);
    const result    = toMvpAuditResult(rawResult);

    logger.info("audit_stage", requestMeta(req, {
      stage: "3_inference", status: "ok",
      verdict: result.verdict?.recommendation,
      win_prob: result.verdict?.win_probability,
      req_count: Array.isArray(rawResult?.requirements) ? rawResult.requirements.length : 0,
      elapsed_ms: Date.now() - t2,
      total_ms: Date.now() - t0,
    }));

    savePendingReport({
      uid: userId, user_email: userEmail,
      sam_url: null,
      solicitation_number: result.solicitation_number || null,
      title: result.title || filename,
      agency: result.agency || "Extracted from PDF",
      verdict: result.verdict?.recommendation || null,
      win_probability: result.verdict?.win_probability ?? null,
      audit_result: result,
    }).catch(() => {});

    return res.json(result);
  } catch (err) {
    logger.error("audit_stage_error", requestMeta(req, {
      stage: "3_inference", source: "pdf", filename,
      error: err.message, stack: err.stack?.split("\n")[1],
      elapsed_ms: Date.now() - t2,
    }));
    // Graceful fallback — never crash the UI
    return res.status(202).json({
      queued: true,
      error: "Audit pipeline encountered an error. Your file has been queued for manual review.",
      code: 202,
    });
  }
}));

// ─── /api/analyze-text ───────────────────────────────────────────────────────
app.post("/api/audit/text", apiLimiter, asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 100) {
    return res.status(400).json({ error: "Text too short — paste at least 200 characters of solicitation content." });
  }
  const userId = req.headers["x-user-id"] || "anonymous";
  const userEmail = req.headers["x-user-email"] || "unknown";
  logger.info("text_audit_received", requestMeta(req, {
    chars: text.length,
    user_email: userEmail,
  }));
  const rawResult = await runAudit(text.trim(), { id: "TEXT_AUDIT", title: "Pasted Solicitation", agency: "Unknown", value: "0" });
  const result = toMvpAuditResult(rawResult);
  savePendingReport({
    uid: userId,
    user_email: userEmail,
    sam_url: null,
    solicitation_number: result.solicitation_number || null,
    title: result.title || "Pasted Solicitation",
    agency: result.agency || "Unknown",
    verdict: result.verdict?.recommendation || null,
    win_probability: result.verdict?.win_probability ?? null,
    audit_result: result,
  }).catch(() => {});
  res.json(result);
}));

// ─── /api/privacy/consent ────────────────────────────────────────────────────
app.get("/api/privacy/consent", asyncHandler(async (_req, res) => {
  res.json({ success: true, consent: null });
}));

app.post("/api/privacy/consent", asyncHandler(async (req, res) => {
  const { analytics, marketing, source } = req.body;
  logger.info("privacy_consent_updated", requestMeta(req, {
    source,
    analytics,
    marketing,
  }));
  res.json({ success: true, updated: new Date().toISOString() });
}));

// ─── /api/track ──────────────────────────────────────────────────────────────
app.post("/api/track", apiLimiter, asyncHandler(async (req, res) => {
  const { uid, event, value, page, metadata } = req.body;
  const success = await recordAnalyticsEvent({
    uid, eventType: event, value, page,
    path: metadata?.path || (page ? new URL(page).pathname : "/unknown"),
    metadata,
  });
  res.json({ success });
}));

// ─── GovCon AI Dashboard Endpoints ───────────────────────────────────────────

app.post("/api/matrix", asyncHandler(async (req, res) => {
  const { rfpText } = req.body;
  const response = await callLLM(
    "You are a senior federal compliance auditor. Extract a compliance matrix as a JSON array. Each item: { id, requirement, source, status, strategy }. Return STRICT JSON only.",
    `Analyze this RFP and extract the compliance matrix: ${rfpText?.substring(0, 15000)}`
  );
  try { res.json(JSON.parse(response)); } catch { res.json({ raw: response }); }
}));

app.post("/api/draft", asyncHandler(async (req, res) => {
  const { rfpText, companyInfo } = req.body;
  const draft = await callLLM(
    "You are a senior proposal writer for top-tier defense contractors.",
    `Draft an Executive Summary. Company: ${companyInfo}. RFP: ${rfpText?.substring(0, 10000)}`
  );
  res.json({ draft });
}));

// ─── /api/chat — stateless GovCon AI advisor ─────────────────────────────────
const ARIS_SYSTEM_PROMPT = `You are ARIS, a senior government contracting advisor with deep federal procurement expertise. You work inside BidSmith — an AI audit platform for companies that win government contracts.

## Your expertise
- FAR/DFARS clause interpretation (Parts 1–53)
- Proposal structure: Section C (SOW/PWS), Section L (instructions), Section M (evaluation)
- Bid/no-bid decision frameworks
- Small business programs: 8(a), WOSB, HUBZone, SDVOSB, SBA size standards
- CMMC, NIST SP 800-53, FedRAMP, ITAR/EAR compliance
- Price-to-win, competitive intelligence, incumbency indicators
- SAM.gov, USASpending.gov, FPDS navigation
- Teaming agreements, subcontracting, OTA vehicles

## How you respond
- Be a direct, senior advisor — not a chatbot. No fluff.
- When given a SAM.gov URL or solicitation text → immediately start analyzing
- When you lack context → ask ONE specific question at a time (never a list of questions)
- Keep answers under 300 words unless doing a full analysis
- Use bullet points for lists, bold for key terms
- Always end ambiguous situations with a single clear next-step question

## When SAM.gov or a link fails
Say exactly: "I couldn't pull that document automatically — that sometimes happens with NECO-hosted solicitations or restricted opportunities. Can you paste the solicitation number (e.g. W912DY-25-R-0001) or drop in the key text from the RFP?"

## Tone
Direct, confident, precise. Like a capture manager who has won $500M+ in federal contracts and charges $400/hr.

## Audit context (injected when available)
{AUDIT_CONTEXT}`;

app.post("/api/chat", asyncHandler(async (req, res) => {
  const { messages = [], auditContext = null, failedUrl = null } = req.body;

  if (!messages.length) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Build context block from prior audit result
  let auditBlock = "No audit loaded yet.";
  if (auditContext) {
    const v = auditContext.verdict || {};
    const reqs = Array.isArray(auditContext.requirements) ? auditContext.requirements : [];
    const risks = Array.isArray(auditContext.intelligence?.top_risks) ? auditContext.intelligence.top_risks : [];
    auditBlock = [
      `Solicitation: ${auditContext.solicitation_number || "Unknown"} — ${auditContext.title || ""}`,
      `Agency: ${auditContext.agency || "Unknown"}`,
      `Verdict: ${v.recommendation || "PENDING"} | Win probability: ${v.win_probability ?? "?"}%`,
      `Requirements extracted: ${reqs.length}`,
      risks.length ? `Top risks: ${risks.slice(0, 3).join("; ")}` : "",
      v.rationale ? `Rationale: ${v.rationale.slice(0, 300)}` : "",
      auditContext.executiveSummary ? `Summary: ${auditContext.executiveSummary.slice(0, 400)}` : "",
    ].filter(Boolean).join("\n");
  }

  // If a URL failed, prepend context to the last user message
  let threadMessages = [...messages];
  if (failedUrl && threadMessages.length) {
    const last = threadMessages[threadMessages.length - 1];
    if (last.role === "user") {
      threadMessages[threadMessages.length - 1] = {
        ...last,
        content: `[System note: The user submitted this SAM.gov URL but it could not be fetched automatically: ${failedUrl}]\n\n${last.content}`,
      };
    }
  }

  const systemPrompt = ARIS_SYSTEM_PROMPT.replace("{AUDIT_CONTEXT}", auditBlock);

  // Build the full conversation for the LLM
  const conversationText = threadMessages
    .map(m => `${m.role === "user" ? "User" : "ARIS"}: ${m.content}`)
    .join("\n\n");

  const text = await callLLM(systemPrompt, conversationText);
  res.json({ text, response: text });
}));

// ─── /api/chat/stream — SSE streaming GovCon advisor ─────────────────────────
app.post("/api/chat/stream", (req, res) => {
  const { messages = [], auditContext = null, failedUrl = null } = req.body;

  if (!messages.length) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Build audit context block (same as /api/chat)
  let auditBlock = "No audit loaded yet.";
  if (auditContext) {
    const v     = auditContext.verdict || {};
    const reqs  = Array.isArray(auditContext.requirements)             ? auditContext.requirements             : [];
    const risks = Array.isArray(auditContext.intelligence?.top_risks)  ? auditContext.intelligence.top_risks   : [];
    auditBlock = [
      `Solicitation: ${auditContext.solicitation_number || "Unknown"} — ${auditContext.title || ""}`,
      `Agency: ${auditContext.agency || "Unknown"}`,
      `Verdict: ${v.recommendation || "PENDING"} | Win probability: ${v.win_probability ?? "?"}%`,
      `Requirements extracted: ${reqs.length}`,
      risks.length ? `Top risks: ${risks.slice(0, 3).join("; ")}` : "",
      v.rationale ? `Rationale: ${v.rationale.slice(0, 300)}` : "",
      auditContext.executiveSummary ? `Summary: ${auditContext.executiveSummary.slice(0, 400)}` : "",
    ].filter(Boolean).join("\n");
  }

  let threadMessages = [...messages];
  if (failedUrl && threadMessages.length) {
    const last = threadMessages[threadMessages.length - 1];
    if (last.role === "user") {
      threadMessages[threadMessages.length - 1] = {
        ...last,
        content: `[System note: SAM.gov URL could not be fetched automatically: ${failedUrl}]\n\n${last.content}`,
      };
    }
  }

  const systemPrompt     = ARIS_SYSTEM_PROMPT.replace("{AUDIT_CONTEXT}", auditBlock);
  const conversationText = threadMessages
    .map(m => `${m.role === "user" ? "User" : "ARIS"}: ${m.content}`)
    .join("\n\n");

  const send = (chunk) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
  };

  const done = () => {
    if (!res.writableEnded) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  };

  // Handle client disconnect
  req.on("close", () => { if (!res.writableEnded) res.end(); });

  callLLMStream(systemPrompt, conversationText, {}, send, done).catch(err => {
    logger.error("chat_stream_error", { error: err.message });
    done();
  });
});

// ─── /api/chat/intent — detect if user input should trigger an audit ──────────
app.post("/api/chat/intent", asyncHandler(async (req, res) => {
  const { message = "" } = req.body;
  const lower = message.toLowerCase().trim();

  // SAM.gov URL
  const samUrl = lower.match(/https?:\/\/[^\s]*sam\.gov[^\s]*/)?.[0]
    || message.match(/https?:\/\/[^\s]*sam\.gov[^\s]*/)?.[0];

  // Direct PDF URL
  const pdfUrl = message.match(/https?:\/\/[^\s]+\.pdf[^\s]*/i)?.[0];

  // Solicitation number pattern (e.g. W912DY-25-R-0001, N00189-25-Q-Z001)
  const solNumMatch = message.match(/\b([A-Z]{1,6}[-][0-9]{2}[-][A-Z][-][A-Z0-9]{4})\b/i)?.[1];

  if (samUrl) return res.json({ intent: "audit_url", url: samUrl });
  if (pdfUrl) return res.json({ intent: "audit_pdf_url", url: pdfUrl });
  if (solNumMatch) return res.json({ intent: "solicitation_number", number: solNumMatch.toUpperCase() });
  if (lower.length > 300 && (lower.includes("shall") || lower.includes("contractor") || lower.includes("offeror"))) {
    return res.json({ intent: "audit_text" });
  }
  return res.json({ intent: "chat" });
}));

// ─── /api/admin/stats ────────────────────────────────────────────────────────
app.get("/api/admin/stats", asyncHandler(async (req, res) => {
  const stats = await getAdminStats();
  res.json(stats);
}));

// ─── /api/admin/pending-reports ──────────────────────────────────────────────
app.get("/api/admin/pending-reports", asyncHandler(async (req, res) => {
  const { status } = req.query;
  const reports = await getPendingReports(status || null);
  res.json({ reports });
}));

app.patch("/api/admin/pending-reports/:id/notes", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  await updateReportNotes(id, notes || "");
  res.json({ success: true });
}));

app.post("/api/admin/pending-reports/:id/send", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const report = await getPendingReportById(id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  if (!report.user_email || report.user_email === "unknown") {
    return res.status(400).json({ error: "No user email on record for this report" });
  }

  const a = report.audit_result || {};
  const verdict = report.verdict || a.verdict?.recommendation || "Review";
  const winProb = report.win_probability ?? a.verdict?.win_probability ?? 0;
  const agency = report.agency || a.agency || "Federal Agency";
  const title = report.title || a.title || "Federal Solicitation";
  const solNum = report.solicitation_number || a.solicitation_number || "—";
  const adminNotes = report.admin_notes ? `<p style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:8px;font-size:14px;color:#334155"><strong>Analyst Notes:</strong><br>${report.admin_notes.replace(/\n/g, "<br>")}</p>` : "";

  const verdictColor = verdict?.toLowerCase().includes("bid") ? "#16a34a" : verdict?.toLowerCase().includes("no") ? "#dc2626" : "#d97706";

  const emailSent = await sendEmail({
    to: report.user_email,
    subject: `Your BidSmith Audit Report — ${title}`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #e2e8f0">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
          <div style="width:40px;height:40px;background:#002244;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-weight:900;font-size:18px">B</span>
          </div>
          <div>
            <div style="font-weight:800;font-size:18px;color:#0f172a">BidSmith Audit Report</div>
            <div style="font-size:12px;color:#64748b">Reviewed by ARIS Labs</div>
          </div>
        </div>

        <h2 style="margin:0 0 4px;font-size:20px;color:#0f172a">${title}</h2>
        <p style="margin:0 0 24px;font-size:13px;color:#64748b">${agency} · ${solNum}</p>

        <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px;padding:16px;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Verdict</div>
            <div style="font-size:18px;font-weight:900;color:${verdictColor}">${verdict}</div>
          </div>
          <div style="flex:1;min-width:140px;padding:16px;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Win Probability</div>
            <div style="font-size:18px;font-weight:900;color:#2563eb">${winProb}%</div>
          </div>
        </div>

        ${a.executiveSummary ? `<div style="padding:16px;background:#f8fafc;border-radius:10px;margin-bottom:20px"><p style="margin:0;font-size:14px;color:#334155;line-height:1.7">${a.executiveSummary}</p></div>` : ""}

        ${adminNotes}

        ${report.sam_url ? `<div style="margin-top:20px"><a href="${report.sam_url}" style="color:#2563eb;font-size:13px">View on SAM.gov →</a></div>` : ""}

        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:12px;color:#94a3b8">This report was generated by BidSmith and reviewed by ARIS Labs. Questions? Reply to this email or visit <a href="https://bidsmith.pro" style="color:#2563eb">bidsmith.pro</a>.</p>
        </div>
      </div>
    `,
  }, { fatal: false });

  if (emailSent) {
    await markReportSent(id);
    res.json({ success: true, sent_to: report.user_email });
  } else {
    res.status(502).json({ error: "Email delivery failed — check SMTP configuration" });
  }
}));

// ─── /api/waitlist — public join ─────────────────────────────────────────────
app.post("/api/waitlist", asyncHandler(async (req, res) => {
  const { name, email, company, role, use_case, source } = req.body;
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Name and email are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  await addToWaitlist({ name: name.trim(), email: email.trim(), company, role, use_case, source });

  const firstName = name.split(' ')[0];
  const confirmationSent = await sendEmail({
    to: email.trim(),
    subject: "You're on the BidSmith early access list",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
          <span style="font-size:22px;font-weight:900;color:#0B3D91;letter-spacing:0.05em;font-family:'Georgia',serif">BIDSMITH</span>
          <span style="font-size:10px;font-weight:700;color:#7c3aed;background:#f3e8ff;padding:2px 8px;border-radius:20px">EARLY ACCESS</span>
        </div>
        <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px">You're in, ${firstName}.</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px">
          We've added you to the BidSmith early access list. You'll be among the first to get full access
          when we open — with a personal invite and a referral link to share with your network.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0">
          <p style="color:#0f172a;font-size:13px;font-weight:700;margin:0 0 8px">What BidSmith does:</p>
          <ul style="color:#475569;font-size:13px;line-height:1.7;margin:0;padding-left:18px">
            <li>Audits any SAM.gov solicitation in ~90 seconds</li>
            <li>Instant bid/no-bid recommendation with win probability</li>
            <li>Compliance matrix, hidden requirements, FAR/DFARS flags</li>
            <li>Price-to-win estimate and proposal roadmap</li>
          </ul>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:24px 0 0">
          Questions? Reply to this email — Sid reads every one.<br>
          <a href="https://bidsmith.pro" style="color:#0B3D91">bidsmith.pro</a>
        </p>
      </div>
    `,
  });

  if (confirmationSent) {
    logger.info("waitlist_confirmation_sent", requestMeta(req, { email }));
  } else {
    logger.warn("waitlist_confirmation_failed", requestMeta(req, { email }));
  }

  res.json({
    success: true,
    confirmationSent,
    message: confirmationSent
      ? "You're on the list. Check your inbox."
      : "You're on the list. Confirmation email is delayed right now.",
  });

  sendEmail({
    from: `"BidSmith Waitlist" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: process.env.CONTACT_TO || "sid@bidsmith.pro",
    subject: `🎯 New signup — ${company || name}`,
    html: `<p><b>${name}</b> (${email}) from <b>${company || "—"}</b> just joined the waitlist.<br>Role: ${role || "—"}<br>Use case: ${use_case || "—"}</p>`,
  });
}));

// ─── /api/waitlist/list — admin only ─────────────────────────────────────────
app.get("/api/waitlist/list", asyncHandler(async (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const [entries, stats] = await Promise.all([getWaitlist(), getWaitlistStats()]);
  res.json({ entries, stats });
}));

// ─── /api/waitlist/invite — mark invited + send email ────────────────────────
app.post("/api/waitlist/invite", asyncHandler(async (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { ids, custom_message } = req.body;
  if (!ids?.length) return res.status(400).json({ error: "No IDs provided" });

  const entries = await getWaitlist();
  const targets = entries.filter(e => ids.includes(e.id));
  await markInvited(ids);

  let sent = 0;
  for (const entry of targets) {
    const ok = await sendEmail({
      from: `"Sid @ BidSmith" <${process.env.SMTP_USER}>`,
      to: entry.email,
      subject: "Your BidSmith access is ready",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff">
          <span style="font-size:22px;font-weight:900;color:#0B3D91;letter-spacing:0.05em;font-family:'Georgia',serif">BIDSMITH</span>
          <h2 style="color:#0f172a;font-size:20px;margin:24px 0 12px">Your access is ready, ${entry.name.split(' ')[0]}.</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">
            ${custom_message || "You're one of the first people to get access to BidSmith — the AI audit engine for government contractors. Go ahead and run your first audit."}
          </p>
          <a href="https://bidsmith.pro/app" style="display:inline-block;background:#002244;color:white;padding:14px 28px;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none;margin-bottom:24px">
            Open BidSmith →
          </a>
          <p style="color:#64748b;font-size:13px;line-height:1.6">
            Share with a colleague:<br>
            <a href="https://bidsmith.pro/app?ref=${entry.id.slice(0,8)}" style="color:#0B3D91;font-weight:600">bidsmith.pro/app?ref=${entry.id.slice(0,8)}</a>
          </p>
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0">Reply to this email with any questions — Sid reads every one.</p>
        </div>
      `,
    });
    if (ok) sent++;
  }

  res.json({ success: true, sent, total: targets.length });
}));

// ─── /api/audit/link ─────────────────────────────────────────────────────────
app.post("/api/audit/link", apiLimiter, asyncHandler(async (req, res) => {
  const { url } = req.body;
  const userId    = req.headers["x-user-id"] || "anonymous";
  const userEmail = req.headers["x-user-email"] || "unknown";
  const t0        = Date.now();

  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ error: "URL is required", code: 400 });
  }

  const normalized = url.toLowerCase().trim();

  // ── Cache check (24h TTL) ─────────────────────────────────────────────────
  const cachedResult = await getAuditCache(normalized);
  if (cachedResult) {
    logger.info("audit_cache_served", requestMeta(req, {
      url: normalized.slice(0, 120),
      solicitation_id: cachedResult.solicitation_number || cachedResult.id,
    }));
    return res.json({
      ...cachedResult,
      meta: { ...(cachedResult.meta || {}), cache_hit: true, cache_served_at: new Date().toISOString() },
    });
  }

  let solicitationText = "";
  let meta = { id: "LINK_AUDIT", title: "Federal Solicitation", agency: "Federal Agency", value: "0" };

  // ── Stage 1: Retrieval (URL → raw text) ──────────────────────────────────
  logger.info("audit_stage", requestMeta(req, {
    stage: "1_retrieval", source: "link", url: normalized.slice(0, 120),
  }));

  if (normalized.includes("sam.gov")) {
    try {
      const { text, meta: samMeta } = await fetchSolicitationText(url);
      solicitationText = text;
      meta = samMeta;
    } catch (samErr) {
      logger.warn("audit_stage_error", requestMeta(req, {
        stage: "1_retrieval", source: "sam.gov",
        url: normalized.slice(0, 120), error: samErr.message,
      }));
      if (samErr.code === "EXTERNAL_DOCUMENTS") {
        return res.status(422).json({
          error: samErr.message,
          hint: samErr.hint,
          externalLinks: samErr.externalLinks || [],
          canRetryWithFile: true,
          code: "EXTERNAL_DOCUMENTS",
        });
      }
      return res.status(422).json({
        error: samErr.message.includes("SAM_RATE_LIMIT")
          ? "SAM.gov rate limit hit — wait 60 seconds and try again."
          : "Could not fetch this SAM.gov opportunity. The opportunity may be closed or restricted.",
        hint: "Copy the solicitation text from SAM.gov and paste it into the text tab.",
        canRetryWithText: true,
        code: 422,
      });
    }

    if (!solicitationText) {
      return res.status(422).json({
        error: "SAM.gov returned no solicitation text for this opportunity.",
        hint: "Copy the solicitation text from SAM.gov and paste it into the text tab.",
        canRetryWithText: true,
        code: 422,
      });
    }
  } else if (normalized.endsWith(".pdf")) {
    try {
      const pdfRes = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
      if (!pdfRes.ok) {
        return res.status(502).json({
          error: `Remote PDF download failed (HTTP ${pdfRes.status}). Check the URL and try again.`,
          code: 502,
        });
      }
      const buffer  = Buffer.from(await pdfRes.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      solicitationText = pdfData.text?.trim();
      meta = { id: "PDF_LINK", title: url.split("/").pop() || "Remote PDF", agency: "Unknown", value: "0" };
    } catch (pdfErr) {
      logger.warn("audit_stage_error", requestMeta(req, {
        stage: "1_retrieval", source: "pdf_url",
        url: normalized.slice(0, 120), error: pdfErr.message,
      }));
      return res.status(422).json({
        error: "Could not download or parse the PDF from this URL.",
        code: 422,
      });
    }
  } else {
    return res.status(400).json({
      error: "Unsupported URL. Provide a SAM.gov opportunity link or a direct PDF URL.",
      code: 400,
    });
  }

  if (!solicitationText || solicitationText.length < 50) {
    return res.status(422).json({
      error: "Could not extract usable text from the provided URL.",
      code: 422,
    });
  }

  logger.info("audit_stage", requestMeta(req, {
    stage: "1_retrieval", status: "ok",
    solicitation_id: meta.id, chars: solicitationText.length,
    elapsed_ms: Date.now() - t0,
  }));

  // ── Stage 2: Chunking ─────────────────────────────────────────────────────
  const t1 = Date.now();
  logger.info("audit_stage", requestMeta(req, {
    stage: "2_chunking", chars: solicitationText.length,
    estimated_chunks: Math.ceil(solicitationText.length / 4000),
  }));

  logger.info("audit_stage", requestMeta(req, {
    stage: "2_chunking", status: "ok", elapsed_ms: Date.now() - t1,
  }));

  // ── Stage 3: Inference ────────────────────────────────────────────────────
  const t2 = Date.now();
  logger.info("audit_stage", requestMeta(req, {
    stage: "3_inference", model: "coordinator",
    solicitation_id: meta.id, source: "link",
  }));

  try {
    const rawResult = await runAudit(solicitationText, meta);
    const result    = toMvpAuditResult(rawResult);

    logger.info("audit_stage", requestMeta(req, {
      stage: "3_inference", status: "ok",
      verdict: result.verdict?.recommendation,
      win_prob: result.verdict?.win_probability,
      req_count: Array.isArray(rawResult?.requirements) ? rawResult.requirements.length : 0,
      elapsed_ms: Date.now() - t2,
      total_ms: Date.now() - t0,
    }));

    savePendingReport({
      uid: userId, user_email: userEmail,
      sam_url: url,
      solicitation_number: result.solicitation_number || meta.id || null,
      title: result.title || meta.title || null,
      agency: result.agency || meta.agency || null,
      verdict: result.verdict?.recommendation || null,
      win_probability: result.verdict?.win_probability ?? null,
      audit_result: result,
    }).catch(() => {});

    // Store in cache for next 24h — fire and forget
    setAuditCache(normalized, result).catch(() => {});

    return res.json(result);
  } catch (err) {
    logger.error("audit_stage_error", requestMeta(req, {
      stage: "3_inference", source: "link",
      solicitation_id: meta.id, error: err.message,
      stack: err.stack?.split("\n")[1],
      elapsed_ms: Date.now() - t2,
    }));
    return res.status(500).json({
      error: "Inference pipeline failed. Please try again or contact support.",
      code: 500,
    });
  }
}));

// ─── /api/create-dynamic-checkout-session ────────────────────────────────────
app.post("/api/create-dynamic-checkout-session", apiLimiter, asyncHandler(async (req, res) => {
  const { estimatedValue, opportunityTitle } = req.body;
  const origin = req.headers.origin || `https://${req.headers.host}` || "https://bidsmith.pro";
  const session = await createDynamicCheckoutSession({ estimatedValue, opportunityTitle, origin });
  res.json({ url: session.url, sessionId: session.id });
}));

// ─── /api/export-rtm ─────────────────────────────────────────────────────────
app.post("/api/export", asyncHandler(async (req, res) => {
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

// ─── /api/contact ────────────────────────────────────────────────────────────
app.post("/api/contact", asyncHandler(async (req, res) => {
  const { name, email, service, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  await sendEmail({
    from: `"ARIS Contact" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_TO || "sid@bidsmith.pro",
    replyTo: email,
    subject: `New Contact: ${name} — ${service || "General Inquiry"}`,
    text: `Name: ${name}\nEmail: ${email}\nService: ${service || "N/A"}\n\n${message}`,
  }, { fatal: true });

  res.json({ ok: true });
}));

// ─── /api/audits — save + retrieve audit history ─────────────────────────────
// uid comes from Supabase auth token header (X-User-Id) or falls back to anonymous
app.post("/api/audits", asyncHandler(async (req, res) => {
  const uid = req.headers["x-user-id"] || req.body.uid;
  if (!uid) return res.status(400).json({ error: "x-user-id header required" });
  const { result } = req.body;
  if (!result) return res.status(400).json({ error: "result body required" });

  const saved = await saveAudit(uid, result);
  if (!saved) return res.status(503).json({ error: "Database unavailable" });
  res.json({ ok: true, id: saved.id, created_at: saved.created_at });
}));

app.get("/api/audits", asyncHandler(async (req, res) => {
  const uid = req.headers["x-user-id"];
  if (!uid) return res.status(400).json({ error: "x-user-id header required" });
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);

  const rows = await getAuditHistory(uid, limit);
  res.json({ audits: rows });
}));

app.get("/api/audits/:id", asyncHandler(async (req, res) => {
  const uid = req.headers["x-user-id"];
  if (!uid) return res.status(400).json({ error: "x-user-id header required" });

  const audit = await getAuditById(req.params.id, uid);
  if (!audit) return res.status(404).json({ error: "Audit not found" });
  res.json(audit);
}));

app.get("*", (req, res) => res.sendFile(join(__dirname, "../dist/index.html")));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info("api_started", {
    service: "bidsmith-api",
    port: PORT,
    node_env: process.env.NODE_ENV || "development",
    trust_proxy: trustProxySetting,
  });
});
