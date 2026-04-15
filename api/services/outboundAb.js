import { analyticsDb, ensureAnalyticsSchema } from "./analytics.js";

let outboundSeedDone = false;

/** Idempotent seed for A/B templates (see `api/db/seeds/outbound_variants.sql`). */
export async function ensureOutboundAbSeed() {
  if (!analyticsDb || outboundSeedDone) return;
  await ensureAnalyticsSchema();

  const { rows } = await analyticsDb.query(`SELECT COUNT(*)::int AS c FROM ab_variants`);
  if (rows[0].c > 0) {
    outboundSeedDone = true;
    return;
  }

  const seeds = [
    ["subject_v1", "A", "{{company}} + SAM.gov bids", `Hi {{firstName}},

Saw {{company}} is active in government contracting. {{signal}}

Most BD teams your size spend 4–6 hours qualifying each opportunity manually.
BidSmith gives you bid/no-bid + full compliance matrix in 60 seconds.

Free to try: bidsmith.pro/free-audit — no demo, no credit card.

Worth a look?

Sid
Founder, ARIS Labs | bidsmith.pro`],
    ["subject_v1", "B", "How long does {{company}} spend per RFP?", `Hi {{firstName}},

{{signal}} — figured bid qualification was on your radar.

We built BidSmith for BD teams that are reviewing too many opportunities manually.
Paste a SAM.gov link, get bid/no-bid + compliance matrix in 60 seconds.

No demo. No onboarding. Free: bidsmith.pro/free-audit

Sid
Founder, ARIS Labs | bidsmith.pro`],
    ["subject_v1", "C", "Compliance matrix for {{company}} bids", `Hi {{firstName}},

Quick one — {{signal}}.

BidSmith auto-generates your compliance matrix from any SAM.gov link in under a minute.
The firms we work with cut RFP qualification time by 80%.

Try it free: bidsmith.pro/free-audit

Sid | BidSmith`],
    ["cta_v1", "A", "{{company}} + government bids", `Hi {{firstName}},

{{signal}}

BidSmith turns any SAM.gov link into a bid/no-bid decision + compliance matrix in 60 seconds.
Built for teams like yours — no enterprise contract, no demo required.

Worth 60 seconds? bidsmith.pro/free-audit

Sid`],
    ["cta_v1", "B", "{{company}} + government bids", `Hi {{firstName}},

{{signal}}

Can I show you BidSmith on one of your current opportunities?
Takes 5 minutes — you share a SAM.gov link, I run it live.

Free either way. Calendar: [CALENDLY_LINK]

Sid`],
  ];

  for (const [test_name, variant_key, subject, body_template] of seeds) {
    await analyticsDb.query(
      `INSERT INTO ab_variants (test_name, variant_key, subject, body_template, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (test_name, variant_key) DO NOTHING`,
      [test_name, variant_key, subject, body_template],
    );
  }
  outboundSeedDone = true;
}

/**
 * Recompute `ab_results` from `outbound_leads`. Winner = highest reply_rate among variants with >= min sends.
 * @param {{ minSends?: number }} [opts]
 */
export async function calculateAbResults(opts = {}) {
  if (!analyticsDb) return [];
  await ensureAnalyticsSchema();
  const minSends = opts.minSends ?? 20;

  const { rows } = await analyticsDb.query(`
    SELECT
      test_name,
      variant_key,
      COUNT(*) FILTER (WHERE sent_at IS NOT NULL) AS sent_count,
      COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS open_count,
      COUNT(*) FILTER (WHERE replied_at IS NOT NULL) AS reply_count,
      COUNT(*) FILTER (WHERE converted_at IS NOT NULL) AS paid_count,
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

  const byTest = {};
  for (const row of rows) {
    if (!row.test_name) continue;
    if (!byTest[row.test_name]) byTest[row.test_name] = [];
    byTest[row.test_name].push(row);
  }

  await analyticsDb.query(`DELETE FROM ab_results`);

  const outRows = [];
  for (const [testName, variants] of Object.entries(byTest)) {
    const eligible = variants.filter((v) => Number(v.sent_count) >= minSends);
    const sorted = [...eligible].sort(
      (a, b) => Number(b.reply_rate || 0) - Number(a.reply_rate || 0),
    );
    const winnerKey = sorted[0]?.variant_key;

    for (const v of variants) {
      const winner = winnerKey && v.variant_key === winnerKey;
      await analyticsDb.query(
        `INSERT INTO ab_results
          (test_name, variant_key, sent_count, open_count, reply_count, demo_count, paid_count,
           open_rate, reply_rate, close_rate, winner, computed_at)
         VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,0,$9,NOW())`,
        [
          v.test_name,
          v.variant_key,
          Number(v.sent_count) || 0,
          Number(v.open_count) || 0,
          Number(v.reply_count) || 0,
          Number(v.paid_count) || 0,
          v.open_rate != null ? Number(v.open_rate) : null,
          v.reply_rate != null ? Number(v.reply_rate) : null,
          winner,
        ],
      );
      outRows.push({
        ...v,
        winner,
        open_rate: v.open_rate != null ? Number(v.open_rate) : null,
        reply_rate: v.reply_rate != null ? Number(v.reply_rate) : null,
      });
    }
  }

  return outRows;
}

/** Latest snapshot from `ab_results` (for admin API + brief). */
export async function getAbResultsSnapshot() {
  if (!analyticsDb) return { variants: [], summary: null };
  await ensureAnalyticsSchema();
  const { rows } = await analyticsDb.query(
    `SELECT * FROM ab_results ORDER BY test_name, variant_key`,
  );
  const { rows: sum } = await analyticsDb.query(`
    SELECT
      COALESCE(SUM(sent_count), 0)::bigint AS total_sent,
      ROUND(AVG(open_rate), 2) AS avg_open_rate,
      ROUND(AVG(reply_rate), 2) AS avg_reply_rate,
      COALESCE(SUM(paid_count), 0)::bigint AS total_converted
    FROM ab_results
  `);
  return { variants: rows, summary: sum[0] || null };
}

export function renderOutboundAbBriefHtml(variants = []) {
  if (!variants.length) {
    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:16px">
        <h2 style="margin:0 0 8px;font-size:16px">Outbound A/B</h2>
        <p style="margin:0;color:#64748b;font-size:14px">No data yet — need sends per variant (targets: Instantly + Apollo pull).</p>
      </div>`;
  }

  const rows = variants
    .map(
      (r) => `
    <tr>
      <td style="padding:8px;border:1px solid #e2e8f0">${r.test_name}</td>
      <td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">${r.variant_key}</td>
      <td style="padding:8px;border:1px solid #e2e8f0">${r.sent_count ?? 0}</td>
      <td style="padding:8px;border:1px solid #e2e8f0">${r.open_rate ?? "—"}%</td>
      <td style="padding:8px;border:1px solid #e2e8f0">${r.reply_rate ?? "—"}%</td>
      <td style="padding:8px;border:1px solid #e2e8f0">${r.winner ? "Winner" : ""}</td>
    </tr>`,
    )
    .join("");

  return `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:16px">
      <h2 style="margin:0 0 10px;font-size:16px">Outbound A/B (latest rollup)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Test</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Variant</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Sent</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Open %</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Reply %</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Note</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:10px 0 0;font-size:12px;color:#64748b">Map Instantly merge tags to <code>custom_variables.email_subject</code> / <code>email_body</code> (see instantlyPushLeads).</p>
    </div>`;
}
