/**
 * @jest-environment node
 */
/**
 * EDGE-02, D-12, PITFALLS #17: the service worker fetches pages network-first.
 *
 * - A navigation goes to the network first. An ok, basic, non-redirected answer
 *   is returned and stored in the dynamic cache; a 404, a 500, a redirect or an
 *   opaque answer is returned and never stored, and a cached copy never stands
 *   in for a network answer (no stale v1 page after a deploy, and no cached
 *   page in place of the proxy's neutral 404 from 12-02).
 * - Only when the network fails does a navigation get the cached page, then the
 *   cached /offline, then a plain 503 "Offline".
 * - RSC requests (`_rsc` query or `RSC: 1` header) and /api/ requests get no
 *   respondWith, so no RSC payload is served from or written to Cache Storage.
 * - Install precaches '/', '/offline', the injected PRECACHE list and every
 *   /_next/static/ URL /offline needs (HTML references plus the fonts named in
 *   its Link header), so /offline renders styled with no network (D-12).
 *   cache.addAll is all-or-nothing, so a failed install rejects and the
 *   previous worker stays in control.
 * - Activate deletes every cache that does not end in the current build hash.
 * - WR-04: the navigation's cache write is handed to `event.waitUntil` while
 *   respondWith is still pending, so the browser cannot stop the worker
 *   mid-write; a rejected put (QuotaExceededError) is caught inside that chain
 *   and the visitor still gets the network answer.
 *
 * The committed public/service-worker.js is evaluated against stubs for `self`,
 * `caches` and `fetch` (the harness from service-worker-media.test.ts), with
 * the two postbuild tokens replaced the way scripts/inject-build-hash.mjs does.
 */
import fs from 'node:fs';
import path from 'node:path';

type Listener = (event: FakeEvent) => void;

interface FakeRequest {
  url: string;
  method: string;
  mode: string;
  destination: string;
  headers: { has: (name: string) => boolean; get: (name: string) => string | null };
}

interface FakeEvent {
  request: FakeRequest;
  respondWith: jest.Mock;
  waitUntil: jest.Mock;
}

interface FakeResponse {
  ok: boolean;
  status: number;
  type: string;
  redirected: boolean;
  headers: { get: (name: string) => string | null };
  text: () => Promise<string>;
  clone: () => FakeResponse;
}

const ORIGIN = 'https://timlui.example';
const BUILD = 'b1';
const STRIP = '/terrain/contours-strip.0123456789.svg';
const source = fs.readFileSync(path.join(process.cwd(), 'public/service-worker.js'), 'utf8');

/** A fake Response; `clone` returns itself so identity checks stay simple. */
function fakeResponse(init: Partial<Omit<FakeResponse, 'clone'>> & { body?: string } = {}): FakeResponse {
  const { body = '', ...rest } = init;
  const response: FakeResponse = {
    ok: true,
    status: 200,
    type: 'basic',
    redirected: false,
    headers: { get: () => null },
    text: () => Promise.resolve(body),
    clone: () => response,
    ...rest,
  };
  return response;
}

/** Key a caches.match argument: a string path or a request's pathname plus search. */
function keyOf(input: string | FakeRequest): string {
  if (typeof input === 'string') return input;
  const url = new URL(input.url);
  return url.pathname + url.search;
}

/**
 * Loads the worker into stubs. `stored` seeds what caches.match finds;
 * `respond` answers fetch.
 */
function loadWorker(
  options: {
    stored?: Record<string, FakeResponse>;
    respond?: (input: string | FakeRequest, init?: RequestInit) => Promise<FakeResponse>;
    keys?: string[];
    /** cache.put's implementation; resolves by default. */
    put?: (req: string | FakeRequest, res: FakeResponse) => Promise<void>;
  } = {},
) {
  const listeners: Record<string, Listener> = {};
  const stored = options.stored ?? {};
  const cache = {
    match: jest.fn((req: string | FakeRequest) => Promise.resolve(stored[keyOf(req)])),
    put: jest.fn(options.put ?? ((_req: string | FakeRequest, _res: FakeResponse) => Promise.resolve())),
    addAll: jest.fn((_urls: string[]) => Promise.resolve()),
  };
  const caches = {
    match: jest.fn((req: string | FakeRequest) => Promise.resolve(stored[keyOf(req)])),
    open: jest.fn((_name: string) => Promise.resolve(cache)),
    keys: jest.fn(() => Promise.resolve(options.keys ?? [])),
    delete: jest.fn((_name: string) => Promise.resolve(true)),
  };
  const fetchStub = jest.fn(
    options.respond ?? ((_input: string | FakeRequest, _init?: RequestInit) => new Promise<FakeResponse>(() => {})),
  );
  const self = {
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = fn;
    },
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn() },
  };
  const injected = source
    .replaceAll('__BUILD_HASH__', BUILD)
    .replace('/*__PRECACHE_URLS__*/[]', () => JSON.stringify([STRIP]));
  new Function('self', 'caches', 'fetch', injected)(self, caches, fetchStub);
  return { listeners, caches, cache, fetchStub, self };
}

/** A fake same-origin GET request. */
function fakeRequest(pathAndQuery: string, mode: string, destination: string, headers: Record<string, string> = {}): FakeRequest {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    url: `${ORIGIN}${pathAndQuery}`,
    method: 'GET',
    mode,
    destination,
    headers: {
      has: (name) => name.toLowerCase() in lower,
      get: (name) => lower[name.toLowerCase()] ?? null,
    },
  };
}

function fakeEvent(request: FakeRequest): FakeEvent {
  return { request, respondWith: jest.fn(), waitUntil: jest.fn() };
}

/** Dispatches a navigation to `pathname` and resolves with the worker's answer. */
async function navigate(worker: ReturnType<typeof loadWorker>, pathname: string) {
  const event = fakeEvent(fakeRequest(pathname, 'navigate', 'document', { accept: 'text/html' }));
  worker.listeners.fetch(event);
  expect(event.respondWith).toHaveBeenCalledTimes(1);
  const answer = await event.respondWith.mock.calls[0][0];
  return { event, answer };
}

/**
 * Awaits every promise the worker handed to `event.waitUntil` (WR-04): the
 * cache writes the browser keeps the worker alive for.
 */
async function settled(event: FakeEvent) {
  return Promise.all(event.waitUntil.mock.calls.map((call) => call[0] as Promise<unknown>));
}

/** A rejected cache.put, the way a full origin quota fails it. */
const quotaExceeded = () => Promise.reject(new DOMException('Quota exceeded', 'QuotaExceededError'));

const offline = () => Promise.reject(new TypeError('Failed to fetch'));

describe('service worker navigations (EDGE-02, network-first)', () => {
  test('an ok basic answer is returned and stored in the dynamic cache', async () => {
    const page = fakeResponse({ body: '<html>fresh</html>' });
    const worker = loadWorker({ respond: () => Promise.resolve(page) });
    const { event, answer } = await navigate(worker, '/roadmap');
    expect(answer).toBe(page);
    await settled(event);
    expect(worker.caches.open).toHaveBeenCalledWith(`dynamic-${BUILD}`);
    expect(worker.cache.put).toHaveBeenCalledWith(event.request, page);
  });

  test('an ok navigation hands its cache write to event.waitUntil before the answer settles (WR-04)', async () => {
    const page = fakeResponse({ body: '<html>fresh</html>' });
    const worker = loadWorker({ respond: () => Promise.resolve(page) });
    const event = fakeEvent(fakeRequest('/roadmap', 'navigate', 'document', { accept: 'text/html' }));
    // waitUntil is only allowed while respondWith's promise is pending, so
    // record how many writes were handed over when the answer settled.
    let handedOverAtAnswer = -1;
    event.respondWith.mockImplementation((answer: Promise<unknown>) => {
      void answer.then(() => {
        handedOverAtAnswer = event.waitUntil.mock.calls.length;
      });
    });
    worker.listeners.fetch(event);
    await expect(event.respondWith.mock.calls[0][0]).resolves.toBe(page);
    expect(handedOverAtAnswer).toBe(1);
    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    expect(event.waitUntil.mock.calls[0][0]).toBeInstanceOf(Promise);
    await settled(event);
    expect(worker.caches.open).toHaveBeenCalledWith(`dynamic-${BUILD}`);
    expect(worker.cache.put).toHaveBeenCalledWith(event.request, page);
  });

  test('a rejected put (QuotaExceededError) still returns the network answer, and waitUntil resolves (WR-04)', async () => {
    const page = fakeResponse({ body: '<html>fresh</html>' });
    const worker = loadWorker({ respond: () => Promise.resolve(page), put: quotaExceeded });
    const { event, answer } = await navigate(worker, '/roadmap');
    expect(answer).toBe(page);
    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    // The rejection is caught inside the waitUntil chain: nothing is left unhandled.
    await expect(event.waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
    expect(worker.cache.put).toHaveBeenCalledWith(event.request, page);
  });

  test('a cached copy never stands in while the network answers', async () => {
    const stale = fakeResponse({ body: '<html>v1</html>' });
    const fresh = fakeResponse({ body: '<html>v2</html>' });
    const worker = loadWorker({ stored: { '/roadmap': stale }, respond: () => Promise.resolve(fresh) });
    const { answer } = await navigate(worker, '/roadmap');
    expect(answer).toBe(fresh);
    expect(worker.caches.match).not.toHaveBeenCalled();
  });

  test.each([
    ['a 404', { ok: false, status: 404 }],
    ['a 500', { ok: false, status: 500 }],
    ['a redirected answer', { redirected: true }],
    ['an opaque answer', { type: 'opaque' }],
    ['an opaque redirect', { ok: false, status: 0, type: 'opaqueredirect' }],
  ])('%s is returned and never stored', async (_label, init) => {
    const response = fakeResponse(init);
    const worker = loadWorker({ respond: () => Promise.resolve(response) });
    const { event, answer } = await navigate(worker, '/photos/no-such-slug');
    expect(answer).toBe(response);
    await settled(event);
    expect(event.waitUntil).not.toHaveBeenCalled();
    expect(worker.cache.put).not.toHaveBeenCalled();
  });

  test('a network 404 is served even when a cached page exists for that URL', async () => {
    const cachedPage = fakeResponse({ body: '<html>old</html>' });
    const notFound = fakeResponse({ ok: false, status: 404, body: '<html>Page not found</html>' });
    const worker = loadWorker({
      stored: { '/photos/gone': cachedPage },
      respond: () => Promise.resolve(notFound),
    });
    const { event, answer } = await navigate(worker, '/photos/gone');
    expect(answer).toBe(notFound);
    await settled(event);
    expect(worker.cache.put).not.toHaveBeenCalled();
  });

  test('offline, the cached copy of the page is returned', async () => {
    const cachedPage = fakeResponse({ body: '<html>roadmap</html>' });
    const offlinePage = fakeResponse({ body: '<html>offline</html>' });
    const worker = loadWorker({ stored: { '/roadmap': cachedPage, '/offline': offlinePage }, respond: offline });
    const { answer } = await navigate(worker, '/roadmap');
    expect(answer).toBe(cachedPage);
  });

  test('offline with no copy of the page, the cached /offline is returned', async () => {
    const offlinePage = fakeResponse({ body: '<html>offline</html>' });
    const worker = loadWorker({ stored: { '/offline': offlinePage }, respond: offline });
    const { answer } = await navigate(worker, '/photos');
    expect(answer).toBe(offlinePage);
  });

  test('offline with nothing cached, a plain 503 "Offline" is returned', async () => {
    const worker = loadWorker({ respond: offline });
    const { answer } = await navigate(worker, '/photos');
    expect(answer).toBeInstanceOf(Response);
    const response = answer as Response;
    expect(response.status).toBe(503);
    expect(response.headers.get('Content-Type')).toMatch(/^text\/plain/);
    await expect(response.text()).resolves.toBe('Offline');
  });
});

describe('service worker bypasses (RSC and API)', () => {
  test.each([
    ['a _rsc query', '/roadmap?_rsc=abc', {}],
    ['an RSC: 1 header', '/roadmap', { RSC: '1' }],
    ['an /api/ request', '/api/feedback', {}],
  ])('%s gets no respondWith and touches no cache', (_label, url, headers) => {
    const worker = loadWorker({ respond: () => Promise.resolve(fakeResponse()) });
    const event = fakeEvent(fakeRequest(url, 'cors', '', headers));
    worker.listeners.fetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
    expect(worker.fetchStub).not.toHaveBeenCalled();
    expect(worker.caches.open).not.toHaveBeenCalled();
    expect(worker.caches.match).not.toHaveBeenCalled();
  });
});

const OFFLINE_HTML = [
  '<!DOCTYPE html><html><head>',
  '<link rel="stylesheet" href="/_next/static/css/a.css" data-precedence="next"/>',
  '<link rel="preload" as="style" href="/_next/static/css/a.css"/>',
  '<script src="/_next/static/chunks/b.js" async=""></script>',
  '<link rel="icon" href="/favicon.ico"/>',
  '</head><body><a href="/">Home</a></body></html>',
].join('');
const OFFLINE_LINK =
  '</_next/static/media/c.woff2>; rel=preload; as="font"; crossorigin=""; type="font/woff2", ' +
  '</_next/static/media/c.woff2>; rel=preload; as="font"; crossorigin=""; type="font/woff2"';

/** fetch stub for install: /offline answers with OFFLINE_HTML and OFFLINE_LINK. */
function installFetch(status = 200) {
  return (input: string | FakeRequest) => {
    if (keyOf(input) === '/offline') {
      return Promise.resolve(
        fakeResponse({
          ok: status >= 200 && status < 300,
          status,
          body: OFFLINE_HTML,
          headers: { get: (name: string) => (name.toLowerCase() === 'link' ? OFFLINE_LINK : null) },
        }),
      );
    }
    return Promise.reject(new TypeError(`unexpected fetch ${keyOf(input)}`));
  };
}

/** Fires install and returns the waitUntil promise. */
function install(worker: ReturnType<typeof loadWorker>) {
  const event = { waitUntil: jest.fn() } as unknown as FakeEvent;
  worker.listeners.install(event);
  expect(event.waitUntil).toHaveBeenCalledTimes(1);
  return event.waitUntil.mock.calls[0][0] as Promise<unknown>;
}

describe('service worker install (D-12, offline-ready precache)', () => {
  test("addAll receives '/', '/offline', PRECACHE and the /offline assets, each once", async () => {
    const worker = loadWorker({ respond: installFetch() });
    await install(worker);
    expect(worker.caches.open).toHaveBeenCalledWith(`static-${BUILD}`);
    expect(worker.fetchStub).toHaveBeenCalledWith('/offline', { cache: 'no-store' });
    expect(worker.cache.addAll).toHaveBeenCalledTimes(1);
    const urls = worker.cache.addAll.mock.calls[0][0];
    expect([...urls].sort()).toEqual(
      [
        '/',
        '/offline',
        STRIP,
        '/_next/static/css/a.css',
        '/_next/static/chunks/b.js',
        '/_next/static/media/c.woff2',
      ].sort(),
    );
  });

  test('install rejects when addAll rejects, so the previous worker stays in control', async () => {
    const worker = loadWorker({ respond: installFetch() });
    worker.cache.addAll.mockImplementationOnce(() => Promise.reject(new TypeError('Request failed')));
    await expect(install(worker)).rejects.toThrow('Request failed');
  });

  test('install rejects when /offline does not answer ok', async () => {
    const worker = loadWorker({ respond: installFetch(500) });
    await expect(install(worker)).rejects.toThrow();
    expect(worker.cache.addAll).not.toHaveBeenCalled();
  });
});

describe('service worker activate', () => {
  test('deletes every cache that does not end in the current build hash', async () => {
    const worker = loadWorker({ keys: [`static-${BUILD}`, `dynamic-${BUILD}`, 'dynamic-old', 'images-a0'] });
    const event = { waitUntil: jest.fn() } as unknown as FakeEvent;
    worker.listeners.activate(event);
    await event.waitUntil.mock.calls[0][0];
    const deleted = worker.caches.delete.mock.calls.map((call) => call[0]);
    expect(deleted.sort()).toEqual(['dynamic-old', 'images-a0']);
  });
});
