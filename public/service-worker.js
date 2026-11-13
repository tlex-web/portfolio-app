// Service Worker for Portfolio App
// Build hash and precache URLs injected by scripts/inject-build-hash.mjs during postbuild

const BUILD_HASH = '__BUILD_HASH__';
const STATIC_CACHE = `static-${BUILD_HASH}`;
const IMAGE_CACHE = `images-${BUILD_HASH}`;
const DYNAMIC_CACHE = `dynamic-${BUILD_HASH}`;

// Content-hashed same-origin URLs from data/generated/precache.json (the footer
// contour strip, so /offline keeps its band, and the hero contour, so its
// edge-art sheet renders on a first offline visit; D-12). Postbuild replaces the
// whole comment-plus-[] token with the JSON array; uninjected it is a valid
// empty list.
const PRECACHE = /*__PRECACHE_URLS__*/[];

// --- Caching strategy helpers ---

// WR-04: stores a copy of `response` under the fetch event's lifetime. The copy
// is cloned at once (the page consumes the original), and the write is handed
// to event.waitUntil while respondWith is still pending, so the browser keeps
// the worker alive until it is stored. A rejected put (QuotaExceededError, a
// consumed body) is caught here: the visitor already has the network answer.
// 12 IN-09: so is a synchronous throw (clone() on a used or locked body,
// waitUntil on an inactive event); the copy is just not stored.
function storeCopy(event, cacheName, request, response) {
  try {
    const copy = response.clone();
    event.waitUntil(
      caches
        .open(cacheName)
        .then((cache) => cache.put(request, copy))
        .catch(() => {})
    );
  } catch {
    // The visitor still gets the network answer.
  }
}

async function cacheFirst(event, cacheName) {
  const { request } = event;
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      storeCopy(event, cacheName, request, response);
    }
    return response;
  } catch {
    return undefined;
  }
}

// Page navigations (EDGE-02): the network answers whenever it can, so no
// visitor sees a page from an earlier deploy. Only an ok, same-origin
// ('basic'), non-redirected answer is stored; a 404, a 500, a redirect or an
// opaque answer is passed through and never stored, and a cached copy never
// replaces a network answer (the proxy's neutral 404 included). Only a network
// error falls back: the cached page, then the cached /offline, then a 503.
async function networkFirstNavigation(event) {
  const { request } = event;
  let response;
  try {
    response = await fetch(request);
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match('/offline')) ||
      new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }

  if (response.ok && response.type === 'basic' && !response.redirected) {
    storeCopy(event, DYNAMIC_CACHE, request, response);
  }
  return response;
}

// RSC payloads (client navigations and prefetches) carry a `_rsc` query or an
// `RSC: 1` header. They stay out of the worker: a stored payload from an
// earlier build would be served stale, and it is junk in Cache Storage.
function isRscRequest(request, url) {
  return url.searchParams.has('_rsc') || request.headers.get('RSC') === '1';
}

// D-12: /offline must render styled with no network, so install stores it
// together with every /_next/static/ file its HTML references and every font
// its Link header preloads (Next sends font preloads in the header, not the
// HTML). cache.addAll is all-or-nothing: if any URL fails, install rejects and
// the previous worker stays in control.
async function precacheOfflineAssets() {
  const cache = await caches.open(STATIC_CACHE);
  const response = await fetch('/offline', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`/offline answered ${response.status}`);
  }
  const html = await response.text();
  const fromHtml = [...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g)].map((m) =>
    m[1].replace(/&amp;/g, '&')
  );
  const fromLink = [
    ...(response.headers.get('link') || '').matchAll(/<(\/_next\/static\/media\/[^>]+)>/g),
  ].map((m) => m[1]);
  await cache.addAll([...new Set(['/', '/offline', ...PRECACHE, ...fromHtml, ...fromLink])]);
}

async function networkFirst(event, cacheName) {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      storeCopy(event, cacheName, request, response);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached;
  }
}

// --- Lifecycle events ---

// Install: precache '/', /offline with the assets it needs, and PRECACHE
self.addEventListener('install', (event) => {
  event.waitUntil(precacheOfflineAssets());

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

  // Media goes straight to the network: Range requests need real 206 responses,
  // and Cache.put rejects partial responses (Pitfall 6)
  if (
    request.headers.has('range') ||
    request.destination === 'video' ||
    request.destination === 'audio'
  ) {
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

  // Network-only for RSC payloads (never served from or stored in a cache)
  if (isRscRequest(request, url)) {
    return;
  }

  // Cache-first for fingerprinted static assets (every /terrain/ file carries a
  // content hash in its name; fetch() of a heightmap has no image destination)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/terrain/') ||
    /\.(woff2|woff|ttf|otf)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(event, STATIC_CACHE));
    return;
  }

  // Cache-first for images
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(event, IMAGE_CACHE));
    return;
  }

  // Network-first for page navigations (EDGE-02)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  // Network-first for everything else
  event.respondWith(networkFirst(event, DYNAMIC_CACHE));
});

// Message event: handle SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
