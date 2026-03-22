export function getStoredTheme() {
  try { return localStorage.getItem("aris-theme") || "dark"; } catch { return "dark"; }
}
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem("aris-theme", theme); } catch {}
}
export function initTheme() {
  applyTheme(getStoredTheme());
}
