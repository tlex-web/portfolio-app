import TrailSigns from '@/components/home/TrailSigns';
import { summitPlaque } from '@/lib/ascent/summit';

/**
 * The four plaque stats as a dl (HOME-06; 09-UI-SPEC "Summit-plaque stats").
 * Server component. Rendered twice: inside the full plaque, and in
 * SummitDetails for the compact layout. Each copy is display none in the other
 * layout, so only one is ever in the accessibility tree.
 */
export function SummitStats({ className = '' }: { className?: string }) {
  const { stats } = summitPlaque();

  return (
    <dl className={`grid grid-cols-2 gap-x-6 gap-y-4 ${className}`}>
      {stats.map(({ label, value, note }) => (
        <div key={label}>
          <dt className="text-sm text-ink-muted">{label}</dt>
          <dd className="mt-1 font-mono text-base text-ink tabular-nums">
            <span className="whitespace-nowrap">{value}</span>
            {note ? <span className="block text-sm text-ink-muted">{note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The summit, the last block of the ascent (HOME-03, HOME-06; D-03, D-13,
 * D-15; 09-UI-SPEC "Summit Section"). Server component.
 *
 * "Skip to the summit" in the hero lands here by native fragment navigation;
 * tabIndex -1 lets the section take focus (no outline, per the 07
 * `[tabindex="-1"]` rule). The plaque is a flat survey plate: the same derived
 * kicker as the hero, the summit name and height, and four static stats from
 * summitPlaque(), with no count-up. The trail signs repeat below it so the
 * climb ends on the same two destinations it started with.
 *
 * Two layouts (G-09-2, Tim: "Compact plaque + measured 3D", 09-18; the
 * thresholds are SUMMIT_FULL_MEDIA in lib/ascent/summit-layout.ts):
 * - full (summit-full, landscape 1100 to below 1944 px): the plate holds the
 *   kicker, the h2, the height and the stats, in a 448 px column centred
 *   vertically on the left, beside the poster pins.
 * - compact (summit-compact, everywhere else, motion allowed): a 320 px column
 *   docked at the bottom holds a one-line plate (h2 and height) and the signs,
 *   so the pins above it stay in view; the kicker and the stats follow the
 *   ascent in SummitDetails.
 * Every summit text sits on a solid plate, so there is no block scrim.
 *
 * One stage tall in tall modes; natural height with the full plaque when
 * reduced motion is requested (stacked).
 */
export default function SummitPlaque() {
  const { kicker, title, height } = summitPlaque();

  return (
    <section
      id="summit"
      tabIndex={-1}
      aria-labelledby="summit-title"
      data-ascent-block="summit"
      className="relative isolate min-h-[calc(100svh-var(--nav-h))] motion-reduce:min-h-0"
    >
      <div className="mx-auto flex min-h-[calc(100svh-var(--nav-h))] w-full max-w-6xl flex-col justify-end px-4 pb-4 sm:px-6 lg:px-8 summit-full:justify-center motion-reduce:min-h-0 motion-reduce:pb-12">
        <div data-summit-plaque className="w-full max-w-md summit-compact:motion-safe:max-w-80">
          <div className="rounded-sm border border-line-strong bg-surface-raised p-6 summit-compact:motion-safe:px-4 summit-compact:motion-safe:py-2">
            <p className="font-mono text-sm text-ink-muted summit-compact:motion-safe:hidden">
              {kicker}
            </p>
            <div className="summit-compact:motion-safe:flex summit-compact:motion-safe:items-baseline summit-compact:motion-safe:justify-between summit-compact:motion-safe:gap-4">
              <h2
                id="summit-title"
                className="mt-4 summit-compact:motion-safe:mt-0 summit-compact:motion-safe:text-base"
              >
                {title}
              </h2>
              <p className="mt-2 font-mono text-heading font-semibold text-ink tabular-nums summit-compact:motion-safe:mt-0 summit-compact:motion-safe:text-base summit-compact:motion-safe:whitespace-nowrap">
                {height}
              </p>
            </div>
            <SummitStats className="mt-6 summit-compact:motion-safe:hidden" />
          </div>
          <div className="mt-6 summit-compact:motion-safe:mt-2">
            <TrailSigns />
          </div>
        </div>
      </div>
    </section>
  );
}
