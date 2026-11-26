import type { PhotoImage } from '@/lib/photos/view-model';
import { regionHref } from '@/lib/photos/routes';

/** One region row's plain props, built on the server by the /photos page. */
export type RegionListRow = {
  /** The registry id; the row links to regionHref(id). */
  id: string;
  /** The 1-based place west to east (regionNumber), shown in the badge. */
  number: number;
  /** regionHeading: 'Zermatt, Switzerland'. */
  heading: string;
  /** regionCardFacts' count: '7 photographs'. */
  count: string;
  /** regionCardFacts' range ('1,617–2,928 m', or 'ground 820–880 m' when all aerial) and years. */
  range: string;
  years: string;
  /** The region cover's tile derivatives (regionCover(id).tile). */
  cover: PhotoImage;
};

/**
 * A region row: the link box. `relative` anchors the 2 px accent bar drawn on
 * `::before` while the row is hovered or keyboard-focused (UI-SPEC "Sync
 * between list and map"); the 96 px thumbnail keeps every row above 44 px.
 * The global focus ring marks focus; hover only adds colour (hover: is
 * pointer-only in Tailwind 4, so touch never sticks in the active look).
 */
const ROW = [
  'group relative -mx-2 flex cursor-pointer touch-manipulation gap-4 rounded-sm p-2',
  'transition-colors duration-(--duration-fast) ease-erosion',
  'hover:bg-surface-overlay focus-visible:bg-surface-overlay',
  'before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-accent before:opacity-0',
  'hover:before:opacity-100 focus-visible:before:opacity-100',
].join(' ');

/** The 24 px badge: the overview marker's look and number; accent while its row is active. */
const BADGE = [
  'flex size-6 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm leading-none font-semibold text-ink-inverse tabular-nums',
  'transition-colors duration-(--duration-fast) ease-erosion',
  'group-hover:bg-accent group-focus-visible:bg-accent',
].join(' ');

/**
 * The overview's region list (REGION-01, D-01, D-02; 18-UI-SPEC Contract 1
 * "Region list", UI E2). Server component, zero JS: the h2 'Regions' over an
 * ordered list in the order it is given (the page passes regionsWestToEast()),
 * one row per region. The list is the keyboard, screen-reader and narrow-screen
 * path into every region; the overview sheet's markers (18-23) are
 * pointer-only.
 *
 * Each row is one link to the region page, `data-region-row={id}`, holding:
 * the cover thumbnail, a `<picture>` of the tile derivatives 96 px wide in a
 * box of its true ratio (never cropped; Ortler's portrait cover is 96 x 128),
 * `bg-surface-overlay` behind it, width and height set so nothing shifts while
 * it loads, and `alt=""` because the row text names the region; then line 1,
 * the aria-hidden badge and the heading, line 2 the count, line 3
 * '{range} · {years}' as nowrap parts, which wraps once at ' · ' in a narrow
 * column and never truncates. The row's accessible name is its text:
 * 'Zermatt, Switzerland 7 photographs 1,617–2,928 m · 2019–2024'.
 *
 * Loading (a recorded deviation from the UI-SPEC's per-breakpoint wording):
 * `loading="eager"` with `fetchPriority="low"` at every width, because an
 * attribute cannot vary by breakpoint. Three small tiles keep the lg list,
 * which is above the fold, complete, and the low priority keeps them behind
 * the overview sheet and the fonts. A failed thumbnail keeps its reserved box
 * (UI E2/error); the row text and the link still work.
 *
 * @throws RangeError for zero rows: zero regions fails the build (UI E2/empty).
 */
export default function RegionList({ rows }: { rows: readonly RegionListRow[] }) {
  if (rows.length === 0) throw new RangeError('RegionList: there are no regions');

  return (
    <section aria-labelledby="overview-list">
      <h2 id="overview-list">Regions</h2>
      <ol aria-label="Regions, west to east" className="mt-4 flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id}>
            <a href={regionHref(r.id)} data-region-row={r.id} className={ROW}>
              <span
                data-region-thumb
                className="block w-24 shrink-0 self-start overflow-hidden rounded-sm bg-surface-overlay"
                style={{ aspectRatio: `${r.cover.width} / ${r.cover.height}` }}
              >
                <picture className="block h-full w-full">
                  <source type="image/avif" srcSet={r.cover.srcSetAvif} sizes="96px" />
                  <source type="image/webp" srcSet={r.cover.srcSetWebp} sizes="96px" />
                  {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
                  <img
                    src={r.cover.src}
                    width={r.cover.width}
                    height={r.cover.height}
                    alt=""
                    loading="eager"
                    fetchPriority="low"
                    decoding="async"
                    sizes="96px"
                    className="block h-full w-full object-cover"
                  />
                </picture>
              </span>
              <span className="block min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" data-region-badge className={BADGE}>
                    {r.number}
                  </span>
                  <span data-region-name className="text-base font-semibold text-ink">
                    {r.heading}
                  </span>
                </span>
                <span
                  data-region-count
                  className="mt-1 block font-mono text-sm text-ink-muted tabular-nums"
                >
                  {r.count}
                </span>
                <span
                  data-region-facts
                  className="block font-mono text-sm text-ink-muted tabular-nums"
                >
                  <span className="whitespace-nowrap">{r.range}</span>
                  {' · '}
                  <span className="whitespace-nowrap">{r.years}</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
