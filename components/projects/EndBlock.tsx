import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';

/** The trail-sign plate of Home's TrailSigns (09 "Trail Signs"), without the count column. */
const PLATE =
  'flex flex-1 items-center justify-between gap-4 rounded-l-sm border border-line-strong bg-surface-raised px-4 py-3 transition-colors duration-(--duration-fast) ease-erosion group-hover:border-ink-muted group-hover:bg-surface-overlay';
const TIP_CLIP = { clipPath: 'polygon(0 0, 100% 50%, 0 100%)' } as const;

/**
 * The case-study end block (ENG-02; 11-UI-SPEC "End block", E13). A Server
 * Component with no heading: the Next route trail sign to the other project,
 * then the page's one primary fill, 'Ask for a walkthrough' to /contact (§I #6
 * default, Tim's "All defaults (Recommended)", 11-02 default.6).
 *
 * The sign's accessible name is an explicit aria-label, '{other name}, next
 * route', built from the visible strings (label in name), for the reason
 * TrailSigns gives: the plate is a flex box, so an sr-only comma would gain a
 * leading space in name computation. The destination wraps with text-balance;
 * 'Next route' stays on one line. The yellow tip is decorative.
 */
export default function EndBlock({ current }: { current: Project }) {
  const other = projects.find((p) => p.slug !== current.slug);

  return (
    <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
      {other ? (
        <Link
          href={`/projects/${other.slug}`}
          aria-label={`${other.name}, next route`}
          className="group flex min-h-14 w-full max-w-md items-stretch rounded-sm"
        >
          <span className={PLATE}>
            <span className="text-base font-semibold text-balance text-ink">{other.name}</span>
            <span className="font-mono text-sm whitespace-nowrap text-ink-muted">Next route</span>
          </span>
          <span aria-hidden="true" className="w-6 shrink-0 bg-trail" style={TIP_CLIP} />
        </Link>
      ) : null}
      <Link
        href="/contact"
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-sm bg-accent px-6 text-base font-semibold text-ink-inverse hover:bg-accent-hover md:self-auto"
      >
        Ask for a walkthrough
        <ArrowRightIcon size={20} aria-hidden="true" />
      </Link>
    </div>
  );
}
