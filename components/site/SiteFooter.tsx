import { EnvelopeSimple, GithubLogo, LinkedinLogo } from '@phosphor-icons/react/dist/ssr';
import { site } from '@/data/site';

const LINK =
  'min-h-11 inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors duration-(--duration-fast) ease-erosion';

/**
 * Plain identity footer (SHELL-03; UI-SPEC "SiteFooter"). Server component, no
 * motion. Links open in the same tab. The map legend arrives in Phase 8 (SHELL-04).
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  const links = [
    { label: 'GitHub', href: site.links.github, Icon: GithubLogo },
    { label: 'LinkedIn', href: site.links.linkedin, Icon: LinkedinLogo },
    { label: 'Email', href: `mailto:${site.email}`, Icon: EnvelopeSimple },
  ];

  return (
    <footer className="bg-surface-raised border-t border-line">
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
