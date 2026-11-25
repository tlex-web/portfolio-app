import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import TrailSign from '@/components/site/TrailSign';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';

/**
 * The case-study end block (ENG-02; 11-UI-SPEC "End block", E13). A Server
 * Component with no heading: the Next route trail sign to the other project,
 * then the page's one primary fill, 'Ask for a walkthrough' to /contact (§I #6
 * default, Tim's "All defaults (Recommended)", 11-02 default.6).
 *
 * The sign is the shared TrailSign (18-06: the plate and tip moved there
 * unchanged, the markup byte-identical): its accessible name is the explicit
 * aria-label '{other name}, next route', built from the visible strings (label
 * in name, TrailSign gives the reason); the destination wraps with
 * text-balance, 'Next route' stays on one line, and the yellow tip is
 * decorative.
 */
export default function EndBlock({ current }: { current: Project }) {
  const other = projects.find((p) => p.slug !== current.slug);

  return (
    <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
      {other ? (
        <TrailSign
          href={`/projects/${other.slug}`}
          title={other.name}
          kicker="Next route"
          ariaLabel={`${other.name}, next route`}
          tip
        />
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
