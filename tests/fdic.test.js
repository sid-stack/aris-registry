import test from "node:test";
import assert from "node:assert/strict";
import { getInstitutionSnapshot } from "../api/services/fdic.js";

test("getInstitutionSnapshot returns mapped audit fields", async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    const href = String(url);
    calls.push(href);

    if (href.includes("/bankfind/123456")) {
      return {
        ok: true,
        json: async () => ({
          bank: {
            id: "123456",
            name: "Atlas Federal Bank",
            city: "Arlington",
            state: "VA",
            cert: "99999",
          },
        }),
        text: async () => "",
      };
    }

    if (href.includes("/financials/123456")) {
      return {
        ok: true,
        json: async () => ({
          financials: [
            {
              totalAssets: 145000000,
              totalDeposits: 116000000,
              totalLoans: 62000000,
              netIncome: 4500000,
              returnOnAssets: 1.02,
              returnOnEquity: 9.11,
              period: "2025Q4",
            },
          ],
        }),
        text: async () => "",
      };
    }

    return {
      ok: false,
      status: 404,
      text: async () => "not found",
      json: async () => ({}),
    };
  };

  try {
    const snapshot = await getInstitutionSnapshot("123456");
    assert.equal(snapshot.oid, "123456");
    assert.equal(snapshot.name, "Atlas Federal Bank");
    assert.equal(snapshot.state, "VA");
    assert.equal(snapshot.totalAssets, 145000000);
    assert.equal(snapshot.totalDeposits, 116000000);
    assert.equal(snapshot.financialPeriod, "2025Q4");
    assert.ok(snapshot.retrievedAt);
    assert.ok(calls.some((call) => call.includes("/bankfind/123456")));
    assert.ok(calls.some((call) => call.includes("/financials/123456")));
  } finally {
    global.fetch = originalFetch;
  }
});

test("getInstitutionSnapshot requires OID", async () => {
  await assert.rejects(
    () => getInstitutionSnapshot(""),
    /FDIC OID is required/,
  );
});

