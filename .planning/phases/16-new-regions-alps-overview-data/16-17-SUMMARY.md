---
phase: 16-new-regions-alps-overview-data
plan: 17
subsystem: photos-data
tags: [photos, regions, ortler, exif, derivatives, editorial, overview, privacy]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-14 the ingest pattern, region schema (country + 1-3 facts) and plateSourceFiles() in the selftest; 16-15 the overview build with one outline per region; 16-16 the ortler plate and Tim's two Ortler files in incoming/"
provides:
  - "regions.json: ortler (Ortler, IT, plate ortler) with the one fact Tim kept; ids ortler, saalfelden, zermatt"
  - "sam-20160717-120906 and sam-20160717-124904 in the photo map, sidecar, photo facts and image manifest (3dp, ground, IT), 18 metadata-free hashed derivatives, approved copy"
  - "overview.ts: three outlines in registry order (ortler, saalfelden, zermatt)"
  - "photo-map.test pins the ortler region and Tim's 16-17 records; editorial.test pins the two slugs"
affects: [16-18, 17-routes-seo, 18]

actuals:
  tokens: 3990     # chars/4 over the text diff (15,944 chars, public/ excluded); the 18 binary derivatives are not counted
  tasks: 3         # Task 1 tracer (scratchpad only), Task 2 Tim's decision, Task 3 ingest
  commits: 1       # measured: git rev-list --count 32079dc..HEAD at SUMMARY write
plan_head_before: 32079dc4503c866c263b01917e9281d5d7e085c2
plan_head_after: eb4bb1b8c48d09a7dc2e1efea1dcce691a9cd484

tech-stack:
  added: []
  patterns:
    - "Dry run before a one-way decision: a temp root under os.tmpdir() with the selftest's inputs, every original and provisional 2dp records; scripts' stdout is captured and only booleans are printed; sharp.cache(false) so Windows releases the temp originals"

key-files:
  created:
    - public/images/photos/sam-20160717-120906-*.{avif,webp,jpg} (9 files)
    - public/images/photos/sam-20160717-124904-*.{avif,webp,jpg} (9 files)
  modified:
    - data/regions/regions.json
    - data/photos/photo-map.json
    - data/photos/exif-sidecar.json
    - data/generated/photos.ts
    - data/generated/image-manifest.ts
    - data/generated/overview.ts
    - data/photos/editorial.ts
    - data/__tests__/photo-map.test.ts
    - data/__tests__/editorial.test.ts
    - .planning/phases/16-new-regions-alps-overview-data/deferred-items.md

key-decisions:
  - "D-02 (Tim): both Ortler photos at 3dp, kind ground, country IT, region ortler, ids sam-20160717-120906 and sam-20160717-124904"
  - "Location (Tim): 'Ortler Alps, Italy' for both"
  - "Region facts (Tim): one fact only, 'The Ortler is the highest mountain in South Tyrol and the main peak of the Ortler Alps.' (https://en.wikipedia.org/wiki/Ortler)"
  - "Copy (Tim): approved as drafted, verbatim, no annotations"

requirements-completed: [DATA-13, DATA-14, DATA-12]   # copied from the plan; REQUIREMENTS.md ticking follows the shared-ID gate (16-18 also declares all three, so they stay Pending until it completes)

coverage:
  - id: D1
    description: "D-02: Tim chose precision, kind, id and country at a blocking checkpoint before any Ortler record was written; his reply is recorded verbatim"
    requirement: DATA-14
    verification:
      - kind: other
        ref: "16-17-SUMMARY.md#tims-reply-task-2-verbatim"
        status: pass
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#D-02: every 16-17 Ortler photo's record is exactly Tim's recorded file, region, country, precision and kind"
        status: pass
    human_judgment: true
  - id: D2
    description: "Dry run in a temp root proved both files pass both stages on the ortler plate at 2dp, booleans only, repository untouched"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "scratchpad 16-17-dryrun.mjs (two runs, identical booleans); Task 1 repo-clean verify exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "DATA-13: both photos in the sidecar, photo facts and manifest with metadata-free hashed derivatives; inside plate ortler"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "npm run data:check && npm run guard:images (served-images: OK); scratchpad 16-17-booleans.mjs (inside plate ortler: yes for both)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-06 / D-07 / D-13: regions.json holds ortler (Ortler, IT, plate ortler) with Tim's fact; ids sorted"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#D-03, 16 D-08 / D-13: the registry holds ortler, saalfelden and zermatt, each with its country, plate and approved facts"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-17: overview.ts holds three outlines in registry order; terrain:build --check prints 'terrain: OK'"
    requirement: DATA-12
    verification:
      - kind: unit
        ref: "data/__tests__/overview.test.ts#holds one outline per region, in regions.json order, with the region's plate"
        status: pass
      - kind: other
        ref: "npm run terrain:build -- --check (terrain: OK); '\"region\":' count in overview.ts = 3"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-15: route sets at four, no Ortler id or slug in a client chunk, client JS within the 16-01 base + 4,096 B"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts, audit-routes.test.ts, region-series.test.ts, client-graph.test.ts (61 passed)"
        status: pass
      - kind: other
        ref: "rm -rf .next/static && npm run build; 1,851,685 B in 24 files; 0 chunk files with an Ortler id, slug or 'Ortler Alps'"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-11-23
---

# Phase 16 Plan 17: Ortler Photo Ingest Summary

**The two Ortler photos are now committed data with exactly Tim's choices: both at 3dp as ground photos in Italy, ids `sam-20160717-120906` and `sam-20160717-124904`, region `ortler`, with his approved copy under "Ortler Alps, Italy". The region registry gained `ortler` (IT, plate ortler) with the one fact he kept, and the Alps overview now draws three outlines. The light table, every route set and the client JS are unchanged.**

## Performance

- **Duration:** about 14 min of work: Task 1 from 2026-11-23T13:24:29Z to 13:28:47Z, Task 3 from 13:31:41Z to about 13:41Z. The wait for Tim's reply is not counted.
- **Tasks:** 3 (1 tracer, 1 blocking-human decision checkpoint, 1 auto)
- **Files modified:** 10 text files plus 18 derivatives

## Tim's reply (Task 2, verbatim)

Tim answered four AskUserQuestion questions on 2026-11-23, relayed by the orchestrator. Each question and his literal selection are quoted. He chose no "Other" answer, so the values named in the question text stand as he saw them.

1. **Q (Precision):** "What precision should the two Ortler photos get? Both are Samsung S7 shots from 17 Jul 2016 (12:09 and 12:49), with ids sam-20160717-120906 and sam-20160717-124904, kind ground, country IT. Their GPS has no altitude and no GPS time, so they look like Lightroom map pins rather than phone fixes. Pick Other for different per-photo values, ids or country."
   **A:** "Both 3dp (Recommended)"
2. **Q (Location):** "Which location line should both Ortler photos use? Existing entries use 'Zermatt, Switzerland' and 'Saalfelden, Austria'."
   **A:** "Ortler Alps, Italy (Recommended)"
3. **Q (Facts, multi-select):** "Which Ortler region facts go into regions.json? Pick 1 to 3, and at most one of the two Stelvio park facts. Each was checked on 2026-11-23 against en.wikipedia plus de.wikipedia or stelviopark.it. None states a summit height."
   **A:** "Highest in South Tyrol". Only that one; he did not pick the other three. The option's text was: "The Ortler is the highest mountain in South Tyrol and the main peak of the Ortler Alps." Source: en.wikipedia Ortler, cross-checked on de.wikipedia.
4. **Q (Copy):** "Do you approve the drafted copy for the two Ortler photos? Claude wrote the stories: 'a summer walk', 'crouched low' and 'the view opened up' are guesses from the images, and 'larch and pine' in the alt text names the tree species. Check they're true. Pick Other to type your own edits."
   **A:** "Copy approved". The alternative he did not choose was "Plainer stories".

Resulting values, applied exactly:

| Original (moved from `incoming/` to the top level) | id | region | country | precision | kind |
|---|---|---|---|---|---|
| `20160717_120906-Topaz-Sharpen-Strong-Denoise-2.jpg` | `sam-20160717-120906` | `ortler` | IT | 3dp | ground |
| `20160717_124904-Topaz-Sharpen-Auto-Denoise-2.jpg` | `sam-20160717-124904` | `ortler` | IT | 3dp | ground |

Tim left no Ortler file out, so nothing went to `not-in-series/`.

### Approved copy (committed verbatim, no annotations)

**sam-20160717-120906**
- slug: `meadow-stream-below-the-peaks`
- title: Meadow stream below the peaks
- alt: A small stream runs through long, sunlit grass towards a dark conifer forest, with a snow-streaked rock massif and white cloud above under a deep blue-green sky
- location: Ortler Alps, Italy
- story: I took this with my phone in July 2016, on a summer walk in the Ortler Alps. I crouched low by a small stream so it would lead up through the meadow to the peaks.
- subjectTags: landscape, stream, mountains

**sam-20160717-124904**
- slug: `forested-valley-below-the-peaks`
- title: Forested valley below the peaks
- alt: A long rock massif streaked with snow and pale scree rises above dark larch and pine forest, with green meadows and a small village in the valley below a blue sky with white cloud
- location: Ortler Alps, Italy
- story: Forty minutes later the view opened up across the whole valley. The forest ran up to the pale scree and the snow-streaked rock above it.
- subjectTags: landscape, valley, forest

### ortler region fact

"The Ortler is the highest mountain in South Tyrol and the main peak of the Ortler Alps." (https://en.wikipedia.org/wiki/Ortler). The executor fetched the page on 2026-11-23. Its lead reads "It is the main peak of the Ortler Range. It is the highest point of … South Tyrol in Italy". de.wikipedia (Ortler) agrees: "die höchste Erhebung der italienischen Provinz Südtirol … Hauptgipfel der Ortler-Alpen". The en page carries a "More citations needed" banner, which is why the second page was checked.

## Task 1: dry run and packet (booleans only)

The dry run used a temp root under `%TEMP%`, which was deleted afterwards.
- **Inputs:** every `PHOTO_DATA_INPUTS` entry and the three registered plate sources (14 files), the 9 top-level originals and the 2 Ortler originals.
- **Every input present before the first run:** yes.
- **Provisional data:** an `ortler` region (IT, plate ortler, one placeholder fact). Both files were set to **2dp** with kind `ground`, because Make is samsung, not DJI.
- **Stages:** `extract-exif.mjs --root` and `--check`, then `build-photo-data.mjs --root` and `--check`. All four exited 0 in each of the two runs.

| Ortler file | both stages passed | uv in plate |
|---|---|---|
| `20160717_120906-Topaz-Sharpen-Strong-Denoise-2.jpg` | yes | yes |
| `20160717_124904-Topaz-Sharpen-Auto-Denoise-2.jpg` | yes | yes |

The existing 9 sidecar entries and photo facts came out byte-identical to the repository's. The packet, with booleans, camera facts, two 1,024 px metadata-free previews, drafts and sourced facts, stayed in the scratchpad: `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a8c6d696-782b-4825-b5f2-ab644ba1fc62/scratchpad/16-17-packet/16-17-decision-packet.md`. The repository was untouched (Task 1 verify exit 0).

Camera facts that informed the choice:
- Both files are SM-G930F (Galaxy S7) shots, re-exported from Lightroom 10.0. The 12:09 file is a 2x Topaz upscale (6048 x 8064).
- DateTimeOriginal matches each file name.
- Neither file has an OffsetTimeOriginal, a GPS altitude, a GPS time or a GPS date. The GPS block holds only latitude, longitude and the version id, which is why the question called them likely Lightroom map pins.
- Country IT was confirmed with public anchors only: the whole ortler plate lies east of the CH-IT border (Dreisprachenspitze and Piz Umbrail).

## Task 3: per-photo result (booleans only)

`16-17-booleans.mjs` is a copy of 16-14's check with the Ortler ids. It ran in the scratchpad and printed ids and booleans only.

| id | precision / kind (Tim) | committed decimals within precision | altM null (coarse) | groundM present | inside plate |
|---|---|---|---|---|---|
| sam-20160717-120906 | 3dp / ground | yes | yes | yes | inside plate ortler: yes |
| sam-20160717-124904 | 3dp / ground | yes | yes | yes | inside plate ortler: yes |

- **"Inside plate":** both the generated uv and the uv recomputed through `toGrid` and `gridToUv` on the ortler source extent lie in [0, 1].
- **Coordinate precision:** no lat/lon with 5+ decimals appears in the sidecar or `photos.ts`.
- **Generated facts:**
  - region `ortler`, country IT, position precision 3dp, approximate with radius 100 m, elevation source `dem`;
  - year 2016, season summer;
  - capture offset +02:00, labelled `Europe/Zurich`. That label is the deferred item, now also noted for these two photos in `deferred-items.md`.

## Accomplishments

- **Task 1 (tracer):** the dry run and the decision packet, in the scratchpad only. Tracer gate: auto mode is off and `human_verify_mode` is end-of-phase, and the automated verify was re-run and passed.
- **Task 2:** Tim's decision, recorded above.
- **Task 3:**
  - The ortler region and both records.
  - The originals moved from `incoming/` to the top level. The move was allowed, and `incoming/` is now empty.
  - `photos:exif`, `photos:derive` and `photos:build`. The diff to existing entries is additions only, and `home-photos.ts` is byte-unchanged.
  - The editorial entries, verbatim.
  - `terrain:build`: only `overview.ts` changed, gaining the ortler outline.
  - Two test pins: the ortler region in the registry test with a new 16-17 record test, and the two slugs in `editorial.test`.
  - The selftest needed no edit: `plateSourceFiles()` already copies the ortler source.

## Task Commits

1. **Task 1 (tracer): dry run and decision packet.** No commit (scratchpad only, as planned).
2. **Task 2 (checkpoint:decision, blocking-human): Tim's reply.** Answered 2026-11-23.
3. **Task 3: ingest the Ortler photos and region, regenerate the overview.** `eb4bb1b` (feat)

## Gate (Task 3)

| Check | Result |
|---|---|
| `npm run data:check && npm run guard:images` | exit 0, `served-images: OK` (after staging the derivatives; the guard reads tracked files) |
| regions ids | `ortler,saalfelden,zermatt` |
| `npx jest` | 115 suites, 1,998 tests passed (1,997 before the plan; plus the 16-17 record test; nothing deleted or skipped) |
| `npm run lint` (ESLint, guards, selftest, data:check, served-images, test scan) | exit 0; selftest 290/290; test-count scan OK |
| G5 control "an unmodified copy of the inputs passes", with ortler records in the map | 1 PASS line |
| `npm run type-check` | exit 0 |
| `npm run terrain:build -- --check` | `terrain: OK` |
| `"region":` count in `overview.ts` | 3 |
| Route sets (`photo-routes`, `audit-routes`, `region-series`, `client-graph`) | 61 passed |
| Client JS (`rm -rf .next/static`, `npm run build`, the 15-01 byte sum, `git restore public/service-worker.js`) | **1,851,685 B in 24 files**: unchanged from 16-14 to 16-16; 113 B over the 16-01 base (1,851,572 B), 3,983 B under the cap (1,855,668 B) |
| `.next/static/chunks` files containing an Ortler id, slug, `"ortler"` or "Ortler Alps" | 0 |
| `.next/server` paths containing an Ortler id or slug | 0 (the slugs appear in server-bundle contents, as 16-14's slugs do) |

## Decisions Made

- Tim's values were applied exactly as stated above. No value was defaulted or changed.
- The planner's decision to run the dry run at 2dp was applied: it proved every precision Tim might choose stays on the plate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The dry run's temp root could not be deleted on the first run**
- **Found during:** Task 1
- **Issue:** `fs.rmSync` failed with EPERM, because sharp's file cache held a handle on a temp-root original (Windows). All four stage runs had already passed.
- **Fix:** the temp root was deleted by hand right after the run. The script now calls `sharp.cache(false)` and reads the original as a buffer. The re-run gave identical booleans and deleted its own root, and no `ortler-dry-*` root remains.
- **Files modified:** scratchpad `16-17-dryrun.mjs` only
- **Commit:** none (scratchpad)

**2. [Rule 3 - Blocking] Two tests pinned the registry and the slugs**
- **Found during:** Task 3
- **Issue:** `photo-map.test` pinned the registry to `['saalfelden', 'zermatt']`, and `editorial.test` pinned the approved slugs per id.
- **Fix:** both were rewritten in place (GUARD-03). The registry test now pins ortler's full record, and the slug map adds the two approved slugs. A new test pins Tim's 16-17 records.
- **Files modified:** data/__tests__/photo-map.test.ts, data/__tests__/editorial.test.ts
- **Commit:** eb4bb1b

**Total deviations:** 2 auto-fixed (Rule 3). **Impact:** none on scope.

## Known Stubs

None. Both editorial entries have `annotations: []` by design (no summit elevation reference, Pitfall 8). The photos are data only until Phase 17/18 (D-15).

## Privacy

- No position, uv, GPS altitude or grid value of either Ortler photo appears in a commit message, this SUMMARY, the packet or any `.planning/` file. Precision and kind are reported by id only.
- `photos:build` prints a DEM height per photo. Its output went to a scratchpad file. Only its line count and the last three summary lines were read, and the file was then deleted.
- The committed sidecar and photo facts hold the 3dp positions Tim chose, by design (D-12).

## D-25 scan

- **Runs:**
  - The baseline ran at 13:31Z, before the first Task 3 edit. It equals 16-16's final run.
  - The final run was made after the Task 3 commit, with this SUMMARY uncommitted in the working tree and before its commit.
  - Both used `d25-scan-1609.mjs`, which covers 13 originals and prints booleans and file names only.
  - `git grep --untracked` for an Ortler slug found this SUMMARY, so the scan can see the file.
- **Results:**
  - No line names a 16-17 file.
  - Both Ortler originals show no match in `.planning/` at lat or lon 2dp, 3dp or 4dp, LV95 E/N at 1 m or 10 m, or EPSG:3035 E/N at 1 m or 10 m. Both report "GPS altitude: none in EXIF".
  - The final run equals the baseline apart from the folder prefix of the two moved originals (`incoming/` became the top level). The comparison was sorted, with the prefix stripped.
  - "Any match: yes" is pre-existing only (the reviewed v2.0 files, as in 16-08 to 16-16).

## Next Phase Readiness

- **16-18:** all three launch regions now have photos, and the overview outlines every plate.
- **Phase 17:** gives the seven new photos their pages. The time-zone label item stays deferred for Phase 17/18.

## Self-Check: PASSED

- The nine modified sources, `overview.ts`, 18 tracked `sam-20160717-*` derivatives and this SUMMARY exist.
- Commit eb4bb1b is an ancestor of HEAD; `git rev-list --count 32079dc..HEAD` = 1.
- The D-25 scan, re-run after the last SUMMARY edit, equals the run above (and so the baseline, modulo the moved prefix).
- The decision packet is still at its scratchpad path (uncommitted, as planned).
