/**
 * 1-D label stacking (10-RESEARCH Pattern 6), shared with the lightbox
 * hotspot gutters (10-11; lib/photos/hotspot-layout.ts).
 *
 * The v2.0 map sheet's sweep rows (layoutMapMarks, mapMarkSegments,
 * mapMarkCss over the four v2.0 waypoints) were retired with the map
 * sheet in 18-27 (D-27). Their successors are the region plate sweep
 * (lib/__tests__/plate-layout.test.ts, 18-09/18-10) and the Alps overview
 * sweep (lib/__tests__/overview-layout.test.ts, 18-13); 18-27-SUMMARY.md maps
 * every retired row to its successor.
 */
import { stack1D } from '@/lib/photos/label-layout';

describe('stack1D', () => {
  it('centres, then pushes down to clear the previous item by the gap', () => {
    expect(
      stack1D(
        [
          { anchor: 100, size: 48 },
          { anchor: 105, size: 48 },
        ],
        8,
        400,
        8
      )
    ).toEqual([76, 132]);
  });

  it('pushes an overflowing stack up from the bottom', () => {
    expect(
      stack1D(
        [
          { anchor: 380, size: 48 },
          { anchor: 390, size: 48 },
        ],
        8,
        400,
        8
      )
    ).toEqual([296, 352]);
  });

  it('centres a single item on its anchor and keeps it inside the bounds', () => {
    expect(stack1D([{ anchor: 200, size: 48 }], 8, 400, 8)).toEqual([176]);
    expect(stack1D([{ anchor: 10, size: 48 }], 8, 400, 8)).toEqual([8]);
  });
});

describe('module surface (18-27; D-27)', () => {
  it('exports only stack1D: the v2.0 map sheet half (layoutMapMarks, mapMarkSegments, mapMarkCss) is retired', async () => {
    const mod = await import('@/lib/photos/label-layout');
    expect(Object.keys(mod).sort()).toEqual(['stack1D']);
  });
});
