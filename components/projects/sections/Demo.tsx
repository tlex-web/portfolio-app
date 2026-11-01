import DemoTerminal from '@/components/projects/DemoTerminal';
import type { Project } from '@/data/types';

/**
 * The Demo slot (ENG-05; D-26, D-27; 11-UI-SPEC "Demo — box" and "Demo —
 * coin-flip"). A Server Component: box's approved commands go to the
 * DemoTerminal client island, imported directly (never next/dynamic with
 * ssr: false here), with the approved intro above it.
 *
 * Without commands there is no section at all (UI-SPEC E10). coin-flip's clip
 * arrives in 11-15/11-16; until then it has no Demo section, never a
 * placeholder.
 */
export default function Demo({ project }: { project: Project }) {
  if (project.slug !== 'box' || !project.demo || project.demo.commands.length === 0) return null;
  const { intro, commands } = project.demo;

  return (
    <section id="demo" aria-labelledby="demo-title">
      <h2 id="demo-title" className="text-heading text-balance">
        Demo
      </h2>
      {intro && <p className="mt-4 max-w-prose text-base text-ink-muted">{intro}</p>}
      <DemoTerminal name={project.name} commands={commands} />
    </section>
  );
}
