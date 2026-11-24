import fs from 'node:fs';
import path from 'node:path';
import { savedPageCatalog, savedPageRows, type SavedPageRow } from '@/lib/saved-pages';
import { site } from '@/data/site';
import { publishedSlugs } from '@/lib/photos/view-model';
import { regions, regionPhotoViews } from '@/lib/regions';
import { projects } from '@/data/projects';
import { SLUGS } from '../../e2e/helpers/photo-fixtures';

/**
 * The offline saved-pages mapper (D-12; 12-UI-SPEC E11; 17 D-22, EDGE-03).
 * Data-driven: every href and title comes from site.nav, the region registry
 * (lib/regions.ts), the published photo views and the projects. The catalog is
 * built exactly as app/(site)/offline/page.tsx builds it: region ids and names
 * only, and every published photo grouped by region in registry order.
 */

const ORIGIN = 'https://x';
const regionSource = regions.map(({ id, name }) => ({ id, name }));
const photoSource = regions.flatMap((r) => regionPhotoViews(r.id));
const catalog = savedPageCatalog({
  nav: site.nav,
  regions: regionSource,
  photos: photoSource,
  projects,
});
const seededPhoto = photoSource.find((view) => view.slug === SLUGS.matterhornFromZermatt)!;
const firstRegion = regions[0];
const firstProject = projects[0];
const roadmap = site.nav.find((item) => item.href === '/roadmap');

const url = (p: string) => `${ORIGIN}${p}`;

describe('savedPageCatalog (D-12, D-22)', () => {
  it('lists the nav pages, then every region, then the photos by region, then every project, titled from data', () => {
    expect(catalog.map((row) => row.href)).toEqual([
      ...site.nav.map((item) => item.href),
      ...regions.map((region) => `/photos/regions/${region.id}`),
      ...regions.flatMap((region) =>
        regionPhotoViews(region.id).map((view) => `/photos/${view.slug}`)
      ),
      ...projects.map((project) => `/projects/${project.slug}`),
    ]);
    expect(catalog.map((row) => row.title)).toEqual([
      ...site.nav.map((item) => item.label),
      ...regions.map((region) => region.name),
      ...regions.flatMap((region) => regionPhotoViews(region.id).map((view) => view.title)),
      ...projects.map((project) => project.name),
    ]);
  });

  it('holds every published photo page exactly once', () => {
    const photoHrefs = catalog
      .map((row) => row.href)
      .filter((href) => href.startsWith('/photos/') && !href.startsWith('/photos/regions/'));
    expect(new Set(photoHrefs).size).toBe(photoHrefs.length);
    expect([...photoHrefs].sort()).toEqual(publishedSlugs.map((slug) => `/photos/${slug}`).sort());
  });

  it("labels region pages 'Region', photo pages 'Photograph', projects 'Project', and leaves nav pages unlabelled", () => {
    for (const row of catalog) {
      if (row.href.startsWith('/photos/regions/')) expect(row.label).toBe('Region');
      else if (row.href.startsWith('/photos/')) expect(row.label).toBe('Photograph');
      else if (row.href.startsWith('/projects/')) expect(row.label).toBe('Project');
      else expect(row.label).toBeUndefined();
    }
    expect(catalog.filter((row) => row.label === 'Region')).toHaveLength(regions.length);
  });

  it('rows carry only a path, a title and a label: the island gets no registry facts', () => {
    for (const row of catalog) {
      expect(Object.keys(row).every((key) => ['href', 'title', 'label'].includes(key))).toBe(true);
    }
  });

  it('a catalog built with no regions has no region row and keeps the rest', () => {
    const bare = savedPageCatalog({ nav: site.nav, regions: [], photos: photoSource, projects });
    expect(
      bare.some((row) => row.href.startsWith('/photos/regions/') || row.label === 'Region')
    ).toBe(false);
    expect(bare).toEqual(catalog.filter((row) => row.label !== 'Region'));
  });

  it('never includes /offline', () => {
    expect(catalog.some((row) => row.href === '/offline')).toBe(false);
  });
});

describe('savedPageRows (D-12, UI-SPEC E11)', () => {
  it('keeps only cached pages with a data title: query variants, /offline, assets and unknown paths drop', () => {
    expect(roadmap).toBeDefined();
    const rows = savedPageRows(
      [
        url('/roadmap'),
        url('/roadmap?view=1'),
        url('/offline'),
        url('/_next/static/a.js'),
        url(`/photos/${seededPhoto.slug}`),
        url('/nope'),
      ],
      catalog
    );
    const expected: SavedPageRow[] = [
      { href: '/roadmap', title: roadmap!.label },
      { href: `/photos/${seededPhoto.slug}`, title: seededPhoto.title, label: 'Photograph' },
    ];
    expect(rows).toEqual(expected);
  });

  it('orders rows nav, regions, photos, then projects, whatever the cache order', () => {
    const all = catalog.map((row) => url(row.href));
    const shuffled = [...all].reverse();
    expect(savedPageRows(shuffled, catalog)).toEqual(catalog);
  });

  it('collapses duplicates and trailing-slash variants into one row', () => {
    const p = `/projects/${firstProject.slug}`;
    const rows = savedPageRows([url(p), url(p), url(`${p}/`)], catalog);
    expect(rows).toEqual([{ href: p, title: firstProject.name, label: 'Project' }]);
  });

  it("maps '/' to 'Home'", () => {
    expect(savedPageRows([url('/')], catalog)).toEqual([{ href: '/', title: 'Home' }]);
  });

  it('drops a query-only variant and RSC entries: only the bare cached path opens offline', () => {
    expect(savedPageRows([url('/photos?view=grid'), url('/roadmap?_rsc=abc')], catalog)).toEqual(
      []
    );
  });

  it('ignores strings that are not URLs and returns no rows for an empty cache', () => {
    expect(savedPageRows(['not a url', ''], catalog)).toEqual([]);
    expect(savedPageRows([], catalog)).toEqual([]);
  });

  it('never returns a raw URL as a title', () => {
    const rows = savedPageRows(
      catalog.map((row) => url(row.href)).concat(url('/unknown/deep/path')),
      catalog
    );
    const titles = new Set(catalog.map((row) => row.title));
    for (const row of rows) {
      expect(titles.has(row.title)).toBe(true);
      expect(row.title).not.toMatch(/https?:|\//);
    }
  });
});

describe('savedPageRows over region pages (D-22, EDGE-03)', () => {
  const regionPath = `/photos/regions/${firstRegion.id}`;
  const regionRow: SavedPageRow = { href: regionPath, title: firstRegion.name, label: 'Region' };

  it('keeps a cached region page as one row titled with the region name', () => {
    expect(savedPageRows([url(regionPath)], catalog)).toEqual([regionRow]);
  });

  it('collapses the trailing-slash variant into the region row', () => {
    expect(savedPageRows([url(`${regionPath}/`)], catalog)).toEqual([regionRow]);
    expect(savedPageRows([url(regionPath), url(`${regionPath}/`)], catalog)).toEqual([regionRow]);
  });

  it('a query variant alone makes no row', () => {
    expect(savedPageRows([url(`${regionPath}?x=1`)], catalog)).toEqual([]);
  });

  it('the bare segment and an unknown region make no row', () => {
    expect(regions.some((region) => region.id === 'nowhere')).toBe(false);
    expect(
      savedPageRows(
        [url('/photos/regions'), url('/photos/regions/'), url('/photos/regions/nowhere')],
        catalog
      )
    ).toEqual([]);
  });

  it('a region row sits after the nav rows and before the photo rows', () => {
    const rows = savedPageRows(
      [url(`/photos/${seededPhoto.slug}`), url(regionPath), url('/roadmap')],
      catalog
    );
    expect(rows.map((row) => row.href)).toEqual([
      '/roadmap',
      regionPath,
      `/photos/${seededPhoto.slug}`,
    ]);
  });
});

describe('the saved-pages modules import no region data (D-22, D-06)', () => {
  const IMPORTS_REGION_DATA =
    /^\s*import\s[^;]*?from\s+['"][^'"]*(?:\/lib\/regions|regions\.json)['"]/m;

  it.each(['lib/saved-pages.ts', 'components/site/SavedPages.tsx'])('%s', (file) => {
    const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    expect(source).not.toMatch(IMPORTS_REGION_DATA);
  });

  it('the guard pattern catches a region import (self-test)', () => {
    expect("import { regions } from '@/lib/regions';").toMatch(IMPORTS_REGION_DATA);
    expect("import registry from '@/data/regions/regions.json';").toMatch(IMPORTS_REGION_DATA);
    expect("import { regionHref } from '@/lib/photos/routes';").not.toMatch(IMPORTS_REGION_DATA);
  });
});
