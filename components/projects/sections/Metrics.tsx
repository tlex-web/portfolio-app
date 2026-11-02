import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr';
import type { Project } from '@/data/types';

type Tile = NonNullable<Project['metrics']>['tiles'][number];

/**
 * Panel columns per tile count (G1), written out literally so Tailwind finds
 * them (G11): never more columns than tiles. One tile is full width, two
 * never sit in a three-column track, three or more use two columns from
 * 640 px and three from 1024 px.
 */
const GRID: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

/**
 * The last tile's span, so an orphan fills the rest of its row and no
 * `bg-line` cell is ever exposed. Keyed by how many tiles the last row holds:
 * in the two-column track (odd count: one, so span 2) and in the three-column
 * track (remainder 1: span 3; remainder 2: span 2; full row: reset to 1 when
 * the sm span would otherwise carry over). Below three tiles there is no
 * three-column track, so nothing spans. Resulting table:
 *   3 tiles: third  `sm:col-span-2 lg:col-span-1`
 *   4 tiles: fourth `lg:col-span-3`
 *   5 tiles: fifth  `sm:col-span-2 lg:col-span-2`
 */
const SM_ORPHAN = 'sm:col-span-2';
const LG_REST: Record<0 | 1 | 2, string> = {
  0: 'lg:col-span-1',
  1: 'lg:col-span-3',
  2: 'lg:col-span-2',
};

function lastTileSpan(n: number): string {
  if (n < 3) return '';
  const sm = n % 2 === 1 ? SM_ORPHAN : '';
  const rest = (n % 3) as 0 | 1 | 2;
  const lg = rest === 0 && !sm ? '' : LG_REST[rest];
  return [sm, lg].filter(Boolean).join(' ');
}

/**
 * The Metrics slot (ENG-04, D-09, D-28; 11-UI-SPEC "Metrics — instrument
 * panel"). A Server Component: one instrument panel, a `dl` whose 1 px rules
 * are the `bg-line` showing through `gap-px`. Each tile is a label, a Mono
 * tabular value and its required context line; a box context line may end
 * with a prose link to its public source (coin-flip tiles never carry one,
 * D-23). Values are final on first paint: no state, no count-up. Only audited
 * tiles reach the data, so a project without one renders no section.
 * Each source link's accessible name is the aria-label 'Source for {tile
 * label}', so links that share a page are still told apart (11-UAT G-11-4)
 * and the name begins with the visible word 'Source', so label in name holds
 * for speech input (12 D-24, 11-UI-REVIEW Pillar 1). An aria-label needs no
 * hidden text, so jsdom and the browser compute the same name and the visible
 * line is unchanged.
 */
export default function Metrics({
  id,
  label,
  tiles,
}: {
  id: string;
  label: string;
  tiles: Tile[];
}) {
  const n = tiles.length;
  if (n === 0) return null;
  const titleId = `${id}-title`;
  const span = lastTileSpan(n);

  return (
    <section id={id} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-heading text-balance">
        {label}
      </h2>
      <dl
        className={`mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line ${GRID[Math.min(n, 3) as 1 | 2 | 3]}`}
      >
        {tiles.map((tile, i) => (
          <div
            key={tile.key}
            className={`min-w-0 bg-surface-raised p-6 ${i === n - 1 ? span : ''}`.trim()}
          >
            <dt className="text-sm text-ink-muted">{tile.label}</dt>
            <dd className="mt-1 font-mono text-heading font-semibold text-ink tabular-nums wrap-anywhere">
              {tile.value}
            </dd>
            <dd className="mt-1 text-sm text-ink-muted">
              {tile.context}
              {tile.sourceUrl && (
                <>
                  {' '}
                  <a
                    href={tile.sourceUrl}
                    aria-label={`Source for ${tile.label}`}
                    className="inline-flex items-center gap-1 whitespace-nowrap underline decoration-1 underline-offset-4 transition-colors duration-(--duration-fast) ease-erosion hover:text-ink"
                  >
                    Source
                    <ArrowSquareOutIcon size={16} aria-hidden="true" />
                  </a>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
