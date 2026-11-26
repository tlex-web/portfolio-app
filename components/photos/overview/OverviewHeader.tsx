import { site } from '@/data/site';
import { countLabel, formatYearRange } from '@/lib/home-format';

/** The h1 is the nav label of /photos, so the page and the nav never disagree. */
const TITLE = site.nav.find((item) => item.href === '/photos')?.label ?? 'Photographs';

/**
 * The Alps overview's header band on /photos (REGION-01, PHOTO-06; 18-UI-SPEC
 * Contract 1 "Header band"). Server component, no motion, not sticky: the 10
 * band (container, pt-8 pb-6, border-b) with the mono kicker above the base h1
 * 'Photographs'. The view switcher is gone (D-27), so the band has no
 * right-hand slot.
 *
 * The kicker is Tim's approved wording (18-03 D-20 row 1, 2026-11-25), derived
 * from the data: '3 regions · 11 photographs · 2016–2026' (countLabel for the
 * two counts, formatYearRange over every published photo's capture year). Each
 * part is a nowrap span joined at ' · ', so a line only breaks between parts;
 * at 375 px it fits one line (about 319 px of 343).
 *
 * @throws RangeError for zero regions or zero photos: an empty overview is a
 *   data error that fails the build, not a state to render (UI E2/empty).
 */
export default function OverviewHeader({
  regionCount,
  photoYears,
}: {
  /** The number of registry regions. */
  regionCount: number;
  /** One capture year per published photo; its length is the photo count. */
  photoYears: readonly number[];
}) {
  if (regionCount < 1) throw new RangeError('OverviewHeader: there are no regions');
  if (photoYears.length === 0) throw new RangeError('OverviewHeader: there are no photos');
  const parts = [
    countLabel(regionCount, 'region', 'regions'),
    countLabel(photoYears.length, 'photograph', 'photographs'),
    formatYearRange(photoYears),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div data-overview-header className="border-b border-line pt-8 pb-6">
        <p data-overview-kicker className="mb-2 font-mono text-sm text-ink-muted tabular-nums">
          {parts.map((part, i) => (
            <span key={part}>
              {i > 0 ? ' · ' : null}
              <span className="whitespace-nowrap">{part}</span>
            </span>
          ))}
        </p>
        <h1>{TITLE}</h1>
      </div>
    </div>
  );
}
