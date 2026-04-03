/**
 * SAM.gov Service — Direct HTTP, no subprocess.
 *
 * Two fetch paths:
 *   1. v3 internal path (no API key needed) — uses URL UUID to get attachments
 *   2. v2 search API (SAM_API_KEY required) — fallback for non-standard URLs
 *
 * PDF downloads go through SAM.gov CDN (no auth needed for public attachments).
 */

import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { logger } from "../utils/logger.js";

const SAM_API_KEY = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;
const SAM_BASE    = "https://api.sam.gov/opportunities/v2";
const SAM_V3_BASE = "https://sam.gov/api/prod/opps/v3";

// ─── URL parsing ──────────────────────────────────────────────────────────────

export function parseNoticeId(url) {
  // /workspace/contract/opp/{uuid}/view  — internal frontend UUID
  const workspace = url.match(/\/opp\/([a-f0-9]{32})(?:\/|$)/i);
  if (workspace) return { id: workspace[1], type: "uuid" };

  // Standard noticeid UUID in path
  const path = url.match(/\/opp\/([a-f0-9]+)/i);
  if (path) return { id: path[1], type: "uuid" };

  // ?noticeId= query param
  const qs = url.match(/[?&]noticeId=([^&]+)/i);
  if (qs) return { id: qs[1], type: "noticeid" };

  return null;
}

// ─── v3 path: fetch resources via SAM.gov internal API (no auth needed) ──────

async function fetchViaV3(uuid) {
  const res = await fetch(
    `${SAM_V3_BASE}/opportunities/${uuid}/resources`,
    {
      headers: { Accept: "application/hal+json" },
      signal: AbortSignal.timeout(15_000),
    }
  );

  if (!res.ok) throw new Error(`SAM v3 HTTP ${res.status}`);

  const data = await res.json();
  const attachments = data?._embedded?.opportunityAttachmentList?.[0]?.attachments || [];

  if (attachments.length === 0) throw new Error("No attachments found via v3 API");

  // Score and pick best PDF
  const pdfs = attachments
    .filter(a => a.mimeType === ".pdf" && a.accessLevel === "public" && a.deletedFlag === "0")
    .map(a => ({ ...a, score: scoreFilename(a.name) }))
    .sort((a, b) => b.score - a.score);

  if (pdfs.length === 0) throw new Error("No public PDF attachments found");

  // Try top 3 PDFs
  for (const pdf of pdfs.slice(0, 3)) {
    const downloadUrl = `${SAM_V3_BASE}/opportunities/resources/files/${pdf.resourceId}/download`;
    try {
      const text = await downloadAndParsePdf(downloadUrl);
      if (text && text.length > 200) {
        logger.info("sam_gov_pdf_selected", {
          path: "v3",
          filename: pdf.name,
          chars: text.length,
        });
        return {
          text,
          meta: {
            id: uuid,
            title: "Federal Solicitation",
            agency: "Federal Agency",
            value: "0",
          }
        };
      }
    } catch (err) {
      logger.warn("sam_gov_pdf_parse_failed", {
        path: "v3",
        filename: pdf.name,
        error: err.message,
      });
    }
  }

  throw new Error("Could not extract text from any PDF attachments");
}

// ─── v2 search API path (SAM_API_KEY required) ────────────────────────────────

export async function getOpportunity(noticeId) {
  if (!SAM_API_KEY) throw new Error("SAM_API_KEY not configured");

  const res = await fetch(
    `${SAM_BASE}/search?noticeid=${noticeId}&limit=1&api_key=${SAM_API_KEY}`,
    { signal: AbortSignal.timeout(15_000) }
  );

  if (res.status === 429) throw new Error("SAM_RATE_LIMIT");
  if (!res.ok) throw new Error(`SAM.gov HTTP ${res.status}`);

  const data = await res.json();
  const opp = data?.opportunitiesData?.[0];
  if (!opp) throw new Error("Opportunity not found on SAM.gov");
  return opp;
}

// ─── Attachment download helpers ──────────────────────────────────────────────

function scoreFilename(name = "") {
  const n = name.toLowerCase();
  let score = 0;
  if (/solicitation|combined|rfp|sol_|sol-/.test(n)) score += 50;
  if (/statement.of.work|sow/.test(n)) score += 40;
  if (/performance.work.statement|pws/.test(n)) score += 30;
  if (/amendment|amd/.test(n)) score -= 10;
  if (/qa|questions|q.*a/.test(n)) score -= 20;
  if (/wage.determination|exhibit|map|coordinates|landfill/.test(n)) score -= 60;
  if (/attachment_\d+/.test(n) && /statement/i.test(n)) score += 20;
  return score;
}

async function downloadAndParsePdf(url) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`PDF HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return parsed.text?.trim() || "";
}

async function resolveFilename(url) {
  try {
    const sep = url.includes("?") ? "&" : "?";
    const full = SAM_API_KEY && !url.includes("api_key")
      ? `${url}${sep}api_key=${SAM_API_KEY}`
      : url;
    const res = await fetch(full, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
    });
    const disp = res.headers.get("content-disposition") || "";
    const loc  = decodeURIComponent(res.headers.get("location") || "");
    const m = disp.match(/filename[^;=\n]*=["']?([^"'\n]+)/i) ||
              loc.match(/filename=([^&]+)/);
    return m?.[1]?.trim() || url.split("/").pop();
  } catch {
    return url.split("/").pop();
  }
}

export async function downloadBestSolicitation(links) {
  if (!links?.length) return "";

  const sample = links.slice(0, 15);
  const scored = await Promise.all(
    sample.map(async (url) => {
      const name = await resolveFilename(url);
      return { url, name, score: scoreFilename(name) };
    })
  );
  scored.sort((a, b) => b.score - a.score);

  const candidates = scored.filter(r => /\.pdf$/i.test(r.name)).slice(0, 3);

  for (const { url, name } of candidates) {
    try {
      const downloadUrl = SAM_API_KEY && !url.includes("api_key")
        ? `${url}${url.includes("?") ? "&" : "?"}api_key=${SAM_API_KEY}`
        : url;
      const text = await downloadAndParsePdf(downloadUrl);
      if (text && text.length > 200) {
        logger.info("sam_gov_pdf_selected", {
          path: "v2",
          filename: name,
          chars: text.length,
        });
        return text;
      }
    } catch (err) {
      logger.warn("sam_gov_pdf_parse_failed", {
        path: "v2",
        filename: name,
        error: err.message,
      });
    }
  }

  return "";
}

// ─── Main entrypoint ──────────────────────────────────────────────────────────

export async function fetchSolicitationText(url) {
  const parsed = parseNoticeId(url);
  if (!parsed) throw new Error("Could not parse a notice ID from the URL");

  const { id } = parsed;

  // Path 1: v3 internal API — works with URL UUID, no auth needed for public PDFs
  try {
    const result = await fetchViaV3(id);
    if (result.text) return result;
  } catch (v3Err) {
    logger.info("sam_gov_v3_fallback", {
      notice_id: id,
      error: v3Err.message,
    });
  }

  // Path 2: v2 search API (needs SAM_API_KEY)
  if (!SAM_API_KEY) {
    throw new Error("SAM.gov v3 path failed and no SAM_API_KEY configured");
  }

  const opp = await getOpportunity(id);

  const meta = {
    id:     opp.solicitationNumber || opp.noticeId || id,
    title:  opp.title || "Federal Solicitation",
    agency: opp.fullParentPathName || opp.departmentName || opp.subtierName || "Federal Agency",
    value:  opp.award?.amount || opp.totalBaseAndAllOptionsValue || "0",
  };

  const links = (opp.resourceLinks || [])
    .map(r => (typeof r === "string" ? r : r?.url))
    .filter(Boolean);

  let text = await downloadBestSolicitation(links);

  if (!text && opp.description) {
    text = opp.description;
    logger.info("sam_gov_description_fallback", {
      notice_id: meta.id,
      chars: text.length,
    });
  }

  return { text, meta };
}
