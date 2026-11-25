import Link from 'next/link';
import { MapTrifoldIcon } from '@/components/icons/inline-phosphor';
import FactsLine from '@/components/photos/region/FactsLine';
import TrailSign from '@/components/site/TrailSign';

/**
 * What the end-of-series card shows, all strings and hrefs, built on the server
 * by regionEndCard (lib/regions.ts) and passed to PhotoViewer as a prop.
 */
export type EndCardProps = {
  /** The region's bare name ('Zermatt'). */
  regionName: string;
  /** 'End of the {name} series'. */
  heading: string;
  /** This region's regionCardFacts parts: count, range, years. */
  facts: readonly string[];
  /** The next region west to east (D-11 wrap), or null with a single region. */
  next: { heading: string; href: string; facts: readonly string[] } | null;
  /** 'All regions': the overview, /photos. */
  allHref: string;
  /** The live-region sentence: 'End of the {name} series. Next region: {heading}.' */
  announcement: string;
};

/**
 * P5 (18-01, Tim's reply "Defaults (Recommended)"): the next-region sign keeps
 * the trail-yellow tip, as on the region page's NextRegion block.
 */
const TIP = true;

/**
 * The viewer's end-of-series card (LBOX-09, 18 D-12; 18-UI-SPEC Contract 3
 * "End-of-series card", UI E7): one extra step after a region's last photo,
 * shown by PhotoViewer in place of the stage and the strip. The heading takes
 * the strip title's role (h2#photo-title in the dialog, so its aria-labelledby
 * still resolves; h1 on the photo page), then this region's facts line, the
 * shared trail sign to the next region with that region's facts line under it,
 * and 'All regions'. With a single region the sign and its facts are not
 * rendered and only 'All regions' remains (UI E7 zero-one-many).
 *
 * Props only: no region, registry or generated-data import (T-18-35), so the
 * card adds no data to the viewer's client chunk. It swaps in instantly, like
 * a photo step, under every motion preference.
 */
export default function EndCard({
  card,
  headingLevel,
}: {
  card: EndCardProps;
  headingLevel: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div data-end-card="" className="flex w-full max-w-md flex-col gap-4 px-4">
      <Heading
        id={headingLevel === 2 ? 'photo-title' : undefined}
        className="font-display text-heading font-semibold text-balance text-ink"
      >
        {card.heading}
      </Heading>
      <FactsLine parts={card.facts} />
      {card.next ? (
        <div className="flex flex-col gap-2">
          <TrailSign
            href={card.next.href}
            title={card.next.heading}
            kicker="Next region"
            ariaLabel={`${card.next.heading}, next region`}
            tip={TIP}
          />
          <FactsLine parts={card.next.facts} />
        </div>
      ) : null}
      <Link
        href={card.allHref}
        className="inline-flex min-h-11 touch-manipulation items-center gap-2 self-start text-base font-semibold text-ink-muted hover:text-ink"
      >
        <MapTrifoldIcon size={20} aria-hidden="true" />
        All regions
      </Link>
    </div>
  );
}
