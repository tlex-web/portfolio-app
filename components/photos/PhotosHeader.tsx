import type { ReactNode } from 'react';
import { sheetPlace } from '@/data/sheet';
import { site } from '@/data/site';
import { countLabel, formatMetreRange } from '@/lib/home-format';
import type { PhotoView } from '@/lib/photos/view-model';

/** The h1 is the nav label of /photos, so the page and the nav never disagree. */
const TITLE = site.nav.find((item) => item.href === '/photos')?.label ?? 'Photographs';

/**
 * The /photos header band (D-14; 10-UI-SPEC "Header Band (D-14)", "Typography"
 * and UI Considerations E1). Server component, no motion, not sticky, no prose
 * and no hero image: the compact strip every view shares, subordinate to the
 * view below it.
 *
 * The mono kicker is derived from the data: the waypoint count (countLabel,
 * '1 waypoint' / '4 waypoints'), the lowest and highest DEM heights
 * (formatMetreRange, no 'approx.' for the hand-placed film scan, as Tim
 * confirmed on 2026-10-26) and the place from the shared sheet title
 * (data/sheet.ts). Each part is a nowrap span joined at ' · ', so a line only
 * breaks between parts; at 375 px it fits one line (311 px). The h1 is the
 * site nav label. `children` is the view switcher's slot (10-09), placed after
 * the title block; the band wraps it below the title on phones.
 *
 * @throws RangeError for zero photos: an empty gallery is a data error that
 *   fails the build, not a state to render.
 */
export default function PhotosHeader({
  photos,
  children,
}: {
  photos: readonly PhotoView[];
  children?: ReactNode;
}) {
  if (photos.length === 0) throw new RangeError('PhotosHeader: there are no photos');
  const heights = photos.map((p) => p.altitudeM);
  const parts = [
    countLabel(photos.length, 'waypoint', 'waypoints'),
    formatMetreRange(Math.min(...heights), Math.max(...heights)),
    sheetPlace,
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div
        data-photos-header
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pt-8 pb-6"
      >
        <div>
          <p data-photos-kicker className="mb-2 font-mono text-sm text-ink-muted tabular-nums">
            {parts.map((part, i) => (
              <span key={part}>
                {i > 0 ? ' · ' : null}
                <span className="whitespace-nowrap">{part}</span>
              </span>
            ))}
          </p>
          <h1>{TITLE}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
