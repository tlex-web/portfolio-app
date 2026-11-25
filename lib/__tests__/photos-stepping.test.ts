/**
 * Moving between photos (LBOX-02; D-08 as amended at OQ1, Tim 2026-10-26:
 * previous/next writes the URL with history.replaceState on both surfaces;
 * 10-UI-SPEC "Moving between photos", OQ4: no wrap; "Stage and photo", Swipe).
 * The viewer reads its slug from the pathname, steps by index without wrapping
 * and turns a released swipe into a step only when it is long and horizontal.
 *
 * One photo-path parser (17 D-24, 13 IN-03): slugFromPath is the only reading
 * of a photo URL in client code. Region pages live under /photos since 17-01,
 * so a reserved segment ('regions') is never a photo slug, and a malformed
 * percent-escape gives null rather than a throw (Edge PHOTO-05/encoding). The
 * source scan walks app/, components/ and lib/ (skipping __tests__), the same
 * walk as photo-routes.test.ts, and finds exactly one photo-path regex
 * definition: the export in lib/photos/stepping.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  PHOTO_PATH,
  RESERVED_PHOTO_SEGMENTS,
  SWIPE_MIN_PX,
  SWIPE_RATIO,
  slugFromPath,
  stepIndex,
  stepWithEnd,
  swipeStep,
} from '@/lib/photos/stepping';

describe('slugFromPath', () => {
  it('reads the slug of a photo URL', () => {
    expect(slugFromPath('/photos/riffelsee-reflection')).toBe('riffelsee-reflection');
  });

  it('returns null for the gallery, nested paths and a missing pathname', () => {
    expect(slugFromPath('/photos')).toBeNull();
    expect(slugFromPath('/photos/')).toBeNull();
    expect(slugFromPath('/photos/a/b')).toBeNull();
    expect(slugFromPath('/')).toBeNull();
    expect(slugFromPath(null)).toBeNull();
  });

  it('matches exactly one segment after /photos/', () => {
    expect(PHOTO_PATH.test('/photos/gornerschlucht-waterfall')).toBe(true);
    expect(PHOTO_PATH.test('/photos/a?x=1')).toBe(false);
    expect(PHOTO_PATH.test('/en/photos/a')).toBe(false);
  });

  it('never reads a region path as a photo slug (17 D-24)', () => {
    expect(slugFromPath('/photos/regions')).toBeNull();
    expect(slugFromPath('/photos/regions/zermatt')).toBeNull();
    expect(slugFromPath('/photos/regions/zermatt/x')).toBeNull();
  });

  it('reserves exactly the regions segment', () => {
    expect([...RESERVED_PHOTO_SEGMENTS]).toEqual(['regions']);
  });

  it('matches the reserved segment exactly and case-sensitively', () => {
    expect(slugFromPath('/photos/Regions')).toBe('Regions');
    expect(slugFromPath('/photos/regions-of-the-alps')).toBe('regions-of-the-alps');
  });

  it('returns null for a malformed percent-escape instead of throwing (Edge PHOTO-05/encoding)', () => {
    expect(() => slugFromPath('/photos/%E0')).not.toThrow();
    expect(slugFromPath('/photos/%E0')).toBeNull();
  });

  it('decodes percent-escapes once, before the reserved check', () => {
    expect(slugFromPath('/photos/a%20b')).toBe('a b');
    expect(slugFromPath('/photos/a%2520b')).toBe('a%20b');
    expect(slugFromPath('/photos/%72egions')).toBeNull();
  });

  it('reads a published photo slug', () => {
    expect(slugFromPath('/photos/matterhorn-from-zermatt')).toBe('matterhorn-from-zermatt');
  });
});

const ROOT = process.cwd();
const toPosix = (p: string) => p.split(path.sep).join('/');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** A photo-path regex definition in source text: `const NAME = /^\/photos\/…`, exported or not. */
const PHOTO_REGEX_DEF = String.raw`const\s+\w+\s*(?::[^=]+)?=\s*/\^\\/photos\\/`;

describe('one photo-path parser (17 D-24)', () => {
  const SOURCES = ['app', 'components', 'lib']
    .flatMap((dir) => walk(path.join(ROOT, dir)))
    .map((f) => toPosix(path.relative(ROOT, f)));

  const isDefinition = (text: string) => new RegExp(PHOTO_REGEX_DEF).test(text);

  it('the pattern catches a definition and nothing else', () => {
    expect(isDefinition(String.raw`const PHOTO_PATH = /^\/photos\/([^/]+)$/;`)).toBe(true);
    expect(isDefinition(String.raw`export const PHOTO_PATH = /^\/photos\/([^/?#]+)$/;`)).toBe(true);
    expect(isDefinition(String.raw`const P: RegExp = /^\/photos\/([^/]+)$/;`)).toBe(true);
    expect(isDefinition(String.raw`const DETAIL_PATH = /^\/(photos|projects)\/([^/]+)$/;`)).toBe(
      false
    );
    expect(isDefinition('const href = photoHref(slug);')).toBe(false);
  });

  it('walks the photo components and the stepping module', () => {
    expect(SOURCES).toContain('components/photos/LightboxDialog.tsx');
    expect(SOURCES).toContain('lib/photos/stepping.ts');
  });

  it('finds exactly one photo-path regex definition, the export in lib/photos/stepping.ts', () => {
    const found = SOURCES.flatMap((file) => {
      const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
      return [...text.matchAll(new RegExp(PHOTO_REGEX_DEF, 'g'))].map(() => file);
    });
    expect(found).toEqual(['lib/photos/stepping.ts']);
  });
});

describe('stepIndex (no wrap, UI-SPEC OQ4)', () => {
  it('returns null before the first photo and after the last', () => {
    expect(stepIndex(0, -1, 4)).toBeNull();
    expect(stepIndex(3, 1, 4)).toBeNull();
  });

  it('moves one place inside the range', () => {
    expect(stepIndex(1, 1, 4)).toBe(2);
    expect(stepIndex(1, -1, 4)).toBe(0);
    expect(stepIndex(2, 1, 4)).toBe(3);
  });
});

describe('stepWithEnd: the end-of-series card is one extra step (18-16; LBOX-09, D-12)', () => {
  it.each([2, 7])('with %i photos, Next from the last photo lands on the card (index n)', (n) => {
    expect(stepWithEnd(n - 1, 1, n)).toBe(n);
  });

  it.each([2, 7])('with %i photos, nothing follows the card and nothing wraps', (n) => {
    expect(stepWithEnd(n, 1, n)).toBeNull();
    expect(stepWithEnd(0, -1, n)).toBeNull();
  });

  it.each([2, 7])('with %i photos, Previous on the card returns to the last photo', (n) => {
    expect(stepWithEnd(n, -1, n)).toBe(n - 1);
  });

  it('moves one place among the photos like stepIndex', () => {
    expect(stepWithEnd(1, 1, 7)).toBe(stepIndex(1, 1, 7));
    expect(stepWithEnd(1, -1, 7)).toBe(stepIndex(1, -1, 7));
    // stepIndex itself still stops at the last photo: the card is stepWithEnd's alone.
    expect(stepIndex(6, 1, 7)).toBeNull();
  });
});

describe('swipeStep (48 px, 1.5 x the vertical travel)', () => {
  it('uses the UI-SPEC thresholds', () => {
    expect(SWIPE_MIN_PX).toBe(48);
    expect(SWIPE_RATIO).toBe(1.5);
  });

  it('a leftward swipe of at least 48 px steps to the next photo', () => {
    expect(swipeStep(-48, 32)).toBe(1);
    expect(swipeStep(-120, 10)).toBe(1);
  });

  it('a rightward swipe steps to the previous photo', () => {
    expect(swipeStep(60, 0)).toBe(-1);
  });

  it('a short swipe does nothing', () => {
    expect(swipeStep(-47, 0)).toBe(0);
    expect(swipeStep(0, 0)).toBe(0);
  });

  it('a swipe that is not 1.5 x more horizontal than vertical does nothing', () => {
    expect(swipeStep(-60, 41)).toBe(0);
    expect(swipeStep(60, 80)).toBe(0);
  });
});
