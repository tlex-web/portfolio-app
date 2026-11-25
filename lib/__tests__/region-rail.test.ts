/**
 * @jest-environment node
 */
/**
 * The region altimeter rail's model (REGION-05; D-07; 18-UI-SPEC Contract 2
 * "Altimeter rail"; P1 as drafted, Tim's 18-01 answer "Defaults
 * (Recommended)"): one tick per photo in sequence order, labelled with the
 * metres only (the caption carries 'approx.' and 'ground'), dashed when the
 * position is approximate; the head label reads 'Ground altitude' when every
 * photo of the region is aerial, else 'Altitude'.
 *
 * railCurrent is the island's decision, pure: the figure containing the
 * viewport's centre line is current; above the first figure photo 1, below the
 * last photo N; in the gap between figures k and k + 1 the mark stays where it
 * was when that is k or k + 1 (the side the visitor came from), else, after a
 * jump straight into the gap, it moves to k.
 */
import { formatMetres } from '@/lib/photo-format';
import { RAIL_MAX_PHOTOS, railCurrent, railHead, railTicks } from '@/lib/photos/region-rail';
import { regionIds, regionPhotoViews } from '@/lib/regions';

/** A placeholder view at `m` metres. */
const view = (m: number, over: Partial<{ approximate: boolean; aerial: boolean }> = {}) => ({
  altitudeM: m,
  approximate: false,
  aerial: false,
  ...over,
});

describe('railTicks (P1: metres only, dashed when approximate)', () => {
  it('gives Zermatt one tick per photo in sequence order, labelled formatMetres(altitudeM)', () => {
    const views = regionPhotoViews('zermatt');
    const ticks = railTicks(views);
    expect(ticks).toHaveLength(views.length);
    expect(ticks.map((t) => t.label)).toEqual(views.map((v) => formatMetres(v.altitudeM)));
    // Metres only: never the caption's 'approx.' or 'ground'.
    for (const tick of ticks) expect(tick.label).toMatch(/^[\d,]+\u00a0m$/);
  });

  it('gives a one-photo input one tick (UI E6 zero-one-many)', () => {
    expect(railTicks([view(1617)])).toEqual([{ label: '1,617\u00a0m', approximate: false }]);
  });

  it('marks approximate views approximate (the dashed tick) and keeps the label to metres', () => {
    expect(railTicks([view(2760.4, { approximate: true }), view(2410, { aerial: true })])).toEqual([
      { label: '2,760\u00a0m', approximate: true },
      { label: '2,410\u00a0m', approximate: false },
    ]);
  });

  it("carries every real region's approximate flags in sequence order", () => {
    for (const id of regionIds) {
      const views = regionPhotoViews(id);
      expect(railTicks(views).map((t) => t.approximate)).toEqual(views.map((v) => v.approximate));
    }
  });

  it('throws a RangeError naming the count for 17 photos', () => {
    const seventeen = Array.from({ length: 17 }, (_, i) => view(1000 + i));
    expect(() => railTicks(seventeen)).toThrow(RangeError);
    expect(() => railTicks(seventeen)).toThrow(/\b17 photos\b/);
    expect(railTicks(seventeen.slice(0, RAIL_MAX_PHOTOS))).toHaveLength(RAIL_MAX_PHOTOS);
  });
});

describe('railHead (the 17 aerial rule)', () => {
  it("reads 'Ground altitude' for Saalfelden, whose photos are all aerial", () => {
    const views = regionPhotoViews('saalfelden');
    expect(views.every((v) => v.aerial)).toBe(true);
    expect(railHead(views)).toBe('Ground altitude');
  });

  it("reads 'Altitude' for Zermatt, whose photos are taken on the ground", () => {
    expect(railHead(regionPhotoViews('zermatt'))).toBe('Altitude');
  });

  it("reads 'Ground altitude' for an all-aerial input and 'Altitude' for a mixed one", () => {
    expect(railHead([view(820, { aerial: true }), view(880, { aerial: true })])).toBe(
      'Ground altitude'
    );
    expect(railHead([view(820, { aerial: true }), view(1617)])).toBe('Altitude');
  });
});

/** The observers' state for N items: which contains the line, how many tops have reached it. */
function state(n: number, containing: number | null, reached: number, previous: number) {
  return {
    containing: Array.from({ length: n }, (_, i) => i + 1 === containing),
    reached: Array.from({ length: n }, (_, i) => i < reached),
    previous,
  };
}

describe('railCurrent (the centre line, its two ends and its gaps)', () => {
  it('marks the figure whose box contains the centre line', () => {
    expect(railCurrent(state(7, 4, 4, 3))).toBe(4);
    expect(railCurrent(state(7, 1, 1, 1))).toBe(1);
    expect(railCurrent(state(7, 7, 7, 2))).toBe(7);
  });

  it('marks photo 1 while the line is above the first figure, photo N once it is below the last', () => {
    expect(railCurrent(state(7, null, 0, 3))).toBe(1);
    expect(railCurrent(state(7, null, 7, 3))).toBe(7);
  });

  it('keeps the mark on the side the visitor came from in a gap (never 1 or N)', () => {
    // Coming down from figure 3 into the 3 | 4 gap: 3 stays.
    expect(railCurrent(state(7, null, 3, 3))).toBe(3);
    // Coming up from figure 4 into the same gap: 4 stays.
    expect(railCurrent(state(7, null, 3, 4))).toBe(4);
  });

  it('moves to the figure above a gap after a jump straight into it', () => {
    expect(railCurrent(state(7, null, 3, 1))).toBe(3);
    expect(railCurrent(state(7, null, 3, 7))).toBe(3);
  });

  it('gives a one-photo region its only tick everywhere', () => {
    expect(railCurrent(state(1, null, 0, 1))).toBe(1);
    expect(railCurrent(state(1, 1, 1, 1))).toBe(1);
    expect(railCurrent(state(1, null, 1, 1))).toBe(1);
  });
});

describe('RAIL_MAX_PHOTOS', () => {
  it('is 16: above it the ticks would crowd under 24 px on a 640 px viewport', () => {
    expect(RAIL_MAX_PHOTOS).toBe(16);
  });

  it.each(regionIds.map((id) => [id] as const))(
    '%s has at most RAIL_MAX_PHOTOS photos, so its rail builds',
    (id) => {
      expect(regionPhotoViews(id).length).toBeLessThanOrEqual(RAIL_MAX_PHOTOS);
      expect(() => railTicks(regionPhotoViews(id))).not.toThrow();
    }
  );
});
