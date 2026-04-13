// Covers HTTP 429 from free-tier audit quota via the dev-only credit probe (requires API + Redis for real enforcement).
import { test, expect } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://127.0.0.1:8080";

function redisQuotaConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim()
      && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

test.describe("Free audit quota API", () => {
  // Verifies three successful credit reservations then a 429 whose JSON mentions quota or limit for the same x-user-id.
  test("fourth signed-in credit check returns 429 with quota/limit messaging", async ({ request }) => {
    test.skip(
      !redisQuotaConfigured(),
      "Skipped: Upstash URL+token not both set — quota enforcement inactive (matches api/utils/upstash.js)",
    );

    const uid = `e2e-quota-${Date.now()}`;
    const url = `${API_BASE}/api/dev/free-audit-credit`;

    for (let i = 0; i < 3; i++) {
      const res = await request.post(url, {
        headers: { "x-user-id": uid, "x-subscribed": "false" },
      });
      expect(res.status(), `attempt ${i + 1}`).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    }

    const fourth = await request.post(url, {
      headers: { "x-user-id": uid },
    });
    expect(fourth.status()).toBe(429);
    const text = (await fourth.text()).toLowerCase();
    expect(text).toMatch(/quota|limit/);
  });

  // Verifies x-subscribed: true never returns 429 from the credit probe even after repeated calls.
  test("subscribed header skips quota on the credit probe", async ({ request }) => {
    const uid = `e2e-sub-${Date.now()}`;
    const url = `${API_BASE}/api/dev/free-audit-credit`;

    for (let i = 0; i < 6; i++) {
      const res = await request.post(url, {
        headers: { "x-user-id": uid, "x-subscribed": "true" },
      });
      expect(res.status(), `call ${i}`).toBe(200);
    }
  });
});
