/**
 * Client-side compliance matrix export (.xlsx) using SheetJS-compatible xlsx-js-style.
 */

import XLSX from "xlsx-js-style";
import { devError } from "./devLog";

const SHEET_NAME = "Compliance Matrix";
const MAX_TEXT = 500;
const MIN_WCH = 17; // ~120px at default Excel column width
const HEADER_FILL = { patternType: "solid", fgColor: { rgb: "FF0F172A" } };
const HEADER_FONT = { bold: true, color: { rgb: "FFFFFFFF" }, sz: 12 };
const HEADER_ALIGN = { vertical: "center", horizontal: "left", wrapText: true };

const FILL_SERIOUS = { patternType: "solid", fgColor: { rgb: "FFFEE2E2" } };
const FILL_ATTENTION = { patternType: "solid", fgColor: { rgb: "FFFEF9C3" } };
const FILL_LOWER = { patternType: "solid", fgColor: { rgb: "FFDCFCE7" } };
const FILL_CUSTOMER = { patternType: "solid", fgColor: { rgb: "FFF8FAFC" } };

const BODY_ALIGN = { vertical: "top", horizontal: "left", wrapText: true };

/** Mirrors GovConDashboardV2 `normalizePursuitRecommendation` — do not diverge. */
function normalizePursuitRecommendation(rec) {
  const u = String(rec || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (u === "BID" || u === "GO") return "BID";
  if (u === "NO_BID" || u === "NOBID") return "NO_BID";
  if (u.includes("INSUFFICIENT")) return "INSUFFICIENT";
  return "CONDITIONAL";
}

/** Same numeric output as dashboard `computeContractRiskScore(audit).score`. */
function computeHeroRiskScore(audit) {
  const reqs = Array.isArray(audit?.requirements) ? audit.requirements : [];
  const recNorm = normalizePursuitRecommendation(audit?.verdict?.recommendation);
  let dq = 0;
  let serious = 0;
  let watch = 0;
  let routine = 0;
  for (const r of reqs) {
    if (r.is_disqualifier) dq += 1;
    else if (String(r.risk || "").toUpperCase() === "HIGH" || String(r.risk || "").toUpperCase() === "DISQUALIFIER") serious += 1;
    else if (String(r.risk || "").toUpperCase() === "MED" || String(r.risk || "").toUpperCase() === "MEDIUM") watch += 1;
    else routine += 1;
  }

  if (reqs.length === 0) {
    const s0 = recNorm === "NO_BID" ? 68 : recNorm === "INSUFFICIENT" ? 54 : 42;
    return Math.round(Math.max(4, Math.min(100, s0)));
  }

  let score = 18;
  score += Math.min(dq * 22, 70);
  score += Math.min(serious * 6, 28);
  score += Math.min(watch * 2, 12);
  score -= Math.min(Math.floor(routine / 6) * 4, 10);
  if (recNorm === "NO_BID") score = Math.max(score, 62);
  if (recNorm === "BID") score -= 8;
  if (recNorm === "INSUFFICIENT") score += 6;

  return Math.round(Math.max(4, Math.min(100, score)));
}

function riskLevelExportLabel(r) {
  const R = String(r?.risk || "").toUpperCase();
  if (r?.is_disqualifier || R === "HIGH" || R === "DISQUALIFIER") return "Serious";
  if (R === "MED" || R === "MEDIUM") return "Needs Attention";
  if (R === "LOW") return "Lower Concern";
  return "Lower Concern";
}

function pursuitImpactLabel(r) {
  if (r?.is_disqualifier) return "Could Disqualify";
  const R = String(r?.risk || "").toUpperCase();
  if (R === "HIGH" || R === "DISQUALIFIER") return "High";
  if (R === "MED" || R === "MEDIUM") return "Medium";
  if (R === "LOW") return "Low";
  return "Low";
}

function riskLevelFill(label) {
  if (label === "Serious") return FILL_SERIOUS;
  if (label === "Needs Attention") return FILL_ATTENTION;
  return FILL_LOWER;
}

function truncateRequirementText(s) {
  const t = String(s ?? "").replace(/\r\n/g, "\n").trim();
  if (t.length <= MAX_TEXT) return t;
  return `${t.slice(0, MAX_TEXT)}…`;
}

function colAddr(c) {
  let s = "";
  let n = c + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function cellAddr(row, col) {
  return `${colAddr(col)}${row + 1}`;
}

function estimateRowHeightPt(text) {
  const lines = String(text).split(/\n/).length;
  const approx = Math.ceil(String(text).length / 90) + lines;
  return Math.min(409, Math.max(15, 12 + approx * 12));
}

function safeFileSlug(audit) {
  const base =
    String(audit?.title || audit?.solicitation_number || audit?.id || "").trim()
    || new Date().toISOString().slice(0, 10);
  let slug = "";
  for (let i = 0; i < base.length && slug.length < 80; i++) {
    const ch = base[i];
    const code = ch.charCodeAt(0);
    const bad = code < 32 || "<>:\"/\\|?*".includes(ch);
    slug += bad ? "_" : ch;
  }
  slug = slug.replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 80);
  return slug || "export";
}

const HEADERS = [
  "Requirement ID",
  "Section",
  "Requirement Text",
  "Risk Level",
  "Risk Score",
  "Pursuit Impact",
  "Suggested Next Step",
  "Status",
  "Notes",
];

/**
 * @param {Record<string, unknown>} audit
 * @returns {Promise<void>}
 */
export async function downloadComplianceMatrixXlsx(audit) {
  const reqs = Array.isArray(audit?.requirements) ? audit.requirements : [];
  if (reqs.length === 0) {
    const err = new Error("NO_COMPLIANCE_ROWS");
    err.code = "NO_COMPLIANCE_ROWS";
    throw err;
  }

  const heroScore = computeHeroRiskScore(audit);
  const rows = reqs.map((r, i) => {
    const reqText = truncateRequirementText(r.requirement || r.text || "");
    const riskLevel = riskLevelExportLabel(r);
    const pursuit = pursuitImpactLabel(r);
    const nextStep = String(r.action_required ?? "").replace(/\r\n/g, "\n").trim();
    return {
      id: `REQ-${String(i + 1).padStart(3, "0")}`,
      section: String(r.section ?? "").trim(),
      reqText,
      riskLevel,
      riskScore: heroScore,
      pursuit,
      nextStep,
      riskFill: riskLevelFill(riskLevel),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = {};

  const colCount = HEADERS.length;
  const rowCount = 1 + rows.length;

  for (let c = 0; c < colCount; c++) {
    const addr = cellAddr(0, c);
    ws[addr] = {
      v: HEADERS[c],
      t: "s",
      s: {
        fill: HEADER_FILL,
        font: HEADER_FONT,
        alignment: HEADER_ALIGN,
        border: {
          top: { style: "thin", color: { rgb: "FF334155" } },
          bottom: { style: "thin", color: { rgb: "FF334155" } },
          left: { style: "thin", color: { rgb: "FF334155" } },
          right: { style: "thin", color: { rgb: "FF334155" } },
        },
      },
    };
  }

  const wch = HEADERS.map((h) => Math.max(MIN_WCH, String(h).length + 2));
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const vals = [
      row.id,
      row.section,
      row.reqText,
      row.riskLevel,
      row.riskScore,
      row.pursuit,
      row.nextStep,
      "",
      "",
    ];
    for (let c = 0; c < colCount; c++) {
      const addr = cellAddr(ri + 1, c);
      const isNum = c === 4;
      const isRisk = c === 3;
      const isCustomer = c === 7 || c === 8;
      const baseFill = isCustomer ? FILL_CUSTOMER : isRisk ? row.riskFill : undefined;
      const v = vals[c];
      ws[addr] = {
        v: isNum ? Number(v) : String(v),
        t: isNum ? "n" : "s",
        s: {
          alignment: BODY_ALIGN,
          fill: baseFill,
          border: {
            top: { style: "thin", color: { rgb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { rgb: "FFE2E8F0" } },
            left: { style: "thin", color: { rgb: "FFE2E8F0" } },
            right: { style: "thin", color: { rgb: "FFE2E8F0" } },
          },
        },
      };
      wch[c] = Math.max(wch[c] ?? MIN_WCH, String(vals[c]).length + 2, MIN_WCH);
    }
  }

  ws["!ref"] = `A1:${cellAddr(rowCount - 1, colCount - 1)}`;
  ws["!cols"] = wch.map((w) => ({ wch: Math.min(90, w) }));
  ws["!rows"] = [{ hpt: 22 }];
  for (let ri = 0; ri < rows.length; ri++) {
    ws["!rows"].push({ hpt: estimateRowHeightPt(rows[ri].reqText) });
  }

  ws["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell: "A2",
    activePane: "bottomLeft",
    state: "frozen",
  };

  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME.slice(0, 31));

  const name = `BidSmith_ComplianceMatrix_${safeFileSlug(audit)}.xlsx`;
  try {
    XLSX.writeFile(wb, name, { cellStyles: true });
  } catch (e) {
    devError("compliance matrix xlsx export failed", e);
    throw e;
  }
}
