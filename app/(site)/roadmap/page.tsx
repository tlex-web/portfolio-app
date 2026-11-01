import type { Metadata } from 'next';
import Link from 'next/link';
import RouteLog from '@/components/roadmap/RouteLog';
import { roadmapItems, surveyedAt } from '@/data/roadmap';
import { formatLogDate } from '@/lib/log-date';
import {
  BAND_LABELS,
  PROJECT_LABELS,
  STATUS_LABELS,
  parseProject,
  parseStatus,
  routeLogView,
  type LogFilter,
} from '@/lib/route-log';

export const metadata: Metadata = { title: 'Roadmap' };

const INTRO =
  "What I've finished, what I'm working on and what comes next, for this site, box and coin-flip.";

const CUE =
  'inline-flex min-h-11 items-center gap-1 text-base text-ink-muted underline decoration-1 underline-offset-4 transition-colors duration-(--duration-fast) ease-erosion hover:text-ink';

/** The set filters as their enum labels, never the raw parameter (T-11-17). */
function filterLabels(filter: LogFilter): string[] {
  const labels: string[] = [];
  if (filter.project !== 'all') labels.push(PROJECT_LABELS[filter.project]);
  if (filter.status !== 'all') labels.push(STATUS_LABELS[filter.status]);
  return labels;
}

/**
 * /roadmap, the route log (ROUTE-01, ROUTE-02 server half, ROUTE-03; D-17 to
 * D-20; 11-UI-SPEC "/roadmap Route Log"). A Server Component: the URL is the
 * only source of filter state, so `?project=` and `?status=` come from the
 * awaited searchParams through the 11-05 whitelists, and anything else
 * (absent, a wrong case, a retired area, a repeated parameter) means All.
 *
 * The header band carries the "Route log surveyed" kicker from Tim's
 * surveyedAt (D-20), the h1 (the nav label), the approved intro, the status
 * line (a role=status that stays mounted, so 11-10's filter changes are
 * announced as one phrase) and jump links to the bands that render, with
 * their counts. The filters from 11-10 mount between the intro and the status
 * line. Below it is the elevation axis (RouteLog) of Tim's confirmed rows, or,
 * for a filter combination with no entries (reachable only by a typed URL),
 * a dashed plate whose sentence is built from the enum labels only and whose
 * primary link replaces the history entry and keeps the scroll position.
 * Nothing on this page animates.
 */
export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter: LogFilter = { project: parseProject(sp.project), status: parseStatus(sp.status) };
  const view = routeLogView(roadmapItems, filter);
  const status =
    view.shown === view.total
      ? `Showing ${view.total} entries`
      : `Showing ${view.shown} of ${view.total} entries`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-16 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-line pt-8 pb-6">
        <div>
          <p className="mb-2 font-mono text-sm text-ink-muted">
            Route log surveyed {formatLogDate(surveyedAt)}
          </p>
          <h1>Roadmap</h1>
        </div>
        <p className="max-w-prose text-base text-ink-muted">{INTRO}</p>
        <p role="status" aria-atomic="true" className="font-mono text-sm text-ink-muted">
          {status}
        </p>
        {view.bands.length > 0 ? (
          <ul aria-label="Bands" className="flex flex-wrap gap-x-6">
            {view.bands.map((band) => (
              <li key={band.id}>
                <a href={`#${band.id}`} className={CUE}>
                  {BAND_LABELS[band.id]} <span className="tabular-nums">{band.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {view.shown > 0 ? (
        <div className="mt-8">
          <RouteLog bands={view.bands} />
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-line-strong p-8">
          <h2>No entries on this route yet</h2>
          <p className="mt-2 max-w-prose text-base text-ink-muted">
            Nothing matches {filterLabels(filter).join(' and ')}. Show every entry, or pick another
            filter.
          </p>
          <Link
            href="/roadmap"
            replace
            scroll={false}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm bg-accent px-6 text-base font-semibold text-ink-inverse hover:bg-accent-hover"
          >
            Show all entries
          </Link>
        </div>
      )}

      <div className="mt-16 border-t border-line pt-8">
        <p className="text-base text-ink-muted">
          Want to talk about something on this list? <Link href="/contact">Get in touch</Link>.
        </p>
      </div>
    </div>
  );
}
