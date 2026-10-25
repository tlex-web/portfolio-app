import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { waypointKickerParts, type Waypoint } from '@/lib/ascent/waypoints';

/**
 * Three layouts from one markup (D-20, D-21; 09-UI-SPEC "Layout by breakpoint
 * and mode"), all with Tailwind variants and the L2 tokens:
 * - base, below 768 px in tall modes: the docked panel. Sticky at the bottom
 *   of its stage block, full-bleed across the container gutter (the negative
 *   margin equals the li padding, so nothing passes the viewport edge), padded
 *   past the home indicator, with the thumbnail beside kicker, title and place;
 * - md: the static side card on the left, single column, vertically centred
 *   by the block;
 * - motion-reduce: the same full card at every width, at natural height,
 *   stacked by the list. `sm:motion-reduce:mx-0` is needed because breakpoint
 *   variants sort after motion-reduce in Tailwind 4.
 * `ascent-card-fade` (app/globals.css) is a decorative scroll-driven fade from
 * 768 px where scroll timelines exist; its final state is fully opaque.
 */
const CARD =
  'ascent-card-fade sticky bottom-0 -mx-4 rounded-t-lg border-t border-line bg-surface-raised p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:-mx-6 md:static md:mx-0 md:w-full md:max-w-md md:rounded-lg md:border md:p-6 motion-reduce:static motion-reduce:mx-0 motion-reduce:w-full motion-reduce:max-w-md motion-reduce:rounded-lg motion-reduce:border motion-reduce:p-6 sm:motion-reduce:mx-0';

/** Visible above the docked panel only: a 48 px fade into the panel surface. */
const PANEL_FADE =
  'pointer-events-none absolute inset-x-0 bottom-full h-12 bg-linear-to-t from-surface-raised to-transparent md:hidden motion-reduce:hidden';

/** The 07 secondary button: full width and centred in the docked panel, inline from md and in reduced motion. */
const LINK =
  'mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-line-strong px-6 text-base font-semibold text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay md:mt-6 md:inline-flex md:w-auto md:justify-start motion-reduce:mt-6 motion-reduce:inline-flex motion-reduce:w-auto motion-reduce:justify-start';

/**
 * One waypoint card (HOME-05; D-07, D-08, D-10, D-20; 09-UI-SPEC "Waypoint
 * Cards"). Server component, always in the DOM in every mode: the cards are
 * Home's waypoint list, the focus target and the e2e/axe anchor.
 *
 * DOM order is the reading order: kicker, h2, photo, place and date, story,
 * View photo.
 *
 * The kicker and the place line carry explicit break points (G-09-3 b,
 * G-09-4 N2), because the docked column is narrower than either string on
 * every phone and a plain space would let the line breaker orphan '4' or start
 * a line with '·' at a width that moves with the scrollbar gutter and the
 * platform glyph advance. The kicker is two nowrap parts, '{altitude} ·' and
 * 'Waypoint k of n', so it wraps only between them. The place text is followed,
 * with no space, by a nowrap tail holding the separator and the date: in the
 * docked panel the separator is hidden and the date is a block, its own line;
 * from md and in reduced motion both are inline and glued to the last word of
 * the place, so a wrap can fall only at a space inside the place. textContent
 * stays `waypointKicker(w)` and `w.placeDate`. The photo comes only from the content-hashed manifest variants,
 * lazy, pre-sized at its true ratio on a surface-overlay box, so the layout is
 * final before it arrives and a failed load leaves the box and the alt text.
 * "View photo" opens the gallery at this photo (/photos#{slug}) until Phase 10
 * ships /photos/{slug}. Its accessible name adds the title so the four links
 * are distinguishable out of context; it is an explicit aria-label, as on the
 * trail signs, because the link is a flex box and name computation would put a
 * space before an sr-only ': ' separator.
 */
export default function WaypointCard({ waypoint }: { waypoint: Waypoint }) {
  const { slug, title, alt, story, place, captureMonth, image } = waypoint;
  const [altitudePart, waypointPart] = waypointKickerParts(waypoint);
  const titleId = `waypoint-${slug}-title`;

  return (
    <section aria-labelledby={titleId} className={CARD}>
      <div aria-hidden="true" className={PANEL_FADE} />
      <div className="grid grid-cols-[128px_1fr] gap-4 md:block motion-reduce:block">
        <p className="col-start-2 font-mono text-sm text-ink-muted tabular-nums">
          <span data-kicker-part="altitude" className="whitespace-nowrap">
            {altitudePart}
          </span>{' '}
          <span data-kicker-part="waypoint" className="whitespace-nowrap">
            {waypointPart}
          </span>
        </p>
        <h2
          id={titleId}
          className="col-start-2 text-base font-semibold text-balance md:mt-2 md:text-heading motion-reduce:mt-2 motion-reduce:text-heading"
        >
          {title}
        </h2>
        <picture className="col-start-1 row-span-3 row-start-1 block md:mt-4 motion-reduce:mt-4">
          <source type="image/avif" srcSet={image.srcSetAvif} sizes="(min-width: 768px) 400px, 128px" />
          <source type="image/webp" srcSet={image.srcSetWebp} sizes="(min-width: 768px) 400px, 128px" />
          {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
          <img
            src={image.src}
            width={image.width}
            height={image.height}
            alt={alt}
            loading="lazy"
            decoding="async"
            style={{ aspectRatio: `${image.width} / ${image.height}` }}
            className="block h-auto w-full rounded-sm bg-surface-overlay"
          />
        </picture>
        <p className="col-start-2 font-mono text-sm text-ink-muted md:mt-4 motion-reduce:mt-4">
          {place}
          <span data-place-tail="" className="whitespace-nowrap">
            <span data-place-sep="" className="hidden md:inline motion-reduce:inline">
              {' · '}
            </span>
            <span data-place-date="" className="block md:inline motion-reduce:inline">
              {captureMonth}
            </span>
          </span>
        </p>
      </div>
      <p className="mt-2 hidden max-w-prose text-base text-ink-muted md:block motion-reduce:block">{story}</p>
      <Link href={`/photos#${slug}`} aria-label={`View photo: ${title}`} className={LINK}>
        View photo
        <ArrowRightIcon size={20} aria-hidden="true" />
      </Link>
    </section>
  );
}
