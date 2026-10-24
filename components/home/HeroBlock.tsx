import TrailSigns from '@/components/home/TrailSigns';
import { terrain } from '@/data/generated/terrain';
import { home } from '@/data/home';
import { site } from '@/data/site';
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
 */
export default function HeroBlock() {
  const kicker = formatLatLon(lv95ToWgs84(terrain.summit.lv95));

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
        </div>
      </div>
    </div>
  );
}
