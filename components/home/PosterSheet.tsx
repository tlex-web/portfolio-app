import ContourField from '@/components/terrain/ContourField';
import { terrain } from '@/data/generated/terrain';
import { POSTER_X_BIAS } from '@/lib/ascent/poster-frame';

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
 */
export default function PosterSheet() {
  const { avif, webp } = terrain.assets.hillshade;

  return (
    <div
      className="absolute"
      style={{
        width: SIDE,
        height: SIDE,
        left: `calc((100cqw - ${SIDE}) * ${POSTER_X_BIAS})`,
        top: `calc((100cqh - ${SIDE}) * 0.5)`,
      }}
    >
      <picture>
        <source type="image/avif" srcSet={`${avif['640']} 640w, ${avif['1100']} 1100w`} sizes="100vw" />
        <source type="image/webp" srcSet={`${webp['640']} 640w, ${webp['1100']} 1100w`} sizes="100vw" />
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
    </div>
  );
}
