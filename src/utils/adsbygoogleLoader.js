/** Production marketing hostnames only — keeps AdSense (third-party cookies + doubleclick) off localhost / static Lighthouse runs. */
export function isBidSmithProductionSurfaceHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "www.bidsmith.pro" || h === "bidsmith.pro";
}

/** Injects the global adsbygoogle script once when a slot may render (AdSenseContainer). */
export function ensureAdsbygoogleScript(clientId) {
  if (!clientId || !isBidSmithProductionSurfaceHost()) return;
  if (document.querySelector("script[data-bidsmith-adsbygoogle=\"1\"]")) return;

  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.dataset.bidsmithAdsbygoogle = "1";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  document.head.appendChild(s);
}
