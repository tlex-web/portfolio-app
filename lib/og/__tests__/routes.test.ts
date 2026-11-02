/**
 * @jest-environment node
 */
/**
 * The per-slug Open Graph routes (SEO-02; D-14, D-15; T-12-27, T-12-28):
 * app/(site)/photos/[slug]/opengraph-image.tsx and
 * app/(site)/projects/[slug]/opengraph-image.tsx.
 *
 * Every case runs over the data (photoSlugs, the projects array), never a literal
 * slug:
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
 * - neither route exports generateStaticParams or dynamicParams: next dev
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
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { OG_SIZE, type OgFrameProps } from '@/lib/og/template';
import { photoSlugs, photoViews } from '@/lib/photos/view-model';
import * as photoRoute from '@/app/(site)/photos/[slug]/opengraph-image';
import * as projectRoute from '@/app/(site)/projects/[slug]/opengraph-image';

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
  const actual = jest.requireActual('node:fs/promises');
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

/** Every slug the data knows, with its route, for the shared cases. */
const allCards = [
  ...photoSlugs.map((slug) => ({ route: photoRoute, slug })),
  ...projects.map((p) => ({ route: projectRoute, slug: p.slug })),
];

function onlyCard(route: typeof photoRoute | typeof projectRoute, slug: string) {
  const entries = route.generateImageMetadata({ params: { slug } });
  expect(entries).toHaveLength(1);
  return entries[0];
}

beforeEach(() => readFile.mockClear());

describe('generateImageMetadata', () => {
  it.each(allCards.map((c) => [c.slug, c]))(
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

  it.each(photoViews.map((v) => [v.slug, v]))(
    "%s's alt is Tim's og.alt-photo template filled from its view",
    (slug, view) => {
      expect(onlyCard(photoRoute, slug).alt).toBe(
        `${view.title}, a photograph by ${site.name}. ${view.shortPlace}, ${view.altitudeLabel}`
      );
    }
  );

  it('the approximate photo position reads approx. in its alt', () => {
    const approximate = photoViews.filter((v) => v.approximate);
    expect(approximate.length).toBeGreaterThan(0);
    for (const view of approximate) {
      expect(onlyCard(photoRoute, view.slug).alt).toMatch(/ approx\.$/);
    }
  });

  it.each(projects.map((p) => [p.slug, p]))(
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

  it('no two slugs share an alt (SEO-02 adjacency)', () => {
    const alts = allCards.map(({ route, slug }) => onlyCard(route, slug).alt);
    expect(new Set(alts).size).toBe(alts.length);
  });
});

describe('photo route: derivatives only (T-12-27)', () => {
  it.each(photoViews.map((v) => [v.slug, v]))(
    "%s's manifest JPEG is a hashed derivative under public/, at most 2560 px",
    (_, view) => {
      const { jpeg } = manifest[view.id];
      expect(jpeg.src).toMatch(DERIVATIVE);
      expect(fs.existsSync(path.join(PUBLIC, jpeg.src))).toBe(true);
      expect(Math.max(jpeg.width, jpeg.height)).toBeLessThanOrEqual(2560);
    }
  );

  it.each(photoViews.map((v) => [v.slug, v]))(
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
  it.each(projects.map((p) => [p.slug, p]))(
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
