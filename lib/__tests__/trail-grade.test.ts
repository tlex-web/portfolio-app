/**
 * D-06 / D-24: the SAC trail-grade vocabulary the waymark badges use.
 *
 * Each grade maps to the waymark painted on a Swiss hiking trail of that
 * grade: T1 yellow, T2 and T3 white-red-white, T4 and T5 white-blue-white,
 * T6 unmarked. Anything that is not one of the six grades throws, so a typo
 * in project data fails loudly instead of drawing the wrong paint.
 */
import { MARKER_NAMES, TRAIL_GRADES, markerForGrade } from '@/lib/trail-grade';

describe('markerForGrade', () => {
  test.each([
    ['T1', 'yellow'],
    ['T2', 'white-red-white'],
    ['T3', 'white-red-white'],
    ['T4', 'white-blue-white'],
    ['T5', 'white-blue-white'],
    ['T6', 'unmarked'],
  ])('%s is %s', (grade, marker) => {
    expect(markerForGrade(grade)).toBe(marker);
  });

  test.each(['T0', 'T7', '', 't4', 'T2–T3'])('throws a RangeError for %p', (grade) => {
    expect(() => markerForGrade(grade)).toThrow(RangeError);
  });

  test('names the rejected grade in the error', () => {
    expect(() => markerForGrade('T7')).toThrow(/T7/);
  });
});

describe('TRAIL_GRADES', () => {
  test('lists T1 to T6 in order', () => {
    expect(TRAIL_GRADES).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6']);
  });

  test('maps every grade to one of the four markers', () => {
    const markers = Object.keys(MARKER_NAMES);
    for (const grade of TRAIL_GRADES) {
      expect(markers).toContain(markerForGrade(grade));
    }
  });

  test('uses each of the four markers for at least one grade', () => {
    const used = new Set(TRAIL_GRADES.map((grade) => markerForGrade(grade)));
    expect([...used].sort()).toEqual(Object.keys(MARKER_NAMES).sort());
  });
});

describe('MARKER_NAMES', () => {
  test('names exactly the four waymarks', () => {
    expect(MARKER_NAMES).toEqual({
      yellow: 'yellow waymark',
      'white-red-white': 'white-red-white waymark',
      'white-blue-white': 'white-blue-white waymark',
      unmarked: 'unmarked',
    });
  });
});
