// Covers signed-in free-tier monthly audit limits via consumeFreeAuditCredit with a mocked Redis client.
import { describe, it, expect, beforeEach, vi } from "vitest";

const counters = new Map();

function createMemoryRedis() {
  return {
    async incr(key: string) {
      const n = (counters.get(key) || 0) + 1;
      counters.set(key, n);
      return n;
    },
    async decr(key: string) {
      const n = (counters.get(key) || 0) - 1;
      counters.set(key, n);
      return n;
    },
    async expire(_key: string, _sec: number) {
      return 1;
    },
  };
}

vi.mock("../../api/utils/upstash.js", () => ({
  redis: createMemoryRedis(),
}));

import { consumeFreeAuditCredit, FREE_AUDITS_PER_CALENDAR_MONTH } from "../../api/utils/freeAuditQuota.js";

function req(headers: Record<string, string> = {}) {
  return { headers };
}

beforeEach(() => {
  counters.clear();
});

describe("consumeFreeAuditCredit", () => {
  // Verifies the first three signed-in audits in a month increment usage and succeed.
  it("allows the first three audits for the same user", async () => {
    const uid = "vitest-free-user-a";
    for (let i = 0; i < FREE_AUDITS_PER_CALENDAR_MONTH; i++) {
      const c = await consumeFreeAuditCredit(req({ "x-user-id": uid }));
      expect(c.ok).toBe(true);
      if (c.ok) expect(c.used).toBe(i + 1);
    }
  });

  // Verifies the fourth attempt is rejected with HTTP-style 429 and a structured body.
  it("blocks the fourth audit with ok: false and status 429", async () => {
    const uid = "vitest-free-user-b";
    for (let i = 0; i < FREE_AUDITS_PER_CALENDAR_MONTH; i++) {
      const c = await consumeFreeAuditCredit(req({ "x-user-id": uid }));
      expect(c.ok).toBe(true);
    }
    const c = await consumeFreeAuditCredit(req({ "x-user-id": uid }));
    expect(c.ok).toBe(false);
    if (!c.ok) {
      expect(c.status).toBe(429);
      expect(JSON.stringify(c.body).toLowerCase()).toMatch(/limit|quota/);
    }
  });

  // Verifies subscribers never hit the Redis counter path for quota enforcement.
  it("skips quota entirely when x-subscribed: true", async () => {
    const uid = "vitest-subscribed-user";
    for (let i = 0; i < 10; i++) {
      const c = await consumeFreeAuditCredit(
        req({ "x-user-id": uid, "x-subscribed": "true" }),
      );
      expect(c.ok).toBe(true);
      if (c.ok) expect(c.skipped).toBe("subscribed");
    }
  });

  // Verifies usage keys are per calendar month so the counter resets after the month rolls.
  it("resets quota when the calendar month changes (new month key)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 31, 12, 0, 0));
    const uid = "vitest-free-user-c";
    for (let i = 0; i < FREE_AUDITS_PER_CALENDAR_MONTH; i++) {
      const c = await consumeFreeAuditCredit(req({ "x-user-id": uid }));
      expect(c.ok).toBe(true);
    }
    const blocked = await consumeFreeAuditCredit(req({ "x-user-id": uid }));
    expect(blocked.ok).toBe(false);

    vi.setSystemTime(new Date(2026, 3, 1, 12, 0, 0));
    const fresh = await consumeFreeAuditCredit(req({ "x-user-id": uid }));
    expect(fresh.ok).toBe(true);
    if (fresh.ok) expect(fresh.used).toBe(1);

    vi.useRealTimers();
  });
});
