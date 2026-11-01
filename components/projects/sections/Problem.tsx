/**
 * The Problem slot (ENG-02, D-16, D-30; 11-UI-SPEC "Problem"). A Server
 * Component: Tim's approved paragraphs, rendered as written, one `<p>` each.
 * Without a paragraph there is no section at all (ENG-02 omit rule).
 */
export default function Problem({
  id,
  label,
  paragraphs,
}: {
  id: string;
  label: string;
  paragraphs: string[];
}) {
  if (paragraphs.length === 0) return null;
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId}>
      <h2 id={titleId} className="text-heading text-balance">
        {label}
      </h2>
      {paragraphs.map((text, i) => (
        <p key={i} className="mt-4 max-w-prose text-base text-ink-muted">
          {text}
        </p>
      ))}
    </section>
  );
}
