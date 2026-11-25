import { Fragment, type ReactNode } from 'react';
import Breadcrumb, { type BreadcrumbItem } from '@/components/photos/Breadcrumb';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The viewer strip (LBOX-04, LBOX-07; D-05, D-07; 10-UI-SPEC "Strip" table),
 * read like the margin of a map sheet. Server-safe: no hooks and no client
 * directive, so it renders in the server HTML of the photo page.
 *
 * Order (D-05): on the page only, the breadcrumb trail (18 D-10, the
 * `breadcrumb` prop: 'Photographs / {region} / {title}', mb-2, never at
 * heading level 2), then the title (h1 on the page, h2#photo-title as the dialog label
 * in the lightbox), place · date, the story, then the data column: the EXIF
 * list (or 'Film scan · 2019'), the altitude and position list (for a Swiss
 * photo its last line is the LV95 line, 'LV95 E … N …' under the sr-only term
 * 'Swiss grid', 18 D-14), and the rights line. Row 4 is the hotspot key (the `hotspotKey` slot, filled by
 * PhotoViewer with HotspotKey, which shows only on the key and scroll tiers).
 * Row 8 is the shortcut legend, '← → photos · Z zoom · H labels · Esc close'
 * ('Esc back to {region}' on the page, h1 surface, 18 D-09), each key in a kbd, shown
 * only from 768 px on a device that hovers with a fine pointer: the keys mean
 * nothing on touch (10-UI-SPEC Strip row 8, in place of a '?' overlay). Each
 * key and its word are one nowrap unit, so the line wraps only at ' · '.
 * The data column ends with the `share` slot (18 D-13: PhotoViewer's
 * Share / Copy link button for the shown photo), mt-4 below the rights line
 * and the legend, on the scroll tier only: from the key tier (lb-key,
 * lb-gutter) the viewer's top bar carries Share, so the strip loses that row
 * and the stage gets the height back (18-20, Tim's compact-strip choice).
 * On the scroll tier the two blocks stack in one column; on the key and
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
 * The strip holds no link but the page trail's crumbs, and no download control (LBOX-07);
 * its one control is the share slot's button (scroll tier).
 */

export type ListRow = { key: string; term?: string; value: string };

/**
 * One visual line of a list: sr-only dt, then a dd holding the nowrap value and
 * its trailing separator. The region sequence's captions (18-08 SequenceFigure)
 * print their EXIF lines with it, so both surfaces format them alike.
 */
export function ListLine({ rows }: { rows: readonly ListRow[] }) {
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

/** The EXIF rows as list lines: line 1 (camera · lens), line 2 (focal · aperture · shutter · ISO); empty lines left out. */
export function exifLineRows(strip: PhotoView['strip']): ListRow[][] {
  return ([1, 2] as const)
    .map((line) =>
      strip.exifRows
        .filter((row) => row.line === line)
        .map((row) => ({ key: row.term, term: row.term, value: row.value }))
    )
    .filter((rows) => rows.length > 0);
}

/** Row 8: only from 768 px with hover and a fine pointer (an arbitrary media variant). */
const LEGEND =
  'mt-2 hidden font-mono text-sm text-ink-muted [@media(min-width:48rem)_and_(hover:hover)_and_(pointer:fine)]:block';

export default function ExifStrip({
  view,
  headingLevel,
  backName,
  breadcrumb,
  hotspotKey,
  share,
}: {
  view: PhotoView;
  /** 1 on the photo page (the h1 surface, Escape goes back to the region), 2 in the lightbox. */
  headingLevel: 1 | 2;
  /** The page's back target by name (18 D-09), for the legend's 'Esc back to {name}'. Required at level 1. */
  backName?: string;
  /** The page's trail (18 D-10), rendered above the h1 at heading level 1 only. */
  breadcrumb?: readonly BreadcrumbItem[];
  /** Row 4, the hotspot key (HotspotKey), after the story. */
  hotspotKey?: ReactNode;
  /**
   * The Share / Copy link control (18 D-13, PHOTO-07; ShareButton, filled by
   * PhotoViewer with the shown photo's URL), the data column's last row, mt-4,
   * shown on the scroll tier only (18-20). A slot, so the strip itself stays
   * presentational and server-safe.
   */
  share?: ReactNode;
}) {
  const { title, story, rights, strip } = view;
  if (headingLevel === 1 && !backName) {
    throw new RangeError(
      `ExifStrip: the page strip needs backName (18 D-09), none for ${view.slug}`
    );
  }
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const exifLines = exifLineRows(strip);
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
          {headingLevel === 1 && breadcrumb && <Breadcrumb items={breadcrumb} className="mb-2" />}
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
          {hotspotKey}
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
              {strip.lv95 && (
                <div data-strip-lv95="">
                  <dt className="sr-only">Swiss grid</dt>
                  <dd className="whitespace-nowrap">{strip.lv95}</dd>
                </div>
              )}
            </dl>
          )}
          <p data-strip-rights="" className="mt-2 text-sm text-ink-muted">
            {rights}
          </p>
          <p data-strip-legend="" className={LEGEND}>
            <span className="whitespace-nowrap">
              <kbd>←</kbd> <kbd>→</kbd> photos
            </span>
            {' · '}
            <span className="whitespace-nowrap">
              <kbd>Z</kbd> zoom
            </span>
            {' · '}
            <span className="whitespace-nowrap">
              <kbd>H</kbd> labels
            </span>
            {' · '}
            <span className="whitespace-nowrap">
              <kbd>Esc</kbd> {headingLevel === 1 ? `back to ${backName}` : 'close'}
            </span>
          </p>
          {share && (
            <div data-strip-share="" className="mt-4 lb-key:hidden lb-gutter:hidden">
              {share}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
