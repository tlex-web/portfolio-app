/**
 * The route-log data contract (ROUTE-01, ROUTE-03; D-17, D-18, D-20, D-31, D-32).
 *
 * `data/roadmap.ts` holds only the rows Tim confirmed at the 11-02 checkpoint
 * (D-17), typed by the strict zod contract in data/schemas/roadmap.ts. Areas are
 * the three projects on the route log; ids and order values are unique, so no
 * two rows tie for a position on the axis (ROUTE-01). The portfolio v2.0 row is
 * the only one in progress and carries its phases 7 to 12 (D-18). completedAt
 * appears only where work is completed, and `surveyedAt` lies between the
 * newest completion date (phases included) and today, equality allowed (D-20).
 */
import { RoadmapItemSchema, RoadmapSchema } from '@/data/schemas/roadmap';
import { roadmapItems, surveyedAt } from '@/data/roadmap';
import { formatLogDate } from '@/lib/log-date';
import { BAND_LABELS, newestCompletedAt, type RouteLogItem } from '@/lib/route-log';

// Type-level check (`npm run type-check`): the data feeds the route-log functions as is.
const asLog: readonly RouteLogItem[] = roadmapItems;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** D-20: surveyedAt is not after today and not before the newest completion date. */
function surveyHolds(surveyed: string, items: readonly RouteLogItem[], today: string): boolean {
  const newest = newestCompletedAt(items);
  return surveyed <= today && (newest === null || surveyed >= newest);
}

const validRow = {
  id: 'box-v1',
  title: 'v1.0 Full toolbox',
  description: 'A row used only to probe the schema.',
  area: 'box',
  status: 'completed',
  order: 1,
  completedAt: '2026-06-24',
};

describe('RoadmapSchema', () => {
  test('the confirmed rows parse against the strict contract', () => {
    expect(() => RoadmapSchema.parse(roadmapItems)).not.toThrow();
  });

  test.each(['cli', 'webshop', 'other'])('rejects the retired area %s', (area) => {
    expect(RoadmapItemSchema.safeParse({ ...validRow, area }).success).toBe(false);
  });

  test('rejects an unknown key (strict objects)', () => {
    expect(RoadmapItemSchema.safeParse({ ...validRow, priority: 'high' }).success).toBe(false);
  });

  test('rejects a completedAt that is not a YYYY-MM-DD date', () => {
    expect(RoadmapItemSchema.safeParse({ ...validRow, completedAt: '24 Jun 2026' }).success).toBe(
      false
    );
  });

  test('rejects two phases with the same number, the disclosure key (11 IN-08)', () => {
    const phase = { n: 7, name: 'Phase', status: 'completed' };
    const phases = [phase, { ...phase, name: 'Other' }];
    expect(RoadmapItemSchema.safeParse({ ...validRow, phases }).success).toBe(false);
  });

  test('accepts a completed row without a confirmed date (it renders "Completed")', () => {
    const undated: Record<string, unknown> = { ...validRow };
    delete undated.completedAt;
    expect('completedAt' in undated).toBe(false);
    expect(RoadmapItemSchema.safeParse(undated).success).toBe(true);
  });
});

describe('roadmapItems (ROUTE-01, D-31, D-32)', () => {
  test('ids are unique', () => {
    const ids = asLog.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('no id collides with an id /roadmap already uses (11 IN-04)', () => {
    const bands = Object.keys(BAND_LABELS);
    const reserved = ['main-content', ...bands, ...bands.map((b) => `${b}-heading`)];
    for (const { id } of asLog) expect(reserved).not.toContain(id);
  });

  test.each(['Box v1', 'box#v1', 'Box-v1', '-box'])('rejects the row id %j (11 IN-04)', (id) => {
    expect(RoadmapItemSchema.safeParse({ ...validRow, id }).success).toBe(false);
  });

  test('order values are unique integers, so no two rows tie on the axis', () => {
    const orders = asLog.map((i) => i.order);
    expect(new Set(orders).size).toBe(orders.length);
    for (const o of orders) expect(Number.isInteger(o)).toBe(true);
  });

  test('every area is one of portfolio, box and coin-flip', () => {
    for (const item of asLog) expect(['portfolio', 'box', 'coin-flip']).toContain(item.area);
  });

  test('no retired row survives', () => {
    for (const { id } of asLog) {
      expect(['portfolio-3d-gallery', 'portfolio-blog']).not.toContain(id);
      expect(id.startsWith('cli-')).toBe(false);
      expect(id.startsWith('webshop-')).toBe(false);
    }
  });
});

describe('portfolio v2.0 in progress (ROUTE-03, D-18)', () => {
  test('exactly one row is in progress and it is the portfolio v2.0 row', () => {
    const inProgress = asLog.filter((i) => i.status === 'in-progress');
    expect(inProgress).toHaveLength(1);
    expect(inProgress[0].id).toBe('portfolio-v2');
    expect(inProgress[0].area).toBe('portfolio');
  });

  test('v2.0 carries phases 7 to 12: 7-11 completed with dates, 12 in progress (12-01 log.phase11)', () => {
    const v2 = asLog.find((i) => i.id === 'portfolio-v2');
    const phases = v2?.phases ?? [];
    expect(phases.map((p) => p.n)).toEqual([7, 8, 9, 10, 11, 12]);
    expect(phases.map((p) => p.status)).toEqual([
      'completed',
      'completed',
      'completed',
      'completed',
      'completed',
      'in-progress',
    ]);
    for (const p of phases.slice(0, 5)) expect(p.completedAt).toMatch(ISO_DATE);
    // Phase 11's date is Tim's, from the 12-01 content checkpoint (11-08 Q3 rule).
    expect(phases[4].completedAt).toBe('2026-11-02');
    for (const p of phases.slice(5)) expect(p.completedAt).toBeUndefined();
  });

  test('no other row carries phases', () => {
    for (const item of asLog.filter((i) => i.id !== 'portfolio-v2')) {
      expect(item.phases).toBeUndefined();
    }
  });
});

describe('completion dates (ROUTE-03 empty, D-17)', () => {
  test('completedAt appears only on completed rows and phases', () => {
    for (const item of asLog) {
      if (item.status !== 'completed') expect(item.completedAt).toBeUndefined();
      for (const phase of item.phases ?? []) {
        if (phase.status !== 'completed') expect(phase.completedAt).toBeUndefined();
      }
    }
  });

  test('every completedAt is a real date that formatLogDate accepts', () => {
    const dates = asLog.flatMap((i) => [
      i.completedAt,
      ...(i.phases ?? []).map((p) => p.completedAt),
    ]);
    for (const d of dates.filter((x): x is string => x !== undefined)) {
      expect(d).toMatch(ISO_DATE);
      expect(() => formatLogDate(d)).not.toThrow();
    }
  });
});

describe('surveyedAt (ROUTE-03 adjacency, D-20)', () => {
  test('is a YYYY-MM-DD date that formatLogDate accepts', () => {
    expect(surveyedAt).toMatch(ISO_DATE);
    expect(() => formatLogDate(surveyedAt)).not.toThrow();
  });

  test('is not in the future and not before the newest completedAt (incl. phase dates)', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(surveyedAt <= today).toBe(true);
    expect(surveyedAt >= (newestCompletedAt(roadmapItems) ?? '')).toBe(true);
    expect(surveyHolds(surveyedAt, roadmapItems, today)).toBe(true);
  });

  test('a surveyedAt equal to the newest date passes (>=, not >)', () => {
    const newest = newestCompletedAt(roadmapItems);
    expect(newest).not.toBeNull();
    expect(surveyHolds(newest as string, roadmapItems, '9999-12-31')).toBe(true);
  });

  test('a surveyedAt one day before the newest date fails', () => {
    const items: RouteLogItem[] = [{ ...(validRow as RouteLogItem), completedAt: '2026-10-26' }];
    expect(surveyHolds('2026-10-25', items, '9999-12-31')).toBe(false);
    expect(surveyHolds('2026-10-26', items, '9999-12-31')).toBe(true);
  });
});
