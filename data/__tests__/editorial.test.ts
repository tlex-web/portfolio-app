/**
 * DATA-03, DATA-04, DATA-08 (D-01, D-05..D-08): the editorial copy and the
 * legacy bridge.
 *
 * data/photos/editorial.ts holds the hand-written copy; data/landscapes.ts
 * derives the v1 `LandscapeImage[]` from it, the generated photo facts and the
 * image manifest. These tests pin the copy rules (sourced facts, no repeated
 * trivia or wrong places, stories that do not read alike) and the bridge
 * contract the v1 components and the Home LCP image depend on.
 */
import fs from 'node:fs';
import path from 'node:path';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { elevationMetres, landscapes } from '@/data/landscapes';
import { editorial } from '@/data/photos/editorial';
import { EditorialMap, Fact } from '@/data/schemas/editorial';
import { formatMetres } from '@/lib/photo-format';

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
const ids = photos.map((p) => p.id);
const byId = (id: string) => landscapes.find((l) => l.id === id)!;

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

  it('never repeats the cut trivia or the wrong gorge, in the copy or in the bridge output', () => {
    expect(JSON.stringify(editorial)).not.toMatch(FORBIDDEN);
    expect(JSON.stringify(landscapes)).not.toMatch(FORBIDDEN);
    expect(read('data/photos/editorial.ts')).not.toMatch(FORBIDDEN);
    expect(read('data/landscapes.ts')).not.toMatch(FORBIDDEN);
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

describe('legacy bridge (DATA-08, RESEARCH Pattern 5)', () => {
  it('has four entries in the generated photo order', () => {
    expect(landscapes.map((l) => l.id)).toEqual(['img-0605', 'img-0629', 'img-0662', 'r004-011']);
  });

  it('keeps the Home LCP image on the manifest legacy path', () => {
    expect(landscapes[0].src).toBe(imageManifest['img-0605'].legacy.largeWebp);
    for (const l of landscapes) {
      const legacy = imageManifest[l.id as keyof typeof imageManifest].legacy;
      expect([l.src, l.fallbackSrc, l.thumbnailSrc]).toEqual([
        legacy.largeWebp,
        legacy.largeJpg,
        legacy.thumbWebp,
      ]);
    }
  });

  it('formats every annotation elevation from the referenced number', () => {
    let checked = 0;
    for (const photo of photos) {
      const out = byId(photo.id).annotations ?? [];
      editorial[photo.id].annotations.forEach((a, i) => {
        if (!a.details?.elevation) return;
        const expected =
          a.details.elevation.kind === 'summit' ? terrain.summit.officialM : photo.elevation.m;
        expect(elevationMetres(a.details.elevation, photo)).toBe(expected);
        expect(out[i].details?.elevation).toBe(formatMetres(expected));
        checked++;
      });
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  it('derives tags: img-0605 is 2021, never 2024 (D-08)', () => {
    expect(byId('img-0605').tags).toContain('2021');
    expect(byId('img-0605').tags).not.toContain('2024');
    expect(byId('img-0605').tags.slice(0, 2)).toEqual(['2021', 'autumn']);
  });

  it('labels the film scan 2019 with no capture date and no season (D-03)', () => {
    const scan = byId('r004-011');
    expect(scan.technicalDetails.captureLabel).toBe('2019');
    expect(scan.technicalDetails.captureDate).toBeUndefined();
    expect(scan.tags[0]).toBe('2019');
    expect(scan.tags).not.toContain('autumn');
  });

  it('formats exposure from EXIF for the digital photos', () => {
    expect(byId('img-0605').technicalDetails).toEqual({
      camera: 'Canon EOS 6D Mark II',
      lens: 'EF24-105mm f/4L IS II USM',
      aperture: 'f/5.6',
      shutterSpeed: '1/500\u00a0s',
      iso: 100,
      captureLabel: '6 September 2021, 10:48',
    });
  });

  it('places the waterfall in the Gornerschlucht (D-01)', () => {
    expect(byId('img-0629').location).toContain('Gornerschlucht');
    expect(byId('img-0629').title).toContain('Gornerschlucht');
  });

  it('holds no image-path literal in the bridge source', () => {
    expect(read('data/landscapes.ts')).not.toContain('/images/');
  });
});
