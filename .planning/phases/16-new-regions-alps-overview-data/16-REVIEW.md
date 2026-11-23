---
phase: 16-new-regions-alps-overview-data
reviewed: 2026-11-23T18:21:58Z
depth: standard
files_reviewed: 69
files_reviewed_list:
  - .gitattributes
  - components/home/PosterSheet.tsx
  - components/photos/LightboxDialog.tsx
  - components/photos/MapSheet.tsx
  - components/photos/__tests__/map.test.tsx
  - components/photos/__tests__/strip.test.tsx
  - components/site/EdgeArt.tsx
  - components/site/SiteFooter.tsx
  - components/terrain/ContourField.tsx
  - components/terrain/SheetBand.tsx
  - components/terrain/SheetLegend.tsx
  - components/terrain/__tests__/ContourField.test.tsx
  - data/__tests__/editorial.test.ts
  - data/__tests__/exif-sidecar.test.ts
  - data/__tests__/home.test.ts
  - data/__tests__/image-manifest.test.ts
  - data/__tests__/overview.test.ts
  - data/__tests__/photo-map.test.ts
  - data/__tests__/photos.test.ts
  - data/__tests__/plates.test.ts
  - data/__tests__/terrain.test.ts
  - data/generated/home-photos.ts
  - data/generated/home-plate.ts
  - data/generated/image-manifest.ts
  - data/generated/overview.ts
  - data/generated/photos.ts
  - data/generated/plates.ts
  - data/home-waypoints.ts
  - data/home.ts
  - data/light-table.ts
  - data/photos/editorial.ts
  - data/schemas/image-manifest.ts
  - data/schemas/overview.ts
  - data/schemas/photo.ts
  - data/schemas/region.ts
  - data/schemas/terrain.ts
  - e2e/photos-lightbox.spec.ts
  - eslint.config.mjs
  - lib/__tests__/ascent-waypoints.test.ts
  - lib/__tests__/client-graph.test.ts
  - lib/__tests__/home-format.test.ts
  - lib/__tests__/photo-routes.test.ts
  - lib/__tests__/photos-view-model.test.ts
  - lib/__tests__/region-series.test.ts
  - lib/ascent/home-photos.ts
  - lib/ascent/waypoints.ts
  - lib/home-format.ts
  - lib/photo-format.ts
  - lib/photos/routes.ts
  - lib/photos/view-model.ts
  - playwright.config.ts
  - scripts/README.md
  - scripts/guards/check-served-images.mjs
  - scripts/guards/selftest.mjs
  - scripts/photos/build-photo-data.mjs
  - scripts/photos/extract-exif.mjs
  - scripts/photos/plate-dem.mjs
  - scripts/terrain/build-terrain.mjs
  - scripts/terrain/fetch-bev.mjs
  - scripts/terrain/fetch-dem.mjs
  - scripts/terrain/fetch-overview.mjs
  - data/photos/photo-map.json
  - data/regions/regions.json
  - data/terrain/overview.json
  - data/terrain/plates.json
  - data/terrain/overview/source.json
  - data/terrain/plates/ortler/source.json
  - data/terrain/plates/saalfelden/source.json
  - package.json
findings:
  critical: 0
  warning: 6
  info: 9
  total: 15
  necessity: 2
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-11-23T18:21:58Z
**Depth:** standard
**Files Reviewed:** 69
**Status:** issues_found

## Summary

I reviewed the 61 source files and 8 text-data files Phase 16 changed (`git diff f258fbe`). I did not open the 81 binary or generated assets. ESLint is clean on the changed TypeScript and `.mjs` files. I opened no photo coordinate, and I quote none here.

The privacy pipeline works as designed on the committed data:
- **Extraction (stage 1):** rounds each position to its record's precision before writing. It drops `altM` for coarse and aerial records and samples `groundM` at the true spot in memory.
- **Stage 2:** refuses a position with more decimals than its precision, and refuses a `groundM` on a 4dp photo.
- **Committed sidecar:** every entry matches its `photo-map.json` precision and kind.
- **Light table and route sets:** pinned to the four v2.0 ids (D-15).
- **Footer chunk:** reads only `home-plate.ts` and `home-photos.ts`.

I found no blocker. The main weakness is where the D-03/D-04 rules are enforced. Some are checked only by `photos:exif` with the originals present, so CI and the committed-data tests cannot see them:
- the aircraft or GPS altitude on a coarse or aerial record (WR-01);
- the DJI safety net (WR-01);
- the freshness of a coarse photo's `groundM` against its plate (WR-02).

The generated-facts schema also doesn't enforce the coarse invariants it documents (WR-03). The client-graph guard is narrower than the generated `overview.ts` header claims (WR-04). The remaining findings are about provenance and necessity in the BEV fetcher, plus small consistency items.

## Warnings

### WR-01: D-03/D-04 sidecar rules are not checked anywhere CI runs

**File:** `scripts/photos/build-photo-data.mjs:397-423`, `scripts/photos/extract-exif.mjs:282, 334, 414`
**Issue:** Only extraction enforces these rules:
- a coarse or aerial record keeps no GPS altitude (`keepAlt`, extract-exif.mjs:282);
- a DJI still must be `kind: 'aerial'` (extract-exif.mjs:334).

`photos:exif -- --check` skips all fresh extraction when the originals are absent (line 414, "hash check skipped"), so in CI it only parses the schemas. `ExifSidecarEntry` can't express "altM is null for an aerial record" because the sidecar doesn't carry the record. `photos:build` cross-reads the sidecar with the record but checks only the coordinate decimals and `groundM`. It never checks `altM` or `make`. The committed-data tests (`exif-sidecar.test.ts`, `photo-map.test.ts`, `photos.test.ts`) don't assert either rule.

So any of these passes `data:check`, lint and Jest:
- a hand-merged or rebased sidecar;
- a record flipped to `aerial` after extraction;
- a DJI entry on a `ground` record.

The aircraft altitude would then be committed. That is the one-way leak D-04 exists to prevent ("the aircraft altitude can be evidence of a flight above 120 m").
**Fix:** Add the cross-checks to stage 2, which already holds both the entry and the record. Name the photo, never the value:
```js
// build-photo-data.mjs, in the per-entry loop, before buildPosition
if ((coarse || record.kind === 'aerial') && entry.gps && entry.gps.altM !== null) {
  throw new Error(`${entry.id}: a ${record.precision} ${record.kind} photo carries gps.altM; run npm run photos:exif with its original (16 D-03, D-04)`);
}
if (entry.make !== null && entry.make.toLowerCase() === 'dji' && record.kind !== 'aerial') {
  throw new Error(`${entry.id}: a DJI still must be kind 'aerial' in ${PHOTO_MAP_REL} (16 D-04)`);
}
```
Also add a committed-data test that walks the sidecar with the map and asserts both rules.

### WR-02: A coarse photo's `groundM` goes stale silently when its plate changes

**File:** `scripts/photos/build-photo-data.mjs:419-424`; `scripts/README.md` (the "reports that photo stale … until photos:exif runs again" paragraph)
**Issue:** For a coarse EXIF photo, stage 2 copies `entry.gps.groundM` unchanged (`elevation = { source: 'dem', m: groundM }`). The stored value doesn't record which plate source it was sampled from. Any of these changes leaves every coarse height out of date, with `data:check` still green:
- refetching a plate's DEM;
- moving its extent on the grid (as D-27 did for Ortler);
- changing a coarse record's `region`.

A 4dp photo has no such gap, because stage 2 resamples it from the committed DEM. The README documents the gap but says it surfaces only with the originals present, which never happens in CI.

The pin still draws, so the result is a wrong altitude label and a wrong place in the altitude order (REGION-03, REGION-05). If the extent moved, the true spot may no longer be on the plate. Stage 2 can't detect that, because it checks only the rounded position.
**Fix:** In stage 1, record the plate source the height came from beside `groundM`. That reveals nothing about the position. Stage 2 then fails on a mismatch:
```js
// extract-exif.mjs gpsOf (coarse branch)
gps.groundM = Math.round(sample(lat, lon) / step) * step;
gps.groundSourceSha256 = dem.sha256;            // add to Gps as Sha256.optional()
// build-photo-data.mjs (coarse EXIF branch)
if (entry.gps.groundSourceSha256 !== plateSource.sha256)
  throw new Error(`${entry.id}: gps.groundM was sampled on another ${plate.id} source; run npm run photos:exif with its original`);
```
`loadPlateDem` would need to return `source.sha256`. It already reads it.

### WR-03: `Position` documents coarse invariants it does not enforce

**File:** `data/schemas/photo.ts:252-268`
**Issue:** The JSDoc says "A coarse ('3dp' or '2dp') EXIF position is approximate too (DATA-14)". `Position` has only two refinements: approximate ⇒ reason + radius, and hand-placed ⇒ approximate. Two invariants are missing:
- `precision !== '4dp'` doesn't imply `approximate: true`;
- `lat`/`lon` can carry more decimals than `precision` (`Coord4` allows four for every level).

`PhotoFacts.parse` is the last gate before `data/generated/photos.ts`, and the view-model draws the dashed pin and "≈" from `position.approximate` alone. So a position like `{ precision: '3dp', approximate: false }` renders as an exact solid pin. A 3dp record with four-decimal coordinates prints only three decimals in the strip, but the finer value would still ship in the RSC payload and the generated module. Today only `buildPosition` keeps these invariants, and stage 2 is not the schema.
**Fix:**
```ts
const DECIMALS = { '4dp': 4, '3dp': 3, '2dp': 2 } as const;
const within = (v: number, d: number) => Math.abs(v * 10 ** d - Math.round(v * 10 ** d)) < 1e-6;
export const Position = z.strictObject({ ... })
  .refine(approximateHasReason, ...)
  .refine(handPlacedIsApproximate, ...)
  .refine((p) => p.precision === '4dp' || p.approximate, 'a coarse position is approximate (DATA-14)')
  .refine((p) => within(p.lat, DECIMALS[p.precision]) && within(p.lon, DECIMALS[p.precision]),
          'a position has at most its precision\'s decimals (16 D-01)');
```

### WR-04: The client-graph guard covers only `global-error`, but `overview.ts` claims it covers the whole client graph

**File:** `scripts/terrain/build-terrain.mjs:566-567` (the generated header of `data/generated/overview.ts`); `lib/__tests__/client-graph.test.ts:44, 88-102`
**Issue:** The generated module says "Never import this from a client component; lib/__tests__/client-graph.test.ts forbids it on the client graph." The walk starts only at `app/global-error.tsx` (`ENTRY`). The repository has 40 `'use client'` files under `app/`, `components/` and `lib/`, and none of them is an entry. A Phase 18 client component that imports `@/data/generated/overview` or `@/data/generated/plates` would pass the test. That would ship the outlines, the summits and the GLO-90 notice into a client chunk. That is the T-16-36 threat the comment says is mitigated. (I walked every `'use client'` file with the test's own parser: none reaches `overview.ts`, `plates.ts`, `photos.ts` or `image-manifest.ts` today.)
**Fix:** Seed the walk with every file whose first statement is `'use client'`, not just `global-error.tsx`. Alternatively, emit `import 'server-only';` as the first line of `overview.ts`; Next then fails the build on a client import. Either way, make the header describe what is enforced.

### WR-05: The BEV fetcher records "about 8 m" provenance without checking the overview scale

**File:** `scripts/terrain/fetch-bev.mjs:85-87, 376-382`
**Issue:** The source record's `resampling` is a schema literal: "bilinear from overview level 3 (about 8 m) to 10 m cell centres". The fetcher takes `OVERVIEW_LEVEL = 3` blindly. It checks only that the level exists. Its scale `sx` is printed after the write and never asserted. If BEV re-tiles its COGs with a different pyramid (for example 16 m at level 3), the plate is still written. It would then be silently coarser than its 10 m grid, and its committed record would misstate how the heights were derived. That record is what Phase 18's sources page cites.
**Fix:** Before reading, fail unless the level is finer than the output cell and matches the recorded wording:
```js
const { win, sx, sy, u, v } = overviewWindow(extent, full, ov);
if (!(sx > 7 && sx < 9 && Math.abs(sx - sy) < 1e-9))
  fail(`overview level ${OVERVIEW_LEVEL} is ${sx.toFixed(2)} x ${sy.toFixed(2)} m, not about 8 m; update RESAMPLING and the schema literal`);
```

### WR-06: Impossible-state guard — the product check after `TerrainSource.parse` in fetch-bev

**File:** `scripts/terrain/fetch-bev.mjs:446-468`
**Category:** necessity
**Issue:** The record is built with the literal `product: 'BEV ALS DTM'` and parsed with `TerrainSource`, a `z.discriminatedUnion('product', …)` (`data/schemas/terrain.ts:139-142`). The discriminator selects the BEV variant, and a field that fails that variant makes `parse` throw. So `source.product !== 'BEV ALS DTM'` can never be true at line 468. The sibling fetcher parses its variant directly instead (`fetch-dem.mjs`: `SwissAltiRegioSource.parse`).
**Fix:** Parse with `BevAlsDtmSource.parse({...})` and delete the line-468 check. The variant is then explicit, as in fetch-dem.

## Info

### IN-01: Coarse coordinates can still be padded through `formatCoordinates`' default

**File:** `lib/home-format.ts:75-78`; `lib/photos/view-model.ts:126-131`
**Issue:** `PositionInput` says a position without a precision "does not compile, so no path can pad a coarse coordinate to four decimals". But `formatCoordinates(position)` still defaults `decimals` to 4. A future caller that skips `DECIMALS[position.precision]` would print `46.0150 N` for a 3dp position, which D-01 forbids.
**Fix:** Make `decimals` required, or have `formatCoordinates` accept `{ lat, lon, precision }` and derive the decimals itself.

### IN-02: Impossible-state guard — the redundant nodata comparisons in the BEV value check

**File:** `scripts/terrain/fetch-bev.mjs:97-100, 393, 418`
**Category:** necessity
**Issue:** `m <= NODATA_AT_OR_BELOW` (-9000) is subsumed by `m < MIN_M` (-100) on the same line. Heights from -100 m up to 0 m pass that range check but then fail the `value >= 0` 16-bit check at line 418, with a less specific message. As a result, the -9000 constant and the negative half of the range never decide anything.
**Fix:** Use one rule: `if (!Number.isFinite(m) || m < 0 || m > MAX_M) fail('nodata or out-of-range …')`, and drop `NODATA_AT_OR_BELOW` and `MIN_M`. Alternatively, keep MIN_M at 0 and say why.

### IN-03: `homePhotos` names the wrong generated file in its error

**File:** `lib/ascent/home-photos.ts:32`
**Issue:** The function now reads `homePhotoFacts` from `data/generated/home-photos.ts`, but the RangeError still says the id "has no photo in data/generated/photos.ts".
**Fix:** Name `data/generated/home-photos.ts` and suggest re-running `npm run photos:build`.

### IN-04: `loadHomeWaypointIds` hides the real import error

**File:** `scripts/photos/build-photo-data.mjs:337-345`
**Issue:** The bare `catch {}` replaces every failure with "cannot read data/home-waypoints.ts": a missing file, a TypeScript syntax that Node can't strip, or a runtime throw. The cause is lost.
**Fix:** `catch (e) { throw new Error(\`cannot read ${HOME_WAYPOINTS_REL} (${e?.message ?? e}); …\`); }`

### IN-05: Overview summits drop the height source D-18 asks each record to carry

**File:** `scripts/terrain/build-terrain.mjs:526-540`
**Issue:** D-18 says each summit carries "official height with its source". `overviewSummits` writes `name, country, officialM, status, officialRef, uv` and drops `source` and `borders`. That leaves Triglav (`secondary`, `officialRef: null`) without any height attribution in `overview.ts`, the module Phase 18's sources page will read.
**Fix:** Copy `source` (and `borders`, if Phase 18 labels border summits) into the generated record.

### IN-06: IN-05's strip fix still clamps a centre near the edge

**File:** `scripts/terrain/build-terrain.mjs:851-857`; `lib/geo.ts:81-92`
**Issue:** The new check rejects only a `strip.centreN` outside the extent. `stripBbox` still silently shifts a band whose centre is inside the extent but within half a band height of its south or north edge. The band then isn't centred on `centreN`. That is the "silently draw another band" case the comment cites. No committed plate hits it: each centre is at least half a band from its edges.
**Fix:** Also require `centreN ± height/2` (snapped) to lie inside the extent, or have `stripBbox` throw instead of clamping.

### IN-07: The new 16-bit sources rely on git's binary autodetection

**File:** `.gitattributes:16-17`
**Issue:** The file states "16-bit PNGs: never touch the bytes (source sha256 and hashed file names)", but only `data/terrain/source/*.png` is marked `binary`. `data/terrain/plates/*/dem-10m.png` and `data/terrain/overview/dem.png` are sha256-verified on every build, yet they're unlisted. `git ls-files --eol` shows them as `-text` only through autodetection, and this checkout runs `core.autocrlf=true`. The same applies to the new plate and overview `source.json` files compared with the old one, which has `text eol=lf`.
**Fix:** Add `data/terrain/plates/**/*.png binary`, `data/terrain/overview/*.png binary` and the matching `source.json eol=lf` lines.

### IN-08: The two plate fetchers duplicate their argument and extent code

**File:** `scripts/terrain/fetch-bev.mjs:109-156, 218-223`; `scripts/terrain/fetch-dem.mjs:85-188`
**Issue:** These are copied verbatim between the two scripts: `parseArgs`, `extentProblem`, `parseExtent`, `sameExtent`, `extentText`, `shown`, `MAX_SIDE_M` and `CELL_M`. `withRetry`, `finalError` and `reasonOf` are also duplicated between fetch-bev and fetch-overview. A rule change, such as the square or 20 km limit, has to be made in two places, and the selftest covers each script's refusals separately.
**Fix:** Move the shared argument and extent rules into a small `scripts/terrain/plate-args.mjs`, and the retry helpers into one module.

### IN-09: The GLO-90 mosaic clamps every negative value to 0 m with no lower sanity bound

**File:** `scripts/terrain/fetch-overview.mjs:209-211, 250`
**Issue:** `readTile` rejects values above `MAX_M` as a corrupt read. Any negative value, including a void or nodata sentinel, becomes 0 m and reads as sea. The upper and lower bounds are asymmetric, so a bad tile region would quietly become a flat hole in the overview contours.
**Fix:** Fail on values below a plausible floor (for example -500 m), as the upper bound does. Keep clamping only legitimate small negatives near the coast.

---

_Reviewed: 2026-11-23T18:21:58Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
