import { notFound } from 'next/navigation';
import LightboxDialog from '@/components/photos/LightboxDialog';
import PhotoViewer from '@/components/photos/PhotoViewer';
import { photoBySlug, photoMetadata, photoViews } from '@/lib/photos/view-model';

/**
 * The intercepted photo route (LBOX-01; 10-RESEARCH Spike Results). A soft
 * navigation from the gallery to /photos/{slug} renders this page in the
 * `@modal` slot: the same viewer as the full page, inside the native
 * `<dialog>` shell, over the still-mounted gallery. A hard load or a reload of
 * the same URL is not intercepted and renders `[slug]/page.tsx` instead; a
 * link from Home is not intercepted either (D-08, measured in the spike).
 *
 * generateMetadata reads the same photoMetadata(slug) as the full page, so
 * the document title is '{title} · Tim Lui' in the lightbox too (the probe
 * showed the intercepted page otherwise keeps the gallery's title). Only the
 * four known slugs render; any other slug is a 404 (T-10-12). No loading.tsx
 * in this slot: a suspended destination would paint a fallback first and the
 * open morph (10-06) would meet an empty box (10-RESEARCH Pitfall 4).
 */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return photoMetadata(slug);
}

export default async function InterceptedPhotoPage({ params }: PageProps) {
  const { slug } = await params;
  const view = photoBySlug(slug);
  if (!view) notFound();

  return (
    <LightboxDialog labelledBy="photo-title">
      <PhotoViewer variant="modal" photos={photoViews} initialSlug={view.slug} />
    </LightboxDialog>
  );
}
