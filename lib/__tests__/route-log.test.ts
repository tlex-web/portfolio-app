/**
 * The route log's pure functions (ROUTE-01, ROUTE-02, ROUTE-03; D-19, D-20;
 * 11-UI-SPEC "URL contract"). The URL is the only source of filter state:
 * `?project=` and `?status=` take exact lowercase whitelisted values, an absent
 * or unknown value means All, and every href is rebuilt from the whitelists in
 * the canonical `?project=…&status=…` order (T-11-10).
 */
import {
  BAND_LABELS,
  PROJECTS,
  PROJECT_LABELS,
  STATUSES,
  STATUS_LABELS,
  bands,
  countsFor,
  filterItems,
  newestCompletedAt,
  parseProject,
  parseStatus,
  routeLogHref,
  routeLogView,
  type RouteLogItem,
} from '@/lib/route-log';

function item(over: Partial<RouteLogItem> & Pick<RouteLogItem, 'id' | 'area' | 'status' | 'order'>): RouteLogItem {
  return { title: `Title ${over.id}`, description: `Description ${over.id}`, ...over };
}

/** Orders 1..7 across all three statuses and projects; the in-progress row has the lowest order. */
const ITEMS: readonly RouteLogItem[] = [
  item({ id: 'a', area: 'portfolio', status: 'completed', order: 2, completedAt: '2026-08-09' }),
  item({ id: 'b', area: 'box', status: 'completed', order: 3 }),
  item({ id: 'c', area: 'coin-flip', status: 'completed', order: 5, completedAt: '2026-03-14' }),
  item({ id: 'd', area: 'box', status: 'in-progress', order: 1 }),
  item({ id: 'e', area: 'portfolio', status: 'planned', order: 4 }),
  item({ id: 'f', area: 'coin-flip', status: 'planned', order: 7, targetRelease: 'v1.1' }),
  item({ id: 'g', area: 'box', status: 'completed', order: 6 }),
];

const BAD_INPUTS: readonly [string, unknown][] = [
  ['undefined', undefined],
  ['an empty string', ''],
  ['a wrong case', 'BOX'],
  ['a repeated parameter', ['box']],
  ['a number', 1],
  ['null', null],
  ['an unknown value', 'other'],
  ['a retired area', 'cli'],
  ['another retired area', 'webshop'],
  ['a padded value', 'box '],
];

describe('whitelists and labels', () => {
  it('lists the three projects and three statuses', () => {
    expect(PROJECTS).toEqual(['portfolio', 'box', 'coin-flip']);
    expect(STATUSES).toEqual(['planned', 'in-progress', 'completed']);
  });

  it('labels projects in the repositories’ spelling, statuses and bands for the log', () => {
    expect(PROJECT_LABELS).toEqual({ portfolio: 'Portfolio', box: 'box', 'coin-flip': 'coin-flip' });
    expect(STATUS_LABELS).toEqual({
      planned: 'Planned',
      'in-progress': 'In progress',
      completed: 'Completed',
    });
    expect(BAND_LABELS).toEqual({
      summit: 'Summit',
      'current-camp': 'Current camp',
      base: 'Base',
    });
  });
});

describe('parseProject (absent or unknown = All)', () => {
  it.each(BAD_INPUTS)('returns all for %s', (_, value) => {
    expect(parseProject(value)).toBe('all');
  });

  it.each(['portfolio', 'box', 'coin-flip'] as const)('returns %s for itself', (project) => {
    expect(parseProject(project)).toBe(project);
  });
});

describe('parseStatus (absent or unknown = All)', () => {
  it.each([
    ...BAD_INPUTS,
    ['a wrong-case status', 'Planned'],
    ['a status with a space', 'in progress'],
    ['a padded status', 'completed '],
  ] as [string, unknown][])('returns all for %s', (_, value) => {
    expect(parseStatus(value)).toBe('all');
  });

  it.each(['planned', 'in-progress', 'completed'] as const)('returns %s for itself', (status) => {
    expect(parseStatus(status)).toBe(status);
  });
});

describe('routeLogHref (canonical order, All drops the parameter)', () => {
  it('gives All and All the bare /roadmap', () => {
    expect(routeLogHref({ project: 'all', status: 'all' })).toBe('/roadmap');
  });

  it('carries only the project when the status is All', () => {
    expect(routeLogHref({ project: 'box', status: 'all' })).toBe('/roadmap?project=box');
  });

  it('carries only the status when the project is All', () => {
    expect(routeLogHref({ project: 'all', status: 'planned' })).toBe('/roadmap?status=planned');
  });

  it('puts project before status', () => {
    expect(routeLogHref({ project: 'coin-flip', status: 'planned' })).toBe(
      '/roadmap?project=coin-flip&status=planned',
    );
  });

  it('never emits a value outside the whitelists for any parsed input', () => {
    const allowed = new Set([
      '/roadmap',
      ...PROJECTS.map((p) => `/roadmap?project=${p}`),
      ...STATUSES.map((s) => `/roadmap?status=${s}`),
      ...PROJECTS.flatMap((p) => STATUSES.map((s) => `/roadmap?project=${p}&status=${s}`)),
    ]);
    const inputs: unknown[] = [...BAD_INPUTS.map(([, v]) => v), ...PROJECTS, ...STATUSES, '<script>', '&status=x'];
    for (const p of inputs) {
      for (const s of inputs) {
        expect(allowed.has(routeLogHref({ project: parseProject(p), status: parseStatus(s) }))).toBe(true);
      }
    }
  });

  it('drops a value that bypassed the types instead of echoing it', () => {
    const forged = { project: 'x&y', status: '<b>' } as unknown as Parameters<typeof routeLogHref>[0];
    expect(routeLogHref(forged)).toBe('/roadmap');
  });
});

describe('filterItems', () => {
  it('keeps every item for All and All', () => {
    expect(filterItems(ITEMS, { project: 'all', status: 'all' })).toHaveLength(7);
  });

  it('keeps the items matching both the project and the status', () => {
    expect(filterItems(ITEMS, { project: 'box', status: 'completed' }).map((i) => i.id)).toEqual(['b', 'g']);
  });
});

describe('bands (D-19)', () => {
  it('returns Summit, Current camp and Base top to bottom', () => {
    expect(bands(ITEMS).map((b) => b.id)).toEqual(['summit', 'current-camp', 'base']);
    expect(bands(ITEMS).map((b) => b.status)).toEqual(['planned', 'in-progress', 'completed']);
  });

  it('sorts each band by order descending', () => {
    expect(bands(ITEMS).map((b) => b.items.map((i) => i.order))).toEqual([[7, 4], [1], [6, 5, 3, 2]]);
  });

  it('omits a band with no items', () => {
    const noPlanned = ITEMS.filter((i) => i.status !== 'planned');
    expect(bands(noPlanned).map((b) => b.id)).toEqual(['current-camp', 'base']);
    expect(bands([])).toEqual([]);
  });

  it('places an item by its status only, never by its order', () => {
    const current = bands(ITEMS).find((b) => b.id === 'current-camp');
    expect(current?.items.map((i) => i.id)).toEqual(['d']);
    expect(Math.min(...ITEMS.map((i) => i.order))).toBe(1);
  });

  it('does not reorder the input', () => {
    const before = ITEMS.map((i) => i.id);
    bands(ITEMS);
    expect(ITEMS.map((i) => i.id)).toEqual(before);
  });
});

describe('countsFor (each group counted within the other group’s value)', () => {
  it('counts statuses inside the chosen project and projects inside All statuses', () => {
    const counts = countsFor(ITEMS, { project: 'box', status: 'all' });
    expect(counts.status).toEqual({ all: 3, planned: 0, 'in-progress': 1, completed: 2 });
    expect(counts.project).toEqual({ all: 7, portfolio: 2, box: 3, 'coin-flip': 2 });
  });

  it('shows a zero for a project with no entry in the chosen status', () => {
    const counts = countsFor(ITEMS, { project: 'all', status: 'planned' });
    expect(counts.project).toEqual({ all: 2, portfolio: 1, box: 0, 'coin-flip': 1 });
  });

  it('gives the in-progress box count when status is in progress', () => {
    const counts = countsFor(
      ITEMS.filter((i) => i.area !== 'box'),
      { project: 'all', status: 'in-progress' },
    );
    expect(counts.project.box).toBe(0);
    expect(counts.project.all).toBe(0);
  });
});

describe('newestCompletedAt (D-20: includes phase dates)', () => {
  it('returns the newest phase date when it is newer than every item date', () => {
    const withPhases: RouteLogItem[] = [
      ...ITEMS,
      item({
        id: 'v2',
        area: 'portfolio',
        status: 'in-progress',
        order: 8,
        phases: [
          { n: 7, name: 'Foundation', status: 'completed', completedAt: '2026-06-01' },
          { n: 10, name: 'Photography', status: 'completed', completedAt: '2026-10-26' },
          { n: 11, name: 'Engineering', status: 'in-progress' },
        ],
      }),
    ];
    expect(newestCompletedAt(withPhases)).toBe('2026-10-26');
  });

  it('returns the newest item date when there are no phases', () => {
    expect(newestCompletedAt(ITEMS)).toBe('2026-08-09');
  });

  it('returns null when nothing carries a date', () => {
    expect(newestCompletedAt(ITEMS.filter((i) => !i.completedAt))).toBeNull();
    expect(newestCompletedAt([])).toBeNull();
  });
});

describe('routeLogView', () => {
  it('reports the filtered count as shown and every item as total', () => {
    const view = routeLogView(ITEMS, { project: 'box', status: 'all' });
    expect(view.shown).toBe(3);
    expect(view.total).toBe(7);
    expect(view.bands.map((b) => b.id)).toEqual(['current-camp', 'base']);
    expect(view.counts).toEqual(countsFor(ITEMS, { project: 'box', status: 'all' }));
  });
});
