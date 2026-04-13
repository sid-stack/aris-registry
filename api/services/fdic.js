const FDIC_BASE = (process.env.FDIC_API_BASE || "https://api.fdic.gov/v1").replace(/\/+$/, "");
const FDIC_TIMEOUT_MS = Number(process.env.FDIC_API_TIMEOUT_MS || 15000);
const FDIC_BANKFIND_CACHE_TTL_MS = Number(process.env.FDIC_BANKFIND_CACHE_TTL_MS || 24 * 60 * 60 * 1000);

let bankFindCache = {
  ts: 0,
  rows: null,
};

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRows(payload, keys) {
  for (const key of keys) {
    const maybe = payload?.[key];
    if (Array.isArray(maybe)) return maybe;
  }
  return [];
}

async function getJSON(path, params = {}) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${FDIC_BASE}${cleanPath}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  if (process.env.FDIC_API_KEY) {
    url.searchParams.set("api_key", process.env.FDIC_API_KEY);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FDIC_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), { method: "GET", signal: controller.signal });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`FDIC API ${response.status}: ${body.slice(0, 200)}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBankFindByOid(oid) {
  try {
    const payload = await getJSON(`/bankfind/${encodeURIComponent(oid)}`);
    return payload?.bank || payload?.data || payload?.result || null;
  } catch {
    return null;
  }
}

export async function fetchBankFind(pageSize = 1000, maxPages = 50) {
  const all = [];
  let pageNumber = 1;
  while (pageNumber <= maxPages) {
    const payload = await getJSON("/bankfind", { pageSize, pageNumber });
    const rows = normalizeRows(payload, ["banks", "data", "results"]);
    if (!rows.length) break;
    all.push(...rows);
    if (rows.length < pageSize) break;
    pageNumber += 1;
  }
  return all;
}

async function getBankFindCached() {
  const now = Date.now();
  if (Array.isArray(bankFindCache.rows) && now - bankFindCache.ts < FDIC_BANKFIND_CACHE_TTL_MS) {
    return bankFindCache.rows;
  }

  const rows = await fetchBankFind();
  bankFindCache = { ts: now, rows };
  return rows;
}

export async function fetchFinancials(oid) {
  if (!oid) return [];
  const payload = await getJSON(`/financials/${encodeURIComponent(oid)}`);
  return normalizeRows(payload, ["financials", "data", "results"]);
}

export async function getInstitutionSnapshot(oid) {
  const normalizedOid = String(oid || "").trim();
  if (!normalizedOid) {
    throw new Error("FDIC OID is required");
  }

  let bank = await fetchBankFindByOid(normalizedOid);
  if (!bank) {
    const rows = await getBankFindCached();
    bank =
      rows.find((entry) => String(entry?.id || "") === normalizedOid) ||
      rows.find((entry) => String(entry?.oid || "") === normalizedOid) ||
      null;
  }

  if (!bank) {
    throw new Error(`FDIC institution not found for OID ${normalizedOid}`);
  }

  const financials = await fetchFinancials(normalizedOid);
  const latest = financials[0] || {};

  return {
    oid: normalizedOid,
    name: bank?.name || bank?.institutionName || "Unknown Institution",
    city: bank?.city || null,
    state: bank?.state || null,
    cert: bank?.cert || bank?.certificateNumber || null,
    totalAssets: normalizeNumber(latest?.totalAssets ?? latest?.assets ?? latest?.asset),
    totalDeposits: normalizeNumber(latest?.totalDeposits ?? latest?.deposits),
    totalLoans: normalizeNumber(latest?.totalLoans ?? latest?.loans),
    netIncome: normalizeNumber(latest?.netIncome ?? latest?.income),
    roa: normalizeNumber(latest?.returnOnAssets ?? latest?.roa),
    roe: normalizeNumber(latest?.returnOnEquity ?? latest?.roe),
    financialPeriod: latest?.period || latest?.reportingPeriod || null,
    source: "fdic",
    retrievedAt: new Date().toISOString(),
  };
}

