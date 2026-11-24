/**
 * @jest-environment node
 */
/**
 * JSON-LD (SEO-04; 17 D-16, D-17, D-18, D-20, D-21). The Wave 0 test every later
 * JSON-LD block extends (17-13 photo and region pages, 17-14 case studies).
 *
 * - jsonLdHtml is the one serializer: it escapes every '<' as \u003c, changes no
 *   other character, and JSON.parse of its output returns the original data. A
 *   fixture name holding a </script><script> breakout round-trips with no raw '<'
 *   and stays inside one ld+json block (T-17-06).
 * - siteGraph is a schema.org Graph with one Person and one WebSite. The Person
 *   holds name, role, site URL and the two profile links only (D-20, T-17-07).
 *   The WebSite refers to the Person by @id, credits site.name (D-18) and carries
 *   the footer's printed rights line as its copyrightNotice (D-16, D-17).
 * - Per-node rule (D-16, Person exemption): every node that is not a Person has
 *   non-empty creator, copyrightNotice and creditText; the Person has none of the
 *   three, because schema.org defines them on CreativeWork and a Person is not a
 *   CreativeWork.
 * - No JSON-LD object at any depth carries license or acquireLicensePage (the
 *   2026-11-12 decision), email, address or homeLocation; the serialized text holds
 *   neither site.email nor site.location.name.
 * - Source assertions: both JSON-LD modules (lib/json-ld/site.ts and
 *   lib/json-ld/content.ts) import schema-dts through `import type` only (D-21,
 *   0 runtime bytes), and the (site) layout renders a native data block with no
 *   nonce attribute and no next/script (D-16, T-17-08). The site module, the
 *   only one the (site) layout imports, reaches no region or photo model through
 *   any chain of value imports (17-REVIEW WR-01).
 *
 * - photoImageLd (17-13; SEO-04, D-16..D-19): every published photo page carries
 *   one ImageObject whose every text equals what the page prints (title, alt,
 *   rights, place, the strip's Position digits), whose coordinates are strings
 *   at exactly the position's own precision, and whose dateCreated is no finer
 *   than the capture label. Expected values come from the data, never typed in.
 *   An approximate position with a radius is a GeoCircle (geoMidpoint the same
 *   coordinates, geoRadius the strip's radius); an exact one, or an approximate
 *   one with no radius, is plain GeoCoordinates (17-REVIEW IN-02).
 *
 * - regionGalleryLd (17-14; SEO-04, D-16, D-17): every region page carries one
 *   ImageGallery at its own URL, named by the printed heading, described by the
 *   approved description, listing the photos' #image @ids in the page's link
 *   order, and holding the printed region rights line as its copyrightNotice.
 * - projectLd (17-14): box is SoftwareSourceCode with its public repository;
 *   coin-flip is SoftwareApplication with no codeRepository key at all (its
 *   repository is private, 11 D-23, T-17-29). Both carry caseStudyRights(slug),
 *   which is Tim's 17-01 option (a): the footer line, siteRights().
 * - No block built here holds BreadcrumbList (it waits for Phase 18's visible
 *   breadcrumb), license or acquireLicensePage.
 *
 * keysDeep and blocksOf are the helpers 17-13 and 17-14 reuse in this file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import {
  caseStudyRights,
  photoImageId,
  photoImageLd,
  photoLdFacts,
  projectLd,
  regionGalleryLd,
  type PhotoLdFacts,
} from '@/lib/json-ld/content';
import {
  PERSON_ID,
  WEBSITE_ID,
  jsonLdHtml,
  personRef,
  siteGraph,
  siteRights,
} from '@/lib/json-ld/site';
import { photoHref, regionHref } from '@/lib/photos/routes';
import { siteRights as footerRights } from '@/lib/site-rights';
import { publishedViews, type PhotoView } from '@/lib/photos/view-model';
import {
  regionById,
  regionDescription,
  regionHeading,
  regionIds,
  regionPhotoViews,
  regionRights,
} from '@/lib/regions';

type Node = Record<string, unknown>;

/** Every object key at any depth (arrays are walked, their indices are not keys). */
export function keysDeep(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => keysDeep(item));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Node).flatMap(([key, child]) => [key, ...keysDeep(child)]);
  }
  return [];
}

/** The parsed body of every <script type="application/ld+json"> in an HTML string. */
export function blocksOf(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script\b[^>]*\btype="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  for (const match of html.matchAll(pattern)) blocks.push(JSON.parse(match[1]));
  return blocks;
}

const BREAKOUT = '</script><script>alert(1)</script>';
const fixture = { '@context': 'https://schema.org', '@type': 'Person', name: BREAKOUT } as const;

function graphNodes(): Node[] {
  return siteGraph()['@graph'] as unknown as Node[];
}

function nodeOfType(type: string): Node {
  const nodes = graphNodes().filter((node) => node['@type'] === type);
  expect(nodes).toHaveLength(1);
  return nodes[0];
}

const read = (...segments: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...segments), 'utf8');

/** Every JSON-LD source module, repo-relative (17-REVIEW WR-01 split them in two). */
const JSON_LD_SOURCES = ['lib/json-ld/site.ts', 'lib/json-ld/content.ts'] as const;
const sourceRows = JSON_LD_SOURCES.map((file) => [file] as const);

/**
 * The repo files a module reaches through value imports and re-exports, itself
 * included, walked breadth first. `import type` statements and lists whose every
 * specifier is `type` are skipped; `@/` and relative specifiers resolve as
 * .ts, .tsx, an exact file (.json) or /index.ts; package imports are leaves. An
 * unresolvable local import throws, so a broken walk cannot pass vacuously.
 */
function valueImportGraph(entry: string): string[] {
  const exists = (rel: string) => {
    const abs = path.join(process.cwd(), rel);
    return fs.existsSync(abs) && fs.statSync(abs).isFile();
  };
  const seen = new Set<string>([entry]);
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (!/\.tsx?$/.test(file)) continue;
    const text = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/.*$/gm, '');
    // `import … from`, `export … from` and side-effect `import '…'`.
    for (const [, typeOnly, clause, spec] of text.matchAll(
      /^(?:import|export)\s+(type\s+)?(?:([^;'"]*?)\s*from\s*)?'([^']+)';/gm
    )) {
      if (typeOnly) continue;
      const names = /^\{([^}]*)\}$/
        .exec(clause?.trim() ?? '')?.[1]
        .split(',')
        .map((n) => n.trim());
      if (names && names.filter(Boolean).every((n) => /^type\s/.test(n))) continue;
      let base: string;
      if (spec.startsWith('@/')) base = spec.slice(2);
      else if (spec.startsWith('.')) base = path.posix.join(path.posix.dirname(file), spec);
      else continue;
      const target = [`${base}.ts`, `${base}.tsx`, base, `${base}/index.ts`].find(exists);
      if (!target) throw new Error(`${file} imports '${spec}', which resolves to no file`);
      if (!seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return [...seen].sort();
}

describe('jsonLdHtml, the one serializer (D-16, T-17-06)', () => {
  it.each([
    ['the </script> breakout fixture', fixture],
    ['siteGraph()', siteGraph()],
  ])('escapes every "<" in %s and parses back to the same data', (_label, data) => {
    const html = jsonLdHtml(data);
    expect(html).not.toContain('<');
    expect(JSON.parse(html)).toEqual(data);
  });

  it('changes no character except "<" (to \\u003c)', () => {
    const html = jsonLdHtml(fixture);
    expect(html).toContain('\\u003c/script>');
    expect(html.replace(/\\u003c/g, '<')).toBe(JSON.stringify(fixture));
  });

  it('keeps the breakout inside one ld+json block in the page HTML', () => {
    const page = `<body><script type="application/ld+json">${jsonLdHtml(fixture)}</script><p>after</p></body>`;
    const blocks = blocksOf(page);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(fixture);
    expect((blocks[0] as Node).name).toBe(BREAKOUT);
  });
});

describe('siteGraph: the site-wide Person and WebSite (D-16, D-18, D-20)', () => {
  it('is a schema.org Graph with exactly one Person and one WebSite', () => {
    const graph = siteGraph();
    expect(graph['@context']).toBe('https://schema.org');
    expect(
      graphNodes()
        .map((node) => node['@type'])
        .sort()
    ).toEqual(['Person', 'WebSite']);
  });

  it('describes the Person by name, role, site and the two profiles only', () => {
    expect(nodeOfType('Person')).toEqual({
      '@type': 'Person',
      '@id': PERSON_ID,
      name: site.name,
      jobTitle: site.role,
      url: site.url,
      sameAs: [site.links.github, site.links.linkedin],
    });
    expect(PERSON_ID).toBe(site.url + '/#person');
  });

  it('names the WebSite and refers its author and creator to the Person by @id', () => {
    const website = nodeOfType('WebSite');
    expect(website['@id']).toBe(WEBSITE_ID);
    expect(WEBSITE_ID).toBe(site.url + '/#website');
    expect(website.name).toBe(site.name);
    expect(website.url).toBe(site.url);
    expect(website.author).toEqual({ '@id': PERSON_ID });
    expect(website.creator).toEqual({ '@id': PERSON_ID });
  });

  it("credits the WebSite to the Person's name, which is site.name (D-18)", () => {
    const website = nodeOfType('WebSite');
    expect(website.creditText).toBe(nodeOfType('Person').name);
    expect(website.creditText).toBe(site.name);
  });

  it('carries the footer rights line as the copyrightNotice (D-16, D-17)', () => {
    const footerLine = '© ' + new Date().getFullYear() + ' ' + site.name + '. All rights reserved.';
    expect(siteRights()).toBe(footerLine);
    expect(nodeOfType('WebSite').copyrightNotice).toBe(footerLine);
  });

  it('takes the rights line from the one definition the footer prints (17-REVIEW IN-04)', () => {
    expect(siteRights).toBe(footerRights);
    const footer = read('components', 'site', 'SiteFooter.tsx');
    expect(footer).toContain("from '@/lib/site-rights';");
    expect(footer).toContain('{siteRightsParts()}');
    expect(footer).not.toContain('All rights reserved');
  });
});

describe('per-node rule: creator, copyrightNotice and creditText (D-16, Person exemption)', () => {
  const RIGHTS_KEYS = ['creator', 'copyrightNotice', 'creditText'] as const;

  it('has at least one non-Person node to check', () => {
    expect(graphNodes().filter((node) => node['@type'] !== 'Person').length).toBeGreaterThan(0);
  });

  it.each(RIGHTS_KEYS.map((key) => [key]))('every non-Person node has a non-empty %s', (key) => {
    for (const node of graphNodes().filter((n) => n['@type'] !== 'Person')) {
      const value = node[key];
      expect(value).toBeTruthy();
      if (typeof value === 'string') expect(value.trim()).not.toBe('');
    }
  });

  it.each(RIGHTS_KEYS.map((key) => [key]))(
    'the Person node has no %s (not a CreativeWork)',
    (key) => {
      expect(Object.keys(nodeOfType('Person'))).not.toContain(key);
    }
  );
});

describe('disclosure: no license, no email, no location (D-20, the 2026-11-12 decision)', () => {
  it.each(
    ['license', 'acquireLicensePage', 'email', 'address', 'homeLocation'].map((key) => [key])
  )('siteGraph holds no %s key at any depth', (key) => {
    expect(keysDeep(siteGraph())).not.toContain(key);
  });

  it('keysDeep finds a key nested in an array (the walk reaches every depth)', () => {
    expect(keysDeep({ a: [{ b: { license: 'x' } }] })).toEqual(['a', 'b', 'license']);
  });

  it('serializes neither site.email nor site.location.name', () => {
    const html = jsonLdHtml(siteGraph());
    expect(html).not.toContain(site.email);
    expect(html).not.toContain(site.location.name);
  });
});

describe('source rules (D-16, D-21)', () => {
  it.each(sourceRows)('%s imports schema-dts through import type only', (file) => {
    // Whole import statements, so a list prettier wraps over several lines still counts.
    const source = read(file);
    const statements = source.match(/^import\b[^;]*;/gm) ?? [];
    const fromSchema = statements.filter((s) => /from 'schema-dts';$/.test(s));
    expect(fromSchema.length).toBeGreaterThan(0);
    expect(fromSchema.filter((s) => !/^import type\b/.test(s))).toEqual([]);
    expect(source.split('\n').filter((line) => /^import (?!type).*schema-dts/.test(line))).toEqual(
      []
    );
  });

  it('the (site) layout imports the site module alone, which reaches no region or photo model (17-REVIEW WR-01)', () => {
    const layout = read('app', '(site)', 'layout.tsx');
    expect(layout).toContain("from '@/lib/json-ld/site';");
    expect(layout).not.toMatch(/from '@\/lib\/(?:json-ld\/content|regions)'/);

    const reached = valueImportGraph('lib/json-ld/site.ts');
    expect(reached).toContain('data/site.ts');
    const model = reached.filter(
      (f) =>
        f === 'lib/regions.ts' ||
        f === 'lib/json-ld/content.ts' ||
        f.startsWith('lib/photos/') ||
        f.startsWith('data/generated/') ||
        f.startsWith('data/regions/')
    );
    expect(model).toEqual([]);
  });

  it('the same walk reaches the region and photo model from the content module (not vacuous)', () => {
    const reached = valueImportGraph('lib/json-ld/content.ts');
    for (const file of [
      'lib/json-ld/site.ts',
      'lib/regions.ts',
      'lib/photos/view-model.ts',
      'data/generated/photos.ts',
      'data/generated/image-manifest.ts',
      'data/regions/regions.json',
    ]) {
      expect(reached).toContain(file);
    }
  });

  it('renders the site graph in the (site) layout as a native data block with no nonce and no next/script', () => {
    const layout = read('app', '(site)', 'layout.tsx');
    expect(layout).toContain('type="application/ld+json"');
    expect(layout).toContain('jsonLdHtml(siteGraph())');
    expect(layout).not.toMatch(/\bnonce\s*=/);
    expect(layout).not.toMatch(/from ['"]next\/script['"]/);
  });
});

/** An ImageObject block as JSON.parse returns it from jsonLdHtml. */
type ImageBlock = {
  '@context': string;
  '@type': string;
  '@id': string;
  url: string;
  mainEntityOfPage: string;
  contentUrl: string;
  width: unknown;
  height: unknown;
  name: string;
  caption: string;
  creator: Node;
  creditText: string;
  copyrightNotice: string;
  dateCreated: string;
  contentLocation: {
    '@type': string;
    name: string;
    geo?: Coordinates | { '@type': string; geoMidpoint: Coordinates; geoRadius: unknown };
  };
};

/** A GeoCoordinates node as JSON.parse returns it. */
type Coordinates = { '@type': string; latitude: string; longitude: string };

type ManifestVariant = { longEdge: number; width: number; height: number; webp: string };

/** The decimals each generated position precision prints at (16 D-01). */
const PRECISION_DECIMALS = { '4dp': 4, '3dp': 3, '2dp': 2 } as const;

const generated = (id: string) => {
  const photo = photos.find((p) => p.id === id);
  if (!photo) throw new Error(`no generated photo ${id}`);
  return photo;
};

const variant2560 = (id: string): ManifestVariant => {
  const manifest = imageManifest as Readonly<
    Record<string, { variants: readonly ManifestVariant[] } | undefined>
  >;
  const found = manifest[id]?.variants.find((v) => v.longEdge === 2560);
  if (!found) throw new Error(`no 2560 px variant for ${id}`);
  return found;
};

const parseBlock = (html: string) => JSON.parse(html) as ImageBlock;
const blockOf = (view: PhotoView) => parseBlock(jsonLdHtml(photoImageLd(view)));

/** The strip's Position value with the '≈ ' marker and the U+00A0 before each letter removed. */
function stripPosition(view: PhotoView): string {
  const row = view.strip.positionRows.find((r) => r.term === 'Position');
  if (!row) throw new Error(`${view.slug} has no Position row`);
  return row.value.replace(/^≈ /, '').replace(/ /g, '');
}

/**
 * The radius the strip's approx note prints ('±1,200 m (approx.)'), in metres,
 * or null when it prints none (an exact position, or '(approx.)' alone).
 */
function stripRadiusM(view: PhotoView): number | null {
  const match = /^±([\d,]+) m \(approx\.\)$/.exec(view.strip.approxNote ?? '');
  return match ? Number(match[1].replace(/,/g, '')) : null;
}

/** A JSON-LD coordinate pair joined as the strip prints it, hemisphere letters by sign. */
function joinedGeo(latitude: string, longitude: string): string {
  const half = (v: string, pos: string, neg: string) =>
    v.startsWith('-') ? `${v.slice(1)}${neg}` : `${v}${pos}`;
  return `${half(latitude, 'N', 'S')} ${half(longitude, 'E', 'W')}`;
}

const viewRows = publishedViews.map((view) => [view.slug, view] as const);
const located = publishedViews.filter((view) => generated(view.id).position !== null);
const locatedRows = located.map((view) => [view.slug, view] as const);

describe('photoImageLd: the ImageObject on every photo page (SEO-04; D-16, D-17, D-18)', () => {
  it('runs over the whole published set', () => {
    expect(publishedViews.length).toBeGreaterThan(0);
  });

  it.each(viewRows)('%s round-trips through jsonLdHtml with no raw "<"', (_slug, view) => {
    const ld = photoImageLd(view);
    const html = jsonLdHtml(ld);
    expect(html).not.toContain('<');
    expect(JSON.parse(html)).toEqual(ld);
  });

  it.each(viewRows)('%s names its page, image file and size', (_slug, view) => {
    const block = blockOf(view);
    const pageUrl = `${site.url}${photoHref(view.slug)}`;
    const largest = variant2560(view.id);
    expect(block['@context']).toBe('https://schema.org');
    expect(block['@type']).toBe('ImageObject');
    expect(block['@id']).toBe(`${pageUrl}#image`);
    expect(photoImageId(view.slug)).toBe(`${pageUrl}#image`);
    expect(block.url).toBe(pageUrl);
    expect(block.mainEntityOfPage).toBe(pageUrl);
    expect(block.contentUrl.startsWith(site.url + '/')).toBe(true);
    expect(block.contentUrl).toBe(`${site.url}${largest.webp}`);
    expect(block.contentUrl.endsWith('.webp')).toBe(true);
    const size = (value: number) => ({ '@type': 'QuantitativeValue', value, unitCode: 'E37' });
    expect(block.width).toEqual(size(largest.width));
    expect(block.height).toEqual(size(largest.height));
  });

  it.each(viewRows)('%s prints the title, alt text and rights as the page does', (_slug, view) => {
    const block = blockOf(view);
    expect(block.name).toBe(view.title);
    expect(block.caption).toBe(view.alt);
    expect(block.copyrightNotice).toBe(view.rights);
  });

  it.each(viewRows)('%s credits the Person inline by @id, name and site (D-18)', (_slug, view) => {
    const block = blockOf(view);
    expect(personRef()).toEqual({
      '@type': 'Person',
      '@id': PERSON_ID,
      name: site.name,
      url: site.url,
    });
    expect(block.creator).toEqual(personRef());
    expect(block.creditText).toBe(block.creator.name);
    expect(block.creditText).toBe(site.name);
  });

  it.each(viewRows)('%s has no license, elevation, email or address key', (_slug, view) => {
    const keys = keysDeep(blockOf(view));
    for (const key of ['license', 'acquireLicensePage', 'elevation', 'email', 'address']) {
      expect(keys).not.toContain(key);
    }
  });
});

describe('photoImageLd location: never finer than the page (D-19, T-17-25)', () => {
  it('has located photos to check', () => {
    expect(located.length).toBeGreaterThan(0);
  });

  it.each(locatedRows)(
    '%s names the printed place and carries the strip Position digits as strings at the position precision',
    (_slug, view) => {
      const position = generated(view.id).position;
      if (!position) throw new Error('filtered to located views');
      const { contentLocation } = blockOf(view);
      expect(contentLocation['@type']).toBe('Place');
      expect(contentLocation.name).toBe(view.place);
      expect(contentLocation.name).toBe(view.strip.placeDate.place);

      const geo = contentLocation.geo;
      if (!geo) throw new Error(`${view.slug} has no geo`);
      const radiusM = stripRadiusM(view);
      let coordinates: Coordinates;
      if (radiusM === null) {
        coordinates = geo as Coordinates;
      } else {
        // An approximate position the strip qualifies with a radius (17-REVIEW IN-02).
        expect(position.approximate).toBe(true);
        expect(Object.keys(geo).sort()).toEqual(['@type', 'geoMidpoint', 'geoRadius']);
        expect(geo['@type']).toBe('GeoCircle');
        expect('geoRadius' in geo && geo.geoRadius).toBe(radiusM);
        coordinates = (geo as { geoMidpoint: Coordinates }).geoMidpoint;
      }
      expect(Object.keys(coordinates).sort()).toEqual(['@type', 'latitude', 'longitude']);
      expect(coordinates['@type']).toBe('GeoCoordinates');
      expect(typeof coordinates.latitude).toBe('string');
      expect(typeof coordinates.longitude).toBe('string');

      const decimals = PRECISION_DECIMALS[position.precision];
      const shape = new RegExp(`^-?\\d+\\.\\d{${decimals}}$`);
      expect(coordinates.latitude).toMatch(shape);
      expect(coordinates.longitude).toMatch(shape);
      expect(joinedGeo(coordinates.latitude, coordinates.longitude)).toBe(stripPosition(view));
    }
  );

  it('the published set has both an exact position and an approximate one with a radius', () => {
    const kinds = new Set(
      located.map((view) => (stripRadiusM(view) === null ? 'GeoCoordinates' : 'GeoCircle'))
    );
    expect(kinds).toEqual(new Set(['GeoCoordinates', 'GeoCircle']));
    for (const view of located) {
      const geoType = blockOf(view).contentLocation.geo?.['@type'];
      expect(geoType).toBe(
        generated(view.id).position?.approximate ? 'GeoCircle' : 'GeoCoordinates'
      );
    }
  });

  it.each(locatedRows)(
    '%s never serializes a stored coordinate finer than its precision',
    (_slug, view) => {
      const position = generated(view.id).position;
      if (!position) throw new Error('filtered to located views');
      const html = jsonLdHtml(photoImageLd(view));
      const decimals = PRECISION_DECIMALS[position.precision];
      for (const v of [position.lat, position.lon]) {
        const stored = String(v);
        if ((stored.split('.')[1] ?? '').length > decimals) expect(html).not.toContain(stored);
      }
    }
  );
});

describe('photoImageLd dateCreated: no finer than the capture label (RESEARCH OQ3, T-17-26)', () => {
  it('has both an EXIF capture and a year-only scan in the published set', () => {
    const kinds = new Set(publishedViews.map((view) => generated(view.id).capture.precision));
    expect(kinds).toEqual(new Set(['second', 'year']));
  });

  it.each(viewRows)('%s dateCreated is minute-and-offset or the year alone', (_slug, view) => {
    const capture = generated(view.id).capture;
    const { dateCreated } = blockOf(view);
    if (capture.precision === 'second') {
      expect(dateCreated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
      expect(dateCreated).toBe(`${capture.local.slice(0, 16)}${capture.offset}`);
    } else {
      expect(dateCreated).toMatch(/^\d{4}$/);
      expect(dateCreated).toBe(String(capture.year));
    }
  });
});

describe('photoImageLd edges: empty facts and editorial text (SEO-04)', () => {
  const sample = publishedViews[0];

  it('a view without a position names the place only: no geo, no placeholder', () => {
    const block = parseBlock(
      jsonLdHtml(photoImageLd(sample, { ...photoLdFacts(sample.id), position: null }))
    );
    expect(block.contentLocation).toEqual({ '@type': 'Place', name: sample.place });
    const keys = keysDeep(block);
    for (const key of ['geo', 'latitude', 'longitude']) expect(keys).not.toContain(key);
  });

  describe('approximate positions (17-REVIEW IN-02: GeoCircle with radius, Tim 2026-11-24)', () => {
    // Synthetic coordinates, never a real photo's (Phase 16 D-25).
    const at = { lat: 10.5, lon: -20.25, precision: '2dp' } as const;
    const geoOf = (position: NonNullable<PhotoLdFacts['position']>) =>
      parseBlock(jsonLdHtml(photoImageLd(sample, { ...photoLdFacts(sample.id), position })))
        .contentLocation.geo;
    const coordinates = { '@type': 'GeoCoordinates', latitude: '10.50', longitude: '-20.25' };

    it('an exact position is plain GeoCoordinates', () => {
      expect(geoOf({ ...at, approximate: false })).toEqual(coordinates);
      expect(geoOf({ ...at, approximate: false, radiusM: 500 })).toEqual(coordinates);
    });

    it('an approximate position with a radius is a GeoCircle of the same rounded coordinates', () => {
      expect(geoOf({ ...at, approximate: true, radiusM: 250 })).toEqual({
        '@type': 'GeoCircle',
        geoMidpoint: coordinates,
        geoRadius: 250,
      });
    });

    it('the radius is whole metres, as the strip prints it', () => {
      expect(geoOf({ ...at, approximate: true, radiusM: 99.6 })).toMatchObject({
        geoRadius: 100,
      });
    });

    it.each([
      ['no radius', undefined],
      ['a zero radius', 0],
      ['a non-finite radius', Number.NaN],
    ])('an approximate position with %s stays plain GeoCoordinates', (_label, radiusM) => {
      expect(geoOf({ ...at, approximate: true, radiusM })).toEqual(coordinates);
    });
  });

  it('a capture without an EXIF time gives the year form', () => {
    const facts = {
      ...photoLdFacts(sample.id),
      capture: { precision: 'year', year: 2019 },
    } as const;
    expect(parseBlock(jsonLdHtml(photoImageLd(sample, facts))).dateCreated).toBe('2019');
  });

  it('escapes editorial "<" as \\u003c and keeps the text inside one block', () => {
    const view: PhotoView = { ...sample, title: 'Peaks <after> rain', alt: BREAKOUT };
    const html = jsonLdHtml(photoImageLd(view));
    expect(html).not.toContain('<');
    expect(html).toContain('\\u003cafter>');
    const blocks = blocksOf(`<script type="application/ld+json">${html}</script><p>after</p>`);
    expect(blocks).toHaveLength(1);
    expect((blocks[0] as Node).name).toBe('Peaks <after> rain');
    expect((blocks[0] as Node).caption).toBe(BREAKOUT);
  });

  it('photoLdFacts throws for an unknown photo rather than inventing facts', () => {
    expect(() => photoLdFacts('no-such-photo')).toThrow(RangeError);
  });
});

describe('photo page source rules (D-16, anti-pattern 9)', () => {
  it('renders the ImageObject on the full photo page as a native data block', () => {
    const page = read('app', '(site)', 'photos', '[slug]', 'page.tsx');
    expect(page).toContain('type="application/ld+json"');
    expect(page).toContain('jsonLdHtml(photoImageLd(view))');
    expect(page).not.toMatch(/\bnonce\s*=/);
    expect(page).not.toMatch(/from ['"]next\/script['"]/);
  });

  it('keeps the intercepted @modal photo page free of JSON-LD', () => {
    const modal = read('app', '(site)', 'photos', '@modal', '(.)[slug]', 'page.tsx');
    expect(modal).not.toContain('ld+json');
    expect(modal).not.toContain('photoImageLd');
  });
});

/** A region or project block as JSON.parse returns it from jsonLdHtml. */
const parsed = (data: Parameters<typeof jsonLdHtml>[0]) => JSON.parse(jsonLdHtml(data)) as Node;

const regionRows = regionIds.map((id) => [id] as const);
const projectRows = projects.map((p) => [p.slug, p] as const);
const RIGHTS = ['creator', 'copyrightNotice', 'creditText'] as const;

describe('regionGalleryLd: the ImageGallery on every region page (SEO-04; D-16, D-17, D-18)', () => {
  it('runs over every registry region', () => {
    expect(regionIds.length).toBeGreaterThan(0);
  });

  it.each(regionRows)('%s round-trips through jsonLdHtml with no raw "<"', (id) => {
    const ld = regionGalleryLd(id);
    const html = jsonLdHtml(ld);
    expect(html).not.toContain('<');
    expect(JSON.parse(html)).toEqual(ld);
  });

  it.each(regionRows)('%s is an ImageGallery at the region page URL', (id) => {
    const block = parsed(regionGalleryLd(id));
    const pageUrl = site.url + '/photos/regions/' + id;
    expect(regionHref(id)).toBe('/photos/regions/' + id);
    expect(block['@context']).toBe('https://schema.org');
    expect(block['@type']).toBe('ImageGallery');
    expect(block['@id']).toBe(pageUrl);
    expect(block.url).toBe(pageUrl);
  });

  it.each(regionRows)('%s names the printed heading and the approved description', (id) => {
    const region = regionById(id);
    if (!region) throw new Error(`no region ${id}`);
    const block = parsed(regionGalleryLd(id));
    expect(block.name).toBe(regionHeading(region));
    expect(block.description).toBe(
      regionDescription({ name: region.name, country: region.country, views: regionPhotoViews(id) })
    );
  });

  it.each(regionRows)('%s places the gallery in the region and its country, no geo', (id) => {
    const region = regionById(id);
    if (!region) throw new Error(`no region ${id}`);
    const block = parsed(regionGalleryLd(id));
    expect(block.contentLocation).toEqual({
      '@type': 'Place',
      name: region.name,
      address: { '@type': 'PostalAddress', addressCountry: region.country },
    });
    const keys = keysDeep(block);
    for (const key of ['geo', 'latitude', 'longitude']) expect(keys).not.toContain(key);
  });

  it.each(regionRows)("%s lists the photos' #image @ids in the page's link order", (id) => {
    const block = parsed(regionGalleryLd(id));
    const views = regionPhotoViews(id);
    expect(views.length).toBeGreaterThan(0);
    expect(block.hasPart).toEqual(views.map((v) => ({ '@id': photoImageId(v.slug) })));
  });

  it.each(regionRows)('%s credits the Person and carries the printed region rights line', (id) => {
    const block = parsed(regionGalleryLd(id));
    expect(block.creator).toEqual(personRef());
    expect(block.creditText).toBe(site.name);
    expect(block.copyrightNotice).toBe(regionRights(id));
  });

  it('throws for an id that is not a registry region rather than inventing a gallery', () => {
    expect(() => regionGalleryLd('no-such-region')).toThrow(RangeError);
  });
});

describe('projectLd: the project on every case study (SEO-04; D-16, D-17, 11 D-23)', () => {
  it('runs over both projects', () => {
    expect(projects.map((p) => p.slug)).toEqual(['box', 'coin-flip']);
  });

  it.each(projectRows)('%s round-trips through jsonLdHtml with no raw "<"', (_slug, project) => {
    const ld = projectLd(project);
    const html = jsonLdHtml(ld);
    expect(html).not.toContain('<');
    expect(JSON.parse(html)).toEqual(ld);
  });

  it.each(projectRows)(
    '%s names the project, its pitch and its case-study URL',
    (_slug, project) => {
      const block = parsed(projectLd(project));
      expect(block['@context']).toBe('https://schema.org');
      expect(block.name).toBe(project.name);
      expect(project.pitch).toBeTruthy();
      expect(block.description).toBe(project.pitch);
      expect(block.url).toBe(site.url + '/projects/' + project.slug);
    }
  );

  it('box is SoftwareSourceCode with its public repository link', () => {
    const box = projects.find((p) => p.slug === 'box');
    if (!box || !('links' in box)) throw new Error('box has no links');
    const block = parsed(projectLd(box));
    expect(block['@type']).toBe('SoftwareSourceCode');
    expect(block.codeRepository).toBe(box.links.github);
  });

  it('coin-flip is SoftwareApplication with no codeRepository key (private repository, T-17-29)', () => {
    const coinFlip = projects.find((p) => p.slug === 'coin-flip');
    if (!coinFlip) throw new Error('no coin-flip');
    const block = parsed(projectLd(coinFlip));
    expect(block['@type']).toBe('SoftwareApplication');
    expect(keysDeep(block)).not.toContain('codeRepository');
    expect(jsonLdHtml(projectLd(coinFlip))).not.toContain('github.com');
  });

  it.each(projectRows)(
    '%s credits the Person and carries caseStudyRights(slug)',
    (_slug, project) => {
      const block = parsed(projectLd(project));
      expect(block.creator).toEqual(personRef());
      expect(block.creditText).toBe(site.name);
      expect(block.copyrightNotice).toBe(caseStudyRights(project.slug));
    }
  );
});

describe("caseStudyRights: Tim's 17-01 option (a), the footer line (D-17)", () => {
  it.each(projectRows)('%s is the footer line, siteRights(), with the current year', (slug) => {
    const footerLine = '© ' + new Date().getFullYear() + ' ' + site.name + '. All rights reserved.';
    expect(caseStudyRights(slug)).toBe(siteRights());
    expect(caseStudyRights(slug)).toBe(footerLine);
  });
});

describe('17-14 blocks: per-node rule and disclosure (D-16, Person exemption)', () => {
  // Built lazily inside each row, so a missing builder fails the row, not the suite.
  const blockRows: ReadonlyArray<readonly [string, () => Node]> = [
    ...regionIds.map((id) => ['region ' + id, () => parsed(regionGalleryLd(id))] as const),
    ...projects.map((p) => ['project ' + p.slug, () => parsed(projectLd(p))] as const),
  ];

  it.each(blockRows)('%s has a non-empty creator, copyrightNotice and creditText', (_l, build) => {
    const block = build();
    for (const key of RIGHTS) {
      const value = block[key];
      expect(value).toBeTruthy();
      if (typeof value === 'string') expect(value.trim()).not.toBe('');
    }
  });

  it('every top-level node of every block in this file lacking one of the three is a Person', () => {
    const nodes: Node[] = [
      ...graphNodes(),
      ...publishedViews.map((view) => blockOf(view) as unknown as Node),
      ...blockRows.map(([, build]) => build()),
    ];
    const lacking = nodes.filter((node) => RIGHTS.some((key) => !node[key]));
    expect(lacking.map((node) => node['@type'])).toEqual(['Person']);
  });

  it.each(blockRows)(
    '%s holds no license, acquireLicensePage, email or BreadcrumbList',
    (_l, build) => {
      const block = build();
      const keys = keysDeep(block);
      for (const key of ['license', 'acquireLicensePage', 'email']) {
        expect(keys).not.toContain(key);
      }
      expect(JSON.stringify(block)).not.toContain('BreadcrumbList');
    }
  );

  it.each(sourceRows)('%s never builds a BreadcrumbList (it waits for Phase 18)', (file) => {
    expect(read(file)).not.toContain('BreadcrumbList');
  });
});

describe('region and case-study page source rules (D-16, D-10)', () => {
  it.each([
    [
      'the region page',
      ['photos', 'regions', '[region]'],
      'jsonLdHtml(regionGalleryLd(region.id))',
    ],
    ['the case-study page', ['projects', '[slug]'], 'jsonLdHtml(projectLd(project))'],
  ])('%s renders its block as a native data block with no nonce', (_label, dirs, call) => {
    const page = read('app', '(site)', ...dirs, 'page.tsx');
    expect(page).toContain('type="application/ld+json"');
    expect(page).toContain(call);
    expect(page).not.toMatch(/\bnonce\s*=/);
    expect(page).not.toMatch(/from ['"]next\/script['"]/);
    expect(page).not.toContain('BreadcrumbList');
  });

  it('keeps the intercepted @modal region page free of JSON-LD', () => {
    const modal = read('app', '(site)', 'photos', '@modal', 'regions', '[region]', 'page.tsx');
    expect(modal).not.toContain('ld+json');
  });
});
