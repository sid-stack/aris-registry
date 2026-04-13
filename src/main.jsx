import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { initAnalytics, registerConsentListener } from "./utils/analytics";
import { initServiceWorkerAfterConsent } from "./utils/pwa";
import { initTheme } from "./lib/theme";
import { clerkAppearance } from "./lib/clerkAppearance.js";
import DevErrorPanel from "./components/DevErrorPanel.jsx";
import { devWarn } from "./utils/devLog";

// Must be the very first import-side-effect so the fetch patch is live
// before any other code fires a request.
import "./utils/httpDebug.js";

initTheme();
initAnalytics();
registerConsentListener();
initServiceWorkerAfterConsent();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  || window.__APP_CONFIG__?.VITE_CLERK_PUBLISHABLE_KEY
  || '';

const clerkConfigured = Boolean(String(clerkPubKey || '').trim());

// Detect production key on localhost — Clerk will 400 on every request.
const IS_DEV = import.meta.env.DEV;
const CLERK_KEY_MISMATCH = IS_DEV && clerkPubKey.startsWith('pk_live_');

if (CLERK_KEY_MISMATCH) {
  devWarn(
    '[BidSmith Dev] Clerk production key detected on localhost.\n' +
    'Auth will return 400 errors until you add a pk_test_ key.\n' +
    'Fix: create .env.development.local with:\n' +
    '  VITE_CLERK_PUBLISHABLE_KEY=pk_test_<your-dev-key>\n' +
    '  CLERK_SECRET_KEY=sk_test_<your-dev-secret>\n' +
    'Get keys from: https://dashboard.clerk.com → Development environment → API Keys'
  );
}

function ClerkPublishableKeyMissing() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'system-ui, sans-serif',
      background: '#f4f4f5',
      color: '#18181b',
    }}
    >
      <div style={{
        maxWidth: 520,
        background: '#fff',
        border: '1px solid #e4e4e7',
        borderRadius: 12,
        padding: '28px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Sign-in is not configured
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#3f3f46', margin: '0 0 14px' }}>
          This production build is missing{' '}
          <code style={{ background: '#f4f4f5', padding: '2px 7px', borderRadius: 6, fontSize: 13 }}>VITE_CLERK_PUBLISHABLE_KEY</code>
          . Add it in your host&apos;s environment for <strong>Production</strong>, then redeploy so Vite can embed it at build time.
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.55, color: '#71717a', margin: '0 0 18px' }}>
          Vercel: Project → Settings → Environment Variables → Production → redeploy. See <code style={{ fontSize: 12 }}>.env.example</code> in the repo.
        </p>
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}
        >
          Open Clerk Dashboard →
        </a>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));

if (import.meta.env.PROD && !clerkConfigured) {
  root.render(<ClerkPublishableKeyMissing />);
} else {
  root.render(
    <React.StrictMode>
    {/* Dev banner — visible only when live Clerk key is used locally */}
    {CLERK_KEY_MISMATCH && (
      <div style={{
        position:      'fixed',
        top:           0,
        left:          0,
        right:         0,
        zIndex:        1000000,
        background:    '#78350f',
        color:         '#fef3c7',
        padding:       '7px 16px',
        fontSize:      12,
        fontFamily:    "'JetBrains Mono', monospace",
        fontWeight:    600,
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        letterSpacing: '0.02em',
        borderBottom:  '1px solid #92400e',
      }}>
        <span>⚠</span>
        <span>
          Clerk production key on localhost — auth 400s expected.
          Add <code style={{ background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: 3 }}>pk_test_</code> key to
          <code style={{ background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: 3 }}>.env.development.local</code> to fix.
        </span>
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#fde68a', marginLeft: 'auto', textDecoration: 'underline', whiteSpace: 'nowrap' }}
        >
          Get dev keys →
        </a>
      </div>
    )}

    <ClerkProvider
      publishableKey={clerkPubKey}
      fallbackRedirectUrl="/dashboard"
      appearance={clerkAppearance}
    >
      <App />
    </ClerkProvider>

      {/* Dev-only floating HTTP error panel */}
      <DevErrorPanel />
    </React.StrictMode>,
  );
}
