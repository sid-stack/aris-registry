import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "./consent";
import { 
  initPlausible, 
  trackPlausiblePageView, 
  trackPlausibleEvent, 
  trackPlausibleGoal,
  PlausibleEvents
} from "./plausible";

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

  // Initialize Plausible Analytics
  initPlausible();

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

  // Track with Plausible Analytics
  trackPlausiblePageView(path);
}

export function trackEvent(name, params = {}) {
  if (!canTrack()) return;
  
  sovereignTrack(name, params.value || 0, params);

  // Track with Google Analytics
  if (initialized && window.gtag && measurementId) {
    window.gtag("event", name, params);
  }

  // Track with Plausible Analytics
  trackPlausibleEvent(name, params);
}

// Enhanced tracking functions for ARIS-specific events
export function trackAuditStart() {
  trackEvent(PlausibleEvents.AUDIT_STARTED, { category: 'Audit' });
}

export function trackAuditComplete() {
  trackEvent(PlausibleEvents.AUDIT_COMPLETED, { category: 'Audit' });
}

export function trackSamScrape() {
  trackEvent(PlausibleEvents.SAM_SCRAPE, { category: 'Scraping' });
}

export function trackLinkAnalysis() {
  trackEvent(PlausibleEvents.LINK_ANALYSIS, { category: 'Analysis' });
}

export function trackPdfUpload() {
  trackEvent(PlausibleEvents.PDF_UPLOAD, { category: 'Upload' });
}

export function trackTrialStart() {
  trackEvent(PlausibleEvents.TRIAL_STARTED, { category: 'Conversion' });
}

export function trackCheckoutInitiated(amount = 0) {
  trackEvent(PlausibleEvents.CHECKOUT_INITIATED, { 
    category: 'Conversion',
    value: amount 
  });
  trackPlausibleGoal(PlausibleEvents.CHECKOUT_INITIATED, amount);
}

export function trackSubscriptionUpgrade(plan = 'unknown') {
  trackEvent(PlausibleEvents.SUBSCRIPTION_UPGRADE, { 
    category: 'Conversion',
    plan 
  });
  trackPlausibleGoal(PlausibleEvents.SUBSCRIPTION_UPGRADE);
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

