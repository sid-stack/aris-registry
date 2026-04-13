/**
 * Free-tier audit limits (aligns with marketing: 3 full audits / calendar month for signed-in free users).
 * Subscribers (x-subscribed: true) bypass entirely — enforced in route middleware / handlers.
 */
import { redis } from "./upstash.js";

export const FREE_AUDITS_PER_CALENDAR_MONTH = 3;

function monthKey(userId) {
  const d = new Date();
  return `aris:free_audit_month:${userId}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Reserve one free audit for a signed-in, non-subscribed user. Call only after cache miss / when a real LLM run will occur.
 * @returns {{ ok: true, used: number } | { ok: false, status: number, body: object }}
 */
export async function consumeFreeAuditCredit(req) {
  if (req.headers["x-subscribed"] === "true") {
    return { ok: true, used: 0, skipped: "subscribed" };
  }

  const uid = String(req.headers["x-user-id"] || "").trim();
  if (!uid || uid === "anonymous") {
    return { ok: true, used: 0, skipped: "anonymous_ip_gated_elsewhere" };
  }

  if (!redis) {
    return { ok: true, used: 0, skipped: "no_redis" };
  }

  const key = monthKey(uid);
  const n = await redis.incr(key);
  if (n === 1) {
    await redis.expire(key, 35 * 24 * 60 * 60);
  }
  if (n > FREE_AUDITS_PER_CALENDAR_MONTH) {
    await redis.decr(key);
    return {
      ok: false,
      status: 429,
      body: {
        error: `Free plan includes ${FREE_AUDITS_PER_CALENDAR_MONTH} full audits per calendar month. Upgrade for unlimited audits.`,
        code: "FREE_MONTHLY_LIMIT",
        limit: FREE_AUDITS_PER_CALENDAR_MONTH,
        hint: "See pricing to unlock unlimited audits — from $99/mo.",
        upgradeUrl: "/pricing",
      },
    };
  }

  return { ok: true, used: n };
}
