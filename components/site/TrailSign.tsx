import Link from 'next/link';

/**
 * The trail-sign plate of Home's TrailSigns (09 "Trail Signs"), without the
 * count column. No vertical padding: the link's min-h-14 (the TrailSigns
 * height) and items-stretch give the plate its height (12-UI-SPEC D-24).
 */
export const PLATE =
  'flex flex-1 items-center justify-between gap-4 rounded-l-sm border border-line-strong bg-surface-raised px-4 transition-colors duration-(--duration-fast) ease-erosion group-hover:border-ink-muted group-hover:bg-surface-overlay';

/** The tip's arrow: a triangle pointing along the trail. */
export const TIP_CLIP = { clipPath: 'polygon(0 0, 100% 50%, 0 100%)' } as const;

/** The outer link's box when the caller passes none: the 11 EndBlock sign. */
const SIGN = 'group flex min-h-14 w-full max-w-md items-stretch rounded-sm';

/**
 * The shared trail sign (18-06; 11 "End block", 18-UI-SPEC Contract 2
 * "Next-region block", Interaction States "Trail sign"): one link holding a
 * raised plate with the destination and a mono kicker ('Next route', 'Next
 * region'), and, with `tip`, the 24 px trail-yellow tip (decorative, the same
 * "next route" meaning as 11's sign; P5 kept it for the region pages). The
 * case-study EndBlock, the region page's NextRegion and the viewer's end card
 * render it.
 *
 * Props only: strings and an href, no data import and no hooks, so it renders
 * in server and client trees alike and no server-only module reaches a client
 * chunk through it (T-18-17).
 *
 * The accessible name is the explicit `ariaLabel`, built by the caller from
 * the visible strings ('{title}, next region'; label in name), for the reason
 * TrailSigns gives: the plate is a flex box, so an sr-only comma would gain a
 * leading space in name computation. The space between the plate's spans
 * renders nothing; it keeps the strings apart for label-in-name checks. The
 * destination wraps with text-balance; the kicker stays on one line.
 */
export default function TrailSign({
  href,
  title,
  kicker,
  ariaLabel,
  tip,
  className = SIGN,
}: {
  href: string;
  title: string;
  kicker: string;
  ariaLabel: string;
  tip: boolean;
  className?: string;
}) {
  return (
    <Link href={href} aria-label={ariaLabel} className={className}>
      <span className={PLATE}>
        <span className="text-base font-semibold text-balance text-ink">{title}</span>{' '}
        <span className="font-mono text-sm whitespace-nowrap text-ink-muted">{kicker}</span>
      </span>
      {tip ? <span aria-hidden="true" className="w-6 shrink-0 bg-trail" style={TIP_CLIP} /> : null}
    </Link>
  );
}
