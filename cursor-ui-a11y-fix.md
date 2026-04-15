# Cursor Prompt — UI, A11y, Lighthouse Best Practices Fix

**Mission: Fix Lighthouse Best Practices from 0.74 → ≥ 0.80, add axe coverage for authenticated dashboard chat, and verify. Do not touch signup tests or `.vercel/project.json`.**

---

## Context

Lighthouse on `/` (desktop, built dist):
- Performance: 0.95 ✅
- Accessibility: 0.91 ✅
- Best Practices: 0.74 ❌ (CI warns at < 0.80)
- SEO: 1.00 ✅

Best Practices is the only failing metric. Axe + pa11y only run on marketing pages — authenticated `/dashboard` (WorkspaceChat + BentoDashboard) has zero automated contrast/axe coverage. Chat has no E2E flow tests.

---

## Step 1 — Diagnose Best Practices failures

Run Lighthouse and get exact audit failures:

```bash
npm run build
npx serve dist -l 4173 &
npx lighthouse http://localhost:4173 --preset=desktop --output=json --output-path=scripts/lh-report.json --chrome-flags="--headless --no-sandbox"
node -e "
const r = require('./scripts/lh-report.json');
const bp = r.categories['best-practices'];
console.log('Score:', bp.score);
bp.auditRefs.forEach(ref => {
  const a = r.audits[ref.id];
  if (a.score !== null && a.score < 1) console.log(ref.id, a.score, a.displayValue || '');
});
"
```

Fix every audit that scores below 1 and is fixable in code. Reference:

| Audit | Fix |
|---|---|
| `js-libraries` (vulnerable libs) | `npm audit fix` or pin to safe version |
| `no-unload-listeners` | Remove any `window.addEventListener('unload', ...)` |
| `inspector-issues` (console errors) | Fix Clerk/Leadsy console noise — zero errors on load |
| `image-aspect-ratio` | Add explicit `width` + `height` to all `<img>` tags |
| `image-size-responsive` | Add `srcset` or constrain image sizes |
| `charset` | Ensure `<meta charset="utf-8">` in `index.html` |
| `doctype` | Ensure `<!DOCTYPE html>` in `index.html` |
| `errors-in-console` | Zero console errors at page load |

Skip `uses-http2` — infrastructure only. Re-run Lighthouse after fixes until score ≥ 0.80.

---

## Step 2 — Add axe coverage for authenticated dashboard

Create `tests/flows/dashboard-a11y.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard accessibility', () => {
  test('BentoDashboard chat area passes axe (key rules)', async ({ page }) => {
    await page.goto('http://localhost:5173/e2e-audit-cta-harness', { waitUntil: 'networkidle' });
    const handle = page.locator('[data-testid="e2e-harness-ready"]');
    const harnessExists = await handle.isVisible().catch(() => false);

    if (!harnessExists) {
      test.skip(true, 'E2E harness not available — skipping dashboard axe');
      return;
    }

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast', 'button-name', 'label', 'region', 'aria-required-children'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Axe violations:', JSON.stringify(results.violations.map(v => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map(n => n.html)
      })), null, 2));
    }

    expect(results.violations).toHaveLength(0);
  });
});
```

Run: `npx playwright test tests/flows/dashboard-a11y.spec.ts --reporter=list`

Fix every violation before moving on.

---

## Step 3 — Fix WorkspaceChat a11y directly

Find `WorkspaceChat` in `src/`. Apply:

```jsx
// Message scroll container — add role + aria-live
<div
  role="log"
  aria-live="polite"
  aria-label="Conversation messages"
  ref={scrollRef}
  style={...}
>
  {messages.map(...)}
</div>

// Composer textarea — must have accessible name
<textarea
  aria-label="Message input"
  placeholder="Ask about this contract..."
  ...
/>

// Send button — must have accessible name
<button
  aria-label="Send message"
  disabled={!input.trim() || loading}
  ...
>
  {/* icon only is fine if aria-label present */}
</button>

// Clear button
<button aria-label="Clear conversation" ...>
  Clear
</button>
```

Chat bubble contrast — switch to:

```css
/* AI bubble — dark bg, light text */
background: #1e293b;   /* slate-800 */
color: #f1f5f9;        /* slate-100 */

/* User bubble — brand bg, white text */
background: #6366f1;   /* indigo-500 */
color: #ffffff;
```

---

## Step 4 — Update contrast audit script

In `scripts/contrast-audit.mjs`, add the harness route to the routes list:

```js
const routes = ['/', '/blog', '/pricing', '/dashboard', '/e2e-audit-cta-harness'];
```

---

## Step 5 — Update `ci.yml`

Add `tests/flows/dashboard-a11y.spec.ts` to the Playwright CI step alongside existing flows.

---

## Step 6 — Final verification (do not skip)

```bash
# Lighthouse — must be ≥ 0.80 best practices
npm run build && npx serve dist -l 4173 &
npx lighthouse http://localhost:4173 --preset=desktop --output=json --output-path=scripts/lh-report-final.json --chrome-flags="--headless --no-sandbox"
node -e "const r=require('./scripts/lh-report-final.json'); console.log('BP:', r.categories['best-practices'].score);"

# All tests
npm test
npx playwright test tests/flows/ --reporter=list
```

Target: Best Practices ≥ 0.80, all flow tests green, `dashboard-a11y` passes, zero axe violations.

---

## Step 7 — Commit and push

```
fix(a11y+lh): best practices ≥0.80, axe coverage for dashboard chat, WorkspaceChat aria roles
```

Push to `main`. Vercel auto-deploys.

---

## Do not touch

- `signup-export-flow.spec.ts`
- `.vercel/project.json`
- Clerk keys or Railway env vars
- `docs/DEPLOYMENT.md` or `CLAUDE.md`

## Stop only when

- Lighthouse Best Practices ≥ 0.80 confirmed in terminal output
- `npm test` → 11/11
- `npx playwright test tests/flows/` → all passing/skipped, zero unexpected failures
- Zero axe violations on dashboard harness route
