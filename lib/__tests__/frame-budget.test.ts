/**
 * @jest-environment node
 *
 * The demand-aware frame budget (HOME-02, HOME-07; D-18, correction C4;
 * 09-RESEARCH Pattern 10, "Demand-aware frame budget (pure)", Pitfall 4).
 *
 * drei's PerformanceMonitor measures FPS over wall-clock windows, so under
 * frameloop="demand" it reads idle time as a slow device. This sampler only
 * measures continuous frames (the previous frame asked for this one), so an
 * idle gap adds no interval:
 *
 * - at least 20 continuous intervals with a median above 50 ms decline, a
 *   median of exactly 50 ms passes;
 * - fewer than 20 frames in the first 1000 ms decline (the device cannot even
 *   fill the calibration burst);
 * - the median is sorted[length >> 1], the upper middle for an even count, so
 *   the verdict is deterministic.
 */
import {
  FRAME_BUDGET_DEFAULTS,
  createFrameBudget,
  type FrameBudgetVerdict,
} from '@/lib/ascent/frame-budget';

/** Feeds `count` frames `stepMs` apart from `start`; returns every verdict. */
function feed(
  budget: ReturnType<typeof createFrameBudget>,
  count: number,
  stepMs: number,
  start = 0,
  continuous = true
): FrameBudgetVerdict[] {
  return Array.from({ length: count }, (_, i) => budget.sample(start + i * stepMs, continuous));
}

describe('FRAME_BUDGET_DEFAULTS', () => {
  it('asks for 20 samples, a 50 ms median and a 1000 ms burst window', () => {
    expect(FRAME_BUDGET_DEFAULTS).toEqual({ minSamples: 20, maxMedianMs: 50, burstWindowMs: 1000 });
  });
});

describe('createFrameBudget (D-18, C4)', () => {
  it('starts with no median and no samples', () => {
    const budget = createFrameBudget();
    expect(budget.medianMs()).toBeNull();
    expect(budget.samples()).toBe(0);
  });

  it('passes on the 21st continuous 16 ms frame and is pending before it', () => {
    const verdicts = feed(createFrameBudget(), 21, 16);
    expect(verdicts.slice(0, 20).every((v) => v === 'pending')).toBe(true);
    expect(verdicts[20]).toBe('ok');
  });

  it('declines continuous 60 ms frames', () => {
    const verdicts = feed(createFrameBudget(), 21, 60);
    const first = verdicts.find((v) => v !== 'pending');
    expect(first).toBe('decline');
    expect(verdicts[20]).toBe('decline');
  });

  it('ignores an idle gap: a non-continuous frame adds no interval', () => {
    const budget = createFrameBudget();
    const verdicts = feed(budget, 25, 16);
    const after = 24 * 16 + 5000;
    verdicts.push(budget.sample(after, false));
    verdicts.push(...feed(budget, 10, 16, after + 16));
    expect(verdicts).not.toContain('decline');
    expect(budget.medianMs()).toBe(16);
    expect(budget.samples()).toBe(24 + 10);
  });

  it('declines fewer than 20 frames in the first 1000 ms', () => {
    const budget = createFrameBudget();
    const verdicts = Array.from({ length: 15 }, (_, i) =>
      budget.sample(Math.round((i * 1100) / 14), true)
    );
    expect(verdicts[14]).toBe('decline');
  });

  it('takes the upper middle as the median of an even count', () => {
    const budget = createFrameBudget();
    for (const t of [0, 10, 30, 60, 100]) budget.sample(t, true);
    expect(budget.samples()).toBe(4);
    expect(budget.medianMs()).toBe(30);
  });

  it('passes a median of exactly 50 ms', () => {
    expect(feed(createFrameBudget(), 21, 50)[20]).toBe('ok');
  });

  it('declines a median of 51 ms', () => {
    expect(feed(createFrameBudget(), 21, 51)[20]).toBe('decline');
  });

  it('takes its thresholds from the options', () => {
    const budget = createFrameBudget({ minSamples: 3, maxMedianMs: 10 });
    expect(feed(budget, 4, 8)[3]).toBe('ok');
  });
});
