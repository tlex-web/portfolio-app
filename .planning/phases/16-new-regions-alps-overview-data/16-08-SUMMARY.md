---
phase: 16-new-regions-alps-overview-data
plan: 08
subsystem: photos-data
tags: [photos, schema, zod, photo-id, decisions, editorial, privacy, jest]

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-01 per-photo precision and kind at extraction, and the D-25 scan procedure; 16-04 photo-map.json with region and country per photo"
provides:
  - "One general photo id slug (lowercase letters and digits in hyphen-joined groups, at most 40 characters) in ExifSidecarEntry.id, PhotoId, the ImageManifest key and the image-manifest test's hashed-URL pattern"
  - "Test 'photo ids are lowercase hyphen-joined slugs of at most 40 characters' in data/__tests__/image-manifest.test.ts"
  - "Tim's verbatim per-photo decisions (id, region, country, precision, kind) for the five non-Ortler photos, for 16-14 to apply"
  - "The approved editorial copy for the five photos and the approved zermatt and saalfelden region facts, verbatim, for 16-14 to commit"
affects: [16-14, 16-16, 16-17, 16-18, 17-routes-seo]

actuals:
  tokens: 1400
  tasks: 3
  commits: 1
plan_head_before: a227ad30ede21ef22810841414ba3557ab861aab
plan_head_after: c99d9f9e61556c5328ae4b7294bb756b834857c4

tech-stack:
  added: []
  patterns:
    - "Photo ids are a general slug, not a camera-shaped pattern: the id comes from photo-map.json, and the same rule is repeated in the sidecar, photo-map, manifest and hashed-URL checks"

key-files:
  created:
    - .planning/phases/16-new-regions-alps-overview-data/16-08-SUMMARY.md
  modified:
    - data/schemas/photo.ts
    - data/schemas/image-manifest.ts
    - data/__tests__/image-manifest.test.ts

key-decisions:
  - "D-02 (Tim): 'Proposed (Recommended)'. img-0680, img-0682 and sam-20240910-143659 at 4dp, ground; dji-20260919-162232 and dji-20260919-163558 at 3dp, aerial; regions zermatt and saalfelden as proposed"
  - "Country (Tim): 'All three CH (Recommended)'. The three Zermatt photos are CH, location copy 'Zermatt, Switzerland'"
  - "Valley still (Tim): 'Keep it (Recommended)'. dji-20260919-163558 stays in the series despite the close-range view of houses and a sports ground"
  - "Copy (Tim): 'Approve, fixes applied (Recommended)'. Copy as drafted; the Zermatt car-rule and Saalfelden district facts corrected against their sources; 20210912_193833.jpg and 20260916_125705.jpg stay out of every series"
  - "Planner decision applied: one general id slug in all four places; the photo.ts copies share one module-level regex and message"

patterns-established:
  - "A Tim decision that 16-14 applies is recorded verbatim with the question it answered, and one row per photo holds the resulting values (no position, altitude or grid value)"

requirements-completed: [DATA-13, DATA-14]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-14, 16-17, 16-18 also declare them)

coverage:
  - id: D1
    description: "The general id slug in all four copies: current ids and Tim's five ids parse; uppercase, underscore, space, leading or trailing or doubled hyphen, empty and 41-character ids fail; a dji- derivative URL matches the hashed pattern"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/image-manifest.test.ts#photo ids are lowercase hyphen-joined slugs of at most 40 characters"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tim chose precision, kind, id, region and country per photo before any ingest (D-02, D-04), recorded verbatim"
    requirement: DATA-14
    verification:
      - kind: other
        ref: "16-08-SUMMARY.md#decisions-tim-verbatim"
        status: pass
    human_judgment: true
  - id: D3
    description: "Approved copy and region facts recorded verbatim, at region level (no place finer than the precision cell)"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "16-08-SUMMARY.md#approved-copy"
        status: pass
    human_judgment: true
  - id: D4
    description: "D-25 coordinate scan over .planning/ including this uncommitted SUMMARY, before its commit"
    requirement: DATA-14
    verification:
      - kind: other
        ref: "16-08-SUMMARY.md#d-25-scan"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-23
status: complete
---

# Phase 16 Plan 08: Non-Ortler Photo Decisions and the General Id Slug Summary

**Tim chose the proposed values for the five new non-Ortler photos: the three Zermatt photos (all CH) at 4dp as ground photos, and both Saalfelden DJI stills at 3dp as aerial. He approved the drafted copy with two region facts corrected against their sources. The photo id is now one general lowercase slug of at most 40 characters everywhere ids are checked, so `sam-…` and `dji-…` ids are valid for 16-14's ingest.**

## Performance

- **Duration:** about 12 min of work: Task 1 about 2 min (2026-11-23T01:32:27Z to about 01:34Z), and Task 3 with the close-out from 2026-11-23T09:54:31Z. The wait for Tim's reply and the overnight gap between sessions are not counted.
- **Tim's reply:** 2026-11-23T01:37Z (four AskUserQuestion selections)
- **Tasks:** 3 (1 tracer, 1 blocking-human decision checkpoint, 1 auto)
- **Files modified:** 3

## Accomplishments

- The decision packet (Task 1) holds booleans and camera facts only, with 1,024 px EXIF-free previews, proposed values and drafted copy. It stayed in the session scratchpad and was never committed: `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-08-packet/16-08-decision-packet.md`, with five previews under that folder's `previews/` and the facts script `16-08-facts.mjs` beside it.
- Tim's four choices are recorded verbatim below. 16-14 applies them, and no new photo was ingested in this plan.
- The general id slug is in all four places: `ExifSidecarEntry.id` and `PhotoId` in `data/schemas/photo.ts` (one shared module-level regex and message), the `ImageManifest` key in `data/schemas/image-manifest.ts`, and `HASHED` in `data/__tests__/image-manifest.test.ts`.
- The new test checks the sidecar id, `PhotoId` and the manifest key on the same lists. It also checks that `/images/photos/dji-20260919-162232-1024.0123456789.avif` matches `HASHED` and that an uppercase-underscore URL does not.

## Task Commits

1. **Task 1 (tracer): the decision packet in the scratchpad.** No commit (scratchpad only, as planned). The repository stayed untouched.
2. **Task 2 (checkpoint:decision, blocking-human): Tim's decision.** Answered 2026-11-23T01:37Z.
3. **Task 3: the general photo id slug plus the id-shape test.** `c99d9f9` (feat)

## Files Created/Modified

- `data/schemas/photo.ts`: `PHOTO_ID_SLUG` and `PHOTO_ID_RULE`, used by `ExifSidecarEntry.id` and `PhotoId` with `.max(40)`.
- `data/schemas/image-manifest.ts`: the manifest key is the same slug with `.max(40)`.
- `data/__tests__/image-manifest.test.ts`: the widened `HASHED` pattern and the id-shape test.

## Decisions (Tim, verbatim)

Tim answered four AskUserQuestion questions on 2026-11-23 at 01:37Z. Each answer is quoted with the question it answered and the text of the option he selected.

1. **Q:** "Which precision set for the five new photos? (One-way per photo: a committed 4dp position, about 10 m, stays in git history.)"
   **A:** "Proposed (Recommended)". Selected option text: "3 Zermatt photos at 4dp, ground (like the four current trail photos); both DJI stills at 3dp (about 100 m), aerial. Ids and regions as in the table."
2. **Q:** "Which country are the three Zermatt photos in (img-0680, img-0682, sam-20240910-143659)?"
   **A:** "All three CH (Recommended)". Option text: "Taken on the Swiss side above Zermatt; the location copy stays \"Zermatt, Switzerland\"."
3. **Q:** "The valley still (dji-20260919-163558) shows houses and a sports ground up close, so the view places the drone more finely than its 3dp pin. Keep it?"
   **A:** "Keep it (Recommended)". Option text: "No person is identifiable at publication sizes, it's a public town view, and the stored position is still only about 100 m."
4. **Q:** "Approve the drafted copy and region facts? (Either choice keeps the S20 and S25 files out of every series.)"
   **A:** "Approve, fixes applied (Recommended)". Option text: "Copy as drafted, with the two region facts corrected against their sources (Zermatt car rule, Saalfelden district)."

Resulting values per in-series photo, for 16-14 to apply:

| Original (in `assets/photos-original/incoming/`) | id | region | country | precision | kind |
|---|---|---|---|---|---|
| `_MG_0680.jpg` | `img-0680` | `zermatt` | CH | 4dp | ground |
| `IMG_0682.jpg` | `img-0682` | `zermatt` | CH | 4dp | ground |
| `20240910_143659.jpg` | `sam-20240910-143659` | `zermatt` | CH | 4dp | ground |
| `dji_fly_20260919_162232_0153_…_photo.jpg` | `dji-20260919-162232` | `saalfelden` | AT | 3dp | aerial |
| `dji_fly_20260919_163558_0163_…_photo.jpg` | `dji-20260919-163558` | `saalfelden` | AT | 3dp | aerial |

Out of every series (D-27 / D-28, confirmed by Tim's answer 4): `20210912_193833.jpg` (S20, no GPS) and `20260916_125705.jpg` (S25, outside the Saalfelden plate). The 2016 SM-G930F file (`20160717_120906-Topaz-Sharpen-Strong-Denoise.jpg`) waits for the Ortler intake in 16-16.

Every id fits the general slug, so Tim was not asked again. Both DJI stills are `aerial`, which matches the extraction safety net (Make = DJI, D-04).

## Approved copy

Approved as drafted in the packet, unchanged. That includes the S23 story's "three years after my first visit", because Tim chose the as-drafted option. Annotations stay empty (no summit elevation reference, Pitfall 8). The packet's drafter "Note:" lines are not copy and are left out. Every location is at region level.

### img-0680

- slug: `mirrored-snow-peaks`
- title: Snow peaks mirrored in a pool
- alt: A row of snow-covered peaks under streaked white cloud and patches of blue sky, mirrored in a still, shallow pool beyond a stretch of brown, stony ground
- location: Zermatt, Switzerland
- story: I took this above Zermatt in September 2021. A shallow pool on the stony ground was still enough to hold the snow peaks and the cloud above them.
- subjectTags: landscape, reflection, snow

### img-0682

- slug: `butterfly-on-a-thistle`
- title: Butterfly on an alpine thistle
- alt: An orange and black butterfly resting on a pale yellow, spiny thistle head, with grey stones out of focus behind
- location: Zermatt, Switzerland
- story: On the same walk, a butterfly stopped on a thistle among the stones. I zoomed in all the way and let the background go soft.
- subjectTags: nature, butterfly, thistle

### sam-20240910-143659

- slug: `matterhorn-wrapped-in-cloud`
- title: Matterhorn in a wisp of cloud
- alt: The Matterhorn's snow-dusted rock pyramid against a clear blue sky, with puffs of white cloud clinging to its left flank and lower slopes
- location: Zermatt, Switzerland
- story: I took this with my phone in September 2024, three years after my first visit. Small clouds were forming against the mountain's flanks while the sky around it stayed clear.
- subjectTags: landscape, matterhorn, clouds

### dji-20260919-162232

- slug: `castle-below-limestone-peaks`
- title: Castle below limestone peaks
- alt: From the air, a white-walled castle with grey roofs stands on a wooded hillside, with pale limestone peaks and a blue sky behind
- location: Saalfelden, Austria
- story: I flew the drone near Saalfelden in September 2026. The late-afternoon sun lit the castle walls and the limestone peaks above them.
- subjectTags: landscape, aerial, castle

### dji-20260919-163558

- slug: `saalfelden-valley-from-the-air`
- title: Saalfelden valley from the air
- alt: An aerial view across green meadows, woods and the houses of a valley town towards rounded, forested mountains under a blue sky with white cloud
- location: Saalfelden, Austria
- story: A quarter of an hour later I turned the drone towards the valley. Meadows and woods run down to the town, with the mountains on the far side.
- subjectTags: landscape, aerial, valley

### Region facts

These are the "fixes applied" wording. The orchestrator checked all four sentences against the cited Wikipedia pages with a web fetch on 2026-11-23.

zermatt:

1. "Zermatt lies at the head of the Matter Valley in the Swiss canton of Valais." (https://en.wikipedia.org/wiki/Zermatt). Supported as drafted.
2. "The town bans combustion-engine cars, apart from some emergency, municipal and permitted vehicles, and most visitors arrive by rack railway." (https://en.wikipedia.org/wiki/Zermatt). Corrected: the page says "the entire town is a combustion-engine-car–free zone", lists exceptions for emergency, municipal and permitted vehicles, and says "Most visitors reach Zermatt by the rack-assisted railway train". The draft had read "The village is car-free: combustion-engine cars are banned, and most visitors arrive by train."

saalfelden:

1. "Saalfelden am Steinernen Meer is a town in the Zell am See district of the Austrian state of Salzburg, in the historic Pinzgau region." (https://en.wikipedia.org/wiki/Saalfelden). Corrected: the page names the Zell am See district and mentions Pinzgau only as "the historic Pinzgau region". The draft had read "Saalfelden am Steinernen Meer is a town in the Pinzgau, in the Austrian state of Salzburg."
2. "The Steinernes Meer, the karst plateau in the town's full name, is part of the Berchtesgaden Alps." (https://en.wikipedia.org/wiki/Steinernes_Meer). Supported as drafted.

## D-25 scan

The scan ran after `## Decisions (Tim, verbatim)` and `## Approved copy` were written and before this SUMMARY was committed. It used the 16-01 scratchpad script (`d25-scan.mjs`, never in the repository) over `.planning/` with `git grep --untracked -F -l`, so the untracked SUMMARY was searched. A `git grep --untracked` for one of its slugs confirmed that the scan can see the file. It used the same 12 originals and string kinds as 16-01's run. EPSG:3035 kinds are still not available, because `toGrid` has no EPSG:3035 before 16-09. The script prints booleans and file names only, never a value. A first run before the SUMMARY existed gave the baseline.

| Check | Result |
|---|---|
| `16-08-SUMMARY.md` named in any match | no |
| Any other 16-08 file named in any match | no |
| Any Phase 16 file named other than `16-CONTEXT.md` and `16-RESEARCH.md` (the D-01 example) | no |
| Output with the SUMMARY byte-identical to the baseline run without it | yes |
| Any match overall (`any match: yes`) | yes, pre-existing only |

Every match was already reviewed: the eight v2.0 files Tim chose to keep ("Keep history (Recommended)", 16-01-SUMMARY), the published 4-decimal values, the reviewed 2-decimal anchor lines, whole-metre digit-run noise and the D-01 example. This SUMMARY matched nothing. The scan was re-run after this section was added, before the commit, and the output was again byte-identical to the baseline.

## Deviations from Plan

### Additions within the task

**1. Extra invalid shapes and a manifest-key check in the id-shape test**
- **Found during:** Task 3
- **Issue:** the plan's reject list does not cover a leading hyphen or a doubled hyphen, and it names only `PhotoId` and the sidecar id, not the manifest key.
- **Fix:** the test also rejects `-img-0680` and `img--0680`, accepts the exact 40-character boundary, and runs the same lists through the `ImageManifest` key (one real entry under each id).
- **Files modified:** data/__tests__/image-manifest.test.ts
- **Commit:** c99d9f9

**Total deviations:** 0 auto-fixed rule deviations and 1 small in-task test addition. **Impact:** none on current output.

## Verification

- `npx jest data/__tests__/image-manifest.test.ts data/__tests__/exif-sidecar.test.ts data/__tests__/photo-map.test.ts data/__tests__/photos.test.ts`: 4 suites, 90 passed. Every existing test passed unchanged.
- `grep -cF "img-\d{4}" data/schemas/photo.ts data/schemas/image-manifest.ts` prints 0 and 0.
- `grep -c "dji-20260919-162232" data/__tests__/image-manifest.test.ts` prints 2.
- `npm run type-check` exits 0, and `npm run data:check` exits 0 (trails OK, clips OK).
- Prettier and ESLint are clean on the three changed files. No build was run, so `public/service-worker.js` was not touched.

## Privacy

No position, GPS altitude or grid value of any photo appears in the code, the test, the commit message or this summary. The test ids are file-name-derived slugs only. The DJI file names are shortened with "…", as in the packet.

## Known Stubs

None. No photo-map record, sidecar entry, derivative or editorial entry was written for a new photo, as the plan's D-02 prohibition requires. 16-14 writes them from this SUMMARY.

## Next Phase Readiness

16-14 can ingest the five photos using the table and the approved copy above. The ids are valid in the sidecar, photo-map, manifest and hashed-URL checks. 16-16 and 16-17 handle the Ortler intake and its own Tim stop.

## Self-Check: PASSED

- The three modified code files and this SUMMARY exist on disk.
- Commit c99d9f9 is an ancestor of HEAD.
- The Task 1 decision packet still exists at its scratchpad path (uncommitted, as planned).
