/**
 * Canonical first-party event names for funnel + legacy aliases.
 * Keep SQL fragments in sync with getTrafficBrief / getAdminStats.
 */

export const PAGE_VIEW_EVENT = "page_view";

/** Written by API handlers only — `metadata.ingest === INGEST_SERVER_TRUTH`. Not subject to ad-blockers. */
export const INGEST_SERVER_TRUTH = "server_truth";

/** Counted as "audit engagement" in daily briefs and admin conversion columns. */
export const AUDIT_ENGAGEMENT_EVENT_TYPES = [
  "audit_started",
  "Audit Started",
  "audit_submitted",
  "audit_success",
];

/** Server-emitted milestones for the primary PLG funnel (14-day observability window). */
export const PRIMARY_FUNNEL_SERVER_EVENTS = [
  "audit_success",
  "audit_quota_blocked",
  "audit_retrieval_failed",
  "audit_pipeline_failed",
  "newsletter_subscribe",
  "checkout_completed",
  "checkout_initiated",
];

/** SQL IN (...) literal for use inside server-side query strings (fixed enum — safe). */
export function auditEngagementTypesSqlIn() {
  return AUDIT_ENGAGEMENT_EVENT_TYPES.map((t) => `'${String(t).replace(/'/g, "''")}'`).join(", ");
}
