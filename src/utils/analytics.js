import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "./consent";
import posthog from 'posthog-js';
import { devDebug } from './devLog';

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let initialized = false;
let scriptRequested = false;
let listenerRegistered = false;
const QUALIFIED_SESSION_PREFIXES = ["/resources", "/govcon-guide", "/rfp-compliance-matrix-generator", "/templates", "/blog/"];

// BidSmith UID (persistent cookie logic)
const UID_KEY = "bs_uid";
function getOrCreateUid() {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}
const BIDSMITH_UID = getOrCreateUid();

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
    devDebug('[Analytics] Google Analytics initialized');
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
    devDebug('[Analytics] PostHog initialized');
  }

  initialized = true;
}

// BidSmith Track (Private Database)
async function bsTrack(event, value = 0, metadata = {}) {
  try {
    // Production bundle on localhost (e.g. `serve dist`, Lighthouse) has no API — avoid 404 console noise.
    if (
      import.meta.env.PROD
      && typeof window !== "undefined"
      && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      return;
    }

    fetch('/api/track', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        uid: BIDSMITH_UID,
        event,
        value,
        page: window.location.href,
        metadata
      })
    });
  } catch (e) { /* silent fail for analytics */ }
}

function isQualifiedPath(path) {
  return QUALIFIED_SESSION_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function trackQualifiedSession(path) {
  if (!canTrack() || !isQualifiedPath(path)) return;
  const key = `bs_qs_${path}`;
  if (window.sessionStorage.getItem(key) === "1") return;
  window.sessionStorage.setItem(key, "1");
  trackEvent("qualified_session", { path, segment: "govcon_intent" });
}

let funnelUserId = null;
let funnelPlan = "free";

/** Clerk / workspace context for funnel events (userId + plan snake_case per spec). */
export function setFunnelUser({ userId = null, plan = "free" } = {}) {
  funnelUserId = userId || null;
  funnelPlan = plan || "free";
}

export function utmPropsFromSearch() {
  if (!canTrack()) return {};
  const q = new URLSearchParams(window.location.search);
  const out = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
    const v = q.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function funnelDefaults() {
  const o = { plan: funnelPlan };
  if (funnelUserId) o.userId = funnelUserId;
  return o;
}

/**
 * Funnel events — Plausible custom goals + existing trackEvent (GA / PostHog / /api/track).
 * Never throws.
 */
export function track(event, props = {}) {
  try {
    const merged = { ...funnelDefaults(), ...props };
    if (import.meta.env.DEV) {
      devDebug("[analytics]", event, merged);
    }
    if (typeof window !== "undefined" && typeof window.plausible === "function") {
      window.plausible(event, { props: merged });
    }
  } catch (_) {
    /* ignore */
  }
  trackEvent(event, { ...funnelDefaults(), ...props });
}

export function identify(userId, traits = {}) {
  try {
    if (import.meta.env.DEV) {
      devDebug("[analytics:identify]", userId, traits);
    }
    if (!initialized || !posthog.__loaded || !userId) return;
    posthog.identify(userId, traits);
  } catch (_) {
    /* ignore */
  }
}

export function trackEvent(name, params = {}) {
  if (!canTrack()) return;

  bsTrack(name, params.value || 0, params);

  // Track with Google Analytics
  if (initialized && window.gtag && measurementId) {
    window.gtag("event", name, params);
  }

  // Track with PostHog — keep $pageview for SPA dashboards when name is page_view
  if (initialized && posthog.__loaded) {
    if (name === "page_view") {
      posthog.capture("$pageview", {
        path: params.path,
        title: typeof document !== "undefined" ? document.title : "",
        ...params,
      });
    } else {
      posthog.capture(name, params);
    }
  }
}

export function trackPageView(path) {
  if (!canTrack()) return;
  trackQualifiedSession(path);
  track("page_view", {
    path,
    referrer: typeof document !== "undefined" ? (document.referrer || "") : "",
    ...utmPropsFromSearch(),
  });
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

