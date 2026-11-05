---
phase: 10-photography
plan: 13
subsystem: testing
tags: [photos, lightbox, visual-regression, playwright, ci, baselines, ratchet, service-worker, phase-close]

requires:
  - phase: 10-photography
    provides: "10-01 to 10-12: the map default view, grid, carousel stepper, photo page, lightbox, the visual suite entries for every new surface (10-12) and the cross-view sweep"
provides:
  - "One Phase 10 re-baseline in Tim's commit 483895b: 3 changed photos/* and 12 new PNGs (photos-grid, photos-carousel, photo, lightbox), nothing outside those five folders"
  - "Wide map plates hold their title on one line on every renderer (256 px wide plate, nowrap title and altitude, plate-fit e2e at six widths), 487e113"
  - "CI green twice on Tim's commit: run 40367226761 attempt 1 and its one re-run (attempt 2), every job green, Visual 96 passed and E2E 554 passed / 0 flaky both times"
  - "Test-count ratchet raised to jest 942 / e2e 358 / total 1300 (from 725 / 241 / 966)"
  - "08-REVIEW-DISPOSITION WR-04 and IN-02 recorded fixed (open 10 -> 8); the 09 photos carousel flake and the 07-19 removeChild error recorded resolved with their commits"
affects: [Phase 10 verification and UAT, Phase 10 close, Phase 12 (legacy variant deletion, cross-browser pass), deploy of /photos]

actuals:
  tokens: 11000   # chars/4: 20,478-char non-PNG plan diff (about 5,100) plus this SUMMARY (about 6,000)
  tasks: 3
  commits: 3
plan_head_before: 02423ed52910ce96c57ff5953143cb9359fbfa93
plan_head_after: b73b1013183a274c2c382f428dae4b332502c27a

tech-stack:
  added: []
  patterns:
    - "A label that must stay on one line gets whitespace-nowrap plus a box sized from the Linux CI render, not the local Windows one; an e2e asserts the line rects sit inside the padding box at every guarded width"

key-files:
  created:
    - .planning/phases/10-photography/10-13-SUMMARY.md
    - e2e/visual/routes.spec.ts-snapshots/photos-grid/ (3 PNGs, Tim's commit)
    - e2e/visual/routes.spec.ts-snapshots/photos-carousel/ (3 PNGs, Tim's commit)
    - e2e/visual/routes.spec.ts-snapshots/photo/ (3 PNGs, Tim's commit)
    - e2e/visual/routes.spec.ts-snapshots/lightbox/ (3 PNGs, Tim's commit)
  modified:
    - e2e/visual/routes.spec.ts-snapshots/photos/ (3 PNGs, Tim's commit)
    - components/photos/MapSheet.tsx
    - lib/photos/label-layout.ts
    - lib/__tests__/photos-label-layout.test.ts
    - e2e/photos.spec.ts
    - .planning/phases/10-photography/10-UI-SPEC.md
    - scripts/guards/test-count.baseline.json
    - .planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md
    - .planning/phases/09-home-ascent/deferred-items.md

key-decisions:
  - "10-13: wide map plate 240 -> 256 px (w-64, PLATE_WIDE 256 x 48) with a nowrap title on the wide tier and a nowrap altitude on both tiers, an approved UI-SPEC deviation (Tim: 'A: widen + nowrap (Recommended)'); the Linux CI render of the longest title is about 234 px and wrapped inside the old 224 px content box"
  - "10-13: the zoomed-photo drag prevention from 10-10 is kept as a recorded exception to UI-SPEC line 393 / LBOX-07 'no right-click or drag blocking' (Tim: 'Keep, record exception (Recommended)'); right-click and saving stay untouched, the fitted photo has no drag handling"
  - "10-13: map plate clearance stays a 16 px dot square as built in 10-08 (Tim: '16 px, as built (Recommended)')"
  - "10-13: test-count ratchet raised at the Phase 10 close: jest 725 -> 942, e2e 241 -> 358, total 966 -> 1300"

patterns-established:
  - "Phase-close re-baseline: one dispatch per fix, blob-compare against HEAD and against the previous artifact, copy only changed and new PNGs, Tim commits, then CI twice on his SHA"

requirements-completed: [PHOTO-01, PHOTO-02, LBOX-04, LBOX-06]

coverage:
  - id: D1
    description: "One Phase 10 re-baseline committed and pushed by Tim (483895b): photos/{375,768,1440}-reduced changed; photos-grid, photos-carousel and photo {375,768,1440}-reduced and lightbox/{375,768,1440} new; nothing else changed"
    requirement: PHOTO-01
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha 483895b --some --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow lightbox (OK, 15 changed)"
        status: pass
    human_judgment: true
    rationale: "Tim accepted the baselines by committing them, literal reply 'pushed', with no review notes; whether each shot matches the Task 2 step 4 checklist is still his call at UAT"
  - id: D2
    description: "CI green twice on Tim's commit: run 40367226761 attempt 1 and the one re-run (attempt 2); Lint and Type Check, Unit Tests (ratchet), Build, Security, E2E (554 passed, 0 flaky) and Visual Regression (96 passed) green both times"
    requirement: PHOTO-02
    verification:
      - kind: automated_ui
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha 483895b (PASS, jobs 121728086717 and 121734699708)"
        status: pass
      - kind: e2e
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha 483895b --job 'E2E Tests' (PASS, jobs 121728087176 and 121734700519)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Wide map plates keep the title on one line and the altitude inside the plate at 360/375/412/768/1024/1440 on every renderer"
    requirement: PHOTO-01
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts plate-fit case (CI E2E run 40358734070 on 487e113 and run 40367226761 attempts 1 and 2)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-label-layout.test.ts (sweep 312-1100 px at PLATE_WIDE 256)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Test-count ratchet above the Phase 9 values: jest 942, e2e 358, total 1300, recorded at 483895b"
    verification:
      - kind: other
        ref: "node scripts/guards/test-count.mjs --jest jest-results.json (jest 942 + e2e 358 = 1300, OK)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Static visual evidence for the lightbox (LBOX-04 strip, LBOX-06 resting state of the morph pair) in lightbox/* and photo/*"
    requirement: LBOX-04
    verification:
      - kind: automated_ui
        ref: "playwright:lightbox/{375,768,1440}-visual-dark-linux.png, photo/{375,768,1440}-reduced-visual-dark-linux.png"
        status: pass
    human_judgment: true
    rationale: "The baselines prove stability, not that the strip and chrome look right; Tim gave no per-shot review notes"

duration: 1h 52m
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 13: Photo Surfaces Re-baseline, CI and Ratchet Summary

**Tim re-baselined every Phase 10 photo surface in one commit (483895b: 3 changed photos/* shots, 12 new). Before that, the first artifact showed the Linux renderer wrapping the wide map plate titles, which a Rule 1 fix closed (487e113: 256 px plates, nowrap lines, a six-width fit e2e). CI then passed twice on his commit, and the ratchet rose to 1300.**

## Performance

- **Duration:** about 1h 52m wall clock, most of it CI runs and Tim's replies
- **Started:** 2026-10-26T15:53:29Z
- **Completed:** 2026-10-26T17:45Z
- **Tasks:** 3 of 3
- **Files modified:** 23. Tim's commit has 15 PNGs. The rest: MapSheet.tsx, label-layout.ts, its test, e2e/photos.spec.ts, 10-UI-SPEC.md, test-count.baseline.json, 08-REVIEW-DISPOSITION.md and the 09 deferred-items.md.

## Tim's replies (literal)

Asked by the orchestrator by direct question on 2026-10-26.

| Point | Question | Tim's reply |
|-------|----------|-------------|
| Task 1 gate | Plain push to a new ci/10-13, fast-forward pushes of CI-fix commits, one visual dispatch, one `gh run rerun` of the CI run on his baseline commit | "approve (Recommended)" |
| Map plate overflow (first artifact) | How to fix the wide plates that overflow on the Linux renderer | "A: widen + nowrap (Recommended)". This also approved the fix's fast-forward push and exactly one more dispatch. Both were used. |
| Zoom drag exception | 10-10 prevents image drag-and-drop on the zoomed 1:1 photo, against UI-SPEC line 393 (LBOX-07, "no right-click or drag blocking") | "Keep, record exception (Recommended)" |
| Map clearance | The 10-08 reading of "12 px plus 4 px clearance" as a 16 px dot square | "16 px, as built (Recommended)" |
| Task 2 human-action | Review the shots, then commit and push the PNGs ("re-baselined" with review notes, or "unexpected") | "pushed" |

Tim accepted the baselines by committing and pushing them. His literal reply was "pushed", and he gave no review notes. He did not confirm the Task 2 step 4 checklist item by item, so those items stay open for UAT (see Open items).

## Accomplishments

- **One re-baseline for Phase 10.** Visual dispatch 40361285163 on 487e113 produced the shots. Tim committed and pushed them himself as `483895b` (15 PNGs: 3 modified, 12 added). `check-snapshot-commit --sha 483895b... --some --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow lightbox` reported OK (15 changed) and exit 0.
- **A Linux-only plate overflow, fixed before the baseline (Rule 1, `487e113`).** See Deviations.
- **CI green twice on Tim's SHA.** Run 40367226761: attempt 1 all green, and the one approved re-run (attempt 2) all green again. Visual Regression passed 96 of 96 both times, which shows the shots are deterministic.
- **Ratchet raised (`b73b101`).** Jest 725 to 942, e2e 241 to 358, total 966 to 1300, recorded at 483895b.
- **Review and deferred records current (`b73b101`).** WR-04 and IN-02 are fixed in 08-REVIEW-DISPOSITION.md. The 09 carousel flake and the removeChild error are resolved with their commits.

## CI runs

| Run | SHA | Event | Result |
|-----|-----|-------|--------|
| 40353801626 | 02423ed | push (plain, new ci/10-13) | Lint and Type Check, Unit Tests, Build, Security and E2E passed. Visual Regression failed on the 15 expected shots only. |
| 40355992655 | 02423ed | workflow_dispatch (visual-baselines, suite visual, update_mode changed) | success. In the artifact, the wide map plates overflowed: the Linux render wrapped the longest title inside the 224 px content box and pushed the altitude out of the plate at 768 and 1440. Not copied. |
| 40358734070 | 487e113 | push (fast-forward, the fix) | Every job passed except Visual Regression: E2E 554 passed, 0 flaky. Visual failed 30 (the 15 expected shots in both schemes) and passed 66, as expected before the re-baseline. |
| 40361285163 | 487e113 | workflow_dispatch (the one extra dispatch from "A: widen + nowrap") | success. Changed 3, new 12, unchanged 33. Against the first artifact, photos/768 and photos/1440 differ (the fix) and the other 13 are byte-identical. |
| 40367226761 attempt 1 | 483895b (Tim) | push (Tim's) | all green. Visual Regression 96 passed (job 121728086717). E2E 554 passed, 0 flaky (job 121728087176). Unit Tests, Lint and Type Check, Build and Security passed. |
| 40367226761 attempt 2 | 483895b (Tim) | the one approved `gh run rerun` | all green. Visual Regression 96 passed (job 121734699708). E2E 554 passed, 0 flaky (job 121734700519). Unit Tests, Lint and Type Check, Build and Security passed. |

Before waiting on each run, I checked that its headBranch was ci/10-13 and that its headSha matched. Before the re-run, HEAD, the reflog (`HEAD@{0}: commit: test(10-13): baselines for the Phase 10 photo surfaces`) and `git ls-remote origin refs/heads/ci/10-13` all agreed on 483895b386b8b53a5f060983538beed6d4e3ea67. The approved re-run is now used. Nothing else was pushed, dispatched or re-run.

## PNGs per slug against the plan's lists (483895b)

| Slug | Plan list | Result |
|------|-----------|--------|
| photos/375-reduced | expected changed | changed (same as the first artifact) |
| photos/768-reduced | expected changed | changed (differs from the first artifact: the plate fix) |
| photos/1440-reduced | expected changed | changed (differs from the first artifact: the plate fix) |
| photos-grid/{375,768,1440}-reduced | expected new | new (3) |
| photos-carousel/{375,768,1440}-reduced | expected new | new (3) |
| photo/{375,768,1440}-reduced | expected new | new (3) |
| lightbox/{375,768,1440} | expected new | new (3) |
| everything else (clix-cli, clix-website, contact, home x12, not-found, offline, projects, roadmap) | expected unchanged | unchanged: all 33 are byte-identical to HEAD, including home/* (only the waypoint href changed) and every footer (the sheet title from data/sheet.ts) |

No unexpected slug. Only the 15 PNGs above were copied, and Tim committed them. I never staged, committed or pushed a PNG.

## Task Commits

1. **Task 1: Tim's go-ahead.** Checkpoint, no commit. Reply: "approve (Recommended)".
2. **Task 2: CI, re-baseline, CI twice.**
   - `487e113` (fix, Rule 1): wide map plates hold their title on one line on every renderer.
   - `483895b` (test, **Tim's commit**): baselines for the Phase 10 photo surfaces.
3. **Task 3: ratchet and records.** `b73b101` (chore): raise the test-count ratchet at the Phase 10 close and record the closed review items.

**Plan metadata:** the docs commits for this SUMMARY and for STATE.md, ROADMAP.md and REQUIREMENTS.md.

## Files Created/Modified

- `e2e/visual/routes.spec.ts-snapshots/{photos,photos-grid,photos-carousel,photo,lightbox}/*.png` (15): the Phase 10 baselines. Tim committed them.
- `components/photos/MapSheet.tsx`: wide plate `w-64`; the title is `whitespace-nowrap` on the wide tier and the altitude is nowrap on both tiers. Adds the `data-map-title` and `data-map-altitude` hooks (487e113).
- `lib/photos/label-layout.ts`: `PLATE_WIDE` 256 x 48 (487e113).
- `lib/__tests__/photos-label-layout.test.ts`: the sweep and cascade cases at 256 px (487e113).
- `e2e/photos.spec.ts`: a new plate-fit case at 360/375/412/768/1024/1440. Each title and altitude line rect sits inside the plate's padding box, with one title line on the wide tier and at most two on the compact tier (487e113).
- `.planning/phases/10-photography/10-UI-SPEC.md`: the wide-plate width and measured fit, updated in three places (487e113).
- `scripts/guards/test-count.baseline.json`: jest 942, e2e 358, total 1300, commit 483895b (b73b101).
- `.planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md`: WR-04 and IN-02 fixed, open 10 -> 8 (b73b101).
- `.planning/phases/09-home-ascent/deferred-items.md`: the carousel-flake entry's "Resolved by" line names 10-07, 10-09 and 10-12, plus a removeChild line (b73b101).

## Task 3 records

- **Ratchet:** `npx jest --json --outputFile=jest-results.json --silent` (63 suites, 942 passed, 0 skipped or todo), then `node scripts/guards/test-count.mjs --jest jest-results.json --update`. Old: jest 725, e2e 241, total 966. New: jest 942, e2e 358, total 1300. A re-check without `--update` reports OK. `jest-results.json` is gitignored and not committed. The raised baseline is only local (b73b101 is not pushed), so the next CI push checks against 1300.
- **08-REVIEW-DISPOSITION.md:** `WR-04 | warning | fixed | 10-01 (formatExposureTime rule and tests): 6bb5fb6` and `IN-02 | info | fixed | 10-09 bridge removed (aa9dff6); 10-11 hotspot height shows approx. (d5b10f2)`. Both frontmatter entries are fixed and `open` is 8. The acceptance grep prints 2.
- **09-home-ascent/deferred-items.md:** 10-12 had already marked the carousel flake `status: resolved`. I reconciled that entry instead of adding a new one. Its "Resolved by" line now names 10-07 `ee46a53` (drei Html and the window key listener removed), 10-09 `aa9dff6` (legacy toggle and carousel deleted) and 10-12 `ebe0569` (console assertion across view switches). A new **removeChild error** line records the 07-19 carry-over as resolved by the same commits. It also notes that the assertion passed in CI E2E on run 40358734070 (and again on 40367226761, attempts 1 and 2).

### STATE carry-overs Phase 10 closed

- **removeChild error (07-19):** cause removed by 10-07 and 10-09, asserted away by 10-12.
- **"1 hotspots" plural (08-11):** 10-04 rewrote the test and 10-09 deleted `GalleryGrid.tsx`. The last step, the photos/* re-baseline, is Tim's 483895b.
- **The legacy modal's Tailwind v3 `bg-opacity-*` classes (07-19):** gone with `ImageDetailModal.tsx` (10-09 `aa9dff6`).
- **The legacy carousel's inline Three.js hex and `text-snow-200` (07-19):** gone with the legacy `components/PhotoCarousel3D.tsx` (10-09). The 10-07 carousel takes its colours from tokens (`ee46a53`).
- **Legacy image consumers (IN-08):** no app, components or lib file reads a manifest `.legacy` path, and a Jest guard holds that (10-09). Phase 12 can delete the 60 variant files.
- **WR-01 to WR-08:** WR-04 fixed by 10-01. The others were fixed and recorded by 10-02. Every WR row now reads fixed.
- **IN-02:** fixed and recorded (above).

## Decisions Made

- The wide plate is 256 px, not 240 px: an approved UI-SPEC deviation ("A: widen + nowrap (Recommended)"). The UI-SPEC records it in its sizes list and the plate row.
- The zoomed-photo drag prevention is a recorded exception to UI-SPEC line 393 (LBOX-07) ("Keep, record exception (Recommended)"). Right-click and saving are never blocked, and the fitted photo has no drag handling.
- The map clearance stays a 16 px dot square, as built ("16 px, as built (Recommended)").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wide map plates overflowed on the Linux renderer**
- **Found during:** Task 2 step 3 (first visual artifact, dispatch 40355992655 on 02423ed)
- **Issue:** The longest wide-tier title measures 221 px on Windows and about 234 px in the Linux CI render. The 240 px plate (224 px content box) wrapped it there, and the altitude line fell out of the 48 px plate at 768 and 1440. No local test caught it, because the local fonts render narrower.
- **Fix:** Wide plate 256 px (`w-64`, `PLATE_WIDE` 256 x 48), so the 240 px content box holds the title. The title is nowrap on the wide tier and the altitude is nowrap on both tiers. Compact plates keep their two-line titles. A new e2e checks the fit at six widths. The UI-SPEC is updated. Tim chose this option: "A: widen + nowrap (Recommended)".
- **Files modified:** components/photos/MapSheet.tsx, lib/photos/label-layout.ts, lib/__tests__/photos-label-layout.test.ts, e2e/photos.spec.ts, .planning/phases/10-photography/10-UI-SPEC.md
- **Verification:** the label sweep (312-1100 px) and cascade tests pass. The plate-fit e2e passes in CI (run 40358734070, and 40367226761 attempts 1 and 2). In the second artifact (40361285163), photos/768 and photos/1440 hold the plates.
- **Committed in:** 487e113

---

**Total deviations:** 1 auto-fixed (Rule 1). The fast-forward push of the fix and the second dispatch were covered by Tim's replies.
**Impact on plan:** The fix is required for correct baselines. It changes one component's size by 16 px, with Tim's approval. No scope creep.

## Issues Encountered

- None blocking. Both attempts on Tim's commit were green on the first try. No flaky test in either E2E run.

## Deploy note

The service worker serves cached HTML stale-while-revalidate (RESEARCH Runtime State Inventory). After the deploy, a returning visitor may see the old /photos (the legacy gallery) once, and gets the new page on the next load. Check /photos after one reload on the production build.

## Open items for UAT (Phase 10)

- **The Task 2 step 4 review checklist** (photos map, photos-grid, photos-carousel, photo, lightbox). Tim committed the PNGs with "pushed" and gave no per-item notes.
- **Real Safari and touch checks.** These cover the lightbox Tab wrap (A1), zoom with drag pan, and native pinch on top of zoom. Local Playwright WebKit cannot hydrate localhost, because of the CSP `upgrade-insecure-requests` header (10 deferred item), and CI runs no WebKit. WINDOWS #3 (`unrun-verify`, the 10-12 E5 Tab-wrap leg in WebKit) stays open until Tim's real-Safari check.
- **The 3D carousel and stepper look at 1280 and 375** (10-07 D7): the 3D framing and scene colours, and the stepper and controls on a phone.
- **The 1024 x 768 hotspot key** (10-11 D9): the two key rows, and an open row's panel even more, shrink the photo at that size. That follows the UI-SPEC composition, but Tim should look at it.
- **The opener-to-2560 progressive paint on a slow connection** (10-10).
- **Local dev-server flakes** in the 10 deferred-items.md (5 open entries: the cold-route race, lost interception after hot reloads, cross-talk on G3, the stepper reset). They are local only, and CI uses the production build.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- All 13 Phase 10 plans have SUMMARYs. The phase is ready for the orchestrator's verification and UAT.
- ci/10-13 is at 483895b. `b73b101` (ratchet and records) and the docs commits are local on gsd/phase-10-photography and not pushed. No push was approved in this leg.
- Phase 12 can delete the 60 legacy variant files (IN-08), now that no consumer is left.

---
*Phase: 10-photography*
*Completed: 2026-10-26*

## Self-Check: PASSED

- Files: this SUMMARY, scripts/guards/test-count.baseline.json, components/photos/MapSheet.tsx and the new lightbox/ and photo/ PNGs exist.
- Commits: 487e113, 483895b and b73b101 (and the cited 6bb5fb6, aa9dff6, d5b10f2, ee46a53, ebe0569) are ancestors of HEAD. `git rev-list --count 02423ed..b73b101` is 3.
- Acceptance checks:
  - `check-snapshot-commit --sha 483895b... --some --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow lightbox`: OK (15 changed), exit 0.
  - `check-visual-run --sha 483895b...` (Visual Regression) and `--job "E2E Tests"`: PASS on run 40367226761 attempt 1 and on the re-run (attempt 2). Unit Tests and Lint and Type Check succeeded on both attempts.
  - `test-count.mjs --jest jest-results.json`: jest 942 + e2e 358 = 1300, OK. Ratchet above 725 / 241 / 966.
  - `grep -cE "^\| (WR-04|IN-02) \| (warning|info) \| fixed" 08-REVIEW-DISPOSITION.md`: 2.
