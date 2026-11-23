---
phase: 16-new-regions-alps-overview-data
plan: 11
subsystem: data
tags: [terrain, plates, fetch, bev, epsg-3035, retry, selftest, credit]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-10 TerrainSource union with the BEV ALS DTM / EPSG:3035 variant (tiles, doi, metadataUrl, EVRF2000-AT, EPSG:9274, credit, CC BY 4.0)"
provides:
  - "terrain:fetch (fetch-dem.mjs) with --plate, --extent, --force-home and --out; no --plate, or matterhorn without --force-home, exits 1 and writes nothing"
  - "terrain:fetch:bev (fetch-bev.mjs): one BEV ALS DTM tile by COG range reads through fromCustomClient with a bounded-retry client; overview level 3, bilinear 10 m cell centres, no nodata path"
  - "BEV credit constant: Tim's 'research-line' wording, verbatim"
  - "Selftest: four offline fetch: refusal cases"
affects: [16-12, 16-16, 18]

actuals:
  tokens: 10600
  tasks: 3
  commits: 2
plan_head_before: 85a98c2e5d95a3fd9f5254ed4a22dc2b00a30059
plan_head_after: 86549a7e5c7a3a321ef918812cacdc0d26044927

tech-stack:
  added: []
  patterns:
    - "Fetcher arguments are resolved into a target (plate, extent, directory) before the first request, so every refusal is offline and testable from the selftest"
    - "geotiff fromCustomClient with a BaseClient subclass that reads each body inside the retry, so a socket dropped mid-body is retried too; no global fetch patch"
    - "A refetch of a recorded plate reuses the extent in its source.json; a given --extent must equal it"

key-files:
  created:
    - scripts/terrain/fetch-bev.mjs
    - .planning/phases/16-new-regions-alps-overview-data/16-11-SUMMARY.md
  modified:
    - scripts/terrain/fetch-dem.mjs
    - scripts/guards/selftest.mjs
    - package.json

key-decisions:
  - "BEV credit (D-09, Tim's Task 2 reply 'Full line with DOI (Recommended)'): 'Terrain: ALS DTM, © BEV – Bundesamt für Eich- und Vermessungswesen, CC BY 4.0, modified (doi:10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c)', copied verbatim into fetch-bev.mjs's CREDIT"
  - "The retry goes through geotiff's fromCustomClient (a RetryClient), not a patched global fetch; 5xx and network errors retry, 4xx, a missing header or a range answered with 200 are final"
  - "Extent edges must lie on the 10 m grid (all four values multiples of 10), checked before the network; fetch-dem's pixel-alignment check against the COG stays as the second line"
  - "fetch-dem.mjs now parses its written record with SwissAltiRegioSource (the one-line narrowing 16-10 suggested); a recorded plate with a non-swissALTIRegio source is refused, and fetch-bev refuses the reverse"

requirements-completed: [DATA-13]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-14, 16-17, 16-18 also declare DATA-13)

coverage:
  - id: D1
    description: "terrain:fetch requires --plate; matterhorn also needs --force-home; a new plate needs a square --extent on the 10 m grid, at most 20,000 m; a recorded plate reuses its extent"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#fetch: terrain:fetch without --plate refuses and writes nothing"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#fetch: --plate matterhorn needs --force-home"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#fetch: a non-square extent is refused before any request"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tim chose the BEV credit wording at the blocking checkpoint; fetch-bev writes exactly that text with CC BY 4.0 and the licence URL"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "grep -cF \"$CREDIT_TEXT\" scripts/terrain/fetch-bev.mjs (1); the dry-run source.json's credit equals it"
        status: pass
    human_judgment: true
  - id: D3
    description: "terrain:fetch:bev reads one tile of edition 20250915 at overview level 3 with the scale from the full image, samples 10 m cell centres bilinearly, fails on nodata or out-of-range heights; the record carries EPSG:3035, EVRF2000-AT, EPSG:9274, edition 2025-09, DOI, metadata URL and the tile's URL, length and Last-Modified"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "dry run into the scratchpad (Saalfelden Option A extent): OK, TerrainSource-parsed record; cross-check against 1 m block means: 0.22 m mean difference"
        status: pass
    human_judgment: false
  - id: D4
    description: "Bounded retry: 5 attempts with 500 ms x attempt backoff; the final failure names the tile and nothing is written"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "scratch preload making every fetch fail: exit 1, 'BEV tile ALS_DTM_CRS3035RES50000mN2700000E4500000.tif failed after 5 attempts', no out directory; scratch preload dropping every 4th range request: 16 retries recovered, PNG byte-identical"
        status: pass
    human_judgment: false
  - id: D5
    description: "An extent outside one BEV tile fails before any request, naming the tiles"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#fetch: terrain:fetch:bev refuses an extent outside one BEV tile"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-11-23
---

# Phase 16 Plan 11: Plate fetchers (terrain:fetch --plate and terrain:fetch:bev) Summary

**`terrain:fetch` can no longer rewrite the Matterhorn source by accident. It needs `--plate`, Matterhorn also needs `--force-home`, and any other plate writes its own folder from a recorded square extent. The new `terrain:fetch:bev` reads one BEV ALS DTM tile by COG range reads through a retrying geotiff client. It samples 10 m cell centres from overview level 3 and writes a record carrying EVRF2000-AT / EPSG:9274, edition 2025-09 and Tim's credit line verbatim. A dry run of the Saalfelden window into the scratchpad succeeded, and nothing under `data/` changed.**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-11-23T10:48:37Z
- **Completed:** 2026-11-23T11:01Z
- **Tasks:** 3 (Task 2 was answered before dispatch)
- **Files modified:** 4

## Task 2: Tim's decision (BEV credit wording)

The orchestrator asked the checkpoint question before dispatch (AskUserQuestion, 2026-11-23, this session). It is recorded here verbatim.

- **Question:** "16-11 BEV credit, asked early (it's copied verbatim into fetch-bev.mjs and the Saalfelden plate's source.json; Phase 18 shows it on the sheet margin and /sources). BEV's record says only \"Standardlizenz CC-BY-4.0\" with no preferred wording. CC BY 4.0 needs the creator, the licence and a note that the data was modified (the plate is resampled and contoured). The DOI resolves to BEV's geonetwork record today. Which credit line?"
- **Tim's literal reply:** "Full line with DOI (Recommended)"
- **Option id:** `research-line`
- **Selected option description:** "\"Terrain: ALS DTM, © BEV – Bundesamt für Eich- und Vermessungswesen, CC BY 4.0, modified (doi:10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c)\". Same pattern as the swissALTIRegio line; Phase 18 may show a short form at 375 px."
- **Text copied into `CREDIT`:** `Terrain: ALS DTM, © BEV – Bundesamt für Eich- und Vermessungswesen, CC BY 4.0, modified (doi:10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c)`. The dash after "BEV" is an en dash, U+2013; `od -c` shows the bytes `342 200 223`.
- **Orchestrator check before asking:** `https://doi.org/10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c` returned a 302 to `https://data.bev.gv.at/geonetwork/srv/metadata/1d2d42c2-10dc-4be6-9917-8784d1cfe37c` on 2026-11-23. That URL is the record's `metadataUrl`.

## Accomplishments

- **`scripts/terrain/fetch-dem.mjs` (`terrain:fetch`)**
  - The "takes no arguments" check is replaced by `resolveTarget`, which reads `--plate <id>`, `--extent W,S,E,N`, `--force-home` and `--out <dir>`. It runs before the STAC request, so every refusal below happens offline:
    - **No `--plate`:** `terrain:fetch: needs --plate <id> (the Matterhorn source is pinned by Phase 15 D-15; use --plate matterhorn --force-home to refetch it)`, then `terrain:fetch: nothing written`.
    - **Plate id:** the id must parse as a `PlateId`, so `overview`, upper case and the other stems are refused.
    - **`matterhorn` without `--force-home`:** refused. With it, the run uses the recorded D-14 extent (a different `--extent` is refused) and writes `data/terrain/source/`.
    - **`--force-home` on any other plate:** refused.
    - **Another plate:** writes `data/terrain/plates/<id>/`, or `--out`.
      - With a recorded `source.json`, it reuses that extent. A given `--extent` must equal it, and a non-swissALTIRegio record is refused.
      - Without a recorded `source.json`, `--extent` is required.
    - **Extent rules:** four integers, west < east and south < north, square, at most 20,000 m a side, and every edge on the 10 m grid.
    - **Anything else:** an unknown argument, a flag without a value or a repeated flag is refused.
  - The pixel window, nodata rule, PNG round trip and sha256 are unchanged. The record is now parsed with `SwissAltiRegioSource`.
  - The header documents both usage forms.
- **`scripts/terrain/fetch-bev.mjs` (`terrain:fetch:bev`, new)**
  - **Arguments:** the same parser without `--force-home`. `matterhorn` is refused as the swissALTIRegio home plate. An extent must fit inside one 50 km BEV tile, otherwise it fails naming every tile it needs (D-28: no multi-tile path).
  - **HEAD request:** records the tile URL, Content-Length and Last-Modified, and requires `Accept-Ranges: bytes`.
  - **COG reads:** the COG opens through `fromCustomClient(new RetryClient(url, tile))`. Every range request, body included, runs inside `withRetry`: 5 attempts with 500 ms × attempt backoff. Network errors and 5xx responses are retried. A 4xx, a missing header, or a range request answered without 206 is final (a 200 would be the whole 4.4 GB tile, so its body is cancelled, never read). The last failure throws `BEV tile <name> failed after 5 attempts: <reason>`.
  - **Image checks:** image 0 must be 1 m, PixelIsArea, EPSG:3035 and single-band, and the extent must lie inside it. Image 3 is read with the scale taken from the full image (`full width / overview width`).
  - **Window and sampling:** the window holds every cell centre's four bilinear neighbours and fails near a tile edge. Any value at or below -9000, or outside -100..6000 m, fails. Cell centres are sampled bilinearly into decimetres.
  - **Output:** a grey16 PNG with a proved lossless round trip, hashed with sha256. The record is parsed with `TerrainSource` before anything is written. It holds product `BEV ALS DTM`, the tile list, the DOI, `metadataUrl`, edition `2025-09` with an `editionSource` naming the Stichtag 15.09.2025 as a creation date, `EPSG:3035`, `EVRF2000-AT` and `EPSG:9274`, the resampling literal, `CREDIT`, `CC BY 4.0`, the licence URL, the extent, `cellM` 10, the size, `heightScale` 0.1, the file name and the sha256.
  - **Constants:** `BEV_EDITION_DIR = '20250915'` and `CREDIT`.
- **`package.json`:** `"terrain:fetch:bev": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/terrain/fetch-bev.mjs"`. It is a script entry only; nothing was installed.
- **`scripts/guards/selftest.mjs`:** four `fetch:` cases, each exiting during argument parsing.
  - The two repo-level cases snapshot `data/terrain` and assert it is byte-equal afterwards.
  - The two `--out` cases assert that the temp directory stays empty and that no STAC or BEV request was reached.

## Task Commits

1. **Task 1: terrain:fetch --plate end to end (tracer).** `2e07e75` (feat). Tracer gate: auto mode is off, `human_verify_mode` is end-of-phase and `<verify>` is automated only. Before Task 3 I re-ran both verify steps end to end: grep count 3, and `git diff --quiet 56d62af -- data/terrain/source` exited 0. No checkpoint was needed.
2. **Task 2: BEV credit wording.** `checkpoint:decision`, `gate="blocking-human"`. Tim answered it before dispatch (above), so this task has no commit.
3. **Task 3: terrain:fetch:bev with the bounded retry and the chosen credit.** `86549a7` (feat).

## Dry run (Task 3)

Command: `npm run terrain:fetch:bev -- --plate saalfelden --extent 4529000,2701000,4541000,2713000 --out <scratchpad>/bev-dry`. This is the D-28 Option A extent, which is a plate extent, not a photo position.

| Measure | Value |
|---|---|
| Tile | `ALS_DTM_CRS3035RES50000mN2700000E4500000.tif`, 4,449,243,099 B, Last-Modified `Wed, 02 Sep 2026 20:24:32 GMT` |
| Retries | 0 |
| Read time | 1,273 ms (open, image 0, image 3 and the window read); 2.4 s wall time for the whole command |
| Overview | level 3, scale 8.0002 m, window 1500 × 1500 overview pixels |
| PNG | 1200 × 1200, 1,477,634 bytes, round trip lossless |
| Height range | 676.1..2501.1 m (plate minimum and maximum, EVRF2000-AT) |
| Record | parsed as the BEV ALS DTM variant; credit equals Tim's wording byte for byte |

`git status --porcelain -- data` was empty afterwards, and `git diff --quiet 56d62af -- data/terrain/source` exited 0.

Extra checks (scratchpad only, no repository change):

- **Georeferencing cross-check.** For 16 cells across the plate, the PNG value was compared with the mean of the cell's 10 × 10 block of the full 1 m image. The mean absolute difference was 0.22 m at the plate's own alignment, against 2.19–2.50 m with a one-cell shift in any direction. This confirms the overview scale and the half-metre origin handling.
- **Retry, all requests fail.** A `--import` preload made every fetch throw `fetch failed (other side closed)`. The run exited 1 with `BEV tile ALS_DTM_CRS3035RES50000mN2700000E4500000.tif failed after 5 attempts: fetch failed (other side closed (scratch))` and `nothing written`. The run took 5.25 s, which matches the 0.5 + 1 + 1.5 + 2 s backoff, and the `--out` directory was never created.
- **Retry, flaky requests.** A preload dropped every fourth range request. The run reported 16 retries and finished OK in 6.2 s. Its PNG is byte-identical to the clean dry run's.

## Verification

- `npm run guard:selftest` reported `selftest: 282/282 cases passed` at the start (16-10), 285/285 after Task 1 and `selftest: 286/286 cases passed` after Task 3.
  - `grep -c "^PASS fetch: "` returned 4.
  - The Task 1 grep for the three named cases returned 3.
- `npm run lint`: exit 0 after Task 1 and after Task 3. It includes `data:check` and the selftest.
- `npm run type-check`: exit 0.
- Prettier is clean on `fetch-dem.mjs` and `fetch-bev.mjs`. `selftest.mjs` was not Prettier-clean at HEAD either, and it was left in its existing style.
- Acceptance greps:
  - `--plate` in `fetch-dem.mjs`: 1 or more.
  - `terrain:fetch:bev` in `package.json`: 1.
  - `EVRF2000-AT` in `fetch-bev.mjs`: 2.
  - `EPSG:9274` in `fetch-bev.mjs`: 2.
  - `CREDIT_TEXT='Terrain: ALS DTM, © BEV – Bundesamt für Eich- und Vermessungswesen, CC BY 4.0, modified (doi:10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c)'; grep -cF "$CREDIT_TEXT" scripts/terrain/fetch-bev.mjs` printed 1.
- I ran these additional refusals by hand; each exited 1 with `nothing written` and made no request:
  - `terrain:fetch`: a bad id, `overview`, `--force-home` on another plate, a new plate without `--extent`, an off-grid edge, a 21 km side, three numbers, a Matterhorn `--extent` that differs from D-14, an unknown flag, and a flag without a value.
  - `terrain:fetch:bev`: no `--plate`, `matterhorn`, a new plate without `--extent`, a non-square extent, and `--force-home`.
- I never ran a no-flag `npm run terrain:fetch` by hand. The selftest case covers that refusal offline.

## D-25 scan

The scan ran from the scratchpad copy `d25-scan-1609.mjs` (16-01 Task 2's procedure with the EPSG:3035 kinds). It prints booleans and file names only.

- **Baseline:** run after both task commits and before this SUMMARY existed. Its output was byte-identical to 16-10's final run (`16-10-d25-run1.txt`), and no line named a 16-11 file.
- **Re-run:** after this SUMMARY was written and before it was committed. The result is in the Self-Check below.

This plan reads no originals and records no photo-derived value. The extents in this SUMMARY are the D-28 plate extent and a synthetic two-tile test extent. The heights are the plate's terrain minimum and maximum.

## Decisions Made

- **Credit:** Tim's `research-line` wording, verbatim (D-09).
- **Retry:** goes through geotiff's `fromCustomClient`, as the plan preferred, so no global `fetch` is patched. The body is read inside the retry, because Pitfall 3's socket drops can happen mid-body.
- **Edges on the 10 m grid** are an argument rule for both fetchers, so the plan's "whole 10 m cells" is checked offline.
- **`--out` and recorded extents:** `--out` overrides only the write directory. A recorded plate's extent is still read from `data/terrain/plates/<id>/source.json` in the repository.

## Deviations from Plan

### Auto-fixed / in-scope additions

**1. [Rule 2 - Correctness] `fetch-dem.mjs` parses its record with `SwissAltiRegioSource`**
- **Found during:** Task 1 (16-10's executor flagged it as a one-line hardening)
- **Change:** `TerrainSource.parse` became `SwissAltiRegioSource.parse` for the written record. The recorded-plate read still parses the union, so that it can refuse a BEV record by name.
- **Commit:** 2e07e75

**2. [Rule 2 - Correctness] A range request answered with 200 is refused without reading its body**
- **Found during:** Task 3
- **Issue:** `RetryClient` reads each body inside the retry, so that a socket dropped mid-body is retried. geotiff only rejects a 200 after the client returns. A server that ignored the range would therefore have made the client download the whole 4.4 GB tile first.
- **Fix:** `RetryClient` cancels the body and throws a final error.
- **Commit:** 86549a7

**3. Refusals beyond the plan's list**
- **Found during:** Tasks 1 and 3
- **Change:** both fetchers also refuse an unknown or repeated flag, `--force-home` on a non-home plate, and a plate whose recorded source is the other product. fetch-bev also refuses `matterhorn`.
- **Commits:** 2e07e75, 86549a7

**Total deviations:** 2 Rule 2 fixes and 1 in-task addition. **Impact:** no change to generated output. Matterhorn's source and every generated file are byte-identical.

## Issues Encountered

- The BEV tile's Last-Modified is `Wed, 02 Sep 2026`, later than the edition's 2026-05-19 publication date in RESEARCH. The fetcher records what the server reports. 16-12 should expect this value, or note it if it changes.
- `scripts/terrain/build-trails.mjs` and `fetch-trails.mjs` still parse Matterhorn's source through the `TerrainSource` union. They were outside this plan's files and were left unchanged.

## Next Phase Readiness

- **16-12:** can run `npm run terrain:fetch:bev -- --plate saalfelden --extent 4529000,2701000,4541000,2713000` to write `data/terrain/plates/saalfelden/{dem-10m.png, source.json}`. The dry run shows a hole-free window, about 1.48 MB, 676–2501 m.
- **16-16:** can run `npm run terrain:fetch -- --plate <id> --extent W,S,E,N` for a new swissALTIRegio plate.
- **Phase 18:** reads `credit`, `licence` and `licenceUrl` from the BEV record.

## Self-Check: PASSED

- Files: fetch-bev.mjs, fetch-dem.mjs and this SUMMARY were found.
- Commits: 2e07e75 and 86549a7 are ancestors of HEAD.
- D-25 re-run with this SUMMARY on disk: the output was byte-identical to the baseline taken without it (and to 16-10's final run), and no line named a 16-11 file.
