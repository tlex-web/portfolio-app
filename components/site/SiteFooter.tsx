import { EnvelopeSimple, GithubLogo, LinkedinLogo } from '@phosphor-icons/react/dist/ssr';
import ContourField from '@/components/terrain/ContourField';
import { photos } from '@/data/generated/photos';
import { site } from '@/data/site';
import { tickLeft } from '@/lib/footer-format';

const LINK =
  'min-h-11 inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors duration-(--duration-fast) ease-erosion';

const TICK = {
  exact: 'absolute bottom-0 h-4 w-px bg-ink-muted',
  approximate: 'absolute bottom-0 h-4 w-0 border-l border-dashed border-ink-muted',
} as const;

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
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  const links = [
    { label: 'GitHub', href: site.links.github, Icon: GithubLogo },
    { label: 'LinkedIn', href: site.links.linkedin, Icon: LinkedinLogo },
    { label: 'Email', href: `mailto:${site.email}`, Icon: EnvelopeSimple },
  ];

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
          <p className="text-sm text-ink-muted tabular-nums">
            © {year} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
