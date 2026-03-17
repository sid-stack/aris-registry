// Plausible Analytics Integration
// Privacy-focused, lightweight analytics alternative to Google Analytics

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'bidsmith.pro';
const PLAUSIBLE_SCRIPT_URL = import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL || 'https://plausible.io/js/script.js';

let scriptLoaded = false;
let initialized = false;

function canTrack() {
  return typeof window !== "undefined";
}

function hasConsent() {
  if (!canTrack()) return false;
  // Use existing consent logic
  return window.localStorage.getItem('analytics_consent') === "true";
}

function loadPlausibleScript() {
  if (scriptLoaded || !PLAUSIBLE_DOMAIN) return;

  scriptLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = PLAUSIBLE_SCRIPT_URL;
  script.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
  
  // Load script with error handling
  script.onload = () => {
    console.log('[Plausible] Analytics script loaded successfully');
  };
  
  script.onerror = () => {
    console.warn('[Plausible] Failed to load analytics script');
  };
  
  document.head.appendChild(script);
}

// Initialize Plausible Analytics
export function initPlausible() {
  if (!canTrack() || initialized || !hasConsent()) return;

  if (PLAUSIBLE_DOMAIN) {
    loadPlausibleScript();
    initialized = true;
    console.log('[Plausible] Analytics initialized');
  }
}

// Track page views with Plausible
export function trackPlausiblePageView(path) {
  if (!canTrack() || !initialized || !hasConsent()) return;

  try {
    if (window.plausible) {
      // Use path without domain for cleaner tracking
      const cleanPath = path.startsWith('/') ? path : '/' + path;
      window.plausible('pageview', {
        u: window.location.origin + cleanPath
      });
    }
  } catch (error) {
    console.warn('[Plausible] Error tracking page view:', error);
  }
}

// Track custom events with Plausible
export function trackPlausibleEvent(eventName, props = {}) {
  if (!canTrack() || !initialized || !hasConsent()) return;

  try {
    if (window.plausible) {
      window.plausible(eventName, { props });
    }
  } catch (error) {
    console.warn('[Plausible] Error tracking event:', error);
  }
}

// Track goals/conversions
export function trackPlausibleGoal(goalName, revenue = 0) {
  if (!canTrack() || !initialized || !hasConsent()) return;

  try {
    if (window.plausible) {
      window.plausible(goalName, { 
        props: { revenue: revenue.toString() },
        revenue: { currency: 'USD', amount: revenue }
      });
    }
  } catch (error) {
    console.warn('[Plausible] Error tracking goal:', error);
  }
}

// Enhanced events for ARIS-specific tracking
export const PlausibleEvents = {
  // User engagement
  AUDIT_STARTED: 'Audit Started',
  AUDIT_COMPLETED: 'Audit Completed',
  PROPOSAL_GENERATED: 'Proposal Generated',
  
  // Feature usage
  SAM_SCRAPE: 'SAM.gov Scrape',
  LINK_ANALYSIS: 'Link Analysis',
  PDF_UPLOAD: 'PDF Upload',
  
  // Conversion events
  TRIAL_STARTED: 'Trial Started',
  SUBSCRIPTION_UPGRADE: 'Subscription Upgrade',
  CHECKOUT_INITIATED: 'Checkout Initiated',
  
  // Content engagement
  DEMO_VIEW: 'Demo View',
  TUTORIAL_VIEW: 'Tutorial View',
  TEMPLATE_USED: 'Template Used',
  
  // Technical events
  API_ERROR: 'API Error',
  FALLBACK_USED: 'Fallback Used'
};

// Auto-initialize when consent is given
if (canTrack()) {
  // Listen for consent changes
  window.addEventListener('analytics_consent', () => {
    initPlausible();
  });
}
