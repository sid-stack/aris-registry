/**
 * Waitlist Service — BidSmith Early Access
 *
 * Uses Railway PostgreSQL (DATABASE_URL).
 * Auto-creates the table on first write.
 */

import pkg from "pg";
const { Pool } = pkg;

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.ANALYTICS_DB_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

// ─── Ensure table exists ──────────────────────────────────────────────────────

async function ensureTable(client) {
  await client.query(`
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
}

// ─── Public: add to waitlist ──────────────────────────────────────────────────

export async function addToWaitlist({ name, email, company, role, use_case, source = "app" }) {
  const client = await getPool().connect();
  try {
    await ensureTable(client);
    const result = await client.query(
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
  } finally {
    client.release();
  }
}

// ─── Admin: get all entries ───────────────────────────────────────────────────

export async function getWaitlist({ status, limit = 500 } = {}) {
  const client = await getPool().connect();
  try {
    await ensureTable(client);
    const params = [];
    let where = "";
    if (status) { params.push(status); where = `WHERE status = $1`; }
    const result = await client.query(
      `SELECT id, name, email, company, role, use_case, source, status, created_at, invited_at, notes
       FROM waitlist ${where}
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      params
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// ─── Admin: get stats ─────────────────────────────────────────────────────────

export async function getWaitlistStats() {
  const client = await getPool().connect();
  try {
    await ensureTable(client);
    const result = await client.query(`
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
  } finally {
    client.release();
  }
}

// ─── Admin: mark as invited ───────────────────────────────────────────────────

export async function markInvited(ids) {
  const client = await getPool().connect();
  try {
    await client.query(
      `UPDATE waitlist SET status = 'invited', invited_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [ids]
    );
  } finally {
    client.release();
  }
}
