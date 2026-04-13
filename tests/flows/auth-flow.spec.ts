// Covers logged-out behavior for the marketing landing page and the /dashboard sign-in shell (no workspace chrome).
import { test, expect } from "@playwright/test";

test.describe("Auth shell and landing", () => {
  // Verifies anonymous /dashboard shows the marketing sign-in shell, hero copy, and hides authenticated workspace chrome.
  test("unauthenticated /dashboard shows DashboardSignInShell, not workspace", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", {
        name: /Turn any SAM\.gov solicitation into a compliance matrix/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(/Turn any SAM\.gov solicitation/i).first(),
    ).toBeVisible();

    await expect(
      page.getByPlaceholder(
        /Paste a SAM\.gov URL, ask a question, or use Files to upload a PDF/i,
      ),
    ).toHaveCount(0);

    const back = page.getByRole("button", { name: /Back to BidSmith/i });
    await expect(back).toBeVisible();
    await back.click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  });

  // Verifies the home page loads primary CTA copy and exposes "BidSmith" in the document title.
  test("landing / loads free-audit CTA and BidSmith in title", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: /Start your free audit/i }).first()).toBeVisible();

    await expect(page).toHaveTitle(/BidSmith/i);
  });
});
