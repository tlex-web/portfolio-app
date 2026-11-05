import PinMark, { SummitMark } from '@/components/home/PinMark';
import ContourField from '@/components/terrain/ContourField';
import { terrain } from '@/data/generated/terrain';
import { POSTER_X_BIAS } from '@/lib/ascent/poster-frame';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { formatMetres } from '@/lib/photo-format';

const SIDE = 'max(100cqw, 100cqh)';

/**
 * The night-tinted relief poster every visitor gets (HOME-01, HOME-02; D-16,
 * D-17; 09-UI-SPEC "Stage: Poster, Sheet Box and Canvas" and "Night-tinted
 * relief"). Server component, zero JS, no motion.
 *
 * A square sheet box of side max(100cqw, 100cqh) sits in the stage's size
 * container. It is placed with the same rule as posterFrame() in
 * lib/ascent/poster-frame.ts (POSTER_X_BIAS horizontally, centred vertically),
 * so the 3D camera at scroll 0 frames exactly what this poster shows.
 *
 * The relief image is the LCP element. It is a raw <picture> because the
 * content-hashed, pre-sized hillshade assets need AVIF/WebP type switching and
 * no optimiser pass. No <link rel=preload>: the image is in the initial HTML,
 * and eager loading at high fetch priority is what the Next 16 docs recommend
 * over preload (RESEARCH Pattern 1, Pitfall 9). `alt=""` because the
 * whole stage is decorative; a failed load leaves the bg-surface ground and the
 * contour field, with no broken-image glyph.
 *
 * The poster pins (HOME-05, D-09) sit in the sheet box at left u x 100%, top
 * v x 100%: one PinMark per waypoint in ascent order, labelled with its short
 * place and height, and the summit mark. AscentController lights the active
 * one and places its label (G-09-3 a, 09-19). The layer is z-10 so it paints
 * above the rail scrim inside the stage: a label in the scrim zone is not
 * dimmed (the rail box layer still paints above the whole stage). It hides
 * once the 3D pins take over (data-ascent-mode="3d").
 */
export default function PosterSheet() {
  const { avif, webp } = terrain.assets.hillshade;
  const waypoints = buildWaypoints();
  const at = (uv: { u: number; v: number }) => ({ left: `${uv.u * 100}%`, top: `${uv.v * 100}%` });

  return (
    <div
      data-sheet-box
      className="absolute"
      style={{
        width: SIDE,
        height: SIDE,
        left: `calc((100cqw - ${SIDE}) * ${POSTER_X_BIAS})`,
        top: `calc((100cqh - ${SIDE}) * 0.5)`,
      }}
    >
      <picture>
        <source
          type="image/avif"
          srcSet={`${avif['640']} 640w, ${avif['1100']} 1100w`}
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet={`${webp['640']} 640w, ${webp['1100']} 1100w`}
          sizes="100vw"
        />
        {/* A raw <img> on purpose: content-hashed, pre-sized terrain asset with picture
            type switching. @next/next/no-img-element exempts an img inside <picture>. */}
        <img
          src={webp['1100']}
          alt=""
          width={1100}
          height={1100}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
          data-poster-img
          className="block h-full w-full opacity-(--relief-opacity)"
        />
      </picture>
      <ContourField lod="hero" className="absolute inset-0" />
      <div
        data-pin-layer="poster"
        className="pointer-events-none absolute inset-0 z-10 group-data-[ascent-mode=3d]/stage:invisible"
      >
        {waypoints.map((w) => (
          <PinMark
            key={w.id}
            k={w.k}
            label={`${w.shortPlace} · ${formatMetres(w.altitudeM)}${w.approximate ? ' approx.' : ''}`}
            approximate={w.approximate}
            u={w.uv.u}
            v={w.uv.v}
            style={at(w.uv)}
          />
        ))}
        <SummitMark style={at(terrain.summit.uv)} />
      </div>
    </div>
  );
}
