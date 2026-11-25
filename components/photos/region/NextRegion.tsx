import Link from 'next/link';
import { MapTrifoldIcon } from '@phosphor-icons/react/dist/ssr';
import type { Region } from '@/data/schemas/region';
import FactsLine from '@/components/photos/region/FactsLine';
import TrailSign from '@/components/site/TrailSign';
import { nextRegion, regionCardFacts, regionHeading } from '@/lib/regions';
import { regionHref } from '@/lib/photos/routes';

/** What the block shows of the next region, all strings: its link, heading and facts parts. */
export type NextRegionTarget = { href: string; heading: string; facts: readonly string[] };

/**
 * P5 (18-01, Tim's reply "Defaults (Recommended)"): the next-region sign
 * keeps the trail-yellow tip, a new bg-trail use with 11's "next route" meaning.
 */
const TIP = true;

/**
 * The next-region block as markup (18-UI-SPEC Contract 2 "Next-region block",
 * UI E7), from strings only, so the empty case is testable: with no next region
 * (a one-region registry) only 'All regions' renders, no sign and no facts line.
 */
export function NextRegionView({ next }: { next: NextRegionTarget | undefined }) {
  return (
    <section id="next-region" aria-labelledby="next-region-title" className="bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start border-t border-line py-12 md:py-16">
          <h2 id="next-region-title">Next region</h2>
          {next ? (
            <>
              <TrailSign
                href={next.href}
                title={next.heading}
                kicker="Next region"
                ariaLabel={`${next.heading}, next region`}
                tip={TIP}
                className="group mt-6 flex min-h-14 w-full max-w-md items-stretch rounded-sm"
              />
              <FactsLine parts={next.facts} className="mt-2" />
            </>
          ) : null}
          <Link
            href="/photos"
            className="mt-6 inline-flex min-h-11 touch-manipulation items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink"
          >
            <MapTrifoldIcon size={20} aria-hidden="true" />
            All regions
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * The region page's last block (REGION-02; D-01, D-11): h2 'Next region', the
 * shared trail sign to the next region west to east, wrapping from the last to
 * the first (Saalfelden → Zermatt), named '{heading}, next region', the next
 * region's regionCardFacts line (an all-aerial region prints its 'ground'
 * range), then 'All regions' to /photos. A Server Component of plain links: no
 * data fetch and nothing to load (UI E7/loading).
 *
 * @throws RangeError for an id that is not a registry region.
 */
export default function NextRegion({ id }: { id: string }) {
  const next = nextRegion(id);
  return <NextRegionView next={next ? targetOf(next) : undefined} />;
}

/** The strings the block shows of a region: its page, its heading and its card facts. */
function targetOf(region: Region): NextRegionTarget {
  const facts = regionCardFacts(region.id);
  return {
    href: regionHref(region.id),
    heading: regionHeading(region),
    facts: [facts.count, facts.range, facts.years],
  };
}
