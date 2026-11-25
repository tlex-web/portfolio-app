import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ListLine, exifLineRows } from '@/components/photos/ExifStrip';
import FigureTransition from '@/components/photos/region/FigureTransition';
import { figureSizes } from '@/lib/photos/image-sizes';
import { photoHref } from '@/lib/photos/routes';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * One photo of the region sequence, framed as a map sheet (REGION-03,
 * REGION-04; D-07; 18-UI-SPEC Contract 2 "Figure = map collar"). A Server
 * Component: the caption is final in the server HTML, before the image loads.
 *
 * - The `li` is the jump target `#photo-{slug}` (plate badges and key rows,
 *   18-09/18-10): `tabIndex={-1}`, so an anchor jump moves the focus starting
 *   point into it, and the global scroll-margin-top lands it under the nav.
 * - The top collar prints the strip's Position value at the photo's own
 *   precision (already '≈ '-prefixed when approximate, T-18-21) and, for an
 *   approximate position with a radius, ' · ±{radius}'. No position, no collar
 *   line: nothing is reserved and nothing prints a dash.
 * - The neatline is a 1 px ring on a wrapper exactly the image's size (a ring
 *   takes no layout space); it reads `ink` when the `li` is the URL target (the
 *   arrival cue) and `ink-muted` on hover. Eight 1 px corner ticks, 8 px long,
 *   continue the neatline outward from its outer corners, so they sit in the
 *   gutter or the rail gap and never over the image.
 * - The photo is a link to the photo page (the lightbox over this page) with
 *   `data-photo-id`, where the lightbox's restoreFocus returns focus. Its name
 *   is the alt plus ', open in the photo viewer', as an aria-label: an sr-only
 *   suffix after the img gives engines room to insert a space before the comma. Its image
 *   box reserves the ratio over surface-overlay (CLS 0); the image is the stage
 *   derivatives, lazy, uncropped (object-contain in a box of its own ratio),
 *   with `sizes` from figureSizes, derived from the layout. FigureTransition
 *   names the image box photo-{slug} while no photo is open (P4 default), so
 *   opening the photo morphs it into the lightbox stage; instant under
 *   reduced motion.
 * - The caption: the title; the mono data line of nowrap parts joined at
 *   ' · ', starting with 'n / N' below 768 px only (aria-hidden: the list gives
 *   the position); then the EXIF lines as the viewer strip prints them, or the
 *   film line. Always visible: no overlay, no hover reveal.
 */

/** The figure box (Contract 2 "Figure box"): 16rem floor, 12rem chrome; image-sizes.test.ts pins both. */
const FIGURE_WIDTH = 'w-[min(100%,max(16rem,calc((100svh-var(--nav-h)-12rem)*var(--ar))))]';

/** One corner tick: a 1 px ink-muted stroke, 8 px long. */
const TICK = 'absolute bg-ink-muted';

/** The eight ticks, two per corner, positioned on the neatline's outer box. */
const TICKS = [
  'right-full top-0 h-px w-2',
  'bottom-full left-0 h-2 w-px',
  'left-full top-0 h-px w-2',
  'bottom-full right-0 h-2 w-px',
  'right-full bottom-0 h-px w-2',
  'top-full left-0 h-2 w-px',
  'left-full bottom-0 h-px w-2',
  'top-full right-0 h-2 w-px',
] as const;

const APPROX_SUFFIX = ' (approx.)';

/**
 * The collar's parts: the Position value, plus the radius ('±100 m') when the
 * position is approximate with one. Null when the photo has no position.
 */
export function collarParts(strip: PhotoView['strip']): string[] | null {
  const position = strip.positionRows.find((row) => row.term === 'Position');
  if (!position) return null;
  const note = strip.approxNote;
  return note && note.endsWith(APPROX_SUFFIX) && note.length > APPROX_SUFFIX.length
    ? [position.value, note.slice(0, -APPROX_SUFFIX.length)]
    : [position.value];
}

/** Nowrap parts joined at ' · ', so a line breaks only at a separator. */
function Parts({ parts }: { parts: readonly string[] }) {
  return parts.map((part, i) => (
    <span key={`${i}-${part}`}>
      {i > 0 ? ' · ' : null}
      <span className="whitespace-nowrap">{part}</span>
    </span>
  ));
}

export default function SequenceFigure({ view, n, N }: { view: PhotoView; n: number; N: number }) {
  const { slug, title, alt, shortPlace, altitudeLabel, captureMonth, aspect, stage, strip } = view;
  const ar = aspect.w / aspect.h;
  const collar = collarParts(strip);
  const exif = exifLineRows(strip);

  return (
    <li id={`photo-${slug}`} tabIndex={-1} data-sequence-item={slug} className="group">
      <figure className={`mx-auto ${FIGURE_WIDTH}`} style={{ '--ar': ar } as CSSProperties}>
        {collar && (
          <p data-figure-collar="" className="mb-2 font-mono text-sm text-ink-muted tabular-nums">
            <Parts parts={collar} />
          </p>
        )}
        <div
          data-neatline=""
          className="relative ring-1 ring-line-strong transition-shadow duration-(--duration-fast) ease-erosion hover:ring-ink-muted group-target:ring-ink"
        >
          <span aria-hidden="true" data-figure-ticks="" className="absolute -inset-px">
            {TICKS.map((place) => (
              <span key={place} data-figure-tick="" className={`${TICK} ${place}`} />
            ))}
          </span>
          <Link
            href={photoHref(slug)}
            scroll={false}
            data-photo-id={slug}
            aria-label={`${alt}, open in the photo viewer`}
            className="relative block cursor-zoom-in"
          >
            <FigureTransition slug={slug}>
              <div data-figure-box="" className="aspect-[var(--ar)] w-full bg-surface-overlay">
                <picture className="block h-full w-full">
                  <source type="image/avif" srcSet={stage.srcSetAvif} sizes={figureSizes(ar)} />
                  <source type="image/webp" srcSet={stage.srcSetWebp} sizes={figureSizes(ar)} />
                  {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
                  <img
                    src={stage.src}
                    width={stage.width}
                    height={stage.height}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    sizes={figureSizes(ar)}
                    className="block h-full w-full object-contain"
                  />
                </picture>
              </div>
            </FigureTransition>
          </Link>
        </div>
        <figcaption className="mt-4">
          <p className="text-base font-semibold text-ink">{title}</p>
          <p data-figure-data="" className="mt-1 font-mono text-sm text-ink-muted tabular-nums">
            <span aria-hidden="true" data-figure-counter="" className="md:hidden">
              <span className="whitespace-nowrap">
                {n} / {N}
              </span>
              {' · '}
            </span>
            <Parts parts={[shortPlace, altitudeLabel, captureMonth]} />
          </p>
          {strip.filmLine && (
            <p data-figure-film="" className="font-mono text-sm text-ink tabular-nums">
              {strip.filmLine}
            </p>
          )}
          {exif.length > 0 && (
            <dl data-figure-exif="" className="font-mono text-sm text-ink tabular-nums">
              {exif.map((rows, i) => (
                <div key={i}>
                  <ListLine rows={rows} />
                </div>
              ))}
            </dl>
          )}
        </figcaption>
      </figure>
    </li>
  );
}
