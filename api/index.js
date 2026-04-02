// ⚡ ARIS_SOVEREIGN_HEARTBEAT: 2026-03-26T21:20:00Z
import "dotenv/config";

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { sendEmail } from "./utils/mailer.js";

// Stateless Utils & Infrastructure
import { traceLLM } from "./utils/tracing.js";
import { callLLM } from "./llm/openrouter.js";

// Services
import { createDynamicCheckoutSession } from "./services/stripe.js";
import { recordAnalyticsEvent, getAdminStats } from "./services/analytics.js";
import { fetchSolicitationText } from "./services/samGov.js";
import { runAudit } from "./agents/auditPipeline.js";
import { sovereignSearch } from "./services/fedSearch.js";
import { addToWaitlist, getWaitlist, getWaitlistStats, markInvited } from "./services/waitlist.js";

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
app.use(express.static(join(__dirname, "../dist")));

// Multer for memory upload
const upload = multer({ storage: multer.memoryStorage() });

// ─── /api/analyze-pdf ────────────────────────────────────────────────────────
app.post("/api/analyze-pdf", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const data = await pdfParse(req.file.buffer);
  const rfpText = data.text?.trim();

  if (!rfpText || rfpText.length < 100) {
    return res.status(422).json({ error: "Could not extract readable text from this PDF." });
  }

  console.log(`[PDF_AUDIT] ${req.file.originalname} — ${rfpText.length} chars`);

  const result = await runAudit(rfpText, {
    id: req.file.originalname.replace(/\.pdf$/i, ""),
    title: req.file.originalname,
    agency: "Extracted from PDF",
    value: "0",
  });

  res.json(result);
}));

// ─── /api/analyze-text ───────────────────────────────────────────────────────
app.post("/api/analyze-text", apiLimiter, asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 100) {
    return res.status(400).json({ error: "Text too short — paste at least 200 characters of solicitation content." });
  }
  console.log(`[TEXT_AUDIT] ${text.length} chars`);
  const result = await runAudit(text.trim(), { id: "TEXT_AUDIT", title: "Pasted Solicitation", agency: "Unknown", value: "0" });
  res.json(result);
}));

// ─── /api/privacy/consent ────────────────────────────────────────────────────
app.get("/api/privacy/consent", asyncHandler(async (_req, res) => {
  res.json({ success: true, consent: null });
}));

app.post("/api/privacy/consent", asyncHandler(async (req, res) => {
  const { analytics, marketing, source } = req.body;
  console.log(`[PRIVACY] Consent update from ${source}: analytics=${analytics}, marketing=${marketing}`);
  res.json({ success: true, updated: new Date().toISOString() });
}));

// ─── Sovereign Discovery Harvester ───────────────────────────────────────────

const DISCOVERY_SEEDS = [
  "Artificial Intelligence", "Generative AI", "Cybersecurity", "Zero Trust",
  "Petroleum", "Oil & Gas", "Energy Security", "Land Acquisition",
  "Defense Procurement", "Weapon Systems", "Military Logistics",
];

let lastHarvestTime = 0;
const HARVEST_INTERVAL = 12 * 60 * 60 * 1000;
const SAM_API_KEY = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;

async function startHarvester() {
  if (!SAM_API_KEY) return;
  const pulse = async () => {
    try {
      const now = Date.now();
      if (now - lastHarvestTime < 10 * 60 * 1000) return;
      for (const seed of DISCOVERY_SEEDS) {
        try {
          const res = await fetch(
            `https://api.sam.gov/opportunities/v2/search?q=${encodeURIComponent(seed)}&limit=30&api_key=${SAM_API_KEY}`,
            { signal: AbortSignal.timeout(15_000) }
          );
          if (res.ok) {
            const data = await res.json();
            const opportunities = data?.opportunitiesData || [];
            if (opportunities.length > 0) await sovereignSearch.syncSovereignTable(opportunities, "US");
          }
        } catch (err) { console.warn(`[HARVESTER] SAM failed for "${seed}":`, err.message); }
        await new Promise(r => setTimeout(r, 15000));
      }
      lastHarvestTime = Date.now();
    } catch (err) { console.error("[HARVESTER] failure:", err.message); }
  };
  setInterval(pulse, HARVEST_INTERVAL);
}
startHarvester();

// ─── /api/fed-search ─────────────────────────────────────────────────────────
app.post("/api/fed-search", apiLimiter, asyncHandler(async (req, res) => {
  const { query, limit = 20, expand = true } = req.body;
  try {
    const { results, correction } = await sovereignSearch.search(query, expand);
    res.json({ success: true, query, results: results.slice(0, limit), correction, version: "v4.1" });
  } catch (err) {
    console.error(`[SEARCH_ERROR] ${err.message}`, err.stack);
    res.status(500).json({ success: false, error: err.message });
  }
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

app.post("/api/govcon/generate-matrix", asyncHandler(async (req, res) => {
  const { rfpText } = req.body;
  const response = await callLLM(
    "You are a senior federal compliance auditor. Extract a compliance matrix as a JSON array. Each item: { id, requirement, source, status, strategy }. Return STRICT JSON only.",
    `Analyze this RFP and extract the compliance matrix: ${rfpText?.substring(0, 15000)}`
  );
  try { res.json(JSON.parse(response)); } catch { res.json({ raw: response }); }
}));

app.post("/api/govcon/draft-proposal", asyncHandler(async (req, res) => {
  const { rfpText, companyInfo } = req.body;
  const draft = await callLLM(
    "You are a senior proposal writer for top-tier defense contractors.",
    `Draft an Executive Summary. Company: ${companyInfo}. RFP: ${rfpText?.substring(0, 10000)}`
  );
  res.json({ draft });
}));

app.post("/api/govcon/chat", asyncHandler(async (req, res) => {
  const { messages, context } = req.body;
  const userMessage = messages[messages.length - 1].content || messages[messages.length - 1].text;
  const text = await callLLM(
    `You are GovCon AI, a specialized federal contracting assistant. RFP context: ${context?.substring(0, 5000)}`,
    userMessage
  );
  res.json({ text, response: text });
}));

// ─── /api/admin/stats ────────────────────────────────────────────────────────
app.get("/api/admin/stats", asyncHandler(async (req, res) => {
  const stats = await getAdminStats();
  res.json(stats);
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

  // ── Respond immediately — don't block on email delivery ─────────────────
  // Email is fire-and-forget. SMTP timeouts were causing the form to hang.
  res.json({ success: true, message: "You're on the list. Check your inbox." });

  // Send emails in background (non-blocking)
  const firstName = name.split(' ')[0];
  sendEmail({
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
  }).then(ok => ok && console.log(`[WAITLIST] Confirmation sent to ${email}`));

  sendEmail({
    from: `"BidSmith Waitlist" <${process.env.SMTP_USER}>`,
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

// ─── /api/analyze-link ───────────────────────────────────────────────────────
app.post("/api/analyze-link", apiLimiter, asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const normalized = url.toLowerCase().trim();
  let solicitationText = "";
  let meta = { id: "LINK_AUDIT", title: "Federal Solicitation", agency: "Federal Agency", value: "0" };

  if (normalized.includes("sam.gov")) {
    try {
      const { text, meta: samMeta } = await fetchSolicitationText(url);
      solicitationText = text;
      meta = samMeta;
    } catch (samErr) {
      console.error(`[LINK_AUDIT] SAM.gov fetch failed: ${samErr.message}`);
      return res.status(422).json({
        error: samErr.message.includes("SAM_RATE_LIMIT")
          ? "SAM.gov rate limit hit — wait 60 seconds and try again."
          : "Could not fetch this SAM.gov opportunity. The opportunity may be closed or restricted.",
        hint: "Switch to the 'Paste RFP Text' tab — copy the solicitation text from SAM.gov and paste it directly.",
        canRetryWithText: true,
      });
    }

    if (!solicitationText) {
      return res.status(422).json({
        error: "SAM.gov returned no solicitation text for this opportunity.",
        hint: "Switch to the 'Paste RFP Text' tab and paste the solicitation text directly.",
        canRetryWithText: true,
      });
    }
  } else if (normalized.endsWith(".pdf")) {
    const pdfRes = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!pdfRes.ok) return res.status(502).json({ error: `PDF download failed: HTTP ${pdfRes.status}` });
    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    solicitationText = pdfData.text?.trim();
    meta = { id: "PDF_LINK", title: url.split("/").pop(), agency: "Unknown", value: "0" };
  } else {
    return res.status(400).json({ error: "Unsupported URL. Provide a SAM.gov link or direct PDF URL." });
  }

  if (!solicitationText || solicitationText.length < 50) {
    return res.status(422).json({ error: "Could not extract usable text from the provided URL." });
  }

  console.log(`[LINK_AUDIT] ${meta.id} — ${solicitationText.length} chars`);
  const result = await runAudit(solicitationText, meta);
  res.json(result);
}));

// ─── /api/create-dynamic-checkout-session ────────────────────────────────────
app.post("/api/create-dynamic-checkout-session", apiLimiter, asyncHandler(async (req, res) => {
  const { estimatedValue, opportunityTitle } = req.body;
  const origin = req.headers.origin || `https://${req.headers.host}` || "https://bidsmith.pro";
  const session = await createDynamicCheckoutSession({ estimatedValue, opportunityTitle, origin });
  res.json({ url: session.url, sessionId: session.id });
}));

// ─── /api/export-rtm ─────────────────────────────────────────────────────────
app.post("/api/export-rtm", asyncHandler(async (req, res) => {
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

app.get("*", (req, res) => res.sendFile(join(__dirname, "../dist/index.html")));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`✅ BidSmith API v2.3 -> http://localhost:${PORT}`));
