
const CACHE_NAME = 'ironlog-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Network fetch to update cache in background (Stale-While-Revalidate)
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback logic could go here
        });

      // If we have a cached response, return it immediately, 
      // but ensure the network request runs to update the cache for next time.
      if (cachedResponse) {
        e.waitUntil(fetchPromise);
        return cachedResponse;
      }

      // If no cache, return the network response directly
      return fetchPromise;
    })
  );
});
