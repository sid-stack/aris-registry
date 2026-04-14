/**
 * Canonical first-party event names for funnel + legacy aliases.
 * Keep SQL fragments in sync with getTrafficBrief / getAdminStats.
 */

export const PAGE_VIEW_EVENT = "page_view";

/** Counted as "audit engagement" in daily briefs and admin conversion columns. */
export const AUDIT_ENGAGEMENT_EVENT_TYPES = [
  "audit_started",
  "Audit Started",
  "audit_submitted",
  "audit_success",
];

/** SQL IN (...) literal for use inside server-side query strings (fixed enum — safe). */
export function auditEngagementTypesSqlIn() {
  return AUDIT_ENGAGEMENT_EVENT_TYPES.map((t) => `'${String(t).replace(/'/g, "''")}'`).join(", ");
}
