import type { Project } from '@/data/types';

type PipelineBlock = NonNullable<Project['pipeline']>;

/**
 * Column classes per stage count, written out literally so Tailwind finds
 * them (G11): never build `md:grid-cols-${n}`. A new approved stage count adds
 * its own entry here; an unlisted count stays one column at every width.
 */
const COLS: Record<number, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

/**
 * The Pipeline slot (ENG-02, D-25; 11-UI-SPEC "Pipeline", E6). A Server
 * Component and a real ordered list, never an image of text: stage plates
 * numbered 01…, one column below 768 px and one row from 768 px, joined by
 * aria-hidden 1 px connectors (vertical below 768, horizontal with a 4 px
 * chevron from 768). The intro (coin-flip's fairness fact) and the In and Out
 * lines render only when approved; a stage without a description shows its
 * name alone.
 */
export default function Pipeline({
  id,
  label,
  name,
  block,
}: {
  id: string;
  label: string;
  name: string;
  block: PipelineBlock;
}) {
  const n = block.stages.length;
  if (n === 0) return null;
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-heading text-balance">
        {label}
      </h2>
      {block.intro && <p className="mt-4 max-w-prose text-base text-ink-muted">{block.intro}</p>}
      {block.in && <p className="mt-6 font-mono text-sm text-ink-muted">In: {block.in}</p>}
      <ol
        aria-label={`${name} pipeline, ${n} stages`}
        className={`${block.in ? 'mt-4' : 'mt-6'} grid gap-4 ${COLS[n] ?? ''}`}
      >
        {block.stages.map((stage, i) => (
          <li
            key={i}
            className="relative min-w-0 rounded-sm border border-line-strong bg-surface-raised p-4"
          >
            <p className="font-mono text-sm text-ink-muted">{String(i + 1).padStart(2, '0')}</p>
            <p className="mt-2 text-base font-semibold text-ink">{stage.name}</p>
            {stage.description && (
              <p className="mt-1 text-sm text-ink-muted">{stage.description}</p>
            )}
            {i < n - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-full left-1/2 h-4 w-px bg-line-strong md:top-1/2 md:left-full md:h-px md:w-4 md:after:absolute md:after:top-1/2 md:after:right-0 md:after:size-1 md:after:-translate-y-1/2 md:after:rotate-45 md:after:border-t md:after:border-r md:after:border-line-strong"
              />
            )}
          </li>
        ))}
      </ol>
      {block.out && <p className="mt-4 font-mono text-sm text-ink-muted">Out: {block.out}</p>}
    </section>
  );
}
