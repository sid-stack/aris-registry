/**
 * Newsletter subscribers — The Bid Brief / marketing list.
 * Uses same DATABASE_URL pool pattern as waitlist.js.
 */

import pg from "pg";
const { Pool } = pg;

export const newsletterDb = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.ANALYTICS_DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 5,
    })
  : null;

let tableReady = false;

async function ensureTable() {
  if (!newsletterDb || tableReady) return;
  await newsletterDb.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email      TEXT NOT NULL,
      source     TEXT DEFAULT 'newsletter',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_idx
      ON newsletter_subscribers (email);
  `);
  tableReady = true;
}

/**
 * @param {string} email
 * @param {{ source?: string }} [opts]
 * @returns {Promise<{ ok: boolean, alreadySubscribed: boolean }>}
 */
export async function subscribeNewsletter(email, opts = {}) {
  if (!newsletterDb) throw new Error("Database not configured");
  await ensureTable();
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) throw new Error("Email required");
  const source = String(opts.source || "newsletter").slice(0, 64);

  const ins = await newsletterDb.query(
    `INSERT INTO newsletter_subscribers (email, source)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [normalized, source],
  );

  if (ins.rowCount > 0) {
    return { ok: true, alreadySubscribed: false };
  }

  return { ok: true, alreadySubscribed: true };
}
