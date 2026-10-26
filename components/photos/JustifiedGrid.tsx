import type { CSSProperties } from 'react';
import Link from 'next/link';
import { justifyTile } from '@/lib/photos/justify';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The list: one column below 640 px, CSS-only justified rows from 640 px
 * (10-RESEARCH Pattern 5). `--row-h` is ROW_H_MD_PX from 640 px and ROW_H_PX
 * from 1024 px (lib/photos/justify.ts; Tailwind needs the literal values, and
 * components/__tests__/GalleryGrid.test.tsx fails if they drift). The `::after`
 * is the trailing filler (`flex: FILLER_GROW 1 0px`): it is not a list item,
 * and it takes the free space of the last line so a single last tile keeps its
 * basis instead of stretching across the row.
 */
const LIST =
  "flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:[--row-h:224px] lg:[--row-h:280px] sm:after:flex-[999999_1_0px] sm:after:content-['']";

/** The slide mount (UI-SPEC Grid "Tile"): raised surface, 1 px line border; overlay and line-strong on hover. */
const MOUNT =
  'block h-full rounded-sm border border-line bg-surface-raised p-2 transition-colors duration-(--duration-fast) ease-erosion hover:border-line-strong hover:bg-surface-overlay';

/**
 * The Grid view (PHOTO-02, PHOTO-03; D-15; 10-RESEARCH Pattern 5;
 * 10-UI-SPEC "Grid View" and UI Considerations E3). Server component, no
 * hooks: the layout comes from data, so the server-rendered HTML is final and
 * CLS is 0.
 *
 * The photos arrive in the one canonical order (buildPhotoViews, ascending
 * DEM height) and are never re-sorted. Each tile is a slide mount: a link to
 * /photos/{slug} (`scroll={false}`, `data-photo-id` for focus restore) whose
 * image box reserves the manifest ratio over surface-overlay, then an
 * always-visible caption: the title, and a mono data line of three nowrap
 * parts '{short place} · {altitude}[ approx.] · {Mon YYYY | YYYY}', so it
 * wraps only between parts and nothing truncates. There is no hover overlay,
 * no hotspot count, no scale and no shadow (D-15). A failed image keeps its
 * box with the browser's alt text; the caption and the link still work.
 *
 * Each li sets `--tile-flex` from justifyTile and applies it only from 640 px,
 * so phones get one full-width column. The link's accessible name is an
 * explicit aria-label with the title, as on WaypointCard: name computation
 * over the image alt and the caption would read every photo twice.
 */
export default function JustifiedGrid({ photos }: { photos: readonly PhotoView[] }) {
  return (
    <ul aria-label="Photographs, lowest first" className={LIST}>
      {photos.map((photo, i) => {
        const { slug, title, alt, shortPlace, altitudeLabel, captureMonth, aspect, tile } = photo;
        const justified = justifyTile(aspect.w, aspect.h);
        return (
          <li
            key={slug}
            className="min-w-0 sm:flex-(--tile-flex)"
            style={{ '--tile-flex': justified.flex } as CSSProperties}
          >
            <Link
              href={`/photos/${slug}`}
              scroll={false}
              data-photo-id={slug}
              aria-label={title}
              className={MOUNT}
            >
              <div
                data-tile-box=""
                className="overflow-hidden bg-surface-overlay"
                style={{ aspectRatio: justified.aspectRatio }}
              >
                <picture className="block h-full w-full">
                  <source
                    type="image/avif"
                    srcSet={tile.srcSetAvif}
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                  <source
                    type="image/webp"
                    srcSet={tile.srcSetWebp}
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                  {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
                  <img
                    src={tile.src}
                    width={tile.width}
                    height={tile.height}
                    alt={alt}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="block h-full w-full object-cover"
                  />
                </picture>
              </div>
              <div className="px-1 pt-2 pb-1">
                <p className="text-base font-semibold text-ink">{title}</p>
                <p className="font-mono text-sm text-ink-muted tabular-nums">
                  <span data-caption-part="place" className="whitespace-nowrap">
                    {shortPlace}
                  </span>
                  {' · '}
                  <span data-caption-part="altitude" className="whitespace-nowrap">
                    {altitudeLabel}
                  </span>
                  {' · '}
                  <span data-caption-part="date" className="whitespace-nowrap">
                    {captureMonth}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
