import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import type { SheetMarginModel } from '@/lib/sheet-margin';

const ROW = 'flex flex-wrap gap-x-2';
const DT = 'font-body';
const DD = 'text-ink';

/**
 * Nowrap units joined at ' · ' (UI E9/overflow): a line breaks only between
 * two units, never inside a corner or a summit's name and height.
 */
function Units({ parts }: { parts: readonly string[] }) {
  return parts.map((part, i) => (
    <Fragment key={part}>
      {i > 0 && ' · '}
      <span className="whitespace-nowrap">{part}</span>
    </Fragment>
  ));
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className={ROW}>
      <dt className={DT}>{term}</dt>
      <dd className={DD}>{children}</dd>
    </div>
  );
}

/**
 * A map sheet's compact margin (REGION-06; 18 D-16..D-19; 18-UI-SPEC Contract
 * 7 "SheetMargin"): the figcaption of the map figure. The title line, then
 * Extent, Last surveyed and Source, and on the overview a Summits row.
 *
 * Server component, props only: the caller builds the model on the server with
 * lib/sheet-margin.ts (which reads the plate registry), so no data module
 * reaches a client chunk. Not the footer's SheetLegend, which keeps its own
 * layout.
 *
 * The Source link is a next/link to the source's /sources entry, which scrolls
 * to the anchor. It is the margin's only link, so a 24 px circle around it
 * meets no other target (WCAG 2.5.8 spacing exception) without a 44 px row in
 * the caption. A notice source (a licence that needs its full text at the map;
 * not chosen so far, Tim's G1) prints its verbatim paragraphs, then a
 * 'Licence and details' link.
 */
export default function SheetMargin({
  margin,
  className = '',
}: {
  margin: SheetMarginModel;
  /** Extra classes, e.g. the container gutters under a full-bleed sheet. */
  className?: string;
}) {
  const { title, interval, extent, lastSurveyed, source, summits } = margin;
  return (
    <figcaption
      data-sheet-margin
      className={`mt-2 font-mono text-sm text-ink-muted ${className}`.trim()}
    >
      <p>
        {title} · contours every {interval}
      </p>
      <dl className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
        <Row term={extent.label}>
          <Units parts={extent.parts} />
        </Row>
        <Row term="Last surveyed">{lastSurveyed}</Row>
        <Row term="Source">
          {source.kind === 'link' ? (
            <Link className="prose-link" href={source.href}>
              {source.text}
            </Link>
          ) : (
            <>
              {source.paragraphs.map((p) => (
                <p key={p} className="max-w-prose font-body text-sm text-ink-muted">
                  {p}
                </p>
              ))}
              <Link className="prose-link font-body" href={source.href}>
                Licence and details
              </Link>
            </>
          )}
        </Row>
        {summits && (
          <Row term="Summits">
            <Units parts={summits} />
          </Row>
        )}
      </dl>
    </figcaption>
  );
}
