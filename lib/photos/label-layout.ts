/**
 * 1-D label stacking (10-RESEARCH Pattern 6), shared with the lightbox hotspot
 * gutters (10-11; lib/photos/hotspot-layout.ts). Pure and import-free, like
 * summit-layout.ts: keep it to erasable TypeScript and never add an import.
 *
 * The v2.0 /photos map sheet's label layout (the plate sweep, its CSS
 * segments and its plate constants) was retired with the map sheet in 18-27
 * (D-27). The region plates and the Alps overview lay themselves out in
 * lib/photos/plate-layout.ts and lib/photos/overview-layout.ts; their sweeps
 * succeed the old map sweep (lib/__tests__/plate-layout.test.ts,
 * lib/__tests__/overview-layout.test.ts).
 */

/**
 * 1-D stacking (10-RESEARCH Pattern 6): start positions for boxes in the given
 * order, each centred on its anchor, kept at or after `min`, pushed down to
 * clear the previous box by `gap`; a stack that overflows `max` is pushed up
 * from the bottom.
 */
export function stack1D(
  items: readonly { anchor: number; size: number }[],
  min: number,
  max: number,
  gap: number
): number[] {
  const starts: number[] = [];
  items.forEach((item, i) => {
    const centred = item.anchor - item.size / 2;
    starts.push(
      i === 0
        ? Math.max(centred, min)
        : Math.max(centred, min, starts[i - 1] + items[i - 1].size + gap)
    );
  });
  for (let i = items.length - 1; i >= 0; i--) {
    const limit = (i === items.length - 1 ? max : starts[i + 1] - gap) - items[i].size;
    starts[i] = Math.min(starts[i], limit);
  }
  return starts;
}
