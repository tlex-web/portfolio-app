import type { homePlate } from '@/data/generated/home-plate';
import { site } from '@/data/site';
import {
  SCALE_TIERS,
  formatEquidistance,
  formatExtentLines,
  formatMonthYear,
  labelLeft,
  scaleFraction,
} from '@/lib/footer-format';

/**
 * One variant per SCALE_TIERS entry, shown only inside that tier's viewport
 * range. 112rem = 1792 px; see SCALE_TIERS for why it is not written in px.
 */
const SCALE_VARIANT = [
  'flex flex-col lg:hidden',
  'hidden lg:flex lg:flex-col min-[112rem]:hidden',
  'hidden min-[112rem]:flex min-[112rem]:flex-col',
] as const;

const LABEL_TICKS = [0, 50, 100] as const;

const DT = 'text-sm text-ink-muted';
const DD_VALUE = 'mt-1 font-mono text-sm text-ink tabular-nums';

/** A plate's 2D sheet as the legend reads it (a type only: the caller passes the data). */
type LegendSheet = typeof homePlate;

/**
 * A plate's sheet legend (D-15, D-18; 08-UI-SPEC "Footer Map-Sheet Margin
 * Contract"): the title paragraph and the scale, equidistance, extent, last
 * surveyed and source list. Server component, static: no hooks, no motion
 * library, no locale-dependent formatting and no animation (D-21).
 *
 * Returns a fragment, so the caller's markup is unchanged: no wrapper element and
 * no container-query context. The scale bar is `L / extentWidthM` of the nearest
 * @container width (the footer's), the same width the band shows the full extent
 * across, so it is true at every breakpoint without JS. The caller passes the
 * plate's sheet (the footer passes homePlate, so no plate registry reaches its
 * client chunk). The legend reads required sheet metadata, so missing data is a
 * build failure, never a dash. The Source
 * line is the swissALTIRegio reference Tim chose (D-15), verbatim, with no
 * copyright sign; per-plate credits arrive in Phase 18.
 */
export default function SheetLegend({ sheet, title }: { sheet: LegendSheet; title: string }) {
  const [extentSw, extentNe] = formatExtentLines(sheet.extent.lv95);

  return (
    <>
      <p className="text-base font-semibold text-ink">{title}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
        <div>
          <dt className={DT}>Scale</dt>
          <dd className="mt-1">
            {SCALE_TIERS.map((tier, i) => {
              const width = `calc(100cqw * ${scaleFraction(tier.lengthM, sheet.extent.widthM)})`;
              return (
                <div key={tier.lengthM} className={SCALE_VARIANT[i]}>
                  <div className="flex h-2 border border-ink-muted" style={{ width }}>
                    <div className="flex-1 bg-ink-muted" />
                    <div className="flex-1" />
                  </div>
                  <div
                    className="relative mt-1 h-5 font-mono text-sm text-ink-muted tabular-nums"
                    aria-hidden="true"
                    style={{ width }}
                  >
                    {tier.labels.map((label, j) => (
                      <span
                        key={label}
                        className="absolute top-0 whitespace-nowrap"
                        style={{ left: labelLeft(LABEL_TICKS[j], label) }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <span className="sr-only">{tier.srText}</span>
                </div>
              );
            })}
          </dd>
        </div>
        <div>
          <dt className={DT}>Equidistance</dt>
          <dd className={DD_VALUE}>{formatEquidistance(sheet.contours.strip.intervalM)}</dd>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <dt className={DT}>Extent (LV95)</dt>
          <dd className={DD_VALUE}>
            <span className="block">{extentSw}</span>
            <span className="block">{extentNe}</span>
          </dd>
        </div>
        <div>
          <dt className={DT}>Last surveyed</dt>
          <dd className={DD_VALUE}>{formatMonthYear(sheet.dem.edition)}</dd>
        </div>
        <div className="col-span-2 lg:col-span-4">
          <dt className={DT}>Source</dt>
          <dd className="mt-1 text-sm text-ink-muted max-w-prose wrap-anywhere">
            Contours derived from swissALTIRegio. {site.attribution.terrain}
          </dd>
        </div>
      </dl>
    </>
  );
}
