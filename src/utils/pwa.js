import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "./consent";

let serviceWorkerRegistered = false;

function hasConsent() {
  return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "true";
}

function registerServiceWorker() {
  if (serviceWorkerRegistered || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js")
    .then(() => {
      serviceWorkerRegistered = true;
    })
    .catch(() => {});
}

export function initServiceWorkerAfterConsent() {
  if (typeof window === "undefined") return;

  if (hasConsent()) {
    registerServiceWorker();
  }

  window.addEventListener(ANALYTICS_CONSENT_EVENT, registerServiceWorker);
}
