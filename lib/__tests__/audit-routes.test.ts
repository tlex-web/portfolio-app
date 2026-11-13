/**
 * @jest-environment node
 */
/**
 * The audit gate's route list covers the site (VERIFY-05; 13-RESEARCH Pattern
 * 4 and Pitfall 1). Every page template under app/(site) has a ROUTES
 * representative, audited in three engines at three widths; every page the
 * sitemap lists is either such an entry or in AUDIT_SWEEP, audited once in
 * Chromium. A new template (a region page, say) fails here until ROUTES names
 * it, and a new photo or region page joins the sweep through the sitemap.
 */
import fs from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import { projects } from '@/data/projects';
import { photoSlugs } from '@/lib/photos/view-model';
import { AUDIT_SWEEP, ROUTES, SITEMAP_PATHS } from '../../e2e/routes';

const SITE_DIR = path.join(process.cwd(), 'app', '(site)');
const routePaths = ROUTES.map(([p]) => p);

/**
 * Every page.tsx under app/(site), as a repo-relative path with forward slashes.
 * Directories starting with '@' (the parallel modal slot and its intercepting
 * routes) are skipped: they render over a page the walk already finds, and the
 * interactive-state audit tests cover them.
 */
function pageFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith('@') ? [] : pageFiles(full);
    return entry.name === 'page.tsx' ? [full] : [];
  });
}

/** A page file as a route pattern: route groups drop out, a [param] segment matches any one segment. */
function routePattern(file: string): RegExp {
  const segments = path
    .relative(SITE_DIR, path.dirname(file))
    .split(path.sep)
    .filter((s) => s !== '' && !/^\(.+\)$/.test(s))
    .map((s) => (/^\[.+\]$/.test(s) ? '[^/]+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  return new RegExp(`^/${segments.join('/')}$`);
}

const repoRelative = (file: string) => path.relative(process.cwd(), file).split(path.sep).join('/');

describe('every page template has a ROUTES entry (VERIFY-05)', () => {
  const files = pageFiles(SITE_DIR);

  it('finds the page templates', () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it('maps every app/(site) page.tsx outside @-segments to a ROUTES path', () => {
    const uncovered = files
      .filter((file) => !routePaths.some((p) => routePattern(file).test(p)))
      .map(repoRelative);
    expect(uncovered).toEqual([]);
  });
});

describe('every sitemap page is audited (VERIFY-05)', () => {
  it('lists at least the nine pages the site has today', () => {
    expect(sitemap().length).toBeGreaterThanOrEqual(9);
    expect(SITEMAP_PATHS.length).toBe(sitemap().length);
  });

  it('puts every sitemap path in ROUTES or AUDIT_SWEEP', () => {
    const missed = SITEMAP_PATHS.filter((p) => !routePaths.includes(p) && !AUDIT_SWEEP.includes(p));
    expect(missed).toEqual([]);
  });

  it('audits a ROUTES path once, by its template test, never again in the sweep', () => {
    expect(AUDIT_SWEEP.filter((p) => routePaths.includes(p))).toEqual([]);
  });

  it('covers /projects/coin-flip and every photo slug', () => {
    const audited = new Set([...routePaths, ...AUDIT_SWEEP]);
    const wanted = [
      '/projects/coin-flip',
      ...projects.map((p) => `/projects/${p.slug}`),
      ...photoSlugs.map((slug) => `/photos/${slug}`),
    ];
    expect(wanted.filter((p) => !audited.has(p))).toEqual([]);
  });

  it('has a non-empty sweep while there is more than one photo', () => {
    expect(photoSlugs.length).toBeGreaterThan(1);
    expect(AUDIT_SWEEP.length).toBeGreaterThan(0);
  });

  it('keeps sitemap order in the sweep, with no duplicates', () => {
    expect(new Set(AUDIT_SWEEP).size).toBe(AUDIT_SWEEP.length);
    expect(new Set(SITEMAP_PATHS).size).toBe(SITEMAP_PATHS.length);
    const indices = AUDIT_SWEEP.map((p) => SITEMAP_PATHS.indexOf(p));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('encodes sitemap paths exactly: the root is "/", nothing else ends with "/"', () => {
    expect(SITEMAP_PATHS[0]).toBe('/');
    expect(SITEMAP_PATHS.filter((p) => !p.startsWith('/'))).toEqual([]);
    expect(SITEMAP_PATHS.filter((p) => p !== '/' && p.endsWith('/'))).toEqual([]);
    expect(SITEMAP_PATHS.filter((p) => p.includes('://'))).toEqual([]);
  });
});
