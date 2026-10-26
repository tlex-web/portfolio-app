/**
 * The photo view-model (PHOTO-03, LBOX-01, LBOX-07; D-05; 10-RESEARCH Pattern
 * 2): one order shared with buildWaypoints, manifest derivatives only, the
 * rights line per capture year, and the neighbours without wrap. Expected
 * values come from the committed data; the only literals are the copy the
 * UI-SPEC fixes.
 */
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import {
  buildPhotoViews,
  elevationMetres,
  photoBySlug,
  photoMetadata,
  photoSlugs,
  photoViews,
  stripFields,
  type PhotoViewInput,
} from '@/lib/photos/view-model';

/** A content-hashed manifest derivative: /images/photos/<name>.<10 hex>.<avif|webp>. */
const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;

const committed: PhotoViewInput = { photos, editorial, imageManifest };

describe('buildPhotoViews order (PHOTO-03)', () => {
  it('returns the photos in exactly the buildWaypoints() order', () => {
    expect(photoViews.map((v) => v.slug)).toEqual(buildWaypoints().map((w) => w.slug));
    expect(photoSlugs).toEqual([
      'matterhorn-from-zermatt',
      'gornerschlucht-waterfall',
      'matterhorn-glacier-trail',
      'riffelsee-reflection',
    ]);
  });

  it('breaks a tie in DEM height by id', () => {
    const tied = photos.map((p) =>
      p.id === 'img-0662' || p.id === 'img-0605' ? { ...p, elevation: { ...p.elevation, m: 3000 } } : p,
    );
    const views = buildPhotoViews({ ...committed, photos: tied });
    expect(views.map((v) => v.id)).toEqual(['img-0629', 'r004-011', 'img-0605', 'img-0662']);
  });

  it('throws a RangeError on an empty photo set', () => {
    expect(() => buildPhotoViews({ ...committed, photos: [] })).toThrow(RangeError);
  });

  it('throws a RangeError naming a photo without its 2560 px variant', () => {
    const entry = imageManifest['img-0605'];
    const manifest = {
      ...imageManifest,
      'img-0605': { ...entry, variants: entry.variants.filter((v) => v.longEdge !== 2560) },
    };
    expect(() => buildPhotoViews({ ...committed, imageManifest: manifest })).toThrow(
      /img-0605 has no 2560 px variant/,
    );
  });

  it('links each view to its neighbours, null at both ends (no wrap)', () => {
    expect(photoViews[0].prevSlug).toBeNull();
    expect(photoViews[photoViews.length - 1].nextSlug).toBeNull();
    photoViews.forEach((v, i) => {
      if (i > 0) expect(v.prevSlug).toBe(photoViews[i - 1].slug);
      if (i < photoViews.length - 1) expect(v.nextSlug).toBe(photoViews[i + 1].slug);
    });
  });
});

describe('photo images (D-05, T-10-03)', () => {
  const urls = (srcSet: string) => srcSet.split(', ').map((part) => part.split(' '));

  it('builds the stage from the 1024, 1600 and 2560 px hashed derivatives', () => {
    for (const v of photoViews) {
      for (const srcSet of [v.stage.srcSetAvif, v.stage.srcSetWebp]) {
        const parts = urls(srcSet);
        expect(parts.map(([, w]) => w)).toEqual(['1024w', '1600w', '2560w']);
        for (const [url] of parts) expect(url).toMatch(DERIVATIVE);
        expect(srcSet).not.toContain('/images/optimized/');
      }
      const largest = imageManifest[v.id as keyof typeof imageManifest].variants.find(
        (x) => x.longEdge === 2560,
      )!;
      expect(v.stage).toMatchObject({ width: largest.width, height: largest.height });
      expect(v.aspect).toEqual({ w: largest.width, h: largest.height });
      expect(v.stage.src).toMatch(DERIVATIVE);
      expect(v.stage.src).toContain('-1600.');
      expect(v.openerSrc).toContain('-1024.');
    }
  });

  it('builds the tile from the 640, 1024 and 1600 px hashed derivatives', () => {
    for (const v of photoViews) {
      expect(urls(v.tile.srcSetWebp).map(([, w]) => w)).toEqual(['640w', '1024w', '1600w']);
      for (const [url] of urls(v.tile.srcSetAvif)) expect(url).toMatch(DERIVATIVE);
      expect(v.tile.src).toContain('-640.');
    }
  });
});

describe('rights line (LBOX-07)', () => {
  it('carries the capture year and Tim Lui for every photo, never empty', () => {
    expect(photoViews.map((v) => [v.id, v.rights])).toEqual([
      ['img-0605', '© 2021 Tim Lui, all rights reserved'],
      ['img-0629', '© 2021 Tim Lui, all rights reserved'],
      ['img-0662', '© 2021 Tim Lui, all rights reserved'],
      ['r004-011', '© 2019 Tim Lui, all rights reserved'],
    ]);
  });
});

describe('lookup and metadata (LBOX-01)', () => {
  it('matches slugs exactly and case-sensitively', () => {
    expect(photoBySlug('matterhorn-from-zermatt')?.id).toBe('img-0605');
    expect(photoBySlug('MATTERHORN-FROM-ZERMATT')).toBeUndefined();
    expect(photoBySlug('no-such-slug')).toBeUndefined();
  });

  it('returns the title, story and canonical path for a known slug, and nothing otherwise', () => {
    const view = photoViews[1];
    expect(photoMetadata(view.slug)).toEqual({
      title: view.title,
      description: view.story,
      alternates: { canonical: `/photos/${view.slug}` },
    });
    expect(photoMetadata('no-such-slug')).toEqual({});
  });
});

describe('elevationMetres (D-17)', () => {
  it('resolves the summit to the official height and a photo ref to the photo height', () => {
    expect(elevationMetres({ kind: 'summit' }, 1617)).toBe(4478);
    expect(elevationMetres({ kind: 'photo' }, 1617)).toBe(1617);
  });
});

/** formatMetres and formatCoordinates keep units and letters on their numbers with U+00A0. */
const NBSP = '\u00a0';
const codePoints = (s: string) => Array.from(s, (c) => c.codePointAt(0));
const viewOf = (views: ReturnType<typeof buildPhotoViews>, id: string) => views.find((v) => v.id === id)!;
/** The committed photos with one photo's facts replaced, for the D-07 omission cases. */
const withPhoto = (id: string, patch: Record<string, unknown>) =>
  buildPhotoViews({ ...committed, photos: photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

describe('strip fields (D-07, LBOX-04)', () => {
  it('img-0605: place and date, six EXIF units on two lines, altitude and exact position', () => {
    const { strip } = viewOf(photoViews, 'img-0605');
    expect(strip).toEqual({
      placeDate: { place: 'Zermatt, Switzerland', date: '6 September 2021, 10:48' },
      exifRows: [
        { line: 1, term: 'Camera', value: 'Canon EOS 6D Mark II' },
        { line: 1, term: 'Lens', value: 'EF24-105mm f/4L IS II USM' },
        { line: 2, term: 'Focal length', value: `105${NBSP}mm` },
        { line: 2, term: 'Aperture', value: 'f/5.6' },
        { line: 2, term: 'Shutter speed', value: `1/500${NBSP}s` },
        { line: 2, term: 'Sensitivity', value: 'ISO 100' },
      ],
      filmLine: null,
      positionRows: [
        { term: 'Altitude', value: `1,617${NBSP}m` },
        { term: 'Position', value: `46.0150${NBSP}N 7.7414${NBSP}E` },
      ],
      approxNote: null,
    });
    expect(codePoints(strip.positionRows[1].value)).toEqual(codePoints(`46.0150${NBSP}N 7.7414${NBSP}E`));
  });

  it('r004-011: the film line instead of EXIF, and the position marked approximate with its radius', () => {
    const { strip } = viewOf(photoViews, 'r004-011');
    expect(strip).toEqual({
      placeDate: { place: 'Riffelsee, Zermatt', date: '2019' },
      exifRows: [],
      filmLine: 'Film scan · 2019',
      positionRows: [
        { term: 'Altitude', value: `2,760${NBSP}m` },
        { term: 'Position', value: `≈ 45.9837${NBSP}N 7.7623${NBSP}E` },
      ],
      approxNote: `±100${NBSP}m (approx.)`,
    });
  });

  it('keeps only the EXIF units that are present: a camera alone is one row', () => {
    const { strip } = viewOf(withPhoto('img-0605', { exif: { camera: 'Canon EOS 6D Mark II' } }), 'img-0605');
    expect(strip.exifRows).toEqual([{ line: 1, term: 'Camera', value: 'Canon EOS 6D Mark II' }]);
  });

  it('drops the shutter speed for an exposure that is not above 0 (WR-04)', () => {
    const exif = { ...photos[0].exif, exposureTimeS: 0 };
    const { strip } = viewOf(withPhoto('img-0605', { exif }), 'img-0605');
    expect(strip.exifRows.map((r) => r.term)).toEqual(['Camera', 'Lens', 'Focal length', 'Aperture', 'Sensitivity']);
  });

  it('shows no EXIF rows and no film line for a digital photo without EXIF', () => {
    const { strip } = viewOf(withPhoto('img-0605', { exif: null }), 'img-0605');
    expect(strip.exifRows).toEqual([]);
    expect(strip.filmLine).toBeNull();
  });

  it('marks an approximate position without a radius with (approx.) alone', () => {
    const position = { ...photos[3].position, radiusM: undefined };
    const { strip } = viewOf(withPhoto('r004-011', { position }), 'r004-011');
    expect(strip.approxNote).toBe('(approx.)');
    expect(strip.positionRows[1].value.startsWith('≈ ')).toBe(true);
  });

  it('drops the Position row for a view without coordinates (stripFields)', () => {
    const strip = stripFields({
      medium: 'digital',
      exif: null,
      position: null,
      place: 'Zermatt, Switzerland',
      captureLabel: '6 September 2021, 10:48',
      altitudeM: 1617,
    });
    expect(strip.positionRows).toEqual([{ term: 'Altitude', value: `1,617${NBSP}m` }]);
    expect(strip.approxNote).toBeNull();
  });

  it('never prints filler in any strip field', () => {
    for (const v of photoViews) {
      expect(v.strip).toBeDefined();
      const json = JSON.stringify(v.strip);
      for (const filler of ['—', 'undefined', 'NaN', 'unknown']) expect(json).not.toContain(filler);
    }
  });
});
