import { ArrowDownIcon, ArrowLineDownIcon } from '@phosphor-icons/react/dist/ssr';
import TrailSigns from '@/components/home/TrailSigns';
import { terrain } from '@/data/generated/terrain';
import { home } from '@/data/home';
import { site } from '@/data/site';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { lv95ToWgs84 } from '@/lib/geo';
import { formatLatLon } from '@/lib/home-format';

/**
 * Hero scrim stops (09-UI-SPEC "Hero Block" with correction C6, accepted by Tim
 * 2026-10-25). Below 1024 px the copy fills most of the screen, so a vertical
 * scrim never drops under 0.5; from 1024 px a left-to-right scrim keeps 0.70 or
 * more at the max-w-xl column edge at 1024 and 1440 px. Alphas are opacity
 * modifiers on the surface token, not new colours.
 */
const SCRIM =
  'pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-surface/90 from-0% via-surface/75 via-60% to-surface/50 to-100% lg:bg-linear-to-r lg:from-surface/85 lg:from-0% lg:via-surface/70 lg:via-60% lg:to-transparent lg:to-90%';

/**
 * The cue links (D-13, D-15; 09-UI-SPEC "Hero Block" cue row and "Interaction
 * States"): muted, underlined text links at least 44 px tall that turn ink on
 * hover. Plain in-page anchors, so the jump is native: no smooth scrolling.
 */
const CUE =
  'inline-flex min-h-11 items-center gap-1 text-base text-ink-muted underline decoration-1 underline-offset-4 transition-colors duration-(--duration-fast) ease-erosion hover:text-ink';

/**
 * Home's first viewport copy (HOME-01, HOME-06; D-11, D-13; 09-UI-SPEC "Hero
 * Block"). Server component: complete HTML with no script, animation or WebGL,
 * and it scrolls away natively. Every string is derived: the kicker from the
 * summit's LV95 position, the h1 and role from data/site.ts, the thesis from
 * data/home.ts.
 *
 * The block is at least one stage tall (min-h, so short viewports grow instead
 * of clipping); the copy sits bottom-left on phones and centred-left from md,
 * in a max-w-xl column on the 07 container, over its own scrim (isolate keeps
 * the -z-10 scrim inside the block).
 *
 * Below the signs, the cue row: "Start the ascent" jumps to the first waypoint
 * block, "Skip to the summit" past the whole ascent to the summit section, which
 * takes focus (HOME-03 skip link). The global "Skip to main content" link in
 * the shell stays the only link with that name.
 */
export default function HeroBlock() {
  const kicker = formatLatLon(lv95ToWgs84(terrain.summit.lv95));
  const firstWaypoint = buildWaypoints()[0];

  return (
    <div data-ascent-block="hero" className="relative isolate min-h-[calc(100svh-var(--nav-h))]">
      <div aria-hidden="true" className={SCRIM} />
      <div className="mx-auto flex min-h-[calc(100svh-var(--nav-h))] w-full max-w-6xl flex-col justify-end px-4 py-12 sm:px-6 md:justify-center lg:px-8">
        <div className="max-w-xl">
          <p className="mb-4 font-mono text-sm text-ink-muted">{kicker}</p>
          <h1 className="font-display text-hero font-semibold text-ink">{site.name}</h1>
          <p className="mt-4 text-base text-ink-muted">{site.role}</p>
          <p className="mt-2 text-heading font-normal tracking-normal text-ink">{home.thesis}</p>
          <div className="mt-8">
            <TrailSigns />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <a href={`#waypoint-${firstWaypoint.slug}`} className={CUE}>
              Start the ascent
              <ArrowDownIcon size={20} aria-hidden="true" />
            </a>
            <a href="#summit" className={CUE}>
              Skip to the summit
              <ArrowLineDownIcon size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
