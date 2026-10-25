export type FrameBudgetVerdict = 'pending' | 'ok' | 'decline';

export const FRAME_BUDGET_DEFAULTS = { minSamples: 20, maxMedianMs: 50, burstWindowMs: 1000 };

export function createFrameBudget(_opts: Partial<typeof FRAME_BUDGET_DEFAULTS> = {}) {
  return {
    sample(_now: number, _continuous: boolean): FrameBudgetVerdict {
      return 'pending';
    },
    medianMs(): number | null {
      return null;
    },
    samples(): number {
      return 0;
    },
  };
}
