import ContourField from '@/components/terrain/ContourField';
import { EDGE_DOT, EDGE_TRAIL, trailPath } from '@/lib/edge-art';

const TRAIL_D = trailPath(EDGE_TRAIL);

/**
 * The edge art (EDGE-01, D-09; 12-UI-SPEC "EdgeArt"): a square contour sheet
 * with a dashed marked trail and an accent "you are here" dot clearly off it.
 * One picture for every edge page; the h1 names it, so the art carries no text.
 *
 * Server component, zero JS, no motion, token colours only. The sheet is an
 * aspect-square box with a surface-raised ground, so its size is fixed before
 * the contour asset loads (no layout shift), and the trail and dot are inline
 * SVG, so they still show if the asset fails. Decorative: aria-hidden and
 * nothing focusable. The geometry is the committed constant in lib/edge-art.ts;
 * nothing here depends on the request, so the art can never echo a URL.
 */
export default function EdgeArt() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg border border-line bg-surface-raised"
    >
      <ContourField lod="hero" className="absolute inset-0" />
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 512 512"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={TRAIL_D}
          fill="none"
          className="stroke-ink-muted"
          strokeWidth={2}
          strokeDasharray="8 6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={EDGE_DOT.x}
          cy={EDGE_DOT.y}
          r={8}
          className="fill-accent stroke-surface-raised"
          strokeWidth={3}
        />
      </svg>
    </div>
  );
}
