import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { initAnalytics, registerConsentListener } from "./utils/analytics";
import { initServiceWorkerAfterConsent } from "./utils/pwa";
import { initTheme } from "./lib/theme";

initTheme();
initAnalytics();
registerConsentListener();
initServiceWorkerAfterConsent();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  || window.__APP_CONFIG__?.VITE_CLERK_PUBLISHABLE_KEY
  || 'pk_live_Y2xlcmsuYmlkc21pdGgucHJvJA';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey} appearance={{
      variables: {
        colorBackground: '#0d0f14',
        colorInputBackground: 'rgba(255,255,255,0.04)',
        colorInputText: '#f1f5f9',
        colorText: '#f8fafc',
        colorTextSecondary: '#64748b',
        colorPrimary: '#1d4ed8',
        colorDanger: '#ef4444',
        borderRadius: '10px',
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      elements: {
        card: { background: 'rgba(13,17,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
        headerTitle: { color: '#f8fafc' },
        headerSubtitle: { color: '#64748b' },
        formButtonPrimary: { background: 'linear-gradient(135deg, #0B3D91, #1d4ed8)', boxShadow: '0 4px 12px rgba(11,61,145,0.35)' },
        footerActionLink: { color: '#60a5fa' },
      }
    }}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
