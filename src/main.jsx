import "./utils/clerkStaticPreviewFetchShim.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Clerk } from "@clerk/clerk-js";
import { ClerkProvider } from "@clerk/clerk-react";
import { initAnalytics, registerConsentListener } from "./utils/analytics";
import { initServiceWorkerAfterConsent } from "./utils/pwa";
import { initTheme } from "./lib/theme";
import { clerkAppearance } from "./lib/clerkAppearance.js";
import DevErrorPanel from "./components/DevErrorPanel.jsx";
import { devWarn } from "./utils/devLog";
import { hydrateAppConfig } from "./utils/appConfigHydrate.js";

// Must be the very first import-side-effect so the fetch patch is live
// before any other code fires a request.
import "./utils/httpDebug.js";
import "./styles/contrast-tokens.css";

/** Treat missing/placeholder env values as unset so we never mount Clerk with a bogus key. */
function normalizeClerkPublishableKey(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "undefined" || s === "null") return "";
  if (!s.startsWith("pk_test_") && !s.startsWith("pk_live_")) return "";
  return s;
}

/**
 * `.env.development.local.example` uses `pk_test_xxxxxxxx...` placeholders — treat as unset so we
 * fall back to a helpful mismatch warning instead of sending a bogus key to Clerk.
 */
function normalizeClerkDevOverrideKey(raw) {
  const s = normalizeClerkPublishableKey(raw);
  if (!s.startsWith("pk_test_")) return "";
  const suffix = s.slice("pk_test_".length);
  if (suffix.length < 8) return "";
  if (/^[xX]+$/.test(suffix)) return "";
  return s;
}

function ClerkPublishableKeyMissing() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        background: "#f4f4f5",
        color: "#18181b",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          background: "#fff",
          border: "1px solid #e4e4e7",
          borderRadius: 12,
          padding: "28px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Sign-in is not configured
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#3f3f46", margin: "0 0 14px" }}>
          {import.meta.env.DEV
            ? "This dev server does not have a Clerk publishable key. Add "
            : "This deployment is missing a Clerk publishable key. Set "}
          <code style={{ background: "#f4f4f5", padding: "2px 7px", borderRadius: 6, fontSize: 13 }}>VITE_CLERK_PUBLISHABLE_KEY</code>
          {" "}or legacy{" "}
          <code style={{ background: "#f4f4f5", padding: "2px 7px", borderRadius: 6, fontSize: 13 }}>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>
          {import.meta.env.DEV
            ? " to `.env.development.local` (copy from `.env.development.local.example`), then restart Vite."
            : " for Production on Vercel and/or Railway (`/app-config.js`), then redeploy."}
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.55, color: "#71717a", margin: "0 0 18px" }}>
          {import.meta.env.DEV
            ? "Without a `pk_test_` key, Clerk cannot initialize locally. See `.env.development.local.example`."
            : "Vercel: Project → Settings → Environment Variables → Production. See `.env.example` in the repo."}
        </p>
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}
        >
          Open Clerk Dashboard →
        </a>
      </div>
    </div>
  );
}

async function bootstrap() {
  await hydrateAppConfig();

  initTheme();
  initAnalytics();
  registerConsentListener();
  initServiceWorkerAfterConsent();

  const IS_DEV = import.meta.env.DEV;

  const IS_LOCAL_WEB_HOST =
    typeof window !== "undefined"
    && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  /** Dev / local preview: override when root `.env` keeps `pk_live_` for deploy tooling. */
  const useClerkDevPublishableOverride =
    IS_DEV || (import.meta.env.PROD && IS_LOCAL_WEB_HOST);

  const clerkPubKeyDev = useClerkDevPublishableOverride
    ? normalizeClerkDevOverrideKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV)
    : "";

  const clerkPubKey = clerkPubKeyDev
    || normalizeClerkPublishableKey(
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
        || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        || window.__APP_CONFIG__?.VITE_CLERK_PUBLISHABLE_KEY
        || window.__APP_CONFIG__?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    );

  const clerkConfigured = Boolean(clerkPubKey);

  /**
   * Dev-only strip: `pk_live` on real localhost. Do not key off `import.meta.env.DEV` — some hosting
   * configs can ship a bundle where DEV is still true, which incorrectly showed this banner on www.
   */
  const CLERK_KEY_MISMATCH =
    clerkPubKey.startsWith("pk_live_")
    && IS_LOCAL_WEB_HOST;

  /** Session-only hide for the top bar (auth can still 400 until real pk_test_ keys are set). */
  let clerkBannerDismissed = false;
  try {
    clerkBannerDismissed =
      typeof sessionStorage !== "undefined"
      && sessionStorage.getItem("bidsmith_clerk_pk_live_banner_dismissed") === "1";
  } catch {
    clerkBannerDismissed = false;
  }

  if (CLERK_KEY_MISMATCH) {
    devWarn(
      "[BidSmith] Clerk production key detected on localhost.\n"
      + "Auth may return 400 until you add real Development keys or allowlist this origin.\n"
      + "Fix: Clerk Dashboard → Development → API Keys → paste into `.env.development.local`:\n"
      + "  VITE_CLERK_PUBLISHABLE_KEY_DEV=pk_test_<...>\n"
      + "  CLERK_SECRET_KEY=sk_test_<...>\n"
      + "Then restart Vite. For `vite preview`, also add the same line to `.env.local` and rebuild.\n"
      + "Run: node scripts/open-clerk-dev-keys.mjs",
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));

  if (!clerkConfigured) {
    root.render(<ClerkPublishableKeyMissing />);
    return;
  }

  root.render(
    <React.StrictMode>
      {CLERK_KEY_MISMATCH && !clerkBannerDismissed && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000000,
            background: "#78350f",
            color: "#fef3c7",
            padding: "7px 16px",
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            letterSpacing: "0.02em",
            borderBottom: "1px solid #92400e",
          }}
        >
          <span>⚠</span>
          <span>
            Clerk production key on localhost — auth 400s expected. Paste real Development
            <code style={{ background: "rgba(0,0,0,0.25)", padding: "1px 5px", borderRadius: 3 }}> pk_test_</code>
            {" + "}
            <code style={{ background: "rgba(0,0,0,0.25)", padding: "1px 5px", borderRadius: 3 }}>sk_test_</code>
            {" "}into{" "}
            <code style={{ background: "rgba(0,0,0,0.25)", padding: "1px 5px", borderRadius: 3 }}>.env.development.local</code>
            {" "}(replace the placeholder x’s).{" "}
            <code style={{ background: "rgba(0,0,0,0.25)", padding: "1px 5px", borderRadius: 3 }}>node scripts/open-clerk-dev-keys.mjs</code>
          </span>
          <button
            type="button"
            aria-label="Dismiss Clerk key warning for this browser session"
            onClick={() => {
              try {
                sessionStorage.setItem("bidsmith_clerk_pk_live_banner_dismissed", "1");
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
            style={{
              color: "#fde68a",
              background: "transparent",
              border: "1px solid rgba(253, 230, 138, 0.45)",
              borderRadius: 4,
              padding: "3px 8px",
              fontSize: 11,
              fontFamily: "inherit",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Dismiss
          </button>
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#fde68a", marginLeft: "auto", textDecoration: "underline", whiteSpace: "nowrap" }}
          >
            Clerk Dashboard →
          </a>
        </div>
      )}

      <ClerkProvider
        Clerk={Clerk}
        publishableKey={clerkPubKey}
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      >
        <App />
      </ClerkProvider>

      <DevErrorPanel />
    </React.StrictMode>,
  );
}

bootstrap().catch((err) => {
  console.error("[BidSmith] bootstrap failed:", err);
  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.innerHTML = `<div style="padding:24px;font-family:system-ui">Application failed to start. Check the console.</div>`;
  }
});
