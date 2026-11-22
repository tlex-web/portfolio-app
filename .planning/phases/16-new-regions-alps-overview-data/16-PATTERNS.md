# Phase 16: New Regions & Alps Overview Data - Pattern Map

**Mapped:** 2026-11-22
**Files analyzed:** 30 (new + modified)
**Analogs found:** 28 / 30

> **Privacy (D-12, D-25):** this file holds no photo coordinate, photo altitude or photo grid position. Excerpts from `data/photos/corrections.json` show field shapes only, with lat/lon elided. The only coordinates are plate extents and the public Matterhorn summit anchor already in code.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `data/schemas/photo.ts` (Precision, kind, groundM, PhotoId widen x2) | model (schema) | validation | itself: `Position` refinements (195-218), `Gps` (~48-54) | exact (extend) |
| `data/schemas/region.ts` (+ country, facts) | model | validation | itself (`Region` strictObject, 36-41) | exact |
| `data/schemas/terrain.ts` (TerrainSource union, PlateSheet split, reserve `overview`, Overview schema) | model | validation | itself: `TerrainSource` 43-71, `ASSET_STEMS` 201, `PlateSheet` 308-325, `PLATE_BUDGET` 404-408 | exact |
| `data/schemas/image-manifest.ts` (PhotoId regex copy at :95) | model | validation | `data/schemas/photo.ts:96` | exact |
| `scripts/photos/extract-exif.mjs` | generator (stage 1) | file-I/O, transform | itself: `round4` 154, `gpsOf` 190-205, `idFor` 139-143 | exact |
| `scripts/photos/build-photo-data.mjs` | generator (stage 2) | transform | itself: imports 59-71, uv/height 333-347 | exact |
| `scripts/terrain/fetch-dem.mjs` (`--plate <id>`) | script (network fetch) | file-I/O | itself 30-60, 120-198 | exact |
| `scripts/terrain/fetch-bev.mjs` (new) | script (network fetch) | file-I/O, batch range reads | `scripts/terrain/fetch-dem.mjs` | exact role |
| `scripts/terrain/fetch-overview.mjs` (new) | script (network fetch) | batch | `scripts/terrain/fetch-dem.mjs` | role-match |
| `scripts/terrain/build-terrain.mjs` (3035 sources, overview, IN-05, IN-06) | generator | transform | itself: `MANAGED` 158-159, `buildPlate` 540-560 | exact |
| `data/photos/photo-map.json` | config/registry | static data | itself (Phase 15 records) | exact |
| `data/photos/exif-sidecar.json` | generated data | — | written by stage 1 only | n/a |
| `data/photos/editorial.ts` | config (copy) | static | existing entries (avoid `elevation.kind: 'summit'`, Pitfall 8) | exact |
| `data/regions/regions.json` | registry | static | itself | exact |
| `data/terrain/plates.json` | registry | static | `matterhorn` entry + selftest `FIXTURE_PLATE` (selftest.mjs:1361-1369) | exact |
| `data/terrain/plates/{ortler,saalfelden}/{dem-10m.png,source.json}` | generated source | file-I/O | `data/terrain/source/source.json` | exact |
| `data/terrain/overview/{dem.png,source.json}`, `data/terrain/overview.json` | generated source / config | file-I/O | same as above + `SUMMIT` const (build-terrain.mjs ~165-170) | role-match |
| `data/generated/overview.ts` (new, server-only) | generated module | transform | `data/generated/plates.ts` (emitted by build-terrain) | role-match |
| `data/generated/home-photos.ts` or slimmed footer imports (Pattern 5) | generated module / utility | client-bundle hygiene | `lib/ascent/home-photos.ts` | exact |
| `data/light-table.ts` (new, `lightTableIds`) | config | static | `data/home.ts` `homeWaypointIds` (14-19) | exact |
| `lib/photos/view-model.ts` (filter by lightTableIds) | service | transform | `lib/ascent/home-photos.ts` `homePhotos()` | exact |
| `lib/photos/routes.ts` (`photoRouteSlugs` pinned) | utility | static | itself (31-33, `/* @__PURE__ */`) | exact |
| `lib/home-format.ts` (`formatCoordinates` decimals) | utility | transform | itself 70-78 | exact |
| `scripts/guards/selftest.mjs` (EPSG:3035 fixture plate, coarse/aerial/DJI JPEG cases) | test (guard) | batch | itself: `FIXTURE_PLATE` + `fixtureDem()` 1358-1396, `tempTerrainRoot` 1405 | exact |
| `data/__tests__/plates.test.ts` (budget covers BEV) | test | — | itself 248-262 | exact |
| `data/__tests__/overview.test.ts` (new) | test | — | `data/__tests__/plates.test.ts` budget describe | role-match |
| `lib/__tests__/geo-proj.test.ts` (new) | test | — | no proj4 test exists; use `lib/__tests__/*` jest style | partial |
| `data/__tests__/terrain.test.ts:254-257` (IN-01), `photo-map.test.ts:74-79` (IN-07), `photos.test.ts`, `exif-sidecar.test.ts`, `region-series.test.ts` | test (rewrite in place) | — | themselves | exact |
| `components/photos/LightboxDialog.tsx:132` (IN-08), `e2e/photos-lightbox.spec.ts:826-830` + `playwright.config.ts:61` (IN-03), `__tests__/jest-globals.d.ts` + package.json (IN-04), `scripts/README.md:16-18` (IN-02) | small fixes | — | per 16-RESEARCH § Carried Findings table | exact |
| `package.json` (proj4 2.22.0, jest-mock 30.5.2, `overrides` wkt-parser) | config | — | existing `overrides` entry (fflate precedent) | exact |

## Pattern Assignments

### `scripts/photos/extract-exif.mjs` (stage 1, transform)

**Analog:** itself. Helpers at lines 152-156:
```js
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const int = (v) => (Number.isInteger(v) ? v : null);
const round4 = (v) => Math.round(v * 1e4) / 1e4;
const round1 = (v) => Math.round(v * 10) / 10;
```
**Core to extend** (`gpsOf`, lines 190-205): rounding happens here, before anything is written. Add `record` param, `roundTo(v, DECIMALS[precision])`, `altM: null` for coarse or aerial, and `groundM` from an in-memory plate sample (RESEARCH § Code Examples "Rounding at the record's level").
```js
function gpsOf(g) {
  if (!g) return null;
  const lat = dmsToDecimal(g.GPSLatitude, str(g.GPSLatitudeRef));
  const lon = dmsToDecimal(g.GPSLongitude, str(g.GPSLongitudeRef));
  const alt = num(g.GPSAltitude);
  if (lat === null || lon === null) return null;
  return {
    lat: round4(lat),
    lon: round4(lon),
    altM: alt === null ? null : round1(g.GPSAltitudeRef === 1 ? -alt : alt),
    utc: gpsUtc(g.GPSDateStamp, g.GPSTimeStamp),
  };
}
```
**Error-message pattern** (names file and fix; lines 139-143) - copy for "add a precision", and the DJI `Make` without `kind: 'aerial'` rule:
```js
function idFor(file, map) {
  const hit = Object.entries(map.photos).find(([, entry]) => entry.file === file);
  if (!hit) throw new Error(`add a record for ${file} to ${PHOTO_MAP_REL}`);
  return hit[0];
}
```
Never include a position, uv or altitude in any stage-1 error. Exclusion of the two out-of-series originals (D-27/D-28): either Tim moves them aside or an explicit exclusion list naming only the file; `listOriginals()` (127-133) is the hook.

---

### `scripts/photos/build-photo-data.mjs` (stage 2, transform)

**Imports** (lines 59-71) - add `import proj4 from 'proj4'` here only (scripts-only dependency):
```js
import { Corrections, ExifSidecar, PhotoFacts, PhotoMap } from '../../data/schemas/photo.ts';
import { Regions } from '../../data/schemas/region.ts';
import { Plates, TerrainSource } from '../../data/schemas/terrain.ts';
import { lv95ToUv, round4, wgs84ToLv95 } from '../../lib/geo.ts';
import { sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';
```
**Core uv + height** (lines 333-347) - replace `wgs84ToLv95` with a `toGrid(source.crs, position)` dispatch (EPSG:2056 keeps `lib/geo.ts`; EPSG:3035 uses proj4, lon/lat order). For coarse photos use the sidecar `groundM` instead of `sampleAtLv95`. Drop the uv from the error message (privacy):
```js
if (position) {
  const lv95 = wgs84ToLv95(position);
  const raw = lv95ToUv(lv95, dem.extent);
  if (raw.u < 0 || raw.u > 1 || raw.v < 0 || raw.v > 1) {
    throw new Error(
      `${entry.id}: position lies outside the DEM extent (uv ${raw.u.toFixed(3)}, ${raw.v.toFixed(3)}); plate ${plate.id}`
    );
  }
  uv = { u: round4(raw.u), v: round4(raw.v) };
  const m = sampleAtLv95(dem.metres, dem.width, dem.height, dem.extent, lv95);
  elevation = { source: 'dem', m: Math.round(m) };
}
```
`buildPosition(entry, fix)` at line 220 is where a coarse EXIF position becomes `approximate: true` + `reason` + `radiusM` (+ `precision`).

---

### `scripts/terrain/fetch-bev.mjs` (new) and `fetch-dem.mjs --plate`

**Analog:** `scripts/terrain/fetch-dem.mjs`.

**Imports + constants** (32-52): same imports (`crypto`, `fs`, `path`, `fromUrl` from `geotiff`, `sharp`, `TerrainSource`), `ROOT`, `NAME`, `CELL_M = 10`, `HEIGHT_SCALE = 0.1`, `FILE = 'dem-10m.png'`. For `--plate`, the target dir becomes `data/terrain/plates/<id>/`; the hardcoded Matterhorn `EXTENT` (lines 46-47) must not be the default (Anti-pattern: no-flag run).

**Nodata rule** (lines ~120-133) - keep "fail on any nodata" for BEV (D-28; BEV nodata is -9999):
```js
if (!Number.isFinite(m) || (nodata !== null && m === nodata) || m < -100 || m > 6000)
  fail(`nodata or out-of-range height ${m} at pixel ${i % width}, ${Math.floor(i / width)}`);
```
**Lossless grey16 round trip, then sha256, then `TerrainSource.parse`** (lines ~135-178): copy verbatim; the BEV variant parses with `product: 'BEV ALS DTM'`, `crs: 'EPSG:3035'`, `heightSystem: 'EVRF2000-AT'` (D-29), `edition: '2025-09'`, tile url/contentLength/lastModified, doi.

**Failure footer** (lines 188-198) - copy verbatim ("nothing written"):
```js
main().catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const i of e.issues) console.log(`${NAME}: schema ${i.path.join('.')}: ${i.message}`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  console.log(`${NAME}: nothing written`);
  process.exit(1);
});
```
**BEV-specific** (no analog): bounded retry wrapper (5 attempts, backoff, name the tile on failure) and overview level 3 window math: RESEARCH Pattern 6. Prefer passing a fetch wrapper to geotiff over patching global `fetch`.

`fetch-overview.mjs`: same skeleton; sea tiles via `tileList.txt` membership, PixelIsPoint half-cell rule (fetch-dem's `PIXEL_IS_AREA` check does not apply), heightScale 1, negatives clamped to 0.

---

### `scripts/terrain/build-terrain.mjs` (generator, transform)

**Stale sweep** (158-159) - overview files must be produced by the same run or they get deleted:
```js
const MANAGED =
  /^(?:[a-z]+(?:-[a-z]+)*-)?(contours-[a-z0-9-]+\.[^.]+\.svg|heightmap-[0-9]+\.[^.]+\.png|hillshade-[0-9]+\.[^.]+\.(avif|webp))$/;
```
**Home constant to copy for summits** (~165-170): `SUMMIT = { name, officialM, officialRef, lv95 }` is the shape for each overview summit record (`name, position, officialM, officialRef, country`).

**IN-05 site** (line ~553): add a guard before `stripBbox(extent, plate.strip.centreN, STRIP.ratio)` throwing unless `extent.south < centreN < extent.north`, naming the plate and `data/terrain/plates.json`.

**Hashed LOD naming** (`lod()` helper, ~545-549): `hashedName(\`${prefix}${base}\`, 'svg', text)` -> reuse for `overview-contours-alps`. Reserve `overview` in `ASSET_STEMS` (`terrain.ts:201`) so no plate can take the id.

Keep `data/generated/overview.ts` a separate server-only module; never add overview or credits to `plates.ts`/`terrain.ts` (both reach the footer client chunk).

---

### `data/schemas/terrain.ts` (schema)

**Analog:** `TerrainSource` (43-71) - copy the strictObject + extent refine into a `BevAlsDtmSource` and wrap both in `z.discriminatedUnion('product', [...])`. Keep the swissALTIRegio variant byte-for-byte (Matterhorn D-15 hash gate):
```ts
  .refine(
    (s) =>
      s.width * s.cellM === s.extent.east - s.extent.west &&
      s.height * s.cellM === s.extent.north - s.extent.south,
    'width/height times cellM must equal the extent (one coordinate contract, D-14)'
  );
```
`PlateSheet` (308-325): `crs: z.literal('EPSG:2056')` and `dem.product: z.literal('swissALTIRegio')` become unions; keep `extent.lv95` for 2056 and add `extent.laea` for 3035 (then `SheetLegend.tsx:44` narrows on `crs`, a planned tsc fallout). Budget constants `PLATE_BUDGET` (404-408) - add an `OVERVIEW_BUDGET` alongside in the same style.

---

### `data/schemas/photo.ts` (schema)

**Analog:** `Position` (lines 202-218) - extend with `precision`; keep both refines:
```ts
  .refine(
    (p) => !p.approximate || (p.reason !== undefined && p.radiusM !== undefined),
    'approximate positions need reason + radiusM (DATA-04)'
  )
  .refine(
    (p) => p.source === 'exif' || p.approximate,
    'hand-placed positions are approximate (DATA-04)'
  );
```
`Gps`: add `groundM` (optional, int, multiples of 10/50 via refine). `PhotoId` regex has 4 copies: `photo.ts:58` (ExifSidecarEntry.id), `photo.ts:96`, `image-manifest.ts:95`, `image-manifest.test.ts:24` - widen all together.

**Coarse display reuse:** the Riffelsee entry in `data/photos/corrections.json` (lines 19-26) is the shape a coarse position mirrors: `source`, `approximate: true`, `reason`, `radiusM: 100` (coords elided here). Every display (`PinMark`, MapSheet, ExifStrip, `view-model.ts:241-247, 364`) already renders it.

---

### `data/schemas/region.ts`

Extend `Region` (lines 36-41) - still `strictObject`, still zod-only imports:
```ts
export const Region = z.strictObject({
  id: RegionId,
  name: z.string().min(1),
  plate: PlateSlug,
});
```
Add `country` (reuse the closed ISO enum shape from `photo.ts` Country by duplication, as `PlateSlug` duplicates the plate regex) and an optional data-only facts block.

---

### `data/light-table.ts` (new) + `lib/photos/view-model.ts`

**Analog:** `data/home.ts` lines 14-19:
```ts
export const homeWaypointIds = [
  'img-0605', // matterhorn-from-zermatt
  'img-0629', // gornerschlucht-waterfall
  'img-0662', // matterhorn-glacier-trail
  'r004-011', // riffelsee-reflection
] as const satisfies readonly PhotoId[];
```
**Filter analog:** `lib/ascent/home-photos.ts` `homePhotos()` (lines 25-35): validate every id exists (RangeError naming the fix file), then `photos.filter((p) => ids.includes(p.id))` keeping generated order. Apply as the default input of `buildPhotoViews` (`view-model.ts:353`); `LIGHT_TABLE_REGION` (326) stays only as a documented check.

### `lib/photos/routes.ts`

Lines 31-33 today; keep the annotation (pinned by `lib/__tests__/photo-routes.test.ts:60`):
```ts
export const photoRouteSlugs: readonly string[] = /* @__PURE__ */ Object.values(editorial).map(
  (e) => e.slug
);
```
becomes `/* @__PURE__ */ lightTableIds.map((id) => editorial[id].slug)`. `data/light-table.ts` must import nothing heavy (type-only `PhotoId`), since client components import this module.

### Footer client-bundle split (Pattern 5)

**Analog:** `lib/ascent/home-photos.ts` JSDoc lines 4-12 states the rule ("The footer renders inside the client-rendered app/global-error.tsx, so whatever it imports ships in a client chunk"). Today it imports all of `data/generated/photos.ts`; the fix generates a Home-only module (or home-only plate sheet for `ContourField`/`SheetLegend`). Measure client JS base first (15-01 method), budget 4,096 B.

### `lib/home-format.ts`

Lines 76-78:
```ts
export function formatCoordinates({ lat, lon }: { lat: number; lon: number }): string {
  return `${fourDecimals(lat)}${NBSP}${lat < 0 ? 'S' : 'N'} ${fourDecimals(lon)}${NBSP}${lon < 0 ? 'W' : 'E'}`;
}
```
Add a `decimals: 2 | 3 | 4 = 4` parameter; keep `fourDecimals`' round-half-up behaviour for 4 so current strings stay byte-identical (do not swap to `toFixed` blindly).

---

### `scripts/guards/selftest.mjs` (EPSG:3035 fixture, extraction cases)

**Analog:** lines 1358-1396:
```js
const FIXTURE_PLATE = {
  id: 'fixture',
  prefix: 'fixture-',
  source: 'data/terrain/plates/fixture',
  home: false,
  threeD: false,
  outputs: { contours: ['hero', 'strip'], hillshade: [1100, 640] },
  strip: { centreN: 1200500 },
};
```
plus `fixtureDem()` (synthetic 100x100 cosine hill, grey16, decimetres) and `tempTerrainRoot({ fixture })` (1405). Add a second fixture with a `BEV ALS DTM` / `EPSG:3035` source.json and assert `TERRAIN_HOME_MODULES` stay byte-equal. Extraction cases use generated JPEGs only (15 D-23), run through `--root` like the photo-data cases (`photoDataOffPlateRoot`, ~1033).

### `data/__tests__/plates.test.ts` / new `overview.test.ts`

Budget iteration (248-262) already covers every sheet once `PlateSheet` admits BEV:
```ts
test.each(sheets)('%s serves and fetches within its budget', (_id, sheet) => {
  const served = sheetUrls(sheet).reduce((sum, u) => sum + bytes(u), 0);
  const servedMax = sheet.threeD ? PLATE_BUDGET.servedMax3D : PLATE_BUDGET.servedMax2D;
  expect(served).toBeLessThanOrEqual(servedMax);
  ...
});
```
`overview.test.ts`: same `bytes()` helper; add `zlib.brotliCompressSync` at fixed quality for the brotli cap; assert 3-5 summits, one outline per plate, verbatim GLO-90 notice.

## Shared Patterns

### Generator `--check` / `--root`
**Source:** `scripts/photos/build-photo-data.mjs` `parseArgs` (~73-80). **Apply to:** every new/changed generator (build-terrain overview path). Fetchers stay manual, never in CI.

### Fail naming file + fix, write nothing
**Source:** `extract-exif.mjs:139-143`, `fetch-dem.mjs:188-198`, `home-photos.ts:27-31`. **Apply to:** all scripts and filters. No coordinates/uv in messages.

### Schemas import only `zod`
**Source:** `data/schemas/region.ts` header (lines 1-14). **Apply to:** photo/region/terrain/overview schemas.

### `/* @__PURE__ */` on top-level derived lists in client-imported modules
**Source:** `lib/photos/routes.ts:22-33`. **Apply to:** routes.ts, any new shared light-table/home module.

### Tests rewritten in place (GUARD-03)
Apply to `photos.test.ts:55-57`, `exif-sidecar.test.ts:38`, `photo-map.test.ts:74-86`, `region-series.test.ts`, `terrain.test.ts:254-257`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lib/__tests__/geo-proj.test.ts` | test | - | No proj4 in repo yet; follow RESEARCH § Code Examples "proj4 for an EPSG:3035 plate" |
| BEV retry wrapper inside `fetch-bev.mjs` | utility | network | No retrying fetcher exists; use RESEARCH Pattern 6 |

## Metadata

**Analog search scope:** `scripts/photos`, `scripts/terrain`, `scripts/guards`, `data/schemas`, `data/__tests__`, `data/home.ts`, `lib/photos`, `lib/ascent`, `lib/home-format.ts`, `data/photos/corrections.json`
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-22
