/**
 * DATA-03, DATA-04, DATA-08 (D-01, D-05..D-08): the editorial copy and the
 * photo view-model built from it.
 *
 * data/photos/editorial.ts holds the hand-written copy; lib/photos/view-model.ts
 * (buildPhotoViews) joins it with the generated photo facts and the image
 * manifest into the one PhotoView every Phase 10 surface reads. These tests pin
 * the copy rules (sourced facts, no repeated trivia or wrong places, stories
 * that do not read alike) and what the view-model makes of the copy. The
 * eight tests of the legacy bridge (the v1 data module, deleted in 10-09 with
 * the v1 photo UI) were rewritten here against buildPhotoViews, one for one.
 */
import fs from 'node:fs';
import path from 'node:path';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { editorial } from '@/data/photos/editorial';
import { EditorialMap, Fact } from '@/data/schemas/editorial';
import { formatCaptureLabel } from '@/lib/photo-format';
import { buildPhotoViews, elevationMetres } from '@/lib/photos/view-model';

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
const ids = photos.map((p) => p.id);
const views = buildPhotoViews();
const viewOf = (id: string) => views.find((v) => v.id === id)!;
const photoOf = (id: string) => photos.find((p) => p.id === id)!;
const NBSP = String.fromCharCode(0xa0);

/** Word trigrams of a text: lowercase, punctuation stripped. */
function trigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const grams = new Set<string>();
  for (let i = 0; i + 2 < words.length; i++) grams.add(words.slice(i, i + 3).join(' '));
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  let shared = 0;
  for (const g of a) if (b.has(g)) shared++;
  return shared / union.size;
}

// Cut trivia (D-05) and the wrong gorge (D-01): never in copy again.
const FORBIDDEN =
  /Teufelsschlucht|Toblerone|500 (alpinists|deaths|people)|100 ?km|Glacier Paradise|Klein Matterhorn/i;

describe('editorial copy (DATA-03, D-05, D-07)', () => {
  it('parses with the schema and its keys are exactly the photo ids', () => {
    const parsed = EditorialMap.parse(editorial);
    expect(Object.keys(parsed).sort()).toEqual([...ids].sort());
  });

  it('gives every photo a unique descriptive slug', () => {
    const slugs = ids.map((id) => editorial[id].slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual([
      'matterhorn-from-zermatt',
      'gornerschlucht-waterfall',
      'matterhorn-glacier-trail',
      'riffelsee-reflection',
    ]);
  });

  it('keeps stories short: at most three sentences each', () => {
    for (const id of ids) {
      const sentences = editorial[id].story.split(/[.!?](?:\s|$)/).filter((s) => s.trim());
      expect(sentences.length).toBeLessThanOrEqual(3);
    }
  });

  it('has no two stories with a word-trigram Jaccard similarity of 0.3 or more', () => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const s = jaccard(trigrams(editorial[ids[i]].story), trigrams(editorial[ids[j]].story));
        expect({ pair: `${ids[i]}/${ids[j]}`, s: s < 0.3 }).toEqual({
          pair: `${ids[i]}/${ids[j]}`,
          s: true,
        });
      }
    }
  });

  it('sources every fact with an https URL or dem, exif or Tim', () => {
    const facts = ids.flatMap((id) =>
      editorial[id].annotations.flatMap((a) => [
        ...(a.details?.facts ?? []),
        ...(a.details?.distance ? [a.details.distance] : []),
      ])
    );
    expect(facts.length).toBeGreaterThan(0);
    for (const fact of facts) expect(Fact.safeParse(fact).success).toBe(true);
    expect(Fact.safeParse({ text: 'x', source: 'http://example.com' }).success).toBe(false);
    expect(Fact.safeParse({ text: 'x', source: 'wikipedia' }).success).toBe(false);
  });

  it('never repeats the cut trivia or the wrong gorge, in the copy or in the view-model output', () => {
    expect(JSON.stringify(editorial)).not.toMatch(FORBIDDEN);
    expect(JSON.stringify(buildPhotoViews())).not.toMatch(FORBIDDEN);
    expect(read('data/photos/editorial.ts')).not.toMatch(FORBIDDEN);
    expect(read('lib/photos/view-model.ts')).not.toMatch(FORBIDDEN);
  });

  it('places img-0662 by the data, not at 2,900 to 3,100 m (D-06)', () => {
    const text = JSON.stringify(editorial['img-0662']);
    expect(text).not.toContain('2,900');
    expect(text).not.toContain('3,100');
    expect(editorial['img-0662'].story).toMatch(/Schwarzsee/);
  });

  it('keeps year and season out of the hand-written subject tags (D-08)', () => {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    for (const id of ids) {
      for (const tag of editorial[id].subjectTags) {
        expect(tag).not.toMatch(/\d/);
        expect(seasons).not.toContain(tag);
      }
    }
  });
});

describe('photo view-model (replaces the legacy bridge, DATA-08)', () => {
  /** Every legacy path the manifest still records (-large/-thumb under /images/optimized/). */
  const legacyPaths = Object.values(imageManifest).flatMap((entry) => Object.values(entry.legacy));
  const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;
  const urls = (srcSet: string) => srcSet.split(', ').map((part) => part.split(' ')[0]);

  it('has four views in altitude order', () => {
    expect(views.map((v) => v.id)).toEqual(['img-0605', 'img-0629', 'img-0662', 'r004-011']);
  });

  it('builds stage and tile only from hashed /images/photos/ derivatives, never a legacy path', () => {
    expect(legacyPaths.length).toBeGreaterThan(0);
    for (const view of views) {
      const all = [view.tile, view.stage].flatMap((image) => [
        ...urls(image.srcSetAvif),
        ...urls(image.srcSetWebp),
        image.src,
      ]);
      for (const url of [...all, view.openerSrc]) {
        expect(url).toMatch(DERIVATIVE);
        expect(legacyPaths).not.toContain(url);
      }
    }
  });

  it('resolves every annotation elevation to the official summit or the photo DEM height', () => {
    let checked = 0;
    for (const view of views) {
      for (const a of editorial[view.id].annotations) {
        if (!a.details?.elevation) continue;
        const expected =
          a.details.elevation.kind === 'summit'
            ? terrain.summit.officialM
            : photoOf(view.id).elevation.m;
        expect(elevationMetres(a.details.elevation, view.altitudeM)).toBe(expected);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  it('derives the tags from the capture: img-0605 is 2021 and autumn, never 2024 (D-08)', () => {
    const tags = photoOf('img-0605').tags;
    expect([tags.year, tags.season]).toEqual(['2021', 'autumn']);
    expect(Object.values(tags)).not.toContain('2024');
    expect(viewOf('img-0605').years).toBe(2021);
    expect(viewOf('img-0605').rights).not.toContain('2024');
  });

  it("labels the film scan '2019' with a 'Film scan · 2019' strip line and no season (D-03)", () => {
    const scan = viewOf('r004-011');
    expect(scan.captureLabel).toBe('2019');
    expect(scan.captureLabel).toBe(formatCaptureLabel(photoOf('r004-011').capture));
    expect(scan.strip.filmLine).toBe('Film scan · 2019');
    expect(scan.strip.exifRows).toEqual([]);
    expect(photoOf('r004-011').tags).toEqual({ year: '2019', season: null });
  });

  it('formats the img-0605 strip EXIF rows from the EXIF facts', () => {
    expect(viewOf('img-0605').strip.exifRows.map((row) => row.value)).toEqual([
      'Canon EOS 6D Mark II',
      'EF24-105mm f/4L IS II USM',
      `105${NBSP}mm`,
      'f/5.6',
      `1/500${NBSP}s`,
      'ISO 100',
    ]);
  });

  it('places the waterfall in the Gornerschlucht (D-01)', () => {
    expect(viewOf('img-0629').place).toContain('Gornerschlucht');
    expect(viewOf('img-0629').title).toContain('Gornerschlucht');
  });

  it('holds no image-path literal in the view-model source', () => {
    expect(read('lib/photos/view-model.ts')).not.toContain('/images/');
  });
});
