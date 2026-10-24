---
phase: 08-data-terrain-pipeline
reviewed: 2026-10-24T18:00:00Z
depth: standard
files_reviewed: 77
files_reviewed_list:
  - .gitattributes
  - .gitignore
  - app/(site)/page.tsx
  - app/(site)/projects/[slug]/page.tsx
  - app/(site)/projects/page.tsx
  - app/globals.css
  - components/ContourBackground.tsx
  - components/GeologicalButton.tsx
  - components/Hero3DMountain.tsx
  - components/ImageDetailModal.tsx
  - components/PhotoCarousel3D.tsx
  - components/ProjectCard.tsx
  - components/ProjectDetailClient.tsx
  - components/__tests__/ImageDetailModal.test.tsx
  - components/site/SiteFooter.tsx
  - components/site/__tests__/SiteFooter.test.tsx
  - components/terrain/ContourField.tsx
  - data/__tests__/editorial.test.ts
  - data/__tests__/exif-sidecar.test.ts
  - data/__tests__/fixtures/legacy-highlights.json
  - data/__tests__/image-manifest.test.ts
  - data/__tests__/photos.test.ts
  - data/__tests__/precache.test.ts
  - data/__tests__/projects.test.ts
  - data/__tests__/terrain.test.ts
  - data/generated/image-manifest.ts
  - data/generated/photos.ts
  - data/generated/precache.json
  - data/generated/terrain.ts
  - data/landscapes.ts
  - data/photos/corrections.json
  - data/photos/editorial.ts
  - data/photos/exif-sidecar.json
  - data/projects.ts
  - data/schemas/editorial.ts
  - data/schemas/image-manifest.ts
  - data/schemas/photo.ts
  - data/schemas/project.ts
  - data/schemas/terrain.ts
  - data/site.ts
  - data/terrain/source/source.json
  - data/types.ts
  - e2e/data-privacy.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/routes.spec.ts
  - eslint.config.mjs
  - lib/__tests__/contour-paths.test.ts
  - lib/__tests__/dem-sample.test.ts
  - lib/__tests__/footer-format.test.ts
  - lib/__tests__/geo.test.ts
  - lib/__tests__/hillshade.test.ts
  - lib/__tests__/photo-format.test.ts
  - lib/__tests__/trail-grade.test.ts
  - lib/footer-format.ts
  - lib/geo.ts
  - lib/legacy-highlights.ts
  - lib/photo-format.ts
  - lib/terrain/contour-paths.ts
  - lib/terrain/dem-sample.ts
  - lib/terrain/hillshade.ts
  - lib/trail-grade.ts
  - next.config.ts
  - package.json
  - proxy.ts
  - public/service-worker.js
  - scripts/README.md
  - scripts/guards/check-contrast.mjs
  - scripts/guards/check-palette.mjs
  - scripts/guards/check-served-images.mjs
  - scripts/guards/selftest.mjs
  - scripts/guards/test-count.baseline.json
  - scripts/inject-build-hash.mjs
  - scripts/photos/build-derivatives.mjs
  - scripts/photos/build-photo-data.mjs
  - scripts/photos/extract-exif.mjs
  - scripts/terrain/build-terrain.mjs
  - scripts/terrain/fetch-dem.mjs
findings:
  critical: 1
  warning: 8
  info: 9
  total: 18
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-10-24T18:00:00Z
**Depth:** standard
**Files Reviewed:** 77
**Status:** issues_found

## Summary

I reviewed the Phase 8 generators (EXIF sidecar, derivatives, photo facts, terrain fetch and build), the zod contracts, the pure libs (geo, DEM sampler, hillshade, contour serialiser, footer and photo formatters, trail grades), the served-image guard, the service worker, proxy and config changes, the footer and contour components, and the tests. For the files that the 08-05 codemod only touched, I checked the class renames only.

I ran these read-only checks. All four `npm run data:check` stages print OK, and `check-served-images.mjs` prints `served-images: OK`. The derivative and terrain pipelines are carefully built: content hashing, byte-exact `--check` modes, metadata stripping, and a strict path grammar for the SVGs.

The main problem is in the repository, not the new code. The full-resolution originals, with their complete GPS block, are still in the public git history (CR-01). That defeats the D-09 and DATA-06 privacy contract this phase was built to enforce. I confirmed it from the blobs; the phase did not introduce it.

The warnings are latent data-correctness gaps in the photo pipeline:
- a photo outside the DEM extent gets a silently clamped height and an off-band tick;
- a GPS fix without altitude is dropped;
- `OffsetTimeOriginal` is collected but ignored;
- exposure times between 0.25 s and 1 s are mis-formatted;
- the derivatives write is not atomic, although its header says it is.

The remaining warnings are privacy-guard coverage gaps and a stale `scripts/README.md`, which leaves out the `photos:build` step.

## Critical Issues

### CR-01: The full-resolution originals with complete GPS EXIF are in the public repository's git history

**File:** `.gitignore:57-58`, `e2e/data-privacy.spec.ts:5-11`, `scripts/guards/check-served-images.mjs:7-10`. The history is commits `287c2e9` (Initial commit, which added the files) and `347d8e1` (which deleted them).
**Issue:** Commit `287c2e9` added `public/images/landscapes/IMG_0605…jpg`, `IMG_0629…jpg`, `IMG_0662…jpg` and `R004-011…jpg` (14 to 81 MB each). Commit `347d8e1` deleted them. Both commits are reachable from `origin/main`, and `gh repo view` reports the repository as PUBLIC.

I checked the history blobs:
- The `IMG_0662` blob's sha256 (`83631b6a9460…`) equals the sidecar `sha256` for `img-0662`. It is the exact original.
- All three digital originals carry a 13-tag GPS IFD, including the time stamp, satellites and DOP.
- Their coordinates differ from the committed 4-decimal values by 2 to 5 m. In other words, they are the full-precision positions.

So the Phase 8 privacy contract is not met in the shipped repository:
- D-09 says originals are "never committed, not even with LFS (public repo)".
- DATA-06 says "a full-precision position is never written anywhere".
- The guard says it fails "including an original added anywhere with `git add -f`".

None of the Phase 8 controls look at history. The sidecar rounding, the derivative stripping, `check-served-images` and `data-privacy.spec.ts` only check the working tree and the deployed site. D-12 accepts copies already cached in a CDN or a browser. Git history is not a cache: anyone can fetch it from GitHub at any time.

The practical sensitivity is low: these are tourist viewpoints near Zermatt, and the extra precision is a few metres. That is why this needs Tim's decision, not a code change.
**Fix:** Pick one of these:
- (a) Rewrite the history to purge the path, then force-push every branch and tag. GitHub keeps cached views, so ask GitHub Support to garbage-collect the dangling objects as well.
  ```bash
  git filter-repo --invert-paths --path public/images/landscapes/
  ```
- (b) Record an explicit accepted-risk decision (a D-12 addendum covering git history) and correct the wording in `.gitignore`, the guard header and `data-privacy.spec.ts`, so they no longer claim the originals were never committed.

Either way, add a CI step that fails if a blob reachable from HEAD carries EXIF GPS, for example `git rev-list --objects --all` filtered to image paths and scanned with `sharp().metadata()`.

## Warnings

### WR-01: A photo outside the DEM extent gets a clamped edge height and an out-of-band UV, with no error

**File:** `scripts/photos/build-photo-data.mjs:200-206`, `lib/terrain/dem-sample.ts:31-32`, `data/schemas/photo.ts:203`
**Issue:** `sampleBilinear` clamps `fx` and `fy` to the grid. For a position outside the 11 x 11 km window, `sampleAtLv95` therefore returns the height of the nearest edge pixel. The build writes that as `elevation: { source: 'dem', m }`, a fabricated fact labelled as coming from the DEM.

`PhotoFacts.uv` has no range limit. A probe at 46.5 N, 7.9 E gives `{ u: 1.765, v: -4.633 }`. `SiteFooter` would then place that tick at `left: 176.51%`, off-screen. The summit `uv` is bounded to [0, 1] in `TerrainMeta`, but the photo `uv` is not. All four current photos are inside the extent, so nothing is wrong today. The first photo from another valley breaks it silently.
**Fix:** Fail the build when the raw UV is outside [0, 1], and add the same bound to the schema:
```js
const raw = lv95ToUv(lv95, dem.extent);
if (raw.u < 0 || raw.u > 1 || raw.v < 0 || raw.v > 1)
  throw new Error(`${entry.id}: position lies outside the DEM extent (uv ${raw.u.toFixed(3)}, ${raw.v.toFixed(3)})`);
```
```ts
uv: z.strictObject({ u: z.number().min(0).max(1), v: z.number().min(0).max(1) }).nullable(),
```

### WR-02: `gpsOf` drops a valid latitude and longitude when `GPSAltitude` is missing

**File:** `scripts/photos/extract-exif.mjs:121-123`
**Issue:** `if (lat === null || lon === null || alt === null) return null;` throws away the whole position whenever the altitude tag is absent. Lightroom's Map module, many GPS-log geotaggers and some phones write latitude and longitude without altitude.

Downstream, nothing uses `altM`: the shipped height comes from the DEM (D-17). Such a photo would silently get `position: null`. It would have no footer tick and no DEM height, and nothing would explain why.
**Fix:** Make the altitude optional instead of a reason to drop the fix:
```js
if (lat === null || lon === null) return null;
return { lat: round4(lat), lon: round4(lon),
         altM: alt === null ? null : round1(g.GPSAltitudeRef === 1 ? -alt : alt),
         utc: gpsUtc(g.GPSDateStamp, g.GPSTimeStamp) };
```
In `data/schemas/photo.ts:48`, change the `Gps` schema to `altM: Alt1.nullable()`.

### WR-03: `offsetTimeOriginal` is extracted but ignored, so every capture is assumed to be in Europe/Zurich

**File:** `scripts/photos/build-photo-data.mjs:129-147`, `scripts/photos/extract-exif.mjs:183`
**Issue:** Stage 1 commits `offsetTimeOriginal`. Stage 2 never reads it: `buildCapture` always derives a Zurich offset from the wall time. The only cross-check is the GPS UTC drift test, which runs only when GPS is present.

A photo without GPS taken in another time zone would be published with a wrong `offset`, for example `+01:00` for a shot taken at `-05:00`. The capture label would still look plausible. If the camera did record an offset, the build should use it or at least agree with it.
**Fix:** In `buildCapture`, after `zurichOffset`:
```js
if (entry.offsetTimeOriginal && entry.offsetTimeOriginal !== offset)
  throw new Error(`${entry.id}: EXIF OffsetTimeOriginal ${entry.offsetTimeOriginal} is not the Europe/Zurich offset ${offset}`);
```
Leave the GPS check as the second line of defence.

### WR-04: `formatExposureTime` prints wrong shutter speeds between 0.25 s and 1 s, and for 0

**File:** `lib/photo-format.ts:85-88`
**Issue:** `` `1/${Math.round(1 / s)} s` `` gives these results (I probed them):

| Exposure | Printed | Should be |
|---|---|---|
| 0.8 s | `1/1 s` | 0.8 s |
| 0.6 s | `1/2 s` | 0.6 s |
| 0.4 s | `1/3 s` | 0.4 s |
| 0.3 s | `1/3 s` | 0.3 s |
| 0 | `1/Infinity s` | (invalid) |

Cameras show these speeds as 0.3", 0.4", 0.6" and 0.8". The current photos (1/160 to 1/500) are unaffected. A dusk or waterfall long exposure, which is likely in this portfolio, would show a wrong fact in the modal.
**Fix:**
```ts
export function formatExposureTime(s: number): string {
  if (!(s > 0)) throw new RangeError(`formatExposureTime: ${s}`);
  if (s >= 0.3) return `${oneDecimal(s)}${NBSP}s`; // 0.3 s, 0.8 s, 2 s, 1.5 s
  return `1/${Math.round(1 / s)}${NBSP}s`;
}
```
Add test cases for 0.3, 0.4, 0.8 and 1/4.

### WR-05: The `photos:derive` write mode is not atomic, although its header says it is

**File:** `scripts/photos/build-derivatives.mjs:37` (the claim) and `:252-266`
**Issue:** The header says "Any failure exits 1 before anything is written." The code works in this order:
1. It writes every new derivative.
2. It `unlinkSync`s every file in `public/images/photos/` that is not among the new outputs.
3. Only then does it run `manifestFromDisk` and `ImageManifest.parse`.

If step 3 reports a problem, or the schema throws, the committed derivatives are already deleted and replaced while the manifest still points at them. Problems step 3 can report: AVIF and WebP dimensions disagree, or there is a duplicate. The tree is then left with an orphan or missing-file mismatch. Git can restore it, but the header promises something the code does not do, and the script deletes files.
**Fix:** Build and validate the manifest from the in-memory outputs before touching the disk: compute `{ url, width, height }` from the encoded buffers with `sharp(out).metadata()`. Then write the files and the manifest, and unlink stale files last. Alternatively, write into a temporary directory and swap it in.

### WR-06: Privacy guard coverage gaps: raw and HEIF formats, post-push only, narrowed ignore

**File:** `scripts/guards/check-served-images.mjs:59-60`, `.gitignore:57-58`
**Issue:**
- (1) `IMAGE_EXT` has no `.heif`, `.jfif`, `.jxl`, `.dng`, `.cr2`, `.cr3`, `.nef`, `.arw` or `.bmp`. A camera raw or HEIF original carries the full GPS IFD and full resolution. If one is committed, the guard skips it entirely, so the "added anywhere with `git add -f`" promise in the header does not hold for those formats.
- (2) The guard runs only in `npm run lint`, in CI, after a push. For a public repository, a pushed commit is already published, as CR-01 shows.
- (3) This phase removed the `public/images/landscapes/` ignore line. That is exactly the path the originals were once committed from. A second clone that still has originals there would now offer them to `git add -A`.
**Fix:** Add the extensions:
```js
const IMAGE_EXT = new Set(['.jpg','.jpeg','.jfif','.png','.webp','.avif','.gif','.tif','.tiff','.heic','.heif','.jxl','.dng','.cr2','.cr3','.nef','.arw','.bmp','.svg']);
```
sharp cannot read most raw formats, which already fails as `metadata: unreadable`. That is the right outcome. Also restore `public/images/landscapes/` in `.gitignore` next to `assets/photos-original/`, and consider a pre-commit hook that runs `guard:images` against the staged files.

### WR-07: `scripts/README.md` misses the `photos:build` stage, so the documented photo workflow fails CI

**File:** `scripts/README.md:12`, `:15-20`, `:24-32`, `:42`, `:55`, `:68`
**Issue:**
- The `data:check` line and the generator table leave out `photos:build` (`data/generated/photos.ts`). The table also leaves out `precache.json`, which `terrain:build` writes.
- The "After adding or editing a photo" steps go `photos:exif` → `photos:derive` → commit, with no `npm run photos:build`. Following them leaves `photos.ts` stale, and `photos:build --check` fails `npm run lint`.
- Other lines are stale too:
  - Line 42 lists an old `lint` chain, without `guard:identity`, `data:check` or `guard:images`.
  - Line 55 still limits `v1names` to the shell files.
  - Line 68 still says 28 contrast pairs; there are now 32.
  - The new `check-served-images.mjs` guard is not documented at all.
**Fix:** Add `npm run photos:build` after `photos:derive`, and add `data/generated/photos.ts` to the "commit" list. Add the `photos:build` row and `precache.json` to the table. Bring the lint chain, the v1names scope and the pair count up to date, and add a `check-served-images.mjs` section.

### WR-08: Corrections can label a hand-typed position as an exact EXIF position

**File:** `data/schemas/photo.ts:123-139`, `:186`. `scripts/photos/build-photo-data.mjs:150-160`
**Issue:** `Corrections` reuses `Position`, which allows `source: 'exif', approximate: false` with no reason or radius. A hand-entered coordinate in `corrections.json` can therefore be published as an exact EXIF fix. The footer would draw a solid tick for it, and nothing marks it as approximate.

This bypasses the provenance rule DATA-04 is meant to enforce: a position without GPS must say it is hand-placed. `buildPosition` copies `p.source` straight through.
**Fix:** Restrict the correction schema to hand placements:
```ts
position: Position.and(z.object({ source: z.literal('hand-placed') })).optional(),
```
Alternatively, have `build-photo-data` reject `fix.position.source === 'exif'`.

## Info

### IN-01: Hashed static assets are now served with no CSP at all

**File:** `proxy.ts:46-49`, `next.config.ts:133-144`
**Issue:** The matcher now skips `images/` and `terrain/`, so the SVGs under `/terrain/` have no `Content-Security-Policy`. `e2e/data-privacy.spec.ts:58` asserts that absence. The `contourSvg` path grammar and the guard's `svg-content` rule keep script out of today's files. A static CSP header would add defence in depth at no per-request cost, and it does not need the proxy.
**Fix:** In `next.config.ts`, add a `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox` header to `/terrain/:path*` and `/images/:path*`. Then change the e2e assertion from "undefined" to "no nonce".

### IN-02: The legacy bridge drops `position.approximate`

**File:** `data/landscapes.ts:29-46`
**Issue:** The `r004-011` lake annotation renders `2,760 m` with nothing to mark it as approximate. Its pin is hand-placed with a 100 m radius. Today only the editorial description text says so. DATA-04 says every consumer can show the approximation, but the bridge discards the flag.
**Fix:** Prefix with `~`, or append "(approx.)", when `photo.position?.approximate` is true and `ref.kind === 'photo'`. This can wait until Phase 10 retires the bridge.

### IN-03: An ambiguous fall-back hour fails even when GPS UTC could resolve it

**File:** `scripts/photos/build-photo-data.mjs:116-127`
**Issue:** At 02:00-02:59 on the last Sunday of October, both offsets are valid, and the build throws. In that case `entry.gps.utc` would pick the right candidate.
**Fix:** When `candidates.length === 2` and `entry.gps?.utc` is present, choose the candidate whose offset is within `MAX_GPS_DRIFT_S` of `local - utc`.

### IN-04: `openRuns` does not join the first and last runs across the ring seam

**File:** `lib/terrain/contour-paths.ts:32-45`
**Issue:** When a ring touches the border, its first run (which starts at `ring[0]`) and its last run (which ends at `ring[n-1]`, the same point) are contiguous. They are emitted as two subpaths and simplified separately, which gives a small kink or join artefact at the seam and slightly larger SVGs.
**Fix:** If the ring is closed and both the first and last segments are interior, concatenate `runs[last]` with `runs[0].slice(1)`.

### IN-05: Originals named `.jpeg` are skipped without a message

**File:** `scripts/photos/extract-exif.mjs:56-62`
**Issue:** The filter `/\.jpg$/i` ignores `IMG_1234.jpeg`. Neither write mode nor `--check` reports it as an extra original, so the photo silently never enters the pipeline.
**Fix:** Use `/\.jpe?g$/i`, or report non-matching files.

### IN-06: `Object.keys(project.highlights)` on a tuple array

**File:** `app/(site)/projects/[slug]/page.tsx:128`
**Issue:** `highlights` is now an array, so `Object.keys(...).length` counts indices. It works, but it reads as a leftover from the v1 record.
**Fix:** Use `project.highlights.length > 0`.

### IN-07: Demo command 4 says "High-risk operation" but its level is `critical`

**File:** `data/projects.ts:129`
**Issue:** The level is `riskLevel: 'critical'` (score 0.87), but the explanation still reads "High-risk operation". This is already an open question with Tim; I record it here only so it is not lost.
**Fix:** Change the wording when Tim decides.

### IN-08: Unreferenced legacy variants are still served

**File:** `public/images/optimized/*-{lg,md,sm,medium}.*` (about 60 files)
**Issue:** Only `-large` and `-thumb` are reachable through `imageManifest.legacy`. The other legacy variants are still public but unused. They are metadata-clean and within the size limit, so this is dead weight, not a leak. They are due for deletion in Phase 12.
**Fix:** Delete them in Phase 12, or now if the visual baselines do not reference them.

### IN-09: `LegacyUrl` accepts `..`

**File:** `data/schemas/image-manifest.ts:41`, `scripts/photos/build-derivatives.mjs:368-370`
**Issue:** `/^\/images\/optimized\/[^/]+$/` matches `/images/optimized/..`. `fs.existsSync(path.join(PUBLIC_DIR, url))` then passes for the `public/images` directory. The manifest is generated, so the impact is minimal.
**Fix:** Use `/^\/images\/optimized\/[^/]+\.(webp|jpe?g)$/`.

---

_Reviewed: 2026-10-24T18:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
