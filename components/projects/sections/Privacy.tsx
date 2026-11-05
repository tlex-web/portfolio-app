import type { Project } from '@/data/types';

type PrivacyBlock = NonNullable<Extract<Project, { slug: 'coin-flip' }>['privacy']>;

/**
 * coin-flip's third slot (D-25; 11-UI-SPEC "Privacy — coin-flip", E8). A
 * Server Component: an optional intro, then the approved facts as a list
 * with an 8 x 1 px dash marker (no icons, no grades). The fairness fact is
 * not here; it lives in Pipeline. With no fact left the section is omitted.
 */
export default function Privacy({
  id,
  label,
  block,
}: {
  id: string;
  label: string;
  block: PrivacyBlock;
}) {
  if (block.facts.length === 0) return null;
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-heading text-balance">
        {label}
      </h2>
      {block.intro && <p className="mt-4 max-w-prose text-base text-ink-muted">{block.intro}</p>}
      <ul className="mt-6 flex max-w-prose flex-col gap-2">
        {block.facts.map((fact) => (
          <li
            key={fact}
            className="relative pl-4 text-base text-ink-muted before:absolute before:left-0 before:top-3 before:h-px before:w-2 before:bg-ink-muted"
          >
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
