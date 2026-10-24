import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { waypointKicker, type Waypoint } from '@/lib/ascent/waypoints';

/**
 * One waypoint card (HOME-05; D-07, D-08; 09-UI-SPEC "Waypoint Cards"). Server
 * component, always in the DOM in every mode: the cards are Home's waypoint
 * list, the focus target and the e2e/axe anchor.
 *
 * The section is labelled by its h2. "View photo" opens the gallery at this
 * photo (/photos#{slug}) until Phase 10 ships /photos/{slug}; its accessible
 * name adds the title so the four links are distinguishable out of context.
 */
export default function WaypointCard({ waypoint }: { waypoint: Waypoint }) {
  const titleId = `waypoint-${waypoint.slug}-title`;

  return (
    <section aria-labelledby={titleId}>
      <p className="font-mono text-sm text-ink-muted tabular-nums">{waypointKicker(waypoint)}</p>
      <h2 id={titleId}>{waypoint.title}</h2>
      <Link
        href={`/photos#${waypoint.slug}`}
        aria-label={`View photo: ${waypoint.title}`}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-6 text-base font-semibold text-ink"
      >
        View photo
        <ArrowRightIcon size={20} aria-hidden="true" />
      </Link>
    </section>
  );
}
