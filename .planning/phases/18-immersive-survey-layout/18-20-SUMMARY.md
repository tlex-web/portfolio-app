---
phase: 18-immersive-survey-layout
plan: 20
subsystem: testing
tags: [visual-regression, re-baseline, d-24, d-23, d-26, photo-viewer, lightbox, share, webkit, ci]
status: complete

requires:
  - phase: 18-14
    provides: "D-24 round 3 baselines (Tim's 8944359), so round 4 builds on the region shots and proves them unchanged"
  - phase: 18-15
    provides: "Region stepping and the 'n / 7' counter"
  - phase: 18-17
    provides: "The 'Back to <region>' link and the breadcrumb trail"
  - phase: 18-18
    provides: "The LV95 line and the viewer's ShareButton (Copy link)"
  - phase: 18-19
    provides: "stageSizes for the stage (no derivative change in the shots)"
provides:
  - "D-24 round 4 of 5: the six viewer shots photo/{375,768,1440}-reduced and lightbox/{375,768,1440}, committed by Tim as e0c8e3ade7d2446125b1f95e78b873d2addf6a17; the other 70 PNGs proven byte-identical in both dispatches"
  - "Share in the viewer's top control bar from the key tier (768 and up): icon-only below 1024 px, labelled from 1024, failure shown as an overlay panel under the bar; the scroll tier keeps the strip's Share row (Tim's 'Compact the strip first' answer)"
  - "UI-SPEC Contract 4 amended for the bar Share (e10bbd7)"
  - "B8 poster contrast rows carry a 60 s budget for CI WebKit (fdbf275)"
  - "CI OK success on Tim's commit (run 45832741899, attempt 1, no re-run); check-visual-run PASS; check-snapshot-commit --some --allow photo --allow lightbox OK (6 changed)"
affects: [18-21, 18-22, 18-25, 18-29]

actuals:
  tokens: 12990    # chars/4 over git diff 6fa3235..e0c8e3a (51,955 chars; the six PNGs count as binary-diff lines only and are Tim's)
  tasks: 3
  commits: 6       # git rev-list --count 6fa3235..e0c8e3a = 6: five agent commits (fdbf275, aa5c437, 212f4f5, 66d6be4, e10bbd7) and Tim's PNG commit e0c8e3a; the metadata commits follow
plan_head_before: 6fa3235ca94e86fc4a1bcc80fcfff28b44c7823d
plan_head_after: e0c8e3ade7d2446125b1f95e78b873d2addf6a17

tech-stack:
  added: []
  patterns:
    - "A control that does not fit a fixed bar at one tier gets a second instance in the tier that has room; CSS shows exactly one per tier (the hidden one is display: none, out of the tab order and the accessibility tree)"
    - "Failure feedback for a control in a fixed-height bar is an absolute overlay anchored to the bar, so nothing in the bar or the stage moves"
    - "A slow-but-correct CI WebKit row gets its own test.setTimeout, never a longer wait or a skip tag"
    - "A pointer test in WebKit clicks at whole pixels (WebKit floors clientX)"

key-files:
  created: []
  modified:
    - components/photos/ShareButton.tsx
    - components/photos/PhotoViewer.tsx
    - components/photos/ExifStrip.tsx
    - components/photos/__tests__/share-button.test.tsx
    - components/photos/__tests__/photo-viewer.test.tsx
    - components/photos/__tests__/strip.test.tsx
    - e2e/photos-lightbox.spec.ts
    - e2e/home-modes.spec.ts
    - .planning/phases/18-immersive-survey-layout/18-UI-SPEC.md
    - "e2e/visual/routes.spec.ts-snapshots/photo/{375,768,1440}-reduced-visual-dark-linux.png and lightbox/{375,768,1440}-visual-dark-linux.png (Tim's commit e0c8e3a)"

key-decisions:
  - "18-20: D-24 round 4 (photo page and lightbox) re-baselined: 6 changed, 70 identical in both dispatches; Tim committed the six PNGs as e0c8e3a"
  - "18-20 (Tim, round-A checkpoint, 'Compact the strip first (Recommended)'): Share moves into the viewer's top control bar from the key tier, plus one more dispatch; nothing else widened"
  - "18-20: bar Share is icon-only below 1024 px (a labelled Share overflows the photo page's bar at 768 by 14 px) and labelled from 1024 with lg:min-w-40 so the copy/share swap shifts nothing; it always carries an aria-label"
  - "18-20: the scroll tier (below 768 or under 640 px tall) keeps the strip's Share row: the 375 lightbox bar has 39 px free and a fifth 44 px target needs 52"
  - "18-20: bar Share failure uses failurePlacement='overlay', a panel under the bar; every bar control and the photo box are pixel-identical before and after a failed copy"
  - "18-20: B8 poster rows get test.setTimeout(60000) for CI WebKit; the whole CI WebKit leg ran about 1.43x slower per test since 18-14 with no app cause"

requirements-completed: []  # LBOX-09, PHOTO-07 and PHOTO-08 are also declared by 18-29, still open; left Pending for the last carrier and the phase verifier (same practice as 18-18 and 18-19)

coverage:
  - id: D1
    description: "Photo page and lightbox shots at 375, 768 and 1440 baselined on the redesigned viewer and passing in CI on Tim's commit; every other baseline byte-identical"
    requirement: "LBOX-09"
    verification:
      - kind: automated_ui
        ref: "e2e/visual/routes.spec.ts photo @<w> reduced and lightbox @<w> (CI run 45832741899, Visual Regression 152 passed)"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha e0c8e3ade7d2446125b1f95e78b873d2addf6a17 --wait 30"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha e0c8e3ade7d2446125b1f95e78b873d2addf6a17 --some --allow photo --allow lightbox"
        status: pass
    human_judgment: false
  - id: D2
    description: "Share in the viewer's top bar from 768 (icon-only below 1024, labelled from 1024), in the strip on the scroll tier, failure as an overlay panel; focus kept across steps"
    requirement: "PHOTO-07"
    verification:
      - kind: unit
        ref: "components/photos/__tests__/share-button.test.tsx; components/photos/__tests__/photo-viewer.test.tsx; components/photos/__tests__/strip.test.tsx"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts 'Share in the viewer bar (18-20; PHOTO-07)' (CI run 45832741899, three engines)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The photo page at 1440 is 855x583 (912x622 before 18-15) and at 768 is unchanged at about 668x455; the remaining gap is 18-17's breadcrumb row"
    verification: []
    human_judgment: true
    rationale: "A layout trade-off Tim accepted by committing the PNGs; whether to shorten the trail row is a design call for a later plan"

metrics:
  duration: "about 17 h 33 min wall clock (20:40Z 2026-11-25 to 14:14Z 2026-11-26), including six CI runs, two dispatches, the round-A checkpoint, the compact-strip fix and the overnight wait for Tim's commit"
  completed: 2026-11-26
---

# Phase 18 Plan 20: D-24 re-baseline round 4 (photo page and lightbox) Summary

**The redesigned photo viewer is baselined alone: six photo and lightbox PNGs (back link, trail, LV95 line, Share in the top bar from 768, counter n / 7), with the other 70 proven byte-identical in both dispatches. Tim committed the six PNGs as e0c8e3a, and CI OK concluded success on it on the first attempt.**

Round A's artifact showed the strip's new Copy link row shrinking the photo at 768 and 1440. At the checkpoint Tim chose "Compact the strip first", so Share moved into the viewer's top control bar from the key tier (aa5c437 RED, 212f4f5 fix, 66d6be4 WebKit test fix, e10bbd7 UI-SPEC). One more dispatch followed. CI WebKit also needed a 60 s budget for the B8 poster rows (fdbf275). **The agent committed no PNG.**

## Performance

- **Duration:** about 17 h 33 min wall clock (most of it the two waits for Tim)
- **Started:** 2026-11-25T20:40:47Z
- **Completed:** 2026-11-26T14:14Z
- **Tasks:** 3 of 3
- **Files modified:** 15 (9 text files by the agent, 6 PNGs by Tim)

## Progress

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Local gate, push ci/18-20, CI red only on the six declared shots (tracer) | Done | fdbf275 (B8 budget). CI runs 45697912592 (plus one re-run), 45706526489 |
| 2 | The declared dispatch, download, byte compare | Done | none (agent commits no PNG); dispatch 45710469185 (round A) |
| 3 | Tim reviews, commits and pushes; agent verifies CI on his commit | Done: round A answered "Compact the strip first", round B answered "pushed" | aa5c437, 212f4f5, 66d6be4, e10bbd7; dispatch 45718245871 (round B); Tim's e0c8e3a; CI run 45832741899 |

## Preconditions (20:40Z)

- `git ls-remote origin refs/heads/ci/18-20` printed nothing.
- 8944359 (Tim's 18-14 PNG commit) is an ancestor of HEAD 6fa3235, and so are 48963a9 and c24568d.

## Task 1: local gate

| Gate | Result |
|------|--------|
| `npm run lint` | exit 0 (test-count scan OK) |
| `npm run type-check` | exit 0 |
| `npx jest` | 131 suites / 2,772 tests passed |
| `PW_PROD=1 npx playwright test` photos-lightbox, photos-stepping, photos-region, keyboard, seo, `--project=chromium --project=firefox` | 514 passed (1.5 min), 0 failed, 0 flaky; `public/service-worker.js` restored; port 3000 free afterwards |
| `check-snapshot-commit --sha <c> --none` for each of the 29 commits 8944359..6fa3235 | all "OK (0 changed)" |

## Task 1: push and CI

- 20:44:54Z `git push origin HEAD:refs/heads/ci/18-20`, a new branch with a plain push. `git ls-remote` = HEAD = 6fa3235ca94e86fc4a1bcc80fcfff28b44c7823d.

### CI run 45697912592 (headSha 6fa3235), attempt 1

https://github.com/tlex-web/portfolio-app/actions/runs/45697912592

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 20:45:02 | 20:45:08 | 0.1 |
| Dependency Review | skipped | | | 0 |
| Security Audit | success | 20:45:10 | 20:46:15 | 1.1 |
| Unit Tests | success | 20:45:10 | 20:46:34 | 1.4 |
| Lint and Type Check | success | 20:45:10 | 20:48:40 | 3.5 |
| Build Application | success | 20:48:43 | 20:49:34 | 0.9 |
| Visual Regression | failure (expected) | 20:45:11 | 20:51:05 | 5.9 |
| E2E Tests (chromium) | success | 20:45:11 | 21:00:05 | 14.9 |
| E2E Tests (firefox) | success | 20:45:11 | 20:57:08 | 12.0 |
| E2E Tests (webkit) | failure (B8) | 20:45:10 | 21:10:15 | 25.1 |
| CI OK | failure | 21:10:18 | 21:10:26 | 0.1 |

- **Visual Regression: 12 failed, 140 passed.** The 12 are exactly the six declared titles in both schemes, and each is a `toHaveScreenshot` pixel diff (no timeout and no error): `photo @375 reduced` 375x1666 -> 375x1818, 151,401 px; `photo @768 reduced` 310,677; `photo @1440 reduced` 328,685; `lightbox @375` 3,389; `lightbox @768` 447,350; `lightbox @1440` 518,362. The counts are identical in visual-dark and visual-light.
- E2E: chromium 750 passed, firefox 651 passed, webkit 655 passed and 1 failed. The failure is `home-modes.spec.ts:610` B8 "poster at 1440 x 900", a 30 s test timeout in `scrollIntoViewIfNeeded` on all 3 tries. It has the flake shape of 18-01 and 18-04, and Home code is untouched by 18-15..18-19.
- **Watch item from 18-16 is clean.** Every `@no-win-webkit` row ran in CI WebKit and none failed: the stepping tracer, the LBOX-08 close-after-step rows, the lightbox history rows and the region lightbox-Back rows. This is the first CI WebKit run of the 18-15..18-19 viewer.
- **One allowed re-run:** `gh run rerun 45697912592 --failed` at 21:11:24Z. In attempt 2, Visual failed on the same 12 shots and **WebKit failed again on B8** (25m13s), so the plan's rule applied: diagnose and fix.

### B8 diagnosis

- **It is a time budget, not a hang.** Each poster row samples 25 tick labels with a clipped screenshot each:

| Row (CI WebKit) | 18-14 run 45648612139 | 18-20 attempt 2 |
|-----------------|-----------------------|-----------------|
| poster 768 x 1024 | 14.2 s | 21.9 s |
| poster 1023 x 900 | 15.8 s | 24.3 s |
| poster 1280 x 900 | 17.2 s | 29.5 s (passed) |
| poster 1440 x 900 | 20.3 s | timed out at sample 23-24 of 25 |

- Every sampled contrast was 7.9-8.3:1 against the 4.5:1 gate, so the contract holds.
- The whole WebKit leg ran slower, not only Home. Across the 564 tests that passed in both reports the duration ratio was 1.44, about the same in every spec file (1.24-1.61, including files unchanged since 18-14) and across the run order. The runner image was the same. Chromium and Firefox were not slower.
- **Fix fdbf275:** `test.setTimeout(60000)` on the four poster rows, the way the live-canvas rows beside them carry 180 s. No wait was lengthened, no tag was added and Home code is unchanged. Gates: e2e tsc 0, eslint 0, the 12 poster rows passed locally in three engines, and check-snapshot-commit --none OK.
- Fast-forward push 6fa3235..fdbf275 at 21:40:38Z.

### CI run 45706526489 (headSha fdbf275)

https://github.com/tlex-web/portfolio-app/actions/runs/45706526489

| Job | Conclusion | Minutes |
|-----|-----------|---------|
| Classify / Security / Unit / Lint / Build | success | 0.1 / 1.0 / 1.6 / 2.6 / 1.6 |
| Visual Regression | failure (expected; the same 12) | 4.8 |
| E2E Tests (chromium) | success, 750 passed | 17.2 |
| E2E Tests (firefox) | success, 651 passed | 15.3 |
| E2E Tests (webkit) | **success**, 656 passed | 23.8 |
| CI OK | failure (Visual only) | 0.1 |

- B8 on WebKit passed at 21.7 / 24.3 / 29.3 / 32.8 s inside the 60 s budget. The pixel counts in all three Visual runs were the same (deterministic).
- **Task 1 verify PASS:** the latest CI run on ci/18-20 had every E2E leg and Unit Tests at success.

## Task 2: the declared dispatch (round A)

- 22:07:17Z `gh workflow run visual-baselines.yml --ref ci/18-20 -f suite=visual -f update_mode=changed` started run **45710469185**. Before the wait it was confirmed as headBranch `ci/18-20`, headSha fdbf2756c924c3145995d4545388b949f5872ff0, event `workflow_dispatch`. It concluded success in 3.7 min. https://github.com/tlex-web/portfolio-app/actions/runs/45710469185
- The artifact was downloaded into the new, empty `dl-18-20` (76 files) and compared with HEAD by `tools-18-20/compare.cjs`, which is kept outside that directory: `files=76 changed=6 identical=70 new=0 nonLinux=0 missingFromArtifact=0`, `VERDICT: OK (6 declared changed, all others identical)`.
- These folders are identical: home 12, region 24, photos 3, photos-grid 3, photos-carousel 3, sources 3, box 3, coin-flip 3, contact 3, not-found 3, offline 3, projects 3, roadmap 3 and menu 1. Only photo 3 and lightbox 3 changed. The 24 byte-identical region shots also prove that the post-18-18 inline-icon Share renders the same as Phosphor's.
- Only the six changed PNGs were copied in, each `cmp`-matched to the artifact. The Task 2 verify passed, and nothing was staged.

### Round A per-shot table

| Shot | Size old -> new | What changed | Cause |
|------|-----------------|--------------|-------|
| photo/375-reduced | 375x1666 -> 375x1818 | 'Back to Zermatt'; counter 4 / 7 with Next enabled; trail above the h1; LV95 line with ≈; 'Copy link' row; photo unchanged | 18-15, 18-17, 18-18 |
| photo/768-reduced | 768x1682 | the same text changes; 'Esc back to Zermatt'; strip 273 -> 325 px, **photo about 744x507 -> 668x455** | 18-15, 18-17, 18-18 |
| photo/1440-reduced | 1440x1558 | the same text changes; strip about 80 px taller, **photo 912x622 -> 796x541** | 18-15, 18-17, 18-18 |
| lightbox/375 | 375x900 | 1 / 7; LV95 line (exact, no ≈); 'Copy link' row; no trail in the dialog | 18-15, 18-18 |
| lightbox/768 | 768x900 | 1 / 7; LV95; the photo keeps 757x505 and moves up 34 px | 18-15, 18-18 |
| lightbox/1440 | 1440x900 | 1 / 7; LV95; **photo about 996x663 -> 909x605** | 18-15, 18-18 |

- Nothing was wrong: the counters were right, LV95 appeared only on the Swiss photos, there was no share-failure UI and no clipped strip, and there was no derivative change from 18-19. The smaller photo at 768 and 1440 went to Tim for judgment.

## Task 3: round-A checkpoint and the compact-strip fix

- Tim answered **"Compact the strip first (Recommended)"**: Share moves into the viewer's top control bar, then round 4 re-runs with one more dispatch. Nothing else was widened. The round-A copies were never committed and were cleared with `git checkout -- e2e/visual/routes.spec.ts-snapshots/photo e2e/visual/routes.spec.ts-snapshots/lightbox`.

### The bar, measured first (fdbf275, Chromium prod, 900 px high)

| Surface @ width | Left | Right | Free | Labelled Share (168 + 8) | Icon-only Share (44/54 + 8) |
|-----------------|------|-------|------|--------------------------|-----------------------------|
| lightbox @375 | 146 | 148 | 39 | overflows | **overflows by 13** |
| page @375 | 146 | 96 | 91 | overflows | fits |
| page @768 | 304.7 | 259 | 162 | **overflows by 14** | fits |
| lightbox @768 | 146 | 375.9 | 204 | fits | fits |
| 1440, both | | | 800+ | fits | fits |

### The choice

- **From the key tier (768 and up), Share is a bar control** after Zoom and before Close. It is icon-only below 1024 px and labelled from 1024 (`lg:min-w-40` holds 'Share photo', so the copy/share swap shifts nothing). It always has an aria-label ('Copy link to this photo' or 'Share photo').
- **On the scroll tier, the strip keeps its Share row.** The 375 lightbox bar has no room for a fifth 44 px target, and on that tier the photo is sized by width and 70svh, so the row costs the photo nothing. There are two ShareButton instances and CSS shows one per tier; the hidden one is display: none.
- **Failure placement: `failurePlacement="overlay"`**, a bordered panel on `bg-gallery` under the bar's right edge. In Chromium at 768 and 1440 on both surfaces, every bar control and the photo box are pixel-identical before and after a failed copy, and the URL is shown on one line and selected.
- **Focus:** the order is Zoom, Share, Close. The bar Share stays mounted across steps, so the arrow keys keep focus on it. Stepping onto the end card removes it, and focus moves to Next photo (PhotoViewer's swap rule counts the bar Share).
- ui-ux-pro-max searches were used: icon-context-accessibility (the aria-label), Content Jumping (the reserved label width and the overlay instead of an inserted row), Overflow Hidden (every width measured, with scrollWidth <= clientWidth rows in e2e), Error Recovery (the selected URL under the button), plus touch-target-size, touch-spacing and focus-not-obscured.

### Photo size after the fix (Chromium prod, 900 px high; Firefox and WebKit within 2 px)

| Shot | Pre-18-15 | Round A | After the fix | Against the original |
|------|-----------|---------|---------------|----------------------|
| photo page 1440 | 912 x 622 | 796.6 x 543 | **855.3 x 583** | -39 px (-6.3% per side) |
| lightbox 1440 | ~996 x 663 | 910.3 x 607 | **998 x 665.5** | fully regained |
| photo page 768 | ~744 x 507 | 667.5 x 455 | 667.5 x 455 | -52 px (-10.3% per side) |
| lightbox 768 | ~757 x 505 | 758 x 505.4 | 758 x 505.4 | same (width-bound) |
| photo page / lightbox 375 | scroll tier | 365 x 248.8 / 243.4 | unchanged | same |

- At 768 the photo page's strip is as tall as its identity column (292 px either way), so moving Share regains nothing. At 1440 the remaining 39 px is the trail row from 18-17 (D-10). That row was outside what Tim authorised and was flagged to him.

### Tests (rewritten, none deleted)

- Jest: `share-button.test.tsx` gained 3 rows. `photo-viewer.test.tsx`'s 18-18 describe went from 3 rows to 10 (bar placement and order, Copy link from bar and strip, the end card drops both, focus kept across a step, focus to Next onto the card). `strip.test.tsx` now asserts the scroll-tier classes. RED was confirmed: 3 + 8 rows failed before the fix.
- e2e `photos-lightbox.spec.ts`: the end-card row now targets the bar button, and a new describe 'Share in the viewer bar (18-20; PHOTO-07)' has 11 rows. All 43 passed in Chromium, Firefox and local WebKit.
- Local gate after the fix: lint 0, type-check 0, e2e tsc 0, `npx jest` 131 suites / **2,782** tests (+10), GUARD-03 3,611 against the 3,024 baseline OK. The prod run of five specs in three engines had 758 passed and 0 failed after 66d6be4. check-snapshot-commit --none OK on aa5c437, 212f4f5, 66d6be4 and e10bbd7.

## Task 3: round B (the one extra dispatch)

- 22:41:02Z fast-forward push fdbf275..e10bbd7. `git ls-remote` = HEAD = e10bbd700a155bc005da4a0478c676c4667e3462.

### CI run 45715317406 (headSha e10bbd7)

https://github.com/tlex-web/portfolio-app/actions/runs/45715317406

| Job | Conclusion | Minutes |
|-----|-----------|---------|
| Classify / Security / Unit / Lint / Build | success | 0.3 / 1.0 / 1.4 / 3.4 / 1.6 |
| Visual Regression | failure (expected; the same 12 titles) | 5.8 |
| E2E Tests (chromium) | success, 761 passed | 15.1 |
| E2E Tests (firefox) | success, 662 passed | 11.6 |
| E2E Tests (webkit) | success, 667 passed | 20.4 |
| CI OK | failure (Visual only) | 0.1 |

- There was no re-run. Each engine ran 11 more rows, the new bar describe. The two 375 shots failed with round A's pixel counts, as expected.

### Dispatch 45718245871

- 23:02:54Z `gh workflow run visual-baselines.yml --ref ci/18-20 -f suite=visual -f update_mode=changed` was confirmed as headBranch `ci/18-20`, headSha e10bbd7 (the green tip), event `workflow_dispatch`. It concluded success in 3.9 min. https://github.com/tlex-web/portfolio-app/actions/runs/45718245871
- The artifact went into the new, empty `dl-18-20b` and was compared against HEAD: `files=76 changed=6 identical=70 new=0 nonLinux=0 missingFromArtifact=0`, `VERDICT: OK (6 declared changed, all others identical)`. The 24 region shots were byte-identical again.
- photo/375-reduced and lightbox/375 are byte-identical to round A, because the scroll tier keeps the strip Share. The four shots at 768 and 1440 differ.
- The six PNGs were copied in and `cmp`-matched, with nothing staged.

### Round B per-shot table (against the pre-18-15 baselines)

| Shot | What B shows | Against round A |
|------|--------------|-----------------|
| photo/375-reduced | 'Back to Zermatt', 4 / 7, the trail, LV95, the Copy link row in the strip; 152 px taller | identical |
| photo/768-reduced | the same text, 'Esc back to Zermatt', **an icon-only link button after Zoom in the bar**, no Share row in the strip; photo about 668x455 | Share left the strip; photo unchanged |
| photo/1440-reduced | **'Copy link' labelled in the bar after Zoom**; photo about 856x583 | strip 40 px shorter, photo 40 px taller |
| lightbox/375 | 1 / 7, LV95, the Copy link row; no trail | identical |
| lightbox/768 | **an icon-only link button between Zoom and Close**; photo 757x505 with the original letterbox bands | Share left the strip; photo re-centred |
| lightbox/1440 | **'Copy link' labelled between Zoom and Close**; photo about 998x665 (fully regained) | strip 60 px shorter, photo 58 px taller |

- These went to Tim for judgment and are not defects against the plan: (1) the photo page at 768 regains nothing and at 1440 stays 39 px short, because the 18-17 trail row sets the strip; (2) at 768 the bar Share is icon-only beside the labelled Hide labels and Zoom; (3) on phones Share stays in the strip.

## Task 3: Tim's commit and CI on it

- Tim replied **"pushed"**. His commit is **e0c8e3ade7d2446125b1f95e78b873d2addf6a17** "test(18): re-baseline photo page and lightbox (LBOX-09, PHOTO-07, PHOTO-08, D-09, D-10)", author tlex-web. It contains exactly the six PNGs: lightbox/{375,768,1440}-visual-dark-linux.png and photo/{375,768,1440}-reduced-visual-dark-linux.png. **The agent committed no PNG.**
- Re-checked at 13:50Z on 2026-11-26: `git rev-parse HEAD` = `git ls-remote origin refs/heads/ci/18-20` = e0c8e3ade7d2446125b1f95e78b873d2addf6a17, with the phase branch checked out.

### CI run 45832741899 (headSha e0c8e3a, push, attempt 1)

https://github.com/tlex-web/portfolio-app/actions/runs/45832741899

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 13:48:35 | 13:48:44 | 0.2 |
| Dependency Review | skipped | | | 0 |
| Security Audit | success | 13:48:52 | 13:49:50 | 1.0 |
| Unit Tests | success | 13:48:47 | 13:50:18 | 1.5 |
| Lint and Type Check | success | 13:48:47 | 13:51:40 | 2.9 |
| Build Application | success | 13:51:43 | 13:53:17 | 1.6 |
| Visual Regression | **success**, 152 passed (3.7 min) | 13:48:47 | 13:54:14 | 5.5 |
| E2E Tests (chromium) | success, 761 passed (14.7 min) | 13:48:47 | 14:05:12 | 16.4 (16m25s) |
| E2E Tests (firefox) | success, 662 passed (11.2 min) | 13:48:47 | 14:01:38 | 12.9 (12m51s) |
| E2E Tests (webkit) | success, 667 passed (22.6 min) | 13:48:47 | 14:13:07 | 24.3 (24m20s) |
| **CI OK** | **success** | 14:13:10 | 14:13:16 | 0.1 |

- Attempt 1, no re-run, no flaky rows.
- `node scripts/ci/check-visual-run.mjs --sha e0c8e3ade7d2446125b1f95e78b873d2addf6a17 --wait 30` printed `PASS https://github.com/tlex-web/portfolio-app/actions/runs/45832741899/job/139953581529` (exit 0).
- `node scripts/ci/check-snapshot-commit.mjs --sha e0c8e3ade7d2446125b1f95e78b873d2addf6a17 --some --allow photo --allow lightbox` printed `snapshot-commit: OK (6 changed)` (exit 0).

## D-26: E2E leg minutes on ci/18-20

| Run | chromium | firefox | webkit |
|-----|----------|---------|--------|
| 45697912592 attempt 1 (6fa3235) | 14.9 | 12.0 | 25.1 (B8 fail) |
| 45697912592 attempt 2 (re-run) | | | 25.2 (B8 fail) |
| 45706526489 (fdbf275) | 17.2 | 15.3 | 23.8 |
| 45715317406 (e10bbd7) | 15.1 | 11.6 | 20.4 |
| 45832741899 (e0c8e3a) | 16.4 | 12.9 | 24.3 |

- The longest leg was **webkit at 25m13s**, under the 35 min trip-wire, so no shard proposal is needed. Watch note: CI WebKit now runs 20-25 min against 15.7-18.6 at 18-14. That comes from about 1.43x per test with no app cause, plus 63 more WebKit rows.

## Client JS

- **1,868,150 B in 25 files** (production build of 22:26Z, source identical to e10bbd7; Tim's commit adds only PNGs). That is +1,214 B over 18-19's 1,866,936: the bar instance of ShareButton, its 'chrome' look and the overlay classes. It is **+12,309 B over the 1,855,841 B cap**, which is enforced at 18-25.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, test] B8 poster rows timed out on CI WebKit**
- **Found during:** Task 1
- **Issue:** the four poster contrast rows ran slower than the default 30 s test timeout in CI WebKit (the whole leg runs about 1.43x slower per test since 18-14). Contrast was 7.9-8.3:1 throughout. The one allowed re-run did not clear it.
- **Fix:** `test.setTimeout(60000)` on the four rows. This is pixel-neutral, and no wait or tag was added.
- **Files modified:** e2e/home-modes.spec.ts
- **Verification:** CI runs 45706526489, 45715317406 and 45832741899 all passed WebKit (1440 row at 32.8 s)
- **Committed in:** fdbf275

**2. [Rule 1 - Bug, test] The WebKit zoom row's sub-pixel click**
- **Found during:** Task 3 (local gate after the compact-strip fix)
- **Issue:** `Zoom (D-06) › a click zooms at the point…` failed in local WebKit 3 of 3 (2.0078 px against 2). WebKit floors clientX, and the resized stage put the photo centre at x.99, which the 1:1 scale magnified.
- **Fix:** the row clicks at a rounded point and expects the clicked column scaled to 1:1. The tolerance stays 2 px.
- **Files modified:** e2e/photos-lightbox.spec.ts
- **Verification:** 9 of 9 in three engines locally; CI green
- **Committed in:** 66d6be4

### Scope added by Tim

**3. [Checkpoint decision] Share moves into the viewer's top control bar (aa5c437 RED, 212f4f5 fix, e10bbd7 UI-SPEC Contract 4)**
- Tim answered "Compact the strip first (Recommended)" at the round-A checkpoint, and that authorised one more dispatch. See "Task 3: round-A checkpoint" above.
- **Files modified:** components/photos/ShareButton.tsx, PhotoViewer.tsx, ExifStrip.tsx, their three Jest files, e2e/photos-lightbox.spec.ts, 18-UI-SPEC.md

### Recorded

**4. One re-run** of 45697912592 (`gh run rerun --failed`, attempt 2). It did not clear B8, so fix 1 followed. No re-run was needed on Tim's commit.

---

**Total deviations:** 2 auto-fixed (both Rule 1, test-side), 1 scope addition by Tim, 1 recorded re-run.
**Impact on plan:** both auto-fixes are test-only and pixel-neutral. The scope addition was Tim's explicit choice and cost one extra dispatch.

**D-23 ledger:** ci/18-20 was created by a plain push (6fa3235), then fast-forwarded twice (fdbf275, e10bbd7); Tim pushed e0c8e3a. There was one re-run and two dispatches (round A 45710469185, and round B 45718245871, which Tim authorised). Nothing was force-pushed, the phase branch and main were not pushed, and the agent committed no PNG.

## Issues Encountered

- A local-only WebKit flake: `photos-region.spec.ts:1785` Escape on the Ortler photo page failed once in a full local run, then passed 6 of 6 alone and in the next full run. It is a local-load race and was not touched. CI WebKit passed it on every run.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- The viewer is baselined, so D-24 round 5 (the overview) can build on it.
- For Tim: the photo page at 1440 is still 39 px short of the original because of the 18-17 trail row, and at 768 the bar Share is icon-only. Both are accepted with e0c8e3a and could be revisited in a later plan.
- Client JS is +12,309 B over the cap, which falls to 18-25.
- CI WebKit runs 20-25 min per leg, under the trip-wire but worth watching as rows grow.

## Self-Check: PASSED

- Commits found in HEAD's history: fdbf275, aa5c437, 212f4f5, 66d6be4, e10bbd7, e0c8e3a.
- Files found: components/photos/ShareButton.tsx, e2e/home-modes.spec.ts, e2e/photos-lightbox.spec.ts, and the six PNGs under e2e/visual/routes.spec.ts-snapshots/photo and lightbox.

---
*Phase: 18-immersive-survey-layout*
*Completed: 2026-11-26*
