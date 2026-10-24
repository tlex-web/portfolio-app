import { EnvelopeSimple, GithubLogo, LinkedinLogo } from '@phosphor-icons/react/dist/ssr';
import ContourField from '@/components/terrain/ContourField';
import { photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { site } from '@/data/site';
import {
  SCALE_TIERS,
  formatEquidistance,
  formatExtentLines,
  formatMonthYear,
  labelLeft,
  scaleFraction,
  tickLeft,
} from '@/lib/footer-format';

const LINK =
  'min-h-11 inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors duration-(--duration-fast) ease-erosion';

const TICK = {
  exact: 'absolute bottom-0 h-4 w-px bg-ink-muted',
  approximate: 'absolute bottom-0 h-4 w-0 border-l border-dashed border-ink-muted',
} as const;

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

/**
 * Map-sheet margin footer (SHELL-03, SHELL-04; 08-UI-SPEC "Footer Map-Sheet
 * Margin Contract"). Server component, static: no hooks, no motion library, no
 * locale-dependent formatting and no animation (D-21), so it also renders
 * unchanged inside the client-rendered global-error. Links open in the same tab.
 *
 * The full-bleed contour band (D-19) is the terrain strip LOD as a CSS mask; its
 * aspect ratio reserves the height before the mask loads. Waypoint ticks
 * (D-20, DATA-04) stand on the neatline at each positioned photo's easting:
 * solid when exact, dashed when `position.approximate`.
 *
 * The sheet margin (D-18) reads required terrain metadata, so missing data is a
 * build failure, never a dash. The scale bar is `L / extentWidthM` of the
 * footer's @container width, the same width the band shows the full extent
 * across, so it is true at every breakpoint without JS. The Source line is the
 * swissALTIRegio reference Tim chose (D-15), verbatim, with no copyright sign.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  const links = [
    { label: 'GitHub', href: site.links.github, Icon: GithubLogo },
    { label: 'LinkedIn', href: site.links.linkedin, Icon: LinkedinLogo },
    { label: 'Email', href: `mailto:${site.email}`, Icon: EnvelopeSimple },
  ];
  const [extentSw, extentNe] = formatExtentLines(terrain.extent.lv95);

  return (
    <footer className="@container bg-surface-raised border-t border-line">
      <div
        aria-hidden="true"
        className="relative w-full aspect-[5/1] sm:aspect-[8/1] lg:aspect-[12/1] border-b border-line pointer-events-none"
      >
        <ContourField lod="strip" className="absolute inset-0" />
        {photos.map((photo) =>
          photo.position && photo.uv ? (
            <span
              key={photo.id}
              data-tick={photo.position.approximate ? 'approximate' : 'exact'}
              className={photo.position.approximate ? TICK.approximate : TICK.exact}
              style={{ left: tickLeft(photo.uv.u) }}
            />
          ) : null
        )}
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="font-display text-heading font-semibold text-ink">{site.name}</p>
            <p className="text-base text-ink-muted">{site.role}</p>
          </div>
          <ul aria-label="Elsewhere" className="flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-end">
            {links.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} className={LINK}>
                  <Icon size={20} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-12 pt-6 border-t border-line">
          <p className="text-base font-semibold text-ink">Zermatt – Matterhorn</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
            <div>
              <dt className={DT}>Scale</dt>
              <dd className="mt-1">
                {SCALE_TIERS.map((tier, i) => {
                  const width = `calc(100cqw * ${scaleFraction(tier.lengthM, terrain.extent.widthM)})`;
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
              <dd className={DD_VALUE}>{formatEquidistance(terrain.contours.strip.intervalM)}</dd>
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
              <dd className={DD_VALUE}>{formatMonthYear(terrain.dem.edition)}</dd>
            </div>
            <div className="col-span-2 lg:col-span-4">
              <dt className={DT}>Source</dt>
              <dd className="mt-1 text-sm text-ink-muted max-w-prose wrap-anywhere">
                Contours derived from swissALTIRegio. {site.attribution.terrain}
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-12 pt-6 border-t border-line">
          <p className="text-sm text-ink-muted tabular-nums">
            © {year} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
