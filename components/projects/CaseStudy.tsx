import type { ReactNode } from 'react';
import Demo, { hasDemo } from '@/components/projects/sections/Demo';
import Metrics from '@/components/projects/sections/Metrics';
import NextSteps from '@/components/projects/sections/NextSteps';
import Pipeline from '@/components/projects/sections/Pipeline';
import Privacy from '@/components/projects/sections/Privacy';
import Problem from '@/components/projects/sections/Problem';
import Safety from '@/components/projects/sections/Safety';
import Stack from '@/components/projects/sections/Stack';
import { roadmapItems } from '@/data/roadmap';
import type { Project } from '@/data/types';
import type { RouteLogItem } from '@/lib/route-log';

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
 * A project's next steps resolved against the route log (N4, D-32): only
 * rows of this project that are planned or in progress, in the order the
 * project lists them. An unknown or completed id is dropped here, and the
 * data test forbids one in the first place.
 */
function nextStepRows(project: Project): RouteLogItem[] {
  return (project.nextSteps ?? []).flatMap((id) => {
    const row = roadmapItems.find((r) => r.id === id);
    return row && row.area === project.slug && row.status !== 'completed' ? [row] : [];
  });
}

/**
 * One renderer per slot behind an exhaustive switch: a new slot fails the
 * `never` check at compile time. A renderer returns null when its block has
 * no approved data, so the section, its heading and its index entry are all
 * left out (ENG-02 data-optional rule). Problem, Pipeline and the third slot
 * (Safety on box, Privacy on coin-flip) render since 11-11; Metrics, Stack
 * and Next steps since 11-13; coin-flip's clip joins Demo in 11-15 (shown
 * only with a manifest entry and an approved description, D-27).
 */
function renderSlot(slot: Slot, project: Project): ReactNode {
  switch (slot) {
    case 'problem':
      return project.problem?.length ? (
        <Problem {...slotMeta(slot, project)} paragraphs={project.problem} />
      ) : null;
    case 'pipeline':
      return project.pipeline ? (
        <Pipeline {...slotMeta(slot, project)} name={project.name} block={project.pipeline} />
      ) : null;
    case 'safety':
      if (project.slug === 'coin-flip') {
        return project.privacy ? (
          <Privacy {...slotMeta(slot, project)} block={project.privacy} />
        ) : null;
      }
      return project.safety?.intro || project.safety?.capture ? (
        <Safety {...slotMeta(slot, project)} block={project.safety} />
      ) : null;
    case 'metrics':
      return project.metrics?.tiles.length ? (
        <Metrics {...slotMeta(slot, project)} tiles={project.metrics.tiles} />
      ) : null;
    case 'demo':
      return hasDemo(project) ? <Demo project={project} /> : null;
    case 'stack':
      return project.stack ? (
        <Stack {...slotMeta(slot, project)} groups={project.stack.groups} />
      ) : null;
    case 'next-steps': {
      const rows = nextStepRows(project);
      return rows.length > 0 ? (
        <NextSteps {...slotMeta(slot, project)} slug={project.slug} rows={rows} />
      ) : null;
    }
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
