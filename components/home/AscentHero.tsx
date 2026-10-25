import AltimeterRail from '@/components/home/AltimeterRail';
import AscentController, { AscentStageFrame } from '@/components/home/AscentController';
import HeroBlock from '@/components/home/HeroBlock';
import PosterSheet from '@/components/home/PosterSheet';
import SummitDetails from '@/components/home/SummitDetails';
import SummitPlaque from '@/components/home/SummitPlaque';
import TerrainStage from '@/components/home/TerrainStage';
import WaypointCard from '@/components/home/WaypointCard';
import { terrain } from '@/data/generated/terrain';
import type { PinAnchor } from '@/lib/ascent/route';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { formatMetres } from '@/lib/photo-format';

/**
 * The ascent grid (HOME-01, HOME-02; D-12; 09-UI-SPEC "Page Structure" and
 * "Stage: Poster, Sheet Box and Canvas"). Server component.
 *
 * One CSS grid cell holds three layers, in DOM and paint order: the stage
 * (sticky under the solid 64 px nav, one stage tall, decorative and
 * aria-hidden), the content track (`relative`, so it paints above the stage),
 * and the rail layer (sticky, one stage tall, aria-hidden, no pointer events),
 * which paints above the track. No new z-index tokens or negative margins. The
 * stage is a size container so the poster sheet box can size itself in
 * cqw/cqh.
 *
 * Hooks for later plans: `data-ascent-stage` (with `data-ascent-mode`, written
 * by the client AscentStageFrame from the capability gate, 09-07),
 * `data-ascent-track` and `data-ascent-rail-layer`. Inside the stage, in paint
 * order: the poster, the lazy canvas (TerrainStage, eligible devices only) and
 * the rail scrim (md and up), which stays in the stage because the camera
 * (CameraRig) reads its width there. The poster pin layer is z-10, so it
 * paints above the scrim (G-09-3 a, 09-19).
 *
 * The rail box lives in its own layer after the track (G-09-4 N1, Tim's option
 * B, 09-17): the hero scrim is part of the track and painted over the stage, so
 * inside the stage the rail read 1.3-2.5:1 from 768 to 1023 px. A sticky element
 * is its own stacking context, so a z-index on the rail inside the stage could
 * not lift it; a later sibling of the track can.
 *
 * After the hero, the track holds the waypoint list (HOME-05, D-08): one stage
 * block per photo in ascending DEM height, each `li#waypoint-{slug}` with
 * `data-ascent-block="waypoint"` and `data-k` (correction C8: the fragment id
 * is on the block, not the card). In tall modes every block is one stage high;
 * under reduced motion the blocks collapse to natural height and stack.
 *
 * The summit section (`section#summit`, `data-ascent-block="summit"`) is the
 * last track child, after the list (D-03, D-13): the target of the hero's
 * "Skip to the summit" cue. In the compact summit layout the plaque's kicker
 * and stats follow the grid in SummitDetails, outside the track, so arrivals
 * and the summit centring do not change (G-09-2, 09-18).
 *
 * AscentController (client) wraps the grid and turns page scroll into the one
 * damped progress value (HOME-03, D-06); the AltimeterRail in the rail layer
 * reads it (HOME-04, D-01, D-05). Only serialisable props cross the boundary:
 * the waypoint count, the n + 1 heights (waypoints, then the official summit
 * height) and the tick labels. The lazy canvas gets the pin anchors (number,
 * label, approximate flag, UV) the same way (09-10), so the 3D pins carry the
 * poster pins' labels without shipping the photo data to the client.
 */
export default function AscentHero() {
  const waypoints = buildWaypoints();
  const heights = [...waypoints.map((w) => w.altitudeM), terrain.summit.officialM];
  const ticks = [
    ...waypoints.map((w) => ({
      label: `${formatMetres(w.altitudeM)}${w.approximate ? ' approx.' : ''}`,
      approximate: w.approximate,
    })),
    { label: formatMetres(terrain.summit.officialM), approximate: false },
  ];
  const pins: PinAnchor[] = waypoints.map((w) => ({
    k: w.k,
    label: `${w.shortPlace} · ${formatMetres(w.altitudeM)}${w.approximate ? ' approx.' : ''}`,
    approximate: w.approximate,
    u: w.uv.u,
    v: w.uv.v,
  }));

  return (
    <AscentController n={waypoints.length} heights={heights}>
      <div className="grid">
        <AscentStageFrame>
          <PosterSheet />
          <TerrainStage pins={pins} />
          <div
            data-ascent-rail-scrim
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-56 bg-linear-to-l from-surface/85 from-0% via-surface/60 via-70% to-transparent md:block"
          />
        </AscentStageFrame>
        <div data-ascent-track className="relative col-start-1 row-start-1">
          <HeroBlock />
          <ol
            aria-label="Waypoints, lowest first"
            className="motion-reduce:flex motion-reduce:flex-col motion-reduce:gap-12 motion-reduce:py-12"
          >
            {waypoints.map((waypoint) => (
              <li
                key={waypoint.id}
                id={`waypoint-${waypoint.slug}`}
                data-ascent-block="waypoint"
                data-k={waypoint.k}
                className="mx-auto flex min-h-[calc(100svh-var(--nav-h))] w-full max-w-6xl flex-col justify-end px-4 sm:px-6 md:justify-center lg:px-8 motion-reduce:min-h-0"
              >
                <WaypointCard waypoint={waypoint} />
              </li>
            ))}
          </ol>
          <SummitPlaque />
        </div>
        <div
          data-ascent-rail-layer
          aria-hidden="true"
          className="pointer-events-none sticky top-(--nav-h) col-start-1 row-start-1 h-[calc(100svh-var(--nav-h))] self-start overflow-hidden"
        >
          <AltimeterRail ticks={ticks} />
        </div>
      </div>
      <SummitDetails />
    </AscentController>
  );
}
