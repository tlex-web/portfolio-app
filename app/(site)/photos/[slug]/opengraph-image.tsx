import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { site } from '@/data/site';
import { OG_SIZE, OgFrame, contourDataUrl, ogFonts, ogPhotoImage } from '@/lib/og/template';
import { photoBySlug } from '@/lib/photos/view-model';

/**
 * The per-photo Open Graph card (SEO-02; D-14; 12-UI-SPEC "Open Graph Template",
 * Photo variant). It overrides the root default card for /photos/{slug}, so a
 * shared photo link previews that photograph, its place, its altitude and
 * '© {year} Tim Lui'.
 *
 * Never an original: the photo pixels are the image manifest's 1200 px JPEG
 * derivative under public/images/photos/ (content-hashed, rotated, EXIF-free,
 * at most 2560 px), read from disk by ogPhotoImage (T-12-27; PROJECT.md photo
 * rights). Fonts and colours come from the committed files and tokens, so
 * nothing is fetched from a third-party origin.
 *
 * generateImageMetadata gives each card its own alt text from Tim's og.alt-photo
 * template (12-01 Resolved values): "{title}, a photograph by Tim Lui. {short
 * place}, {altitude}[ approx.]"; altitudeLabel already carries ' approx.' for a
 * hand-placed position. It receives params as a plain object; the image function
 * receives them as a Promise (Next 16). The card URL is
 * /photos/{slug}/opengraph-image-{hash}/card.
 *
 * Only known slugs have a card: for any other slug generateImageMetadata returns
 * no entry, and the generated route answers 404 before this function runs.
 *
 * No generateStaticParams or dynamicParams here (12-14 deviation, RESEARCH A3):
 * with generateImageMetadata, Next 16.4 generates the route's own
 * generateStaticParams over the card id only. Under Turbopack that replaces this
 * file's, so the slug is never enumerated and dynamicParams = false turned every
 * card into a 404; under webpack (next dev) the two exports collide ("Duplicate
 * export 'generateStaticParams'") and the photo page fails. The card is
 * therefore rendered on the first request and then cached; output file tracing
 * ships the fonts, the contour SVG and the JPEG derivatives with the route.
 */

type Params = { slug: string };

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateImageMetadata({ params }: { params: Params }) {
  const view = photoBySlug(params.slug);
  if (!view) return [];
  return [
    {
      id: 'card',
      alt: `${view.title}, a photograph by ${site.name}. ${view.shortPlace}, ${view.altitudeLabel}`,
      size,
      contentType,
    },
  ];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const view = photoBySlug((await params).slug);
  if (!view) notFound();
  const [fonts, contour, photo] = await Promise.all([
    ogFonts(),
    contourDataUrl(),
    ogPhotoImage(view.id),
  ]);
  return new ImageResponse(
    <OgFrame variant="photo" contour={contour} view={view} photo={photo} />,
    { ...OG_SIZE, fonts }
  );
}
