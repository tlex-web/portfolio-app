---
phase: 14-ui-fixes-terminal-controls
plan: 07
subsystem: testing
tags: [ledger, review-disposition, wave-merge-gate, playwright, jest, guard-03]

requires:
  - phase: 14-ui-fixes-terminal-controls
    provides: "14-01 SHELL-07 fix 49b8fe1; 14-04 D-12 d6873c8 and D-22 945d235; 14-02, 14-01, 14-05 and 14-06 declared PNGs"
provides:
  - "Ledger rows #6 (07 WR-06) and #30 (10 IN-01) written back as done, plus a Phase 14 write-back section"
  - "A green local wave-merge gate on the branch tip (lint, type-check, Jest 1795 with guard:tests, 592 e2e in Chromium and Firefox)"
  - "The declared PNG set for 14-08, per cause"
affects: [14-08 (pushes this tip, runs WebKit and the visual container, compares the PNG set), Phase 18 (photos-sweep E5 row)]

actuals:
  tokens: 2824
  tasks: 2
  commits: 2
plan_head_before: bb1f281eed33b49278a7fc0a218bfebb1570161c
plan_head_after: accc7e5b4f3d2b9b73588df5a45ef057a52ee854

tech-stack:
  added: []
  patterns:
    - "Ledger write-back: append the outcome to the last cell, keep the enum, Owner and Tim cells (WR-05 precedent)"

key-files:
  created:
    - .planning/phases/14-ui-fixes-terminal-controls/14-07-SUMMARY.md
  modified:
    - .planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md
    - .planning/milestones/v2.0-phases/07-foundation-guardrails/07-REVIEW-DISPOSITION.md
    - .planning/milestones/v2.0-phases/10-photography/10-REVIEW-DISPOSITION.md
    - e2e/photos-sweep.spec.ts

key-decisions:
  - "14-07: ledger rows #6 and #30 keep enum deferred and their Owner and Tim cells; the Phase 14 outcome is appended (row 6: SHELL-07 complete, 14-01 49b8fe1; row 30: fixed in Phase 14, 14-04 d6873c8, 945d235). In the archived tables the outcome goes before the (13-LEDGER-TRIAGE.md #n) reference, as WR-05's does"
  - "14-07: the gate caught a stale photos-sweep E5 row (first Escape after Z with a callout open expected to stay zoomed). D-22 makes zoom take that press; step 6 rewritten in place (accc7e5), test count unchanged, no app change"

patterns-established:
  - "When a decision changes a shared interaction order, grep every spec for the old order, not only the plan's own file"

requirements-completed: [SHELL-07, SHELL-08, HOME-09, HOME-10, LBOX-08, ENG-06]

coverage:
  - id: D1
    description: "Ledger rows #6 and #30 written back as done in 13-LEDGER-TRIAGE.md and in the archived 07 and 10 disposition tables, with SHAs that resolve"
    verification:
      - kind: other
        ref: "grep -cF 'Phase 14 write-back' / 'SHELL-07 complete' / 'fixed in Phase 14' (1 each in the three files); git cat-file -t 49b8fe1 d6873c8 945d235 = commit"
        status: pass
    human_judgment: false
  - id: D2
    description: "Wave-merge gate green on the branch tip: lint, type-check, Jest with guard:tests, the nine Phase 14 e2e files in Chromium and Firefox"
    verification:
      - kind: other
        ref: "npm run lint && npm run type-check (exit 0)"
        status: pass
      - kind: unit
        ref: "npx jest --json --outputFile=jest-results.json && npm run guard:tests (105 suites, 1795 tests; jest 1795 + e2e 597 = 2392, baseline 2243)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test <9 Phase 14 files> --project=chromium --project=firefox (592 passed, 0 failed, 0 flaky)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Declared PNG set for 14-08 per cause (menu, home, box)"
    verification: []
    human_judgment: true
    rationale: "The PNGs only come from the 14-08 CI dispatch; Tim compares the changed set against this list and commits the baselines"

duration: 12min
completed: 2026-11-14
status: complete
---

# Phase 14 Plan 07: Ledger write-back and local wave-merge gate Summary

**Ledger rows #6 (07 WR-06, SHELL-07 `49b8fe1`) and #30 (10 IN-01, D-12 `d6873c8` and D-22 `945d235`) now read as done in the triage ledger and both archived disposition tables. The branch tip passes lint, type-check, 1795 Jest tests with the GUARD-03 ratchet, and 592 e2e rows in Chromium and Firefox, after one stale E5 lightbox row was rewritten for D-22.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-14T12:26:43Z
- **Completed:** 2026-11-14T12:38:38Z
- **Tasks:** 2 of 2
- **Files modified:** 4 (3 planning records, 1 e2e spec)

## Accomplishments

- **Row 6 (07 WR-06):** `Final (13-22)` cell gains `; SHELL-07 complete: 14-01 \`49b8fe1\` (a plain tap on the current page's link closes the panel, D-16, D-23)`. The 07-REVIEW-DISPOSITION WR-06 Source cell gains `; SHELL-07 complete: 14-01 49b8fe1`.
- **Row 30 (10 IN-01):** `Final (13-22)` cell gains `; fixed in Phase 14: 14-04 \`d6873c8\`, \`945d235\` (hiding labels collapses the open callout; a hidden callout never takes Escape)`. The 10-REVIEW-DISPOSITION IN-01 Source cell gains `; fixed in Phase 14: 14-04 d6873c8, 945d235`.
- A dated `## Phase 14 write-back` section at the end of 13-LEDGER-TRIAGE.md with one bullet per row (requirement or decision, plan, commits).
- Every enum stays `deferred`. The Owner and Tim cells, the frontmatter `disposition:` values and every other row are untouched. `git diff --stat d78c251^..d78c251` lists only the three files (11 insertions, 4 deletions).
- The wave-merge gate is green on the tip `accc7e5` (results below).
- D-17 holds: `git diff --name-only c3a06b3 -- app/globals.css` prints nothing.

## Wave-merge gate results (tip accc7e5)

| Step | Result |
|------|--------|
| `npm run lint` | exit 0 (eslint plus every guard: parity, ci, palette, contrast, identity, selftest, data:check, images) |
| `npm run type-check` | exit 0 |
| `npx jest --json --outputFile=jest-results.json` | 105 suites, **1795 tests** passed, 0 skipped, 0 todo |
| `npm run guard:tests` | `test-count: jest 1795 + e2e 597 = 2392 (baseline 2243)`, OK |
| e2e, the nine Phase 14 files, one `PW_PROD` build | **592 passed**: Chromium 334, Firefox 258; 0 failed, 0 flaky (2.8 min) |

The nine files: shell, keyboard, home-modes, home-canvas, home-ascent, photos-lightbox, photos-sweep, case-study, case-study-page. The first run had 590 passed and 2 failed: the photos-sweep E5 row in both engines (see Deviations). After the fix, the whole gate ran again: e2e first, then lint, type-check, Jest and guard:tests.

## Declared PNG set for 14-08

All under `e2e/visual/routes.spec.ts-snapshots/`, project `visual-dark`, Linux:

1. **SHELL-08 (14-01), new:** `menu/375-current-focus-visual-dark-linux.png`. The `menu/` folder does not exist yet; CI reports the PNG missing until the 14-08 dispatch.
2. **HOME-10 (14-02), the rail scrim:** `home/768-ascent-start`, `home/768-ascent-waypoint-2`, `home/768-ascent-summit`, `home/1440-ascent-start`, `home/1440-ascent-waypoint-2`, `home/1440-ascent-summit` (each `-visual-dark-linux.png`). Also `home/768-reduced` and `home/1440-reduced`, but only if the darker band shows in them.
3. **ENG-06 (14-05 and 14-06), the case-study terminal:** `box/375-reduced`, `box/768-reduced`, `box/1440-reduced` (each `-visual-dark-linux.png`). They show the open transcript (14-06) and the Previous/Next command bar. At 375 px that bar is one row, from the `gap-1` dot row (61b390a).

No `home/375-*` PNG should change: the scrim is md+ only, and HOME-09 changed no pixel. `check-snapshot-commit` will run with `--allow menu --allow home --allow box`.

## Task Commits

1. **Task 1 (tracer): ledger rows #6 and #30 written back** - `d78c251` (docs). Tracer gate: the three `<verify>` greps ran again after the commit and each printed 1.
2. **Task 2: wave-merge gate.** Gate fix `accc7e5` (fix). The gate results and the PNG list are in this SUMMARY.

## Files Created/Modified

- `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md`: rows 6 and 30 appended, `## Phase 14 write-back` section
- `.planning/milestones/v2.0-phases/07-foundation-guardrails/07-REVIEW-DISPOSITION.md`: WR-06 table row appended
- `.planning/milestones/v2.0-phases/10-photography/10-REVIEW-DISPOSITION.md`: IN-01 table row appended
- `e2e/photos-sweep.spec.ts`: E5 step 6 rewritten in place for D-22

## Decisions Made

- In the archived tables, the outcome goes before the `(13-LEDGER-TRIAGE.md #n)` reference, as WR-05's does, and without backticks, like the other SHAs there. The plan said "append to the Source cell"; the WR-05 precedent decides where in the cell.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The photos-sweep E5 row still expected the pre-D-22 Escape order**
- **Found during:** Task 2 (first e2e run, Chromium and Firefox)
- **Issue:** `e2e/photos-sweep.spec.ts:355` expected the first Escape after Z with a callout open to leave zoom on (`aria-pressed` `true`). Received `false`. The cause is locked decision D-22 (14-04, `945d235`): callouts hide while zoomed, and a hidden callout no longer takes Escape, so zoom takes it and the callout is dropped with it. 14-04 rewrote the matching `photos-lightbox.spec.ts` row but ran only that file, so this second copy of the old order was never run against the change. The app behaviour is correct; the test was stale.
- **Fix:** step 6 rewritten in place (GUARD-03). One Escape now asserts zoom off, the label collapsed and the dialog still open. The next Escape closes. The comment cites D-22. The test count is unchanged (e2e 597 before and after).
- **Files modified:** e2e/photos-sweep.spec.ts
- **Verification:** the full nine-file run in Chromium and Firefox passed 592/592, then lint, type-check, Jest and guard:tests ran again green.
- **Committed in:** `accc7e5`

---

**Total deviations:** 1 auto-fixed (1 Rule 1, a stale test)
**Impact on plan:** No app change and no locked decision touched. The fix brings an old test in line with D-22.

## Issues Encountered

- The `PW_PROD` build's postbuild injected the hash into `public/service-worker.js`. I restored it with `git checkout` after each run, and it is never committed.
- `jest-results.json` is gitignored (`git status --porcelain --ignored` shows `!!`). It was never staged.
- I did not run the visual project (the baselines are Linux CI PNGs), so there are no stray PNGs. WebKit is not installed locally; it runs in 14-08's CI.
- Nothing is listening on :3000. Playwright's webServer stopped `next start` after each run, and I checked the port by netstat.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 14-08 (Tim-gated push, CI with WebKit, visual dispatch, PNG compare against the list above).
- Still open in deferred-items.md and outside this plan: Escape from the open mobile menu scrolls the page up (owner: Tim to decide).

---
*Phase: 14-ui-fixes-terminal-controls*
*Completed: 2026-11-14*

## Self-Check: PASSED

- FOUND: the three ledger files, e2e/photos-sweep.spec.ts and this SUMMARY.
- FOUND: d78c251, accc7e5 (ancestors of HEAD); 49b8fe1, d6873c8 and 945d235 resolve to `commit`.
- Measured from the ledger: 2 commits, bb1f281..accc7e5.
- Acceptance re-run: `SHELL-07 complete` 1 and `fixed in Phase 14` 1 in 13-LEDGER-TRIAGE.md; Task 1 diff touches only the three files and only rows 6 and 30, the two table rows and the new section.
