/**
 * Image manifest contract (DATA-08, D-11, D-13).
 *
 * `scripts/photos/build-derivatives.mjs` turns the gitignored originals
 * (assets/photos-original/, D-09) into content-hashed, rotated, metadata-free
 * derivatives in public/images/photos/ and writes data/generated/image-manifest.ts.
 * Every write and every `--check` parses the manifest with `ImageManifest`, so a
 * URL outside the hashed pattern or an image above 2560 px never reaches a commit.
 *
 * - D-13: the largest served derivative is 2560 px on the long edge.
 * - D-11: derivatives are generated locally and committed; CI only checks them.
 * - DATA-08: components receive every image path through this manifest, and the
 *   manifest knows only the hashed derivatives (the v1 -large / -thumb files in
 *   public/images/optimized/ were deleted in Phase 12, VERIFY-01).
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1): Node 24 type-strips this
 * file when a scripts/*.mjs generator imports it, and Node cannot resolve `@/`
 * or extension-less relative imports. Keep it to erasable TypeScript.
 */
import { z } from 'zod';

/** The largest long edge any served photo may have (D-13). */
export const MAX_LONG_EDGE = 2560;

/** The AVIF/WebP long edges, in manifest order. */
export const VARIANT_LONG_EDGES = [640, 1024, 1600, 2560] as const;

/** The single JPEG fallback's long edge (future OG images, older clients). */
export const JPEG_LONG_EDGE = 1200;

/** `/images/photos/<id>-<long edge>.<first 10 hex of sha256(bytes)>.<ext>` */
const photoUrl = (ext: 'avif' | 'webp' | 'jpg') =>
  z
    .string()
    .regex(
      new RegExp(`^/images/photos/[a-z0-9-]+-\\d{3,4}\\.[0-9a-f]{10}\\.${ext}$`),
      `hashed /images/photos/<id>-<edge>.<hash>.${ext} URL`
    );

const Px = z.number().int().positive().max(MAX_LONG_EDGE);
const LongEdge = z.number().int().positive().max(MAX_LONG_EDGE);

/** The URL names the long edge it was resized to: `<id>-<longEdge>.<hash>.<ext>`. */
const namesEdge = (url: string, longEdge: number) => url.includes(`-${longEdge}.`);

/** One AVIF + WebP pair at one long edge; width/height are the encoded pixels. */
export const ImageVariant = z
  .strictObject({
    longEdge: LongEdge,
    width: Px,
    height: Px,
    avif: photoUrl('avif'),
    webp: photoUrl('webp'),
  })
  .refine((v) => Math.max(v.width, v.height) <= v.longEdge, 'image exceeds its long edge')
  .refine(
    (v) => namesEdge(v.avif, v.longEdge) && namesEdge(v.webp, v.longEdge),
    'URL does not name the long edge'
  );
export type ImageVariant = z.infer<typeof ImageVariant>;

/** The JPEG fallback. */
export const ImageJpeg = z
  .strictObject({
    longEdge: z.literal(JPEG_LONG_EDGE),
    width: Px,
    height: Px,
    src: photoUrl('jpg'),
  })
  .refine((j) => Math.max(j.width, j.height) <= j.longEdge, 'image exceeds its long edge')
  .refine((j) => namesEdge(j.src, j.longEdge), 'URL does not name the long edge');
export type ImageJpeg = z.infer<typeof ImageJpeg>;

/** One photo: source hash, oriented original size, hashed variants and JPEG. */
export const ImageManifestEntry = z.strictObject({
  /** sha256 of the original's bytes, equal to the EXIF sidecar's `sha256`. */
  sourceSha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** Oriented size of the original (EXIF orientation applied). */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  variants: z
    .array(ImageVariant)
    .refine(
      (vs) =>
        vs.length === VARIANT_LONG_EDGES.length &&
        vs.every((v, i) => v.longEdge === VARIANT_LONG_EDGES[i]),
      `variants must be exactly ${VARIANT_LONG_EDGES.join(', ')} in order`
    ),
  jpeg: ImageJpeg,
});
export type ImageManifestEntry = z.infer<typeof ImageManifestEntry>;

/** The manifest: photo id (as in the sidecar) -> entry, at least one photo. */
export const ImageManifest = z
  .record(z.string().regex(/^(img-\d{4}|r\d{3}-\d{3})$/), ImageManifestEntry)
  .refine((m) => Object.keys(m).length > 0, 'the manifest holds no photos');
export type ImageManifest = z.infer<typeof ImageManifest>;
