-- Outbound A/B + Instantly pipeline (also applied via `ensureAnalyticsSchema` on API boot).
-- Run manually on Railway if preferred: `psql $DATABASE_URL -f api/db/migrations/004_outbound_ab.sql`

CREATE TABLE IF NOT EXISTS ab_variants (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(100) NOT NULL,
  variant_key VARCHAR(10) NOT NULL,
  subject TEXT,
  body_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_name, variant_key)
);

CREATE TABLE IF NOT EXISTS outbound_leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  title VARCHAR(255),
  signal TEXT,
  linkedin_url TEXT,
  apollo_id VARCHAR(100),
  variant_key VARCHAR(10),
  test_name VARCHAR(100),
  sequence_step INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  instantly_lead_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_leads_status ON outbound_leads (status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_leads_test_variant ON outbound_leads (test_name, variant_key);

CREATE TABLE IF NOT EXISTS outbound_events (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES outbound_leads(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_events_lead ON outbound_events (lead_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS ab_results (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(100),
  variant_key VARCHAR(10),
  sent_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  demo_count INT DEFAULT 0,
  paid_count INT DEFAULT 0,
  open_rate DECIMAL(5,2),
  reply_rate DECIMAL(5,2),
  close_rate DECIMAL(5,2),
  winner BOOLEAN DEFAULT false,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);
