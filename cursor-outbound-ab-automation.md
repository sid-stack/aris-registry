# Cursor Prompt — Outbound A/B Testing + Full Automation

**Mission: Build a self-running outbound system inside the repo. Apollo pulls leads, sequences run in Instantly, A/B variants rotate automatically, results log to the DB, and the daily brief reports what's winning. No manual steps after setup.**

---

## Context

- Cold email platform: Instantly / Smartlead / Lemlist (already set up)
- Lead source: Apollo (API key in `.env` as `APOLLO_API_KEY`)
- Sending identity: `sid@bidsmith.pro` (primary), add second domain for volume
- DB: Postgres on Railway (`DATABASE_URL`)
- Daily brief: already runs at 08:00 IST via `trafficBriefScheduler.js`
- Target: 60–80 cold emails/day across 2 warmed domains
- ICP: GovCon firms, 20–200 employees, BD Director / Capture Manager / CEO

---

## Part 1 — Database schema (run once)

Add to `api/db/migrations/` a new migration file `004_outbound_ab.sql`:

```sql
-- A/B test variants
CREATE TABLE IF NOT EXISTS ab_variants (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(100) NOT NULL,        -- e.g. 'subject_line_oct'
  variant_key VARCHAR(10) NOT NULL,       -- 'A', 'B', 'C'
  subject TEXT,
  body_template TEXT,                     -- supports {{firstName}}, {{company}}, {{signal}}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per lead per variant
CREATE TABLE IF NOT EXISTS outbound_leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  title VARCHAR(255),
  signal TEXT,                            -- personalization hook from Apollo/Clay
  linkedin_url TEXT,
  apollo_id VARCHAR(100),
  variant_key VARCHAR(10),               -- which A/B variant was assigned
  test_name VARCHAR(100),
  sequence_step INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',  -- pending | sent | opened | replied | bounced | converted
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  instantly_lead_id VARCHAR(255),        -- ID from Instantly API after push
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event log per lead
CREATE TABLE IF NOT EXISTS outbound_events (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES outbound_leads(id),
  event_type VARCHAR(50),               -- sent | opened | replied | bounced | clicked | converted
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly A/B summary (materialized manually or via cron)
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
```

---

## Part 2 — Seed A/B variants

Create `api/db/seeds/outbound_variants.sql`:

```sql
-- Test 1: Subject line (all same body, different subjects)
INSERT INTO ab_variants (test_name, variant_key, subject, body_template) VALUES
('subject_v1', 'A',
 '{{company}} + SAM.gov bids',
 'Hi {{firstName}},

Saw {{company}} is active in government contracting. {{signal}}

Most BD teams your size spend 4–6 hours qualifying each opportunity manually.
BidSmith gives you bid/no-bid + full compliance matrix in 60 seconds.

Free to try: bidsmith.pro/free-audit — no demo, no credit card.

Worth a look?

Sid
Founder, ARIS Labs | bidsmith.pro'),

('subject_v1', 'B',
 'How long does {{company}} spend per RFP?',
 'Hi {{firstName}},

{{signal}} — figured bid qualification was on your radar.

We built BidSmith for BD teams that are reviewing too many opportunities manually.
Paste a SAM.gov link, get bid/no-bid + compliance matrix in 60 seconds.

No demo. No onboarding. Free: bidsmith.pro/free-audit

Sid
Founder, ARIS Labs | bidsmith.pro'),

('subject_v1', 'C',
 'Compliance matrix for {{company}} bids',
 'Hi {{firstName}},

Quick one — {{signal}}.

BidSmith auto-generates your compliance matrix from any SAM.gov link in under a minute.
The firms we work with cut RFP qualification time by 80%.

Try it free: bidsmith.pro/free-audit

Sid | BidSmith');

-- Test 2: CTA style (soft vs direct)
INSERT INTO ab_variants (test_name, variant_key, subject, body_template) VALUES
('cta_v1', 'A',
 '{{company}} + government bids',
 'Hi {{firstName}},

{{signal}}

BidSmith turns any SAM.gov link into a bid/no-bid decision + compliance matrix in 60 seconds.
Built for teams like yours — no enterprise contract, no demo required.

Worth 60 seconds? bidsmith.pro/free-audit

Sid'),

('cta_v1', 'B',
 '{{company}} + government bids',
 'Hi {{firstName}},

{{signal}}

Can I show you BidSmith on one of your current opportunities?
Takes 5 minutes — you share a SAM.gov link, I run it live.

Free either way. Calendar: [CALENDLY_LINK]

Sid');
```

---

## Part 3 — Apollo lead puller (`api/jobs/apolloPullLeads.js`)

Create this file:

```js
/**
 * Pulls leads from Apollo matching BidSmith ICP, assigns A/B variant,
 * deduplicates against outbound_leads, writes to DB.
 * Run manually or via cron (see Part 6).
 */
import fetch from 'node-fetch';
import { pool } from '../db/pool.js';

const APOLLO_KEY = process.env.APOLLO_API_KEY;
const DAILY_TARGET = parseInt(process.env.OUTBOUND_DAILY_TARGET || '80');

// ICP filters — adjust as needed
const APOLLO_SEARCH_PARAMS = {
  api_key: APOLLO_KEY,
  per_page: DAILY_TARGET,
  person_titles: [
    'Director of Business Development',
    'VP Business Development',
    'Capture Manager',
    'Director of Capture',
    'Proposal Manager',
    'CEO',
    'President',
    'Managing Partner',
  ],
  organization_num_employees_ranges: ['20,200'],
  organization_industry_tag_ids: [], // add govcon tag IDs if available
  q_organization_keyword_tags: ['government contracting', 'federal contracting', 'RFP', 'IDIQ'],
  contact_email_status: ['verified'],
};

export async function pullApolloLeads() {
  console.log('[apolloPull] Starting Apollo lead pull...');

  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(APOLLO_SEARCH_PARAMS),
  });

  const data = await res.json();
  const people = data.people || [];
  console.log(`[apolloPull] Got ${people.length} people from Apollo`);

  // Get active variants for round-robin assignment
  const variantsRes = await pool.query(
    `SELECT * FROM ab_variants WHERE is_active = true AND test_name = $1`,
    ['subject_v1']
  );
  const variants = variantsRes.rows;
  if (!variants.length) throw new Error('No active variants found');

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const email = p.email;
    if (!email) { skipped++; continue; }

    // Round-robin variant assignment
    const variant = variants[i % variants.length];

    // Build signal from Apollo data
    const signal = buildSignal(p);

    try {
      await pool.query(`
        INSERT INTO outbound_leads
          (email, first_name, last_name, company, title, signal, linkedin_url, apollo_id, variant_key, test_name)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (email) DO NOTHING
      `, [
        email,
        p.first_name,
        p.last_name,
        p.organization?.name,
        p.title,
        signal,
        p.linkedin_url,
        p.id,
        variant.variant_key,
        variant.test_name,
      ]);
      inserted++;
    } catch (e) {
      console.error('[apolloPull] Insert error:', e.message);
    }
  }

  console.log(`[apolloPull] Done. Inserted: ${inserted}, Skipped/dupes: ${skipped}`);
  return { inserted, skipped };
}

function buildSignal(person) {
  // Build a one-line personalization signal from Apollo data
  const org = person.organization;
  if (!org) return 'saw you\'re active in government contracting';

  if (org.job_postings?.some(j => /proposal|capture|bid/i.test(j.title))) {
    return `saw ${org.name} is hiring for proposal/capture roles`;
  }
  if (org.keywords?.some(k => /rfp|idiq|gwac|govcon/i.test(k))) {
    return `saw ${org.name} is active in federal contracting`;
  }
  return `saw ${org.name} works in government contracting`;
}
```

---

## Part 4 — Instantly pusher (`api/jobs/instantlyPushLeads.js`)

```js
/**
 * Takes pending leads from DB, personalizes their assigned variant,
 * pushes to Instantly campaign, marks as sent.
 * Run after apolloPullLeads.
 */
import fetch from 'node-fetch';
import { pool } from '../db/pool.js';

const INSTANTLY_KEY = process.env.INSTANTLY_API_KEY;
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;
const BATCH_SIZE = parseInt(process.env.OUTBOUND_BATCH_SIZE || '80');

export async function pushLeadsToInstantly() {
  // Get pending leads with their variant
  const { rows: leads } = await pool.query(`
    SELECT l.*, v.subject, v.body_template
    FROM outbound_leads l
    JOIN ab_variants v ON v.variant_key = l.variant_key AND v.test_name = l.test_name
    WHERE l.status = 'pending'
    ORDER BY l.created_at ASC
    LIMIT $1
  `, [BATCH_SIZE]);

  console.log(`[instantlyPush] Pushing ${leads.length} leads...`);

  for (const lead of leads) {
    const personalizedBody = personalize(lead.body_template, lead);
    const personalizedSubject = personalize(lead.subject, lead);

    const payload = {
      api_key: INSTANTLY_KEY,
      campaign_id: INSTANTLY_CAMPAIGN_ID,
      email: lead.email,
      first_name: lead.first_name,
      last_name: lead.last_name,
      company_name: lead.company,
      personalization: personalizedBody,
      custom_variables: {
        subject_override: personalizedSubject,
        variant: lead.variant_key,
        ab_test: lead.test_name,
      },
    };

    try {
      const res = await fetch('https://api.instantly.ai/api/v1/lead/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      await pool.query(`
        UPDATE outbound_leads
        SET status = 'sent', sent_at = NOW(), instantly_lead_id = $1
        WHERE id = $2
      `, [data.id || null, lead.id]);

      await pool.query(`
        INSERT INTO outbound_events (lead_id, event_type, metadata)
        VALUES ($1, 'sent', $2)
      `, [lead.id, JSON.stringify({ variant: lead.variant_key, campaign: INSTANTLY_CAMPAIGN_ID })]);

    } catch (e) {
      console.error(`[instantlyPush] Failed for ${lead.email}:`, e.message);
    }
  }

  console.log('[instantlyPush] Done.');
}

function personalize(template, lead) {
  return (template || '')
    .replace(/\{\{firstName\}\}/g, lead.first_name || 'there')
    .replace(/\{\{company\}\}/g, lead.company || 'your firm')
    .replace(/\{\{signal\}\}/g, lead.signal || 'saw you\'re active in GovCon')
    .replace(/\{\{title\}\}/g, lead.title || '')
    .replace(/\[CALENDLY_LINK\]/g, process.env.CALENDLY_URL || 'calendly.com/bidsmith');
}
```

---

## Part 5 — Instantly webhook handler (`api/routes/instantlyWebhook.js`)

Instantly sends events (opened, replied, bounced) via webhook. Catch them and update DB:

```js
import express from 'express';
import { pool } from '../db/pool.js';

export const instantlyWebhookRouter = express.Router();

// Register in api/index.js: app.use('/api/webhooks/instantly', instantlyWebhookRouter)
instantlyWebhookRouter.post('/', async (req, res) => {
  const { event_type, lead_email, campaign_id, timestamp } = req.body;

  const eventMap = {
    'email_opened':   'opened',
    'email_replied':  'replied',
    'email_bounced':  'bounced',
    'email_clicked':  'clicked',
    'lead_unsubscribed': 'unsubscribed',
  };

  const mappedEvent = eventMap[event_type];
  if (!mappedEvent) return res.json({ ok: true });

  const { rows } = await pool.query(
    `SELECT id FROM outbound_leads WHERE email = $1`, [lead_email]
  );
  if (!rows.length) return res.json({ ok: true });

  const leadId = rows[0].id;
  const tsField = {
    opened: 'opened_at',
    replied: 'replied_at',
  }[mappedEvent];

  if (tsField) {
    await pool.query(
      `UPDATE outbound_leads SET status = $1, ${tsField} = $2 WHERE id = $3`,
      [mappedEvent, timestamp || new Date(), leadId]
    );
  } else {
    await pool.query(
      `UPDATE outbound_leads SET status = $1 WHERE id = $2`,
      [mappedEvent, leadId]
    );
  }

  await pool.query(
    `INSERT INTO outbound_events (lead_id, event_type, metadata) VALUES ($1, $2, $3)`,
    [leadId, mappedEvent, JSON.stringify(req.body)]
  );

  res.json({ ok: true });
});
```

---

## Part 6 — A/B results calculator (`api/jobs/abResultsCalculator.js`)

```js
import { pool } from '../db/pool.js';

export async function calculateAbResults() {
  const { rows } = await pool.query(`
    SELECT
      test_name,
      variant_key,
      COUNT(*) FILTER (WHERE status != 'pending') AS sent_count,
      COUNT(*) FILTER (WHERE status = 'opened' OR opened_at IS NOT NULL) AS open_count,
      COUNT(*) FILTER (WHERE status = 'replied' OR replied_at IS NOT NULL) AS reply_count,
      COUNT(*) FILTER (WHERE status = 'converted' OR converted_at IS NOT NULL) AS paid_count,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE opened_at IS NOT NULL) /
        NULLIF(COUNT(*) FILTER (WHERE sent_at IS NOT NULL), 0), 2
      ) AS open_rate,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE replied_at IS NOT NULL) /
        NULLIF(COUNT(*) FILTER (WHERE sent_at IS NOT NULL), 0), 2
      ) AS reply_rate
    FROM outbound_leads
    GROUP BY test_name, variant_key
    ORDER BY test_name, reply_rate DESC NULLS LAST
  `);

  // Mark winner per test (highest reply rate with >= 20 sends)
  const tests = {};
  for (const row of rows) {
    if (!tests[row.test_name]) tests[row.test_name] = [];
    tests[row.test_name].push(row);
  }

  await pool.query(`DELETE FROM ab_results`);

  for (const [testName, variants] of Object.entries(tests)) {
    const eligible = variants.filter(v => v.sent_count >= 20);
    const winner = eligible.sort((a, b) => b.reply_rate - a.reply_rate)[0];

    for (const v of variants) {
      await pool.query(`
        INSERT INTO ab_results
          (test_name, variant_key, sent_count, open_count, reply_count, paid_count,
           open_rate, reply_rate, winner, computed_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      `, [
        v.test_name, v.variant_key,
        v.sent_count, v.open_count, v.reply_count, v.paid_count,
        v.open_rate, v.reply_rate,
        winner && v.variant_key === winner.variant_key,
      ]);
    }
  }

  console.log('[abResults] Calculated. Results:', rows);
  return rows;
}
```

---

## Part 7 — Wire into daily brief (`trafficBriefScheduler.js`)

In the existing daily brief email, add an outbound A/B section:

```js
import { calculateAbResults } from './jobs/abResultsCalculator.js';

// Inside the brief generation function, add:
const abResults = await calculateAbResults();

const abSection = abResults.length ? `
## Outbound A/B Results

${abResults.map(r => `
**${r.test_name} — Variant ${r.variant_key}** ${r.winner ? '🏆 WINNER' : ''}
- Sent: ${r.sent_count} | Opens: ${r.open_rate}% | Replies: ${r.reply_rate}%
`).join('\n')}

${abResults.filter(r => r.winner).map(r =>
  `→ Winning variant: ${r.variant_key} on ${r.test_name} (${r.reply_rate}% reply rate)`
).join('\n')}
` : '## Outbound A/B\nNo data yet — need 20+ sends per variant.';

// Add abSection to brief email body
```

---

## Part 8 — Scheduled cron jobs (`api/jobs/outboundCron.js`)

```js
import cron from 'node-cron';
import { pullApolloLeads } from './apolloPullLeads.js';
import { pushLeadsToInstantly } from './instantlyPushLeads.js';
import { calculateAbResults } from './abResultsCalculator.js';

// Pull new leads from Apollo every day at 7:00 AM IST
cron.schedule('30 1 * * *', async () => {
  console.log('[cron] Running Apollo lead pull...');
  await pullApolloLeads();
}, { timezone: 'Asia/Kolkata' });

// Push to Instantly every day at 7:30 AM IST (30 min after pull)
cron.schedule('0 2 * * *', async () => {
  console.log('[cron] Pushing leads to Instantly...');
  await pushLeadsToInstantly();
}, { timezone: 'Asia/Kolkata' });

// Recalculate A/B results every day at 7:45 AM IST (feeds into 8:00 brief)
cron.schedule('15 2 * * *', async () => {
  console.log('[cron] Calculating A/B results...');
  await calculateAbResults();
}, { timezone: 'Asia/Kolkata' });
```

Import in `api/index.js`:
```js
import './jobs/outboundCron.js';
```

---

## Part 9 — Admin dashboard panel (`src/components/OutboundAbPanel.jsx`)

Add to `BentoDashboard` admin view:

```jsx
import { useEffect, useState } from 'react';

export function OutboundAbPanel() {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/api/admin/ab-results')
      .then(r => r.json())
      .then(d => {
        setResults(d.variants || []);
        setSummary(d.summary || null);
      });
  }, []);

  return (
    <div style={{ padding: 24, background: '#0f172a', borderRadius: 12, color: '#f1f5f9' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Outbound A/B Results
      </h2>

      {summary && (
        <div style={{ marginBottom: 16, padding: 12, background: '#1e293b', borderRadius: 8 }}>
          <strong>Total sent:</strong> {summary.total_sent} &nbsp;|&nbsp;
          <strong>Avg open rate:</strong> {summary.avg_open_rate}% &nbsp;|&nbsp;
          <strong>Avg reply rate:</strong> {summary.avg_reply_rate}% &nbsp;|&nbsp;
          <strong>Converted:</strong> {summary.total_converted}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px' }}>Test</th>
            <th style={{ padding: '8px 12px' }}>Variant</th>
            <th style={{ padding: '8px 12px' }}>Sent</th>
            <th style={{ padding: '8px 12px' }}>Opens</th>
            <th style={{ padding: '8px 12px' }}>Replies</th>
            <th style={{ padding: '8px 12px' }}>Converted</th>
            <th style={{ padding: '8px 12px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} style={{
              borderTop: '1px solid #1e293b',
              background: r.winner ? '#14532d22' : 'transparent'
            }}>
              <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{r.test_name}</td>
              <td style={{ padding: '8px 12px', fontWeight: 700 }}>Variant {r.variant_key}</td>
              <td style={{ padding: '8px 12px' }}>{r.sent_count}</td>
              <td style={{ padding: '8px 12px' }}>{r.open_rate}%</td>
              <td style={{ padding: '8px 12px', color: r.reply_rate > 5 ? '#4ade80' : '#f1f5f9' }}>
                {r.reply_rate}%
              </td>
              <td style={{ padding: '8px 12px' }}>{r.paid_count}</td>
              <td style={{ padding: '8px 12px' }}>
                {r.winner
                  ? <span style={{ color: '#4ade80', fontWeight: 700 }}>🏆 Winner</span>
                  : r.sent_count < 20
                    ? <span style={{ color: '#94a3b8' }}>Collecting...</span>
                    : <span style={{ color: '#f59e0b' }}>Testing</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!results.length && (
        <p style={{ color: '#94a3b8', marginTop: 16 }}>
          No outbound data yet. Needs 20+ sends per variant to show results.
        </p>
      )}
    </div>
  );
}
```

Add API route `GET /api/admin/ab-results` in `api/index.js`:
```js
app.get('/api/admin/ab-results', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM ab_results ORDER BY test_name, reply_rate DESC`);
  const summary = await pool.query(`
    SELECT
      SUM(sent_count) as total_sent,
      ROUND(AVG(open_rate),2) as avg_open_rate,
      ROUND(AVG(reply_rate),2) as avg_reply_rate,
      SUM(paid_count) as total_converted
    FROM ab_results
  `);
  res.json({ variants: rows, summary: summary.rows[0] });
});
```

---

## Part 10 — Environment variables to add

In `.env` and Railway:
```
INSTANTLY_API_KEY=...
INSTANTLY_CAMPAIGN_ID=...
OUTBOUND_DAILY_TARGET=80
OUTBOUND_BATCH_SIZE=80
CALENDLY_URL=https://calendly.com/bidsmith/demo
```

In `.env.example` (no values):
```
INSTANTLY_API_KEY=
INSTANTLY_CAMPAIGN_ID=
OUTBOUND_DAILY_TARGET=80
OUTBOUND_BATCH_SIZE=80
CALENDLY_URL=
```

---

## Part 11 — Register Instantly webhook

In Instantly dashboard:
- Webhook URL: `https://api.bidsmith.pro/api/webhooks/instantly`
- Events to enable: `email_opened`, `email_replied`, `email_bounced`, `email_clicked`, `lead_unsubscribed`

---

## Verification checklist

- [ ] Migration `004_outbound_ab.sql` runs clean on Railway Postgres
- [ ] Variants seeded — `SELECT * FROM ab_variants` returns 5 rows
- [ ] `pullApolloLeads()` inserts leads with variant assigned — check `outbound_leads`
- [ ] `pushLeadsToInstantly()` marks leads as `sent` and logs to `outbound_events`
- [ ] Instantly webhook fires on test open → `outbound_events` gets an `opened` row
- [ ] `calculateAbResults()` runs and populates `ab_results`
- [ ] Daily brief email includes outbound A/B section
- [ ] Admin panel `/dashboard` shows `OutboundAbPanel` with live data
- [ ] `npm test` still 11/11
- [ ] No secrets committed — `.env` in `.gitignore`

---

## Commit

```
feat(outbound): Apollo pull → Instantly push → A/B tracking → daily brief + admin panel
```

Push to `main`. Railway auto-deploys API with cron jobs active.

**Do not touch:** `signup-export-flow.spec.ts`, `.vercel/project.json`, Clerk keys, existing analytics events.

**Stop only when:** leads are flowing Apollo → DB → Instantly, webhook events updating DB, A/B panel shows data in admin, daily brief includes outbound section.
