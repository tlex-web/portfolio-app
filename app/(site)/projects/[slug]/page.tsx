import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CaseStudy, { caseStudySections } from '@/components/projects/CaseStudy';
import EndBlock from '@/components/projects/EndBlock';
import RouteIndex from '@/components/projects/RouteIndex';
import Trailhead from '@/components/projects/Trailhead';
import { projects } from '@/data/projects';

/**
 * The case-study route (ENG-02 route contract, ENG-05; 11 D-01, D-22). A
 * Server Component: the Trailhead header band, then the body grid (11-UI-SPEC
 * "Page structure"): the RouteIndex beside the CaseStudy slot template, with
 * the EndBlock below. The index gets only the ids and labels of the sections
 * caseStudySections renders, so it always matches the page. The client code is
 * the RouteIndex island and the DemoTerminal island inside box's Demo section,
 * both imported directly (no next/dynamic), so three.js and R3F never load
 * here.
 *
 * Only the project slugs (box, coin-flip) exist: generateStaticParams lists
 * them, turning dynamicParams off makes every other slug a 404 (the retired
 * v1 project slugs included, with no redirect), and notFound() guards the exact,
 * case-sensitive match (/projects/BOX is a 404, as in /photos/[slug]).
 *
 * generateMetadata gives the page '{project.name} · Tim Lui' through the root
 * title template, Tim's approved pitch as the description and its own
 * canonical (SEO-01); Phase 12 attaches the OG images here (SEO-02).
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  // SEO-01: the relative canonical resolves against metadataBase (site.url, D-13).
  const alternates = { canonical: `/projects/${project.slug}` };
  return project.pitch
    ? { title: project.name, description: project.pitch, alternates }
    : { title: project.name, alternates };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <article aria-labelledby="case-title">
      <Trailhead project={project} />
      <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 md:pb-16 lg:px-8">
        <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12">
          <RouteIndex
            sections={caseStudySections(project).map(({ id, label }) => ({ id, label }))}
          />
          <div className="mt-8 first:mt-0 lg:mt-0">
            <CaseStudy project={project} />
          </div>
        </div>
        <EndBlock current={project} />
      </div>
    </article>
  );
}
