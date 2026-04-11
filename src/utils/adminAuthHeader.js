/** Browser storage key for ADMIN_PASSWORD (Bearer token). Same as Traffic Brief. */
export const ADMIN_API_KEY_STORAGE = "bidsmith_admin_api_key";

export function getStoredAdminPassword() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_API_KEY_STORAGE) || "";
}

/** Headers for authenticated admin API calls. */
export function adminAuthHeaders(extra = {}) {
  const token = getStoredAdminPassword();
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
