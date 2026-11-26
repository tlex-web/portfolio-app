---
phase: 18-immersive-survey-layout
plan: 29
subsystem: phase-close
tags: [phase-close, d-23, d-24, d-25, d-26, home-08, photo-lcp, guard-02, guard-03, og-pin, ledger, ci]
status: complete

requires:
  - phase: 18-28
    provides: "D-24 rounds 1-5 complete (Tim's fc16583); visual suite 70 entries per scheme"
  - phase: 18-25
    provides: "post-plan cleanup 5356f9c (LIGHTBOX_CLOSE_EVENT removed) and ff477ab (drei removed, @types/three 0.183.1 pinned), the last shared-chunk and lockfile changes"
  - phase: 18-01
    provides: "og decision A + .gitattributes (pin ?f8a1b67515ad261d)"
provides:
  - "The Phase 18 gate record on tip b6939ea: lint, type-check, Jest 2802 with guard:tests, prod e2e Chromium + Firefox, every commit in 769e1b8..HEAD checked, client JS 1,827,405 B, chunk search clean, og pin unchanged"
  - "D-25 write-backs: 13 #33, #34, #37, #38 and 14 IN-04 read fixed with resolving Phase 18 SHAs"
  - "ci/18-29: CI OK success on attempt 1 (run 45879391203), Visual Regression PASS with no baseline update; first CI run over the post-drei lockfile"
  - "Perf dispatch 45882211560: HOME-08 holds (437,947 B / 3,076 ms); first PHOTO-LCP baseline region 1280 ms, photo 4128 ms (median of 5)"
affects: [phase-18-verification, phase-19, v2.1-milestone-audit]

actuals:
  tokens: 3450     # chars/4 over the text diff 4bafe92..b6939ea (13,801 chars; three planning files)
  tasks: 3
  commits: 1       # measured: git rev-list --count 4bafe92..HEAD before the SUMMARY commit (b6939ea)
plan_head_before: 4bafe924803674ec98eae409dac6a47c1a1cddd0
plan_head_after: b6939ea8ecd2f095f82f703a893b80bd0150e4af

tech-stack:
  added: []
  patterns:
    - "Phase close: per-commit check-snapshot-commit over the whole phase range, each of Tim's round commits checked with its own plan's --allow set"
    - "Hand-over write-back keeps Enum, Owner and Tim cells and rewrites only the Final cell (ledger) and the Source cell (archived disposition)"

key-files:
  created:
    - .planning/phases/18-immersive-survey-layout/18-29-SUMMARY.md
  modified:
    - .planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md
    - .planning/milestones/v2.0-phases/10-photography/10-REVIEW-DISPOSITION.md
    - .planning/phases/14-ui-fixes-terminal-controls/14-REVIEW-DISPOSITION.md

key-decisions:
  - "18-29: og pin unchanged under option A: the photo card file is untouched since 90d8dad (12-14), so the ?f8a1b67515ad261d pin needs no re-pin; og.spec passed in Chromium and Firefox"
  - "18-29: 14 IN-04 keeps its deferred enum and appends 'fixed in Phase 18: 18-25 d4a0837', matching its sibling rows IN-01..IN-06 (enum deferred + 'fixed in Phase 15'), per the 14-07 precedent that enums stay"
  - "18-29: all ten phase requirement IDs marked complete at the close: each deliverable is built, baselined and green in CI on the tip"

requirements-completed: [REGION-01, REGION-02, REGION-03, REGION-04, REGION-05, REGION-06, PHOTO-06, PHOTO-07, PHOTO-08, LBOX-09]

duration: 36min (18:43Z-19:19Z, including the 21 min CI wait and the 3 min perf dispatch)
completed: 2026-11-26
---

# Phase 18 Plan 29: Phase Close Gate Summary

**Phase 18 passes its acceptance gates on tip `b6939ea`. The local gate is green: lint, type-check, Jest 2802/2802 with guard:tests, and 1092 of 1093 prod e2e tests (the one failure is the known local-only Firefox `/offline` flake). All 136 commits in `769e1b8..HEAD` follow their baseline rule, and Tim's five round commits each pass their own `--allow` set. Client JS is 1,827,405 B, 28,436 B under the cap, and the chunk search is clean. The og pin is unchanged. The D-25 hand-overs are written back with resolving SHAs. ci/18-29 is fully green on attempt 1 with Visual Regression PASS, which makes it the first CI run over the post-drei lockfile. The one perf dispatch holds HOME-08 (437,947 B / 3,076 ms) and records the first PHOTO-LCP baseline (region 1280 ms, photo 4128 ms).**

## Performance

- **Duration:** 36 min (2026-11-26T18:43:24Z to 19:19Z)
- **Tasks:** 3 (Task 1 tracer, Task 2 write-back, Task 3 CI and perf)
- **Commits:** 1 task commit (`b6939ea`) plus this SUMMARY's metadata commit
- **Files modified:** 3 planning files

## Task 1: local gate on the tip (4bafe92 sources; b6939ea adds docs only)

| Gate | Result |
|------|--------|
| `npm run lint` | exit 0 (guards, `selftest: 299/299 cases passed`, data checks, `served-images: OK`, `test-count: scan OK`) |
| `npm run type-check` | exit 0 (tsconfig, tsconfig.jest, tsconfig.e2e) |
| `npx jest --json` | 129/129 suites, **2802/2802** tests, 0 failed, 0 pending (the JSON was deleted afterwards; it is gitignored anyway) |
| `npm run guard:tests` | `test-count: jest 2802 + e2e 851 = 3653 (baseline 3024)`, OK |
| Client JS (`rm -rf .next/static && npm run build`) | **1,827,405 B** in 21 files. Phase base 1,851,745 B, cap 1,855,841 B: 24,340 B under the base and 28,436 B under the cap |
| Chunk search in `.next/static/chunks` | `Steinernen` 0, `Tarquini` 0, `WorldDEM` 0, `CarouselStepper` 0, `photos-view` 0 files |
| og pin (18-01 option A) | `app/(site)/photos/[slug]/opengraph-image.tsx` last changed in 90d8dad (12-14), so the hash did not move. `e2e/og.spec.ts` still pins `?f8a1b67515ad261d` (5 matches), and the og rows passed in both engines. No re-pin commit |
| Prod e2e, Chromium + Firefox, 17 specs | **1092 passed, 1 failed (4.3 min)**. Chromium 564/564; Firefox 528/529 |
| Photo LCP structural run (`PHOTO_LCP_RUNS=1`, perf project) | 1 passed (22.8 s); the JSON has `runs 1` and both medians > 0. Numbers discarded |
| Port 3000 | free after the build, after the e2e run and after the structural run. `public/service-worker.js` was restored each time |

The 17 specs: photos, photos-region, photos-lightbox, photos-stepping, photos-sweep, sources, shell, seo, og, offline, keyboard, not-found, audit, no-webgl, design-system, case-study-page and home-ascent. The one failure is `[firefox] audit.spec.ts:132 › /offline: axe, CLS, links, images, CSP, console` with `frame.evaluate: Page crashed`. This is the known local-only flake: it also fails on the base sources, CI Firefox passes it (692 passed in run 45879391203), and I did not weaken it.

Tracer feedback gate: Task 1's verify ran end to end and passed, so I went on to Tasks 2 and 3.

### Per-commit baseline check (GUARD-02), 769e1b8..HEAD

The script is `scratchpad/check-range-18-29.sh` and its output is in `check-range-18-29.out`. **136 commits, 0 failures.** Every commit has author tlex-web and none is a merge.

- **131 commits** with `--none`: each printed `snapshot-commit: OK (0 changed)`. The scope-added work is all in this set: the share-fail fix (5c2934f..3e298e0), the inline icons (038d15a..164e479), 18-20's compact strip (aa5c437..e10bbd7), the overview placement fix (da5bb29, 3ad297b, 0bc1257) and the 18-25 post-plan cleanup (5356f9c, f91c689, ff477ab, 4bafe92). After the gate I checked b6939ea with `--none` too: OK (0 changed).
- **Tim's five round commits:**

| Commit | Plan | Allow set | Result |
|--------|------|-----------|--------|
| 48963a9 | 18-04 | `--some --allow home --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow projects --allow box --allow coin-flip --allow roadmap --allow contact --allow offline --allow not-found` | OK (36 changed) |
| c24568d | 18-05 | `--some --allow sources` | OK (3 changed) |
| 8944359 | 18-14 | `--some --allow region` | OK (24 changed) |
| e0c8e3a | 18-20 | `--some --allow photo --allow lightbox` | OK (6 changed) |
| fc16583 | 18-28 | `--some --allow photos --allow-deletions` | OK (9 changed) |

`git log 769e1b8..HEAD -- '*.png'` lists exactly these five commits.

## Task 2: D-25 write-backs (commit b6939ea)

Before writing, I checked every SHA with `git cat-file -e`, and `git show --stat` confirmed each one touches the finding's file. Only the Final cell (ledger) and the Source cell (archived table) changed. Enum, Owner and Tim cells are unchanged, and so is the frontmatter `disposition:`.

| Row | Finding | Written back |
|-----|---------|--------------|
| 13 #33 | 10 IN-04 (preload asks for AVIF only) | `fixed: 18-19: 036a412` (RED `59ef4e8`): the preload asks for the format the stage loaded (`PhotoViewer.tsx`) |
| 13 #34 | 10 IN-05 (`STAGE_SIZES`) | `fixed: 18-08: 8d30564, df4f8e8` (figure and slot sizes), `18-19: 4f684b9` (stage sizes; `STAGE_SIZES` removed) |
| 13 #37 | 10 IN-08 (row-height drift guard) | `fixed: 18-24: e5884ff` (guard retired with the grid; `GalleryGrid.test.tsx` deleted; no breakpoint row heights remain) |
| 13 #38 | 10 IN-09 remainder | appended `the photos-sweep switchTo wait: 18-22: e1907cf` (removed `switchTo` and its `waitForTimeout(600)`; `git grep` finds neither in photos-sweep at HEAD) |
| 14 IN-04 | `STEP` copy of `STEP_BUTTON` | appended `fixed in Phase 18: 18-25 d4a0837` (CarouselControls retired in `05e5f3b`) |

I also added a `## Phase 18 write-back` section to 13-LEDGER-TRIAGE.md, following the 14-07 section.

Task verify: rows 33, 34 and 37 resolve to 036a412, 8d30564 and e5884ff. The acceptance grep for `deferred: handed to Phase 18` returns 0, and `fixed in Phase 18` occurs once in the 14 file. `git diff -U0` shows only those rows changed (prohibition: test).

## Task 3: ci/18-29 and the perf dispatch

### CI run 45879391203 (push, headSha b6939ea, attempt 1): green

https://github.com/tlex-web/portfolio-app/actions/runs/45879391203

| Job | Conclusion | Start | End | Minutes |
|-----|-----------|-------|-----|---------|
| Classify changes | success | 18:52:57 | 18:53:03 | 0.1 |
| Dependency Review | skipped | | | 0 |
| Security Audit | success | 18:53:06 | 18:53:53 | 0.8 |
| Unit Tests | success | 18:53:06 | 18:55:00 | 1.9 |
| Lint and Type Check | success | 18:53:06 | 18:56:36 | 3.5 |
| Build Application | success | 18:56:39 | 18:57:18 | 0.7 |
| Visual Regression | success, 140 passed (3.6m) | 18:53:06 | 18:58:27 | 5.3 |
| E2E Tests (chromium) | success, 789 passed (12.4m) | 18:53:06 | 19:06:48 | 13.7 |
| E2E Tests (firefox) | success, 692 passed (11.3m) | 18:53:06 | 19:05:44 | 12.6 |
| E2E Tests (webkit) | success, 695 passed (18.9m) | 18:53:06 | 19:13:29 | 20.4 |
| CI OK | **success** | 19:13:32 | 19:13:35 | 0.1 |

- This was the first CI run over the post-ff477ab lockfile. `npm ci` on Node 24 and the type-check passed (the Unit Tests and Lint and Type Check jobs install with `npm ci`), so no lockfile action is needed.
- **D-26 legs:** chromium 13.7, firefox 12.6, webkit 20.4 min, against Phase 17's 15.4 / 14.4 / 12.2 and 18-28's 17.1 / 17.0 / 24.4. The longest leg is 20.4 min, well under 45.
- No re-run and no fix push. Each leg runs with `--fail-on-flaky-tests`, so no flaky test was reported.
- The CI watch items from earlier plans (Linux WebKit soft navigation after a step, the `:has()` hover rows on the overview, the @needs-tab-to-links rows) all passed in the WebKit leg (695 passed).
- `node scripts/ci/check-visual-run.mjs --sha b6939ea8ecd2f095f82f703a893b80bd0150e4af --wait 30` printed `PASS https://github.com/tlex-web/portfolio-app/actions/runs/45879391203/job/140114638074`. No baseline was updated.
- `git ls-remote origin refs/heads/ci/18-29` = `git rev-parse HEAD` = b6939ea8ecd2f095f82f703a893b80bd0150e4af.

### Perf dispatch 45882211560 (the only dispatch)

https://github.com/tlex-web/portfolio-app/actions/runs/45882211560

- I ran `gh workflow run visual-baselines.yml --ref ci/18-29 -f suite=perf` at 19:14:59Z. Before waiting I confirmed headBranch `ci/18-29`, headSha `b6939ea8ecd2f095f82f703a893b80bd0150e4af` and event `workflow_dispatch`. The run concluded success: Update baselines ran 19:15:04 to 19:18:02, and the perf project reported 2 passed (2.1m).
- The run comes after the last shared-chunk change (5356f9c, ff477ab; b6939ea is docs only).
- I downloaded the `home-baseline` artifact into a new, empty scratchpad directory (`perf-artifact-18-29/`). Its `commit` field is b6939ea, and the container is `mcr.microsoft.com/playwright:v1.65.0-noble`.

| HOME-08 (median of 5) | Value | Limit | Headroom |
|---|---|---|---|
| totalJsTransferBytes | **437,947 B** | 468,770 B | 30,823 B |
| lcpMs | **3,076 ms** | 4,692 ms | 1,616 ms |

The other fields are `initialJsTransferBytes` 172,758 B, `jsDecodedBytes` 1,526,302 B and `canvasReadyMs` 6,137 ms, with modes 3d x 5.

**First PHOTO-LCP baseline (from the run log, for the next phase's gate):**
`PHOTO-LCP: region 1280 ms, photo 4128 ms (median of 5; /photos/regions/zermatt, /photos/riffelsee-reflection)`

### D-23 ledger

- Exactly one plain push, which created ci/18-29 at b6939ea. There was no fix push, no re-run, no force-push and no visual dispatch, and the phase branch and main were not pushed.
- Exactly one dispatch (45882211560, suite=perf) and one artifact download.
- The agent staged, committed and pushed no PNG.

## Requirements

All ten IDs in this plan's frontmatter were marked complete with `requirements.mark-complete`: REGION-01, REGION-02, REGION-03, REGION-04, REGION-05, REGION-06, PHOTO-06, PHOTO-07, PHOTO-08 and LBOX-09. Every earlier plan had left them Pending for the last carrier (18-29). Each deliverable is built, baselined in Tim's rounds and green on the tip:

- overview with pins and the synced list: 18-22, 18-23, 3ad297b
- region pages: 18-06 to 18-14
- sheet margins and /sources: 18-02, 18-03, 18-11, 18-23
- view switch retired with ?view= redirects: 18-22, 18-24, 18-25
- Share: 18-07, 18-18
- LV95: 18-18
- region-scoped lightbox and end card: 18-15, 18-16

The end-of-phase live-DOM probe is the orchestrator's, during phase verification.

## Deviations from Plan

None. The plan ran as written.

- **Judgment (14 IN-04 enum):** the plan text says "14 IN-04 → `fixed`" but also says to follow the 14-07 precedent, where enums stay. In 14-REVIEW-DISPOSITION.md, the sibling rows IN-01 to IN-06 all keep `deferred` and append "fixed in Phase 15". I kept `deferred` and appended "fixed in Phase 18: 18-25 `d4a0837` …", so the row reads fixed and the file stays consistent. If Tim wants the enum itself flipped to `fixed`, the change is two cells: the frontmatter and the table.

## Issues Encountered

- The local-only Firefox `/offline` axe "Page crashed" flake (see Task 1). It is environmental, and CI Firefox passed.

## Open items for Tim (not fixed here, out of scope)

1. `package.json` still has the override `"fflate@^0.6.0": "0.6.11"`, and `scripts/guards/version-floors.json` still has the 0.6.11 fflate floor. Neither matches anything now: three-stdlib was the only fflate 0.6 consumer, and it left with drei in ff477ab. Both are harmless, but either can be removed in a dependency-hygiene pass.
2. `lib/photos/plate-layout.ts:559` says "(the mapMarkCss precedent)", but that function was deleted in 18-27. A comment-only rewording.
3. Some historical prose still says "light table" (comments, not identifiers): `data/photos/editorial.ts:20`, `e2e/visual/routes.spec.ts:34`, `lib/__tests__/photos-view-model.test.ts:44`, `region-series.test.ts:3`, `regions.test.ts:318` and `lib/regions.ts:370`. It reads as history and can stay or be reworded.
4. `data/sheet.ts` was not retired. `sheet.title` is still read by SiteFooter, `lib/og/template.tsx` and `lib/sheet-margin.ts`.
5. The 10-REVIEW-FIX WR-01 carousel half and 14-RESEARCH's "Back only: flushSync LIGHTBOX_CLOSE_EVENT" diagram are now history (5356f9c). This plan is not allowed to change any disposition row beyond the five, so they are noted here only.
6. `.github/copilot-instructions.md` was prettier-dirty before Phase 18. So was `e2e/visual/routes.spec.ts` (around line 40 and line 350). Both are untouched.
7. The OPEN question from 18-16 (add @no-win-webkit to the lightbox Hotspots D-22 row) still has no answer recorded in the forward notes.

## Known Stubs

None.

## User Setup Required

None.

## Self-Check: PASSED

- FOUND: .planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md (Phase 18 write-back section, rows 33/34/37/38)
- FOUND: .planning/milestones/v2.0-phases/10-photography/10-REVIEW-DISPOSITION.md (IN-04, IN-05, IN-08, IN-09)
- FOUND: .planning/phases/14-ui-fixes-terminal-controls/14-REVIEW-DISPOSITION.md (IN-04 "fixed in Phase 18")
- FOUND: commit b6939ea in HEAD's history; no attribution trailer
- CI 45879391203 CI OK success at b6939ea; check-visual-run PASS; perf 45882211560 success at b6939ea
