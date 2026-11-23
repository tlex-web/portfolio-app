/**
 * @jest-environment node
 */
/**
 * The photo URL helper (15 D-16 to D-18, F5).
 *
 * - photoHref(slug) is '/photos/' + slug for every photo (D-17). The expected
 *   value is written as a literal concatenation, and the other Jest and e2e
 *   tests keep their literal /photos/ paths, so the URL contract (PHOTO-05) is
 *   checked independently of the helper.
 * - The proxy admits exactly the slugs that have a static photo page (F5,
 *   T-15-14, T-17-11): a slug the proxy lets through without a page renders
 *   Next's empty error shell (12-RESEARCH Pitfall 1). Since 17-05 (D-07,
 *   PHOTO-05) both are the published set, every photo with editorial copy;
 *   the light table (photoSlugs) is one curated view inside it, so a return
 *   to the four-photo route set fails here at once.
 * - The sitemap lists every photo page at its absolute /photos/<slug> URL.
 * - No source file outside lib/photos/routes.ts builds a photo path by hand
 *   (D-18). The scan walks app/, components/ and lib/ (skipping __tests__)
 *   plus proxy.ts and reads raw text, so a file a later plan adds is held to
 *   the rule without editing this test. The good and bad snippet arrays prove
 *   the patterns still catch what they must and nothing else.
 * - No source file outside lib/photos/routes.ts builds a region path
 *   (/photos/regions/<id>) by hand either (17 D-06): REGION_HAND_BUILT runs
 *   over the same SOURCES with the same exemption, so region URLs come from
 *   regionHref(id). proxy.ts's REGION_PATH regex and lib/photos/region-ids.ts
 *   pass the scan.
 */
import fs from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import { editorial } from '@/data/photos/editorial';
import { site } from '@/data/site';
import { photoHref, photoRouteSlugs } from '@/lib/photos/routes';
import {
  photoBySlug,
  photoSlugs,
  photoViews,
  publishedSlugs,
  publishedViews,
} from '@/lib/photos/view-model';

describe('photoHref (D-17)', () => {
  it('has at least one photo slug to pin', () => {
    expect(photoRouteSlugs.length).toBeGreaterThan(0);
  });

  it.each(photoRouteSlugs.map((slug) => [slug]))('builds /photos/%s', (slug) => {
    expect(photoHref(slug)).toBe('/photos/' + slug);
  });
});

describe('proxy slugs and static photo pages (F5)', () => {
  it('admits exactly the slugs generateStaticParams renders (publishedSlugs, T-17-11)', () => {
    const admitted = new Set(photoRouteSlugs);
    const pages = new Set(publishedSlugs);
    const withoutPage = [...admitted].filter((s) => !pages.has(s));
    const notAdmitted = [...pages].filter((s) => !admitted.has(s));
    if (withoutPage.length > 0 || notAdmitted.length > 0) {
      throw new Error(
        'Every slug the proxy admits (photoRouteSlugs) needs a static photo page (publishedSlugs), ' +
          'and every photo page must be admitted (D-07, PHOTO-05). ' +
          `Admitted without a page: [${withoutPage.join(', ')}]. Page not admitted: [${notAdmitted.join(', ')}].`
      );
    }
    expect(admitted).toEqual(pages);
  });

  it('is the published set: every editorial slug, eleven of them (D-07, PHOTO-05)', () => {
    expect(new Set(photoRouteSlugs)).toEqual(new Set(Object.values(editorial).map((e) => e.slug)));
    expect(photoRouteSlugs).toHaveLength(11);
  });

  it('holds every light-table slug, so the four v2.0 URLs keep their pages (D-07)', () => {
    expect(photoSlugs).toHaveLength(4);
    for (const slug of photoSlugs) expect(photoRouteSlugs).toContain(slug);
  });

  it("names no reserved path segment (the proxy's neutral slug '_', the 'regions' segment)", () => {
    expect(photoRouteSlugs).not.toContain('_');
    expect(photoRouteSlugs).not.toContain('regions');
  });

  it('has no duplicate slugs', () => {
    expect(new Set(photoRouteSlugs).size).toBe(photoRouteSlugs.length);
  });

  it('marks the slug list pure, so client chunks that import photoHref carry no editorial copy', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'lib', 'photos', 'routes.ts'), 'utf8');
    expect(src).toMatch(/export const photoRouteSlugs\b[^=]*=\s*\/\*\s*@__PURE__\s*\*\//);
  });
});

describe('photoBySlug: light table first, then the published set (D-07)', () => {
  it("returns each light-table photo's light-table view (k, n, prevSlug, nextSlug among the four)", () => {
    for (const view of photoViews) {
      const found = photoBySlug(view.slug);
      expect(found).toBe(view);
      expect(found?.n).toBe(4);
      for (const neighbour of [found?.prevSlug, found?.nextSlug]) {
        if (neighbour !== null) expect(photoSlugs).toContain(neighbour);
      }
    }
  });

  it("returns every other published photo's published view", () => {
    const others = publishedViews.filter((v) => !photoSlugs.includes(v.slug));
    expect(others).toHaveLength(7);
    for (const view of others) expect(photoBySlug(view.slug)).toBe(view);
  });

  it('returns undefined for an unknown or wrong-case slug (the routes then 404)', () => {
    expect(photoBySlug('no-such-photo')).toBeUndefined();
    expect(photoBySlug(photoSlugs[0].toUpperCase())).toBeUndefined();
  });
});

describe('sitemap photo URLs', () => {
  it('lists every photo page at site.url + /photos/<slug>', () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const slug of photoSlugs) {
      expect(urls).toContain(site.url + '/photos/' + slug);
    }
  });
});

/** Hand-built photo paths (15-RESEARCH "Scan regexes", verbatim). */
const HAND_BUILT = [
  /(?<![\w-])\/photos\/\$\{/, // `/photos/${…}` anywhere in a template, incl. `${site.url}/photos/${…}`
  /['"`]\/photos\/['"`]\s*\+/, // '/photos/' + …
  /\+\s*['"`]\/photos\//, // … + '/photos/…'
  /\b(?:router\.(?:push|replace|prefetch)|history\.(?:pushState|replaceState)|redirect|permanentRedirect)\s*\([^)]*['"`]\/photos\//, // any navigation to a photo path, literal or not
  /href=["']\/photos\/[^"'?#]/, // a hard-coded slug in a JSX attribute
];

const ROOT = process.cwd();
const EXEMPT = 'lib/photos/routes.ts';
const toPosix = (p: string) => p.split(path.sep).join('/');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** Every scanned source file, repo-relative with forward slashes. */
const SOURCES = [
  ...['app', 'components', 'lib'].flatMap((dir) => walk(path.join(ROOT, dir))),
  path.join(ROOT, 'proxy.ts'),
]
  .map((f) => toPosix(path.relative(ROOT, f)))
  .filter((f) => f !== EXEMPT);

const matchesAny = (text: string) => HAND_BUILT.some((re) => re.test(text));

describe('the hand-built photo path patterns (D-18 self-test)', () => {
  const BAD = [
    'href={`/photos/${slug}`}',
    'url: `${site.url}/photos/${slug}`',
    "const href = '/photos/' + slug;",
    'const href = base + "/photos/" + slug;',
    "const href = base + '/photos/matterhorn-from-zermatt';",
    "router.push('/photos/' + slug)",
    'router.push(`/photos/${photos[i].slug}`, { scroll: false })',
    "router.replace('/photos/' + slug)",
    "window.history.replaceState(null, '', '/photos/' + slug)",
    'window.history.replaceState(null, "", `/photos/${slug}`)',
    '<a href="/photos/riffelsee-reflection">',
    "<Link href='/photos/gornerschlucht-waterfall'>",
  ];
  const GOOD = [
    "router.push('/photos')",
    '<Link href="/photos">Photographs</Link>',
    "{ href: '/photos', label: 'Photographs' }",
    'return `/photos?view=${view}`;',
    '<Link href="/photos?view=grid">',
    String.raw`const PHOTO_PATH = /^\/photos\/([^/]+)$/;`,
    String.raw`const DETAIL_PATH = /^\/(photos|projects)\/([^/]+)$/;`,
    'src={`/images/photos/${name}-1600.avif`}',
    '// the photo page at /photos/{slug} renders the viewer',
    'router.push(photoHref(slug), { scroll: false })',
    "window.history.replaceState(null, '', photoHref(slug));",
  ];

  it.each(BAD.map((s) => [s]))('catches %s', (snippet) => {
    expect(matchesAny(snippet)).toBe(true);
  });

  it.each(GOOD.map((s) => [s]))('allows %s', (snippet) => {
    expect(matchesAny(snippet)).toBe(false);
  });
});

describe('no hand-built photo path outside lib/photos/routes.ts (D-18)', () => {
  it('walks the app, component and lib sources and proxy.ts', () => {
    expect(SOURCES).toContain('proxy.ts');
    expect(SOURCES).toContain('components/photos/PhotoViewer.tsx');
    expect(SOURCES).toContain('app/sitemap.ts');
    expect(SOURCES).toContain('lib/saved-pages.ts');
    expect(SOURCES.some((f) => f.includes('/__tests__/'))).toBe(false);
  });

  it('finds no photo URL built by hand; use photoHref(slug) from @/lib/photos/routes', () => {
    const hits = SOURCES.flatMap((file) =>
      fs
        .readFileSync(path.join(ROOT, file), 'utf8')
        .split(/\r?\n/)
        .flatMap((line, i) => (matchesAny(line) ? [`${file}:${i + 1}: ${line.trim()}`] : []))
    );
    expect(hits).toEqual([]);
  });
});

/** Hand-built region paths (17-RESEARCH "Code Examples", D-06). */
const REGION_HAND_BUILT = [
  /(?<![\w-])\/photos\/regions\/\$\{/, // `/photos/regions/${…}` in a template
  /['"`]\/photos\/regions\/['"`]\s*\+/, // '/photos/regions/' + …
  /href=["']\/photos\/regions\/[^"'?#]/, // a hard-coded region id in a JSX attribute
];

const matchesRegion = (text: string) => REGION_HAND_BUILT.some((re) => re.test(text));

describe('the hand-built region path patterns (D-06 self-test)', () => {
  const BAD = [
    'href={`/photos/regions/${id}`}',
    'url: `${site.url}/photos/regions/${region.id}`',
    "const href = '/photos/regions/' + id;",
    'const href = "/photos/regions/" + region.id;',
    '<a href="/photos/regions/zermatt">',
    "<Link href='/photos/regions/ortler'>",
  ];
  const GOOD = [
    String.raw`const REGION_PATH = /^\/photos\/regions\/([^/]+)$/;`,
    "router.push('/photos')",
    'href={regionHref(region.id)}',
    'url: site.url + regionHref(id)',
    '// a region page at /photos/regions/<id> lists its photos',
    ' * proxy.ts decides an unknown /photos/regions/<id> before render, so it needs',
    'export const regionRouteIds: readonly string[] = registry.regions.map((r) => r.id);',
  ];

  it.each(BAD.map((s) => [s]))('catches %s', (snippet) => {
    expect(matchesRegion(snippet)).toBe(true);
  });

  it.each(GOOD.map((s) => [s]))('allows %s', (snippet) => {
    expect(matchesRegion(snippet)).toBe(false);
  });
});

describe('no hand-built region path outside lib/photos/routes.ts (D-06)', () => {
  it('scans proxy.ts and the proxy-only id list', () => {
    expect(SOURCES).toContain('proxy.ts');
    expect(SOURCES).toContain('lib/photos/region-ids.ts');
    expect(SOURCES).toContain('lib/regions.ts');
  });

  it('finds no region URL built by hand; use regionHref(id) from @/lib/photos/routes', () => {
    const hits = SOURCES.flatMap((file) =>
      fs
        .readFileSync(path.join(ROOT, file), 'utf8')
        .split(/\r?\n/)
        .flatMap((line, i) => (matchesRegion(line) ? [`${file}:${i + 1}: ${line.trim()}`] : []))
    );
    expect(hits).toEqual([]);
  });
});
