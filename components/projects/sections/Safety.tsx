import InlineCode from '@/components/InlineCode';
import type { Project } from '@/data/types';

type SafetyBlock = NonNullable<Extract<Project, { slug: 'box' }>['safety']>;

/**
 * box's third slot (D-25; 11-UI-SPEC "Safety — box", E7). A Server Component
 * in three parts: the approved intro, one real preview run in a static figure
 * (prompt, the exact command line and the captured output, never edited or
 * shortened), then the sentence saying what `--force` would do. The preview
 * has no copy button (§I #11 default), no controls, no scroll container and
 * is not focusable: long lines wrap inside the frame. Captured text renders as
 * React text children, so it is escaped (T-11-26).
 *
 * The intro and the --force line carry Tim's approved code tokens in
 * backticks (the flag, and the file names in the --force line), set as inline
 * code by InlineCode (11-14); the backticks never render.
 *
 * Without a capture the intro renders alone (no block, no --force line); with
 * neither an intro nor a capture there is no section at all.
 */
export default function Safety({
  id,
  label,
  block,
}: {
  id: string;
  label: string;
  block: SafetyBlock;
}) {
  const { intro, capture, forceLine } = block;
  if (!intro && !capture) return null;
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-heading text-balance">
        {label}
      </h2>
      {intro && (
        <p className="mt-4 max-w-prose text-base text-ink-muted">
          <InlineCode text={intro} />
        </p>
      )}
      {capture && (
        <>
          <figure
            aria-labelledby="safety-capture"
            className="mt-6 rounded-lg border border-line bg-surface-raised"
          >
            <figcaption
              id="safety-capture"
              className="flex min-h-12 items-center border-b border-line px-4 font-mono text-sm text-ink-muted"
            >
              <span>
                <span className="whitespace-nowrap">Preview run</span>{' '}
                <span aria-hidden="true">·</span>{' '}
                <span className="whitespace-nowrap">box {capture.command}</span>
              </span>
            </figcaption>
            <pre className="p-4 font-mono text-sm whitespace-pre-wrap wrap-anywhere">
              <span className="text-ink-muted">❯ </span>
              <span className="text-ink">{capture.input}</span>
              {'\n'}
              <span className="text-ink-muted">{capture.output}</span>
            </pre>
          </figure>
          {forceLine && (
            <p className="mt-4 max-w-prose text-base text-ink-muted">
              <InlineCode text={forceLine} />
            </p>
          )}
        </>
      )}
    </section>
  );
}
