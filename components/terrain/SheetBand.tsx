import ContourField, { type PlateId } from '@/components/terrain/ContourField';
import { tickLeft } from '@/lib/footer-format';

const TICK = {
  exact: 'absolute bottom-0 h-4 w-px bg-ink-muted',
  approximate: 'absolute bottom-0 h-4 w-0 border-l border-dashed border-ink-muted',
} as const;

/** One waypoint tick on the neatline: `u` is the easting across the plate (0..1). */
export interface SheetTick {
  id: string;
  u: number;
  approximate: boolean;
}

/**
 * A plate's full-bleed contour band with waypoint ticks (D-19, D-20, DATA-04;
 * 08-UI-SPEC "① Contour band"). Server component, static: no hooks, no motion
 * library and no animation (D-21), so it also renders unchanged inside the
 * client-rendered global-error.
 *
 * The band is the plate's strip LOD as a CSS mask; its aspect ratio reserves the
 * height before the mask loads. Each tick stands at `tickLeft(u)`, solid when
 * exact, dashed when approximate. The caller places the band (the footer keeps it
 * as its first child) and builds the ticks, so this file adds no wrapper and no
 * container-query context of its own.
 */
export default function SheetBand({ plate, ticks }: { plate: PlateId; ticks: readonly SheetTick[] }) {
  return (
    <div
      aria-hidden="true"
      className="relative w-full aspect-[5/1] sm:aspect-[8/1] lg:aspect-[12/1] border-b border-line pointer-events-none"
    >
      <ContourField plate={plate} lod="strip" className="absolute inset-0" />
      {ticks.map((tick) => (
        <span
          key={tick.id}
          data-tick={tick.approximate ? 'approximate' : 'exact'}
          className={tick.approximate ? TICK.approximate : TICK.exact}
          style={{ left: tickLeft(tick.u) }}
        />
      ))}
    </div>
  );
}
