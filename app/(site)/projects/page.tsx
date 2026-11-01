import type { Metadata } from 'next';
import Link from 'next/link';
import RoutePanel, { type RoutePanelProps } from '@/components/projects/RoutePanel';
import RouteProfile from '@/components/projects/RouteProfile';
import { projects, projectsIntro } from '@/data/projects';
import type { Project } from '@/data/types';
import { countLabel } from '@/lib/home-format';

export const metadata: Metadata = { title: 'Engineering' };

/**
 * Maps one project to the route panel's props, the only place the page reads
 * project fields. box passes its verified GitHub link; coin-flip passes the
 * private-repository note and never a link (D-12). The kicker is the same
 * `{version} · {status}` pair the trailhead shows (D-29). The strip is the
 * audited metric tiles as label and value with their release line (D-28; only
 * `source` claims are in the data), and the figure is the project's trail
 * profile (D-05, D-07), rendered here on the server.
 */
function toPanelProps(project: Project): RoutePanelProps {
  return {
    slug: project.slug,
    name: project.name,
    kicker: project.kicker,
    pitch: project.pitch,
    links: project.slug === 'box' ? { github: project.links.github } : { privateRepo: true },
    strip: project.metrics?.tiles.map(({ key, label, value }) => ({ key, label, value })),
    releaseLine: project.metrics?.releaseLine,
    figure: project.route ? <RouteProfile id={project.route} /> : undefined,
  };
}

/**
 * /projects (ENG-01; 11-UI-SPEC "/projects (ENG-01)"). A Server Component:
 * the header band (the route count kicker, the same count as the Home trail
 * sign, and the h1 matching the nav label) above one full-width route panel
 * per project, in data order. With no projects the list is replaced by the
 * empty copy and a text link to the roadmap. Tim's approved intro paragraph
 * (D-16) sits under the h1 when there is one.
 */
export default function ProjectsPage() {
  const kicker = countLabel(projects.length, 'route', 'routes');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-16 lg:px-8">
      <div className="border-b border-line pt-8 pb-6">
        {kicker && <p className="mb-2 font-mono text-sm text-ink-muted">{kicker}</p>}
        <h1>Engineering</h1>
        {projectsIntro && (
          <p className="mt-4 max-w-prose text-base text-ink-muted">{projectsIntro}</p>
        )}
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
