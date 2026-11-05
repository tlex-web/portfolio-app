import DemoClip from '@/components/projects/DemoClip';
import DemoTerminal from '@/components/projects/DemoTerminal';
import { mediaManifest } from '@/data/generated/media-manifest';
import type { Project } from '@/data/types';

/**
 * Whether a project has a Demo to show: box with at least one approved
 * command (ENG-05, D-26), coin-flip with an encoded clip in the media manifest
 * and an approved text description (D-27). CaseStudy uses it so the section
 * and its index entry are left out together (10 D-07).
 */
export function hasDemo(project: Project): boolean {
  if (project.slug === 'box') return Boolean(project.demo && project.demo.commands.length > 0);
  return Boolean(mediaManifest['coin-flip-toss'] && project.clip?.description);
}

/**
 * The Demo slot (ENG-05; D-26, D-27; 11-UI-SPEC "Demo — box" and "Demo —
 * coin-flip"). A Server Component: box's approved commands go to the
 * DemoTerminal client island, imported directly (never next/dynamic with
 * ssr: false here), with the approved intro above it.
 *
 * coin-flip shows its muted, click-to-play clip (DemoClip) only when the
 * manifest has 'coin-flip-toss' and the project carries an approved
 * description; the optional intro sits above it.
 *
 * Without commands or without an approved clip there is no section at all
 * (UI-SPEC E10, E18), never a placeholder, still or "coming soon".
 */
export default function Demo({ project }: { project: Project }) {
  if (!hasDemo(project)) return null;

  const intro = project.slug === 'box' ? project.demo?.intro : project.clip?.intro;
  const media = mediaManifest['coin-flip-toss'];

  return (
    <section id="demo" aria-labelledby="demo-title">
      <h2 id="demo-title" className="text-heading text-balance">
        Demo
      </h2>
      {intro && <p className="mt-4 max-w-prose text-base text-ink-muted">{intro}</p>}
      {project.slug === 'box' && project.demo ? (
        <DemoTerminal name={project.name} commands={project.demo.commands} />
      ) : project.slug === 'coin-flip' && project.clip && media ? (
        <DemoClip description={project.clip.description} media={media} />
      ) : null}
    </section>
  );
}
