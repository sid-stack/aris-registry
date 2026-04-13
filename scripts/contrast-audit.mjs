/**
 * One-off / CI: full-page screenshots + axe-core color-contrast only.
 *
 * Usage:
 *   1. npm run dev   (in another terminal)
 *   2. node scripts/contrast-audit.mjs
 *
 * Env:
 *   AUDIT_BASE_URL — default http://localhost:5173
 *   AUDIT_AFTER    — if "1", writes after-<name>.png instead of before-<name>.png
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = (process.env.AUDIT_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const after = process.env.AUDIT_AFTER === "1";
const prefix = after ? "after" : "before";

const routes = [
  { path: "/", name: "home" },
  { path: "/blog", name: "blog" },
  { path: "/pricing", name: "pricing" },
  { path: "/dashboard", name: "dashboard" },
];

const outDir = path.join(__dirname, "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const reportPath = path.join(outDir, `${prefix}-contrast-report.json`);
const allViolations = [];

let exitCode = 0;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const { path: route, name } of routes) {
  const url = `${base}${route}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  } catch (e) {
    console.error(`[audit] goto failed ${url}:`, e?.message || e);
    exitCode = 1;
    allViolations.push({ route, error: String(e?.message || e) });
    continue;
  }

  await new Promise((r) => setTimeout(r, 1200));

  const shotPath = path.join(outDir, `${prefix}-${name}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log(`[audit] screenshot ${shotPath}`);

  let results;
  try {
    results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
  } catch (e) {
    console.error(`[audit] axe failed on ${route}:`, e?.message || e);
    exitCode = 1;
    allViolations.push({ route, axeError: String(e?.message || e) });
    continue;
  }

  const cc = results.violations.filter((v) => v.id === "color-contrast");
  if (cc.length) {
    console.error(`[audit] CONTRAST FAILURES on ${route} (${cc.length}):`);
    for (const v of cc) {
      console.error(`  — ${v.help} (${v.nodes?.length || 0} nodes)`);
    }
    exitCode = 1;
    allViolations.push({ route, violations: cc });
  } else {
    console.log(`[audit] color-contrast: OK on ${route}`);
  }
}

await context.close();
await browser.close();

fs.writeFileSync(reportPath, JSON.stringify({ base, prefix, allViolations }, null, 2));
console.log(`[audit] report written ${reportPath}`);

process.exit(exitCode);
