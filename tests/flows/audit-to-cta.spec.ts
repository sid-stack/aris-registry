// Covers post-audit HumanWalkthroughCTA and export affordances via the dev-only /__e2e/bento-audit-cta harness (mirrors Bento unlocked strip).
import { test, expect } from "@playwright/test";

test.describe("Post-audit CTA harness", () => {
  // Verifies HumanWalkthroughCTA, Book a call (new tab), and export control are present after a completed-audit-style layout.
  test("shows walkthrough CTA, Book a call opens new tab, export visible", async ({ page, context }) => {
    await page.goto("/__e2e/bento-audit-cta");
    await page.waitForSelector('[data-testid="e2e-harness-ready"]', { timeout: 30_000 });

    await expect(page.getByText(/Want a human walkthrough\?/i)).toBeVisible();

    const book = page.getByRole("link", { name: /Book a call/i });
    await expect(book).toBeVisible();

    const popupPromise = context.waitForEvent("page");
    await book.click();
    const popup = await popupPromise;
    expect(popup.url()).toMatch(/calendly\.com/i);
    await popup.close();

    await expect(
      page.getByRole("button", { name: /Export Compliance Matrix \(\.xlsx\)/i }),
    ).toBeVisible();
  });
});
