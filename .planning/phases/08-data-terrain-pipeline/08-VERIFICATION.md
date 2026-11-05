---
phase: 08-data-terrain-pipeline
verified: 2026-10-24T22:30:00Z
status: passed
score: 8/8 must-haves verified
covered_files:
  - ".planning/phases/08-data-terrain-pipeline/08-01-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-01-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-02-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-02-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-03-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-03-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-04-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-04-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-05-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-05-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-06-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-06-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-07-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-07-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-08-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-08-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-09-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-09-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-10-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-10-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-11-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-11-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-12-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-12-SUMMARY.md"
  - ".planning/phases/08-data-terrain-pipeline/08-13-PLAN.md"
  - ".planning/phases/08-data-terrain-pipeline/08-13-SUMMARY.md"
  - "components/site/SiteFooter.tsx"
  - "components/terrain/ContourField.tsx"
  - "data/generated/image-manifest.ts"
  - "data/generated/photos.ts"
  - "data/generated/precache.json"
  - "data/generated/terrain.ts"
  - "data/landscapes.ts"
  - "data/photos/corrections.json"
  - "data/photos/editorial.ts"
  - "data/photos/exif-sidecar.json"
  - "data/projects.ts"
  - "data/schemas/editorial.ts"
  - "data/schemas/image-manifest.ts"
  - "data/schemas/photo.ts"
  - "data/schemas/project.ts"
  - "data/schemas/terrain.ts"
  - "data/site.ts"
  - "data/terrain/source/source.json"
  - "data/types.ts"
  - "e2e/data-privacy.spec.ts"
  - "lib/footer-format.ts"
  - "lib/geo.ts"
  - "lib/legacy-highlights.ts"
  - "lib/photo-format.ts"
  - "lib/terrain/contour-paths.ts"
  - "lib/terrain/dem-sample.ts"
  - "lib/terrain/hillshade.ts"
  - "lib/trail-grade.ts"
  - "next.config.ts"
  - "package.json"
  - "proxy.ts"
  - "scripts/guards/check-served-images.mjs"
  - "scripts/inject-build-hash.mjs"
  - "scripts/photos/build-derivatives.mjs"
  - "scripts/photos/build-photo-data.mjs"
  - "scripts/photos/extract-exif.mjs"
  - "scripts/terrain/build-terrain.mjs"
  - "scripts/terrain/fetch-dem.mjs"
covered_digest: "v3:sha256:995f3e8b8dd3512fd354f461660719aaa820738028d4fe5eeeccacbcebbd7d19"
behavior_unverified: 0
overrides_applied: 0
deferred:
  - truth: "Footer contour band lines read as 1 px strokes in Firefox (08-13 Task 1 step 6, RESEARCH A2)"
    addressed_in: "Phase 12"
    evidence: "08-13-PLAN.md line 68: 'a visible difference is recorded for the Phase 12 cross-browser pass, not fixed here'; Phase 12 success criterion 5: 'Chromium, Firefox and WebKit runs pass'; STATE.md pending todo [Phase 12, from 08-13]"
---

# Phase 8: Data & Terrain Pipeline Verification Report

**Phase Goal:** Real swisstopo terrain and real photo EXIF become committed, typed, privacy-safe data that every later surface reads, and the site footer becomes a map legend drawn from that terrain.
**Verified:** 2026-10-24
**Status:** passed
**Re-verification:** No, initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | SC1a: swissALTIRegio for Zermatt-Matterhorn becomes content-hashed 16-bit heightmaps (512 desktop, 256 mobile) and a contour SVG | ✓ VERIFIED | `public/terrain/heightmap-512.548be40405.png` and `heightmap-256.f792a8921f.png`: IHDR bit depth 16, colour type 0 (grey16), sharp reports 512x512 and 256x256 `ushort`. Three contour SVGs (hero/map/strip) each carry a `<path>` set with `vector-effect="non-scaling-stroke"`. Source raster `data/terrain/source/dem-10m.png` (1100x1100, 16-bit) with `source.json` naming the swisstopo STAC item and COG URL, edition 2026-05, sha256 pinned. `terrain: OK` from `--check` (pixels decoded and compared, hashes recomputed). Summit DEM 4473 m vs official 4478 m recorded in `terrain.ts`. |
| 2 | SC1b / SHELL-04: every page footer shows the contour art as a map legend with scale bar and swisstopo attribution | ✓ VERIFIED | `SiteFooter.tsx` renders `ContourField lod="strip"` (CSS mask of the hashed strip SVG over `bg-contour`), waypoint ticks (solid exact, dashed `approximate`), a three-tier scale bar `calc(100cqw * L/11000)`, Equidistance, Extent (LV95), Last surveyed, and `Source: Contours derived from swissALTIRegio. {site.attribution.terrain}`. `SiteChrome` mounts it, and `SiteChrome` is used by `app/(site)/layout.tsx`, `app/not-found.tsx` and `app/global-error.tsx` (static variant), so it appears on every route plus 404 and global error. Footer data all read from `data/generated/terrain.ts` and `photos.ts`; no literals. `SiteFooter.test.tsx` and `footer-format.test.ts` pass. 36 linux visual baselines for all routes were committed by Tim (88191d0) and CI visual job was green twice on that SHA (run 40127078488). |
| 3 | SC2: originals' EXIF becomes committed typed photo data (Europe/Zurich capture, camera, lens, focal length, aperture, shutter, ISO, GPS at 4 dp) and CI fails when stale | ✓ VERIFIED | `data/photos/exif-sidecar.json` parsed by strict zod `ExifSidecar` (`Coord4` refine rejects more than 4 dp); `data/generated/photos.ts` carries `capture {local, timeZone: 'Europe/Zurich', offset}`, `exif {camera, lens, focalLengthMm, fNumber, exposureTimeS, iso}`, `position {lat, lon}` at 4 dp. Grep for any 5+ decimal coordinate in `data/`, `app/`, `components/`, `lib/` returns nothing. `npm run lint` runs `data:check` (terrain, photos:exif, photos:derive, photos:build `--check`); all `OK` when I ran it; `.github/workflows/ci.yml` runs `npm run lint`. Note: the sidecar-versus-originals hash comparison is skipped in CI by design (originals are gitignored, D-09); CI enforces schema validity and that `photos.ts` and derivatives are regenerated-equal to the sidecar and corrections. See Advisory note A1. |
| 4 | SC3: photo content matches the evidence (EXIF dates, waterfall location from Tim, annotation altitudes, year tags, no near-duplicate stories, film scan hand-placed and flagged approximate) | ✓ VERIFIED | `photos.ts`: img-0605 2021-09-06T10:48:46 (+02:00), img-0629 2021-09-06T11:22:57, img-0662 2021-09-07T10:58:25, all `source: exif`; tags 2021/autumn (no `2024`); film scan `precision: year, 2019, source: Tim` and `position {source: 'hand-placed', approximate: true, reason, radiusM: 100}`, `locationOverride Riffelsee`. Waterfall `locationOverride {name: 'Gornerschlucht', source: 'Tim'}`. Annotation elevations are references (`photo` -> DEM height, `summit` -> official 4,478 m) resolved by `elevationMetres()` in `data/landscapes.ts`, never typed. `photos.test.ts` and `editorial.test.ts` assert the above, plus a word-trigram Jaccard < 0.3 check between all story pairs. Tim's replies for the copy decision ("approve") are quoted in 08-10/08-11 SUMMARYs. |
| 5 | SC4a: no full-resolution original or GPS-bearing image can be fetched from the public site; every served image is resized, rotated and metadata-free, CI-enforced | ✓ VERIFIED | `assets/photos-original/` is gitignored and holds the originals (outside `/public`). I scanned all tracked files for `Exif`, `GPSLatitude`, `<x:xmpmeta`: only the three guard self-test fixtures match. sharp metadata on all 60 legacy `public/images/optimized/*` files: no exif, xmp or iptc, no orientation tag, longest edge 2400 px. All 36 hashed `public/images/photos/*` are at most 2560 px. `npm run guard:images` prints `served-images: OK` (rules: metadata, oversize, orientation, hash-name, orphan, missing, svg-content, metadata-call), wired into `npm run lint`. `e2e/data-privacy.spec.ts` asserts 404 for the eight removed full-res URLs and the old optimization manifest; Tim's 08-09 reply "green: 404, 200 public, max-age=31536000, immutable" confirms this against the preview deploy. Git history exposure is the accepted D-12 risk (CR-01, see below). |
| 6 | SC4b / DATA-08: components take image paths from the pipeline manifest, not hard-coded variant filenames | ✓ VERIFIED | `data/generated/image-manifest.ts` (hashed variants per photo plus a `legacy` block read from disk). `data/landscapes.ts` derives every `src`, `fallbackSrc` and `thumbnailSrc` from `imageManifest[photo.id].legacy`; a grep for `/images/`, `/terrain/`, `.webp`, `.avif`, `IMG_0`, `-large`, `-thumb` across `app/`, `components/`, `lib/`, `data/*.ts` and `editorial.ts` finds no path literal (only schema regexes and `globals.css` comments). `editorial.test.ts` "holds no image-path literal in the bridge source" passes. The hashed variants are not yet rendered by any component; that is Phase 9/10 scope (bridge is explicitly "Phase 10 retires this"). |
| 7 | SC5 / DATA-07: project highlights type-check against a per-project schema; every CLI_X risk example has a numeric `riskScore` | ✓ VERIFIED | `data/schemas/project.ts`: `ProjectSchema` is a `discriminatedUnion('slug')` of `ClixCli` and `ClixWebsite`, each `highlights` a fixed tuple of typed blocks, all `strictObject`; `DemoCommandSchema.riskScore: z.number().min(0).max(1)` required. `data/types.ts` `Project = z.infer<typeof ProjectSchema>` and `data/projects.ts` is typed `Project[]`. All four demo commands carry `riskScore` 0.05, 0.15, 0.29, 0.87 (Tim's checkpoint reply in 08-03). `lib/trail-grade.ts` bands agree with the levels. `npx tsc --noEmit` clean; `projects.test.ts` and `trail-grade.test.ts` pass. |
| 8 | Delivery: hashed terrain and photo assets are immutable, skip the per-request CSP, and the footer strip is service-worker precached | ✓ VERIFIED | `next.config.ts` sets `Cache-Control: public, max-age=31536000, immutable` on `/images/:path*` and `/terrain/:path*`; `proxy.ts` matcher excludes `images/` and `terrain/`; `scripts/inject-build-hash.mjs` injects `data/generated/precache.json` (the strip URL) into the SW at postbuild and `public/service-worker.js` keeps its placeholders in git. `precache.test.ts` passes. Tim's 08-09 preview check confirms the header values. |

**Score:** 8/8 truths verified (0 present-but-behavior-unverified). None of the truths asserts a state transition, cancellation, cleanup or ordering invariant, so the behavior-dependent rule does not apply.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Firefox 1 px stroke check of the footer contour band (08-13 Task 1 step 6, RESEARCH A2): Tim's only reply was "pushed", no Firefox observation was reported | Phase 12 | 08-13-PLAN.md line 68 designates a visible cross-engine difference as "recorded for the Phase 12 cross-browser pass, not fixed here"; Phase 12 SC5 requires "Chromium, Firefox and WebKit runs pass"; STATE.md carries a Phase 12 pending todo with the exact reproduction steps. |

**Why deferred, not human_needed (judgment call):** the check is cosmetic (a possible stroke-weight difference of an already-rendered decorative band in one engine), the phase plan itself routes any finding to Phase 12 rather than treating it as a Phase 8 gate, and the footer legend's goal (contour art, scale bar, attribution present on every route) is verified independently of stroke weight. It is not a data, privacy or correctness item. If Tim wants it closed earlier, it is a two-minute manual check; it is not required to call Phase 8 achieved. The SUMMARY correctly records the acceptance criterion as PARTIALLY MET rather than inventing an observation.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `lib/geo.ts`, `lib/terrain/{dem-sample,contour-paths,hillshade}.ts` | coordinate contract and pure terrain cores | ✓ VERIFIED | Present, substantive, imported by build scripts and tests; `geo.test.ts`, `dem-sample.test.ts`, `contour-paths.test.ts`, `hillshade.test.ts` pass. |
| `scripts/terrain/{fetch-dem,build-terrain}.mjs` | offline terrain build with `--check` | ✓ VERIFIED | `terrain: OK`. |
| `public/terrain/*` (9 files) | hashed heightmaps, contours, hillshade posters | ✓ VERIFIED | All listed in `terrain.ts`; guard reports no orphan or missing. |
| `data/generated/{terrain,photos,image-manifest}.ts`, `precache.json` | generated typed data | ✓ VERIFIED | Consumed by footer, landscapes bridge and tests. |
| `scripts/photos/{extract-exif,build-derivatives,build-photo-data}.mjs` | three-stage photo pipeline with `--check` | ✓ VERIFIED | All three print `OK`. |
| `scripts/guards/check-served-images.mjs` | privacy guard in lint | ✓ VERIFIED | `served-images: OK`; self-test fixtures cover each rule. |
| `data/schemas/{photo,project,terrain,image-manifest,editorial}.ts` | strict zod contracts | ✓ VERIFIED | Imported by generators and tests. |
| `components/site/SiteFooter.tsx`, `components/terrain/ContourField.tsx`, `lib/footer-format.ts` | footer legend | ✓ VERIFIED | Wired through `SiteChrome` to all three entry points. |
| `components/Footer.tsx` (v1) | n/a | ℹ️ ORPHANED, intentional | Not imported anywhere; v1 file awaiting Phase 12 cleanup (VERIFY-01). |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `SiteChrome` | `SiteFooter` | import and render | WIRED | Used by `(site)/layout`, `not-found`, `global-error`. |
| `SiteFooter` | `terrain.ts`, `photos.ts`, `site.ts` | named imports | WIRED | Extent, equidistance, edition, ticks from `uv.u`, attribution from `site.attribution.terrain`. |
| `ContourField` | `terrain.assets.contours.strip` | CSS `mask-image` | WIRED | Hashed URL matches file on disk. |
| `landscapes.ts` | `photos.ts`, `editorial.ts`, `image-manifest.ts` | derive | WIRED | Order from generated photos, copy from editorial, paths from manifest. |
| `inject-build-hash.mjs` | `precache.json` | postbuild | WIRED | Validates URLs are hashed `/terrain/` assets. |
| `package.json` lint | `data:check`, `guard:images` | script chain | WIRED | Ran green. |
| CI `ci.yml` | `npm run lint` | workflow step | WIRED | So stale generated data fails CI. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `SiteFooter` ticks | `photo.uv.u` | `photos.ts` from sidecar GPS and DEM-projected UV | Yes (0.6772, 0.657, 0.459, 0.8256) | ✓ FLOWING |
| `SiteFooter` margin | `terrain.extent`, `contours.strip`, `dem.edition` | generated from swissALTIRegio source | Yes | ✓ FLOWING |
| `landscapes` | `capture`, `exif`, `elevation` | generated photo facts | Yes | ✓ FLOWING |
| `ContourField` mask | strip SVG | generated from DEM contours | Yes (22 KB, real paths) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Generated data is fresh | `npm run data:check` | `terrain: OK`, `photos:exif: OK`, `photos:derive: OK`, `photos:build: OK` | ✓ PASS |
| Served images clean | `npm run guard:images` | `served-images: OK` | ✓ PASS |
| Full lint chain | `npm run lint` | all stages OK, ends `served-images: OK` | ✓ PASS |
| Types | `npx tsc --noEmit` | no output, exit 0 | ✓ PASS |
| Unit tests (run once) | `npx jest --silent` | 29 suites, 416 tests passed | ✓ PASS |
| Heightmap bit depth | PNG IHDR read | depth 16, colour type 0 | ✓ PASS |
| No GPS/XMP bytes in tracked images | `git ls-files -z \| xargs -0 grep -l -a -E "Exif\|GPSLatitude\|<x:xmpmeta"` | only `scripts/guards/__selftest__/` fixtures | ✓ PASS |
| No debt markers in phase files | grep `TBD\|FIXME\|XXX` over 95 changed source files | none | ✓ PASS |

`npm run build` and e2e/visual specs were not re-run here: the orchestrator's wave gates show build exit 0 and CI runs 40107844864, 40114812277, 40124210374 and 40127078488 green (the last twice on 88191d0).

### Probe Execution

SKIPPED. No `scripts/*/tests/probe-*.sh` files exist and no plan declares a probe.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
| ----------- | -------------- | ----------- | ------ | -------- |
| DATA-01 | 08-01, 08-04, 08-06 | swissALTIRegio -> 16-bit heightmaps (512/256) plus contour SVG, hashed | ✓ SATISFIED | Truth 1. |
| DATA-02 | 08-02, 08-08 | EXIF extraction into typed committed data, CI fails when stale | ✓ SATISFIED | Truth 3 (A1 caveat). |
| DATA-03 | 08-08, 08-10, 08-11 | EXIF dates, waterfall confirmed, altitudes, year tags, no near-duplicates | ✓ SATISFIED | Truth 4. |
| DATA-04 | 08-08, 08-10, 08-11, 08-12 | Film scan hand-placed, flagged approximate wherever shown | ✓ SATISFIED | Truth 4 and dashed footer tick (`data-tick="approximate"`). Forward risk IN-02. |
| DATA-05 | 08-02, 08-07, 08-09 | No public originals; resized, rotated, metadata-free; CI scan | ✓ SATISFIED | Truth 5. |
| DATA-06 | 08-02, 08-08 | Coordinates at 4 dp | ✓ SATISFIED | Truth 3; `Coord4` schema; no 5+ dp value found. |
| DATA-07 | 08-03 | Typed per-project highlights; numeric `riskScore` | ✓ SATISFIED | Truth 7. |
| DATA-08 | 08-07, 08-10 | Manifest-driven image paths | ✓ SATISFIED | Truth 6. |
| SHELL-04 | 08-06, 08-12, 08-13 | Footer map legend: contour art, scale bar, attribution | ✓ SATISFIED | Truth 2. |

All nine Phase 8 IDs in REQUIREMENTS.md (traceability table lines 187-197, all marked Complete) are claimed by at least one plan's `requirements:` frontmatter. No orphaned requirements. Plan 08-05 declares DSGN-06, which REQUIREMENTS.md maps to Phase 7; it is a Phase 7 requirement extended in this phase (v1 alias codemod, `accent-strong` token), not a Phase 8 ID, and nothing contradicts it.

### Anti-Patterns Found

None blocking. No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` in the 95 changed source files. Hardcoded-empty and stub scans on the footer, `ContourField`, bridge and generators found only real data flows.

### Code Review Findings, Classified Against the Current Data

`08-REVIEW.md` lists 18 findings. None breaks a must-have for the data that exists today.

| ID | Severity | Classification | Reasoning |
| -- | -------- | -------------- | --------- |
| CR-01 | critical | Accepted risk, not a gap | Git history at `287c2e9`/`347d8e1`/`8fa0991` holds the originals. Tim explicitly accepted this in 08-CONTEXT D-12 ("Tim accepts that exposure ... No history rewrite"). The ROADMAP criterion is about what the public site serves, which is verified. Wording follow-up: "never committed" in `.gitignore`, the guard header and `data-privacy.spec.ts` overstates D-09; reword when next touched. |
| WR-01 | warning | Latent, no current impact | A photo outside the 11 km extent would get a clamped DEM height and out-of-band UV. All four photos are inside (u in 0.46-0.83, v in 0.27-0.59). Fix before adding photos from another valley. |
| WR-02 | warning | Latent | `gpsOf` drops a fix lacking altitude. All current GPS photos have altitude. |
| WR-03 | warning | Latent | `offsetTimeOriginal` ignored; all current offsets are null and GPS-UTC drift check passes. |
| WR-04 | warning | Latent, no current impact | `formatExposureTime` is wrong only for 0.25-1 s exposures and for 0. Current values are 1/500, 1/160, 1/400 s; the film scan has none. Fix before a long-exposure photo is added. |
| WR-05 | warning | Tooling | Non-atomic `photos:derive` write; recoverable through git. |
| WR-06 | warning | Hardening gap | Guard does not cover raw/HEIF extensions and `public/images/landscapes/` ignore line was dropped. No such file exists now; guard is green. |
| WR-07 | warning | Docs | `scripts/README.md` omits `photos:build`; following it would fail lint, which is loud, not silent. |
| WR-08 | warning | Latent | Corrections could label a hand-typed position `exif`/exact. Current correction is `hand-placed` + approximate, and `photos.test.ts` rejects the wrong combination at the `Position` level. |
| IN-01..IN-09 | info | Advisory | IN-02 (legacy bridge drops `position.approximate`) matters only when a surface shows a photo position; the only such surface today is the footer, which reads `photos.ts` directly and renders the dashed tick. Revisit in Phases 9/10. IN-07 (demo command 4 copy) is the known open item with Tim. |

Recommendation: fold WR-01, WR-02, WR-04 and WR-08 into the first plan of Phase 9 or 10 that adds photo data or surfaces, and record IN-02 as an input to the Phase 10 photo-detail work. None needs a Phase 8 closure plan.

### Advisory Notes

**A1. Staleness scope of "CI fails when that data is stale".** In CI the originals are absent, so the sidecar-versus-original sha256 comparison is reported as skipped (a consequence of D-09, originals never committed). CI therefore catches: a malformed or over-precise sidecar, `photos.ts` not equal to what the sidecar plus corrections plus DEM would regenerate, derivatives not matching the sidecar's `sourceSha256`, and terrain assets not matching the source raster. It cannot catch an edited original whose sidecar was not re-extracted; that is detected only when Tim runs `npm run lint` locally with the originals present. This matches the plan's intent and DATA-02's wording, so it is not a gap, but worth knowing.

**A2. GPS altitude versus DEM height.** D-17 chose DEM heights over EXIF altitude. For img-0629 the difference is 47 m (EXIF 1714.9 m, DEM 1668 m), larger than the "9-25 m" in D-17, probably because that photo is taken in a gorge. Roadmap SC3 says annotation altitudes "agree with GPS"; the phase interpreted this (D-06, D-17, Tim's decision) as agreement with the DEM at the GPS position. The annotation for the waterfall prints 1,668 m. Tim made the call; flagging only so the Phase 9 altimeter wording is not surprised.

**A3. Test-count and carried items.** Jest 416 tests and the test-count ratchet (jest 416 / e2e 117 / total 533) hold. Carried to later phases and not Phase 8 scope: "1 hotspots" plural (Phase 10), Home 375 px overflow from a v1 card (Phase 9), `bg-ink hover:bg-ink` (Phase 9), demo command 4 explanation copy (open with Tim), legacy `-large`/`-thumb` and `lg/md/sm` variants still served (VERIFY-01, Phase 12).

**A4. Visual acceptance.** Tim accepted the footer baselines by committing them (88191d0, reply "pushed", no review notes) and the photos baselines the same way (c0f2418). That is acceptance by action, recorded honestly in the SUMMARYs; 08-UI-REVIEW.md scores 20/24 with no blockers.

### Human Verification Required

None for this phase. (The Firefox stroke check is carried as a deferred Phase 12 item above.)

### Gaps Summary

No gaps. Every roadmap success criterion and every requirement ID (DATA-01 to DATA-08, SHELL-04) is backed by committed code, generated data and passing guards that I re-ran or re-inspected in the codebase rather than taking from the SUMMARYs. The 17 open review findings are latent or advisory against the current four photos; CR-01 is an accepted, documented risk. The one unreported human observation (Firefox stroke weight) is cosmetic and is correctly routed to Phase 12's cross-browser pass.

---

_Verified: 2026-10-24_
_Verifier: Claude (gsd-verifier)_
