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
      agency_archetype TEXT NOT NULL, -- e.g. 'FINANCE_REGULATOR', 'DEFENSE_DLA'
      conflict_type TEXT NOT NULL,    -- e.g. 'SECTION_L_M_MISMATCH'
      logic_vector VECTOR(1536),      -- Semantic mapping of the pattern
      constraint_severity INT DEFAULT 1, -- 1-5 scale
      remediation_strategy TEXT,      -- The "Win" advice
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

    CREATE INDEX IF NOT EXISTS idx_logic_library_conflict ON logic_library (conflict_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups (email);
  `);
  
  analyticsSchemaReady = true;
}

export async function recordAnalyticsEvent(event) {
  if (!analyticsDb) return false;
  try {
    await ensureAnalyticsSchema();
    await analyticsDb.query(
      \`INSERT INTO analytics_events (uid, event_type, value, page, path, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)\`,
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
    const { 
      agencyArchetype, 
      conflictType, 
      observation, 
      severity, 
      remediation, 
      metadata,
      vector 
    } = pattern;

    await analyticsDb.query(
      \`INSERT INTO logic_library (agency_archetype, conflict_type, observation, constraint_severity, remediation_strategy, metadata, logic_vector)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (agency_archetype, conflict_type, observation) 
       DO UPDATE SET frequency = logic_library.frequency + 1, updated_at = NOW()\`,
      [
        agencyArchetype, 
        conflictType, 
        observation, 
        severity || 1, 
        remediation || "", 
        JSON.stringify(metadata || {}),
        vector 
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

export function renderAnalyticsDashboard(snapshot) {
  return \`
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
          <pre>\${JSON.stringify(snapshot, null, 2)}</pre>
        </div>
        
        <div class="card">
          <h2>Monetization & Conversion</h2>
          <p>This data is retrieved from the Distributed Database Layer.</p>
        </div>
      </body>
    </html>
  \`;
}
