import { EnvelopeSimple, GithubLogo, LinkedinLogo } from '@phosphor-icons/react/dist/ssr';
import SheetBand from '@/components/terrain/SheetBand';
import SheetLegend from '@/components/terrain/SheetLegend';
import { homePlate } from '@/data/generated/home-plate';
import { sheet } from '@/data/sheet';
import { site } from '@/data/site';
import { homePhotos } from '@/lib/ascent/home-photos';

const LINK =
  'min-h-11 inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors duration-(--duration-fast) ease-erosion';

/**
 * Map-sheet margin footer (SHELL-03, SHELL-04; 08-UI-SPEC "Footer Map-Sheet
 * Margin Contract"). Server component, static: no hooks, no motion library, no
 * locale-dependent formatting and no animation (D-21), so it also renders
 * unchanged inside the client-rendered global-error. Links open in the same tab.
 *
 * The sheet margin is composed from the Matterhorn plate's SheetBand (the
 * full-bleed contour band, kept as the footer's first child) and SheetLegend
 * (inside the content column, after the links); both draw homePlate, the home
 * sheet alone, never the plate registry. Waypoint ticks (D-20, DATA-04)
 * are the positioned Home waypoints, read through lib/ascent/home-photos
 * (DATA-09, D-09), a module kept light because global-error ships this footer in
 * a client chunk. The footer is the one @container: the legend's scale bar
 * widths resolve against it, the same width the band shows the full extent across.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  const links = [
    { label: 'GitHub', href: site.links.github, Icon: GithubLogo },
    { label: 'LinkedIn', href: site.links.linkedin, Icon: LinkedinLogo },
    { label: 'Email', href: `mailto:${site.email}`, Icon: EnvelopeSimple },
  ];
  const ticks = homePhotos().flatMap((photo) =>
    photo.position && photo.uv
      ? [{ id: photo.id, u: photo.uv.u, approximate: photo.position.approximate }]
      : []
  );

  return (
    <footer className="@container bg-surface-raised border-t border-line">
      <SheetBand sheet={homePlate} ticks={ticks} />
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
          <SheetLegend sheet={homePlate} title={sheet.title} />
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
