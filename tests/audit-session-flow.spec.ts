import { test, expect } from '@playwright/test';

/**
 * End-to-end audit session teaser flow (landing → /audit/:id → processing → teaser gate).
 *
 * Mocks POST /api/audits/run and GET /api/audits/:id/teaser so the test does not require
 * the Express API process, OpenRouter keys, or live SAM.gov fetches. This matches how
 * Playwright is wired today (webServer: Vite on 5173 only; /api is proxied when API is up).
 */
const AUDIT_ID = 'pw-e2e-audit-session';

const MOCK_TEASER = {
  title: 'E2E Test Solicitation',
  agency: 'Department of Playwright',
  bidRecommendation: 'CONDITIONAL',
  winProbability: 55,
  riskCount: 2,
  disqualifierCount: 1,
  primaryFinding: 'Mock primary finding for automated test.',
  headline: '12 requirements · 1 disqualifiers',
};

test.describe('Audit session teaser flow', () => {
  test.beforeEach(async ({ page }) => {
    let teaserPollCount = 0;

    await page.route('**/api/audits/run', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ auditId: AUDIT_ID }),
      });
    });

    await page.route(`**/api/audits/${AUDIT_ID}/teaser`, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      teaserPollCount += 1;
      if (teaserPollCount < 3) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'processing' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'teaser_ready',
          teaser: MOCK_TEASER,
        }),
      });
    });
  });

  test('landing intake navigates to audit session, shows processing, then teaser unlock CTA', async ({
    page,
  }) => {
    await page.goto('/');

    const auditInput = page.getByPlaceholder(/sam\.gov/i);
    await auditInput.fill('https://sam.gov/opp/e2e-mock-opportunity');
    // Hero layout can stack the sample report preview over the CTA row; Enter matches user keyboard submit.
    await auditInput.press('Enter');

    await expect(page).toHaveURL(new RegExp(`/audit/${AUDIT_ID}`));

    await expect(page.getByText('PROCESSING')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText(MOCK_TEASER.title)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(MOCK_TEASER.agency)).toBeVisible();
    await expect(page.getByText('Win Probability')).toBeVisible();
    await expect(page.getByText('55%')).toBeVisible();

    await expect(page.getByRole('button', { name: /Sign in to unlock full report/i })).toBeVisible();
  });
});
