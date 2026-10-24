/**
 * DATA-05, DATA-08 (D-11, D-13): invariants of the image manifest and the
 * served photo files.
 *
 * data/generated/image-manifest.ts is written by scripts/photos/build-derivatives.mjs
 * from the gitignored originals. These tests pin it to the EXIF sidecar, to the
 * hashed files under public/images/photos/ and to the 2560 px ceiling (D-13), and
 * they keep the full-resolution copies (D-11) and hard-coded legacy image paths
 * out of the tree. File system only: sharp never runs in Jest.
 */
import fs from 'node:fs';
import path from 'node:path';
import { imageManifest } from '@/data/generated/image-manifest';
import { ImageManifest, MAX_LONG_EDGE } from '@/data/schemas/image-manifest';
import type { ExifSidecar } from '@/data/schemas/photo';

const ROOT = process.cwd();
const sidecar = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data/photos/exif-sidecar.json'), 'utf8')
) as ExifSidecar;
const entries = Object.entries(imageManifest);
const publicFile = (url: string) => path.join(ROOT, 'public', url);
const HASHED =
  /^\/images\/photos\/(img-\d{4}|r\d{3}-\d{3})-(640|1024|1200|1600|2560)\.[0-9a-f]{10}\.(avif|webp|jpg)$/;

/** Every .ts/.tsx file under `dir`, recursively. */
function sources(dir: string): string[] {
  return (fs.readdirSync(path.join(ROOT, dir), { recursive: true }) as string[])
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => path.join(dir, f));
}

describe('image manifest (DATA-08)', () => {
  test('parses with ImageManifest and holds exactly the sidecar ids', () => {
    expect(() => ImageManifest.parse(imageManifest)).not.toThrow();
    expect(Object.keys(imageManifest).sort()).toEqual(sidecar.photos.map((p) => p.id).sort());
  });

  test('every variant and JPEG URL is hashed, exists under public/ and stays within 2560 px', () => {
    for (const [, e] of entries) {
      const urls = [...e.variants.flatMap((v) => [v.avif, v.webp]), e.jpeg.src];
      for (const url of urls) {
        expect(url).toMatch(HASHED);
        expect(fs.existsSync(publicFile(url))).toBe(true);
      }
      for (const v of [...e.variants, e.jpeg]) {
        expect(v.longEdge).toBeLessThanOrEqual(MAX_LONG_EDGE);
        expect(Math.max(v.width, v.height)).toBeLessThanOrEqual(MAX_LONG_EDGE);
      }
    }
  });

  test('every legacy -large / -thumb path exists under public/', () => {
    for (const [, e] of entries)
      for (const url of Object.values(e.legacy)) expect(fs.existsSync(publicFile(url))).toBe(true);
  });

  test("each entry's sourceSha256 equals the sidecar sha256 for that id", () => {
    for (const p of sidecar.photos) {
      const e = imageManifest[p.id as keyof typeof imageManifest];
      expect(e.sourceSha256).toBe(p.sha256);
    }
  });
});

describe('served images (DATA-05, D-11)', () => {
  test('no app/ or components/ source hard-codes a legacy image path or variant file name', () => {
    const legacy = /\/images\/optimized\/|-(large|thumb|medium|sm|md|lg)\.(webp|jpe?g|avif|png)\b/;
    const hits = [...sources('app'), ...sources('components')].filter((f) =>
      legacy.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
    );
    expect(hits).toEqual([]);
  });

  test('the eight full-resolution copies and optimization-manifest.json are gone from public/images/optimized/', () => {
    const fullRes = sidecar.photos.flatMap((p) => {
      const base = p.file.replace(/\.jpe?g$/i, '');
      return [`${base}.jpg`, `${base}.webp`];
    });
    expect(fullRes).toHaveLength(8);
    const present = [...fullRes, 'optimization-manifest.json'].filter((f) =>
      fs.existsSync(path.join(ROOT, 'public/images/optimized', f))
    );
    expect(present).toEqual([]);
  });
});
