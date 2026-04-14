import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Dashboard accessibility", () => {
  test("Bento harness chat area passes axe (key rules)", async ({ page }) => {
    await page.goto("/__e2e/bento-audit-cta", { waitUntil: "networkidle" });
    const handle = page.locator('[data-testid="e2e-harness-ready"]');
    const harnessExists = await handle.isVisible().catch(() => false);

    if (!harnessExists) {
      test.skip(true, "E2E harness not available — skipping dashboard axe");
      return;
    }

    const results = await new AxeBuilder({ page })
      .include('[data-testid="e2e-harness-ready"]')
      .withRules(["color-contrast", "button-name", "label", "region", "aria-required-children"])
      .analyze();

    if (results.violations.length > 0) {
      console.log(
        "Axe violations:",
        JSON.stringify(
          results.violations.map((v) => ({
            id: v.id,
            description: v.description,
            nodes: v.nodes.map((n) => n.html),
          })),
          null,
          2,
        ),
      );
    }

    expect(results.violations).toHaveLength(0);
  });
});
