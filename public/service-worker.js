const CACHE_NAME = "sylo-cache-v1";

// List of resources to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index-DdJq_EA-.js',
  '/assets/vendor-D3JYJaD0.js',
  '/assets/index--T8xFeeC.css',
  '/icons/favicon-32x32.png',
  '/icons/favicon.ico',
  '/icons/android-chrome-512x512.png',
  '/icons/android-chrome-192x192.png'
];

// Install event - caches assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache addAll error:', err);
        // Continue despite errors
        return Promise.resolve();
      })
  );
});

// Activate event - cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (CACHE_NAME !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If both network and cache fail, return cached homepage as fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            // Otherwise, just fail
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});