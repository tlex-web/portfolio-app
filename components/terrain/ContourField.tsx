import { terrain } from '@/data/generated/terrain';

export type ContourLod = keyof typeof terrain.assets.contours;

/**
 * Contour art as a CSS mask over the `contour` token (SHELL-04; ARCH §5;
 * 08-UI-SPEC "① Contour band"). Server component, zero JS, no motion (D-21).
 *
 * The SVG is never an <img>: an external SVG image cannot take the token
 * colour, so the content-hashed asset from data/generated/terrain.ts masks a
 * `bg-contour` box instead. Inline styles are allowed by the CSP
 * (`style-src 'unsafe-inline'`) and the same-origin mask by `img-src 'self'`.
 * `mask-size: cover` on a box at least as wide as the asset's aspect scales by
 * width, so the full extent width is always visible (the scale bar relies on it).
 */
export default function ContourField({ lod, className }: { lod: ContourLod; className?: string }) {
  const mask = `url(${terrain.assets.contours[lod]})`;

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
