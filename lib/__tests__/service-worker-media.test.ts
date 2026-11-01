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

/** Loads the worker into stubs; returns its fetch listener and the stubs. */
function loadWorker() {
  const listeners: Record<string, Listener> = {};
  const cache = { match: jest.fn(), put: jest.fn(), addAll: jest.fn() };
  const caches = {
    match: jest.fn(() => Promise.resolve(undefined)),
    open: jest.fn(() => Promise.resolve(cache)),
    keys: jest.fn(() => Promise.resolve([])),
    delete: jest.fn(),
  };
  const fetchStub = jest.fn(() => new Promise(() => {}));
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
