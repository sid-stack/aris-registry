#!/usr/bin/env node
/**
 * Instantly campaign control via API v2 (Bearer = INSTANTLY_API_KEY).
 *
 * Usage:
 *   node --import dotenv/config scripts/instantly-campaign.mjs activate [campaign_uuid]
 *   node --import dotenv/config scripts/instantly-campaign.mjs pause [campaign_uuid]
 *
 * If campaign_uuid is omitted, uses INSTANTLY_CAMPAIGN_ID from the environment.
 *
 * Docs: POST /api/v2/campaigns/{id}/activate | .../pause
 */
import "dotenv/config";

const BASE = "https://api.instantly.ai";

const apiKey = process.env.INSTANTLY_API_KEY?.trim();
const defaultId = process.env.INSTANTLY_CAMPAIGN_ID?.trim();

const [actionRaw, idArg] = process.argv.slice(2);
const action = (actionRaw || "").toLowerCase();
const campaignId = (idArg || defaultId || "").trim();

function usage() {
  console.error(`Usage:
  node --import dotenv/config scripts/instantly-campaign.mjs activate [campaign_uuid]
  node --import dotenv/config scripts/instantly-campaign.mjs pause [campaign_uuid]

Environment:
  INSTANTLY_API_KEY       (required)
  INSTANTLY_CAMPAIGN_ID   (optional default when uuid omitted)
`);
  process.exit(1);
}

if (!apiKey) {
  console.error("[instantly-campaign] INSTANTLY_API_KEY is not set.");
  usage();
}

if (!action || !["activate", "pause"].includes(action)) {
  console.error("[instantly-campaign] First argument must be activate | pause (pause = stop/pause in Instantly).");
  usage();
}

if (!campaignId) {
  console.error("[instantly-campaign] No campaign id: pass uuid or set INSTANTLY_CAMPAIGN_ID.");
  usage();
}

const path =
  action === "pause"
    ? `/api/v2/campaigns/${encodeURIComponent(campaignId)}/pause`
    : `/api/v2/campaigns/${encodeURIComponent(campaignId)}/activate`;

const url = `${BASE}${path}`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

if (!res.ok) {
  console.error("[instantly-campaign] HTTP", res.status, body);
  process.exit(1);
}

console.log("[instantly-campaign]", action, campaignId, "→ OK");
console.log(typeof body === "string" ? body : JSON.stringify(body, null, 2));
