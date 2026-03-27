// Arid SW - Disabled to prevent network interference with API endpoints
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch listener to prevent "TypeError: Failed to convert value to 'Response'"
