import type { Metadata } from 'next';
import OverviewHeader from '@/components/photos/overview/OverviewHeader';
import RegionList, { type RegionListRow } from '@/components/photos/overview/RegionList';
import { pageMetadata } from '@/lib/metadata';
import { publishedViews } from '@/lib/photos/view-model';
import {
  regionCardFacts,
  regionCover,
  regionHeading,
  regionNumber,
  regionsWestToEast,
} from '@/lib/regions';

// SEO-01: own title, description and canonical. The description is Tim's
// approved copy (18-03 D-20 row 2, 2026-11-25), with no count to go stale.
// /photos?view=map and every other value that is not a retired view render
// this page, and its canonical stays /photos.
export const metadata: Metadata = pageMetadata({
  title: 'Photographs',
  description:
    'Landscape photographs from across the Alps, each placed on the terrain where Tim took it.',
  path: '/photos',
});

/**
 * /photos, the Alps overview (REGION-01, PHOTO-06; D-01..D-04, D-27;
 * 18-UI-SPEC Contract 1). A Server Component that reads no searchParams
 * (rendered per request like every page, for the CSP nonce): the view switch
 * is retired, and the retired `?view=grid` and
 * `?view=carousel` URLs never reach it, because proxy.ts answers them with a
 * 308 to the Zermatt region page before render (D-03); `?view=map` and any
 * other value render this overview unchanged.
 *
 * The header band (OverviewHeader: the kicker '3 regions · 11 photographs ·
 * 2016–2026' and the h1) sits above the region list, one row per region west
 * to east (regionsWestToEast, D-01), each built here from plain server data:
 * regionNumber for the badge, regionHeading, regionCardFacts' count, range and
 * years, and regionCover's tile derivatives (D-02). The list sits in the
 * right-hand 20rem column from 1024 px, the place UI-SPEC Contract 1 gives it
 * beside the overview sheet, which 18-23 adds in the left column; below
 * 1024 px it is one column.
 */
export default function PhotosPage() {
  const rows: RegionListRow[] = regionsWestToEast().map((region) => {
    const facts = regionCardFacts(region.id);
    return {
      id: region.id,
      number: regionNumber(region.id),
      heading: regionHeading(region),
      count: facts.count,
      range: facts.range,
      years: facts.years,
      cover: regionCover(region.id).tile,
    };
  });

  return (
    <>
      <OverviewHeader regionCount={rows.length} photoYears={publishedViews.map((v) => v.years)} />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 md:pb-16 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 lg:px-8">
        <div className="lg:col-start-2">
          <RegionList rows={rows} />
        </div>
      </div>
    </>
  );
}
