/**
 * Waitlist Service — BidSmith Early Access
 *
 * Uses Railway PostgreSQL (DATABASE_URL).
 * Auto-creates the table on first write.
 */

import pg from "pg";
const { Pool } = pg;

export const waitlistDb = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.ANALYTICS_DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 5,
    })
  : null;

let tableReady = false;

// ─── Ensure table exists ──────────────────────────────────────────────────────

async function ensureTable() {
  if (!waitlistDb || tableReady) return;
  await waitlistDb.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name         TEXT NOT NULL,
      email        TEXT NOT NULL,
      company      TEXT,
      role         TEXT,
      use_case     TEXT,
      source       TEXT DEFAULT 'app',
      status       TEXT DEFAULT 'pending',
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      invited_at   TIMESTAMPTZ,
      notes        TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (LOWER(email));
  `);
  tableReady = true;
}

// ─── Public: add to waitlist ──────────────────────────────────────────────────

export async function addToWaitlist({ name, email, company, role, use_case, source = "app" }) {
  if (!waitlistDb) throw new Error("Database not configured");
  await ensureTable();
  const result = await waitlistDb.query(
    `INSERT INTO waitlist (name, email, company, role, use_case, source)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (LOWER(email)) DO UPDATE SET
       name     = EXCLUDED.name,
       company  = EXCLUDED.company,
       role     = EXCLUDED.role,
       use_case = EXCLUDED.use_case,
       source   = EXCLUDED.source
     RETURNING id, email, status, created_at`,
    [name, email?.toLowerCase().trim(), company, role, use_case, source]
  );
  return result.rows[0];
}

// ─── Admin: get all entries ───────────────────────────────────────────────────

export async function getWaitlist({ status, limit = 500 } = {}) {
  if (!waitlistDb) return [];
  await ensureTable();
  const params = [];
  let where = "";
  if (status) { params.push(status); where = `WHERE status = $1`; }
  const result = await waitlistDb.query(
    `SELECT id, name, email, company, role, use_case, source, status, created_at, invited_at, notes
     FROM waitlist ${where}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    params
  );
  return result.rows;
}

// ─── Admin: get stats ─────────────────────────────────────────────────────────

export async function getWaitlistStats() {
  if (!waitlistDb) return { pending: 0, invited: 0, joined: 0, total: 0, today: 0, this_week: 0 };
  await ensureTable();
  const result = await waitlistDb.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
      COUNT(*) FILTER (WHERE status = 'invited')  AS invited,
      COUNT(*) FILTER (WHERE status = 'joined')   AS joined,
      COUNT(*)                                     AS total,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS today,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')   AS this_week
    FROM waitlist
  `);
  return result.rows[0];
}

// ─── Admin: mark as invited ───────────────────────────────────────────────────

export async function markInvited(ids) {
  if (!waitlistDb) return;
  await waitlistDb.query(
    `UPDATE waitlist SET status = 'invited', invited_at = NOW()
     WHERE id = ANY($1::uuid[])`,
    [ids]
  );
}
