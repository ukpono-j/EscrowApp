const CACHE_NAME = "sylo-cache-v1";
const DYNAMIC_CACHE_NAME = "sylo-dynamic-v1";

// List of resources to cache during installation
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

// Install event - caches static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
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
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - cache-first for static assets, stale-while-revalidate for API calls
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isApiRequest = requestUrl.pathname.startsWith('/api/');

  if (isApiRequest) {
    // Stale-while-revalidate for API requests
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Only cache successful responses (status 200)
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // If network fails and cache exists, return cached response
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback response for API when offline and no cache
              return new Response(
                JSON.stringify({
                  success: false,
                  error: 'You are offline. Displaying cached data.',
                  data: requestUrl.pathname.includes('transactions/get-transaction')
                    ? []
                    : requestUrl.pathname.match(/transactions\/[0-9a-fA-F]{24}$/)
                      ? {}
                      : requestUrl.pathname.includes('wallet/balance')
                        ? { balance: 0 }
                        : requestUrl.pathname.includes('user-details')
                          ? { user: {} }
                          : null
                }),
                {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
          // Return cached response immediately (if available) while fetching new data
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Resource not available offline', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
  }
});

// Push event - handle notifications
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
    title: `Sylo: ${data.title || 'New Notification'}`,
  };

  try {
    await self.registration.showNotification(options.title, options);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notification } = event;
  const { url, notificationId } = notification.data;

  if (action === 'view' && url) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus();
            }
          }
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