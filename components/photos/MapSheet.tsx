import Link from 'next/link';
import { SummitMark } from '@/components/home/PinMark';
import ContourField from '@/components/terrain/ContourField';
import { terrain } from '@/data/generated/terrain';
import { sheet } from '@/data/sheet';
import { formatMetres } from '@/lib/photo-format';
import { mapMarkCss } from '@/lib/photos/label-layout';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The sheet box: the full 11 x 11 km extent as a square size container named
 * map-sheet. Full-bleed below 640 px (phones get the largest sheet); from
 * 640 px centred and sized so the whole sheet fits the first viewport under
 * the header band (11rem = band 128 px + 24 px above + 24 px below the view;
 * Tim, "Fit first viewport", 2026-10-26).
 */
const SHEET =
  'relative -mx-4 aspect-square overflow-hidden border border-line bg-surface [container-name:map-sheet] [container-type:inline-size] sm:mx-auto sm:w-[min(100%,max(30rem,calc(100svh_-_var(--nav-h)_-_11rem)))]';

/**
 * The plate is the link box: a fixed 48 px (wide) or 68 px (compact) box whose
 * outline is an inset ring, so it takes no layout space and the boxes match
 * the label-layout constants (Tim, "Inset ring, keep 48/68", 2026-10-26). The
 * tier follows the sheet side (`@min-[35rem]` = S >= 560 px), as in
 * lib/photos/label-layout.ts; left and top come from the generated CSS.
 */
const PLATE =
  'group absolute block h-17 w-36 rounded-sm bg-surface-raised px-2 py-1 text-left ring-1 ring-line-strong ring-inset @min-[35rem]:h-12 @min-[35rem]:w-60 hover:bg-surface-overlay hover:ring-ink-muted';

/** 12 px dot with a 2 px surface casing, a 24 px hit area and a focus ring through the link. */
const DOT =
  "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface before:absolute before:top-1/2 before:left-1/2 before:size-6 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus group-focus-visible:outline-solid";

/** The preview: wide tier and hover-capable devices only, on hover or keyboard focus; never information the plate lacks. */
const PREVIEW =
  'pointer-events-none absolute left-0 z-10 hidden w-40 overflow-hidden rounded-sm border border-line-strong bg-surface-raised [@media(hover:hover)]:@min-[35rem]:group-hover:block [@media(hover:hover)]:@min-[35rem]:group-focus-visible:block';

/**
 * The Map view (PHOTO-01, PHOTO-03; D-01 to D-04; 10-UI-SPEC "Map View",
 * "Color" Map relief, "Interaction States" Map label link and UI
 * Considerations E2). Server component, zero JS of its own, no motion.
 *
 * The full survey sheet (D-01: no crop, pan, zoom or tiles): the night-tinted
 * hillshade at --relief-opacity under the 100 m `hero` contours (UI-SPEC OQ3),
 * the summit as an aria-hidden landmark that is not a link (triangle plus the
 * 'Matterhorn' / '4,478 m' plate from terrain.summit.officialM), and one link
 * per photo in an ordered list, in buildPhotoViews() order (DEM height
 * ascending, ties by id; PHOTO-03). Each link's box is its always-shown label
 * plate (D-02); the dot and the leader are its children, so a click on any of
 * them opens the photo, and the intercepted route shows it in the lightbox
 * with a plain enter, since no image here carries a view-transition name
 * (D-03). The link has an explicit aria-label because a flex or multi-span
 * link's computed name is unreliable (09 STATE). The approximate film scan is
 * marked by shape, a hollow dashed dot, and by 'approx.' on the plate and in
 * the name (08 D-02; DATA-04).
 *
 * The plate positions come from lib/photos/label-layout.ts as one
 * server-rendered style element (container queries on map-sheet with
 * calc(<frac> * 100cqw + <px>px) lengths), so the server HTML is exact at every
 * sheet side and nothing relayouts on the client. The CSP allows inline styles
 * (`style-src 'unsafe-inline'`), and the CSS holds only numbers, the slugs and
 * fixed selectors (T-10-18). Until the relief decodes, or if it fails, the
 * sheet shows bg-surface with the contours and every plate and link works.
 */
export default function MapSheet({ photos }: { photos: readonly PhotoView[] }) {
  const { avif, webp } = terrain.assets.hillshade;
  const css = mapMarkCss(
    photos.map((p) => ({ slug: p.slug, u: p.uv.u, v: p.uv.v })),
    terrain.summit.uv
  );
  const summitAt = {
    left: `${terrain.summit.uv.u * 100}%`,
    top: `${terrain.summit.uv.v * 100}%`,
  };

  return (
    <section aria-label="Map of the photo locations">
      <div data-map-sheet className={SHEET}>
        <style>{css}</style>
        <picture>
          <source
            type="image/avif"
            srcSet={`${avif['640']} 640w, ${avif['1100']} 1100w`}
            sizes="(min-width: 640px) 1100px, 100vw"
          />
          <source
            type="image/webp"
            srcSet={`${webp['640']} 640w, ${webp['1100']} 1100w`}
            sizes="(min-width: 640px) 1100px, 100vw"
          />
          {/* A raw <img> on purpose: content-hashed, pre-sized terrain asset with picture
              type switching. @next/next/no-img-element exempts an img inside <picture>.
              The relief is the largest paint of the default /photos view. */}
          <img
            src={webp['1100']}
            alt=""
            width={1100}
            height={1100}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 block h-full w-full opacity-(--relief-opacity)"
          />
        </picture>
        <ContourField lod="hero" className="absolute inset-0" />
        <div aria-hidden="true">
          <SummitMark style={summitAt} />
          <div
            data-summit-plate
            className="absolute rounded-sm bg-surface-raised px-2 py-1 whitespace-nowrap"
          >
            <span className="block text-sm text-ink-muted">Matterhorn</span>
            <span className="block font-mono text-sm text-ink-muted tabular-nums">
              {formatMetres(terrain.summit.officialM)}
            </span>
          </div>
        </div>
        <ol aria-label="Photo locations, lowest first">
          {photos.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/photos/${p.slug}`}
                scroll={false}
                data-photo-id={p.slug}
                data-map-mark={p.slug}
                aria-label={`${p.title}, ${p.altitudeLabel}`}
                className={PLATE}
              >
                <svg
                  data-map-leader
                  aria-hidden="true"
                  className="pointer-events-none absolute min-h-px min-w-px overflow-visible text-ink-muted"
                >
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span
                  data-map-dot
                  aria-hidden="true"
                  className={`${DOT} ${
                    p.approximate ? 'border-2 border-dashed border-ink bg-surface' : 'bg-ink'
                  }`}
                />
                <span className="block text-sm font-semibold text-ink">{p.title}</span>
                <span className="block font-mono text-sm text-ink-muted tabular-nums">
                  {p.altitudeLabel}
                </span>
                <span
                  data-map-preview
                  aria-hidden="true"
                  className={PREVIEW}
                  style={{ aspectRatio: `${p.aspect.w} / ${p.aspect.h}` }}
                >
                  <picture className="block h-full w-full">
                    <source type="image/avif" srcSet={p.tile.srcSetAvif} sizes="160px" />
                    <source type="image/webp" srcSet={p.tile.srcSetWebp} sizes="160px" />
                    {/* Manifest derivative inside <picture> (served-image guard); exempt from no-img-element. */}
                    <img
                      src={p.tile.src}
                      alt=""
                      width={p.tile.width}
                      height={p.tile.height}
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full object-cover"
                    />
                  </picture>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-6 gap-y-1 font-mono text-sm text-ink-muted">
        <p>
          {sheet.title} · contours every {formatMetres(terrain.contours.hero.intervalM)}
        </p>
        <p>Terrain: swissALTIRegio, swisstopo</p>
      </div>
    </section>
  );
}
