// Covers XLSX workbook generation for compliance matrix export (buffer shape, size, empty-input behavior).
import { describe, it, expect } from "vitest";
import {
  complianceMatrixXlsxBuffer,
  buildComplianceMatrixWorkbook,
} from "../utils/complianceMatrixXlsx.js";

const MOCK_REQS = [
  {
    section: "L.5",
    requirement: "Offeror shall submit past performance references for three similar contracts within the last five years.",
    risk: "HIGH",
    is_disqualifier: false,
    action_required: "Confirm reference POCs and dollar values.",
  },
  {
    section: "FAR 52.204-21",
    requirement: "Basic safeguarding of covered contractor information flow-down to subcontractors.",
    risk: "MEDIUM",
    is_disqualifier: false,
    action_required: "",
  },
  {
    section: "Section M",
    requirement: "Low risk evaluation factor.",
    risk: "LOW",
    is_disqualifier: false,
    action_required: "Map to proposal outline.",
  },
];

function pkPrefix(buf: Uint8Array | ArrayBuffer) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return String.fromCharCode(u8[0], u8[1]);
}

describe("complianceMatrixXlsx", () => {
  // Verifies three mock requirements produce a valid ZIP/XLSX signature and a non-trivial file size.
  it("returns binary with PK magic bytes and size over 2000 bytes for three requirements", () => {
    const audit = {
      title: "Vitest XLSX",
      solicitation_number: "VT-001",
      verdict: { recommendation: "BID" },
      requirements: MOCK_REQS,
    };
    const buf = complianceMatrixXlsxBuffer(audit);
    expect(pkPrefix(buf)).toBe("PK");
    expect(buf.byteLength).toBeGreaterThan(2000);
  });

  // Verifies empty requirements yield a valid header-only workbook (no throw, ZIP magic, non-zero size).
  it("returns a non-empty buffer with PK bytes when requirements array is empty", () => {
    expect(() => buildComplianceMatrixWorkbook({ requirements: [] })).not.toThrow();
    const buf = complianceMatrixXlsxBuffer({ requirements: [] });
    expect(buf.byteLength).toBeGreaterThan(0);
    expect(pkPrefix(buf)).toBe("PK");
  });
});
