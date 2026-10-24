import HeroBlock from '@/components/home/HeroBlock';
import PosterSheet from '@/components/home/PosterSheet';

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
 */
export default function AscentHero() {
  return (
    <div className="grid">
      <div
        data-ascent-stage
        data-ascent-mode="pending"
        aria-hidden="true"
        className="group/stage sticky top-(--nav-h) col-start-1 row-start-1 h-[calc(100svh-var(--nav-h))] self-start overflow-hidden bg-surface [container-type:size]"
      >
        <PosterSheet />
      </div>
      <div data-ascent-track className="relative col-start-1 row-start-1">
        <HeroBlock />
      </div>
    </div>
  );
}
