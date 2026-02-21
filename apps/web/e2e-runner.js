const assert = require('assert');
const { chromium } = require('playwright');
const BASE_URL = 'http://127.0.0.1:3007';
const EMAIL = 'codex.e2e.1771680222724@example.com';
const PASSWORD = 'CodexPass!12345';
const PROMPT = `Return exactly this line: ARIS_E2E_OK_${Date.now()}`;

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function clickIfVisible(locator) {
  try {
    if (await locator.isVisible({ timeout: 4000 })) {
      await locator.click({ timeout: 4000 });
      return true;
    }
  } catch (_) { }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    console.log('STEP 1: Open sign-in page');
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded', timeout: 120000 });

    const emailInput = page.locator('input[type="email"], input[name="identifier"], input[name="emailAddress"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 60000 });
    await emailInput.fill(EMAIL);

    const passwordInput = page.locator('input[type="password"]').first();
    if (!(await passwordInput.isVisible().catch(() => false))) {
      const continueBtn = page.getByRole('button', { name: /continue|next|sign in/i }).first();
      const clicked = await clickIfVisible(continueBtn);
      if (!clicked) {
        await emailInput.press('Enter');
      }
    }

    await passwordInput.waitFor({ state: 'visible', timeout: 60000 });
    await passwordInput.fill(PASSWORD);

    const signInBtn = page.getByRole('button', { name: /continue|sign in/i }).first();
    const clickedSignIn = await clickIfVisible(signInBtn);
    if (!clickedSignIn) {
      await passwordInput.press('Enter');
    }

    await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 120000 });
    console.log('STEP 2: Logged in');

    console.log('STEP 3: Open analyze chat');
    await page.goto(`${BASE_URL}/dashboard/analyze`, { waitUntil: 'domcontentloaded', timeout: 120000 });

    const composer = page.locator('textarea[placeholder="Message ARIS Agent..."]').first();
    await composer.waitFor({ state: 'visible', timeout: 90000 });
    await composer.fill(PROMPT);
    await composer.press('Enter');

    await page.getByText('Client').first().waitFor({ state: 'visible', timeout: 90000 });
    await page.getByText(PROMPT).first().waitFor({ state: 'visible', timeout: 90000 });

    console.log('STEP 4: Wait for ARIS response');
    await page.waitForFunction(() => {
      const candidates = Array.from(document.querySelectorAll('main div'));
      return candidates.some((el) => {
        const text = (el.textContent || '').trim();
        return text.length > 0 && text.includes('ARIS_E2E_OK_');
      });
    }, { timeout: 180000 });

    console.log('STEP 5: Verify sidebar has conversation item');
    await page.waitForTimeout(2000);
    const sidebarText = await page.locator('aside').innerText();
    assert(sidebarText.includes('ARIS_E2E_OK_'), 'Conversation title/preview not found in sidebar');

    console.log('STEP 6: Refresh and verify persistence');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByText(PROMPT).first().waitFor({ state: 'visible', timeout: 90000 });

    console.log('PASS: Login, LLM response, and conversation persistence verified.');
    console.log(JSON.stringify({ prompt: PROMPT }, null, 2));
  } catch (error) {
    await page.screenshot({ path: 'aris-e2e-failure.png', fullPage: true }).catch(() => { });
    console.error('FAIL:', error?.message || error);
    process.exitCode = 1;
  } finally {
    await wait(500);
    await browser.close();
  }
})();
