import { describe, it, expect } from "vitest";
import {
  AUDIT_ENGAGEMENT_EVENT_TYPES,
  auditEngagementTypesSqlIn,
  PAGE_VIEW_EVENT,
} from "../api/analyticsEventTaxonomy.js";

describe("analyticsEventTaxonomy", () => {
  it("includes funnel audit events and legacy names", () => {
    expect(AUDIT_ENGAGEMENT_EVENT_TYPES).toContain("audit_submitted");
    expect(AUDIT_ENGAGEMENT_EVENT_TYPES).toContain("audit_success");
    expect(AUDIT_ENGAGEMENT_EVENT_TYPES).toContain("audit_started");
    expect(PAGE_VIEW_EVENT).toBe("page_view");
  });

  it("emits a safe SQL IN literal", () => {
    const sql = auditEngagementTypesSqlIn();
    expect(sql).toMatch(/'audit_submitted'/);
    expect(sql).not.toMatch(/;/);
  });
});
