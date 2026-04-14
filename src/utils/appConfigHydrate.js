/**
 * Loads `/app-config.js` at runtime on real deployments.
 * Skips the network request on localhost / loopback so static `serve dist` + Lighthouse
 * do not log 404s for a path that only exists behind Vercel → API rewrites.
 */
export function hydrateAppConfig() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();

    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
      return resolve();
    }

    if (document.querySelector("script[data-bidsmith-app-config=\"1\"]")) {
      return resolve();
    }

    const s = document.createElement("script");
    s.src = "/app-config.js";
    s.async = true;
    s.dataset.bidsmithAppConfig = "1";
    s.onload = () => resolve();
    s.onerror = () => {
      window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
      resolve();
    };
    document.head.appendChild(s);
  });
}
