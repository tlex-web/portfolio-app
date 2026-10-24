/**
 * SHELL-04, DATA-01: hashed terrain delivery (RESEARCH Pitfalls 9 and 10).
 *
 * - data/generated/precache.json (written by scripts/terrain/build-terrain.mjs)
 *   lists the footer contour strip, so the service worker precaches it and
 *   /offline keeps its band (UI-SPEC "Contour band").
 * - The committed public/service-worker.js keeps both placeholders; postbuild
 *   (scripts/inject-build-hash.mjs) replaces them, and /terrain/ is cache-first.
 * - proxy.ts skips images/ and terrain/, so static assets get no per-request
 *   CSP nonce; next.config.ts marks /terrain/* immutable, which is safe because
 *   every file there carries a content hash in its name.
 */
import fs from 'node:fs';
import path from 'node:path';
import { terrain } from '@/data/generated/terrain';

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const precache: unknown = JSON.parse(read('data/generated/precache.json'));
const sw = read('public/service-worker.js');

describe('precache.json', () => {
  test('equals [terrain.assets.contours.strip]', () => {
    expect(precache).toEqual([terrain.assets.contours.strip]);
  });

  test('every entry is a content-hashed /terrain/ SVG that exists in public/', () => {
    expect(Array.isArray(precache)).toBe(true);
    for (const url of precache as string[]) {
      expect(url).toMatch(/^\/terrain\/[a-z0-9-]+\.[0-9a-f]{10}\.svg$/);
      expect(fs.existsSync(path.join(ROOT, 'public', url))).toBe(true);
    }
  });
});

describe('service worker (committed form)', () => {
  test('keeps the build hash and precache placeholders', () => {
    expect(sw).toContain("'__BUILD_HASH__'");
    expect(sw).toContain('/*__PRECACHE_URLS__*/[]');
  });

  test('precaches the PRECACHE list on install', () => {
    expect(sw).toContain("cache.addAll(['/', '/offline', ...PRECACHE])");
  });

  test('serves /terrain/ cache-first', () => {
    expect(sw).toContain("startsWith('/terrain/')");
  });
});

describe('delivery config', () => {
  test('proxy matcher skips images/ and terrain/', () => {
    expect(read('proxy.ts')).toContain('images/|terrain/');
  });

  test('next.config marks /terrain/:path* immutable', () => {
    const config = read('next.config.ts');
    expect(config).toContain("source: '/terrain/:path*'");
    expect(config).toContain('immutable');
  });
});
