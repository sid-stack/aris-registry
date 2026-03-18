import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const FDIC_REPORT_CANDIDATE_PATHS = [
  join(PROJECT_ROOT, "FDIC_Risk_Summary_Report.html"),
  join(PROJECT_ROOT, "public", "FDIC_Risk_Summary_Report.html"),
];

const DEFAULT_FDIC_RSS_URL = process.env.FDIC_RSS_URL || "https://www.fdic.gov/news/rss.xml";
const DEFAULT_NEWS_CACHE_TTL_MS = Number(process.env.NEWS_INSIGHTS_CACHE_TTL_MS || 5 * 60 * 1000);

let newsInsightsCache = {
  ts: 0,
  data: [],
};

function toISODate(dateLike) {
  if (!dateLike) return null;
  const dt = new Date(dateLike);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

function stripTagValue(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function pickStaticReportPath(customPath = "") {
  if (customPath) return customPath;
  return FDIC_REPORT_CANDIDATE_PATHS.find((path) => existsSync(path)) || FDIC_REPORT_CANDIDATE_PATHS[0];
}

export function extractStaticHeadlines({ html = "", htmlPath = "", maxItems = 8 } = {}) {
  let sourceHtml = html;
  if (!sourceHtml) {
    const resolvedPath = pickStaticReportPath(htmlPath);
    if (!existsSync(resolvedPath)) return [];
    sourceHtml = readFileSync(resolvedPath, "utf8");
  }

  const matches = [...sourceHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  return matches.slice(0, maxItems).map((match, index) => ({
    id: `fdic-static-${index + 1}`,
    title: stripTagValue(match[1]),
    source: "FDIC Report",
    date: null,
    url: undefined,
  }));
}

export async function fetchRssFeed({ rssXml = "", url = DEFAULT_FDIC_RSS_URL, maxItems = 8, fetchImpl = fetch } = {}) {
  let xml = rssXml;
  if (!xml) {
    const response = await fetchImpl(url);
    if (!response?.ok) {
      const status = response?.status || "unknown";
      throw new Error(`FDIC RSS fetch failed (${status})`);
    }
    xml = await response.text();
  }

  const itemBlocks = [...String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  return itemBlocks.slice(0, maxItems).map((block, index) => {
    const title = stripTagValue((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const urlValue = stripTagValue((block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const pubDate = stripTagValue((block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
    return {
      id: `fdic-rss-${index + 1}`,
      title,
      source: "FDIC RSS",
      date: toISODate(pubDate),
      url: urlValue || undefined,
    };
  }).filter((item) => item.title);
}

export function getRecentAlertItems({ recentAlerts = globalThis.recentAlerts || [], maxItems = 8 } = {}) {
  if (!Array.isArray(recentAlerts)) return [];
  return recentAlerts.slice(0, maxItems).map((alert, index) => ({
    id: `alert-${index + 1}`,
    title: String(alert?.title || "Untitled Alert"),
    source: String(alert?.source || "Audit Engine"),
    date: toISODate(alert?.date || alert?.timestamp || new Date().toISOString()),
    url: alert?.url ? String(alert.url) : undefined,
  }));
}

function dedupe(items = []) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.source}::${item.title}::${item.url || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function sortByDateDesc(items = []) {
  return [...items].sort((a, b) => {
    const aMs = a?.date ? Date.parse(a.date) : Number.NEGATIVE_INFINITY;
    const bMs = b?.date ? Date.parse(b.date) : Number.NEGATIVE_INFINITY;
    return bMs - aMs;
  });
}

export async function assembleNewsInsights(options = {}) {
  const {
    staticHtml = "",
    staticHtmlPath = "",
    rssXml = "",
    rssUrl = DEFAULT_FDIC_RSS_URL,
    recentAlerts = globalThis.recentAlerts || [],
    maxItemsPerSource = 8,
    totalLimit = 30,
    fetchImpl = fetch,
  } = options;

  const staticItems = extractStaticHeadlines({
    html: staticHtml,
    htmlPath: staticHtmlPath,
    maxItems: maxItemsPerSource,
  });

  const rssItems = await fetchRssFeed({
    rssXml,
    url: rssUrl,
    maxItems: maxItemsPerSource,
    fetchImpl,
  }).catch(() => []);

  const alertItems = getRecentAlertItems({
    recentAlerts,
    maxItems: maxItemsPerSource,
  });

  const merged = sortByDateDesc(dedupe([...staticItems, ...rssItems, ...alertItems]));
  return merged.slice(0, totalLimit);
}

export async function getCachedNewsInsights(options = {}) {
  const {
    cacheTtlMs = DEFAULT_NEWS_CACHE_TTL_MS,
    ...assembleOptions
  } = options;

  const now = Date.now();
  if (Array.isArray(newsInsightsCache.data) && now - newsInsightsCache.ts < cacheTtlMs) {
    return newsInsightsCache.data;
  }

  const fresh = await assembleNewsInsights(assembleOptions);
  newsInsightsCache = { ts: now, data: fresh };
  return fresh;
}

export function clearNewsInsightsCache() {
  newsInsightsCache = { ts: 0, data: [] };
}
