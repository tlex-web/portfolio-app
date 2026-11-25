import ContourField from '@/components/terrain/ContourField';
import { plateCss, plateGroups } from '@/lib/photos/plate-layout';
import type { RegionPlateSheet } from '@/lib/regions';

/**
 * The square sheet: an inline-size @container, so the pin CSS sizes the marks
 * from its side S. The edge is a 1 px outline drawn inside the box (no layout
 * space), so the container's side is the box's own width, as the sweep
 * assumes (18-13's note on sheets). Full-bleed below 640 px, centred at
 * max-w-xl (576 px) from 640 px, and from 1024 px the right column of the
 * facts and plate grid (3fr: 634 px at 1440, 18-10).
 */
const SHEET =
  'relative aspect-square overflow-hidden bg-surface outline-1 -outline-offset-1 outline-line [container-type:inline-size]';

/** The 24 px badge: the overview marker look, a 44 px hit area through `before:` (UI-SPEC "Touch targets"). */
const BADGE =
  "relative flex size-6 cursor-pointer items-center justify-center rounded-full font-mono text-sm leading-none font-semibold tabular-nums before:absolute before:-inset-2.5 before:content-['']";

/** Solid for an exact position; hollow and dashed for an approximate one, by shape, not colour (08 D-02, Contract 5). */
const BADGE_EXACT = 'bg-ink text-ink-inverse';
const BADGE_APPROX = 'border-2 border-dashed border-ink bg-surface text-ink';

/** The 8 px exact-position dot with its 2 px surface casing. */
const DOT = 'absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface';
const DOT_EXACT = 'bg-ink';
const DOT_APPROX = 'border-2 border-dashed border-ink bg-surface';

/**
 * The region page's local plate (REGION-02; 18-UI-SPEC Contract 2 "Facts and
 * plate"). Server component, zero JS of its own, no motion.
 *
 * The region's own plate, from plain props (regionPlateSheet: the plate
 * registry stays on the server): its hillshade at --relief-opacity under the
 * 100 m hero contours, then per pin group an exact-position dot (8 px, 2 px
 * surface casing) and a row of 24 px numbered badges, each a same-page anchor
 * to its figure in the sequence (#photo-{slug}, D-08). Badges are pointer-only:
 * tabIndex -1 and aria-hidden, so nothing inside the sheet is focusable; the
 * key list (18-10) is the keyboard and screen-reader path. They work without
 * JavaScript. Pins at one spot share one dot with their badges side by
 * side. An approximate position draws a hollow dashed dot and badge (08 D-02,
 * Contract 5); a photo without a position has no pin (regionPlateSheet).
 *
 * The positions come from lib/photos/plate-layout.ts as one server-rendered
 * style element (container queries on this sheet's own container name with
 * calc(<u> * 100cqw ± <px>px) lengths), so the server HTML is exact at every
 * side and nothing relayouts on the client. A badge unit that would crowd
 * another is displaced with a 1 px ink-muted leader back to its dot. The CSP
 * allows inline styles (`style-src 'unsafe-inline'`), and the CSS holds only
 * numbers, the slugs and fixed selectors (T-18-23).
 *
 * The relief is lazy (the header slot's cover is the page's LCP image). Until
 * it and the contour mask decode, or if either fails, the sheet shows
 * bg-surface with every dot and badge working (UI E4 loading, error).
 */
export default function PlateSheet({ sheet }: { sheet: RegionPlateSheet }) {
  const name = `plate-${sheet.id}`;
  const css = plateCss(sheet.pins, name);
  const { avif, webp } = sheet.hillshade;
  // The rendered side: 100vw below 640, 576 px to 1023, then the grid's 3fr column
  // ((min(100vw, 1152px) - 64 - 32) x 3/5, at most 634 px).
  const sizes = '(min-width: 1024px) 634px, (min-width: 640px) 576px, 100vw';

  return (
    <figure className="-mx-4 sm:mx-auto sm:w-full sm:max-w-xl lg:mx-0 lg:max-w-none">
      <div data-plate-sheet={sheet.id} className={SHEET} style={{ containerName: name }}>
        <style>{css}</style>
        <picture>
          <source
            type="image/avif"
            srcSet={`${avif['640']} 640w, ${avif['1100']} 1100w`}
            sizes={sizes}
          />
          <source
            type="image/webp"
            srcSet={`${webp['640']} 640w, ${webp['1100']} 1100w`}
            sizes={sizes}
          />
          {/* A raw <img> on purpose: content-hashed, pre-sized terrain asset with picture
              type switching. @next/next/no-img-element exempts an img inside <picture>. */}
          <img
            src={webp['1100']}
            alt=""
            width={1100}
            height={1100}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 block h-full w-full opacity-(--relief-opacity)"
          />
        </picture>
        <ContourField sheet={sheet.contours} lod="hero" className="absolute inset-0" />
        {plateGroups(sheet.pins).map((g) => (
          <div key={g.key} data-plate-pin={g.key} className="absolute size-0">
            <svg
              data-plate-leader
              aria-hidden="true"
              className="pointer-events-none absolute min-h-px min-w-px overflow-visible text-ink-muted"
            >
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span
              data-plate-dot
              aria-hidden="true"
              data-approximate={g.approximate || undefined}
              className={`${DOT} ${g.approximate ? DOT_APPROX : DOT_EXACT}`}
            />
            <div data-plate-unit className="absolute flex gap-2">
              {g.pins.map((p) => (
                <a
                  key={p.slug}
                  href={`#photo-${p.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  data-plate-badge={p.slug}
                  data-approximate={p.approximate || undefined}
                  className={`${BADGE} ${p.approximate ? BADGE_APPROX : BADGE_EXACT}`}
                >
                  {p.n}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
