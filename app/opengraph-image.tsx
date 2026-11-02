import { ImageResponse } from 'next/og';
import { OG_SIZE, OgFrame, contourDataUrl, ogFonts } from '@/lib/og/template';

/**
 * The site-wide default Open Graph card (SEO-02; D-16; 12-UI-SPEC "Open Graph
 * Template", Default variant).
 *
 * Set once at the root, so every route without a card of its own (Home, /photos,
 * /projects, /roadmap, /contact) inherits it; the photo and project routes
 * override it with their own opengraph-image (12-14). Twitter reuses the Open
 * Graph image under the root `twitter.card: 'summary_large_image'` (app/layout.tsx).
 *
 * Prerendered at build (no request-time API), drawn from the committed fonts and
 * token colours only. The alt text is Tim's og.alt-default (12-01 Resolved values).
 */
export const alt = 'Tim Lui, developer and photographer, over a contour map of the Matterhorn';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  const [fonts, contour] = await Promise.all([ogFonts(), contourDataUrl()]);
  return new ImageResponse(<OgFrame variant="default" contour={contour} />, {
    ...OG_SIZE,
    fonts,
  });
}
