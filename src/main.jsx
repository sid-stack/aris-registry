import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import { initAnalytics, registerConsentListener } from "./utils/analytics";
import { initServiceWorkerAfterConsent } from "./utils/pwa";

initAnalytics();
registerConsentListener();
initServiceWorkerAfterConsent();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  || window.__APP_CONFIG__?.VITE_CLERK_PUBLISHABLE_KEY
  || 'pk_live_Y2xlcmsuYmlkc21pdGgucHJvJA';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey} appearance={{ baseTheme: undefined, variables: { colorBackground: "#0d0f14", colorText: "#f8fafc", colorPrimary: "#0B3D91" } }}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
