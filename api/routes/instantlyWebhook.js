import express from "express";
import { analyticsDb, ensureAnalyticsSchema } from "../services/analytics.js";
import { logger } from "../utils/logger.js";

export const instantlyWebhookRouter = express.Router();

const EVENT_MAP = {
  email_opened: "opened",
  email_replied: "replied",
  email_bounced: "bounced",
  email_clicked: "clicked",
  lead_unsubscribed: "unsubscribed",
};

function pickEmail(body) {
  return String(
    body.lead_email || body.email || body.lead?.email || body.payload?.lead_email || "",
  )
    .trim()
    .toLowerCase();
}

function pickEvent(body) {
  return String(body.event_type || body.event || body.type || "").trim();
}

instantlyWebhookRouter.post("/", async (req, res) => {
  const secret = process.env.INSTANTLY_WEBHOOK_SECRET?.trim();
  if (secret) {
    const got = String(req.headers["x-instantly-secret"] || req.headers["x-webhook-secret"] || "");
    if (got !== secret) {
      logger.warn("[instantly_webhook] secret_mismatch");
      return res.status(401).json({ ok: false });
    }
  }

  if (!analyticsDb) return res.json({ ok: true, skipped: "no_db" });

  const rawEvent = pickEvent(req.body);
  const mapped = EVENT_MAP[rawEvent];
  if (!mapped) return res.json({ ok: true, ignored: rawEvent || "empty" });

  const leadEmail = pickEmail(req.body);
  if (!leadEmail) return res.json({ ok: true, ignored: "no_email" });

  try {
    await ensureAnalyticsSchema();
    const { rows } = await analyticsDb.query(`SELECT id, status FROM outbound_leads WHERE email = $1`, [
      leadEmail,
    ]);
    if (!rows.length) return res.json({ ok: true, unknown_lead: true });

    const leadId = rows[0].id;
    const ts = req.body.timestamp ? new Date(req.body.timestamp) : new Date();

    if (mapped === "opened") {
      await analyticsDb.query(
        `UPDATE outbound_leads SET
           opened_at = COALESCE(opened_at, $1::timestamptz),
           status = CASE WHEN status IN ('replied', 'converted', 'bounced') THEN status ELSE 'opened' END
         WHERE id = $2`,
        [ts, leadId],
      );
    } else if (mapped === "replied") {
      await analyticsDb.query(
        `UPDATE outbound_leads SET
           replied_at = COALESCE(replied_at, $1::timestamptz),
           status = 'replied'
         WHERE id = $2`,
        [ts, leadId],
      );
    } else if (mapped === "bounced") {
      await analyticsDb.query(
        `UPDATE outbound_leads SET status = 'bounced' WHERE id = $1`,
        [leadId],
      );
    } else if (mapped === "clicked") {
      await analyticsDb.query(
        `UPDATE outbound_leads SET
           status = CASE WHEN status = 'replied' THEN status ELSE 'clicked' END
         WHERE id = $1`,
        [leadId],
      );
    } else if (mapped === "unsubscribed") {
      await analyticsDb.query(`UPDATE outbound_leads SET status = 'unsubscribed' WHERE id = $1`, [leadId]);
    }

    await analyticsDb.query(
      `INSERT INTO outbound_events (lead_id, event_type, metadata) VALUES ($1, $2, $3::jsonb)`,
      [leadId, mapped, JSON.stringify(req.body)],
    );
  } catch (err) {
    logger.error("[instantly_webhook] handler_error", { error: err.message });
    return res.status(500).json({ ok: false });
  }

  return res.json({ ok: true });
});
