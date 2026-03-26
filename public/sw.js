// Bump this version string on every deploy to force cache invalidation
const CACHE_VERSION = 'aris-v4';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;

// Only cache immutable fingerprinted assets (JS/CSS with hashes in filename)
const STATIC_EXTENSIONS = ['.js', '.css', '.woff2', '.woff', '.ttf', '.png', '.svg', '.ico'];

function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
}

// Install — skip waiting so new SW activates immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate — delete ALL old caches from previous versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always bypass SW for API calls and non-GET requests
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // HTML pages — network first, fall back to cache
  // This guarantees fresh HTML (and thus fresh asset hashes) on every deploy
  if (event.request.headers.get('accept')?.includes('text/html') ||
      url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Don't cache error responses
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static fingerprinted assets — cache first (they have hashes, safe to cache long)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(c => c.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else — network only
});
