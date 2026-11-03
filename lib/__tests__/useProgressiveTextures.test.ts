/**
 * useProgressiveTextures: the 3D carousel's texture loader (VERIFY-01).
 *
 * 07-02 rule: LEGACY_COMPILER_FILES shrinks to zero by Phase 12, so this hook
 * must pass the React Compiler rules at error level. These tests pin the
 * contract PhotoCarousel3D relies on while the hook is rewritten:
 * - every thumbnail first, then `allThumbsLoaded` with one texture per source
 * - full-size images one at a time, nearest the active index first, re-ordered
 *   when the active index changes
 * - a load that settles after its source list changed, or after unmount, is
 *   ignored and its texture disposed
 * - unmount disposes every texture the hook created
 *
 * three's TextureLoader is mocked: each `load` call is recorded and settles
 * only when a test resolves or rejects it.
 */
import { act, renderHook } from '@testing-library/react';
import * as THREE from 'three';
import { useProgressiveTextures, type ProgressiveTextureSource } from '@/lib/useProgressiveTextures';

type LoadCall = {
  url: string;
  onLoad: (texture: THREE.Texture) => void;
  onError: (error: unknown) => void;
  settled: boolean;
};

const mockCalls: LoadCall[] = [];

jest.mock('three', () => {
  class Texture {
    image: unknown = undefined;
    needsUpdate = false;
    minFilter = 0;
    magFilter = 0;
    generateMipmaps = true;
    colorSpace = '';
    disposeCount = 0;
    dispose() {
      this.disposeCount += 1;
    }
  }
  class TextureLoader {
    load(
      url: string,
      onLoad: (texture: unknown) => void,
      _onProgress: unknown,
      onError: (error: unknown) => void
    ) {
      mockCalls.push({ url, onLoad, onError, settled: false });
    }
  }
  return { Texture, TextureLoader, LinearFilter: 1006, SRGBColorSpace: 'srgb' };
});

type MockTexture = THREE.Texture & { disposeCount: number };

function makeSources(count: number, prefix = ''): ProgressiveTextureSource[] {
  return Array.from({ length: count }, (_, i) => ({
    thumbSrc: `${prefix}t${i}.webp`,
    fullSrc: `${prefix}f${i}.webp`,
  }));
}

/** URLs requested and not yet settled, in request order. */
function pendingUrls(): string[] {
  return mockCalls.filter((c) => !c.settled).map((c) => c.url);
}

/** Settles the oldest pending load of `url` with a fresh texture holding `{ src: url }`. */
async function resolveLoad(url: string): Promise<MockTexture> {
  const call = mockCalls.find((c) => c.url === url && !c.settled);
  if (!call) throw new Error(`no pending load for ${url}; pending: ${pendingUrls().join(', ')}`);
  call.settled = true;
  const texture = new THREE.Texture() as MockTexture;
  texture.image = { src: url };
  await act(async () => {
    call.onLoad(texture);
  });
  return texture;
}

async function rejectLoad(url: string): Promise<void> {
  const call = mockCalls.find((c) => c.url === url && !c.settled);
  if (!call) throw new Error(`no pending load for ${url}`);
  call.settled = true;
  await act(async () => {
    call.onError(new Error('404'));
  });
}

async function resolveThumbs(sources: readonly ProgressiveTextureSource[]): Promise<void> {
  for (const s of sources) await resolveLoad(s.thumbSrc);
}

function renderTextures(sources: ProgressiveTextureSource[], index = 0) {
  return renderHook(
    ({ list, active }: { list: ProgressiveTextureSource[]; active: number }) =>
      useProgressiveTextures(list, active),
    { initialProps: { list: sources, active: index } }
  );
}

beforeEach(() => {
  mockCalls.length = 0;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useProgressiveTextures (VERIFY-01)', () => {
  it('loads every thumbnail first and then reports one texture per source', async () => {
    const sources = makeSources(3);
    const { result } = renderTextures(sources);

    expect(pendingUrls()).toEqual(['t0.webp', 't1.webp', 't2.webp']);
    expect(result.current.allThumbsLoaded).toBe(false);

    await resolveLoad('t2.webp');
    await resolveLoad('t0.webp');
    expect(result.current.allThumbsLoaded).toBe(false);
    // No full-size request before the last thumbnail is in.
    expect(pendingUrls()).toEqual(['t1.webp']);

    await resolveLoad('t1.webp');
    expect(result.current.allThumbsLoaded).toBe(true);
    expect(result.current.textures).toHaveLength(3);
    expect(result.current.textures.map((t) => (t.image as { src: string }).src)).toEqual([
      't0.webp',
      't1.webp',
      't2.webp',
    ]);
    expect(result.current.textures.every((t) => t.colorSpace === THREE.SRGBColorSpace)).toBe(true);
    expect(result.current.loadState).toEqual(['thumb', 'thumb', 'thumb']);
  });

  it('counts a failed thumbnail as done so the carousel is never blocked', async () => {
    const sources = makeSources(2);
    const { result } = renderTextures(sources);

    await resolveLoad('t0.webp');
    await rejectLoad('t1.webp');

    expect(result.current.allThumbsLoaded).toBe(true);
    expect(result.current.textures).toHaveLength(2);
    expect(console.warn).toHaveBeenCalled();
  });

  it('loads full-size images one at a time, nearest the active index first', async () => {
    const sources = makeSources(5);
    const { result } = renderTextures(sources, 2);
    await resolveThumbs(sources);

    const order: string[] = [];
    for (let step = 0; step < 5; step++) {
      const pending = pendingUrls();
      expect(pending).toHaveLength(1);
      order.push(pending[0]);
      await resolveLoad(pending[0]);
    }

    // Active, next, previous, then the rest in index order.
    expect(order).toEqual(['f2.webp', 'f3.webp', 'f1.webp', 'f0.webp', 'f4.webp']);
    expect(pendingUrls()).toEqual([]);
    expect(result.current.loadState).toEqual(['full', 'full', 'full', 'full', 'full']);
  });

  it('re-orders the pending full-size loads when the active index changes', async () => {
    const sources = makeSources(6);
    const { rerender } = renderTextures(sources, 0);
    await resolveThumbs(sources);
    expect(pendingUrls()).toEqual(['f0.webp']);

    rerender({ list: sources, active: 3 });
    await resolveLoad('f0.webp');
    expect(pendingUrls()).toEqual(['f3.webp']);
    await resolveLoad('f3.webp');
    expect(pendingUrls()).toEqual(['f4.webp']);
    await resolveLoad('f4.webp');
    expect(pendingUrls()).toEqual(['f2.webp']);
  });

  it('swaps each image into the same texture object, so the scene keeps its materials', async () => {
    const sources = makeSources(2);
    const { result } = renderTextures(sources, 0);
    await resolveThumbs(sources);
    const [first] = result.current.textures;

    const intermediate = await resolveLoad('f0.webp');

    expect(result.current.textures[0]).toBe(first);
    expect((first.image as { src: string }).src).toBe('f0.webp');
    expect(result.current.loadState[0]).toBe('full');
    // The loader's own texture only carried the image; it is released at once.
    expect(intermediate.disposeCount).toBeGreaterThan(0);
  });

  it('ignores and disposes a thumbnail that arrives after the source list changed', async () => {
    const { result, rerender } = renderTextures(makeSources(3));
    const next = makeSources(2, 'b-');
    rerender({ list: next, active: 0 });

    const late = await resolveLoad('t0.webp');
    expect(late.disposeCount).toBeGreaterThan(0);
    expect(result.current.allThumbsLoaded).toBe(false);

    await resolveThumbs(next);
    expect(result.current.allThumbsLoaded).toBe(true);
    expect(result.current.textures.map((t) => (t.image as { src: string }).src)).toEqual([
      'b-t0.webp',
      'b-t1.webp',
    ]);
  });

  it('starts over when the source list changes: the old textures are disposed and never returned', async () => {
    const first = makeSources(3);
    const { result, rerender } = renderTextures(first);
    await resolveThumbs(first);
    const old = [...result.current.textures] as MockTexture[];
    const before = old.map((t) => t.disposeCount);

    const next = makeSources(2, 'b-');
    rerender({ list: next, active: 0 });
    await act(async () => {});

    expect(result.current.allThumbsLoaded).toBe(false);
    expect(result.current.textures.some((t) => old.includes(t as MockTexture))).toBe(false);
    old.forEach((t, i) => expect(t.disposeCount).toBeGreaterThan(before[i]));

    await resolveThumbs(next);
    expect(result.current.allThumbsLoaded).toBe(true);
    expect(result.current.textures).toHaveLength(2);
    expect(result.current.textures.some((t) => old.includes(t as MockTexture))).toBe(false);
  });

  it('reloads when the sources change at the same count: new thumbnails, old textures disposed and never returned (IN-03)', async () => {
    const first = makeSources(2);
    const { result, rerender } = renderTextures(first);
    await resolveThumbs(first);
    const old = [...result.current.textures] as MockTexture[];
    const before = old.map((t) => t.disposeCount);

    const next = makeSources(2, 'b-');
    rerender({ list: next, active: 0 });
    await act(async () => {});

    expect(pendingUrls()).toEqual(expect.arrayContaining(['b-t0.webp', 'b-t1.webp']));
    expect(result.current.loadState).toEqual(['loading', 'loading']);
    expect(result.current.allThumbsLoaded).toBe(false);
    expect(result.current.textures.some((t) => old.includes(t as MockTexture))).toBe(false);
    old.forEach((t, i) => expect(t.disposeCount).toBeGreaterThan(before[i]));

    await resolveThumbs(next);
    expect(result.current.allThumbsLoaded).toBe(true);
    expect(result.current.textures).toHaveLength(2);
    expect(result.current.textures.some((t) => old.includes(t as MockTexture))).toBe(false);
    expect(result.current.textures.map((t) => (t.image as { src: string }).src)).toEqual([
      'b-t0.webp',
      'b-t1.webp',
    ]);
  });

  it('starts no new load for a new array holding the same URLs (IN-03)', async () => {
    const first = makeSources(2);
    const { result, rerender } = renderTextures(first);
    await resolveThumbs(first);
    const live = [...result.current.textures];
    const calls = mockCalls.length;

    rerender({ list: makeSources(2), active: 0 });
    await act(async () => {});

    expect(mockCalls).toHaveLength(calls);
    expect(result.current.allThumbsLoaded).toBe(true);
    result.current.textures.forEach((t, i) => expect(t).toBe(live[i]));
    expect(pendingUrls()).toEqual(['f0.webp']);
  });

  it('disposes every texture on unmount and ignores loads that settle afterwards', async () => {
    const sources = makeSources(3);
    const { result, unmount } = renderTextures(sources, 1);
    await resolveThumbs(sources);
    const created = [...result.current.textures] as MockTexture[];
    const before = created.map((t) => t.disposeCount);
    expect(pendingUrls()).toEqual(['f1.webp']);

    unmount();
    await act(async () => {});
    created.forEach((t, i) => expect(t.disposeCount).toBeGreaterThan(before[i]));

    const late = await resolveLoad('f1.webp');
    expect(late.disposeCount).toBeGreaterThan(0);
    expect((created[1].image as { src: string }).src).toBe('t1.webp');
    // The cancelled chain requests nothing more.
    expect(pendingUrls()).toEqual([]);
  });

  it('survives the Strict Mode effect double run with live textures', async () => {
    const sources = makeSources(2);
    const { result } = renderHook(() => useProgressiveTextures(sources, 0), {
      reactStrictMode: true,
    });

    // Settle every thumbnail request, the abandoned first run's included.
    while (pendingUrls().some((u) => u.startsWith('t'))) {
      const url = pendingUrls().find((u) => u.startsWith('t'));
      await resolveLoad(url!);
    }

    expect(result.current.allThumbsLoaded).toBe(true);
    expect(result.current.textures.map((t) => (t.image as { src: string }).src)).toEqual([
      't0.webp',
      't1.webp',
    ]);
    const live = result.current.textures as MockTexture[];
    const counts = live.map((t) => t.disposeCount);
    await resolveLoad('f0.webp');
    // A full-size swap releases the GPU copy once; nothing else disposes a live texture.
    expect(live[0].disposeCount).toBe(counts[0] + 1);
    expect(live[1].disposeCount).toBe(counts[1]);
    expect((live[0].image as { src: string }).src).toBe('f0.webp');
  });
});
