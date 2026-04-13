/**
 * Railway / Nixpacks often leave NODE_ENV unset. Express + /app-config.js treat
 * production from NODE_ENV === "production". This runs immediately after
 * dotenv/config (see api/index.js) — not during `npm install`, so devDependencies
 * are unaffected on the builder.
 */
const onHostedRailway = Boolean(
  process.env.RAILWAY_PROJECT_ID?.trim()
    || process.env.RAILWAY_SERVICE_ID?.trim()
    || process.env.RAILWAY_ENVIRONMENT_NAME?.trim()
    || process.env.RAILWAY_ENVIRONMENT?.trim(),
);

const raw = process.env.NODE_ENV;
if ((!raw || !String(raw).trim()) && onHostedRailway) {
  process.env.NODE_ENV = "production";
}
