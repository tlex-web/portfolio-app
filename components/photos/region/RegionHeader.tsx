import type { ReactNode } from 'react';
import Breadcrumb from '@/components/photos/Breadcrumb';
import FactsLine from '@/components/photos/region/FactsLine';
import { regionBreadcrumb, regionById, regionCardFacts, regionHeading } from '@/lib/regions';

/**
 * The region page's header band (REGION-02; D-10; 18-UI-SPEC Contract 2
 * "Header band"). A Server Component inside the page's container, in the
 * 10 band shape PhotosHeader uses (pt-8 pb-6, border-b, flex-wrap, items-end),
 * so /photos and the region pages share a rhythm.
 *
 * Left: the breadcrumb in the kicker's slot ('Photographs' / '{region name}',
 * from regionBreadcrumb, the same list the page's BreadcrumbList JSON-LD
 * reads), the h1 regionHeading ('Zermatt, Switzerland') and the mono data line
 * '{count} · {range} · {years}' from regionCardFacts, an all-aerial region
 * printing its 'ground' range. Right: the `end` slot, empty until 18-07 puts
 * Share region there; it wraps below the title on phones.
 *
 * @throws RangeError for an id that is not a registry region.
 */
export default function RegionHeader({ id, end }: { id: string; end?: ReactNode }) {
  const region = regionById(id);
  if (!region) throw new RangeError(`RegionHeader: ${id} is not a registry region`);
  const facts = regionCardFacts(id);
  const crumbs = regionBreadcrumb(id).map((c) => ({ name: c.name, href: c.path }));

  return (
    <div
      data-region-header
      className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pt-8 pb-6"
    >
      <div className="min-w-0">
        <Breadcrumb items={crumbs} className="mb-2" />
        <h1>{regionHeading(region)}</h1>
        <FactsLine parts={[facts.count, facts.range, facts.years]} className="mt-2" />
      </div>
      {end ? <div className="shrink-0">{end}</div> : null}
    </div>
  );
}
