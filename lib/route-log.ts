/**
 * The route log's pure functions (ROUTE-01, ROUTE-02, ROUTE-03; D-19, D-20;
 * 11-UI-SPEC "URL contract" and "RouteLog (Server) — the elevation axis").
 * Pure and import-free: keep it to erasable TypeScript and never add an import.
 *
 * The URL is the only source of filter state: `/roadmap?project=…&status=…`
 * in that canonical order, and All is the parameter left out. parseProject and
 * parseStatus whitelist the exact lowercase values and map everything else
 * (absent, empty, a wrong case, a padded value, a repeated parameter that Next
 * hands over as an array, any retired area) to All. routeLogHref rebuilds every
 * URL from the whitelisted enum values only, never from a visitor string, so
 * nothing unsanitised reaches a link or `router.replace` (T-11-10).
 *
 * The axis reads bottom to top as a climb (D-19): Base holds completed work,
 * Current camp the work in progress and Summit what is planned. A row's band
 * follows its status only; `order` sorts rows inside a band, highest first, so
 * DOM order equals visual order. The "last surveyed" date is the newest
 * completedAt across items and their v2.0 phases (D-20).
 *
 * `RouteLogItem` is declared structurally here; the zod contract in
 * data/schemas/roadmap.ts (11-08) must stay assignable to it.
 */

/** The three projects in segment order; equal to the project slugs. */
export const PROJECTS = ['portfolio', 'box', 'coin-flip'] as const;

export type LogProject = (typeof PROJECTS)[number];

/** The three statuses in band order, top (Summit) to bottom (Base). */
export const STATUSES = ['planned', 'in-progress', 'completed'] as const;

export type LogStatus = (typeof STATUSES)[number];

/** Project labels in the repositories' spelling (N1 default). */
export const PROJECT_LABELS: Record<LogProject, string> = {
  portfolio: 'Portfolio',
  box: 'box',
  'coin-flip': 'coin-flip',
};

export const STATUS_LABELS: Record<LogStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export type BandId = 'summit' | 'current-camp' | 'base';

export const BAND_LABELS: Record<BandId, string> = {
  summit: 'Summit',
  'current-camp': 'Current camp',
  base: 'Base',
};

/** Band order top to bottom, each with the one status it holds. */
const BAND_ORDER: readonly { id: BandId; status: LogStatus }[] = [
  { id: 'summit', status: 'planned' },
  { id: 'current-camp', status: 'in-progress' },
  { id: 'base', status: 'completed' },
];

/** One v2.0 phase inside the portfolio's v2.0 row (D-18). */
export interface LogPhase {
  n: number;
  name: string;
  status: LogStatus;
  completedAt?: string;
}

export interface RouteLogItem {
  id: string;
  title: string;
  description: string;
  area: LogProject;
  status: LogStatus;
  order: number;
  completedAt?: string;
  targetRelease?: string;
  phases?: readonly LogPhase[];
}

export interface LogFilter {
  project: LogProject | 'all';
  status: LogStatus | 'all';
}

export interface LogBand {
  id: BandId;
  status: LogStatus;
  items: RouteLogItem[];
}

export interface LogCounts {
  project: Record<LogProject | 'all', number>;
  status: Record<LogStatus | 'all', number>;
}

function isProject(v: unknown): v is LogProject {
  return typeof v === 'string' && (PROJECTS as readonly string[]).includes(v);
}

function isStatus(v: unknown): v is LogStatus {
  return typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
}

/** The project a `?project=` value selects: an exact match, else All. */
export function parseProject(v: unknown): LogProject | 'all' {
  return isProject(v) ? v : 'all';
}

/** The status a `?status=` value selects: an exact match, else All. */
export function parseStatus(v: unknown): LogStatus | 'all' {
  return isStatus(v) ? v : 'all';
}

function matches(
  item: RouteLogItem,
  project: LogFilter['project'],
  status: LogFilter['status']
): boolean {
  return (
    (project === 'all' || item.area === project) && (status === 'all' || item.status === status)
  );
}

/** The items a filter keeps, in input order. */
export function filterItems(items: readonly RouteLogItem[], filter: LogFilter): RouteLogItem[] {
  return items.filter((item) => matches(item, filter.project, filter.status));
}

/**
 * Segment counts (ROUTE-02): each Project segment is counted within the
 * current Status value and each Status segment within the current Project
 * value, so a combination with no entries shows as 0.
 */
export function countsFor(items: readonly RouteLogItem[], filter: LogFilter): LogCounts {
  const count = (project: LogFilter['project'], status: LogFilter['status']) =>
    items.filter((item) => matches(item, project, status)).length;
  return {
    project: {
      all: count('all', filter.status),
      portfolio: count('portfolio', filter.status),
      box: count('box', filter.status),
      'coin-flip': count('coin-flip', filter.status),
    },
    status: {
      all: count(filter.project, 'all'),
      planned: count(filter.project, 'planned'),
      'in-progress': count(filter.project, 'in-progress'),
      completed: count(filter.project, 'completed'),
    },
  };
}

/**
 * The bands top to bottom (D-19): Summit, Current camp, Base. Each band holds
 * the items of its status sorted by `order` descending; an empty band is
 * left out. The input is not reordered.
 */
export function bands(items: readonly RouteLogItem[]): LogBand[] {
  return BAND_ORDER.map(({ id, status }) => ({
    id,
    status,
    items: items.filter((item) => item.status === status).sort((a, b) => b.order - a.order),
  })).filter((band) => band.items.length > 0);
}

/**
 * The canonical URL of a filter: `/roadmap`, then `?project=` before
 * `&status=`, with an All value left out. Values are re-checked against the
 * whitelists, so a value that bypassed the types is dropped, never echoed.
 */
export function routeLogHref(filter: LogFilter): string {
  const params: string[] = [];
  if (isProject(filter.project)) params.push(`project=${filter.project}`);
  if (isStatus(filter.status)) params.push(`status=${filter.status}`);
  return params.length === 0 ? '/roadmap' : `/roadmap?${params.join('&')}`;
}

/** The newest completedAt across items and their nested phases (D-20), or null. */
export function newestCompletedAt(items: readonly RouteLogItem[]): string | null {
  let newest: string | null = null;
  const consider = (date: string | undefined) => {
    if (date !== undefined && (newest === null || date > newest)) newest = date;
  };
  for (const item of items) {
    consider(item.completedAt);
    for (const phase of item.phases ?? []) consider(phase.completedAt);
  }
  return newest;
}

/** Everything the page needs for one filter: bands of the filtered items, counts, shown and total. */
export function routeLogView(
  items: readonly RouteLogItem[],
  filter: LogFilter
): { bands: LogBand[]; counts: LogCounts; shown: number; total: number } {
  const filtered = filterItems(items, filter);
  return {
    bands: bands(filtered),
    counts: countsFor(items, filter),
    shown: filtered.length,
    total: items.length,
  };
}
