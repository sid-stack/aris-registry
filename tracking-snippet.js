/* --------------------------------------------------------------
   1️⃣  Generate / read a persistent user-ID cookie (30-day lifespan)
   -------------------------------------------------------------- */
function getOrCreateUid() {
  const name = 'uid';
  const decoded = decodeURIComponent(document.cookie);
  const parts = decoded.split('; ');
  for (const part of parts) {
    if (part.startsWith(name)) return part.substring(name.length);
  }
  // No cookie → create a new UUID (v4, simple version)
  const uid = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `uid=${uid}; expires=${expires}; path=/; SameSite=Lax`;
  return uid;
}
const UID = getOrCreateUid();

/* --------------------------------------------------------------
   2️⃣  Record page-view (always) and unique-visitor (first of the day)
   -------------------------------------------------------------- */
function sendEvent(event, payload = {}) {
  fetch('/api/track', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({uid: UID, event, ...payload})
  }).catch(()=>{}); // fire-and-forget
}
sendEvent('page_view');

/* --------------------------------------------------------------
   3️⃣  Time-on-site – start timer when page becomes visible
   -------------------------------------------------------------- */
let startTs = Date.now();

function maybeSendTime() {
  const now = Date.now();
  const seconds = Math.round((now - startTs) / 1000);
  if (seconds > 0) sendEvent('time_spent', {seconds});
}

/* Listen to visibility changes (tab hide, navigation away, etc.) */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) maybeSendTime();
});
window.addEventListener('pagehide', maybeSendTime);
window.addEventListener('beforeunload', maybeSendTime);

/* --------------------------------------------------------------
   4️⃣  Reset timer when page becomes visible again
   -------------------------------------------------------------- */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    startTs = Date.now();
  }
});
