/**
 * A region's mono data line, '{count} · {range} · {years}' (18-UI-SPEC
 * Contract 2: the header band's data line and the next-region block's facts).
 * Props only: the caller passes regionCardFacts' parts in order. Each part is
 * nowrap, so a line wraps only between parts, at a ' · ' separator, as on
 * PhotosHeader's kicker; the range keeps its U+00A0 after 'ground'.
 */
export default function FactsLine({
  parts,
  className,
}: {
  parts: readonly string[];
  className?: string;
}) {
  return (
    <p data-facts-line className={`font-mono text-sm text-ink-muted ${className ?? ''}`.trim()}>
      {parts.map((part, i) => (
        <span key={`${i}-${part}`}>
          {i > 0 ? ' · ' : null}
          <span className="whitespace-nowrap">{part}</span>
        </span>
      ))}
    </p>
  );
}
