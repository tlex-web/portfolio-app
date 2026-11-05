import { SummitStats } from '@/components/home/SummitPlaque';
import { summitPlaque } from '@/lib/ascent/summit';

/**
 * The compact layout's kicker and stats (HOME-06; D-03; G-09-2, Tim: "Compact
 * plaque + measured 3D", 09-18; 09-UI-SPEC "Summit details (compact only)").
 * Server component.
 *
 * In the compact summit layout the plaque over the frame keeps only the name
 * and height, so the four waypoints stay in view; the rest of the plaque
 * follows the ascent here, in one solid plate. It renders after the ascent
 * grid, outside the track, so no arrival or "#summit" centring changes. It has
 * no heading of its own (the outline has no h3): the group takes the summit h2
 * as its name. Display none in the full layout and under reduced motion, where
 * the plaque shows these stats itself.
 */
export default function SummitDetails() {
  const { kicker } = summitPlaque();

  return (
    <div
      data-summit-details
      role="group"
      aria-labelledby="summit-title"
      className="mx-auto hidden w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 summit-compact:motion-safe:block"
    >
      <div className="w-full max-w-md rounded-sm border border-line-strong bg-surface-raised p-6">
        <p className="font-mono text-sm text-ink-muted">{kicker}</p>
        <SummitStats className="mt-6" />
      </div>
    </div>
  );
}
