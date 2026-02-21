const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:3007';
const EMAIL = 'codex.e2e.1771680222724@example.com';
const PASSWORD = 'CodexPass!12345';
const PROMPT = 'Return exactly this line: ARIS_E2E_OK';

test('login + analyze chat + persistence', async ({ page }) => {
  test.setTimeout(240000);

  await page.goto(`${BASE_URL}/dashboard/analyze`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.locator('textarea[placeholder="Message ARIS Agent..."]').first().waitFor({ state: 'visible', timeout: 90000 });
  const composer = page.locator('textarea[placeholder="Message ARIS Agent..."]').first();
  await composer.fill(PROMPT);
  await composer.press('Enter');

  await expect(page.getByText('Client').first()).toBeVisible({ timeout: 90000 });
  await expect(page.getByText('ARIS_E2E_OK').first()).toBeVisible({ timeout: 120000 });

  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Client').first()).toBeVisible({ timeout: 90000 });
  await expect(page.getByText('ARIS_E2E_OK').first()).toBeVisible({ timeout: 90000 });

  const sidebarItem = page.locator('aside button:has-text("ARIS_E2E_OK")').first();
  await expect(sidebarItem).toBeVisible({ timeout: 90000 });
});
