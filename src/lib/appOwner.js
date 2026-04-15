/**
 * Founder-only UI (nav links, /traffic-brief). Set in `.env` / Vercel (build-time):
 *   VITE_APP_OWNER_USER_IDS=user_abc,user_def
 *   VITE_APP_OWNER_EMAILS=sid@bidsmith.pro
 * Matching either list is enough. If both are empty, no one is treated as owner (safe default).
 */
function parseList(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAppOwner(user) {
  if (!user || typeof user !== "object") return false;
  const ids = parseList(import.meta.env.VITE_APP_OWNER_USER_IDS);
  const emails = parseList(import.meta.env.VITE_APP_OWNER_EMAILS).map((e) =>
    e.toLowerCase(),
  );

  const id = user.id;
  const email = user.email ? String(user.email).toLowerCase() : "";

  if (id && ids.includes(id)) return true;
  if (email && emails.includes(email)) return true;
  return false;
}
