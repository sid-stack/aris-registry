/**
 * SAM.gov Service — Direct HTTP, no subprocess.
 *
 * Replaces the MCP stdio subprocess which failed silently on Railway.
 * All network calls are direct fetch() with explicit timeouts.
 */

import pdfParse from "pdf-parse/lib/pdf-parse.js";

const SAM_API_KEY = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;
const SAM_BASE = "https://api.sam.gov/opportunities/v2";

// ─── URL parsing ──────────────────────────────────────────────────────────────

export function parseNoticeId(url) {
  const uuid = url.match(/\/opp\/([a-f0-9]{32})/i);
  if (uuid) return uuid[1];
  const hex = url.match(/\/opp\/([a-f0-9]+)/i);
  if (hex) return hex[1];
  const qs = url.match(/[?&]noticeId=([^&]+)/i);
  if (qs) return qs[1];
  return null;
}

// ─── Opportunity metadata ─────────────────────────────────────────────────────

export async function getOpportunity(noticeId) {
  if (!SAM_API_KEY) throw new Error("SAM_API_KEY not set in environment");

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

// ─── Attachment download ──────────────────────────────────────────────────────

function scoreFilename(name = "") {
  const n = name.toLowerCase();
  let score = 0;
  if (/solicitation|combined|rfp|sol_|sol-/.test(n)) score += 50;
  if (/statement.of.work|sow/.test(n)) score += 40;
  if (/performance.work.statement|pws/.test(n)) score += 30;
  if (/amendment|amd|qa|questions/.test(n)) score -= 20;
  if (/wage.determination|exhibit/.test(n)) score -= 60;
  return score;
}

async function resolveFilename(url) {
  try {
    const sep = url.includes("?") ? "&" : "?";
    const full = url.includes("api_key") ? url : `${url}${sep}api_key=${SAM_API_KEY}`;
    const res = await fetch(full, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
    });
    const disp = res.headers.get("content-disposition") || "";
    const loc = decodeURIComponent(res.headers.get("location") || "");
    const m = disp.match(/filename[^;=\n]*=["']?([^"'\n]+)/i) ||
              loc.match(/filename=([^&]+)/);
    return m?.[1]?.trim() || url.split("/").pop();
  } catch {
    return url.split("/").pop();
  }
}

/**
 * Given an array of attachment URLs, find the best PDF solicitation and
 * return its extracted text. Returns "" if nothing useful found.
 */
export async function downloadBestSolicitation(links) {
  if (!links?.length) return "";

  // Score all links concurrently (cap at 15 to avoid flooding SAM)
  const sample = links.slice(0, 15);
  const scored = await Promise.all(
    sample.map(async (url) => {
      const name = await resolveFilename(url);
      return { url, name, score: scoreFilename(name) };
    })
  );

  scored.sort((a, b) => b.score - a.score);

  // Try the top 3 scoring PDFs until one parses successfully
  const candidates = scored.filter((r) => /\.pdf$/i.test(r.name)).slice(0, 3);

  for (const { url, name } of candidates) {
    try {
      const downloadUrl = url.includes("api_key")
        ? url
        : `${url}?api_key=${SAM_API_KEY}`;

      const res = await fetch(downloadUrl, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) continue;

      const buffer = Buffer.from(await res.arrayBuffer());
      const parsed = await pdfParse(buffer);
      const text = parsed.text?.trim();

      if (text && text.length > 200) {
        console.log(`[SAM_GOV] ✓ Downloaded & parsed: ${name} (${text.length} chars)`);
        return text;
      }
    } catch (err) {
      console.warn(`[SAM_GOV] ✗ Failed to parse ${name}: ${err.message}`);
    }
  }

  return "";
}

// ─── Main entrypoint ──────────────────────────────────────────────────────────

/**
 * Fetch the best available solicitation text for a SAM.gov URL.
 *
 * Priority:
 *   1. Downloaded PDF attachments (best quality)
 *   2. opp.description (fallback — often just an abstract)
 *
 * @returns {{ text: string, meta: object }}
 */
export async function fetchSolicitationText(url) {
  const noticeId = parseNoticeId(url);
  if (!noticeId) throw new Error("Could not parse a notice ID from the URL");

  const opp = await getOpportunity(noticeId);

  const meta = {
    id: opp.solicitationNumber || opp.noticeId || noticeId,
    title: opp.title || "Federal Solicitation",
    agency:
      opp.fullParentPathName ||
      opp.departmentName ||
      opp.subtierName ||
      "Federal Agency",
    value:
      opp.award?.amount ||
      opp.totalBaseAndAllOptionsValue ||
      "0",
  };

  // Build attachment URL list
  const links = (opp.resourceLinks || [])
    .map((r) => (typeof r === "string" ? r : r?.url))
    .filter(Boolean);

  // Try PDF download first
  let text = await downloadBestSolicitation(links);

  // Fall back to description
  if (!text && opp.description) {
    text = opp.description;
    console.log(`[SAM_GOV] Using description fallback (${text.length} chars)`);
  }

  return { text, meta };
}
