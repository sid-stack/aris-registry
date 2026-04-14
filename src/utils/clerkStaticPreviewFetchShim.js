/**
 * Production bundle served on localhost (e.g. `npx serve dist`, Lighthouse CI) cannot satisfy
 * Clerk's Origin allowlist — the Frontend API returns 400 and Lighthouse flags `errors-in-console`
 * plus cookie / inspector noise.
 *
 * For static localhost preview only, short-circuit Clerk's bootstrap fetches with cached
 * public JSON snapshots (same shape as real `/v1/client` and `/v1/environment` responses).
 * Refresh `src/fixtures/clerk-preview-*.json` if Clerk bumps required fields.
 */
import clientFixture from "../fixtures/clerk-preview-client.json";
import environmentFixture from "../fixtures/clerk-preview-environment.json";

function isLocalStaticHost() {
  return (
    typeof window !== "undefined"
    && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  );
}

function resolveUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input && typeof input === "object" && "url" in input) return String(input.url);
  return String(input ?? "");
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

if (import.meta.env.PROD && typeof window !== "undefined" && isLocalStaticHost()) {
  const orig = window.fetch.bind(window);

  window.fetch = async function clerkStaticPreviewFetch(input, init) {
    const url = resolveUrl(input);
    if (url.includes("clerk.bidsmith.pro") && url.includes("/v1/client")) {
      return jsonResponse(clientFixture);
    }
    if (url.includes("clerk.bidsmith.pro") && url.includes("/v1/environment")) {
      return jsonResponse(environmentFixture);
    }
    return orig(input, init);
  };
}
