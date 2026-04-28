/** Production marketing hostnames only — keeps AdSense (third-party cookies + doubleclick) off localhost / static Lighthouse runs. */
export function isBidSmithProductionSurfaceHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "www.bidsmith.pro" || h === "bidsmith.pro";
}

const ADSBYGOOGLE_SCRIPT_ID = "bidsmith-adsbygoogle-script";

/** Injects the global adsbygoogle script once when a slot may render (AdSenseContainer). */
export function ensureAdsbygoogleScript(clientId) {
  if (!clientId || !isBidSmithProductionSurfaceHost()) return;
  // AdSense validates the loader script tag — custom data-* attributes cause a console error.
  if (document.getElementById(ADSBYGOOGLE_SCRIPT_ID)) return;

  const s = document.createElement("script");
  s.id = ADSBYGOOGLE_SCRIPT_ID;
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  document.head.appendChild(s);
}
