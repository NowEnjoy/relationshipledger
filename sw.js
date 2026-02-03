const CACHE_NAME = 'relationship-ledger-v3';

// In development, we don't hardcode filenames because Vite generates them with hashes.
// The browser will naturally cache visited resources. 
// For a production PWA build, you would typically use a library like 
// 'workbox' to inject the manifest of built files here.
// However, for this simple offline setup, we will cache the app shell.

const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Attempt to cache core files, but don't fail if one is missing in dev mode
        return cache.addAll(URLS_TO_CACHE).catch(err => console.log('Cache addAll warning:', err));
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML) - Network first, then Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              if (response) return response;
              // If not found in cache and network fails, return the index page (SPA fallback)
              // We try to match './' or the request url itself
              return caches.match('./') || caches.match(event.request); 
            });
        })
    );
    return;
  }

  // Static assets (JS, CSS, Images) - Cache first, then Network (Stale-while-revalidate strategy)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then(
          (networkResponse) => {
            // Check if valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Clone and cache updated version
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          }
        ).catch(() => {
           // Network failed, nothing to do
        });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});