import { ANALYTICS_CONSENT_KEY } from "../utils/consent";

export const KPI_EVENTS = {
  trial_click: { category: "Funnel", action: "TrialStart", label: "LandingCTA" },
  upgrade_intent: { category: "Funnel", action: "UpgradeClick", label: "PricingCard" },
  pilot_cta: { category: "Conversion", action: "PilotRequest", label: "PilotBanner" },
  enterprise_contact: { category: "Sales", action: "EnterpriseContact", label: "ContactForm" },
};

/**
 * Sends a standardized KPI event to GA4 only when consent has been granted.
 *
 * @param {keyof typeof KPI_EVENTS} eventKey
 * @param {Record<string, unknown>} [extra]
 * @returns {boolean}
 */
export function trackKPI(eventKey, extra = {}) {
  if (typeof window === "undefined") return false;

  const hasConsent = window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "true";
  if (!hasConsent || typeof window.gtag !== "function") return false;

  const base = KPI_EVENTS[eventKey];
  if (!base) return false;

  window.gtag("event", eventKey, {
    ...base,
    ...extra,
  });

  return true;
}

