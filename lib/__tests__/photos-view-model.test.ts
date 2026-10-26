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
