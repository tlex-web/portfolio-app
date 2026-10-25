import TrailSigns from '@/components/home/TrailSigns';
import { summitPlaque } from '@/lib/ascent/summit';

/**
 * Below 768 px the plaque sits low over the final frame, so it gets the hero's
 * vertical scrim, which never drops under 0.5 (09-UI-SPEC "Summit Section",
 * correction C6 stops). From 768 px the solid plate needs no scrim. Alphas are
 * opacity modifiers on the surface token, not new colours.
 */
const SCRIM =
  'pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-surface/90 from-0% via-surface/75 via-60% to-surface/50 to-100% md:hidden';

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
 * One stage tall in tall modes (bottom-docked below 768 px, centred from md);
 * natural height under reduced motion.
 */
export default function SummitPlaque() {
  const { kicker, title, height, stats } = summitPlaque();

  return (
    <section
      id="summit"
      tabIndex={-1}
      aria-labelledby="summit-title"
      data-ascent-block="summit"
      className="relative isolate min-h-[calc(100svh-var(--nav-h))] motion-reduce:min-h-0"
    >
      <div aria-hidden="true" className={SCRIM} />
      <div className="mx-auto flex min-h-[calc(100svh-var(--nav-h))] w-full max-w-6xl flex-col justify-end px-4 pb-4 sm:px-6 md:justify-center lg:px-8 motion-reduce:min-h-0 motion-reduce:pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-sm border border-line-strong bg-surface-raised p-6">
            <p className="font-mono text-sm text-ink-muted">{kicker}</p>
            <h2 id="summit-title" className="mt-4">
              {title}
            </h2>
            <p className="mt-2 font-mono text-heading font-semibold text-ink tabular-nums">{height}</p>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
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
          </div>
          <div className="mt-6">
            <TrailSigns />
          </div>
        </div>
      </div>
    </section>
  );
}
