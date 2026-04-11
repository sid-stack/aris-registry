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
  || 'pk_live_Y2xlcmsuYmlkc21pdGgucHJvJA';

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

ReactDOM.createRoot(document.getElementById('root')).render(
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
)
