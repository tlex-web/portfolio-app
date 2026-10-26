import { notFound } from 'next/navigation';
import PhotoViewer from '@/components/photos/PhotoViewer';
import { photoBySlug, photoMetadata, photoSlugs, photoViews } from '@/lib/photos/view-model';

/**
 * The full photo page (LBOX-01 direct load; D-08; 10-UI-SPEC "Photo Viewer",
 * Page surface). A directly loaded /photos/{slug} is the same viewer as the
 * lightbox, inside the site shell: SiteNav above, SiteFooter below, the title
 * as the h1 and an "All photographs" link back to /photos. No dialog.
 *
 * Only the four locked slugs exist (08 D-07): generateStaticParams lists them,
 * turning dynamicParams off makes every other slug a 404, and notFound()
 * guards the exact, case-sensitive match (T-10-01). The slug is never echoed
 * into the page before it matches a known view.
 *
 * generateMetadata reads photoMetadata(slug), the function the intercepted
 * lightbox route exports too, so both surfaces carry '{title} · Tim Lui'.
 * Phase 12 attaches the OG images to that metadata (SEO-02).
 */

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return photoSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return photoMetadata(slug);
}

export default async function PhotoPage({ params }: PageProps) {
  const { slug } = await params;
  const view = photoBySlug(slug);
  if (!view) notFound();

  return <PhotoViewer variant="page" photos={photoViews} initialSlug={view.slug} />;
}
