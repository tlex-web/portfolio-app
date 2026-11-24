import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { plates } from '@/data/generated/plates';
import { OG_SIZE, OgFrame, contourDataUrl, ogFonts, ogPhotoImage } from '@/lib/og/template';
import {
  COUNTRY_NAME,
  regionById,
  regionCardFacts,
  regionCover,
  regionOgAlt,
} from '@/lib/regions';

/**
 * The per-region Open Graph card (REGION-07; 17 D-12, D-13, D-14). It overrides
 * the root default card for /photos/regions/{id}, so a shared region link
 * previews the region's cover over its own plate, with its name, country, photo
 * count, height range and '© {years} Tim Lui'.
 *
 * The frame and type are the photo card's (OgFrame variant 'region'); only the
 * subject and the contour field change. The subject is the cover Tim picked
 * (D-13, data/regions/regions.json `cover`, checked at load by lib/regions.ts to
 * be one of the region's photos). The contour field is the region plate's hero
 * SVG (matterhorn for Zermatt, ortler, saalfelden), read from
 * data/generated/plates.ts, a server-only module (FORBIDDEN_IN_CLIENT_GRAPH):
 * this is a server metadata route.
 *
 * Never an original: the photo pixels are the image manifest's 1200 px JPEG
 * derivative under public/images/photos/ (content-hashed, rotated, EXIF-free),
 * read from disk by ogPhotoImage (T-12-27, T-17-15). Fonts and colours come from
 * the committed files and tokens, so nothing is fetched from a third-party
 * origin. The file names come from the zod-validated registry and the generated
 * modules, never from the request (T-17-16).
 *
 * generateImageMetadata gives each card Tim's approved alt (regionOgAlt, 17-01
 * D-14 copy). It receives params as a plain object; the image function receives
 * them as a Promise (Next 16). The card URL is
 * /photos/regions/{id}/opengraph-image-{hash}/card. Only registry ids have a
 * card: for any other id generateImageMetadata returns no entry and the image
 * function calls notFound() (the proxy already answers an unknown region path
 * with the photos 404).
 *
 * No generateStaticParams or dynamicParams here (the 12-14 rule, mirrored from
 * app/(site)/photos/[slug]/opengraph-image.tsx): with generateImageMetadata,
 * Next 16.4 generates the route's own generateStaticParams over the card id
 * only. Under Turbopack that replaces this file's, so dynamicParams = false
 * turned every card into a 404; under webpack (next dev) the two exports collide
 * ("Duplicate export 'generateStaticParams'"). The card is rendered on the first
 * request and then cached.
 *
 * Output file tracing must ship the fonts, the JPEG derivatives and the plate
 * contour SVGs with this route. The SVG path is a variable (the region's plate),
 * so tracing may not see it (17-RESEARCH Pitfall 6); a local `next start` reads
 * public/ directly, so 17-15 checks the deployed card on the Vercel preview.
 */

type Params = { region: string };

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateImageMetadata({ params }: { params: Params }) {
  if (!regionById(params.region)) return [];
  return [{ id: 'card', alt: regionOgAlt(params.region), size, contentType }];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const id = (await params).region;
  const region = regionById(id);
  if (!region) notFound();
  const [fonts, contour, photo] = await Promise.all([
    ogFonts(),
    contourDataUrl(plates[region.plate as keyof typeof plates].assets.contours.hero),
    ogPhotoImage(regionCover(id).id),
  ]);
  return new ImageResponse(
    <OgFrame
      variant="region"
      contour={contour}
      photo={photo}
      name={region.name}
      country={COUNTRY_NAME[region.country]}
      facts={regionCardFacts(id)}
    />,
    { ...OG_SIZE, fonts }
  );
}
