import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "./consent";
import posthog from 'posthog-js';

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let initialized = false;
let scriptRequested = false;
let listenerRegistered = false;

// Sovereign UID (persistent cookie logic)
const UID_KEY = "aris_uid";
function getOrCreateUid() {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}
const SOVEREIGN_UID = getOrCreateUid();

function canTrack() {
  return typeof window !== "undefined";
}

function hasConsent() {
  if (!canTrack()) return false;
  return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "true";
}

function loadGtagScript() {
  if (!measurementId || scriptRequested) return;

  scriptRequested = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

export function initAnalytics() {
  if (!canTrack() || !hasConsent()) return;

  // Initialize Google Analytics if available
  if (measurementId) {
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
    console.log('[Analytics] Google Analytics initialized');
  }

  // Initialize PostHog
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      autocapture: true,
      capture_pageview: false,
    });
    console.log('[Analytics] PostHog initialized');
  }

  initialized = true;
}

// Sovereign Track (Private Database)
async function sovereignTrack(event, value = 0, metadata = {}) {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        uid: SOVEREIGN_UID,
        event,
        value,
        page: window.location.href,
        metadata
      })
    });
  } catch (e) { /* silent fail for analytics */ }
}

export function trackPageView(path) {
  if (!canTrack()) return;
  
  // Track as 'demo_view' for report/audit paths, else 'page_view'
  const event = (path.includes('sam-rep') || path.includes('audit')) ? 'demo_view' : 'page_view';
  sovereignTrack(event, 0, { path });

  // Track with Google Analytics
  if (initialized && window.gtag && measurementId) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }

  // Track with PostHog
  if (initialized && posthog.__loaded) {
    posthog.capture('$pageview', {
      path,
      title: document.title,
    });
  }
}

export function trackEvent(name, params = {}) {
  if (!canTrack()) return;
  
  sovereignTrack(name, params.value || 0, params);

  // Track with Google Analytics
  if (initialized && window.gtag && measurementId) {
    window.gtag("event", name, params);
  }

  // Track with PostHog
  if (initialized && posthog.__loaded) {
    posthog.capture(name, params);
  }
}

// Enhanced tracking functions for ARIS-specific events
export function trackAuditStart() {
  trackEvent('audit_started', { category: 'Audit' });
}

export function trackAuditComplete() {
  trackEvent('audit_completed', { category: 'Audit' });
}

export function trackSamScrape() {
  trackEvent('sam_scrape', { category: 'Scraping' });
}

export function trackLinkAnalysis() {
  trackEvent('link_analysis', { category: 'Analysis' });
}

export function trackPdfUpload() {
  trackEvent('pdf_upload', { category: 'Upload' });
}

export function trackTrialStart() {
  trackEvent('trial_started', { category: 'Conversion' });
}

export function trackCheckoutInitiated(amount = 0) {
  trackEvent('checkout_initiated', { 
    category: 'Conversion',
    value: amount 
  });
}

export function trackSubscriptionUpgrade(plan = 'unknown') {
  trackEvent('subscription_upgrade', { 
    category: 'Conversion',
    plan 
  });
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

