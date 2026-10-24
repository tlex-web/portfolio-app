/**
 * CLI_X risk bands and their Swiss hiking trail grades (D-22, DATA-07).
 *
 * The bands are the four quoted in the clix-cli Safety highlight
 * ('Low (0.0-0.3)' ... 'Critical (0.8-1.0)'). Tim confirmed the boundary rule
 * and the grade mapping at the 08-03 checkpoint: each band is half-open
 * [min, max) except critical, which is closed [0.8, 1.0], so 0.3 is medium and
 * 1.0 is critical. Phase 11's trail-grade scale reads `grade` and `marker`;
 * the colour tokens for the markers live there, not here.
 *
 * Zero imports on purpose: a leaf module both the data tests and client
 * components can use without pulling in zod.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskBand {
  level: RiskLevel;
  /** Inclusive lower bound. */
  min: number;
  /** Exclusive upper bound, except for the last band, where it is inclusive. */
  max: number;
  /** SAC hiking scale grade. */
  grade: string;
  /** Trail waymark colours. */
  marker: string;
}

export const RISK_BANDS: readonly RiskBand[] = [
  { level: 'low', min: 0.0, max: 0.3, grade: 'T1', marker: 'yellow' },
  { level: 'medium', min: 0.3, max: 0.6, grade: 'T2–T3', marker: 'white-red-white' },
  { level: 'high', min: 0.6, max: 0.8, grade: 'T4–T5', marker: 'white-blue-white' },
  { level: 'critical', min: 0.8, max: 1.0, grade: 'T6', marker: 'unmarked' },
];

/** The band a riskScore falls in. Throws a RangeError outside [0, 1] (and for NaN). */
export function bandFor(score: number): RiskBand {
  const last = RISK_BANDS.length - 1;
  const band = RISK_BANDS.find(
    (b, i) => score >= b.min && (score < b.max || (i === last && score === b.max))
  );
  if (!band) throw new RangeError(`riskScore ${score} is outside [0, 1]`);
  return band;
}

/** Whether `score` lies in the band of `level`; false for any score outside [0, 1]. */
export function isScoreInLevel(score: number, level: RiskLevel): boolean {
  try {
    return bandFor(score).level === level;
  } catch {
    return false;
  }
}
