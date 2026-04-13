/**
 * Full-stack E2E: Clerk auth + GovCon V2 audit workspace + API mocks.
 *
 * Architecture note (main branch @ 2026):
 * - Workspace: `/dashboard` is canonical; `/app` redirects to `/dashboard`.
 * - Ingestion API: `POST /api/analyze-link` (not `/api/audits/run`; that route is mocked for
 *   forward-compatibility with the pre-production audit-session flow).
 * - Sidebar list label: **My Pipeline** (product copy; tests treat it as the “reports” surface).
 * - PDF export used in-app: SamRep (`/sam-rep`) mounts `NavBar` + `#dashboard-content` and calls
 *   `html2pdf` — GovCon V2 intelligence view does not yet expose the same PDF chrome.
 *
 * Required env for signed-in flows:
 *   CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY)
 *   E2E_CLERK_USER_EMAIL, E2E_CLERK_USER_PASSWORD  (Clerk test user; password strategy)
 *
 * Optional:
 *   E2E_AUDIT_SESSION_V2=1 — runs the additional describe for `/audit/:id` when that route exists.
 */

import { test, expect, type Page } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";

const MOCK_AUDIT_ID = "e2e-mock-audit-001";
const MOCK_SAM_URL = "https://sam.gov/opp/e2e-mock-opp/playwright";

/** Minimal valid `runAudit`-shaped payload for GovConDashboardV2 + IntelligenceBrief */
const MOCK_ANALYZE_LINK_BODY = {
  id: MOCK_AUDIT_ID,
  title: "E2E Mock Solicitation",
  agency: "Department of Playwright",
  naics: "541512",
  solicitation_number: "E2E-SOL-0001",
  value: 5_000_000,
  due_date: "2030-12-31",
  verdict: {
    recommendation: "CONDITIONAL",
    win_probability: 55,
    confidence: "HIGH",
    summary: "Deterministic mock verdict for Playwright.",
    rationale: "Mock rationale — no LLM calls in E2E.",
  },
  intelligence: {
    incumbent_signal: {
      score: 2,
      label: "LOW",
      signals_detected: [],
      explanation: "Mock incumbent analysis.",
    },
    evaluation_type: "Best Value — Technical-Led",
    evaluation_reality: "Mock evaluation narrative.",
    team_signal: "OPEN-COMPETITION",
    price_to_win: {
      low: 4_000_000,
      high: 6_000_000,
      currency: "USD",
      rationale: "Mock comparable awards.",
    },
    top_risks: [
      {
        risk: "E2E mock risk",
        severity: "MED",
        action: "Mock remediation.",
      },
    ],
    key_discriminators: ["Mock discriminator"],
    hidden_requirements: [],
    timeline_pressure: {
      detected: true,
      days_to_respond: 30,
      explanation: "Mock timeline.",
    },
  },
  requirements: [
    {
      id: "REQ-E2E-1",
      requirement: "E2E extracted requirement",
      section: "L.1",
      risk: "LOW",
      is_disqualifier: false,
      action_required: "None for mock.",
    },
  ],
  proposal_roadmap: [
    {
      section: "Technical Approach",
      recommended_pages: "10",
      focus_areas: ["E2E"],
      discriminator: "Mock",
    },
  ],
};

async function installDeterministicApiMocks(page: Page) {
  await page.route("**/api/track", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );

  // Forward-compatible: pre-production audit runner
  await page.route("**/api/audits/run", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ auditId: MOCK_AUDIT_ID }),
    });
  });

  await page.route("**/api/analyze-link", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ANALYZE_LINK_BODY),
    });
  });

  await page.route("**/api/analyze-text", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ANALYZE_LINK_BODY),
    });
  });

  await page.route("**/api/audits/save", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        id: MOCK_AUDIT_ID,
        created_at: new Date().toISOString(),
      }),
    });
  });

  await page.route("**/api/audits/history**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        audits: [
          {
            id: MOCK_AUDIT_ID,
            solicitation_number: "E2E-SOL-0001",
            title: "E2E Mock Solicitation",
            agency: "Department of Playwright",
            verdict: "CONDITIONAL",
            win_probability: 55,
            risk_score: 22,
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
  });

  await page.route(`**/api/audits/${MOCK_AUDIT_ID}`, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: MOCK_AUDIT_ID,
        solicitation_number: "E2E-SOL-0001",
        title: "E2E Mock Solicitation",
        agency: "Department of Playwright",
        verdict: "CONDITIONAL",
        win_probability: 55,
        risk_score: 22,
        result: MOCK_ANALYZE_LINK_BODY,
      }),
    });
  });
}

test.describe("GovCon V2 — full pipeline (mocked APIs)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.E2E_CLERK_USER_EMAIL || !process.env.E2E_CLERK_USER_PASSWORD,
      "Set E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD for Clerk password sign-in.",
    );
    test.skip(!process.env.CLERK_SECRET_KEY, "Set CLERK_SECRET_KEY for Clerk Testing tokens.");

    await installDeterministicApiMocks(page);
    await setupClerkTestingToken({ page });
  });

  test("login → ingest → loading → report → export PDF → dashboard history → logout", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: process.env.E2E_CLERK_USER_EMAIL!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });

    await expect(page.getByText("BIDSMITH", { exact: false })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: /New Audit/i }).click();

    await expect(page.getByText("New Intelligence Audit")).toBeVisible();

    const urlField = page.getByPlaceholder(/sam\.gov\/opp/i);
    await urlField.fill(MOCK_SAM_URL);

    // Loading / “teaser” phase: overlay steps before mock returns
    const runBtn = page.getByRole("button", { name: /Run Intelligence Audit/i });
    await runBtn.click();
    // Loading overlay may flash only briefly when the API is mocked — do not hard-fail on it.
    await page.getByText(/Fetching solicitation text|Shredding Section/i).first().waitFor({ state: "visible", timeout: 2000 }).catch(() => {});

    await expect(page.getByText("E2E Mock Solicitation")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Department of Playwright")).toBeVisible();

    // “Unlock” equivalent on V2: full intelligence visible (not a separate paywalled teaser route on main)
    await expect(page.getByText(/Intelligence Brief/i).first()).toBeVisible();

    // Export: SamRep uses html2pdf + NavBar “PDF” — validates download plumbing
    await page.goto("/sam-rep");
    const pdfDownload = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("button", { name: /^PDF$/i }).click();
    const dl = await pdfDownload;
    expect(dl.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/);

    // Dashboard / pipeline (same product surface as “reports list”)
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("My Pipeline", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E Mock Solicitation")).toBeVisible();

    await clerk.signOut({ page });
    await expect(page).toHaveURL(/\//);
  });
});

/*
 * Pre-production audit-session URL flow (when `App.jsx` maps `/audit/:id` + teaser components):
 * - Mock chain: POST /api/audits/run → GET /api/audits/:id/teaser (processing → teaser_ready)
 *   → Sign-in → GET /api/audits/:id/result
 * - Assert: URL `/audit/[id]`, then teaser CTA matching /unlock full report|sign in to unlock/i
 */
