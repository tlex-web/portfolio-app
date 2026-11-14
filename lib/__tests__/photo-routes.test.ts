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
 *   T-15-14): a slug the proxy lets through without a page renders Next's
 *   empty error shell (12-RESEARCH Pitfall 1).
 * - The sitemap lists every photo page at its absolute /photos/<slug> URL.
 * - No source file outside lib/photos/routes.ts builds a photo path by hand
 *   (D-18). The scan walks app/, components/ and lib/ (skipping __tests__)
 *   plus proxy.ts and reads raw text, so a file a later plan adds is held to
 *   the rule without editing this test. The good and bad snippet arrays prove
 *   the patterns still catch what they must and nothing else.
 */
import fs from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import { site } from '@/data/site';
import { photoHref, photoRouteSlugs } from '@/lib/photos/routes';
import { photoSlugs } from '@/lib/photos/view-model';

describe('photoHref (D-17)', () => {
  it('has at least one photo slug to pin', () => {
    expect(photoRouteSlugs.length).toBeGreaterThan(0);
  });

  it.each(photoRouteSlugs.map((slug) => [slug]))('builds /photos/%s', (slug) => {
    expect(photoHref(slug)).toBe('/photos/' + slug);
  });
});

describe('proxy slugs and static photo pages (F5)', () => {
  it('admits exactly the slugs generateStaticParams renders', () => {
    const admitted = new Set(photoRouteSlugs);
    const pages = new Set(photoSlugs);
    const withoutPage = [...admitted].filter((s) => !pages.has(s));
    const notAdmitted = [...pages].filter((s) => !admitted.has(s));
    if (withoutPage.length > 0 || notAdmitted.length > 0) {
      throw new Error(
        'Every slug the proxy admits (photoRouteSlugs) needs a static photo page (photoSlugs), ' +
          'and every photo page must be admitted (Phase 17, PHOTO-05). ' +
          `Admitted without a page: [${withoutPage.join(', ')}]. Page not admitted: [${notAdmitted.join(', ')}].`
      );
    }
    expect(admitted).toEqual(pages);
  });

  it('has no duplicate slugs', () => {
    expect(new Set(photoRouteSlugs).size).toBe(photoRouteSlugs.length);
  });

  it('marks the slug list pure, so client chunks that import photoHref carry no editorial copy', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'lib', 'photos', 'routes.ts'), 'utf8');
    expect(src).toMatch(/export const photoRouteSlugs\b[^=]*=\s*\/\*\s*@__PURE__\s*\*\//);
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
