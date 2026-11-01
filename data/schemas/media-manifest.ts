/**
 * Media manifest contract (D-27, 11-RESEARCH Q4).
 *
 * `scripts/media/build-clip.mjs` turns a gitignored screen recording
 * (assets/clips-original/) into one content-hashed, metadata-free H.264 MP4 and
 * a WebP poster in public/media/ and writes data/generated/media-manifest.ts.
 * The sidecar data/media/clips.json says which part of the recording to keep;
 * `ClipsSidecar` parses it in write mode and in every `--check`.
 *
 * - D-27: one silent MP4 per clip, metadata stripped, about 1.5 MB at most,
 *   generated locally and committed; CI only checks it.
 * - Q4 (decided in 11-09): the budget is 1,572,864 bytes (1.5 MiB). The
 *   served-asset guard (scripts/guards/check-served-images.mjs) holds the same
 *   number for every MP4 under public/.
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1): Node 24 type-strips this
 * file when a scripts/*.mjs generator imports it, and Node cannot resolve `@/`
 * or extension-less relative imports. Keep it to erasable TypeScript.
 */
import { z } from 'zod';

/** The largest MP4 any clip may be, in bytes (1.5 MiB, Q4). */
export const MAX_CLIP_BYTES = 1_572_864;

/** Shortest and longest clip, in seconds (D-27: a 5-10 s loop of the real thing). */
export const MIN_CLIP_SECONDS = 5;
export const MAX_CLIP_SECONDS = 10;

/** The clips the site can show; one per case-study demo slot. */
export const CLIP_IDS = ['coin-flip-toss'] as const;
export const ClipId = z.enum(CLIP_IDS);
export type ClipId = z.infer<typeof ClipId>;

/** One clip cut from a recording: where to start, how long, poster frame, encoder settings. */
export const ClipSource = z
  .strictObject({
    id: ClipId,
    /** sha256 of the original recording; write mode refuses any other file. */
    sourceSha256: z.string().regex(/^[0-9a-f]{64}$/),
    /** Seconds into the recording where the clip starts. */
    start: z.number().min(0),
    /** Clip length in seconds. */
    duration: z.number().min(MIN_CLIP_SECONDS).max(MAX_CLIP_SECONDS),
    /** Seconds into the encoded clip for the poster frame. */
    posterAt: z.number().min(0),
    /** libx264 constant rate factor (RESEARCH starts at 26). */
    crf: z.number().int().min(0).max(51),
    /** Output frame rate; the source rate is kept when absent. */
    fps: z.number().int().min(1).max(60).optional(),
  })
  .refine((c) => c.posterAt < c.duration, 'posterAt must fall inside the clip');
export type ClipSource = z.infer<typeof ClipSource>;

/** data/media/clips.json: every clip at most once. */
export const ClipsSidecar = z
  .strictObject({ clips: z.array(ClipSource) })
  .refine(
    (s) => new Set(s.clips.map((c) => c.id)).size === s.clips.length,
    'a clip id appears twice'
  );
export type ClipsSidecar = z.infer<typeof ClipsSidecar>;

const Px = z.number().int().positive();

/** One served clip: hashed MP4 and poster URLs with their measured facts. */
export const MediaClipEntry = z.strictObject({
  /** `/media/<id>.<first 10 hex of sha256(bytes)>.mp4` */
  src: z.string().regex(/^\/media\/[a-z0-9-]+\.[0-9a-f]{10}\.mp4$/, 'hashed /media/<id>.<hash>.mp4 URL'),
  type: z.literal('video/mp4'),
  width: Px,
  height: Px,
  /** From the MP4's mvhd box. */
  durationS: z.number().min(MIN_CLIP_SECONDS).max(MAX_CLIP_SECONDS),
  bytes: z.number().int().positive().max(MAX_CLIP_BYTES),
  poster: z.strictObject({
    /** `/media/<id>-poster.<first 10 hex of sha256(bytes)>.webp` */
    src: z
      .string()
      .regex(/^\/media\/[a-z0-9-]+-poster\.[0-9a-f]{10}\.webp$/, 'hashed /media/<id>-poster.<hash>.webp URL'),
    width: Px,
    height: Px,
  }),
});
export type MediaClipEntry = z.infer<typeof MediaClipEntry>;

/** The manifest: clip id -> entry; empty until a clip is committed. */
export const MediaManifest = z.partialRecord(ClipId, MediaClipEntry);
export type MediaManifest = z.infer<typeof MediaManifest>;
