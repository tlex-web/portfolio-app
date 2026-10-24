/**
 * D-22 / DATA-07: CLI_X risk bands and their trail grades.
 *
 * The band rule and the grade mapping are the ones Tim confirmed at the 08-03
 * checkpoint ("both ok"): low [0.0, 0.3), medium [0.3, 0.6), high [0.6, 0.8)
 * and critical [0.8, 1.0], so 0.3 is medium and 1.0 is critical; low -> T1
 * yellow, medium -> T2–T3 white-red-white, high -> T4–T5 white-blue-white,
 * critical -> T6 unmarked.
 */
import { RISK_BANDS, bandFor, isScoreInLevel } from '@/lib/trail-grade';

describe('RISK_BANDS', () => {
  test('lists low, medium, high, critical in order', () => {
    expect(RISK_BANDS.map((b) => b.level)).toEqual(['low', 'medium', 'high', 'critical']);
  });

  test('cover [0, 1] with no gap or overlap', () => {
    expect(RISK_BANDS[0]?.min).toBe(0);
    expect(RISK_BANDS[RISK_BANDS.length - 1]?.max).toBe(1);
    for (let i = 0; i < RISK_BANDS.length - 1; i++) {
      expect(RISK_BANDS[i].max).toBe(RISK_BANDS[i + 1].min);
    }
  });

  test('carry the trail grade and marker Tim confirmed', () => {
    expect(RISK_BANDS.map(({ level, grade, marker }) => ({ level, grade, marker }))).toEqual([
      { level: 'low', grade: 'T1', marker: 'yellow' },
      { level: 'medium', grade: 'T2–T3', marker: 'white-red-white' },
      { level: 'high', grade: 'T4–T5', marker: 'white-blue-white' },
      { level: 'critical', grade: 'T6', marker: 'unmarked' },
    ]);
  });
});

describe('bandFor', () => {
  test.each([
    [0, 'low'],
    [0.29, 'low'],
    [0.3, 'medium'],
    [0.59, 'medium'],
    [0.6, 'high'],
    [0.79, 'high'],
    [0.8, 'critical'],
    [1, 'critical'],
  ])('bandFor(%s) is %s', (score, level) => {
    expect(bandFor(score).level).toBe(level);
  });

  test.each([-0.01, 1.01, Number.NaN])('bandFor(%s) throws', (score) => {
    expect(() => bandFor(score)).toThrow(RangeError);
  });
});

describe('isScoreInLevel', () => {
  test('is true inside the band and false outside it', () => {
    expect(isScoreInLevel(0.29, 'low')).toBe(true);
    expect(isScoreInLevel(0.3, 'low')).toBe(false);
    expect(isScoreInLevel(0.3, 'medium')).toBe(true);
    expect(isScoreInLevel(0.87, 'critical')).toBe(true);
    expect(isScoreInLevel(0.87, 'high')).toBe(false);
    expect(isScoreInLevel(1, 'critical')).toBe(true);
  });

  test('is false for a score outside [0, 1]', () => {
    expect(isScoreInLevel(-0.01, 'low')).toBe(false);
    expect(isScoreInLevel(1.01, 'critical')).toBe(false);
  });
});
