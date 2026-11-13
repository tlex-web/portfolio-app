/**
 * D-27, 11-RESEARCH Pitfall 6: the service worker leaves media to the network.
 *
 * The worker's cache helpers call `cache.put` for every ok response, and a 206
 * is ok: Cache.put rejects partial responses, and a cached full body answering
 * a later Range request breaks playback. So a Range request, or any request
 * whose destination is video or audio, must return from the fetch handler
 * without `respondWith`, and no cache method may run. A /media/ poster is an
 * image request and keeps the image path.
 *
 * WR-04: the cache-first and network-first helpers hand each write to
 * `event.waitUntil` and catch a rejected put, so the answer is always the
 * network response and no rejection is left unhandled.
 *
 * The committed public/service-worker.js (placeholders and all) is evaluated
 * against stubs for `self`, `caches` and `fetch`, and its fetch listener is
 * called with fake events.
 */
import fs from 'node:fs';
import path from 'node:path';

type Listener = (event: FakeEvent) => void;

interface FakeEvent {
  request: {
    url: string;
    method: string;
    mode: string;
    destination: string;
    headers: { has: (name: string) => boolean; get: (name: string) => string | null };
  };
  respondWith: jest.Mock;
  waitUntil: jest.Mock;
}

const source = fs.readFileSync(path.join(process.cwd(), 'public/service-worker.js'), 'utf8');

/**
 * Loads the worker into stubs; returns its fetch listener and the stubs.
 * `respond` answers fetch (never settles by default); `put` is cache.put's
 * implementation (resolves by default).
 */
function loadWorker(
  options: {
    respond?: (input: unknown) => Promise<unknown>;
    put?: (req: unknown, res: unknown) => Promise<void>;
  } = {},
) {
  const listeners: Record<string, Listener> = {};
  const cache = {
    match: jest.fn(),
    put: jest.fn(options.put ?? ((_req: unknown, _res: unknown) => Promise.resolve())),
    addAll: jest.fn(),
  };
  const caches = {
    match: jest.fn((_req: unknown) => Promise.resolve(undefined)),
    open: jest.fn((_name: string) => Promise.resolve(cache)),
    keys: jest.fn(() => Promise.resolve([])),
    delete: jest.fn(),
  };
  const fetchStub = jest.fn(options.respond ?? ((_input: unknown) => new Promise<unknown>(() => {})));
  const self = {
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = fn;
    },
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn() },
  };
  new Function('self', 'caches', 'fetch', source)(self, caches, fetchStub);
  return { onFetch: listeners.fetch, caches, cache, fetchStub };
}

/** A fake fetch event for a same-origin GET. */
function fetchEvent(pathname: string, destination: string, headers: Record<string, string> = {}): FakeEvent {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    request: {
      url: `https://timlui.example${pathname}`,
      method: 'GET',
      mode: 'no-cors',
      destination,
      headers: {
        has: (name) => name.toLowerCase() in lower,
        get: (name) => lower[name.toLowerCase()] ?? null,
      },
    },
    respondWith: jest.fn(),
    waitUntil: jest.fn(),
  };
}

const CLIP = '/media/coin-flip-toss.0123456789.mp4';

describe('service worker media bypass (Pitfall 6)', () => {
  test('registers a fetch listener', () => {
    expect(typeof loadWorker().onFetch).toBe('function');
  });

  test('a Range request for a clip is left to the network, with no cache access', () => {
    const { onFetch, caches, cache, fetchStub } = loadWorker();
    const event = fetchEvent(CLIP, 'video', { Range: 'bytes=0-' });
    onFetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
    expect(caches.match).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
    expect(fetchStub).not.toHaveBeenCalled();
  });

  test('a Range request without a media destination is left to the network', () => {
    const { onFetch, caches } = loadWorker();
    const event = fetchEvent('/images/photos/x-640.0123456789.webp', 'image', { range: 'bytes=100-' });
    onFetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
    expect(caches.match).not.toHaveBeenCalled();
  });

  test('a video-destination request without a Range header is left to the network', () => {
    const { onFetch, caches } = loadWorker();
    const event = fetchEvent(CLIP, 'video');
    onFetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
    expect(caches.match).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
  });

  test('an audio-destination request is left to the network', () => {
    const { onFetch, caches } = loadWorker();
    const event = fetchEvent('/media/sound.0123456789.m4a', 'audio');
    onFetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
    expect(caches.match).not.toHaveBeenCalled();
  });

  test('a /media/ WebP poster still takes the image path', () => {
    const { onFetch } = loadWorker();
    const event = fetchEvent('/media/coin-flip-toss-poster.0123456789.webp', 'image');
    onFetch(event);
    expect(event.respondWith).toHaveBeenCalledTimes(1);
  });

  test('the clip is not precached', () => {
    expect(source).not.toMatch(/\.mp4/);
  });
});

/** An ok same-origin answer; `clone` returns itself so identity checks stay simple. */
function okResponse() {
  const response = { ok: true, status: 200, type: 'basic', redirected: false, clone: () => response };
  return response;
}

/** A rejected cache.put, the way a full origin quota fails it. */
const quotaExceeded = () => Promise.reject(new DOMException('Quota exceeded', 'QuotaExceededError'));

// WR-04: every cache write runs under event.waitUntil, so the browser keeps the
// worker alive until the copy is stored, and a rejected put is caught there.
describe('service worker cache writes (WR-04)', () => {
  const paths = [
    ['a cache-first /_next/static/ asset', '/_next/static/chunks/app.0123456789.js', 'script', 'static-__BUILD_HASH__'],
    ['a cache-first /media/ poster image', '/media/coin-flip-toss-poster.0123456789.webp', 'image', 'images-__BUILD_HASH__'],
    ['a network-first GET', '/feed.json', '', 'dynamic-__BUILD_HASH__'],
  ] as const;

  test.each(paths)('%s hands its cache write to event.waitUntil', async (_label, pathname, destination, cacheName) => {
    const response = okResponse();
    const { onFetch, caches, cache } = loadWorker({ respond: () => Promise.resolve(response) });
    const event = fetchEvent(pathname, destination);
    onFetch(event);
    expect(event.respondWith).toHaveBeenCalledTimes(1);
    await expect(event.respondWith.mock.calls[0][0]).resolves.toBe(response);
    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    await event.waitUntil.mock.calls[0][0];
    expect(caches.open).toHaveBeenCalledWith(cacheName);
    expect(cache.put).toHaveBeenCalledWith(event.request, response);
  });

  test.each(paths)(
    '%s still answers from the network when cache.put rejects (QuotaExceededError)',
    async (_label, pathname, destination) => {
      const response = okResponse();
      const { onFetch, cache } = loadWorker({ respond: () => Promise.resolve(response), put: quotaExceeded });
      const event = fetchEvent(pathname, destination);
      onFetch(event);
      await expect(event.respondWith.mock.calls[0][0]).resolves.toBe(response);
      expect(event.waitUntil).toHaveBeenCalledTimes(1);
      // Caught inside the waitUntil chain: nothing is left unhandled.
      await expect(event.waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
      expect(cache.put).toHaveBeenCalledWith(event.request, response);
    },
  );
});

// 12 IN-09: storeCopy's synchronous steps (response.clone and event.waitUntil)
// can throw too: clone() throws a TypeError on a used or locked body, and
// waitUntil throws InvalidStateError on an inactive event. Neither may turn a
// good network answer into a network error (cacheFirst, networkFirst) or a
// rejected respondWith (networkFirstNavigation).
describe('service worker cache writes: a synchronous throw in storeCopy (12 IN-09)', () => {
  const paths = [
    ['a cache-first /_next/static/ asset', '/_next/static/chunks/app.0123456789.js', 'script', 'no-cors'],
    ['a cache-first /media/ poster image', '/media/coin-flip-toss-poster.0123456789.webp', 'image', 'no-cors'],
    ['a network-first GET', '/feed.json', '', 'no-cors'],
    ['a page navigation', '/projects', 'document', 'navigate'],
  ] as const;

  const throws = [
    [
      'response.clone() throws a TypeError (used body)',
      (response: ReturnType<typeof okResponse>, _event: FakeEvent) => {
        response.clone = () => {
          throw new TypeError('Response body is already used');
        };
      },
    ],
    [
      'event.waitUntil throws InvalidStateError (inactive event)',
      (_response: ReturnType<typeof okResponse>, event: FakeEvent) => {
        event.waitUntil.mockImplementation(() => {
          throw new DOMException('The event handler is already finished.', 'InvalidStateError');
        });
      },
    ],
  ] as const;

  describe.each(paths)('%s', (_label, pathname, destination, mode) => {
    test.each(throws)('answers with the network response when %s', async (_throwLabel, breakIt) => {
      const response = okResponse();
      const { onFetch, cache } = loadWorker({ respond: () => Promise.resolve(response) });
      const event = fetchEvent(pathname, destination);
      event.request = { ...event.request, mode };
      breakIt(response, event);
      onFetch(event);
      expect(event.respondWith).toHaveBeenCalledTimes(1);
      const answer = await event.respondWith.mock.calls[0][0];
      expect(answer).toBe(response);
      expect(answer).toMatchObject({ ok: true, status: 200 });
      expect(cache.put).not.toHaveBeenCalled();
    });
  });
});
