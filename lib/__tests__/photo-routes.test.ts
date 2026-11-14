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
 */
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
          `Admitted without a page: [${withoutPage.join(', ')}]. Page not admitted: [${notAdmitted.join(', ')}].`,
      );
    }
    expect(admitted).toEqual(pages);
  });

  it('has no duplicate slugs', () => {
    expect(new Set(photoRouteSlugs).size).toBe(photoRouteSlugs.length);
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
