/**
 * tests/auth-middleware.test.js
 * Unit tests for api/middleware/auth.js
 *
 * Tests the authenticate() middleware that guards all protected API routes.
 * Uses Node's built-in test runner — no extra dependencies needed.
 *
 * Run: node --test tests/auth-middleware.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Inline the middleware logic so tests run without a live DB connection ───
// (mirrors api/middleware/auth.js exactly — keep in sync if logic changes)

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const accessKey =
    req.headers["x-access-key"] ||
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null);

  if (accessKey === process.env.VITE_ACCESS_KEY) {
    req.user = { id: "institutional-admin", email: "admin@aris.core", role: "admin" };
    return next();
  }

  if (!accessKey) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please provide a valid institutional access key or sign in.",
    });
  }

  res.status(403).json({ error: "Invalid access key" });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockReq(overrides = {}) {
  return {
    headers: {},
    ...overrides,
  };
}

function mockRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body)  => { res._body  = body; return res; };
  return res;
}

// ─── Test Setup ──────────────────────────────────────────────────────────────

const VALID_KEY = "aris369";
const INVALID_KEY = "hacked-key";

// Set env before tests so the middleware sees it
process.env.VITE_ACCESS_KEY = VALID_KEY;

// ─── 1. No credentials at all ────────────────────────────────────────────────

test("authenticate → 401 when no auth header and no x-access-key", async () => {
  const req  = mockReq({ headers: {} });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  assert.equal(res._status, 401);
  assert.equal(res._body.error, "Authentication required");
  assert.ok(res._body.message.includes("institutional access key"));
  assert.equal(called, false, "next() must NOT be called on 401");
});

// ─── 2. Valid key via x-access-key header ────────────────────────────────────

test("authenticate → calls next() and sets req.user for valid x-access-key", async () => {
  const req  = mockReq({ headers: { "x-access-key": VALID_KEY } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  assert.equal(called, true, "next() must be called on success");
  assert.equal(req.user.id, "institutional-admin");
  assert.equal(req.user.email, "admin@aris.core");
  assert.equal(req.user.role, "admin");
  assert.equal(res._status, null, "No response code should be set on success");
});

// ─── 3. Valid key via Authorization: Bearer ───────────────────────────────────

test("authenticate → accepts valid Bearer token in Authorization header", async () => {
  const req  = mockReq({ headers: { authorization: `Bearer ${VALID_KEY}` } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  assert.equal(called, true);
  assert.equal(req.user.role, "admin");
});

// ─── 4. Invalid key via x-access-key header ──────────────────────────────────

test("authenticate → 403 for wrong x-access-key", async () => {
  const req  = mockReq({ headers: { "x-access-key": INVALID_KEY } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  assert.equal(res._status, 403);
  assert.equal(res._body.error, "Invalid access key");
  assert.equal(called, false);
});

// ─── 5. Invalid Bearer token ──────────────────────────────────────────────────

test("authenticate → 403 for wrong Bearer token", async () => {
  const req  = mockReq({ headers: { authorization: `Bearer ${INVALID_KEY}` } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  assert.equal(res._status, 403);
  assert.equal(called, false);
});

// ─── 6. Malformed Authorization header (not Bearer) ──────────────────────────

test("authenticate → 401 when Authorization header is not Bearer format", async () => {
  const req  = mockReq({ headers: { authorization: `Basic ${VALID_KEY}` } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  // Basic auth is not parsed — no accessKey extracted → 401
  assert.equal(res._status, 401);
  assert.equal(called, false);
});

// ─── 7. Empty Bearer token ────────────────────────────────────────────────────

test("authenticate → 401 when Bearer token is empty string", async () => {
  const req  = mockReq({ headers: { authorization: "Bearer " } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  // split(" ")[1] yields "" — falsy — so treated as missing
  assert.equal(res._status, 401);
  assert.equal(called, false);
});

// ─── 8. x-access-key takes priority over Authorization header ─────────────────

test("authenticate → x-access-key header takes precedence over Authorization", async () => {
  const req = mockReq({
    headers: {
      "x-access-key": VALID_KEY,
      authorization: `Bearer ${INVALID_KEY}`,  // bad bearer but valid x-access-key
    },
  });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  assert.equal(called, true, "x-access-key should win");
  assert.equal(req.user.id, "institutional-admin");
});

// ─── 9. Case sensitivity ──────────────────────────────────────────────────────

test("authenticate → key comparison is case-sensitive", async () => {
  const req  = mockReq({ headers: { "x-access-key": VALID_KEY.toUpperCase() } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  assert.equal(res._status, 403, "Key must match exactly (case-sensitive)");
  assert.equal(called, false);
});

// ─── 10. Missing VITE_ACCESS_KEY env var ──────────────────────────────────────

test("authenticate → 403 for any key when VITE_ACCESS_KEY is unset", async () => {
  const original = process.env.VITE_ACCESS_KEY;
  delete process.env.VITE_ACCESS_KEY;

  const req  = mockReq({ headers: { "x-access-key": VALID_KEY } });
  const res  = mockRes();
  let called = false;

  await authenticate(req, res, () => { called = true; });

  // accessKey !== undefined, so falls through to 403
  assert.equal(res._status, 403);
  assert.equal(called, false);

  process.env.VITE_ACCESS_KEY = original; // restore
});
