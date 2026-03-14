const SW_VERSION = "v1";
const STATIC_CACHE = `bidsmith-static-${SW_VERSION}`;
const DOCUMENT_CACHE = `bidsmith-docs-${SW_VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DOCUMENT_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function isStaticAsset(request) {
  return ["script", "style", "image", "font"].includes(request.destination);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  
  // Ignore non-GET requests and chrome-extension:// schemes
  if (request.method !== "GET" || request.url.startsWith('chrome-extension://')) return;

  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DOCUMENT_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            // Check if valid response before caching
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch((err) => {
            console.warn('[SW] Fetch failed (offline):', err);
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
        return cached || networkFetch;
      })
    );
  }
});

