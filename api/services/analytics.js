import pg from "pg";
const { Pool } = pg;

export const analyticsDb = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.ANALYTICS_DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 10,
    })
  : null;

let analyticsSchemaReady = false;

export async function ensureAnalyticsSchema() {
  if (!analyticsDb || analyticsSchemaReady) return;
  
  await analyticsDb.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGSERIAL PRIMARY KEY,
      uid TEXT NOT NULL,
      event_type TEXT NOT NULL,
      value DOUBLE PRECISION NOT NULL DEFAULT 0,
      page TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL DEFAULT '/unknown',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS logic_library (
      pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_archetype TEXT NOT NULL,
      conflict_type TEXT NOT NULL,
      remediation_strategy TEXT,
      observation TEXT NOT NULL,
      frequency INT DEFAULT 1,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(agency_archetype, conflict_type, observation)
    );

    CREATE TABLE IF NOT EXISTS beta_signups (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS saved_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      uid TEXT NOT NULL,
      solicitation_number TEXT,
      title TEXT,
      agency TEXT,
      verdict TEXT,
      win_probability INT,
      risk_score INT,
      result JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pending_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      uid TEXT NOT NULL DEFAULT 'anonymous',
      user_email TEXT NOT NULL DEFAULT 'unknown',
      sam_url TEXT,
      solicitation_number TEXT,
      title TEXT,
      agency TEXT,
      verdict TEXT,
      win_probability INT,
      audit_result JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_logic_library_conflict ON logic_library (conflict_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups (email);
    CREATE INDEX IF NOT EXISTS idx_saved_audits_uid ON saved_audits (uid, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pending_reports_status ON pending_reports (status, created_at DESC);

    CREATE TABLE IF NOT EXISTS user_profiles (
      uid TEXT PRIMARY KEY,
      email TEXT,
      company_name TEXT,
      naics_codes JSONB DEFAULT '[]'::jsonb,
      capabilities TEXT,
      past_performance TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);


  analyticsSchemaReady = true;
}

export async function recordAnalyticsEvent(event) {
  if (!analyticsDb) return false;
  try {
    await ensureAnalyticsSchema();
    await analyticsDb.query(
      `INSERT INTO analytics_events (uid, event_type, value, page, path, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        event.uid || "anonymous",
        event.eventType || "unknown",
        event.value || 0,
        event.page || "",
        event.path || "/unknown",
        JSON.stringify(event.metadata || {}),
      ]
    );
    return true;
  } catch (err) {
    console.error("[ANALYTICS] record_failed", err.message);
    return false;
  }
}

export async function persistLogicPattern(pattern) {
  if (!analyticsDb) return false;
  try {
    await ensureAnalyticsSchema();
    const { agencyArchetype, conflictType, observation, remediation, metadata } = pattern;

    await analyticsDb.query(
      `INSERT INTO logic_library (agency_archetype, conflict_type, observation, remediation_strategy, metadata)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (agency_archetype, conflict_type, observation)
       DO UPDATE SET frequency = logic_library.frequency + 1, updated_at = NOW()`,
      [
        agencyArchetype,
        conflictType,
        observation,
        remediation || "",
        JSON.stringify(metadata || {})
      ]
    );
    return true;
  } catch (err) {
    console.error("[LOGIC_LIBRARY] persist_failed", err.message);
    return false;
  }
}

export async function recordBetaSignup(email, metadata = {}) {
  if (!analyticsDb) return false;
  try {
    await ensureAnalyticsSchema();
    await analyticsDb.query(
      "INSERT INTO beta_signups (email, metadata) VALUES ($1, $2::jsonb) ON CONFLICT (email) DO NOTHING",
      [email, JSON.stringify(metadata)]
    );
    return true;
  } catch (err) {
    console.error("[BETA_SIGNUP] record_failed", err.message);
    return false;
  }
}

export async function getBetaSignupCount() {
  if (!analyticsDb) return 0;
  try {
    const res = await analyticsDb.query("SELECT COUNT(*) FROM beta_signups");
    return parseInt(res.rows[0].count);
  } catch (err) {
    return 0;
  }
}

import { getRevenueStats, getStripeLogs } from "./stripe.js";

export async function getAdminStats() {
  if (!analyticsDb) return { error: "Database not configured" };
  try {
    await ensureAnalyticsSchema();

    const [
      signupCount, 
      recentSignups, 
      topEvents, 
      recentEvents, 
      dailyTraffic, 
      featureUsage, 
      logicLibrary,
      stripeStats,
      stripeLogs
    ] = await Promise.all([
      analyticsDb.query("SELECT COUNT(*) FROM beta_signups"),
      analyticsDb.query("SELECT * FROM beta_signups ORDER BY created_at DESC LIMIT 50"),
      analyticsDb.query(`
        SELECT event_type, COUNT(*) as count, SUM(value) as total_value
        FROM analytics_events
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 50
      `),
      analyticsDb.query(`
        SELECT uid, event_type, page, path, value, created_at, metadata
        FROM analytics_events
        ORDER BY created_at DESC
        LIMIT 100
      `),
      analyticsDb.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'Dy') AS day,
          COUNT(DISTINCT uid) AS visitors,
          COUNT(*) FILTER (WHERE event_type IN ('audit_started','checkout_initiated','trial_started')) AS conversions
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at)
      `),
      analyticsDb.query(`
        SELECT
          CASE
            WHEN event_type ILIKE '%audit%' THEN 'RFP Audit'
            WHEN event_type ILIKE '%sam%' OR event_type ILIKE '%search%' THEN 'SAM Scraper'
            WHEN event_type ILIKE '%matrix%' OR event_type ILIKE '%rtm%' THEN 'Matrix Gen'
            WHEN event_type ILIKE '%outreach%' OR event_type ILIKE '%checkout%' THEN 'Outreach'
            ELSE 'Other'
          END AS name,
          COUNT(*) AS value
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 2 DESC
      `),
      analyticsDb.query("SELECT * FROM logic_library ORDER BY updated_at DESC LIMIT 100"),
      getRevenueStats(),
      getStripeLogs()
    ]);

    return {
      beta_signups: {
        total: parseInt(signupCount.rows[0].count),
        rows: recentSignups.rows,
      },
      events: {
        by_type: topEvents.rows,
        rows: recentEvents.rows,
      },
      logic_library: logicLibrary.rows,
      daily_traffic: dailyTraffic.rows,
      feature_usage: featureUsage.rows,
      stripe: { ...stripeStats, logs: stripeLogs },
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    return { error: err.message };
  }
}

// ─── Saved Audits ─────────────────────────────────────────────────────────────

export async function saveAudit(uid, auditResult) {
  if (!analyticsDb) return null;
  try {
    await ensureAnalyticsSchema();
    const res = await analyticsDb.query(
      `INSERT INTO saved_audits (uid, solicitation_number, title, agency, verdict, win_probability, risk_score, result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING id, created_at`,
      [
        uid,
        auditResult.solicitation_number || null,
        auditResult.title || null,
        auditResult.agency || null,
        auditResult.verdict?.recommendation || null,
        auditResult.verdict?.win_probability ?? null,
        auditResult.riskAssessment?.score ?? null,
        JSON.stringify(auditResult),
      ]
    );
    return res.rows[0];
  } catch (err) {
    console.error("[SAVED_AUDITS] save_failed", err.message);
    return null;
  }
}

export async function getAuditHistory(uid, limit = 20) {
  if (!analyticsDb) return [];
  try {
    await ensureAnalyticsSchema();
    const res = await analyticsDb.query(
      `SELECT id, solicitation_number, title, agency, verdict, win_probability, risk_score, created_at
       FROM saved_audits
       WHERE uid = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [uid, limit]
    );
    return res.rows;
  } catch (err) {
    console.error("[SAVED_AUDITS] history_failed", err.message);
    return [];
  }
}

export async function getAuditById(id, uid) {
  if (!analyticsDb) return null;
  try {
    await ensureAnalyticsSchema();
    const res = await analyticsDb.query(
      `SELECT * FROM saved_audits WHERE id = $1 AND uid = $2`,
      [id, uid]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("[SAVED_AUDITS] fetch_failed", err.message);
    return null;
  }
}

// ─── User Profiles (Sovereign Intelligence) ───────────────────────────────────

export async function getUserProfile(uid) {
  if (!analyticsDb) return null;
  try {
    await ensureAnalyticsSchema();
    const res = await analyticsDb.query(
      `SELECT * FROM user_profiles WHERE uid = $1`,
      [uid]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("[USER_PROFILES] fetch_failed", err.message);
    return null;
  }
}

export async function saveUserProfile(uid, payload) {
  if (!analyticsDb) return null;
  try {
    await ensureAnalyticsSchema();
    const { email, company_name, naics_codes, capabilities, past_performance } = payload;
    
    // Upsert the profile
    const res = await analyticsDb.query(
      `INSERT INTO user_profiles (uid, email, company_name, naics_codes, capabilities, past_performance)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)
       ON CONFLICT (uid) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, user_profiles.email),
         company_name = EXCLUDED.company_name,
         naics_codes = EXCLUDED.naics_codes,
         capabilities = EXCLUDED.capabilities,
         past_performance = EXCLUDED.past_performance,
         updated_at = NOW()
       RETURNING *`,
      [
        uid, 
        email || null, 
        company_name || null, 
        JSON.stringify(naics_codes || []), 
        capabilities || null, 
        past_performance || null
      ]
    );
    return res.rows[0];
  } catch (err) {
    console.error("[USER_PROFILES] save_failed", err.message);
    return null;
  }
}

// ─── Pending Reports ──────────────────────────────────────────────────────────

export async function savePendingReport({ uid, user_email, sam_url, solicitation_number, title, agency, verdict, win_probability, audit_result }) {
  if (!analyticsDb) return null;
  try {
    await ensureAnalyticsSchema();
    const res = await analyticsDb.query(
      `INSERT INTO pending_reports (uid, user_email, sam_url, solicitation_number, title, agency, verdict, win_probability, audit_result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       RETURNING id`,
      [uid || "anonymous", user_email || "unknown", sam_url || null, solicitation_number || null, title || null, agency || null, verdict || null, win_probability ?? null, JSON.stringify(audit_result || {})]
    );
    return res.rows[0];
  } catch (err) {
    console.error("[PENDING_REPORTS] save_failed", err.message);
    return null;
  }
}

export async function getPendingReports(status = null) {
  if (!analyticsDb) return [];
  try {
    await ensureAnalyticsSchema();
    const query = status
      ? `SELECT * FROM pending_reports WHERE status = $1 ORDER BY created_at DESC LIMIT 200`
      : `SELECT * FROM pending_reports ORDER BY created_at DESC LIMIT 200`;
    const res = await analyticsDb.query(query, status ? [status] : []);
    return res.rows;
  } catch (err) {
    console.error("[PENDING_REPORTS] list_failed", err.message);
    return [];
  }
}

export async function getPendingReportById(id) {
  if (!analyticsDb) return null;
  try {
    await ensureAnalyticsSchema();
    const res = await analyticsDb.query(`SELECT * FROM pending_reports WHERE id = $1`, [id]);
    return res.rows[0] || null;
  } catch (err) {
    console.error("[PENDING_REPORTS] fetch_failed", err.message);
    return null;
  }
}

export async function markReportSent(id) {
  if (!analyticsDb) return false;
  try {
    await analyticsDb.query(
      `UPDATE pending_reports SET status = 'sent', sent_at = NOW() WHERE id = $1`,
      [id]
    );
    return true;
  } catch (err) {
    console.error("[PENDING_REPORTS] mark_sent_failed", err.message);
    return false;
  }
}

export async function updateReportNotes(id, admin_notes) {
  if (!analyticsDb) return false;
  try {
    await analyticsDb.query(
      `UPDATE pending_reports SET admin_notes = $2 WHERE id = $1`,
      [id, admin_notes]
    );
    return true;
  } catch (err) {
    console.error("[PENDING_REPORTS] notes_failed", err.message);
    return false;
  }
}

export function renderAnalyticsDashboard(snapshot) {
  return `
    <html>
      <head>
        <title>ARIS Analytics</title>
        <style>
          body { background:#05070b; color:#f4f7ff; font-family: 'Inter', system-ui, sans-serif; padding:40px; }
          .card { background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-top: 20px; }
          h1 { letter-spacing: -0.04em; }
          pre { background: #000; padding: 15px; border-radius: 8px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>ARIS Protocol Analytics Dashboard</h1>
        <p>Operational Status: <strong>STATELESS_BRIDGE v2.1</strong></p>
        
        <div class="card">
          <h2>Sovereign Matrix Stats</h2>
          <pre>${JSON.stringify(snapshot, null, 2)}</pre>
        </div>
        
        <div class="card">
          <h2>Monetization & Conversion</h2>
          <p>This data is retrieved from the Distributed Database Layer.</p>
        </div>
      </body>
    </html>
  `;
}
