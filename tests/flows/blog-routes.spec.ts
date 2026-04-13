// Covers direct navigation to published /blog/* SEO articles (no 404, non-empty title, visible article body).
import { test, expect } from "@playwright/test";

const BLOG_PATHS = [
  "/blog/bid-no-bid-decision-framework",
  "/blog/rfp-process-win-rate-signs",
  "/blog/how-to-find-government-rfps-early",
  "/blog/compliance-matrix-government-rfps",
];

test.describe("Blog routes", () => {
  for (const path of BLOG_PATHS) {
    // Verifies each blog slug responds with a real article shell (title + heading or body text).
    test(`loads ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), path).not.toBe(404);
      expect(res?.ok(), path).toBeTruthy();

      const title = await page.title();
      expect(title.trim().length, "title not empty").toBeGreaterThan(0);
      expect(title.trim().toLowerCase(), "title not generic single word").not.toBe("bidsmith");

      // Check h1 first, fall back to article (avoids strict-mode failure from h1.or(article) matching two nodes).
      const h1 = page.locator("h1").first();
      const article = page.locator("article").first();
      const heading = (await h1.isVisible()) ? h1 : article;
      await expect(heading).toBeVisible({ timeout: 15_000 });
    });
  }
});
