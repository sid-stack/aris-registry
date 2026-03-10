import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initAnalytics, registerConsentListener } from "./utils/analytics";
import { initServiceWorkerAfterConsent } from "./utils/pwa";

initAnalytics();
registerConsentListener();
initServiceWorkerAfterConsent();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
