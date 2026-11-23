/** The part of a plate's sheet ContourField reads: its content-hashed contour URLs per LOD. */
export type ContourSheet = { readonly assets: { readonly contours: Readonly<Record<string, string>> } };

/** The contour LODs a sheet ships: a 2D sheet has no `map` LOD, so `lod="map"` on it does not compile. */
export type ContourLod<S extends ContourSheet> = keyof S['assets']['contours'] & string;

/**
 * Contour art as a CSS mask over the `contour` token (SHELL-04; ARCH §5;
 * 08-UI-SPEC "① Contour band"). Server component, zero JS, no motion (D-21).
 *
 * Data-free: the caller passes the plate's sheet, so this file imports no
 * generated data and adds nothing to a client chunk that renders it (the footer
 * inside global-error). Every caller passes homePlate from
 * data/generated/home-plate.ts today; Phase 18's region pages pass their own
 * plate's sheet from plates.ts on the server.
 *
 * The SVG is never an <img>: an external SVG image cannot take the token
 * colour, so the sheet's content-hashed asset masks a `bg-contour` box instead.
 * Inline styles are allowed by the CSP (`style-src 'unsafe-inline'`) and the
 * same-origin mask by `img-src 'self'`. `mask-size: cover` on a box at least as
 * wide as the asset's aspect scales by width, so the full extent width is always
 * visible (the scale bar relies on it).
 */
export default function ContourField<S extends ContourSheet>({
  sheet,
  lod,
  className,
}: {
  sheet: S;
  lod: ContourLod<S>;
  className?: string;
}) {
  const mask = `url(${sheet.assets.contours[lod]})`;

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
