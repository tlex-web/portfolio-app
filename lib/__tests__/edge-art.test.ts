/**
 * EDGE-01, D-09 (12-UI-SPEC "EdgeArt"): the marked-trail geometry.
 *
 * The edge art draws one dashed trail across the contour sheet and an accent
 * "you are here" dot clearly off it. Both live in viewBox units (0 to 512, the
 * hero contour asset's own viewBox) inside the safe box [48, 464], so the
 * rounded sheet border never clips them. The dot must sit at least 56 units
 * (about 37 px at 375) from every trail segment, or it reads as on the trail.
 */
import {
  EDGE_DOT,
  EDGE_SAFE_BOX,
  EDGE_TRAIL,
  distanceToSegment,
  trailPath,
} from '@/lib/edge-art';

const inSafeBox = ({ x, y }: { x: number; y: number }) =>
  x >= EDGE_SAFE_BOX.min && x <= EDGE_SAFE_BOX.max && y >= EDGE_SAFE_BOX.min && y <= EDGE_SAFE_BOX.max;

describe('edge art geometry', () => {
  it('uses the safe box [48, 464]', () => {
    expect(EDGE_SAFE_BOX).toEqual({ min: 48, max: 464 });
  });

  it('draws a trail of 5 to 8 points, every one inside the safe box', () => {
    expect(EDGE_TRAIL.length).toBeGreaterThanOrEqual(5);
    expect(EDGE_TRAIL.length).toBeLessThanOrEqual(8);
    for (const point of EDGE_TRAIL) {
      expect(inSafeBox(point)).toBe(true);
    }
  });

  it('keeps the you-are-here dot inside the safe box', () => {
    expect(inSafeBox(EDGE_DOT)).toBe(true);
  });

  it('keeps the dot at least 56 viewBox units from every trail segment', () => {
    const distances = EDGE_TRAIL.slice(1).map((b, i) => distanceToSegment(EDGE_DOT, EDGE_TRAIL[i], b));
    expect(distances).toHaveLength(EDGE_TRAIL.length - 1);
    expect(Math.min(...distances)).toBeGreaterThanOrEqual(56);
  });

  it('measures the perpendicular distance to a segment', () => {
    expect(distanceToSegment({ x: 0, y: 5 }, { x: -10, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5, 10);
  });

  it('measures the distance to the nearer endpoint for a point beyond the segment', () => {
    // (13, 4) lies past b = (10, 0): the distance is |(3, 4)| = 5, not the 4 to the line.
    expect(distanceToSegment({ x: 13, y: 4 }, { x: -10, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5, 10);
    expect(distanceToSegment({ x: -16, y: -8 }, { x: -10, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(10, 10);
  });

  it('measures the distance to the point for a zero-length segment', () => {
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5, 10);
  });

  it('writes the trail as one M followed by one L per remaining point', () => {
    const d = trailPath(EDGE_TRAIL);
    expect(d.startsWith('M')).toBe(true);
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d.match(/L/g)).toHaveLength(EDGE_TRAIL.length - 1);
    expect(trailPath([{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }])).toBe('M1 2 L3 4 L5 6');
  });
});
