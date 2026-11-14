import { plates } from '@/data/generated/plates';

export type PlateId = keyof typeof plates;

/** The contour LODs a plate ships: a 2D plate has no `map` LOD, so `lod="map"` on it does not compile. */
export type ContourLod<P extends PlateId = PlateId> = keyof (typeof plates)[P]['assets']['contours'];

/** plates.ts seen through a mapped type, so indexing by a generic plate keeps its own LOD keys (no cast). */
const sheets: { readonly [Q in PlateId]: { readonly assets: { readonly contours: Readonly<Record<ContourLod<Q>, string>> } } } =
  plates;

/**
 * Contour art as a CSS mask over the `contour` token (SHELL-04; ARCH §5;
 * 08-UI-SPEC "① Contour band"). Server component, zero JS, no motion (D-21).
 *
 * The plate selects the sheet: every caller passes `plate="matterhorn"` today,
 * and Phase 18 draws the region plates through the same component.
 *
 * The SVG is never an <img>: an external SVG image cannot take the token
 * colour, so the content-hashed asset from data/generated/plates.ts masks a
 * `bg-contour` box instead. Inline styles are allowed by the CSP
 * (`style-src 'unsafe-inline'`) and the same-origin mask by `img-src 'self'`.
 * `mask-size: cover` on a box at least as wide as the asset's aspect scales by
 * width, so the full extent width is always visible (the scale bar relies on it).
 */
export default function ContourField<P extends PlateId>({
  plate,
  lod,
  className,
}: {
  plate: P;
  lod: ContourLod<P>;
  className?: string;
}) {
  const mask = `url(${sheets[plate].assets.contours[lod]})`;

  return (
    <div
      aria-hidden="true"
      className={['bg-contour', className].filter(Boolean).join(' ')}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: 'cover',
        WebkitMaskSize: 'cover',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    />
  );
}
