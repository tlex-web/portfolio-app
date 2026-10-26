import { Fragment } from 'react';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The viewer strip (LBOX-04, LBOX-07; D-05, D-07; 10-UI-SPEC "Strip" table),
 * read like the margin of a map sheet. Server-safe: no hooks and no client
 * directive, so it renders in the server HTML of the photo page.
 *
 * Order (D-05): the title (h1 on the page, h2#photo-title as the dialog label
 * in the lightbox), place · date, the story, then the data column: the EXIF
 * list (or 'Film scan · 2019'), the altitude and position list, and the
 * rights line last. Rows 4 (hotspot key) and 8 (shortcut legend) arrive in
 * 10-11. On the scroll tier the two blocks stack in one column; on the key and
 * gutter tiers (lb-key, lb-gutter) they sit side by side in a 3fr / 2fr grid
 * with a 32 px gap: identity and story left, data right. At 1440 the 420 px
 * right column holds EXIF line 1 and the approximate position line on one
 * line each; narrower, they wrap at ' · ' only. Nothing truncates.
 *
 * Every value comes from view.strip, which already left out anything missing
 * (D-07), so nothing here prints '—', 'unknown', 'undefined', 'null' or 'NaN',
 * and no separator is drawn without a unit on both sides. The lists use
 * sr-only terms so a screen reader hears 'Camera Canon EOS 6D Mark II, Lens …'
 * while the eye reads one mono line. Each value is a nowrap unit; the
 * aria-hidden ' ·' separator sits at the end of the unit before it, followed
 * by a plain space inside the same dd (valid dl content), so a line wraps only
 * after a separator, never inside a value or before a '·'.
 * The strip holds no link and no download control (LBOX-07).
 */

type ListRow = { key: string; term?: string; value: string };

/** One visual line of a list: sr-only dt, then a dd holding the nowrap value and its trailing separator. */
function ListLine({ rows }: { rows: readonly ListRow[] }) {
  return rows.map((row, i) => (
    <Fragment key={row.key}>
      {row.term && <dt className="sr-only">{row.term}</dt>}
      <dd className="inline">
        <span className="whitespace-nowrap">{row.value}</span>
        {i < rows.length - 1 && (
          <>
            <span aria-hidden="true" className="whitespace-nowrap">
              {' ·'}
            </span>{' '}
          </>
        )}
      </dd>
    </Fragment>
  ));
}

export default function ExifStrip({
  view,
  headingLevel,
}: {
  view: PhotoView;
  headingLevel: 1 | 2;
}) {
  const { title, story, rights, strip } = view;
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const exifLines = ([1, 2] as const)
    .map((line) =>
      strip.exifRows
        .filter((row) => row.line === line)
        .map((row) => ({ key: row.term, term: row.term, value: row.value }))
    )
    .filter((rows) => rows.length > 0);
  const positionRows: ListRow[] = strip.positionRows.map((row) => ({
    key: row.term,
    term: row.term,
    value: row.value,
  }));
  if (strip.approxNote) positionRows.push({ key: 'approx', value: strip.approxNote });

  return (
    <div data-photo-strip="" className="shrink-0 border-t border-line bg-gallery py-4">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 lb-key:grid lb-key:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lb-key:gap-x-8 lb-gutter:grid lb-gutter:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lb-gutter:gap-x-8">
        <div data-strip-identity="">
          <Title
            id={headingLevel === 2 ? 'photo-title' : undefined}
            className="font-display text-heading font-semibold text-ink"
          >
            {title}
          </Title>
          <p className="mt-1 font-mono text-sm text-ink-muted tabular-nums">
            {strip.placeDate.place}
            <span data-strip-date="" className="whitespace-nowrap">
              {' · '}
              {strip.placeDate.date}
            </span>
          </p>
          <p className="mt-2 max-w-prose text-base text-ink-muted">{story}</p>
        </div>
        <div data-strip-data="" className="mt-4 lb-key:mt-0 lb-gutter:mt-0">
          {strip.filmLine && (
            <p data-strip-film="" className="font-mono text-sm text-ink tabular-nums">
              {strip.filmLine}
            </p>
          )}
          {exifLines.length > 0 && (
            <dl data-strip-exif="" className="font-mono text-sm text-ink tabular-nums">
              {exifLines.map((rows, i) => (
                <div key={i} data-strip-line="">
                  <ListLine rows={rows} />
                </div>
              ))}
            </dl>
          )}
          {positionRows.length > 0 && (
            <dl data-strip-position="" className="mt-2 font-mono text-sm text-ink tabular-nums">
              <div>
                <ListLine rows={positionRows} />
              </div>
            </dl>
          )}
          <p data-strip-rights="" className="mt-2 text-sm text-ink-muted">
            {rights}
          </p>
        </div>
      </div>
    </div>
  );
}
