/**
 * Live browser E2E: SheetJS export downloads a valid .xlsx (Vite dev server).
 * Validates `downloadComplianceMatrixXlsx` without Clerk (dynamic import on any page).
 */

import { test, expect } from "@playwright/test";

const MOCK_AUDIT = {
  title: "Playwright XLSX Export Test",
  solicitation_number: "PW-XLSX-001",
  id: "pw-xlsx-audit",
  verdict: { recommendation: "BID" },
  requirements: [
    {
      section: "Section L.5",
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
  ],
};

test.describe("Compliance matrix XLSX export", () => {
  test("downloadComplianceMatrixXlsx produces BidSmith_ComplianceMatrix_*.xlsx", async ({
    page,
  }) => {
    await page.goto("/");

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });

    const errText = await page.evaluate(async (auditJson) => {
      const audit = auditJson as Record<string, unknown>;
      try {
        const mod = await import("/src/utils/complianceMatrixXlsx.js");
        await mod.downloadComplianceMatrixXlsx(audit);
        return "";
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
    }, MOCK_AUDIT);

    expect(errText, errText || "export threw").toBe("");

    const download = await downloadPromise;
    const name = download.suggestedFilename();
    expect(name).toMatch(/^BidSmith_ComplianceMatrix_.+\.xlsx$/i);

    const path = await download.path();
    expect(path, "download saved to disk").toBeTruthy();
    const fs = await import("node:fs");
    const buf = fs.readFileSync(path!);
    expect(buf.length).toBeGreaterThan(2000);
    // ZIP / Office Open XML
    expect(buf.subarray(0, 2).toString("ascii")).toBe("PK");
  });
});
