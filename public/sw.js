const CACHE_NAME = 'aris-core-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. CRITICAL: Bypass Service Worker for ALL API calls
  // This prevents "Failed to fetch" errors for POST requests (Search/Audit)
  if (url.pathname.startsWith('/api/')) {
    return; // Let the browser handle it natively
  }

  // 2. Bypass for non-GET requests (SW cannot cache POST/PUT/DELETE)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
