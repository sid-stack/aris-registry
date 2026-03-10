import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "./consent";

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let initialized = false;
let scriptRequested = false;
let listenerRegistered = false;

function canTrack() {
  return typeof window !== "undefined" && Boolean(measurementId);
}

function hasConsent() {
  if (!canTrack()) return false;
  return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "true";
}

function loadGtagScript() {
  if (!canTrack() || scriptRequested) return;

  scriptRequested = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

export function initAnalytics() {
  if (!canTrack() || initialized || !hasConsent()) return;

  loadGtagScript();
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });
  initialized = true;
}

export function trackPageView(path) {
  if (!canTrack() || !initialized || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name, params = {}) {
  if (!canTrack() || !initialized || !window.gtag) return;
  window.gtag("event", name, params);
}

export function registerConsentListener() {
  if (!canTrack() || listenerRegistered) return;

  listenerRegistered = true;
  window.addEventListener(ANALYTICS_CONSENT_EVENT, () => {
    initAnalytics();
    trackEvent("analytics_consent_accept", { source: "consent_banner" });
    trackPageView(window.location.pathname + window.location.search);
  });
}
