/**
 * The demand-aware frame budget (HOME-02, HOME-07; D-18, correction C4;
 * 09-RESEARCH Pattern 10, Pitfall 4). Import-free, so Jest tests it in Node.
 *
 * D-18 asks for a PerformanceMonitor fallback. drei's monitor measures FPS over
 * wall-clock windows, so under frameloop="demand" it reads idle time as a slow
 * device and declines capable ones. This sampler measures only continuous
 * frames (the previous frame requested this one), so an idle gap adds no
 * interval. CameraRig feeds it the reveal burst, the calibration window:
 *
 * - fewer than `minSamples` frames in the first `burstWindowMs` -> 'decline'
 *   (the device cannot even fill the burst);
 * - below `minSamples` continuous intervals -> 'pending';
 * - otherwise the median interval decides: above `maxMedianMs` -> 'decline',
 *   else 'ok' (exactly `maxMedianMs` passes).
 *
 * The median is sorted[length >> 1], the upper middle for an even count, so a
 * verdict never depends on averaging two samples.
 */

export type FrameBudgetVerdict = 'pending' | 'ok' | 'decline';

export const FRAME_BUDGET_DEFAULTS = {
  /** Continuous intervals (and burst frames) needed before a verdict. */
  minSamples: 20,
  /** Median frame interval above which the device declines (20 fps). */
  maxMedianMs: 50,
  /** The burst must deliver `minSamples` frames within this window. */
  burstWindowMs: 1000,
};

export type FrameBudgetOptions = typeof FRAME_BUDGET_DEFAULTS;

export function createFrameBudget(opts: Partial<FrameBudgetOptions> = {}) {
  const { minSamples, maxMedianMs, burstWindowMs } = { ...FRAME_BUDGET_DEFAULTS, ...opts };
  const deltas: number[] = [];
  let start = -1;
  let last = -1;
  let frames = 0;

  const median = (): number | null => {
    if (deltas.length === 0) return null;
    const sorted = [...deltas].sort((a, b) => a - b);
    return sorted[sorted.length >> 1];
  };

  return {
    /** Call once per rendered frame; `continuous` = the previous frame requested this one. */
    sample(now: number, continuous: boolean): FrameBudgetVerdict {
      if (start < 0) start = now;
      frames++;
      if (continuous && last >= 0) deltas.push(now - last);
      last = now;
      if (now - start >= burstWindowMs && frames < minSamples) return 'decline';
      if (deltas.length < minSamples) return 'pending';
      return (median() as number) > maxMedianMs ? 'decline' : 'ok';
    },
    /** The median continuous frame interval so far, or null before the first one. */
    medianMs: median,
    /** The number of continuous intervals measured. */
    samples: (): number => deltas.length,
  };
}
