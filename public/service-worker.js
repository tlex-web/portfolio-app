// Service Worker with Workbox for Portfolio App
// Provides offline functionality and optimized caching

// Cache names
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Cache expiration times
const IMAGE_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const STATIC_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll([
        '/',
        '/photos',
        '/projects',
        '/roadmap',
        '/contact',
        '/offline',
      ]);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old version caches
            return (
              cacheName.startsWith('static-') ||
              cacheName.startsWith('images-') ||
              cacheName.startsWith('dynamic-')
            ) && cacheName !== STATIC_CACHE && cacheName !== IMAGE_CACHE && cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', request.url);
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Determine cache strategy based on request type
          if (request.url.includes('/images/') || request.url.includes('/_next/image')) {
            // Cache images
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          } else if (request.url.includes('/_next/static/')) {
            // Cache static assets (JS, CSS)
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          } else if (url.origin === location.origin) {
            // Cache same-origin dynamic content
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Offline fallback
          if (request.mode === 'navigate') {
            return caches.match('/offline').then((offlinePage) => {
              return offlinePage || new Response('Offline - please check your connection', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
          }
        });
    })
  );
});

// Message event - handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
