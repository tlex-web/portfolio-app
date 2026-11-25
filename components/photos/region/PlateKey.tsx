import type { PlatePin } from '@/lib/photos/plate-layout';

/** One key row: the plate pin plus the photo's title and altitude label (plain props). */
export type PlateKeyRow = PlatePin & { title: string; altitudeLabel: string };

/**
 * A key row: the same anchor as its badge on the plate. `relative` anchors the
 * 2 px accent bar that plateCss draws on `::before` while the row or its badge
 * is active (UI-SPEC "Sync between list and map"); min-h-11 keeps the 44 px
 * target and the title wraps (UI E4/overflow).
 */
const ROW =
  'relative -mx-2 flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-sm px-2 transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay';

/** The 24 px badge: the plate badge's look and number. */
const BADGE =
  'flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-sm leading-none font-semibold tabular-nums transition-colors duration-(--duration-fast) ease-erosion';
const BADGE_EXACT = 'bg-ink text-ink-inverse';
const BADGE_APPROX = 'border-2 border-dashed border-ink bg-surface text-ink';

/**
 * The plate's key list (REGION-02, D-08; 18-UI-SPEC Contract 2 "Facts and
 * plate"): the h2 'Map' and an ordered list of the plate's photos in the
 * sequence order (1 = lowest). Server component, zero JS.
 *
 * Each row is a native same-page anchor to the photo's figure,
 * `#photo-{slug}` (the li of SequenceFigure, tabIndex -1): the jump is
 * instant (P2 as drafted), lands the figure's top collar 16 px under the nav
 * through the global scroll-margin-top, moves the focus starting point into
 * it, never opens the lightbox, and works without JavaScript. The plate's
 * badges are pointer-only (tabIndex -1, aria-hidden), so these rows are the
 * keyboard and screen-reader path, in visual order.
 *
 * Each row shows the badge (aria-hidden: the list position gives the number),
 * the title and the altitude label. `data-key-row={slug}` and
 * `data-key-badge` are the hooks of the list-plate sync, which plateCss
 * emits as `:has()` rules (lib/photos/plate-layout.ts).
 */
export default function PlateKey({ pins }: { pins: readonly PlateKeyRow[] }) {
  return (
    <section aria-labelledby="region-map">
      <h2 id="region-map">Map</h2>
      <ol aria-label="Photographs on the map, lowest first" className="mt-4">
        {pins.map((p) => (
          <li key={p.slug}>
            <a href={`#photo-${p.slug}`} data-key-row={p.slug} className={ROW}>
              <span
                aria-hidden="true"
                data-key-badge
                data-approximate={p.approximate || undefined}
                className={`${BADGE} ${p.approximate ? BADGE_APPROX : BADGE_EXACT}`}
              >
                {p.n}
              </span>
              <span className="min-w-0 py-2">
                <span className="text-sm font-semibold text-ink">{p.title}</span>
                {' · '}
                <span className="font-mono text-sm whitespace-nowrap text-ink-muted">
                  {p.altitudeLabel}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
