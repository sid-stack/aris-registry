const DEFAULT_PRODUCTION_API_URL = "https://api.bidsmith.pro";

function normalizeApiBaseUrl(value) {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

function isLocalApiBaseUrl(value) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value);
}

export function getApiBaseUrl() {
  const runtimeBaseUrl = normalizeApiBaseUrl(
    window.__APP_CONFIG__?.VITE_API_URL || window.__APP_CONFIG__?.RAILWAY_URL || ""
  );
  const buildBaseUrl = normalizeApiBaseUrl(
    import.meta.env.VITE_API_URL || import.meta.env.VITE_RAILWAY_URL || ""
  );
  const preferredBaseUrl = runtimeBaseUrl || buildBaseUrl;
  const isProductionRuntime = import.meta.env.PROD || import.meta.env.MODE === "production";

  if (!isProductionRuntime) {
    return preferredBaseUrl;
  }

  if (!preferredBaseUrl || isLocalApiBaseUrl(preferredBaseUrl)) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  return preferredBaseUrl;
}

export function apiUrl(pathname) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return pathname;
  return `${baseUrl}${pathname}`;
}
