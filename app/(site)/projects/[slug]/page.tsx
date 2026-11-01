import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CaseStudy from '@/components/projects/CaseStudy';
import Trailhead from '@/components/projects/Trailhead';
import { projects } from '@/data/projects';

/**
 * The case-study route (ENG-02 route contract, ENG-05; 11 D-01, D-22). A
 * Server Component: the Trailhead header band, then the CaseStudy slot
 * template. Only the DemoTerminal island inside box's Demo section is client
 * code, imported directly (no next/dynamic), so three.js and R3F never load
 * here.
 *
 * Only the project slugs (box, coin-flip) exist: generateStaticParams lists
 * them, turning dynamicParams off makes every other slug a 404 (the retired
 * v1 project slugs included, with no redirect), and notFound() guards the exact,
 * case-sensitive match (/projects/BOX is a 404, as in /photos/[slug]).
 *
 * generateMetadata gives the page '{project.name} · Tim Lui' through the root
 * title template and Tim's approved pitch as the description; Phase 12
 * attaches the OG images here (SEO-02).
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
  return project.pitch
    ? { title: project.name, description: project.pitch }
    : { title: project.name };
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
        <CaseStudy project={project} />
      </div>
    </article>
  );
}
