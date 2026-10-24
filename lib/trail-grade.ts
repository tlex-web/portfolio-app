/**
 * CLI_X risk bands and trail grades (D-22). Interface stub for the RED run;
 * the implementation lands with the riskScore data.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskBand {
  level: RiskLevel;
  min: number;
  max: number;
  grade: string;
  marker: string;
}

export const RISK_BANDS: readonly RiskBand[] = [];

export function bandFor(score: number): RiskBand {
  throw new Error(`bandFor(${score}): not implemented`);
}

export function isScoreInLevel(_score: number, _level: RiskLevel): boolean {
  return false;
}
