/**
 * Pulls leads from Apollo (people/search), assigns A/B variant, dedupes on email.
 * Run via outbound scheduler or manually: `node -e "import('./api/jobs/apolloPullLeads.js').then(m => m.pullApolloLeads())"` from repo with dotenv.
 */
import { analyticsDb, ensureAnalyticsSchema } from "../services/analytics.js";
import { ensureOutboundAbSeed } from "../services/outboundAb.js";

const APOLLO_SEARCH_URL = "https://api.apollo.io/v1/people/search";

export function buildSignal(person) {
  const org = person.organization;
  if (!org) return "saw you're active in government contracting";

  const postings = org.job_postings || org.active_job_postings || [];
  if (Array.isArray(postings) && postings.some((j) => /proposal|capture|bid/i.test(String(j.title || j.name || "")))) {
    return `saw ${org.name} is hiring for proposal/capture roles`;
  }
  const keywords = org.keywords || [];
  if (Array.isArray(keywords) && keywords.some((k) => /rfp|idiq|gwac|govcon/i.test(String(k)))) {
    return `saw ${org.name} is active in federal contracting`;
  }
  return `saw ${org.name} works in government contracting`;
}

export async function pullApolloLeads() {
  const APOLLO_KEY = process.env.APOLLO_API_KEY?.trim();
  if (!APOLLO_KEY) {
    console.warn("[apolloPull] APOLLO_API_KEY missing — skip");
    return { inserted: 0, skipped: 0, error: "no_apollo_key" };
  }
  if (!analyticsDb) {
    console.warn("[apolloPull] DATABASE_URL / analytics DB missing — skip");
    return { inserted: 0, skipped: 0, error: "no_db" };
  }

  await ensureAnalyticsSchema();
  await ensureOutboundAbSeed();

  const DAILY_TARGET = Math.min(
    100,
    Math.max(1, parseInt(process.env.OUTBOUND_DAILY_TARGET || "80", 10)),
  );
  const testName = (process.env.OUTBOUND_AB_TEST_NAME || "subject_v1").trim();

  console.log("[apolloPull] Starting Apollo lead pull…");

  const body = {
    api_key: APOLLO_KEY,
    page: 1,
    per_page: DAILY_TARGET,
    person_titles: [
      "Director of Business Development",
      "VP Business Development",
      "Capture Manager",
      "Director of Capture",
      "Proposal Manager",
      "CEO",
      "President",
      "Managing Partner",
    ],
    organization_num_employees_ranges: ["20,200"],
    q_organization_keyword_tags: ["government contracting", "federal contracting", "RFP", "IDIQ"],
    contact_email_status: ["verified"],
  };

  const res = await fetch(APOLLO_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[apolloPull] HTTP error", res.status, data?.error || data);
    return { inserted: 0, skipped: 0, error: "apollo_http", status: res.status };
  }

  const people = data.people || [];
  console.log(`[apolloPull] Got ${people.length} people from Apollo`);

  const variantsRes = await analyticsDb.query(
    `SELECT * FROM ab_variants WHERE is_active = true AND test_name = $1 ORDER BY variant_key`,
    [testName],
  );
  const variants = variantsRes.rows;
  if (!variants.length) {
    throw new Error(`[apolloPull] No active variants for test_name=${testName}`);
  }

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const email = (p.email || "").trim().toLowerCase();
    if (!email) {
      skipped++;
      continue;
    }

    const variant = variants[i % variants.length];
    const signal = buildSignal(p);

    try {
      const ins = await analyticsDb.query(
        `INSERT INTO outbound_leads
          (email, first_name, last_name, company, title, signal, linkedin_url, apollo_id, variant_key, test_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [
          email,
          p.first_name || null,
          p.last_name || null,
          p.organization?.name || null,
          p.title || null,
          signal,
          p.linkedin_url || null,
          String(p.id || p.person_id || "") || null,
          variant.variant_key,
          variant.test_name,
        ],
      );
      if (ins.rowCount) inserted++;
      else skipped++;
    } catch (e) {
      console.error("[apolloPull] Insert error:", e.message);
      skipped++;
    }
  }

  console.log(`[apolloPull] Done. Inserted: ${inserted}, Skipped/dupes/no-row: ${skipped}`);
  return { inserted, skipped };
}
