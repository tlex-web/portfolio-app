import type { Metadata } from 'next';
import Link from 'next/link';
import RoutePanel, { type RoutePanelProps } from '@/components/projects/RoutePanel';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';
import { countLabel } from '@/lib/home-format';

export const metadata: Metadata = { title: 'Engineering' };

/**
 * Maps one project to the route panel's props. The only place the page reads
 * project fields, so the data swap in 11-07 rewrites this mapper alone. No
 * links are passed: today's repository is private (D-12), and the panel
 * would otherwise expose it.
 */
function toPanelProps(project: Project): RoutePanelProps {
  return {
    slug: project.slug,
    name: project.name,
    kicker: { version: project.version },
    pitch: project.tagline,
  };
}

/**
 * /projects (ENG-01; 11-UI-SPEC "/projects (ENG-01)"). A Server Component:
 * the header band (the route count kicker, the same count as the Home trail
 * sign, and the h1 matching the nav label) above one full-width route panel
 * per project, in data order. With no projects the list is replaced by the
 * empty copy and a text link to the roadmap. The D-16 intro paragraph joins
 * the band in 11-07.
 */
export default function ProjectsPage() {
  const kicker = countLabel(projects.length, 'route', 'routes');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-16 lg:px-8">
      <div className="border-b border-line pt-8 pb-6">
        {kicker && <p className="mb-2 font-mono text-sm text-ink-muted">{kicker}</p>}
        <h1>Engineering</h1>
      </div>
      {projects.length === 0 ? (
        <p className="mt-8 text-base text-ink-muted">
          No routes surveyed yet. The{' '}
          <Link href="/roadmap" className="prose-link">
            roadmap
          </Link>{' '}
          shows what is being built.
        </p>
      ) : (
        <ol aria-label="Routes" className="mt-8 flex flex-col gap-6">
          {projects.map((project) => (
            <li key={project.slug}>
              <RoutePanel {...toPanelProps(project)} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
