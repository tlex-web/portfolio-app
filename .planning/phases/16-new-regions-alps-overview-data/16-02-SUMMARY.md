---
phase: 16-new-regions-alps-overview-data
plan: 02
subsystem: data
tags: [terrain, overview, copernicus, glo-90, contours, d3-contour, brotli, spike]

requires:
  - phase: 15-region-plate-data-model
    provides: region and plate registries, the plate contour pipeline (contour-paths.ts, ringPaths, shadeGrey8) the spike copied
  - phase: 16-new-regions-alps-overview-data
    provides: 16-01's D-25 coordinate scan procedure, rerun here before the SUMMARY commit
provides:
  - "16-OVERVIEW-SPIKE.md: seven measured contour variants and four hillshade sizes on the GLO-90 mosaic of 5-17° E by 43-49° N"
  - "Tim's fixed overview parameters: plate carrée x cos 46.5°, 1,200 x 872 grid, 3 x 3 blur, 1,000 m contours from 1,000 m, simplify 2 px, rings ≥ 8 px, no hillshade"
  - "The overview budget for OVERVIEW_BUDGET: contours ≤ 30,000 B brotli and ≤ 120,000 B raw, overview served total ≤ 250,000 B"
  - "Plate extents stored as four corners projected into overview UV (D-17)"
  - "Five reference summit records (Dufourspitze, Mont Blanc 4,806 m IGN, Grossglockner, Zugspitze confirmed; Triglav secondary)"
  - "The verbatim GLO-90 adapted-data notice and liability sentence with the ™ glyph confirmed (D-21)"
affects: [16-13, 16-15, 16-17, 16-18, 18]

actuals:
  tokens: 7400       # chars/4 over the realized diff: the spike note (17,314 B at Task 3) plus this SUMMARY
  tasks: 3
  commits: 4         # measured 23989a3..HEAD at SUMMARY write; 2 of the 4 (62246de, f89b6b1) are 16-01's close-out, 16-02's own are 463a37f and 9faf627
plan_head_before: 23989a36a8afce1fd1f088f73707345c0e6ba9ff
plan_head_after: 9faf62743c2450981e9b11fb75aefad4f105e7d7

tech-stack:
  added: []
  patterns:
    - "Overview spike in the scratchpad only: repo contour code imported read-only, build-terrain logic copied, nothing written to the repository but the note"

key-files:
  created:
    - .planning/phases/16-new-regions-alps-overview-data/16-OVERVIEW-SPIKE.md
  modified: []

key-decisions:
  - "Overview variant: Tim chose \"C, no hillshade (Recommended)\" (AskUserQuestion, 2026-11-23): plate carrée x cos 46.5°, 1,200 x 872, 3 x 3 blur, 1,000 m contours from 1,000 m, simplify 2 px, rings ≥ 8 px, no hillshade; 14,312 B brotli measured"
  - "Overview budget unchanged by Tim: contours ≤ 30,000 B brotli and ≤ 120,000 B raw, overview served total ≤ 250,000 B"
  - "Mont Blanc: Tim chose \"4,806 m IGN (Recommended)\" (IGN BD CARTO cote 4806, Géoportail permalink as officialRef)"
  - "Triglav: Tim chose \"Yes, marked secondary (Recommended)\": fifth summit, 2,864 m secondary, no officialRef until confirmed against GURS"
  - "Plate extents stored as each plate's four corners in overview UV (planner default, not overridden)"

patterns-established:
  - "Overview UV: u = (lon − 5) / 12, v = (49 − lat) / 6 over the plate carrée grid"

requirements-completed: [DATA-12]   # copied from the plan; REQUIREMENTS.md not ticked, shared-ID gate (16-13, 16-15, 16-17 and 16-18 also declare DATA-12)

coverage:
  - id: D1
    description: "Seven contour variants (A-F plus C at 750 px) measured raw, brotli q11 and gzip with the repo's own contour-paths code, and hillshade AVIF/WebP at two widths, before any overview build code"
    requirement: DATA-12
    verification:
      - kind: other
        ref: "16-02-PLAN Task 1 automated verify (five sections; ≥ 7 measured contour rows and ≥ 2 hillshade rows in ## Measurements; no change outside the note)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tim's projection, variant, hillshade, budget and summit choices recorded verbatim with the fixed parameter set 16-13 and 16-15 read"
    requirement: DATA-12
    verification:
      - kind: other
        ref: "16-02-PLAN Task 3 automated verify (quoted reply, every parameter key, integer budgets, 3-5 summit rows in ## Decisions)"
        status: pass
    human_judgment: true
    rationale: "Readability at 375 px and the budget are Tim's judgment (D-19, D-20); his three AskUserQuestion selections of 2026-11-23 are the decision"
  - id: D3
    description: "D-25 coordinate scan run over .planning/ including the note and this SUMMARY before either was committed"
    requirement: DATA-12
    verification:
      - kind: manual_procedural
        ref: "scratchpad d25-scan.mjs over .planning/ (see D-25 scan)"
        status: pass
    human_judgment: false

duration: 21min
completed: 2026-11-23
status: complete
---

# Phase 16 Plan 02: Alps Overview Spike Summary

**Measured seven contour variants and four hillshade sizes on the Copernicus GLO-90 mosaic of the Alpine arc; Tim fixed variant C (plate carrée x cos 46.5°, 3 x 3 blur, 1,000 m contours from 1,000 m, simplify 2 px, rings ≥ 8 px, no hillshade, 14,312 B brotli) under a 30,000 B brotli / 120,000 B raw / 250,000 B served budget, Mont Blanc at 4,806 m (IGN) and Triglav as a secondary fifth summit.**

## Performance

- **Duration:** about 21 min wall clock (2026-11-23T00:47:36Z to about 01:09Z), including the wait for Tim's checkpoint answers
- **Tasks:** 3 of 3 (tracer spike, Tim's decision checkpoint, decisions recorded)
- **Files modified:** 1 (the spike note; this SUMMARY is the plan's output)

## Accomplishments

- The GLO-90 tile list and all 71 listed tiles for 43-48° N, 5-16° E were read at overview level 2 (the one sea slot N43 E014 filled as 0 m), mosaicked with the PixelIsPoint offset and resampled to 1,200 x 872 and 750 x 545 plate carrée grids.
- Variants A-F agree with the RESEARCH calibration to within 1.7 %. Variant C: 53,906 B raw, 14,312 B brotli, 19,131 B gzip.
- The hillshade calibration turned out to shade blurred heights; the plain-height 750 px poster costs 44,436 B AVIF / 72,706 B WebP, not the ~34 KB / 53 KB in the plan's option text. Tim was shown the corrected figures and chose no hillshade.
- Plate outlines: Ortler and Saalfelden turn about 2° under grid convergence (a corner about 0.6 px off the bounding box), so the four projected corners are stored.
- Summits confirmed against national services: Mont Blanc (IGN BD CARTO), Grossglockner (BEV DLM), Zugspitze (BKG GN250); Dufourspitze verified in RESEARCH; Triglav secondary (GURS unreachable, HTTP 407).
- The GLO-90 adapted-data notice and liability sentence copied from the licence PDF's text layer, with the ™ glyph checked on a 200 dpi render of page 20.

## Previews (scratchpad, not committed)

The ten previews Tim judged, at 375 px and 750 px wide:

- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-A-375.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-A-750.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-C-375.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-C-750.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-E-375.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-E-750.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-F-375.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-F-750.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-C-hillshade750-375.png`
- `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/renders/preview-C-hillshade750-750.png`

The spike scripts, tiles, contour SVGs and hillshade posters sit beside them in `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/a88de869-c4ad-4a23-b029-0becffeb52f7/scratchpad/16-02-spike/`. The scratchpad may be cleared; 16-13 rebuilds everything from the committed parameters.

## Tim's decisions (Task 2)

Three AskUserQuestion selections on 2026-11-23, quoted verbatim in the note's `## Decisions`:

1. "Which Alps overview variant should 16-13/16-15 build? (Budget stays contours ≤30,000 B brotli / ≤120,000 B raw, served ≤250,000 B unless you say otherwise.)": "C, no hillshade (Recommended)". Budget numbers unchanged.
2. "Which height should the overview record for Mont Blanc?": "4,806 m IGN (Recommended)".
3. "Should Triglav (SI, 2,864 m) be the fifth reference summit? Its height couldn't be confirmed against GURS this session.": "Yes, marked secondary (Recommended)".

Planner defaults not overridden: four projected corners per plate (D-17); the other summit heights and officialRefs as confirmed in the note.

## Task Commits

1. **Task 1: Overview spike, end to end in the scratchpad (tracer)**: `463a37f` (docs)
2. **Task 2: Tim's decision checkpoint**: no commit (answers recorded in Task 3)
3. **Task 3: Record Tim's decisions and the fixed parameter set**: `9faf627` (docs)

The plan metadata commit follows this SUMMARY.

## Files Created/Modified

- `.planning/phases/16-new-regions-alps-overview-data/16-OVERVIEW-SPIKE.md`: Method, Measurements, Summits, GLO-90 notice and Decisions (16-13 and 16-15 read the Decisions section)

## Decisions Made

See key-decisions above and Tim's decisions. The tracer gate: Task 1's automated verify passed end to end before the checkpoint.

## Deviations from Plan

### Corrected figure, not a code change

**1. [Rule 1 - Bug] Hillshade option figures in the plan were wrong**
- **Found during:** Task 1
- **Issue:** The plan's `variant-c-hillshade` option quoted about 34 KB AVIF / 53 KB WebP at 750 px, taken from a RESEARCH calibration that evidently shaded blurred heights.
- **Fix:** Measured both plain and blurred heights, recorded the difference under the note's hillshade table, and presented the checkpoint options with the measured figures.
- **Files modified:** 16-OVERVIEW-SPIKE.md
- **Commit:** 463a37f (measurement), 9faf627 (note that the options used the corrected figures)

Otherwise the plan ran as written.

## Issues Encountered

- LDBV BayernAtlas (HTTP 403 without a key) and GURS e-prostor (HTTP 407) did not answer; Zugspitze is confirmed against BKG GN250 instead, and Triglav stays secondary by Tim's choice.

## D-25 scan

Run after Tim's replies were written into the note and after this SUMMARY was written, before either was committed: the 16-01 scratchpad script (`d25-scan.mjs`, never in the repository) over `.planning/` with `git grep --untracked -F -l`, so the working-tree note and this untracked SUMMARY were searched. Same originals (12) and string kinds as 16-01's run; EPSG:3035 kinds still not available (no EPSG:3035 in `toGrid` before 16-09). The script prints booleans and file names only, never a value.

| Check | Result |
|---|---|
| `16-OVERVIEW-SPIKE.md` named in any match | no |
| `16-02-SUMMARY.md` named in any match | no |
| Any Phase 16 file named other than `16-CONTEXT.md` and `16-RESEARCH.md` (the D-01 example) | no |
| Output byte-identical to 16-01's reviewed close-out run | yes |

Every match is therefore one already reviewed in 16-01: the eight v2.0 files Tim chose to keep ("Keep history (Recommended)", 16-01-SUMMARY), the published 4-decimal values, the reviewed 2-decimal anchor lines, whole-metre digit-run noise and the D-01 example. The note's public summit positions and plate extents matched nothing. Re-run before the metadata commit after the commit hashes were filled in: identical output.

## Known Stubs

None. Triglav's missing officialRef is Tim's decision (secondary until a national source confirms it), not a stub.

## User Setup Required

None.

## Next Phase Readiness

- 16-13 can write `data/terrain/overview.json` and `OVERVIEW_BUDGET` from the note's `## Decisions` (projection, grid, contour parameters, no hillshade, the three budget integers, four-corner outlines, five summit records) and the verbatim GLO-90 notice.
- 16-15 draws the overview from the same section.
- Open for a later plan: confirming Triglav against GURS would let its source move from secondary to confirmed.

## Self-Check: PASSED

- FOUND: `.planning/phases/16-new-regions-alps-overview-data/16-OVERVIEW-SPIKE.md` (Task 1 and Task 3 verifies pass; WorldDEM 3, Grossglockner present, Großglockner 0)
- FOUND: all ten preview PNGs at the scratchpad paths above
- FOUND in HEAD's history: 463a37f, 9faf627
- Commits measured from the ledger base 23989a3: 4 (two are 16-01's close-out, 62246de and f89b6b1)
