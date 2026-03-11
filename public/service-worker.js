// Service Worker for Portfolio App
// Build hash injected by scripts/inject-build-hash.mjs during postbuild

const BUILD_HASH = 'T5Omvo7bhPVP9HRwZj9-X';
const STATIC_CACHE = `static-${BUILD_HASH}`;
const IMAGE_CACHE = `images-${BUILD_HASH}`;
const DYNAMIC_CACHE = `dynamic-${BUILD_HASH}`;

// --- Caching strategy helpers ---

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return undefined;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    return cached;
  }

  const response = await fetchPromise;
  if (response) {
    return response;
  }

  // Offline fallback for navigation requests
  const offlinePage = await caches.match('/offline');
  return (
    offlinePage ||
    new Response('Offline - please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  );
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached;
  }
}

// --- Lifecycle events ---

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(['/', '/offline']);
    })
  );

  self.skipWaiting();
});

// Activate: delete all caches from previous builds
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.endsWith(BUILD_HASH))
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

// --- Fetch event ---

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension protocol
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Network-only for API routes
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-first for fingerprinted static assets
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    /\.(woff2|woff|ttf|otf)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Cache-first for images
  if (
    url.pathname.startsWith('/_next/image') ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Stale-while-revalidate for HTML pages
  if (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  ) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Network-first for everything else
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Message event: handle SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
