import type { ReactNode } from 'react';
import Demo from '@/components/projects/sections/Demo';
import type { Project } from '@/data/types';

/**
 * The case-study slot order (ENG-02; RESEARCH Pattern 2). Order lives here,
 * never in data, and each slot appears at most once. The third slot is the
 * project's safety or privacy story (D-25).
 */
export const SECTION_ORDER = [
  'problem',
  'pipeline',
  'safety',
  'metrics',
  'demo',
  'stack',
  'next-steps',
] as const;

export type Slot = (typeof SECTION_ORDER)[number];

const LABELS: Record<Exclude<Slot, 'safety'>, string> = {
  problem: 'Problem',
  pipeline: 'Pipeline',
  metrics: 'Metrics',
  demo: 'Demo',
  stack: 'Stack',
  'next-steps': 'Next steps',
};

/**
 * The stable, shareable id and the visible label of a slot on a project
 * (11-UI-SPEC "Section ids and labels"). The third slot is `safety`/`Safety`
 * on box and `privacy`/`Privacy` on coin-flip (D-25); its position never
 * changes.
 */
export function slotMeta(slot: Slot, project: Project): { id: string; label: string } {
  if (slot === 'safety') {
    return project.slug === 'box'
      ? { id: 'safety', label: 'Safety' }
      : { id: 'privacy', label: 'Privacy' };
  }
  return { id: slot, label: LABELS[slot] };
}

/**
 * One renderer per slot behind an exhaustive switch: a new slot fails the
 * `never` check at compile time. A renderer returns null when its block has
 * no approved data, so the section, its heading and its index entry are all
 * left out (ENG-02 data-optional rule). Problem, Pipeline, Safety/Privacy,
 * Metrics, Stack and Next steps have their data already and gain their
 * renderers in 11-11 and 11-13; coin-flip's clip joins Demo in 11-15.
 */
function renderSlot(slot: Slot, project: Project): ReactNode {
  switch (slot) {
    case 'problem':
      return null;
    case 'pipeline':
      return null;
    case 'safety':
      return null;
    case 'metrics':
      return null;
    case 'demo':
      return project.slug === 'box' && project.demo?.commands.length ? (
        <Demo project={project} />
      ) : null;
    case 'stack':
      return null;
    case 'next-steps':
      return null;
    default: {
      const unreachable: never = slot;
      return unreachable;
    }
  }
}

/** The sections a project renders, in slot order, each with its id and label. */
export function caseStudySections(
  project: Project
): { id: string; label: string; node: ReactNode }[] {
  return SECTION_ORDER.flatMap((slot) => {
    const node = renderSlot(slot, project);
    return node == null ? [] : [{ ...slotMeta(slot, project), node }];
  });
}

/**
 * The case-study body (11-UI-SPEC "Page structure"): the rendered sections in
 * slot order, the first flush and each later one `mt-16` below the last.
 */
export default function CaseStudy({ project }: { project: Project }) {
  const sections = caseStudySections(project);
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section, i) => (
        <div key={section.id} className={i === 0 ? 'mt-0' : 'mt-16'}>
          {section.node}
        </div>
      ))}
    </>
  );
}
