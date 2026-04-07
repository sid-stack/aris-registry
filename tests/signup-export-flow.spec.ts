import { expect, test } from "@playwright/test";

async function debugLog(payload: {
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  // #region agent log
  await fetch("http://127.0.0.1:7475/ingest/27c0c5ba-848a-4204-b45d-bd04160c9694", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "bf8eef",
    },
    body: JSON.stringify({
      sessionId: "bf8eef",
      runId: payload.runId,
      hypothesisId: payload.hypothesisId,
      location: payload.location,
      message: payload.message,
      data: payload.data ?? {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

test.describe("Signup to Export audit flow", () => {
  test("signup gate is reachable from app route", async ({ page }) => {
    await page.goto("/app");
    await debugLog({
      runId: "baseline",
      hypothesisId: "H1",
      location: "tests/signup-export-flow.spec.ts:34",
      message: "Entered app route",
      data: { url: page.url() },
    });

    const authCard = page.getByText(/sign in/i).first();
    await expect(authCard).toBeVisible();
    await debugLog({
      runId: "baseline",
      hypothesisId: "H2",
      location: "tests/signup-export-flow.spec.ts:45",
      message: "Auth gate visible",
      data: { authVisible: true },
    });
  });

  test("stateless bridge signal + PDF export path works", async ({ page }) => {
    await page.goto("/sam-rep");
    await debugLog({
      runId: "baseline",
      hypothesisId: "H3",
      location: "tests/signup-export-flow.spec.ts:55",
      message: "Entered export report page",
      data: { url: page.url() },
    });

    await expect(page.getByText(/ZERO_KNOWLEDGE_VAULT/i)).toBeVisible();
    await debugLog({
      runId: "baseline",
      hypothesisId: "H4",
      location: "tests/signup-export-flow.spec.ts:64",
      message: "Stateless bridge security marker visible",
      data: { marker: "ZERO_KNOWLEDGE_VAULT" },
    });

    const pdfDownload = page.waitForEvent("download", { timeout: 90_000 });
    await page.getByRole("button", { name: /^PDF$/i }).click();
    const dl = await pdfDownload;
    expect(dl.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/);
    await debugLog({
      runId: "baseline",
      hypothesisId: "H5",
      location: "tests/signup-export-flow.spec.ts:77",
      message: "PDF export event fired",
      data: { filename: dl.suggestedFilename() },
    });
  });
});
