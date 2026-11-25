import { notFound } from 'next/navigation';
import PhotoViewer from '@/components/photos/PhotoViewer';
import { photoImageLd } from '@/lib/json-ld/content';
import { jsonLdHtml } from '@/lib/json-ld/site';
import { photoBack, regionEndCard, regionOfPhoto, regionViewerSet } from '@/lib/regions';
import { photoBySlug, photoMetadata, publishedSlugs } from '@/lib/photos/view-model';

/**
 * The full photo page (LBOX-01 direct load; D-08; 10-UI-SPEC "Photo Viewer",
 * Page surface). A directly loaded /photos/{slug} is the same viewer as the
 * lightbox, inside the site shell: SiteNav above, SiteFooter below, the title
 * as the h1 and a 'Back to {region}' link to the photo's region page. No dialog.
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
 * The way back (18 D-09): every photo, the v2.0 four included, gets `back`,
 * its region's name and regionHref(region.id), built here on the server by
 * photoBack from the registry, never from the URL (T-17-14, T-18-37); the
 * viewer's back links ('Back to {name}'), the page Escape and the legend lead
 * there. The v2.0 four leave their 'All photographs' link and their
 * byte-identical page on purpose (18 D-09 retires 17 D-10's guarantee).
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
 * The viewer's end-of-series card for the photo's region (LBOX-09, 18 D-12),
 * built here on the server and passed as props.
 *
 * @throws Error when a published photo has no registry region (a data fault the build must not hide).
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(photoImageLd(view)) }}
      />
      <PhotoViewer
        variant="page"
        photos={regionViewerSet(view.id)}
        initialSlug={view.slug}
        back={photoBack(view.id)}
        endCard={endCardFor(view)}
      />
    </>
  );
}
