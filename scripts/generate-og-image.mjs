/**
 * One-shot OG image for social previews (1200×630).
 * Run: node scripts/generate-og-image.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/og-image.png");

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px; height: 630px;
    background: #0d0f14;
    display: flex; align-items: center; justify-content: center;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  h1 {
    color: #f4f4f5;
    font-size: 96px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  p {
    margin-top: 16px;
    color: #94a3b8;
    font-size: 28px;
    font-weight: 500;
    text-align: center;
    max-width: 900px;
    line-height: 1.35;
  }
  .wrap { text-align: center; padding: 48px; }
</style></head><body><div class="wrap"><h1>BidSmith</h1><p>RFP &amp; government contract bid management</p></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await mkdir(dirname(outPath), { recursive: true });
await page.screenshot({ path: outPath, type: "png" });
await browser.close();
console.log("Wrote", outPath);
