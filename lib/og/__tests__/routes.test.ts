/**
 * @jest-environment node
 */
/**
 * The per-slug Open Graph routes (SEO-02; D-14, D-15; T-12-27, T-12-28):
 * app/(site)/photos/[slug]/opengraph-image.tsx,
 * app/(site)/projects/[slug]/opengraph-image.tsx and (17-07, D-12)
 * app/(site)/photos/regions/[region]/opengraph-image.tsx.
 *
 * Every case runs over the data (publishedSlugs and publishedViews, every
 * published photo since 17-05 (D-07, PHOTO-05); the projects array), never a
 * literal slug:
 * - generateImageMetadata gives each known slug exactly one 1200 x 630 PNG card
 *   whose alt is Tim's og.alt-photo / og.alt-project template filled from the
 *   data, never 'undefined' or 'NaN', and no entry for an unknown or mis-cased
 *   slug (the generated route then answers 404);
 * - two slugs never share an alt (SEO-02 adjacency);
 * - the photo route reads exactly one photo file: the manifest's 1200 px JPEG
 *   derivative under /images/photos/, which exists under public/ and is at most
 *   2560 px, never an original (T-12-27);
 * - the image functions render the variant for their own slug and reject an
 *   unknown one;
 * - the region route (17 D-12, D-13, D-14) gives each registry region one card
 *   whose alt is Tim's approved regionOgAlt, renders the 'region' variant from
 *   the cover's JPEG derivative (the only photo file read) over its own plate's
 *   hero contours, and the photo card still reads the home plate's hero SVG
 *   (contourDataUrl with no argument), so its PNG bytes are unchanged;
 * - no route exports generateStaticParams or dynamicParams: next dev
 *   (webpack) fails on a generateStaticParams beside generateImageMetadata
 *   ("Duplicate export"), and dynamicParams = false made every card a 404 under
 *   Turbopack (12-14 deviation, RESEARCH A3).
 *
 * next/og is replaced by a recorder, so the test inspects the element and options
 * the route hands to ImageResponse instead of rasterising; e2e/og.spec.ts checks
 * the served PNGs.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ReactElement } from 'react';
import { imageManifest } from '@/data/generated/image-manifest';
import { plates } from '@/data/generated/plates';
import { terrain } from '@/data/generated/terrain';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';
import { site } from '@/data/site';
import { OG_SIZE, OgFrame, type OgFrameProps } from '@/lib/og/template';
import { publishedSlugs, publishedViews, type PhotoView } from '@/lib/photos/view-model';
import {
  COUNTRY_NAME,
  regionById,
  regionCover,
  regionIds,
  regionOgAlt,
  regionPhotoViews,
} from '@/lib/regions';
import * as photoRoute from '@/app/(site)/photos/[slug]/opengraph-image';
import * as projectRoute from '@/app/(site)/projects/[slug]/opengraph-image';
import * as regionRoute from '@/app/(site)/photos/regions/[region]/opengraph-image';

jest.mock('next/og', () => ({
  ImageResponse: jest.fn().mockImplementation(function (
    this: Record<string, unknown>,
    element: unknown,
    options: unknown
  ) {
    this.element = element;
    this.options = options;
  }),
}));

jest.mock('node:fs/promises', () => {
  const actual = jest.requireActual<typeof import('node:fs/promises')>('node:fs/promises');
  return { ...actual, readFile: jest.fn(actual.readFile) };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports -- the mocked module above
const { readFile } = require('node:fs/promises') as { readFile: jest.Mock };

type Recorded = { element: ReactElement<OgFrameProps>; options: { fonts: unknown[] } };

const PUBLIC = path.join(process.cwd(), 'public');
const DERIVATIVE = /^\/images\/photos\/.+\.jpg$/;
const PHOTO_FILE = /\.(jpe?g|png|webp|avif|heic|tiff?)$/i;

const manifest = imageManifest as Readonly<
  Record<
    string,
    { width: number; height: number; jpeg: { src: string; width: number; height: number } }
  >
>;

type OgCard = { route: typeof photoRoute | typeof projectRoute; slug: string };

/** Every slug the data knows, with its route, for the shared cases. */
const allCards: OgCard[] = [
  ...publishedSlugs.map((slug) => ({ route: photoRoute, slug })),
  ...projects.map((p) => ({ route: projectRoute, slug: p.slug })),
];

function onlyCard(route: typeof photoRoute | typeof projectRoute, slug: string) {
  const entries = route.generateImageMetadata({ params: { slug } });
  expect(entries).toHaveLength(1);
  return entries[0];
}

function onlyRegionCard(id: string) {
  const entries = regionRoute.generateImageMetadata({ params: { region: id } });
  expect(entries).toHaveLength(1);
  return entries[0];
}

/** The public/-relative paths of every file read so far, '/'-joined. */
function publicReads(): string[] {
  return readFile.mock.calls.map(([file]) =>
    path.relative(PUBLIC, String(file)).split(path.sep).join('/')
  );
}

/** The SVG files read so far, public/-relative. */
const svgReads = () => publicReads().filter((f) => f.endsWith('.svg'));

/** Every string an element tree draws, depth first (OgFrame builds host elements only). */
function drawnText(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(drawnText);
  if (node && typeof node === 'object' && 'props' in node) {
    return drawnText((node as { props: { children?: unknown } }).props.children);
  }
  return [];
}

beforeEach(() => {
  readFile.mockClear();
});

describe('generateImageMetadata', () => {
  it.each<[string, OgCard]>(allCards.map((c) => [c.slug, c]))(
    '%s has one 1200 x 630 PNG card with a printable alt',
    (_, { route, slug }) => {
      const card = onlyCard(route, slug);
      expect(card.id).toBe('card');
      expect(card.size).toEqual(OG_SIZE);
      expect(card.contentType).toBe('image/png');
      expect(card.alt.trim()).not.toBe('');
      expect(card.alt).not.toMatch(/undefined|NaN|null/);
    }
  );

  it.each<[string, PhotoView]>(publishedViews.map((v) => [v.slug, v]))(
    "%s's alt is Tim's og.alt-photo template filled from its view",
    (slug, view) => {
      expect(onlyCard(photoRoute, slug).alt).toBe(
        `${view.title}, a photograph by ${site.name}. ${view.shortPlace}, ${view.altitudeLabel}`
      );
    }
  );

  it('the approximate photo position reads approx. in its alt', () => {
    const approximate = publishedViews.filter((v) => v.approximate);
    expect(approximate.length).toBeGreaterThan(0);
    for (const view of approximate) {
      expect(onlyCard(photoRoute, view.slug).alt).toMatch(/ approx\.$/);
    }
  });

  it.each<[string, Project]>(projects.map((p) => [p.slug, p]))(
    "%s's alt is Tim's og.alt-project template, '{name}: {pitch}'",
    (slug, project) => {
      expect(onlyCard(projectRoute, slug).alt).toBe(
        project.pitch ? `${project.name}: ${project.pitch}` : project.name
      );
    }
  );

  it('an unknown or mis-cased slug has no card', () => {
    for (const { route, slug } of allCards) {
      expect(route.generateImageMetadata({ params: { slug: slug.toUpperCase() } })).toEqual([]);
    }
    expect(photoRoute.generateImageMetadata({ params: { slug: 'not-a-photo' } })).toEqual([]);
    expect(projectRoute.generateImageMetadata({ params: { slug: 'not-a-project' } })).toEqual([]);
  });

  it('no two slugs or regions share an alt (SEO-02 adjacency)', () => {
    const alts = [
      ...allCards.map(({ route, slug }) => onlyCard(route, slug).alt),
      ...regionIds.map((id) => onlyRegionCard(id).alt),
    ];
    expect(new Set(alts).size).toBe(alts.length);
  });
});

describe('region route: generateImageMetadata (17 D-12, D-14)', () => {
  it('covers every registry region', () => {
    expect(regionIds.length).toBeGreaterThan(0);
  });

  it.each(regionIds.map((id) => [id]))(
    "%s has one 1200 x 630 PNG card whose alt is Tim's approved regionOgAlt",
    (id) => {
      const card = onlyRegionCard(id);
      expect(card.id).toBe('card');
      expect(card.size).toEqual(OG_SIZE);
      expect(card.contentType).toBe('image/png');
      expect(card.alt).toBe(regionOgAlt(id));
      expect(card.alt).not.toMatch(/undefined|NaN|null/);
    }
  );

  it('an unknown or mis-cased region has no card', () => {
    expect(regionRoute.generateImageMetadata({ params: { region: 'nowhere' } })).toEqual([]);
    expect(regionRoute.generateImageMetadata({ params: { region: 'Zermatt' } })).toEqual([]);
  });
});

describe("region route: the cover's derivative over the region's own plate (17 D-12, D-13; T-17-15)", () => {
  it.each(regionIds.map((id) => [id]))(
    "%s renders the region variant from its cover's JPEG derivative and its plate's hero contours",
    async (id) => {
      const region = regionById(id);
      if (!region) throw new Error(`routes.test: ${id} is not a registry region`);
      const response = (await regionRoute.default({
        params: Promise.resolve({ region: id }),
      })) as unknown as Recorded;

      const cover = regionCover(id);
      expect(cover.id).toBe(region.cover);
      const { jpeg } = manifest[cover.id];
      expect(jpeg.src).toMatch(DERIVATIVE);
      expect(publicReads().filter((f) => PHOTO_FILE.test(f))).toEqual([
        jpeg.src.replace(/^\//, ''),
      ]);
      const hero = (plates as Record<string, { assets: { contours: { hero: string } } }>)[
        region.plate
      ].assets.contours.hero;
      expect(svgReads()).toEqual([hero.replace(/^\//, '')]);

      expect(response.element.type).toBe(OgFrame);
      const props = response.element.props;
      expect(props.variant).toBe('region');
      if (props.variant !== 'region') return;
      expect(props.contour).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(props.photo.src).toMatch(/^data:image\/jpeg;base64,/);
      expect({ width: props.photo.width, height: props.photo.height }).toEqual({
        width: jpeg.width,
        height: jpeg.height,
      });
      expect(response.options.fonts).toHaveLength(3);

      // The plate prints the name, the country, the count and range, then the rights line.
      const n = regionPhotoViews(id).length;
      expect(props.name).toBe(region.name);
      expect(props.country).toBe(COUNTRY_NAME[region.country]);
      expect(props.facts.count).toBe(`${n} ${n === 1 ? 'photograph' : 'photographs'}`);
      expect(regionOgAlt(id).endsWith(`, ${props.facts.range}`)).toBe(true);
      expect(drawnText(OgFrame(props))).toEqual([
        region.name,
        COUNTRY_NAME[region.country],
        props.facts.count,
        props.facts.range,
        `© ${props.facts.years} ${site.name}`,
      ]);
    }
  );

  it("an all-aerial region's range reads 'ground {range}', as in its approved alt", async () => {
    const aerial = regionIds.filter((id) => regionPhotoViews(id).every((v) => v.aerial));
    expect(aerial.length).toBeGreaterThan(0);
    for (const id of aerial) {
      const response = (await regionRoute.default({
        params: Promise.resolve({ region: id }),
      })) as unknown as Recorded;
      const props = response.element.props;
      if (props.variant !== 'region') throw new Error('expected the region variant');
      expect(props.facts.range).toMatch(/^ground\u00a0/);
    }
  });

  it('rejects an unknown or mis-cased region', async () => {
    await expect(
      regionRoute.default({ params: Promise.resolve({ region: 'nowhere' }) })
    ).rejects.toThrow();
    await expect(
      regionRoute.default({ params: Promise.resolve({ region: 'Zermatt' }) })
    ).rejects.toThrow();
  });

  it("a photo card still reads the home plate's hero contours (contourDataUrl() with no argument)", async () => {
    await photoRoute.default({ params: Promise.resolve({ slug: publishedSlugs[0] }) });
    expect(svgReads()).toEqual([terrain.assets.contours.hero.replace(/^\//, '')]);
  });
});

describe('photo route: derivatives only (T-12-27)', () => {
  it.each<[string, PhotoView]>(publishedViews.map((v) => [v.slug, v]))(
    "%s's manifest JPEG is a hashed derivative under public/, at most 2560 px",
    (_, view) => {
      const { jpeg } = manifest[view.id];
      expect(jpeg.src).toMatch(DERIVATIVE);
      expect(fs.existsSync(path.join(PUBLIC, jpeg.src))).toBe(true);
      expect(Math.max(jpeg.width, jpeg.height)).toBeLessThanOrEqual(2560);
    }
  );

  it.each<[string, PhotoView]>(publishedViews.map((v) => [v.slug, v]))(
    '%s renders the photo variant from its JPEG derivative and reads no other photo file',
    async (slug, view) => {
      const response = (await photoRoute.default({
        params: Promise.resolve({ slug }),
      })) as unknown as Recorded;

      const { jpeg } = manifest[view.id];
      const photoReads = readFile.mock.calls
        .map(([file]) => path.relative(PUBLIC, String(file)).split(path.sep).join('/'))
        .filter((file) => PHOTO_FILE.test(file));
      expect(photoReads).toEqual([jpeg.src.replace(/^\//, '')]);

      const props = response.element.props;
      expect(props.variant).toBe('photo');
      if (props.variant !== 'photo') return;
      expect(props.view.slug).toBe(slug);
      expect(props.photo.src).toMatch(/^data:image\/jpeg;base64,/);
      expect({ width: props.photo.width, height: props.photo.height }).toEqual({
        width: jpeg.width,
        height: jpeg.height,
      });
      expect(response.options.fonts).toHaveLength(3);
    }
  );

  it('rejects an unknown slug', async () => {
    await expect(
      photoRoute.default({ params: Promise.resolve({ slug: 'not-a-photo' }) })
    ).rejects.toThrow();
  });
});

describe('project route', () => {
  it.each<[string, Project]>(projects.map((p) => [p.slug, p]))(
    '%s renders the project variant for its own project, with no photo read',
    async (slug, project) => {
      const response = (await projectRoute.default({
        params: Promise.resolve({ slug }),
      })) as unknown as Recorded;

      const props = response.element.props;
      expect(props.variant).toBe('project');
      if (props.variant !== 'project') return;
      expect(props.project).toBe(project);
      expect(
        readFile.mock.calls.map(([file]) => String(file)).filter((f) => PHOTO_FILE.test(f))
      ).toEqual([]);
    }
  );

  it('rejects an unknown slug', async () => {
    await expect(
      projectRoute.default({ params: Promise.resolve({ slug: 'not-a-project' }) })
    ).rejects.toThrow();
  });
});

describe('route exports', () => {
  it.each([
    ['photos', photoRoute as Record<string, unknown>],
    ['projects', projectRoute as Record<string, unknown>],
    ['photos/regions', regionRoute as Record<string, unknown>],
  ])(
    '%s exports size, contentType and generateImageMetadata, never generateStaticParams or dynamicParams',
    (_, route) => {
      expect(route.size).toEqual(OG_SIZE);
      expect(route.contentType).toBe('image/png');
      expect(typeof route.generateImageMetadata).toBe('function');
      expect(route).not.toHaveProperty('generateStaticParams');
      expect(route).not.toHaveProperty('dynamicParams');
    }
  );
});
