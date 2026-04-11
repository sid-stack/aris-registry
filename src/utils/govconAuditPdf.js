/**
 * One-click PDF snapshot of active GovCon audit (compliance-focused) for the v2 dashboard.
 */

import { devError } from "./devLog";

let html2pdfLoaderPromise;

async function loadHtml2Pdf() {
  if (!html2pdfLoaderPromise) {
    html2pdfLoaderPromise = import("html2pdf.js").then((module) => module.default || module);
  }
  return html2pdfLoaderPromise;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAuditExportHtml(audit) {
  const reqs = Array.isArray(audit?.requirements) ? audit.requirements : [];
  const rows = reqs.length
    ? reqs
        .map(
          (r) => `<tr>
      <td>${escapeHtml(r.id)}</td>
      <td>${escapeHtml(r.section)}</td>
      <td>${escapeHtml(r.requirement || r.text)}</td>
      <td>${escapeHtml(r.risk)}</td>
      <td>${r.is_disqualifier || r.risk === "DISQUALIFIER" ? "Yes" : "No"}</td>
      <td>${escapeHtml(r.status || "Not reviewed")}</td>
    </tr>`
        )
        .join("")
    : `<tr><td colspan="6">No requirements in this audit.</td></tr>`;

  return `
    <div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111827;padding:8px;">
      <h1 style="font-size:18pt;font-weight:700;margin:0 0 12px;">BidSmith — Compliance matrix</h1>
      <p style="margin:4px 0;"><strong>Solicitation:</strong> ${escapeHtml(audit?.solicitation_number || audit?.id || "—")}</p>
      <p style="margin:4px 0;"><strong>Title:</strong> ${escapeHtml(audit?.title || "—")}</p>
      <p style="margin:4px 0;"><strong>Agency:</strong> ${escapeHtml(audit?.agency || "—")}</p>
      <p style="margin:4px 0;"><strong>Verdict:</strong> ${escapeHtml(audit?.verdict?.recommendation || "—")}
        &nbsp;|&nbsp; <strong>Win probability:</strong> ${audit?.verdict?.win_probability ?? "—"}%</p>
      <p style="margin:16px 0 8px;font-size:10pt;color:#6b7280;">${escapeHtml(new Date().toISOString().slice(0, 10))} · bidsmith.pro</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr style="background:#e5e7eb;">
            <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">ID</th>
            <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Section</th>
            <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Requirement</th>
            <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Risk</th>
            <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">DQ</th>
            <th style="border:1px solid #d1d5db;padding:6px;text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

const HOST_ID = "govcon-audit-pdf-export-host";

export async function downloadGovConAuditPdf(audit) {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.position = "fixed";
    host.style.left = "-12000px";
    host.style.top = "0";
    host.style.width = "820px";
    host.style.background = "#ffffff";
    document.body.appendChild(host);
  }
  host.innerHTML = buildAuditExportHtml(audit);

  try {
    const html2pdf = await loadHtml2Pdf();
    const safe =
      String(audit?.solicitation_number || audit?.id || "audit").replace(/[^\w.-]+/g, "_").slice(0, 72) ||
      "audit";
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `BidSmith-Compliance-${safe}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(host)
      .save();
  } catch (e) {
    devError("GovCon audit PDF export failed", e);
    throw e;
  } finally {
    host.innerHTML = "";
  }
}
