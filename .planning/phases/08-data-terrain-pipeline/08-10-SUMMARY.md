---
phase: 08-data-terrain-pipeline
plan: 10
subsystem: data
tags: [zod, editorial, photos, legacy-bridge, image-manifest, jest, tdd, copy]

requires:
  - phase: 08-07
    provides: data/generated/image-manifest.ts (imageManifest[id].legacy.{largeWebp, largeJpg, thumbWebp})
  - phase: 08-08
    provides: data/generated/photos.ts (PhotoFacts, DEM heights, year/season tags) and lib/photo-format.ts formatters (formatCaptureLabel, formatExposureTime, formatAperture, formatFocalLength, formatMetres)
  - phase: 08-09
    provides: served-image guard in lint (no image-path literals may drift from the manifest)
provides:
  - data/schemas/editorial.ts (Fact, ElevationRef, Editorial, EditorialMap; imports only zod)
  - data/photos/editorial.ts (approved slugs, titles, alts, locations, stories, subject tags, sourced annotations keyed by camera id)
  - data/landscapes.ts as a legacy bridge deriving LandscapeImage[] from photos.ts + editorial.ts + imageManifest
  - LandscapeImage.technicalDetails.captureLabel (preformatted, no locale APIs)
  - ImageDetailModal renders captureLabel as-is (no toLocaleDateString)
  - Tim's approval of copy, slugs, tags, season rule and Riffelsee pin (Task 3)
affects: [08-11, 08-12, 08-13, phase 10 /photos/[slug] routes and lightbox, phase 12 legacy image cleanup (VERIFY-01)]

actuals:
  tokens: 8500
  tasks: 3
  commits: 3
plan_head_before: beba4e823721e14cc14897d0291db25830ffbda6
plan_head_after: 5491902a73ee3e6c79599a1605b0dc1f6a46e257

tech-stack:
  added: []
  patterns:
    - "Hand-written copy lives only in data/photos/editorial.ts; facts that come from data (capture time, exposure, position, DEM height, year/season) live only in data/generated/photos.ts and are never typed into copy"
    - "Annotation elevations are references ({ kind: 'photo' } or { kind: 'summit' }) resolved by the bridge through formatMetres; every annotation fact carries a source (URL, dem, exif or Tim)"
    - "data/landscapes.ts is a bridge with no image-path literal: src/fallbackSrc/thumbnailSrc come from imageManifest[id].legacy until Phase 10 migrates the v1 consumers"
    - "Capture dates reach the UI as a preformatted captureLabel; a year-only capture stays '2019', never a locale date"

key-files:
  created:
    - data/schemas/editorial.ts
    - data/photos/editorial.ts
    - data/__tests__/editorial.test.ts
    - components/__tests__/ImageDetailModal.test.tsx
  modified:
    - data/landscapes.ts
    - data/types.ts
    - components/ImageDetailModal.tsx

key-decisions:
  - "Tim approved the photo copy, the four slugs, the derived tags, the meteorological season rule and the Riffelsee pin exactly as drafted (literal reply: approve); 08-11 carries no edits forward and needs no photos.ts regeneration"
  - "Slugs are fixed (D-07, one-way once Phase 10 publishes /photos/[slug]): matterhorn-from-zermatt, gornerschlucht-waterfall, matterhorn-glacier-trail, riffelsee-reflection"
  - "Seasons are meteorological (Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov autumn), so the September 2021 photos are tagged autumn"
  - "Riffelsee pin stays 45.9837 N, 7.7623 E (LV95 2'625'080 / 1'092'506), radius 100 m, approximate, DEM 2,760 m (north shore); the shore-midpoint and NE-corner alternatives were not chosen"
  - "img-0629 title is 'Waterfall in the Gornerschlucht' (the 'Cascade in the Gornerschlucht' alternative was not chosen)"
  - "No Glacier Trail length/duration fact ships: zermatt.swiss trail pages returned 404 and gornerschlucht.ch failed DNS, so only fetched Wikipedia facts and dem/Tim sources are used"

patterns-established:
  - "Copy-approval plans record the approver's literal reply verbatim in the SUMMARY; nothing is marked approved without it"
  - "Story near-duplication is held by a word-trigram Jaccard test (< 0.3 for every pair)"

requirements-completed: [DATA-03, DATA-04, DATA-08]

coverage:
  - id: D1
    description: "Typed editorial file with slugs, first-person stories, subject tags and sourced annotations; no near-duplicate stories, no cut trivia, no wrong gorge"
    requirement: DATA-03
    verification:
      - kind: unit
        ref: "data/__tests__/editorial.test.ts (EditorialMap parse, unique slugs, trigram Jaccard < 0.3, banned-claim regex, no 2,900/3,100 on img-0662)"
        status: pass
      - kind: other
        ref: "grep gate: 0 '/images/' lines in data/landscapes.ts and 0 banned-term matches in data/landscapes.ts + data/photos -> 'bridge clean'"
        status: pass
    human_judgment: false
  - id: D2
    description: "data/landscapes.ts bridge derives the v1 LandscapeImage[] from photos.ts, editorial.ts and imageManifest in photos order; Home LCP src unchanged"
    requirement: DATA-08
    verification:
      - kind: unit
        ref: "data/__tests__/editorial.test.ts bridge cases (order, landscapes[0].src === imageManifest['img-0605'].legacy.largeWebp, elevation strings === formatMetres, img-0605 tags 2021 not 2024, r004-011 captureLabel '2019' and no captureDate)"
        status: pass
      - kind: unit
        ref: "components/__tests__/GalleryGrid.test.tsx"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/photos.spec.ts --project=chromium (6/6, 3 runs)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ImageDetailModal shows the preformatted captureLabel; '2019' for the film scan, never a locale date"
    requirement: DATA-03
    verification:
      - kind: unit
        ref: "components/__tests__/ImageDetailModal.test.tsx (3 tests)"
        status: pass
      - kind: other
        ref: "grep -c toLocaleDateString components/ImageDetailModal.tsx -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tim approved the copy, slugs, tags, season rule and the Riffelsee pin"
    requirement: DATA-04
    verification:
      - kind: manual_procedural
        ref: "Task 3 checkpoint:decision, Tim's literal reply 'approve' (quoted below)"
        status: pass
    human_judgment: true
    rationale: "Editorial approval and pin placement are human judgments; recorded verbatim from Tim's reply"
  - id: D5
    description: "/photos renders the new titles, locations and hotspot counts (visual change expected; re-baselined in 08-11)"
    verification: []
    human_judgment: true
    rationale: "Pixel change to photos/* baselines is reviewed and committed by Tim in 08-11"

duration: 15min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 10: Photo Editorial and Legacy Bridge Summary

**Approved first-person photo copy with fixed slugs and sourced hotspots in a zod-typed editorial file, `data/landscapes.ts` turned into a manifest-backed bridge with no image-path literals, and a modal that shows '2019' instead of a made-up locale date**

## Performance

- **Duration:** about 15 min
- **Started:** 2026-10-24T18:13:10Z
- **Completed:** 2026-10-24T18:28Z
- **Tasks:** 3 (2 code tasks + 1 decision checkpoint)
- **Files modified:** 7

## Tim's decision (Task 3)

Tim's literal reply, verbatim:

    approve

Resolution: option 1 "approve everything as drafted". Approved exactly as in `data/photos/editorial.ts` at `5491902`. **No edits carry forward to 08-11**: 08-11 only records the approval and re-baselines /photos. No photos.ts regeneration is needed (pin and season rule unchanged).

### Approved content

| Camera id | Slug | Title | Location | Tags as shown | DEM height | Hotspots |
|-----------|------|-------|----------|---------------|------------|----------|
| img-0605 | `matterhorn-from-zermatt` | Matterhorn from Zermatt | Zermatt, Switzerland | 2021, autumn, landscape, matterhorn, clouds | 1,617 m | 1: Matterhorn summit (summit height) |
| img-0629 | `gornerschlucht-waterfall` | Waterfall in the Gornerschlucht | Gornerschlucht, Zermatt | 2021, autumn, landscape, waterfall, river | 1,668 m | 1: Gornera (photo height) |
| img-0662 | `matterhorn-glacier-trail` | Matterhorn from the Glacier Trail | Matterhorn Glacier Trail, Zermatt | 2021, autumn, landscape, matterhorn, hiking | 2,585 m | 2: Matterhorn summit (summit height), Matterhorn Glacier Trail (photo height) |
| r004-011 | `riffelsee-reflection` | Matterhorn in the Riffelsee | Riffelsee, Zermatt | 2019, landscape, matterhorn, reflection, lake, film | 2,760 m (approximate) | 2: Riffelsee (photo height), Matterhorn summit (summit height) |

Stories, alt text and annotation copy as drafted in `data/photos/editorial.ts`:

- **img-0605:** "I took this from the village of Zermatt with the zoom at its longest. A bank of cloud covered much of the mountain, and only the summit stood clear of it."
- **img-0629:** "Just south of Zermatt, the Gornera runs through the Gornerschlucht. I pointed the camera straight down at the water where it spills over a lip of rock into a narrow chute."
- **img-0662:** "A day later I was on the Matterhorn Glacier Trail, near its Schwarzsee end. From here the mountain fills the frame, with cloud trailing off both of its flanks."
- **r004-011:** "I shot this on film at the Riffelsee in 2019. The water was calm enough to hold an upside-down Matterhorn between the boulders."

Not chosen: the "Cascade in the Gornerschlucht" title alternative for img-0629.

**Season rule:** meteorological (Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov autumn), so the September 2021 photos are "autumn". The 2019 film scan has a year-only capture and no season tag.

**Riffelsee pin (DATA-04):** 45.9837 N, 7.7623 E (LV95 2'625'080 / 1'092'506), radius 100 m, `approximate: true`, DEM 2,760 m, north shore. Map: https://map.geo.admin.ch/?lang=en&E=2625080&N=1092506&zoom=11. Alternatives offered and not chosen: shore midpoint 45.9836 N 7.7619 E; north-east corner 45.9837 N 7.7627 E. Note: Wikipedia gives the lake surface as 2,757 m; the site uses the DEM value 2,760 m at the pin.

### Fact sources (per photo)

| Photo | Fact | Source |
|-------|------|--------|
| img-0605 | The Matterhorn straddles the Switzerland-Italy border | https://en.wikipedia.org/wiki/Matterhorn |
| img-0629 | The Gornera rises at the Gorner Glacier and flows down through Zermatt | https://en.wikipedia.org/wiki/Gorner_Glacier |
| img-0629 | The gorge lies south of Zermatt; Zum See sits on its west bank | https://en.wikipedia.org/wiki/Zermatt |
| img-0629 | Located from the camera's GPS and confirmed by Tim | Tim |
| img-0662 | First climbed 14 July 1865 by Whymper's party, by the Hörnli ridge | https://en.wikipedia.org/wiki/Matterhorn |
| img-0662 | Height from the swissALTIRegio terrain model at the camera's GPS position | dem |
| r004-011 | The lake lies below the Riffelhorn and covers about 0.45 ha | https://en.wikipedia.org/wiki/Riffelsee |
| r004-011 | Reachable from Rotenboden station on the Gornergrat railway | https://en.wikipedia.org/wiki/Riffelsee |

Unreachable during drafting (so no fact from them ships): gornerschlucht.ch (DNS failure); zermatt.swiss gorge and Glacier Trail pages (404). As a result no Glacier Trail length or duration fact ships.

### Cuts recorded (D-05, D-01)

- **img-0605:** death-toll fact, temperature range, glacier hotspot.
- **img-0629:** wrong-gorge trail hotspot with its distance and facts, temperature, glacial-flour and meltwater claims.
- **img-0662:** trail length, duration and season, the 38-peaks claim, north-face hotspot.
- **r004-011:** chocolate-packaging line, visibility-distance line, films trivia, cable-car summit-station hotspot, "dawn" and "glacial meltwater".

## Accomplishments

- `data/schemas/editorial.ts` defines `Fact` (source = URL or dem/exif/Tim), `ElevationRef` (photo | summit), `Editorial` and `EditorialMap` with strict objects, importing only zod.
- `data/photos/editorial.ts` holds the approved copy for all four photos; every story pair has word-trigram Jaccard 0.000.
- `data/landscapes.ts` is now a bridge: order img-0605, img-0629, img-0662, r004-011 from `photos`; paths from `imageManifest[id].legacy`; exposure strings, `captureLabel`, tags and elevations derived through the formatters. `imageManifest[` appears 1x, `@/data/generated/photos` 1x, `/images/` 0x.
- `ImageDetailModal` renders `technicalDetails.captureLabel` as-is; the `toLocaleDateString` call is gone (0 matches).

## Task Commits

1. **Task 1 (tracer): Editorial schema, drafted copy, legacy bridge** - `b056b88` (feat)
2. **Task 2 (TDD): Modal renders the preformatted capture label** - `bb9ea17` (test, RED), `5491902` (fix, GREEN)
3. **Task 3: Tim approves copy, slugs, tags, season rule and Riffelsee pin** - decision checkpoint, no code commit (approval recorded in this SUMMARY)

**Plan metadata:** docs commit for this SUMMARY and the STATE/ROADMAP/REQUIREMENTS update.

## Files Created/Modified

- `data/schemas/editorial.ts` - zod schema for the editorial file (Fact, ElevationRef, Editorial, EditorialMap)
- `data/photos/editorial.ts` - approved slugs, titles, alts, locations, stories, subject tags and sourced annotations
- `data/landscapes.ts` - legacy bridge over photos.ts, editorial.ts and imageManifest (no hand-typed facts or image paths)
- `data/types.ts` - `technicalDetails.captureLabel?: string` with its JSDoc
- `data/__tests__/editorial.test.ts` - schema, slug, similarity, banned-claim and bridge tests (DATA-03, DATA-04, DATA-08)
- `components/ImageDetailModal.tsx` - capture row renders `captureLabel`, same label, element and classes
- `components/__tests__/ImageDetailModal.test.tsx` - 3 tests for the capture label behaviour

## Verification Evidence

- `npm run lint`: 0 errors / 54 warnings (baseline unchanged); `npm run type-check` clean.
- Full Jest: 27 suites / 374 tests (baseline 25 / 355); `guard:tests` OK.
- `npx jest data/__tests__/editorial.test.ts components/__tests__/GalleryGrid.test.tsx --silent` green; `npx jest components/__tests__/ImageDetailModal.test.tsx --silent` 3/3.
- `npx playwright test e2e/photos.spec.ts --project=chromium`: 6/6, three runs.
- Bridge grep gate printed "bridge clean"; same-classnames OK; the tracer `<verify>` was re-run green before Task 2 (end-of-phase mode, automated-only verify).
- Story word-trigram Jaccard: 0.000 for all 6 pairs.

## TDD Gate Compliance

- **RED:** `bb9ea17` `test(08-10)`. Record `.git/gsd-red/08-10-red.json`, classifier verdict `RED_EVIDENCE_OK` (`target_test_failed`; TAP, 3 tests, 2 failed). Target "shows a year-only capture as the year, never as a locale date" failed on `toBeInTheDocument` because `queryByText('2019')` returned null, since HEAD still rendered `captureDate` through `toLocaleDateString`. **Semantic assessment:** the target executed and failed on the planned assertion for the intended reason; no load, fixture, syntax or discovery faults.
- **GREEN:** `5491902` `fix(08-10)`, 3/3 pass. The commit type is `fix`, not `feat`, because the plan's Task 2 action specified `fix(08-10): modal shows the preformatted capture label (D-03)`; the plan is `type: execute`, not `type: tdd`, so the plan-level `feat(...)` gate does not apply.
- **REFACTOR:** none needed.

## Expected Visual Changes (for 08-11)

08-11 re-baselines `photos` only. Expected differences:
- /photos titles and locations change to the approved copy.
- /photos hotspot counts: img-0605 2 -> 1, img-0629 2 -> 1, img-0662 2 -> 2, r004-011 3 -> 2.
- Home is unchanged: LCP src (`landscapes[0].src`) is still the manifest legacy `largeWebp` of img-0605, and Home still shows 4 photos.
- Modal content (not in the visual baselines): the v1 modal now shows Camera, Lens, Aperture, Shutter Speed and ISO rows for the three digital photos, because the bridge fills them from EXIF; before, only a date showed.

## Decisions Made

See frontmatter `key-decisions`. In short: Tim approved everything as drafted; slugs, titles, meteorological seasons and the north-shore Riffelsee pin are final.

## Deviations from Plan

None functional - plan executed as written. Minor notes:
- Prettier formatted the new files.
- The modal test mocks `next/image` with only `alt` (rendered as `<span role="img">`), so it adds no lint warnings (GalleryGrid's copy of that mock carries 7).

**Total deviations:** 0 auto-fixed. **Impact on plan:** none.

## Issues Encountered

- The first `e2e/photos.spec.ts` run (cold dev compile) logged a browser `removeChild` / "synchronously unmount a root" console error. It did not recur in two reruns, and a pre-plan data run was also clean, so it is flaky dev-compile noise, not caused by the data. It matches the pre-existing Phase 10 watch item from 07-19 in STATE.md.

## Out of Scope (unchanged)

- Command 4 (`pkill -f chrome`) explanation copy in `data/projects.ts` is still unanswered by Tim; it is a separate open item and was not touched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 08-11: record the approval and re-baseline `photos` (Tim commits the PNGs). No copy, slug, season or pin edits to apply, and no photos.ts regeneration.
- Slugs are now the Phase 10 `/photos/[slug]` contract.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED
