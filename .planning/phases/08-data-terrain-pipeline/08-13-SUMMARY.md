---
phase: 08-data-terrain-pipeline
plan: 13
subsystem: testing
tags: [visual-regression, playwright, baselines, ci, determinism, test-count, ratchet, footer]

requires:
  - phase: 08-12
    provides: footer map-sheet margin (contour band, neatline ticks, true scale bar, swisstopo attribution) and the settle() wait for the strip mask
provides:
  - All nine routes' reduced full-page baselines (375, 768, 1440, dark Linux) re-baselined for the footer in one commit made by Tim (88191d0), containing only those 27 PNGs
  - Green CI twice on the same SHA 88191d0 (run 40127078488, attempts 1 and 2), so the footer renders deterministically
  - Test-count ratchet raised at Phase 8 close - jest 416, e2e 117, total 533 (was 107 / 99 / 206)
affects: [phase 09+, phase 12 cross-browser pass (Firefox 1 px stroke check carried over)]

actuals:
  tokens: 120
  tasks: 2
  commits: 2
plan_head_before: 6383e4020fcfd601754280e3d439cf6b53dbfaf3
plan_head_after: 74653ddfcc9da59a827196dc51ae55891c29144b

tech-stack:
  added: []
  patterns:
    - "Phase close: re-run the same CI run (gh run rerun) on the re-baselined SHA as a determinism backstop before raising the ratchet"
    - "Ratchet raised only via test-count.mjs --update, which refuses a lower total"

key-files:
  created: []
  modified:
    - scripts/guards/test-count.baseline.json
    - e2e/visual/routes.spec.ts-snapshots/{home,photos,projects,clix-cli,clix-website,roadmap,contact,offline,not-found}/{375,768,1440}-reduced-visual-dark-linux.png (27 files, committed by Tim)

key-decisions:
  - "Tim accepted the footer baselines by committing them as downloaded (88191d0, literal reply: pushed); no written review notes were given, so the review is recorded as accepted by commit, with the executor's UI-SPEC pre-check as the evidence reviewed"
  - "The Firefox 1 px stroke observation (Task 1 step 6) was not reported; it is carried to Phase 12's cross-browser pass as an open item instead of being assumed"
  - "Ratchet baseline commit field records 88191d0 (Tim's footer re-baseline, the Phase 8 SHA CI was green on twice)"

patterns-established:
  - "When a human checkpoint reply covers only part of what the plan asked for, the SUMMARY quotes the reply verbatim, marks the uncovered criterion partially met, and opens a todo instead of filling the gap"

requirements-completed: [SHELL-04]

coverage:
  - id: D1
    description: "All nine routes' footer baselines (27 reduced shots) re-baselined in one Tim-made commit containing only footer-driven PNG changes, reason in the body"
    requirement: SHELL-04
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow home --allow photos --allow projects --allow clix-cli --allow clix-website --allow roadmap --allow contact --allow offline --allow not-found (snapshot-commit: OK (27 changed), exit 0, HEAD=88191d0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CI green on 88191d0 across Visual Regression, E2E, Unit, Lint and Type Check, Build, Security Audit - twice on the same SHA (determinism)"
    requirement: SHELL-04
    verification:
      - kind: automated_ui
        ref: "node scripts/ci/check-visual-run.mjs --sha 88191d0 --wait 30 (attempt 1: PASS https://github.com/tlex-web/portfolio-app/actions/runs/40127078488/job/120970695675)"
        status: pass
      - kind: automated_ui
        ref: "gh run rerun 40127078488 then check-visual-run.mjs --sha 88191d0 --wait 30 (attempt 2: PASS https://github.com/tlex-web/portfolio-app/actions/runs/40127078488/job/120972165109)"
        status: pass
      - kind: e2e
        ref: "node scripts/ci/check-visual-run.mjs --sha 88191d0 --job \"E2E Tests\" --wait 30 (attempt 1 job 120970695591, attempt 2 job 120972165347, both PASS)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Footer reads correctly at 375/768/1440 (band lines, no frame line, ticks incl. dashed Riffelsee, scale bar and labels, item order, attribution wrap)"
    requirement: SHELL-04
    verification:
      - kind: manual_procedural
        ref: "executor sharp pre-check of home/photos/not-found x 375/768/1440 against 08-UI-SPEC (table below); Tim accepted by committing 88191d0"
        status: pass
    human_judgment: true
    rationale: "Visual judgment. Tim's only reply was 'pushed' (acceptance by commit, no notes), and the Firefox stroke check was not reported - a human should confirm at phase verification / Phase 12"
  - id: D4
    description: "Test-count ratchet raised at Phase 8 close above 206; --update refuses a lower total; no .skip/.only/.fixme"
    verification:
      - kind: other
        ref: "npx jest --json --outputFile=jest-results.json --silent && node scripts/guards/test-count.mjs --jest jest-results.json (jest 416 + e2e 117 = 533 (baseline 533), OK)"
        status: pass
      - kind: other
        ref: "node -e (b.total>206 && b.jest>107 && b.e2e>99) -> ratchet 416 117 533"
        status: pass
    human_judgment: false

duration: 26min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 13: Footer Re-baseline, CI Determinism and Test-Count Ratchet Summary

**All nine routes' footer baselines re-baselined by Tim in one 27-PNG commit (88191d0), CI green twice on that same SHA, and the test-count ratchet raised from 206 to 533 (jest 416 + e2e 117) at Phase 8 close.**

## Performance

- **Duration:** ~26 min wall clock (includes Tim's commit-and-push turn)
- **Started:** 2026-10-24T19:38:51Z (after the 08-12 close commit)
- **Completed:** 2026-10-24T20:05:00Z
- **Tasks:** 2 of 2 (Task 1 partially meets one acceptance criterion; see below)
- **Files modified:** 28 (27 PNGs by Tim, 1 baseline JSON by the executor)

## Accomplishments

- Footer re-baseline landed as one intentional commit by Tim, with exactly the expected 27 reduced shots and the reason in the body.
- CI on 88191d0 passed every job on attempt 1, and passed again on attempt 2 (`gh run rerun`) of the same run, so the footer renders deterministically.
- Test-count ratchet raised at phase close: jest 107 -> 416, e2e 99 -> 117, total 206 -> 533.

## Task 1: Footer re-baseline, review, CI determinism

### Push and baseline generation (previous executor)

- `ci/08-13` was absent; plain push at 6383e40.
- CI on 6383e40: https://github.com/tlex-web/portfolio-app/actions/runs/40126424973 failed only in Visual Regression (job https://github.com/tlex-web/portfolio-app/actions/runs/40126424973/job/120968739348): 54 failed / 18 passed. The 54 are the 27 reduced shots (home, photos, projects, clix-cli, clix-website, roadmap, contact, offline, not-found x 375/768/1440) in visual-dark and visual-light; the 18 passes are the 9 home scroll shots x dark/light. Exactly the expected set. Unit, Lint and Type Check, E2E, Build and Security Audit passed; Dependency Review skipped.
- Baseline run: https://github.com/tlex-web/portfolio-app/actions/runs/40126429211 (workflow_dispatch, suite=visual, update_mode=changed; headBranch ci/08-13, headSha 6383e40 confirmed before waiting), success.
- Blob compare of the 36 downloaded PNGs against HEAD: 27 changed, 9 identical (home scroll-0/50/100 x 3 widths), 0 new, 0 other, 0 unexpected. Only the 27 changed PNGs were copied into `e2e/visual/routes.spec.ts-snapshots/`.

### Tim's commit (step 4)

- 88191d0 `test(08-13): re-baseline all routes for the footer map legend`, body `Reason: SHELL-04 footer map-sheet margin (08-12); no other visual change.`, author tlex-web, 27 PNG changes and nothing else.
- Verified at resume: HEAD = reflog HEAD@{0} = `git ls-remote origin refs/heads/ci/08-13` = 88191d0a60c4039491007783e2ee3cc8e4024406.

### Tim's review reply (verbatim)

> pushed

What this covers and what it does not:

- **Covered:** Tim committed the 27 PNGs as downloaded and pushed `ci/08-13`, so he accepted the baselines by committing them.
- **Not covered:** Tim gave no written review notes beyond "pushed". The review is recorded as **accepted by commit; no notes given**. The evidence in front of him was the executor's UI-SPEC pre-check below.
- **Firefox observation (step 6): not reported.** Tim did not report whether the band's lines look like 1 px strokes in Firefox. No observation is recorded here because none was given. This is an open item, carried to Phase 12's cross-browser pass (STATE.md pending todo).

### Executor pre-check against 08-UI-SPEC (evidence reviewed)

ui-ux-pro-max loaded; home, photos and not-found measured at 375/768/1440 with sharp (crops in the session scratchpad `crops-0813`).

| Check | Result |
|-------|--------|
| Band edges | Exactly one 1 px line each (luminance 58: footer border-t and border-b neatline); rows inside lit 6-29% by crossing contours (a mask frame line would light ~100%) - no frame line |
| Contours | Run cleanly to both sides (west dense, east sparser) |
| Band height | 73 / 95 / 119 px at 375 / 768 / 1440 (expected 75 / 96 / ~120, measured between the border lines) |
| Ticks | 3 solid (16/16 rows) + 1 dashed Riffelsee (12/16) at every width; x = 168/240/247/301 @375, 348/498/513/626 @768, 656/940/968/1181 @1440; the close pair is 7 px apart at 375 and reads as two |
| Order | "Zermatt – Matterhorn", Scale, Equidistance `100 m`, Extent `SW 2’616’000, 1’088’000` / `NE 2’627’000, 1’099’000`, Last surveyed `May 2026`, Source below the grid |
| Scale bar | `0 1 2 km` @375/768, `0 500 1 km` @1440; filled first half, hollow second; `0` label centred on the bar's left end (~4 px left of the text column, per spec) |
| Grid | 2 columns @375/768 with Extent + Source spanning; 4 data items in one row @1440 |
| Attribution | Wraps ~18 / 8 / 8 lines @375/768/1440 (max-w-prose), no overflow; @375 the IGN URL breaks inside itself ("telechargement5 / m"), wrap-anywhere as specified |
| Unchanged | Identity, links and copyright unchanged; band profiles byte-identical across routes at the same width |
| Pre-existing | Home body above the footer is unchanged legacy v1; the Home 375 overflow is pre-existing and already in deferred-items.md |

### CI on Tim's commit and the determinism re-run (step 5)

Run https://github.com/tlex-web/portfolio-app/actions/runs/40127078488 (event push, headBranch ci/08-13, headSha 88191d0a60c4039491007783e2ee3cc8e4024406, confirmed with gh).

| Job | Attempt 1 | Attempt 2 (`gh run rerun 40127078488`) |
|-----|-----------|-----------------------------------------|
| Visual Regression | success (job 120970695675) | success (job 120972165109) |
| E2E Tests | success (job 120970695591) | success (job 120972165347) |
| Unit Tests | success | success |
| Lint and Type Check | success | success |
| Build Application | success | success |
| Security Audit | success | success |
| Dependency Review | skipped | skipped |
| Run conclusion | success | success |

`check-visual-run.mjs --sha 88191d0 --wait 30` and `--job "E2E Tests" --wait 30` both exited 0 after each attempt.

### Task 1 acceptance criteria

| Criterion | Status |
|-----------|--------|
| check-snapshot-commit with the nine footer slugs exits 0 | PASS (`snapshot-commit: OK (27 changed)`) |
| check-visual-run exits 0 for the push run and the re-run | PASS (attempts 1 and 2) |
| check-visual-run `--job "E2E Tests"` exits 0 | PASS |
| 08-13-SUMMARY.md quotes Tim's review reply and the Firefox observation | **PARTIALLY MET.** Tim's reply ("pushed") is quoted verbatim; the Firefox observation was not reported, so it cannot be quoted. Open item, carried to Phase 12. |

## Task 2: Test-count ratchet

`npx jest --json --outputFile=jest-results.json --silent` (29 suites, 416 passed, 0 failed, 0 pending, 0 todo), then `node scripts/guards/test-count.mjs --jest jest-results.json --update`.

| Count | Before (38b9704, Phase 7 close) | After (88191d0, Phase 8) |
|-------|------|------|
| jest | 107 | 416 |
| e2e | 99 | 117 |
| total | 206 | 533 |

Reconciliation: the 13 suites that existed at Phase 7 close sum to exactly 107; the 16 new Phase 8 suites (lib contour-paths, dem-sample, footer-format, geo, hillshade, photo-format, trail-grade; data editorial, exif-sidecar, image-manifest, photos, precache, projects, terrain; SiteFooter; ImageDetailModal) add 309. E2E rose by 18 (new `e2e/data-privacy.spec.ts`, additions in `e2e/shell.spec.ts` and `e2e/visual/routes.spec.ts`).

Verify: the guard re-run without `--update` printed `jest 416 + e2e 117 = 533 (baseline 533)` / `OK`; the ratchet assertion printed `ratchet 416 117 533`. The guard's own `.skip(` / `.only(` / `.fixme(` scan passed. `jest-results.json` is gitignored and was not committed.

## Task Commits

1. **Task 1: footer re-baseline** - `88191d0` (test, committed and pushed by Tim; Claude never commits PNGs)
2. **Task 2: raise the test-count ratchet** - `74653dd` (chore)

**Plan metadata:** this SUMMARY commit (docs).

## Files Created/Modified

- `e2e/visual/routes.spec.ts-snapshots/{home,photos,projects,clix-cli,clix-website,roadmap,contact,offline,not-found}/{375,768,1440}-reduced-visual-dark-linux.png` - footer baselines (Tim, 88191d0)
- `scripts/guards/test-count.baseline.json` - jest 416, e2e 117, total 533, commit 88191d0

## Decisions Made

- Recorded Tim's acceptance as acceptance by commit, without inventing review notes or a Firefox result.
- The ratchet's `commit` field is 88191d0, the Phase 8 SHA that CI passed twice.

## Deviations from Plan

None - plan executed as written. The one shortfall is the Task 1 acceptance criterion on the Firefox observation, which depends on a report Tim has not given; it is recorded above as partially met, not worked around.

## Issues Encountered

None.

## Open Items

- **Firefox 1 px stroke check (Task 1 step 6, RESEARCH A2): not reported.** Carried to Phase 12's cross-browser pass; added as a STATE.md pending todo.
- **Not in this plan:** the command 4 (`pkill -f chrome`) explanation copy in `data/projects.ts` is still waiting on Tim. Untouched here.
- Nothing pushed by this executor: `74653dd` and the docs commit stay local; `ci/08-13` stays at 88191d0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 13 Phase 8 plans have summaries. Phase verification and completion belong to the orchestrator (`phase.complete` not run here).
- SHELL-04 is reported ready by `requirements.ready-ids` (no sibling plan blocks it).
- Open before Phase 12 closes: the Firefox stroke observation.

## Self-Check: PASSED

- FOUND: e2e/visual/routes.spec.ts-snapshots/home/375-reduced-visual-dark-linux.png (and the other 26 PNGs in 88191d0)
- FOUND: scripts/guards/test-count.baseline.json
- FOUND: 88191d0, 74653dd (ancestors of HEAD; `check evaluation-scope --plan 08-13 --commits-only` lists both)
- Task 1 and Task 2 acceptance criteria re-run: all PASS except the Firefox-observation criterion, recorded as partially met

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*
