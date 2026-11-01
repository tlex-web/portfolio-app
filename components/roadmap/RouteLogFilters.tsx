'use client';

import { useId, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROJECTS,
  PROJECT_LABELS,
  STATUSES,
  STATUS_LABELS,
  routeLogHref,
  type LogCounts,
  type LogFilter,
} from '@/lib/route-log';

/** Every segment (10 View switcher "Segment", centred for the 2 × 2 track); 44 px tall. */
const SEGMENT =
  'relative inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-sm px-4 text-base font-semibold transition-colors duration-(--duration-fast) ease-erosion';

/** Unselected: muted ink on the raised track; hover lifts it to the overlay and ink. */
const UNSELECTED = 'cursor-pointer text-ink-muted hover:bg-surface-overlay hover:text-ink';

/** Selected: overlay and ink plus the 2 px accent bar, so the state never rests on colour alone. */
const SELECTED =
  'cursor-pointer bg-surface-overlay text-ink after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:bg-accent';

/**
 * Zero count and not pressed: dimmed, no hover change, still focusable and announced.
 * Used instead of UNSELECTED, never on top of it, so no two hover or cursor utilities compete.
 */
const DISABLED =
  'cursor-not-allowed text-ink-muted opacity-50 hover:bg-transparent hover:text-ink-muted';

/** The track: 2 × 2 below 640 px (one row would need about 430 px), one row from 640 (§I #10). */
const TRACK =
  'mt-2 grid grid-cols-2 gap-1 rounded-sm border border-line-strong bg-surface-raised p-1 sm:inline-flex';

const GROUP_LABEL = 'text-sm font-semibold text-ink-muted';

interface Segment {
  key: string;
  label: string;
  count: number;
  next: LogFilter;
  pressed: boolean;
}

/**
 * The route log's Project and Status filters in the /roadmap header band
 * (ROUTE-02, 10 D-14; 11-RESEARCH "Pattern 1"; 11-UI-SPEC "RouteLogFilters").
 *
 * Two toggle groups, not radiogroups: each a `role="group"` named by its
 * visible label through `aria-labelledby`, holding four `aria-pressed`
 * buttons (All · Portfolio · box · coin-flip and All · Planned · In progress
 * · Completed). Tab reaches each segment and Enter or Space presses it; there
 * is no arrow-key roving. Each segment shows its label and a Mono count plus
 * an sr-only " entries", so its name reads "coin-flip 3 entries". The count is
 * the number of entries the segment would show under the other group's
 * current value (countsFor on the server).
 *
 * The URL is the only source of filter state: the island receives the parsed
 * `filter` and `counts` as props and never reads the URL itself. A press flips
 * `aria-pressed` at once (useOptimistic inside startTransition) and calls the
 * router's replace with scrolling off, so filtering adds no history entry and
 * Back leaves /roadmap; the previous list stays on screen until the server
 * render swaps in, with no skeleton, spinner or "Updating…" text. Every href
 * comes from routeLogHref over the whitelisted enum values, never from a
 * visitor string (T-11-23, the Next warning on untrusted URLs).
 *
 * A zero-count segment is `aria-disabled="true"`, dimmed and inert but stays
 * focusable and announced; the pressed segment is never disabled, even when a
 * hand-typed URL selects a combination with no entries. Pressing the pressed
 * segment does nothing.
 */
export default function RouteLogFilters({
  filter,
  counts,
}: {
  filter: LogFilter;
  counts: LogCounts;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(filter);
  const projectLabelId = useId();
  const statusLabelId = useId();

  const press = (next: LogFilter, disabled: boolean) => {
    if (disabled) return;
    if (next.project === optimistic.project && next.status === optimistic.status) return;
    startTransition(() => {
      setOptimistic(next);
      router.replace(routeLogHref(next), { scroll: false });
    });
  };

  const projectSegments: Segment[] = (['all', ...PROJECTS] as const).map((p) => ({
    key: p,
    label: p === 'all' ? 'All' : PROJECT_LABELS[p],
    count: counts.project[p],
    next: { project: p, status: optimistic.status },
    pressed: optimistic.project === p,
  }));

  const statusSegments: Segment[] = (['all', ...STATUSES] as const).map((s) => ({
    key: s,
    label: s === 'all' ? 'All' : STATUS_LABELS[s],
    count: counts.status[s],
    next: { project: optimistic.project, status: s },
    pressed: optimistic.status === s,
  }));

  const groups = [
    { name: 'Project', labelId: projectLabelId, segments: projectSegments },
    { name: 'Status', labelId: statusLabelId, segments: statusSegments },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
      {groups.map((g) => (
        <div key={g.name}>
          <p id={g.labelId} className={GROUP_LABEL}>
            {g.name}
          </p>
          <div role="group" aria-labelledby={g.labelId} className={TRACK}>
            {g.segments.map((s) => {
              const disabled = s.count === 0 && !s.pressed;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={s.pressed}
                  aria-disabled={disabled ? true : undefined}
                  className={`${SEGMENT} ${s.pressed ? SELECTED : disabled ? DISABLED : UNSELECTED}`}
                  onClick={() => press(s.next, disabled)}
                >
                  {s.label}{' '}
                  <span className="font-mono text-sm">{s.count}</span>
                  <span className="sr-only"> entries</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
