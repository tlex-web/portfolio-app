import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { projects } from '@/data/projects';
import { OG_SIZE, OgFrame, contourDataUrl, ogFonts } from '@/lib/og/template';

/**
 * The per-project Open Graph card (SEO-02; D-15; 12-UI-SPEC "Open Graph
 * Template", Project variant). It overrides the root default card for
 * /projects/{slug}, so a shared case-study link previews the project's kicker,
 * name and pitch over the contour field, with its trail profile, signpost
 * caption and waymark grade on the plate.
 *
 * Every string comes from data/projects.ts and the committed trail profiles (for
 * coin-flip, the approved Phase 11 strings, 11 D-23); nothing new is written
 * here (T-12-28). No photograph is drawn, so no original can reach this card
 * either; fonts and colours are the committed files and tokens, and nothing is
 * fetched from a third-party origin.
 *
 * generateImageMetadata gives each card its own alt text from Tim's
 * og.alt-project template (12-01 Resolved values), "{name}: {pitch}", or the
 * name alone when a project has no pitch. It receives params as a plain object;
 * the image function receives them as a Promise (Next 16). The card URL is
 * /projects/{slug}/opengraph-image-{hash}/card.
 *
 * Only known slugs have a card: for any other slug generateImageMetadata returns
 * no entry, and the generated route answers 404 before this function runs.
 *
 * No generateStaticParams or dynamicParams here, for the reason given in
 * app/(site)/photos/[slug]/opengraph-image.tsx (12-14 deviation, RESEARCH A3):
 * Next 16.4 cannot enumerate the slug of a generateImageMetadata route, so the
 * card is rendered on the first request and then cached.
 */

type Params = { slug: string };

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateImageMetadata({ params }: { params: Params }) {
  const project = projects.find((p) => p.slug === params.slug);
  if (!project) return [];
  return [
    {
      id: 'card',
      alt: project.pitch ? `${project.name}: ${project.pitch}` : project.name,
      size,
      contentType,
    },
  ];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const [fonts, contour] = await Promise.all([ogFonts(), contourDataUrl()]);
  return new ImageResponse(<OgFrame variant="project" contour={contour} project={project} />, {
    ...OG_SIZE,
    fonts,
  });
}
