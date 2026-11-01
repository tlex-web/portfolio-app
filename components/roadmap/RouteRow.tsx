import Link from 'next/link';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { formatLogDate } from '@/lib/log-date';
import {
  PROJECT_LABELS,
  STATUS_LABELS,
  routeLogHref,
  type LogPhase,
  type LogStatus,
  type RouteLogItem,
} from '@/lib/route-log';

/**
 * One route-log row (ROUTE-01, ROUTE-03; D-18, D-19; 11-UI-SPEC "RouteLog"
 * Row, Row tick and v2.0 entry, and "Next steps" for the compact variant).
 * Server Component: no client directive, no motion.
 *
 * `log` is the row on the elevation axis: an `li` whose id is the item id (the
 * `#id` anchor target), the title, a meta line of unbroken units, the
 * always-visible description (§I #3), an aria-hidden tick and status node on
 * the axis, and, for a row with phases, a native details disclosure that
 * works without JS. Priority is never shown (§I #2); order replaces it.
 *
 * `compact` is the "Next steps" row on a case study: the whole row is one link
 * to the filtered route log at this row, with the title and a status meta line.
 *
 * The tick reaches back to the axis through `--axis-x`, the distance from the
 * row's left edge to the axis line, which RouteLog sets per band.
 */

const EN_DASH = '–';

/** The status node on the axis: shape and fill carry the state (D-19). */
const NODE_CLASS: Record<LogStatus, string> = {
  completed: 'bg-ink-muted',
  'in-progress': 'bg-ink',
  planned: 'border border-ink-muted bg-surface',
};

/** Unbroken units joined by an aria-hidden ' · ', so a line wraps only between units. */
function Units({ units }: { units: readonly string[] }) {
  return units.map((unit, i) => (
    <span key={`${i}-${unit}`}>
      {i > 0 ? <span aria-hidden="true"> · </span> : null}
      <span className="whitespace-nowrap">{unit}</span>
    </span>
  ));
}

/** `{Project}` · `{target}` (planned or in progress, only if present) or `Completed {date}`. */
function logMeta(item: RouteLogItem): string[] {
  const units = [PROJECT_LABELS[item.area]];
  if (item.status === 'completed') {
    units.push(item.completedAt ? `Completed ${formatLogDate(item.completedAt)}` : 'Completed');
  } else if (item.targetRelease) {
    units.push(item.targetRelease);
  }
  return units;
}

/** `{Status}` (plus `{target}` only if present, G7) for the compact row. */
function compactMeta(item: RouteLogItem): string[] {
  const units = [STATUS_LABELS[item.status]];
  if (item.targetRelease) units.push(item.targetRelease);
  return units;
}

/** The last unit of a phase line: its date, else its status in words. */
function phaseState(phase: LogPhase): string {
  if (phase.status === 'completed' && phase.completedAt) return formatLogDate(phase.completedAt);
  return STATUS_LABELS[phase.status];
}

function Phases({ phases }: { phases: readonly LogPhase[] }) {
  const rising = [...phases].sort((a, b) => a.n - b.n);
  const first = rising[0].n;
  const last = rising[rising.length - 1].n;
  return (
    <details className="group mt-2">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        {first === last ? `Phase ${first}` : `Phases ${first}${EN_DASH}${last}`}
        <CaretDownIcon size={20} aria-hidden="true" className="group-open:rotate-180" />
      </summary>
      <ol className="mt-2 flex flex-col gap-1 font-mono text-sm text-ink-muted">
        {rising.map((phase) => (
          <li key={phase.n}>
            <Units units={[`Phase ${phase.n}`, phase.name, phaseState(phase)]} />
          </li>
        ))}
      </ol>
    </details>
  );
}

export default function RouteRow({
  item,
  variant,
}: {
  item: RouteLogItem;
  variant: 'log' | 'compact';
}) {
  if (variant === 'compact') {
    return (
      <li>
        <Link
          href={`${routeLogHref({ project: item.area, status: 'all' })}#${item.id}`}
          className="flex min-h-11 flex-col justify-center border-b border-line py-4 hover:bg-surface-raised"
        >
          <span className="text-base font-semibold text-ink">{item.title}</span>
          <span data-route-meta className="mt-1 font-mono text-sm text-ink-muted">
            <Units units={compactMeta(item)} />
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li
      id={item.id}
      className="relative border-b border-line py-4 last:border-b-0 target:bg-surface-overlay"
    >
      <span data-row-tick aria-hidden="true">
        <span className="absolute top-7 left-[calc(var(--axis-x,20px)*-1)] h-px w-4 bg-line-strong" />
        <span
          className={`absolute top-6 left-[calc(var(--axis-x,20px)*-1_-_4px)] size-2 ${NODE_CLASS[item.status]}`}
        />
      </span>
      <h3 className="text-base font-semibold text-ink">{item.title}</h3>
      <p data-route-meta className="mt-1 font-mono text-sm text-ink-muted">
        <Units units={logMeta(item)} />
      </p>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">{item.description}</p>
      {item.phases && item.phases.length > 0 ? <Phases phases={item.phases} /> : null}
    </li>
  );
}
