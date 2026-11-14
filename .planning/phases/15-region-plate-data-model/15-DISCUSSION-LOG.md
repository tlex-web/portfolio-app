# Phase 15: Region & Plate Data Model - Discussion Log

> **Audit trail only.** Do not use this file as input to planning, research or execution agents.
> The decisions are in CONTEXT.md; this log keeps the alternatives that were considered.

**Date:** 2026-11-14
**Phase:** 15-region-plate-data-model
**Areas discussed:** Region & country data, Home waypoint list, Plate registry & names, URL helper proof, Telemetry guard breadth, Jest typing (GUARD-10), Carried review findings, Branch & push approvals

---

## Region & country data

| Option | Description | Selected |
|--------|-------------|----------|
| Per-photo map | New `data/photos/photo-map.json` { id: { region, country } }; the build fails when a photo has no entry or an entry has no photo | ✓ |
| Region lists its photos | `regions.json` with `photos: [ids]` per region; the build fails when a photo is in no region or in two | |
| Extend corrections.json | Add region and country to the existing overrides file | |

**User's choice:** Per-photo map.
**Notes:** The option text called this file "the explicit photo id map from the scope notes". That was wrong: the research uses that phrase for a source-file → id map. Claude corrected it at the end of the discussion and asked a follow-up (see "Id map" below).

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit per photo | ISO code on every photo, no default (protects PHOTO-08's LV95 rule) | ✓ |
| Region default + override | Region sets the country; a photo across the border overrides it | |

| Option | Description | Selected |
|--------|-------------|----------|
| zermatt + matterhorn | Region `zermatt` (name Zermatt), plate `matterhorn` | ✓ |
| zermatt for both | One id for the region and its plate | |
| zermatt-matterhorn | Both use the sheet-title form | |

| Option | Description | Selected |
|--------|-------------|----------|
| Build fails | A photo outside its region's plate fails, so every photo gets a pin and a DEM height | ✓ |
| Allowed without a pin | No plate pin; the altitude is typed by hand | |

**Follow-up, "Id map" (asked after the correction):**

| Option | Description | Selected |
|--------|-------------|----------|
| Same file | `photo-map.json` holds `file`, `region` and `country` per id; extract-exif assigns ids from it | ✓ |
| Separate id map | `id-map.json` (file → id) for stage 1, `photo-map.json` (region and country) for stage 2 | |

---

## Home waypoint list

| Option | Description | Selected |
|--------|-------------|----------|
| Photo ids | `img-0605` etc., with the slug as a comment | ✓ |
| Slugs | `matterhorn-from-zermatt` etc. | |

| Option | Description | Selected |
|--------|-------------|----------|
| DEM sort | The list is membership only; the order stays DEM ascending, ties broken by id | ✓ |
| Written order, checked | The list is written bottom to top; the build fails if it doesn't ascend | |

| Option | Description | Selected |
|--------|-------------|----------|
| Lowest listed waypoint | 1,617 m, derived from the Home list | ✓ |
| Pinned constant | 1,617 hand-typed in Home's config | |

| Option | Description | Selected |
|--------|-------------|----------|
| Exactly 4, all Zermatt | The build fails unless there are four ids, all in zermatt and on matterhorn | ✓ |
| Any count, Zermatt only | Swaps and additions are one-line changes | |

**Trail sign** (asked during the URL helper area, after the scout found `TrailSigns.tsx:36` counting every photo):

| Option | Description | Selected |
|--------|-------------|----------|
| Home's four | It counts the Home list and stays "4 waypoints"; Phase 18 may reword it | ✓ |
| The whole album | It counts every photo, so Home changes in Phase 16 | |

---

## Plate registry & names

| Option | Description | Selected |
|--------|-------------|----------|
| Keep today's names | The Matterhorn has an empty prefix; later plates use `<plate>-` | ✓ |
| Prefix every plate | `matterhorn-contours-hero.<hash>.svg`; same bytes, new URLs | |

| Option | Description | Selected |
|--------|-------------|----------|
| Plates get map set only | (As first worded: new plates build the map LOD plus the hillshade) | ✓ (premise wrong) |
| Every plate builds everything | One output set for all plates | |

**Notes:** The first wording rested on Claude's wrong claim that MapSheet reads the `map` LOD. MapSheet, PosterSheet, EdgeArt and the OG template read `hero`, and nothing reads `map` (research F11). Claude corrected this and asked again:

| Option | Description | Selected |
|--------|-------------|----------|
| hero + strip | New 2D plates build hero and strip contours plus the hillshade; no map LOD, no heightmaps (~0.55 MB per plate) | ✓ |
| hero only | Strip is added in Phase 18 if the region sheet margin needs it | |

| Option | Description | Selected |
|--------|-------------|----------|
| Synthetic DEM, temp root | A tiny generated DEM; the builder runs with `--root` on a temp copy (G5/G6 pattern) | ✓ |
| Small real window | Commit a small real swissALTIRegio window now | |

---

## URL helper proof

| Option | Description | Selected |
|--------|-------------|----------|
| Literal in tests | Tests keep `/photos/${slug}` as an independent check; one unit test pins photoHref | ✓ |
| Helper everywhere | Tests import photoHref | |
| Jest helper, e2e literal | Mixed | |

| Option | Description | Selected |
|--------|-------------|----------|
| Jest source scan | Scans app/, components/, lib/ and proxy.ts for hand-built photo paths | ✓ |
| Guard script + selftest | A new lint guard rule with fixtures | |

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 17 | regionHref arrives with the region path | ✓ |
| Stub now | A provisional path, unused | |

---

## Telemetry guard breadth

| Option | Description | Selected |
|--------|-------------|----------|
| Roadmap set + close kin | SRT, LRF, GPX, KML, KMZ, LRV, THM, standalone .xmp, NMEA, IGC, FIT, TCX; GeoJSON allowed | ✓ |
| Roadmap set only | SRT, LRF, GPX, KML | |
| Broad, incl. GeoJSON/CSV | Also bans GeoJSON and CSV | |

**Follow-up:** add `.dat` (DJI flight logs, on the research's release checklist)? **Add .dat** ✓ (the alternative was to leave it out).

| Option | Description | Selected |
|--------|-------------|----------|
| Repo + all of public/ | Tracked plus untracked-not-ignored files, plus a full walk of public/ including ignored files | ✓ |
| Also the build output | Also scan .next/ after the build | |

| Option | Description | Selected |
|--------|-------------|----------|
| Ignore + guard | `.gitignore` lists the same types, and the guard catches `-f` and public/ | ✓ |
| Guard only | A misplaced file shows up in git status and fails lint | |

---

## Jest typing (GUARD-10)

| Option | Description | Selected |
|--------|-------------|----------|
| Local d.ts from @jest/globals | One declaration file; @jest/globals becomes a direct devDependency | ✓ |
| @jest/globals imports | An explicit import in all 105 test files | |
| Vet @types/jest | Tim vets the DefinitelyTyped package | |

| Option | Description | Selected |
|--------|-------------|----------|
| Three configs | App (unchanged), Jest and e2e; type-check runs all three | ✓ |
| One config | Drop the excludes in tsconfig.json | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fix; @ts-expect-error for bad input | A reason is required; no `any` casts or @ts-ignore | ✓ |
| Zero suppressions | Bad input goes through `unknown` or JSON | |

| Option | Description | Selected |
|--------|-------------|----------|
| Static scan in lint | `test-count.mjs --scan-only` as `guard:tests:scan` in lint | ✓ |
| Pre-push hook | A git hook (husky or a manual install) | |
| Leave as is | CI only | |

---

## Carried review findings

| Option | Description | Selected |
|--------|-------------|----------|
| Fix 8, hand 14 IN-04 to 18 | Fix 13 IN-01..03, 14 IN-01/02/03/05/06 and the README count; IN-04 retires with the Carousel | ✓ |
| Fix all 9 now | Extract the shared STEP module now | |
| Triage each with me | A disposition table at one checkpoint | |

---

## Branch & push approvals

| Option | Description | Selected |
|--------|-------------|----------|
| Stack on d29ea9a | The Phase 14 tip, while #148 is open | ✓ |
| Wait for #148, cut from main | Start after the merge | |

| Option | Description | Selected |
|--------|-------------|----------|
| Standing approval, ci/15-* | Plain and fast-forward pushes, CI read-back; no baseline dispatch, force, phase branch, main or PNGs | ✓ |
| Ask each time | As in Phase 14 | |
| Ship PR is the proof | No mid-phase pushes | |

---

## Claude's Discretion

- The module layout (`lib/photos/routes.ts`, the view-model split, the slim route list for the proxy).
- The shape of the generated terrain module and the per-plate source layout.
- The `SheetMargin` extraction and `ContourField(plate, lod)`, both zero-diff.
- Named test fixtures; the asset-root reconciliation test; the per-plate budget test.
- When to widen the `PhotoId` regex; an `Elevation.product` field; a closed-sidecar-schema test.
- The country display-name lookup; `.gitignore` case handling; where the Playwright configs live.

## Deferred Ideas

- 14 IN-04 goes to Phase 18; Phase 18 may reword the trail sign; regionHref goes to Phase 17; the unused Matterhorn `map` LOD is left in place.
