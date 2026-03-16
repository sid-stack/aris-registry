/* --------------------------------------------------------------
   1️⃣  Generate / read a persistent user-ID cookie
   -------------------------------------------------------------- */
function getOrCreateUid() {
  const name = 'uid';
  const decoded = decodeURIComponent(document.cookie);
  const parts = decoded.split('; ');
  for (const part of parts) {
    if (part.startsWith(name)) return part.substring(name.length);
  }
  const uid = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `uid=${uid}; expires=${expires}; path=/; SameSite=Lax`;
  return uid;
}
const UID = getOrCreateUid();

/* --------------------------------------------------------------
   2️⃣  Global Tracking Helper
   -------------------------------------------------------------- */
window.trackArisEvent = function(event, metadata = {}) {
  fetch('/api/track', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      uid: UID, 
      event, 
      page: window.location.href,
      metadata
    })
  }).catch(()=>{});
};

/* --------------------------------------------------------------
   3️⃣  Auto-track Page Views
   -------------------------------------------------------------- */
// Track as 'demo_view' if on the sample report or audit page, else 'page_view'
const eventType = (window.location.pathname.includes('sam-rep') || window.location.pathname.includes('audit')) 
  ? 'demo_view' 
  : 'page_view';

window.trackArisEvent(eventType);

/* --------------------------------------------------------------
   4️⃣  Time-on-site logic
   -------------------------------------------------------------- */
let startTs = Date.now();

function maybeSendTime() {
  const now = Date.now();
  const seconds = Math.round((now - startTs) / 1000);
  if (seconds > 0) window.trackArisEvent('time_spent', { value: seconds });
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) maybeSendTime();
  else startTs = Date.now();
});

window.addEventListener('pagehide', maybeSendTime);
window.addEventListener('beforeunload', maybeSendTime);

