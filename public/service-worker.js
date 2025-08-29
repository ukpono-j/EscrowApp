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
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

self.addEventListener('push', async (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Error parsing push data:', error);
      return;
    }
  }

  const options = {
    body: data.body || 'New notification received',
    icon: data.icon || '/icons/android-chrome-192x192.png',
    badge: '/icons/badge.png',
    data: {
      url: data.type === 'message' ? `/chat/${data.chatroomId}` : (data.url || '/'),
      notificationId: data.notificationId || null,
      chatroomId: data.chatroomId || null,
    },
    actions: [
      { action: 'view', title: data.type === 'message' ? 'View Message' : 'View Transaction' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
    tag: data.notificationId || 'notification',
    renotify: true,
    title: `Sylo: ${data.title || 'New Notification'}`, // Include site name in title
  };

  try {
    await self.registration.showNotification(options.title, options);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notification } = event;
  const { url, notificationId, chatroomId } = notification.data;

  if (action === 'view' && url) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if a window is already open
          for (const client of clientList) {
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus();
            }
          }
          // If no matching window, open a new one
          return clients.openWindow(url);
        })
        .catch((error) => {
          console.error('Error handling notification click:', error);
        })
    );
  } else if (action === 'dismiss') {
    console.log('Notification dismissed:', notificationId);
  }
});