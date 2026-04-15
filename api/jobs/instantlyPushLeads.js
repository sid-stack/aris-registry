/**
 * Pending leads → Instantly campaign (API v2 bulk add).
 * Configure campaign copy to use custom variables `email_subject` and `email_body`
 * (or map `personalization` if your template uses {{personalization}}).
 */
import { analyticsDb, ensureAnalyticsSchema } from "../services/analytics.js";

const INSTANTLY_ADD_URL = "https://api.instantly.ai/api/v2/leads/add";

function personalize(template, lead) {
  const cal = process.env.CALENDLY_URL?.trim() || "https://calendly.com/bidsmith";
  return (template || "")
    .replace(/\{\{firstName\}\}/g, lead.first_name || "there")
    .replace(/\{\{company\}\}/g, lead.company || "your firm")
    .replace(/\{\{signal\}\}/g, lead.signal || "saw you're active in GovCon")
    .replace(/\{\{title\}\}/g, lead.title || "")
    .replace(/\[CALENDLY_LINK\]/g, cal);
}

export async function pushLeadsToInstantly() {
  const key = process.env.INSTANTLY_API_KEY?.trim();
  const campaignId = process.env.INSTANTLY_CAMPAIGN_ID?.trim();
  if (!key || !campaignId) {
    console.warn("[instantlyPush] INSTANTLY_API_KEY or INSTANTLY_CAMPAIGN_ID missing — skip");
    return { pushed: 0, error: "missing_instantly_env" };
  }
  if (!analyticsDb) {
    console.warn("[instantlyPush] No DB — skip");
    return { pushed: 0, error: "no_db" };
  }

  await ensureAnalyticsSchema();

  const BATCH_SIZE = Math.min(
    200,
    Math.max(1, parseInt(process.env.OUTBOUND_BATCH_SIZE || "80", 10)),
  );

  const { rows: leads } = await analyticsDb.query(
    `SELECT l.*, v.subject, v.body_template
     FROM outbound_leads l
     JOIN ab_variants v ON v.variant_key = l.variant_key AND v.test_name = l.test_name
     WHERE l.status = 'pending'
     ORDER BY l.created_at ASC
     LIMIT $1`,
    [BATCH_SIZE],
  );

  if (!leads.length) {
    console.log("[instantlyPush] No pending leads.");
    return { pushed: 0 };
  }

  console.log(`[instantlyPush] Pushing ${leads.length} leads via bulk API…`);

  const instantlyLeads = leads.map((lead) => {
    const personalizedBody = personalize(lead.body_template, lead);
    const personalizedSubject = personalize(lead.subject, lead);
    return {
      lead,
      payload: {
        email: lead.email,
        first_name: lead.first_name || undefined,
        last_name: lead.last_name || undefined,
        company_name: lead.company || undefined,
        job_title: lead.title || undefined,
        personalization: personalizedBody,
        custom_variables: {
          email_subject: personalizedSubject,
          email_body: personalizedBody,
          variant: lead.variant_key,
          ab_test: lead.test_name,
        },
      },
    };
  });

  const res = await fetch(INSTANTLY_ADD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      leads: instantlyLeads.map((x) => x.payload),
      verify_leads_on_import: false,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[instantlyPush] Instantly error", res.status, data);
    return { pushed: 0, error: "instantly_http", status: res.status, data };
  }

  const created = Array.isArray(data.created_leads) ? data.created_leads : [];
  const createdByEmail = new Map();
  for (const c of created) {
    const leadObj = c.lead || c;
    const em = String(leadObj.email || c.email || c.lead_email || "").toLowerCase();
    if (em) createdByEmail.set(em, c.id || c.lead_id || leadObj.id || null);
  }

  const uploaded = Number(data.leads_uploaded || 0);
  const duplicated = Number(data.duplicated_leads || 0);
  const fullBatchOk =
    uploaded + duplicated >= instantlyLeads.length && instantlyLeads.length > 0;

  let pushed = 0;
  for (const { lead } of instantlyLeads) {
    const em = String(lead.email || "").toLowerCase();
    const instantlyId = createdByEmail.get(em) || null;
    const okOne = createdByEmail.has(em) || fullBatchOk;

    if (!okOne) continue;

    await analyticsDb.query(
      `UPDATE outbound_leads
       SET status = 'sent', sent_at = COALESCE(sent_at, NOW()), instantly_lead_id = COALESCE($2, instantly_lead_id)
       WHERE id = $1 AND status = 'pending'`,
      [lead.id, instantlyId],
    );
    await analyticsDb.query(
      `INSERT INTO outbound_events (lead_id, event_type, metadata)
       VALUES ($1, 'sent', $2::jsonb)`,
      [lead.id, JSON.stringify({ variant: lead.variant_key, campaign_id: campaignId })],
    );
    pushed++;
  }

  console.log(`[instantlyPush] Done. Marked sent (best-effort): ${pushed}`);
  return { pushed, instantly: { leads_uploaded: data.leads_uploaded, duplicated: data.duplicated_leads } };
}
