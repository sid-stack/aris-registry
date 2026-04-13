/**
 * Build a Word (.docx) compliance matrix using standard Heading 1 / Normal styles
 * for clean paste into proposal volumes.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { devError } from "./devLog";

function escCell(val) {
  return String(val ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 4000);
}

function headerCell(text) {
  return new TableCell({
    shading: { fill: "E7EEF7" },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.START,
        children: [new TextRun({ text: escCell(text), bold: true, size: 22 })],
      }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "A8B8CC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "A8B8CC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "A8B8CC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "A8B8CC" },
    },
  });
}

function bodyCell(text) {
  return new TableCell({
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.START,
        children: [new TextRun({ text: escCell(text), size: 22 })],
      }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
    },
  });
}

/**
 * @param {Record<string, unknown>} audit — BidSmith audit payload (requirements[], verdict, etc.)
 */
export async function downloadComplianceMatrixDocx(audit) {
  const reqs = Array.isArray(audit?.requirements) ? audit.requirements : [];
  const sol = escCell(audit?.solicitation_number || audit?.id || "Solicitation");
  const title = escCell(audit?.title || "Federal solicitation");
  const agency = escCell(audit?.agency || "");
  const rec = escCell(audit?.verdict?.recommendation || "—");
  const wp =
    audit?.verdict?.win_probability != null
      ? String(audit.verdict.win_probability)
      : "—";

  const headerRow = new TableRow({
    children: [
      headerCell("ID"),
      headerCell("Section"),
      headerCell("Requirement"),
      headerCell("Category"),
      headerCell("Risk"),
      headerCell("Disqualifier"),
      headerCell("Status"),
      headerCell("Action required"),
      headerCell("Source excerpt"),
    ],
  });

  const dataRows =
    reqs.length === 0
      ? [
          new TableRow({
            children: [
              bodyCell("—"),
              bodyCell("—"),
              bodyCell("No requirements in this export. Re-run audit with full solicitation text."),
              bodyCell("—"),
              bodyCell("—"),
              bodyCell("—"),
              bodyCell("—"),
              bodyCell("—"),
              bodyCell("—"),
            ],
          }),
        ]
      : reqs.map(
          (r) =>
            new TableRow({
              children: [
                bodyCell(r.id),
                bodyCell(r.section),
                bodyCell(r.requirement || r.text),
                bodyCell(r.category),
                bodyCell(r.risk),
                bodyCell(r.is_disqualifier || r.risk === "DISQUALIFIER" ? "Yes" : "No"),
                bodyCell(r.status || "Not reviewed"),
                bodyCell(r.action_required || r.why_this_matters || ""),
                bodyCell(r.source_excerpt || ""),
              ],
            })
        );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "BidSmith — Compliance matrix (bid construction)",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Solicitation: ", bold: true }),
              new TextRun({ text: `${sol} — ${title}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Agency: ", bold: true }),
              new TextRun({ text: agency || "—" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Verdict / win probability: ", bold: true }),
              new TextRun({ text: `${rec} / ${wp}%` }),
            ],
          }),
          new Paragraph({
            text: "Instructions: Map each row to your proposal response and evidence. Paste this table into your compliance volume as needed.",
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [900, 700, 3200, 900, 600, 700, 700, 1400, 2200],
            rows: [headerRow, ...dataRows],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated ${new Date().toISOString().slice(0, 10)} · bidsmith.pro`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const safeFile = sol.replace(/[^\w.-]+/g, "_").slice(0, 80) || "solicitation";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `BidSmith-Compliance-Matrix-${safeFile}.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    devError("docx export failed", e);
    throw e;
  }
}
