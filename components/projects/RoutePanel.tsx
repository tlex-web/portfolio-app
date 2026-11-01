import Link from 'next/link';
import { ArrowRightIcon, ArrowSquareOutIcon, LockKeyIcon } from '@phosphor-icons/react/dist/ssr';

export interface RoutePanelProps {
  slug: string;
  name: string;
  kicker: { version?: string; status?: string };
  pitch?: string;
  links?: { github?: string; privateRepo?: boolean };
}

/**
 * One full-width route panel on /projects (ENG-01; D-12; 11-UI-SPEC
 * "Route panels"). A Server Component, replacing the v1 hexagon card.
 *
 * DOM order: the kicker (`{version} · {status}` as two nowrap units, a
 * missing unit dropped with its separator; status is a word, never a pill),
 * the h2 block link (the title link stretches over the whole panel through
 * its ::after, so the accessible name stays the project name and the panel
 * has one link target), the pitch, and the links row. The row sits above the
 * stretched link (`relative z-10`) and holds either a same-tab GitHub text
 * link (§I #7 default) or the private-repository note as plain text with no
 * link (D-12); with neither it is not rendered. The panel draws the focus
 * ring when its title link is keyboard-focused, so only one ring shows.
 * From 1024 px the panel is a 3fr / 2fr grid; the right column takes the
 * route profile figure in 11-12, and the metric strip and release line join
 * between the pitch and the links row there too.
 */
export default function RoutePanel({ slug, name, kicker, pitch, links }: RoutePanelProps) {
  const units = [kicker.version, kicker.status].filter((unit): unit is string => Boolean(unit));
  const github = links?.github;
  const privateRepo = !github && links?.privateRepo === true;

  return (
    <article className="relative rounded-lg border border-line bg-surface-raised p-6 transition-colors duration-(--duration-fast) ease-erosion hover:border-line-strong hover:bg-surface-overlay has-[a[data-route-link]:focus-visible]:outline-2 has-[a[data-route-link]:focus-visible]:outline-offset-2 has-[a[data-route-link]:focus-visible]:outline-focus lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-8 lg:p-8">
      <div className="min-w-0">
        {units.length > 0 && (
          <p className="font-mono text-sm text-ink-muted">
            {units.map((unit, i) => (
              <span key={unit}>
                {i > 0 && <span aria-hidden="true"> · </span>}
                <span className="whitespace-nowrap">{unit}</span>
              </span>
            ))}
          </p>
        )}
        <h2 className="mt-2 text-heading text-balance">
          <Link
            data-route-link
            href={`/projects/${slug}`}
            className="inline-flex items-center gap-2 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {name}
            <ArrowRightIcon size={20} aria-hidden="true" />
          </Link>
        </h2>
        {pitch && <p className="mt-2 max-w-prose text-base text-ink-muted">{pitch}</p>}
        {(github || privateRepo) && (
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            {github ? (
              <a
                href={github}
                className="inline-flex min-h-11 items-center gap-1 text-base text-ink-muted underline decoration-1 underline-offset-4 transition-colors duration-(--duration-fast) ease-erosion hover:text-ink"
              >
                GitHub
                <ArrowSquareOutIcon size={16} aria-hidden="true" />
              </a>
            ) : (
              <p className="inline-flex items-center gap-1 text-sm text-ink-muted">
                <LockKeyIcon size={16} aria-hidden="true" />
                Source: private repository
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
