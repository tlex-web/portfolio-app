import AltimeterRail from '@/components/home/AltimeterRail';
import AscentController from '@/components/home/AscentController';
import HeroBlock from '@/components/home/HeroBlock';
import PosterSheet from '@/components/home/PosterSheet';
import SummitPlaque from '@/components/home/SummitPlaque';
import WaypointCard from '@/components/home/WaypointCard';
import { terrain } from '@/data/generated/terrain';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { formatMetres } from '@/lib/photo-format';

/**
 * The ascent grid (HOME-01, HOME-02; D-12; 09-UI-SPEC "Page Structure" and
 * "Stage: Poster, Sheet Box and Canvas"). Server component.
 *
 * One CSS grid cell holds two layers: the stage (sticky under the solid 64 px
 * nav, one stage tall, decorative and aria-hidden) and the content track, later
 * in DOM order and `relative`, so it paints above the stage without new z-index
 * tokens or negative margins. The stage is a size container so the poster sheet
 * box can size itself in cqw/cqh.
 *
 * Hooks for later plans: `data-ascent-stage` (with `data-ascent-mode`, set by
 * the client capability gate in 09-07) and `data-ascent-track`.
 *
 * After the hero, the track holds the waypoint list (HOME-05, D-08): one stage
 * block per photo in ascending DEM height, each `li#waypoint-{slug}` with
 * `data-ascent-block="waypoint"` and `data-k` (correction C8: the fragment id
 * is on the block, not the card). In tall modes every block is one stage high;
 * under reduced motion the blocks collapse to natural height and stack.
 *
 * The summit section (`section#summit`, `data-ascent-block="summit"`) is the
 * last track child, after the list (D-03, D-13): the target of the hero's
 * "Skip to the summit" cue.
 *
 * AscentController (client) wraps the grid and turns page scroll into the one
 * damped progress value (HOME-03, D-06); the AltimeterRail inside the stage
 * reads it (HOME-04, D-01, D-05). Only serialisable props cross the boundary:
 * the waypoint count, the n + 1 heights (waypoints, then the official summit
 * height) and the tick labels.
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

  return (
    <AscentController n={waypoints.length} heights={heights}>
      <div className="grid">
        <div
          data-ascent-stage
          data-ascent-mode="pending"
          aria-hidden="true"
          className="group/stage sticky top-(--nav-h) col-start-1 row-start-1 h-[calc(100svh-var(--nav-h))] self-start overflow-hidden bg-surface [container-type:size]"
        >
          <PosterSheet />
          <AltimeterRail ticks={ticks} />
        </div>
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
      </div>
    </AscentController>
  );
}
