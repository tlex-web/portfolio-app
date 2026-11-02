import { savedPageCatalog, savedPageRows, type SavedPageRow } from '@/lib/saved-pages';
import { site } from '@/data/site';
import { photoViews } from '@/lib/photos/view-model';
import { projects } from '@/data/projects';

/**
 * The offline saved-pages mapper (D-12; 12-UI-SPEC E11). Data-driven: every
 * href and title comes from site.nav, the photo view-model and the projects,
 * never a literal slug.
 */

const ORIGIN = 'https://x';
const catalog = savedPageCatalog({ nav: site.nav, photos: photoViews, projects });
const firstPhoto = photoViews[0];
const firstProject = projects[0];
const roadmap = site.nav.find((item) => item.href === '/roadmap');

const url = (path: string) => `${ORIGIN}${path}`;

describe('savedPageCatalog (D-12)', () => {
  it('lists the nav pages, then every photo, then every project, titled from data', () => {
    expect(catalog.map((row) => row.href)).toEqual([
      ...site.nav.map((item) => item.href),
      ...photoViews.map((view) => `/photos/${view.slug}`),
      ...projects.map((project) => `/projects/${project.slug}`),
    ]);
    expect(catalog.map((row) => row.title)).toEqual([
      ...site.nav.map((item) => item.label),
      ...photoViews.map((view) => view.title),
      ...projects.map((project) => project.name),
    ]);
  });

  it("labels detail pages 'Photograph' or 'Project' and leaves nav pages unlabelled", () => {
    for (const row of catalog) {
      if (row.href.startsWith('/photos/')) expect(row.label).toBe('Photograph');
      else if (row.href.startsWith('/projects/')) expect(row.label).toBe('Project');
      else expect(row.label).toBeUndefined();
    }
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
        url(`/photos/${firstPhoto.slug}`),
        url('/nope'),
      ],
      catalog
    );
    expect(rows).toEqual<SavedPageRow[]>([
      { href: '/roadmap', title: roadmap!.label },
      { href: `/photos/${firstPhoto.slug}`, title: firstPhoto.title, label: 'Photograph' },
    ]);
  });

  it('orders rows nav, then photos in data order, then projects, whatever the cache order', () => {
    const all = catalog.map((row) => url(row.href));
    const shuffled = [...all].reverse();
    expect(savedPageRows(shuffled, catalog)).toEqual(catalog);
  });

  it('collapses duplicates and trailing-slash variants into one row', () => {
    const path = `/projects/${firstProject.slug}`;
    const rows = savedPageRows([url(path), url(path), url(`${path}/`)], catalog);
    expect(rows).toEqual([{ href: path, title: firstProject.name, label: 'Project' }]);
  });

  it("maps '/' to 'Home'", () => {
    expect(savedPageRows([url('/')], catalog)).toEqual([{ href: '/', title: 'Home' }]);
  });

  it('drops a query-only variant and RSC entries: only the bare cached path opens offline', () => {
    expect(savedPageRows([url('/photos?view=grid'), url('/roadmap?_rsc=abc')], catalog)).toEqual([]);
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
