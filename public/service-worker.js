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

// Helper function to check if request can be cached
function canCacheRequest(request) {
  return request.method === 'GET' && !request.url.includes('auth');
}

// Helper function to create fallback API response
function createFallbackApiResponse(requestUrl) {
  const pathname = requestUrl.pathname;
  let fallbackData = null;
  
  if (pathname.includes('transactions/get-transaction')) {
    fallbackData = [];
  } else if (pathname.match(/transactions\/[0-9a-fA-F]{24}$/)) {
    fallbackData = {};
  } else if (pathname.includes('wallet/balance')) {
    fallbackData = { balance: 0 };
  } else if (pathname.includes('user-details')) {
    fallbackData = { user: {} };
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'You are offline. Displaying cached data.',
      data: fallbackData
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Fetch event - cache-first for static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isApiRequest = requestUrl.pathname.startsWith('/api/');

  if (isApiRequest) {
    // Handle API requests
    if (canCacheRequest(event.request)) {
      // Network-first strategy for cacheable GET requests
      event.respondWith(
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          return fetch(event.request)
            .then(networkResponse => {
              // Check if response is valid and can be cached
              if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
                try {
                  // Clone BEFORE any other operations that might consume the body
                  const responseToCache = networkResponse.clone();
                  
                  // Cache asynchronously without blocking the response
                  cache.put(event.request, responseToCache).catch(err => {
                    console.warn('Failed to cache API response:', err);
                  });
                } catch (cloneError) {
                  console.warn('Failed to clone response for caching:', cloneError);
                  // Continue without caching if clone fails
                }
              }
              return networkResponse;
            })
            .catch((fetchError) => {
              console.warn('Network request failed, trying cache:', fetchError);
              // Network failed, try cache
              return cache.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                  console.log('Serving from cache:', event.request.url);
                  return cachedResponse;
                }
                // No cache available, return fallback
                console.log('No cache available, returning fallback for:', event.request.url);
                return createFallbackApiResponse(requestUrl);
              });
            });
        }).catch(cacheError => {
          console.error('Cache operation failed:', cacheError);
          // If cache operations fail, try direct fetch
          return fetch(event.request).catch(() => {
            return createFallbackApiResponse(requestUrl);
          });
        })
      );
    } else {
      // For non-cacheable requests (POST, PUT, DELETE), just try network
      event.respondWith(
        fetch(event.request).catch(() => {
          // Return appropriate error response for failed non-cacheable requests
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Network unavailable. Please try again when online.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
    }
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then(response => {
          // Cache successful responses for static assets
          if (response && response.ok && event.request.method === 'GET') {
            try {
              // Clone immediately before any operations that might consume the body
              const responseToCache = response.clone();
              
              // Cache asynchronously
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache).catch(err => {
                  console.warn('Failed to cache static asset:', err);
                });
              }).catch(err => {
                console.warn('Failed to open cache for static asset:', err);
              });
            } catch (cloneError) {
              console.warn('Failed to clone response for static asset caching:', cloneError);
              // Continue without caching if clone fails
            }
          }
          return response;
        }).catch(() => {
          // Handle navigation requests when offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Resource not available offline', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      }).catch(cacheError => {
        console.error('Cache match failed:', cacheError);
        // If cache operations fail, try direct fetch
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>', {
              headers: { 'Content-Type': 'text/html' }
            });
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

// Background sync event (if you want to add offline form submissions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Handle background sync for offline actions
  }
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in service worker:', event.reason);
  event.preventDefault();
});