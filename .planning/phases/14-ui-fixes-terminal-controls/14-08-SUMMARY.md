---
phase: 14-ui-fixes-terminal-controls
plan: 08
subsystem: testing
tags: [ci, playwright, webkit, visual-regression, re-baseline, d-19, d-20]

requires:
  - phase: 14-ui-fixes-terminal-controls
    provides: "14-07 green local gate on 79def47 and the declared PNG set (menu, home, box)"
provides:
  - "Three-engine CI green on ci/14-08: E2E 1471 passed in Chromium, Firefox and WebKit with --fail-on-flaky-tests, including the first WebKit run of the Phase 14 rows"
  - "Phase 14 visual baselines: 11 changed and 1 new PNG in menu/, home/ and box/, committed by Tim (55160a4)"
  - "CI OK success on Tim's baseline commit; check-visual-run PASS and check-snapshot-commit OK (12 changed, --allow menu/home/box)"
affects: [14 verify-work (12-UAT test 3 keyboard re-check), /gsd-ship (pushes the phase branch), Phase 15 (pixel-neutral gate measured against these baselines), Phase 18 (LBOX-08 row exists before the lightbox rewrite)]

actuals:
  tokens: 3600
  tasks: 3
  commits: 1
plan_head_before: 79def4760de3c7222ad5a3f8cc9a2a3a21d91056
plan_head_after: 55160a4049d8ce3c2f193d199546746bb1b96c85

tech-stack:
  added: []
  patterns:
    - "Re-baseline loop: CI push, one visual-baselines dispatch with update_mode=changed, download to a scratch dir outside the repo, blob-compare against HEAD, copy only changed or new PNGs, Tim commits, CI plus both check scripts on his SHA"

key-files:
  created:
    - .planning/phases/14-ui-fixes-terminal-controls/14-08-SUMMARY.md
    - e2e/visual/routes.spec.ts-snapshots/menu/375-current-focus-visual-dark-linux.png (Tim's commit)
  modified:
    - e2e/visual/routes.spec.ts-snapshots/home/ (8 PNGs, Tim's commit)
    - e2e/visual/routes.spec.ts-snapshots/box/ (3 PNGs, Tim's commit)

key-decisions:
  - "14-08: the WebKit LBOX-08 contingency (second-frame re-reveal in restoreFocus) did not fire; WebKit passed the Map 720x450 row on the first push, so LightboxDialog.tsx and its Jest file are untouched"
  - "14-08: the re-baseline changed 11 PNGs and added 1, all inside the declared set; home/{768,1440}-reduced did change (the declared 'possibly' entries), and no home/375-* PNG changed"
  - "14-08: no Deployment Checks proof recorded (D-20); 13-UAT test 1 proved it on the Phase 13 close merge (aef25e2, PR #147)"

patterns-established:
  - "When a phase changes pixels, the plan declares the PNG set by folder and cause before CI, and check-snapshot-commit runs with exactly those --allow folders on the baseline commit"

requirements-completed: [SHELL-07, SHELL-08, HOME-09, HOME-10, LBOX-08, ENG-06]

coverage:
  - id: D1
    description: "Three-engine E2E (Chromium, Firefox, WebKit) green with --fail-on-flaky-tests on ci/14-08, including the WebKit LBOX-08 Map 720x450, SHELL-07, SHELL-08, B8 poster and 375 px rows"
    verification:
      - kind: e2e
        ref: "CI run 43596110950 (79def47) E2E Tests: 1471 passed (33.0m); CI run 43600436335 (55160a4) E2E Tests: 1471 passed (32.7m)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Visual baselines re-generated once (update_mode=changed) and the changed set kept inside the declared menu/, home/ and box/ folders"
    verification:
      - kind: other
        ref: "visual-baselines run 43599067566 (success); artifact blob-compare: 11 changed, 1 new, 37 unchanged; node scripts/ci/check-snapshot-commit.mjs --sha 55160a4 --some --allow menu --allow home --allow box -> snapshot-commit: OK (12 changed), exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "CI OK success on Tim's baseline commit, Visual Regression green"
    verification:
      - kind: automated_ui
        ref: "CI run 43600436335 CI OK success; node scripts/ci/check-visual-run.mjs --sha 55160a4 --wait 30 -> PASS .../job/132463905190, exit 0 (Visual Regression 98 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tim's visual review of the new baselines (darker rail band at 768/1440, box step buttons and open transcript, menu focus ring abutting the accent bar)"
    verification: []
    human_judgment: true
    rationale: "Tim reviewed and committed the PNGs himself (55160a4); his acceptance is the review, and the 12-UAT test 3 keyboard re-check stays with /gsd-verify-work"

duration: 90min
completed: 2026-11-14
status: complete
---

# Phase 14 Plan 08: CI on ci/14-08 and the Phase 14 re-baseline Summary

**On ci/14-08, CI passed in all three engines (1471 E2E rows, WebKit included) without the LBOX-08 WebKit contingency. One `update_mode=changed` dispatch produced 11 changed PNGs and 1 new one, all inside the declared menu/, home/ and box/ set. Tim committed them as `55160a4`, and on that commit `CI OK` concluded success and both visual check scripts passed.**

## Performance

- **Duration:** about 90 min, most of it two CI runs of about 34 min each
- **Started:** 2026-11-14T12:40Z (approval and first push, in the orchestrator session)
- **Completed:** 2026-11-14T14:09:39Z
- **Tasks:** 3 of 3
- **Files modified:** 12 PNGs (Tim's commit) and this SUMMARY

## ci.approval (Task 1, D-19)

- **Reply:** "approve (Recommended)"
- **Source:** Tim answered an AskUserQuestion on 2026-11-14 in an earlier orchestrator session. The orchestrator's project memory records it. It is in no `.planning` file.
- **Scope:** a plain push of the tip to the new branch ci/14-08, fast-forward pushes of any fallout fixes, one visual-baselines dispatch (`update_mode=changed`) with download and compare, and one CI run on Tim's PNG commit. It did not cover a phase-branch push or any force push, and neither happened.

## CI runs

### Run 1: push of 79def47 to ci/14-08

[43596110950](https://github.com/tlex-web/portfolio-app/actions/runs/43596110950), conclusion failure. Visual Regression was expected to fail before the re-baseline.

| Job | Result |
|-----|--------|
| Classify changes | success |
| Dependency Review | skipped |
| Unit Tests | success |
| Lint and Type Check | success |
| Security Audit | success |
| Build Application | success |
| E2E Tests | success: `npx playwright test --project=chromium --project=firefox --project=webkit --fail-on-flaky-tests`, **1471 passed (33.0m)** |
| Visual Regression | failure (expected): 24 failed, 74 passed. That is 12 distinct shots across 2 projects, because visual-light shares the visual-dark snapshot path (playwright.config.ts:24) |
| CI OK | failure, from Visual Regression |

None of the failures was functional, so no fallout commits were needed. **WebKit LBOX-08 passed without the contingency.** The WebKit rows for "Map at 720x450 ... LBOX-08", SHELL-07, SHELL-08, the B8 poster and 375 px all passed on the first push. `components/photos/LightboxDialog.tsx` and `components/photos/__tests__/lightbox-dialog.test.tsx` are untouched. No Firefox #43967 crash appeared on any new row, so no `@firefox-43967` tag was added.

### Baseline dispatch

`visual-baselines.yml` with `suite=visual` and `update_mode=changed` ran as [43599067566](https://github.com/tlex-web/portfolio-app/actions/runs/43599067566) on ci/14-08 at 79def47. Its one job, "Update baselines", concluded success. The `visual-baselines` artifact was downloaded into a new, empty scratch directory outside the repo. It held 49 PNGs: compared with HEAD, 11 changed, 1 was new and 37 were unchanged. Only the 12 changed and new files went into `e2e/visual/routes.spec.ts-snapshots/`. Each one is byte-identical to the artifact by `git hash-object`.

### Run 2: Tim's baseline commit 55160a4 (the phase gate)

[43600436335](https://github.com/tlex-web/portfolio-app/actions/runs/43600436335), push, headSha `55160a4049d8ce3c2f193d199546746bb1b96c85`, attempt 1. **CI OK: success.** No re-run was needed.

| Job | Result |
|-----|--------|
| Classify changes | success |
| Dependency Review | skipped |
| Unit Tests | success |
| Lint and Type Check | success |
| Security Audit | success |
| Build Application | success |
| Visual Regression | success: **98 passed (2.0m)** |
| E2E Tests | success: same three-engine command, **1471 passed (32.7m)** |
| CI OK | **success** |

## Changed PNGs and their causes

All files are under `e2e/visual/routes.spec.ts-snapshots/` and end in `-visual-dark-linux.png`.

| File | Change | Cause |
|------|--------|-------|
| `home/768-ascent-start` | changed | Deeper rail scrim stops (HOME-10, 14-02) |
| `home/768-ascent-waypoint-2` | changed | Deeper rail scrim stops (HOME-10) |
| `home/768-ascent-summit` | changed | Deeper rail scrim stops (HOME-10) |
| `home/1440-ascent-start` | changed | Deeper rail scrim stops (HOME-10) |
| `home/1440-ascent-waypoint-2` | changed | Deeper rail scrim stops (HOME-10) |
| `home/1440-ascent-summit` | changed | Deeper rail scrim stops (HOME-10) |
| `home/768-reduced` | changed | Same rail scrim in the reduced shot (a "possibly" entry in the declared set) |
| `home/1440-reduced` | changed | Same rail scrim in the reduced shot (a "possibly" entry in the declared set) |
| `box/375-reduced` | changed | Terminal Previous/Next step buttons in the command bar, and the transcript `<details>` open below the terminal under reduced motion (ENG-06, 14-05 and 14-06) |
| `box/768-reduced` | changed | Same as box/375 (ENG-06) |
| `box/1440-reduced` | changed | Same as box/375 (ENG-06) |
| `menu/375-current-focus` | **new** | Inset focus ring on the current menu row (SHELL-08, 14-01) |

Nothing changed outside `menu/`, `home/` and `box/`, and no `home/375-*` file changed, so the set is inside the declared set. In the orchestrator's pixel check of `menu/375-current-focus` at y=208, the accent bar is x=0–1 at rgb(112,213,237) and the focus ring is x=2–3 at rgb(157,229,247). The two abut with no gap and no overlap.

## Tim's baseline commit and the final checks (Task 3)

- **Commit:** `55160a4049d8ce3c2f193d199546746bb1b96c85`, "test(14): re-baseline visual snapshots for the rail scrim, terminal and menu (HOME-10, ENG-06, SHELL-08)", author tlex-web. It holds the 12 PNGs and nothing else. Tim pushed it to ci/14-08 himself; his checkpoint reply was "pushed". Local HEAD and `git ls-remote origin refs/heads/ci/14-08` both show `55160a4`.
- **The agent committed no PNG.** None of the agent's commits in this plan contains a PNG.
- `node scripts/ci/check-visual-run.mjs --sha 55160a4049d8ce3c2f193d199546746bb1b96c85 --wait 30`:
  ```
  PASS https://github.com/tlex-web/portfolio-app/actions/runs/43600436335/job/132463905190
  ```
  exit 0
- `node scripts/ci/check-snapshot-commit.mjs --sha 55160a4049d8ce3c2f193d199546746bb1b96c85 --some --allow menu --allow home --allow box`:
  ```
  snapshot-commit: OK (12 changed)
  ```
  exit 0 (`--allow-all` was not used)
- **D-20:** no Deployment Checks live proof is recorded here. 13-UAT test 1 already proved it on the Phase 13 close merge (aef25e2, PR #147), so the ROADMAP fallback is retired.

## Accomplishments

- The Phase 14 requirements (SHELL-07, SHELL-08, HOME-09, HOME-10, LBOX-08, ENG-06) pass in Chromium, Firefox and WebKit on Linux CI, with flaky tests failing the run.
- The visual baselines contain exactly the declared Phase 14 changes, and Tim reviewed and committed them.
- The phase gate holds: `CI OK` succeeded on the baseline commit, and both check scripts exit 0.

## Task Commits

1. **Task 1: Tim approves the ci/14-08 push, fix pushes and one baseline dispatch (D-19).** No commit; this was a decision checkpoint.
2. **Task 2: three-engine CI, fallout, WebKit contingency, baseline dispatch and comparison.** No commit: a push, a dispatch and a local copy of 12 PNGs. No fallout or contingency commit was needed.
3. **Task 3: Tim reviews and commits the baselines.** `55160a4` (test) is Tim's commit. The agent's part was verification only.

**Plan metadata:** this SUMMARY's docs commit, then the STATE/ROADMAP tracking commit.

## Files Created/Modified

- `e2e/visual/routes.spec.ts-snapshots/{home,box,menu}/…` holds the 12 PNGs listed above. Tim committed them in `55160a4`.
- `.planning/phases/14-ui-fixes-terminal-controls/14-08-SUMMARY.md` is this file.

## Decisions Made

- The contingency was not applied, because the trigger it was planned for (WebKit LBOX-08 failing while Chromium and Firefox pass) never happened.
- `home/768-reduced` and `home/1440-reduced` were accepted as part of the declared set. The plan listed them as "possibly" for the rail scrim, and the darker band does show in them.

## Deviations from Plan

- **Execution split:** Tasks 1 and 2 ran in the orchestrator session before this continuation agent started: the approval, the push, CI run 1, the dispatch, the download, the compare and the local copy. This agent resumed at Task 3's verification. Their facts above come from that session; this agent re-checked the run job results, the dispatch conclusion and the contents of Tim's commit with `gh` and `git`.
- **No fallout commits:** run 1 had no functional failure, so ci/14-08 had no fast-forward fix pushes and the WebKit contingency was not used.
- **SUMMARY timing:** Task 2 asked for the CI results to go into the SUMMARY as they happened. Here the SUMMARY was written once, at the end, and covers all three tasks.
- **Commit ledger:** `plan_head_before` is `79def47`, the tip that was pushed. The one commit measured up to `plan_head_after` is Tim's `55160a4`. The agent made no code or test commits; its only commits are this SUMMARY and the STATE/ROADMAP tracking commit.

**Total deviations:** 0 auto-fixed (Rules 1–3 never fired).
**Impact on plan:** none. The plan ran as designed, without needing its contingency branch.

## Issues Encountered

None. Both CI runs passed on the first attempt where success was expected, and the flake re-run allowance was not used.

## User Setup Required

None. No external service needed configuration.

## Next Phase Readiness

- Phase 14 is ready for `/gsd-verify-work 14`. Tim's 12-UAT test 3 keyboard re-check stays there (14-VALIDATION.md, "Manual-Only Verifications").
- ci/14-08 is a throwaway branch on origin. The phase branch `gsd/phase-14-ui-fixes-terminal-controls` has not been pushed; `/gsd-ship` will push it.
- Still open in deferred-items.md, outside this plan: Escape from the open mobile menu scrolls the page up. Tim decides what to do with it.

---
*Phase: 14-ui-fixes-terminal-controls*
*Completed: 2026-11-14*

## Self-Check: PASSED

- FOUND: this SUMMARY and `e2e/visual/routes.spec.ts-snapshots/menu/375-current-focus-visual-dark-linux.png`.
- FOUND: `55160a4` and `79def47` are ancestors of HEAD. `git ls-remote origin refs/heads/ci/14-08` returns `55160a4`.
- Measured from the ledger: 1 commit, `79def47..55160a4` (Tim's PNG commit). The token figure is chars/4 of this SUMMARY, the only text file the agent changed.
