/**
 * tests/auth-supabase-utils.test.js
 * Unit tests for the utility functions in src/lib/supabase.js
 *
 * These tests cover:
 *   - getAuthRedirectUrl()
 *   - clearAuthStorage()
 *   - syncAuthStorage()
 *   - checkInstitutionalAccess()
 *   - Mock Supabase client behavior when env vars are missing
 *
 * Run: node --test tests/auth-supabase-utils.test.js
 *
 * NOTE: supabase.js is a Vite/browser module (uses import.meta.env).
 * Functions are mirrored inline here so they can be tested in Node without
 * a bundler. Keep these in sync with src/lib/supabase.js.
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Mirror utility functions from src/lib/supabase.js ────────────────────────
// (identical logic — update if source changes)

function getAuthRedirectUrl(path = "/app", origin = "http://localhost:5173") {
  return new URL(path, origin).toString();
}

function clearAuthStorage(storage) {
  storage.removeItem("aris_authenticated");
  storage.removeItem("sb-token");
  storage.removeItem("sb-user-id");
  storage.removeItem("sb-user-email");
}

function syncAuthStorage(session, storage) {
  if (!session?.user) {
    clearAuthStorage(storage);
    return;
  }
  storage.setItem("aris_authenticated", "true");
  storage.setItem("sb-user-id", session.user.id || "");
  storage.setItem("sb-user-email", session.user.email || "");
  if (session.access_token) {
    storage.setItem("sb-token", session.access_token);
  } else {
    storage.removeItem("sb-token");
  }
}

function checkInstitutionalAccess(key, envKey) {
  return key === envKey;
}

// ─── Mock Supabase client (what src/lib/supabase.js returns when unconfigured) ─

const AUTH_ERROR = { message: "Auth not configured — contact support." };

const mockUnconfiguredClient = {
  auth: {
    getSession:          async () => ({ data: { session: null }, error: null }),
    onAuthStateChange:   ()       => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
    getUser:             async () => ({ data: { user: null }, error: null }),
    signOut:             async () => ({ error: null }),
    signUp:              async () => ({ data: null, error: AUTH_ERROR }),
    signInWithPassword:  async () => ({ data: null, error: AUTH_ERROR }),
  },
};

// ─── Simple in-memory localStorage mock ───────────────────────────────────────

function createStorage() {
  const store = {};
  return {
    setItem:    (k, v) => { store[k] = String(v); },
    getItem:    (k)    => store[k] ?? null,
    removeItem: (k)    => { delete store[k]; },
    clear:      ()     => { Object.keys(store).forEach(k => delete store[k]); },
    _store:     store,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  getAuthRedirectUrl
// ══════════════════════════════════════════════════════════════════════════════

test("getAuthRedirectUrl → builds absolute URL from relative path", () => {
  const url = getAuthRedirectUrl("/app", "https://bidsmith.pro");
  assert.equal(url, "https://bidsmith.pro/app");
});

test("getAuthRedirectUrl → defaults to /app path", () => {
  const url = getAuthRedirectUrl(undefined, "https://bidsmith.pro");
  assert.equal(url, "https://bidsmith.pro/app");
});

test("getAuthRedirectUrl → handles deep paths", () => {
  const url = getAuthRedirectUrl("/app/dashboard", "https://bidsmith.pro");
  assert.equal(url, "https://bidsmith.pro/app/dashboard");
});

test("getAuthRedirectUrl → works with localhost origin", () => {
  const url = getAuthRedirectUrl("/app", "http://localhost:5173");
  assert.equal(url, "http://localhost:5173/app");
});

// ══════════════════════════════════════════════════════════════════════════════
//  clearAuthStorage
// ══════════════════════════════════════════════════════════════════════════════

test("clearAuthStorage → removes all four auth keys", () => {
  const storage = createStorage();
  storage.setItem("aris_authenticated", "true");
  storage.setItem("sb-token", "tok_abc");
  storage.setItem("sb-user-id", "user_123");
  storage.setItem("sb-user-email", "sid@bidsmith.pro");

  clearAuthStorage(storage);

  assert.equal(storage.getItem("aris_authenticated"), null);
  assert.equal(storage.getItem("sb-token"), null);
  assert.equal(storage.getItem("sb-user-id"), null);
  assert.equal(storage.getItem("sb-user-email"), null);
});

test("clearAuthStorage → is a no-op on empty storage", () => {
  const storage = createStorage();
  assert.doesNotThrow(() => clearAuthStorage(storage));
});

test("clearAuthStorage → does not remove unrelated keys", () => {
  const storage = createStorage();
  storage.setItem("posthog_session", "ph_xyz");
  storage.setItem("aris_authenticated", "true");

  clearAuthStorage(storage);

  assert.equal(storage.getItem("posthog_session"), "ph_xyz");
});

// ══════════════════════════════════════════════════════════════════════════════
//  syncAuthStorage
// ══════════════════════════════════════════════════════════════════════════════

test("syncAuthStorage → writes all keys for a full session", () => {
  const storage = createStorage();
  const session = {
    user: { id: "user_abc", email: "sid@bidsmith.pro" },
    access_token: "tok_xyz",
  };

  syncAuthStorage(session, storage);

  assert.equal(storage.getItem("aris_authenticated"), "true");
  assert.equal(storage.getItem("sb-user-id"), "user_abc");
  assert.equal(storage.getItem("sb-user-email"), "sid@bidsmith.pro");
  assert.equal(storage.getItem("sb-token"), "tok_xyz");
});

test("syncAuthStorage → does not write sb-token when access_token is absent", () => {
  const storage = createStorage();
  const session = {
    user: { id: "user_abc", email: "sid@bidsmith.pro" },
    // no access_token
  };

  syncAuthStorage(session, storage);

  assert.equal(storage.getItem("sb-token"), null);
  assert.equal(storage.getItem("aris_authenticated"), "true");
});

test("syncAuthStorage → clears storage when session is null", () => {
  const storage = createStorage();
  storage.setItem("aris_authenticated", "true");
  storage.setItem("sb-token", "old_token");

  syncAuthStorage(null, storage);

  assert.equal(storage.getItem("aris_authenticated"), null);
  assert.equal(storage.getItem("sb-token"), null);
});

test("syncAuthStorage → clears storage when session.user is null", () => {
  const storage = createStorage();
  storage.setItem("aris_authenticated", "true");

  syncAuthStorage({ user: null }, storage);

  assert.equal(storage.getItem("aris_authenticated"), null);
});

test("syncAuthStorage → handles missing user.id gracefully (stores empty string)", () => {
  const storage = createStorage();
  const session = { user: { email: "sid@bidsmith.pro" }, access_token: "tok" };

  syncAuthStorage(session, storage);

  assert.equal(storage.getItem("sb-user-id"), "");
  assert.equal(storage.getItem("sb-user-email"), "sid@bidsmith.pro");
});

test("syncAuthStorage → overwrites stale values on re-auth", () => {
  const storage = createStorage();

  // First login
  syncAuthStorage({ user: { id: "old_id", email: "old@test.com" }, access_token: "old_tok" }, storage);
  // Second login (new session)
  syncAuthStorage({ user: { id: "new_id", email: "new@test.com" }, access_token: "new_tok" }, storage);

  assert.equal(storage.getItem("sb-user-id"), "new_id");
  assert.equal(storage.getItem("sb-user-email"), "new@test.com");
  assert.equal(storage.getItem("sb-token"), "new_tok");
});

// ══════════════════════════════════════════════════════════════════════════════
//  checkInstitutionalAccess
// ══════════════════════════════════════════════════════════════════════════════

const ENV_KEY = "aris369";

test("checkInstitutionalAccess → returns true for matching key", () => {
  assert.equal(checkInstitutionalAccess(ENV_KEY, ENV_KEY), true);
});

test("checkInstitutionalAccess → returns false for wrong key", () => {
  assert.equal(checkInstitutionalAccess("wrongkey", ENV_KEY), false);
});

test("checkInstitutionalAccess → is case-sensitive", () => {
  assert.equal(checkInstitutionalAccess("ARIS369", ENV_KEY), false);
  assert.equal(checkInstitutionalAccess("Aris369", ENV_KEY), false);
});

test("checkInstitutionalAccess → returns false for empty key", () => {
  assert.equal(checkInstitutionalAccess("", ENV_KEY), false);
});

test("checkInstitutionalAccess → returns false when env key is undefined", () => {
  assert.equal(checkInstitutionalAccess(ENV_KEY, undefined), false);
});

test("checkInstitutionalAccess → returns false for null key", () => {
  assert.equal(checkInstitutionalAccess(null, ENV_KEY), false);
});

// ══════════════════════════════════════════════════════════════════════════════
//  Mock Supabase client (unconfigured — when env vars are missing)
// ══════════════════════════════════════════════════════════════════════════════

test("mock client → signUp returns auth error when Supabase unconfigured", async () => {
  const { data, error } = await mockUnconfiguredClient.auth.signUp({
    email: "sid@bidsmith.pro",
    password: "password123",
  });

  assert.equal(data, null);
  assert.ok(error, "error should be present");
  assert.equal(error.message, "Auth not configured — contact support.");
});

test("mock client → signInWithPassword returns auth error when unconfigured", async () => {
  const { data, error } = await mockUnconfiguredClient.auth.signInWithPassword({
    email: "sid@bidsmith.pro",
    password: "password123",
  });

  assert.equal(data, null);
  assert.ok(error);
  assert.equal(error.message, "Auth not configured — contact support.");
});

test("mock client → getSession returns null session (no crash)", async () => {
  const { data, error } = await mockUnconfiguredClient.auth.getSession();

  assert.equal(error, null);
  assert.equal(data.session, null);
});

test("mock client → getUser returns null user (no crash)", async () => {
  const { data, error } = await mockUnconfiguredClient.auth.getUser();

  assert.equal(error, null);
  assert.equal(data.user, null);
});

test("mock client → signOut resolves without error", async () => {
  const { error } = await mockUnconfiguredClient.auth.signOut();
  assert.equal(error, null);
});

test("mock client → onAuthStateChange returns unsubscribable subscription", () => {
  const result = mockUnconfiguredClient.auth.onAuthStateChange(() => {});

  assert.ok(result.data?.subscription, "subscription object should exist");
  assert.equal(typeof result.data.subscription.unsubscribe, "function");
  assert.doesNotThrow(() => result.data.subscription.unsubscribe());
});
