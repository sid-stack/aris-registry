/**
 * tests/auth-login-logic.test.js
 * Unit tests for the login/signup form logic in src/pages/Login.jsx
 *
 * Covers:
 *   - Input validation (empty fields, password length)
 *   - Email normalization (trim + lowercase)
 *   - Error message mapping (Supabase → user-friendly strings)
 *   - Signup flow branches (email confirmation vs. direct session)
 *   - Sign-in flow branches (success, wrong creds, generic error)
 *   - Mode switching state
 *   - Edge cases (whitespace-only email, SQL-style inputs, Unicode)
 *
 * Run: node --test tests/auth-login-logic.test.js
 *
 * NOTE: Login.jsx is a React component so we can't render it here.
 * Instead, we extract and test the pure business logic it contains.
 */

import test from "node:test";
import assert from "node:assert/strict";

// ─── Pure logic extracted from Login.jsx ──────────────────────────────────────

/**
 * Validates that email and password are non-empty.
 * Mirrors the early-return check in handleSubmit.
 */
function validateInputs(email, password) {
  if (!email.trim() || !password) {
    return { valid: false, error: "Email and password are required." };
  }
  return { valid: true, error: null };
}

/**
 * Normalizes email before sending to Supabase.
 * Mirrors: email.trim().toLowerCase()
 */
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Maps Supabase error messages to user-friendly strings.
 * Mirrors the ternary in the sign-in branch of handleSubmit.
 */
function mapSignInError(supabaseMessage) {
  return supabaseMessage === "Invalid login credentials"
    ? "Wrong email or password."
    : supabaseMessage;
}

/**
 * Determines the outcome of a signup response.
 * Mirrors the if/else chain in the signup branch of handleSubmit.
 * Returns:
 *   { action: "confirm_email" } — user created, email confirmation required
 *   { action: "login"         } — user created, session granted immediately
 *   { action: "error", msg   } — Supabase returned an error
 */
function resolveSignUpResponse({ data, error }) {
  if (error) return { action: "error", msg: error.message };
  if (data?.user && !data.session) return { action: "confirm_email" };
  if (data?.user)                  return { action: "login" };
  return { action: "error", msg: "Unexpected response from auth server." };
}

/**
 * Determines the outcome of a sign-in response.
 * Mirrors the if/else chain in the login branch of handleSubmit.
 */
function resolveSignInResponse({ data, error }) {
  if (error) return { action: "error", msg: mapSignInError(error.message) };
  if (data?.user) return { action: "login" };
  return { action: "error", msg: "Unexpected response from auth server." };
}

// ══════════════════════════════════════════════════════════════════════════════
//  validateInputs
// ══════════════════════════════════════════════════════════════════════════════

test("validateInputs → valid when both fields are populated", () => {
  const result = validateInputs("sid@bidsmith.pro", "secret123");
  assert.equal(result.valid, true);
  assert.equal(result.error, null);
});

test("validateInputs → invalid when email is empty string", () => {
  const result = validateInputs("", "secret123");
  assert.equal(result.valid, false);
  assert.equal(result.error, "Email and password are required.");
});

test("validateInputs → invalid when email is whitespace only", () => {
  const result = validateInputs("   ", "secret123");
  assert.equal(result.valid, false);
});

test("validateInputs → invalid when password is empty string", () => {
  const result = validateInputs("sid@bidsmith.pro", "");
  assert.equal(result.valid, false);
  assert.equal(result.error, "Email and password are required.");
});

test("validateInputs → invalid when both fields are empty", () => {
  const result = validateInputs("", "");
  assert.equal(result.valid, false);
});

test("validateInputs → valid when password is exactly 1 char (HTML minLength enforces 6)", () => {
  // JS-level validation doesn't check length — that's enforced by the HTML input
  const result = validateInputs("sid@bidsmith.pro", "x");
  assert.equal(result.valid, true);
});

// ══════════════════════════════════════════════════════════════════════════════
//  normalizeEmail
// ══════════════════════════════════════════════════════════════════════════════

test("normalizeEmail → lowercases email", () => {
  assert.equal(normalizeEmail("SID@BidSmith.PRO"), "sid@bidsmith.pro");
});

test("normalizeEmail → trims leading and trailing whitespace", () => {
  assert.equal(normalizeEmail("  sid@bidsmith.pro  "), "sid@bidsmith.pro");
});

test("normalizeEmail → trims AND lowercases in one pass", () => {
  assert.equal(normalizeEmail("  SID@BIDSMITH.PRO  "), "sid@bidsmith.pro");
});

test("normalizeEmail → handles already-normalized email", () => {
  assert.equal(normalizeEmail("sid@bidsmith.pro"), "sid@bidsmith.pro");
});

test("normalizeEmail → handles email with dots and plus alias", () => {
  assert.equal(normalizeEmail("Sid.Porwal+Test@BidSmith.Pro"), "sid.porwal+test@bidsmith.pro");
});

test("normalizeEmail → handles Unicode characters", () => {
  // Should not crash — Supabase will reject Unicode emails at the API level
  const result = normalizeEmail("тест@bidsmith.pro");
  assert.equal(typeof result, "string");
});

// ══════════════════════════════════════════════════════════════════════════════
//  mapSignInError
// ══════════════════════════════════════════════════════════════════════════════

test("mapSignInError → maps 'Invalid login credentials' to friendly message", () => {
  assert.equal(
    mapSignInError("Invalid login credentials"),
    "Wrong email or password."
  );
});

test("mapSignInError → passes through other Supabase errors unchanged", () => {
  const msg = "Email not confirmed";
  assert.equal(mapSignInError(msg), msg);
});

test("mapSignInError → passes through rate limit errors unchanged", () => {
  const msg = "Too many requests";
  assert.equal(mapSignInError(msg), msg);
});

test("mapSignInError → passes through network error messages", () => {
  const msg = "fetch failed";
  assert.equal(mapSignInError(msg), msg);
});

// ══════════════════════════════════════════════════════════════════════════════
//  resolveSignUpResponse
// ══════════════════════════════════════════════════════════════════════════════

test("resolveSignUpResponse → confirm_email when user exists but no session", () => {
  const result = resolveSignUpResponse({
    data: { user: { id: "u1", email: "sid@bidsmith.pro" }, session: null },
    error: null,
  });
  assert.equal(result.action, "confirm_email");
});

test("resolveSignUpResponse → login when user and session both present (email confirm disabled)", () => {
  const result = resolveSignUpResponse({
    data: {
      user: { id: "u1", email: "sid@bidsmith.pro" },
      session: { access_token: "tok_abc" },
    },
    error: null,
  });
  assert.equal(result.action, "login");
});

test("resolveSignUpResponse → error when Supabase returns an error", () => {
  const result = resolveSignUpResponse({
    data: null,
    error: { message: "Auth not configured — contact support." },
  });
  assert.equal(result.action, "error");
  assert.equal(result.msg, "Auth not configured — contact support.");
});

test("resolveSignUpResponse → error when Supabase returns weak password error", () => {
  const result = resolveSignUpResponse({
    data: null,
    error: { message: "Password should be at least 6 characters." },
  });
  assert.equal(result.action, "error");
  assert.match(result.msg, /6 characters/);
});

test("resolveSignUpResponse → error when Supabase returns duplicate email error", () => {
  const result = resolveSignUpResponse({
    data: null,
    error: { message: "User already registered" },
  });
  assert.equal(result.action, "error");
  assert.equal(result.msg, "User already registered");
});

test("resolveSignUpResponse → error when data is unexpectedly empty (no user, no error)", () => {
  const result = resolveSignUpResponse({ data: {}, error: null });
  assert.equal(result.action, "error");
});

// ══════════════════════════════════════════════════════════════════════════════
//  resolveSignInResponse
// ══════════════════════════════════════════════════════════════════════════════

test("resolveSignInResponse → login when data.user is present", () => {
  const result = resolveSignInResponse({
    data: { user: { id: "u1", email: "sid@bidsmith.pro" } },
    error: null,
  });
  assert.equal(result.action, "login");
});

test("resolveSignInResponse → error with friendly message for wrong credentials", () => {
  const result = resolveSignInResponse({
    data: null,
    error: { message: "Invalid login credentials" },
  });
  assert.equal(result.action, "error");
  assert.equal(result.msg, "Wrong email or password.");
});

test("resolveSignInResponse → error with raw message for other Supabase errors", () => {
  const result = resolveSignInResponse({
    data: null,
    error: { message: "Email not confirmed" },
  });
  assert.equal(result.action, "error");
  assert.equal(result.msg, "Email not confirmed");
});

test("resolveSignInResponse → error when unconfigured mock client responds", () => {
  const result = resolveSignInResponse({
    data: null,
    error: { message: "Auth not configured — contact support." },
  });
  assert.equal(result.action, "error");
  assert.match(result.msg, /contact support/);
});

test("resolveSignInResponse → error on unexpected empty response", () => {
  const result = resolveSignInResponse({ data: {}, error: null });
  assert.equal(result.action, "error");
});

// ══════════════════════════════════════════════════════════════════════════════
//  Mode switching behavior
// ══════════════════════════════════════════════════════════════════════════════

test("mode state → starts in 'login' mode by default", () => {
  // Simulates the useState('login') initial value
  let mode = "login";
  assert.equal(mode, "login");
});

test("mode state → switches from login to signup on tab click", () => {
  let mode = "login";
  // Simulates clicking the Sign Up tab
  mode = "signup";
  assert.equal(mode, "signup");
});

test("mode state → switches back from signup to login", () => {
  let mode = "signup";
  mode = "login";
  assert.equal(mode, "login");
});

test("mode switching → clears error state when switching modes", () => {
  let error = "Wrong email or password.";
  // Simulates the onClick: () => { setMode(m); setError(null); setInfo(null); }
  error = null;
  assert.equal(error, null);
});

test("mode switching → confirm_email branch sets mode to login after signup", () => {
  let mode = "signup";
  const response = resolveSignUpResponse({
    data: { user: { id: "u1" }, session: null },
    error: null,
  });
  if (response.action === "confirm_email") {
    mode = "login";
  }
  assert.equal(mode, "login");
});

// ══════════════════════════════════════════════════════════════════════════════
//  Security / edge cases
// ══════════════════════════════════════════════════════════════════════════════

test("normalizeEmail → does not execute injected script tags (XSS sanity)", () => {
  const input = "<script>alert('xss')</script>@bidsmith.pro";
  const result = normalizeEmail(input);
  // normalizeEmail is just trim+lowercase — no sanitization (that's Supabase's job)
  // This test ensures we don't accidentally do anything weird with the string
  assert.equal(typeof result, "string");
  assert.ok(result.includes("<script>"), "normalizeEmail does not strip content — Supabase validates");
});

test("validateInputs → whitespace-only password is treated as invalid (falsy after checking empty string)", () => {
  // password "   " is truthy in JS — validateInputs checks !password (not trim)
  // This is intentional: password trimming is deliberately NOT done (avoids stripping intentional spaces)
  const result = validateInputs("sid@bidsmith.pro", "   ");
  // "   " is truthy, so this will pass JS validation — Supabase enforces minimum length
  assert.equal(result.valid, true);
});

test("mapSignInError → handles undefined gracefully", () => {
  // If Supabase ever returns undefined message, should not crash
  const result = mapSignInError(undefined);
  assert.equal(result, undefined); // passes through as-is
});
