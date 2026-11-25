import { notFound } from 'next/navigation';
import PhotoViewer from '@/components/photos/PhotoViewer';
import { photoImageLd } from '@/lib/json-ld/content';
import { jsonLdHtml } from '@/lib/json-ld/site';
import { regionById, regionEndCard, regionOfPhoto, regionViewerSet } from '@/lib/regions';
import { regionHref } from '@/lib/photos/routes';
import { photoBySlug, photoMetadata, photoSlugs, publishedSlugs } from '@/lib/photos/view-model';

/**
 * The full photo page (LBOX-01 direct load; D-08; 10-UI-SPEC "Photo Viewer",
 * Page surface). A directly loaded /photos/{slug} is the same viewer as the
 * lightbox, inside the site shell: SiteNav above, SiteFooter below, the title
 * as the h1 and an "All photographs" link back to /photos. No dialog.
 *
 * Only the published slugs exist (17 D-07, PHOTO-05: every photo with
 * editorial copy): generateStaticParams lists them, turning dynamicParams off
 * makes every other slug a 404, and notFound() guards the exact,
 * case-sensitive match (T-10-01). The slug is never echoed into the page
 * before it matches a known view. The viewer steps through
 * regionViewerSet(view.id), the photo's region series in sequence order, built
 * here on the server and passed as props (LBOX-09, 18 D-12; it supersedes 17
 * D-08's per-photo set). After the series' last photo the viewer shows one
 * extra step, the end-of-series card, whose props regionEndCard builds here too
 * (18 D-12).
 *
 * The way back (17 D-09): a photo off the light table gets `back`, its
 * region's name and regionHref(region.id), built here on the server from the
 * registry (regionOfPhoto), never from the URL (T-17-14); the viewer's back
 * links and the page Escape lead there. The v2.0 four get no `back` and keep
 * "All photographs" to /photos, so their markup is unchanged (D-10).
 *
 * generateMetadata reads photoMetadata(slug), the function the intercepted
 * lightbox route exports too, so both surfaces carry '{title} · Tim Lui'.
 * Phase 12 attaches the OG images to that metadata (SEO-02).
 *
 * The photo's ImageObject (17-13; SEO-04, D-16) is a native JSON-LD data block
 * beside the viewer, on this full page only: the intercepted @modal page never
 * carries one (a soft navigation would otherwise add a second block over the
 * gallery). It lands inside SiteChrome's <main>; jsonLdHtml escapes every '<',
 * and a data block needs no nonce.
 */

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return photoMetadata(slug);
}

/**
 * The page's way back for a photo off the light table: its region page, by
 * name. The four get undefined.
 *
 * @throws Error when a published photo has no registry region (a data fault the build must not hide).
 */
function backFor(view: { id: string; slug: string }): { href: string; label: string } | undefined {
  if (photoSlugs.includes(view.slug)) return undefined;
  const regionId = regionOfPhoto(view.id);
  const region = regionId === undefined ? undefined : regionById(regionId);
  if (!region) throw new Error(`PhotoPage: photo ${view.id} has no registry region`);
  return { href: regionHref(region.id), label: region.name };
}

/**
 * The viewer's end-of-series card for the photo's region (LBOX-09, 18 D-12),
 * built here on the server and passed as props.
 *
 * @throws Error when a published photo has no registry region (as backFor).
 */
function endCardFor(view: { id: string }) {
  const regionId = regionOfPhoto(view.id);
  if (regionId === undefined) throw new Error(`PhotoPage: photo ${view.id} has no registry region`);
  return regionEndCard(regionId);
}

export default async function PhotoPage({ params }: PageProps) {
  const { slug } = await params;
  const view = photoBySlug(slug);
  if (!view) notFound();
  const back = backFor(view);
  const endCard = endCardFor(view);

  // The four get no back prop at all (not back={undefined}), so their props are unchanged.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(photoImageLd(view)) }}
      />
      {back ? (
        <PhotoViewer
          variant="page"
          photos={regionViewerSet(view.id)}
          initialSlug={view.slug}
          back={back}
          endCard={endCard}
        />
      ) : (
        <PhotoViewer
          variant="page"
          photos={regionViewerSet(view.id)}
          initialSlug={view.slug}
          endCard={endCard}
        />
      )}
    </>
  );
}
