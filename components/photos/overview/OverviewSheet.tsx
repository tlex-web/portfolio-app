import Link from 'next/link';
import { Fragment } from 'react';
import ContourField from '@/components/terrain/ContourField';
import SheetMargin from '@/components/terrain/SheetMargin';
import { overview } from '@/data/generated/overview';
import { type OverviewInput, overviewCss, summitKey } from '@/lib/photos/overview-layout';
import { regionHref } from '@/lib/photos/routes';
import { overviewSheetInput } from '@/lib/regions';
import { sheetMargin } from '@/lib/sheet-margin';

/** The sheet's container name: overviewCss writes every position as a query on it. */
const NAME = 'overview-sheet';

/**
 * The sheet box: the overview grid's 1200 x 872 ratio as a size container, so
 * the layout's 100cqw and 100cqh are its width S and height S x 872 / 1200.
 * The edge is a 1 px outline drawn inside the box (no layout space): a border
 * would make the content box about 0.55 px shorter than the ratio, and every
 * vertical position the 18-13 sweep measured at exactly 8 px would render
 * short (18-13's note on sheets; PlateSheet does the same).
 */
const SHEET =
  'relative aspect-[1200/872] overflow-hidden bg-surface outline-1 -outline-offset-1 outline-line [container-type:size]';

/**
 * The marker link box: 28 x 28 px (the 24 px number circle plus its 2 px
 * casing, overview-layout's MARKER), placed by the generated CSS. `before:`
 * widens the hit area to 44 x 44 px (UI-SPEC "Touch targets").
 */
const MARKER =
  "group/marker absolute flex size-7 cursor-pointer touch-manipulation items-center justify-center before:absolute before:-inset-2 before:content-['']";

/** The 24 px number circle, 2 px surface casing; accent on hover (and through the :has() sync). */
const DOT =
  'relative flex size-6 items-center justify-center rounded-full bg-ink font-mono text-sm leading-none font-semibold text-ink-inverse tabular-nums ring-2 ring-surface transition-colors duration-(--duration-fast) ease-erosion group-hover/marker:bg-accent';

/**
 * The region plate (wide tier): w-36 x 48 px, the inset ring takes no layout
 * space, so the box is exactly overview-layout's REGION_PLATE. Hidden on the
 * compact tier by the generated CSS.
 */
const PLATE =
  'absolute block h-12 w-36 rounded-sm bg-surface-raised px-2 py-1 text-left ring-1 ring-line-strong ring-inset transition-shadow duration-(--duration-fast) ease-erosion group-hover/marker:ring-ink-muted';

/** The 12 px summit triangle (the Home summit mark's look), its box placed by the generated CSS. */
const TRIANGLE = 'absolute size-3 bg-ink-muted [clip-path:polygon(50%_0,100%_100%,0_100%)]';

/** The summit label (wide tier): its width and height come from summitPlateSize through the CSS. */
const SUMMIT_PLATE = 'absolute rounded-sm bg-surface-raised px-2 py-1 whitespace-nowrap';

/**
 * The sheet's CSS, computed once per server process. overviewCss solves the
 * layout at every width from 312 to 1100 px (about 0.6 s), and /photos renders
 * per request (the CSP nonce), so recomputing it each time made every request
 * that slow; its input is static generated data, so the result never changes
 * while the process runs.
 */
let sheetCss: string | undefined;
function overviewSheetCss(input: OverviewInput): string {
  sheetCss ??= overviewCss(input, NAME);
  return sheetCss;
}

/**
 * The Alps overview sheet on /photos (REGION-01, REGION-06; D-01, D-02, D-04;
 * 18-UI-SPEC Contract 1 "Sheet", "Markers are pointer-only", "Sync between
 * list and map", "Overview sheet margin"). Server component, zero JS of its
 * own, no motion beyond colour changes.
 *
 * The whole overview at once (no crop, pan, zoom, tiles or runtime fetch):
 * - the 1,000 m contours as the overview SVG's mask over `bg-contour`
 *   (ContourField; no hillshade, the overview has none);
 * - one aria-hidden SVG with each region's sheet-index rectangle from its
 *   outline corners (1 px ink-muted, non-scaling, accent while active);
 * - each reference summit's 12 px triangle and, on the wide tier, its label;
 * - per region a numbered marker (1..N west to east, the list badges'
 *   numbers) joined to its rectangle by a 1 px leader and, on the wide tier,
 *   its name and photo count on a plate. The marker and plate are one link to
 *   the region page, pointer-only: tabIndex -1 and aria-hidden, because the
 *   region list beside the sheet is the keyboard, screen-reader and narrow
 *   screen path (RegionList).
 *
 * Every position comes from overviewCss (lib/photos/overview-layout.ts, 18-13)
 * as one server-rendered style element of container queries on this sheet,
 * so the server HTML is exact at every width and nothing relayouts on the
 * client. The CSP allows inline styles, and the CSS holds only numbers, the
 * region ids, the summit keys and fixed selectors (T-18-30, T-18-48). The same
 * CSS carries the list-map sync: one :has() per state on the page's
 * `[data-overview]` element, which holds this sheet and the region list.
 * Without :has() the rows and markers keep their own hover states and every
 * link still works.
 *
 * The data is server-only (overviewSheetInput, the overview contours,
 * sheetMargin): nothing here reaches a client chunk (T-18-47). Until the
 * contour mask decodes, or if it fails, the sheet shows bg-surface with every
 * rectangle, mark, label and link in place (UI E1 loading, error). Zero
 * regions throws in overviewSheetInput, so the build fails rather than ship an
 * empty sheet (UI E1/empty).
 *
 * The figure's figcaption is the overview's own sheet margin (18-11; REGION-06,
 * Contract 7): title and interval, extent, edition, the linked GLO-90 credit
 * (Tim's G1) and the Summits row. Below 640 px the sheet is full-bleed, so the
 * margin takes the container's 16 px gutters back.
 */
export default function OverviewSheet() {
  const input = overviewSheetInput();
  const css = overviewSheetCss(input);

  return (
    <section aria-labelledby="overview-map">
      <h2 id="overview-map" className="sr-only">
        Map
      </h2>
      <figure className="-mx-4 sm:mx-0">
        <div data-overview-sheet className={SHEET} style={{ containerName: NAME }}>
          <style>{css}</style>
          <ContourField
            sheet={{ assets: { contours: { overview: overview.contours.url } } }}
            lod="overview"
            className="absolute inset-0"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 block h-full w-full overflow-visible"
          >
            {input.regions.map((r) => (
              <polygon
                key={r.id}
                data-region-rect={r.id}
                points={r.corners.map((c) => `${c.u},${c.v}`).join(' ')}
                fill="none"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                className="stroke-ink-muted transition-colors duration-(--duration-fast) ease-erosion"
              />
            ))}
          </svg>
          <div aria-hidden="true">
            {input.summits.map((s) => {
              const key = summitKey(s.name);
              return (
                <Fragment key={key}>
                  <div data-summit-mark={key} className={TRIANGLE} />
                  <div data-summit-plate={key} className={SUMMIT_PLATE}>
                    <span className="block text-sm text-ink-muted">{s.name}</span>
                    <span className="block font-mono text-sm text-ink-muted tabular-nums">
                      {s.height}
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>
          {input.regions.map((r) => (
            <Link
              key={r.id}
              href={regionHref(r.id)}
              tabIndex={-1}
              aria-hidden="true"
              data-region-marker={r.id}
              className={MARKER}
            >
              <svg
                data-region-leader
                aria-hidden="true"
                className="pointer-events-none absolute min-h-px min-w-px overflow-visible text-ink-muted"
              >
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span data-region-dot className={DOT}>
                {r.number}
              </span>
              <span data-region-plate className={PLATE}>
                <span className="block text-sm font-semibold whitespace-nowrap text-ink">
                  {r.name}
                </span>
                <span className="block font-mono text-sm whitespace-nowrap text-ink-muted tabular-nums">
                  {r.count}
                </span>
              </span>
            </Link>
          ))}
        </div>
        <SheetMargin margin={sheetMargin('overview')} className="px-4 sm:px-0" />
      </figure>
    </section>
  );
}
