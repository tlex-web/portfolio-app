import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  LockKeyIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { Project } from '@/data/types';

/**
 * The case-study header band (11-UI-SPEC "Trailhead"; D-12, D-16, D-29). A
 * Server Component inside the page container.
 *
 * DOM order: the 'All routes' back link to /projects, the `{version} ·
 * {status}` kicker (nowrap units, a missing unit dropped with its separator,
 * the same string as the route panel), the h1 project name, the approved
 * outcome line when there is one, and the links row. The row holds box's one
 * secondary GitHub button (same tab, §I #7 default) or coin-flip's private
 * repository note with the 'Ask for a walkthrough' link to /contact; with
 * neither it is not rendered (G9). From 1024 px the band is a 3fr / 2fr grid
 * whose right column takes the optional `figure` (11-12 passes the route
 * profile there).
 */
export default function Trailhead({ project, figure }: { project: Project; figure?: ReactNode }) {
  const units = [project.kicker.version, project.kicker.status].filter((unit): unit is string =>
    Boolean(unit)
  );
  const github = project.slug === 'box' ? project.links.github : undefined;
  const privateRepo = project.slug === 'coin-flip' && project.repository === 'private';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <header className="border-b border-line pt-8 pb-8 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-x-8">
        <div className="min-w-0">
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 text-base font-semibold text-ink-muted transition-colors duration-(--duration-fast) ease-erosion hover:text-ink"
          >
            <ArrowLeftIcon size={20} aria-hidden="true" />
            All routes
          </Link>
          {units.length > 0 && (
            <p className="mt-4 mb-2 font-mono text-sm text-ink-muted">
              {units.map((unit, i) => (
                <span key={unit}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <span className="whitespace-nowrap">{unit}</span>
                </span>
              ))}
            </p>
          )}
          <h1 id="case-title" className={units.length > 0 ? 'text-balance' : 'mt-4 text-balance'}>
            {project.name}
          </h1>
          {project.outcome && (
            <p className="mt-4 max-w-prose text-heading font-normal text-ink">{project.outcome}</p>
          )}
          {(github || privateRepo) && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {github ? (
                <a
                  href={github}
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-6 text-base font-semibold text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-raised"
                >
                  GitHub
                  <ArrowSquareOutIcon size={16} aria-hidden="true" />
                </a>
              ) : (
                <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-ink-muted">
                  <LockKeyIcon size={16} aria-hidden="true" />
                  <span>Source: private repository</span>
                  {/* The separator only joins the two on one line; below 640 px they stack. */}
                  <span aria-hidden="true" className="hidden sm:inline">
                    {' · '}
                  </span>
                  <Link
                    href="/contact"
                    className="prose-link inline-flex min-h-11 items-center gap-1"
                  >
                    Ask for a walkthrough
                    <ArrowRightIcon size={16} aria-hidden="true" />
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
        {figure && <div className="hidden min-w-0 lg:block">{figure}</div>}
      </header>
    </div>
  );
}
