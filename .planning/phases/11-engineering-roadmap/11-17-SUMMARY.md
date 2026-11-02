---
phase: 11-engineering-roadmap
plan: 17
subsystem: testing
tags: [ci, playwright, visual-regression, baselines, test-count-ratchet, github-actions]

requires:
  - phase: 11-engineering-roadmap
    provides: "every Phase 11 surface (/projects route panels, box and coin-flip case studies, route log, Home About sentence) and the box/coin-flip rows in the visual route table (11-18)"
provides:
  - "Tim-reviewed Linux baselines for projects, box (new), coin-flip (new), roadmap and the About-bearing home shots; clix-cli and clix-website baselines removed"
  - "CI green twice on Tim's baseline commit (run 41367381672, attempts 1 and 2)"
  - "test-count ratchet raised 1300 -> 1749"
  - "RouteIndex re-measures on scroll, so a jump to the top leaves no stale current stage"
  - "native media controls hidden in visual shots (deterministic coin-flip Demo poster)"
affects: [12-polish, visual-regression, guards]

actuals:
  tokens: 4018
  tasks: 3
  commits: 8
plan_head_before: 4c757d1dab7e53c4caf7a8648a9465f9deec020d
plan_head_after: b9ec33ffa9cc7326f13f7f94ed5218d242b0bf5a

tech-stack:
  added: []
  patterns:
    - "Visual stylePath hides UA shadow-DOM media controls (video::-webkit-media-controls) instead of masking the poster"
    - "IntersectionObserver-driven indexes also re-measure on scroll, since a programmatic jump only reports the sections whose intersection changed"

key-files:
  created:
    - e2e/visual/routes.spec.ts-snapshots/box/ (3 PNGs, Tim's commit)
    - e2e/visual/routes.spec.ts-snapshots/coin-flip/ (3 PNGs, Tim's commit)
  modified:
    - e2e/visual/hide-canvas.css
    - e2e/visual/README.md
    - components/projects/RouteIndex.tsx
    - components/projects/__tests__/RouteIndex.test.tsx
    - e2e/case-study-page.spec.ts
    - scripts/guards/test-count.baseline.json
    - e2e/visual/routes.spec.ts-snapshots/{projects,roadmap,home}/ (9 PNGs, Tim's commit)

key-decisions:
  - "Hide native video controls in visual shots rather than mask the Demo region: the loading arc is UA shadow DOM that animations:'disabled' cannot freeze, and a mask would paint over the poster under review"
  - "Tim chose option B: fix RouteIndex's stale current stage before baselining, using one extra visual-baselines dispatch (41366534214)"
  - "Ratchet raised at Tim's baseline commit: jest 1289 + e2e 460 = 1749"

patterns-established:
  - "Phase close-out: push ci/NN-17, one dispatch, Tim commits PNGs, check-snapshot-commit per slug, CI green plus one re-run, then the ratchet"

requirements-completed: [ENG-01, ENG-02, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03]

coverage:
  - id: D1
    description: "Tim's baseline commit changes only the allowed slugs and deletes only clix-cli/ and clix-website/"
    requirement: ENG-01
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha e511d7a445a5a557b598bebe3df550174ffe1453 --some --allow-deletions --allow projects --allow box --allow coin-flip --allow roadmap --allow home  (snapshot-commit: OK (21 changed))"
        status: pass
    human_judgment: false
  - id: D2
    description: "CI green twice on Tim's baseline commit (Visual Regression, E2E, Unit, Lint and Type Check, Build, Security)"
    verification:
      - kind: automated_ui
        ref: "GitHub Actions run 41367381672 attempt 1 (Visual Regression job 125030321602)"
        status: pass
      - kind: automated_ui
        ref: "GitHub Actions run 41367381672 attempt 2 (Visual Regression job 125035271320)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase 11 surfaces look right in the new baselines (route panels, case studies, route log, About sentence)"
    requirement: ENG-02
    verification: []
    human_judgment: true
    rationale: "Visual design adequacy; Tim reviewed the PNGs and committed them himself (reply 'pushed')"
  - id: D4
    description: "RouteIndex clears its current stage after a jump back to the top"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/RouteIndex.test.tsx#keeps no stale current section after a sweep jumps to the top"
        status: pass
      - kind: e2e
        ref: "e2e/case-study-page.spec.ts#the route index clears after a sweep jumps back to the top"
        status: pass
    human_judgment: false
  - id: D5
    description: "Test-count ratchet raised to 1749 and guard green"
    verification:
      - kind: other
        ref: "npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests (test-count: OK)"
        status: pass
    human_judgment: false

duration: 1h 55m
completed: 2026-11-02
status: complete
---

# Phase 11 Plan 17: CI, Re-baseline and Ratchet Summary

**Phase 11 closed on Linux CI: 15 Tim-reviewed baselines (box and coin-flip new, projects, roadmap and three home shots updated, both CLI_X folders removed), CI green twice on his commit, a RouteIndex stale-stage fix and a deterministic video poster on the way, and the test-count ratchet raised from 1300 to 1749.**

## Performance

- **Duration:** about 1h 55m wall clock (2026-11-01T23:05Z to 2026-11-02T01:05Z), including two review rounds with Tim
- **Started:** 2026-11-01T23:05Z (push run 41360775963 created 23:10:18Z)
- **Completed:** 2026-11-02T01:05Z
- **Tasks:** 3 of 3 (Task 2 by Tim)
- **Files modified:** 7 non-PNG files plus 21 PNG changes in Tim's commit

## Accomplishments

- ci/11-17 passed every non-visual job on its first push; Visual Regression failed only on the expected slugs
- Two visual-baselines dispatches (the planned one and the extra one Tim approved with option B) produced 15 PNGs, and Tim reviewed, committed and pushed them himself
- CI went green on Tim's commit and green again on the single approved re-run
- Ratchet: jest 942 -> 1289, e2e 358 -> 460, total 1300 -> 1749 (recorded 2026-11-02 at e511d7a)

## Tim's replies (verbatim)

The 11-02 approval row (`11-02-SUMMARY.md` `## Resolved values`):

> | ci.approval | approve: 11-17 may (1) plain-push the phase HEAD to a new `ci/11-17`, (2) push fast-forward CI-fix commits there, (3) dispatch one visual-baselines run on it and download and compare the PNGs, (4) re-run CI once on Tim's baseline commit. Excluded: force pushes, pushes to the phase branch or `main`, and PNG commits (Tim commits the baselines) | supplied | Reply 5 G "Approve (Recommended)", 2026-11-01 |

**Reply 1** (Task 2 checkpoint, RouteIndex stale current stage recorded in box/1440 and coin-flip/1440). The options were "B. Fix first (recommended): I fix `RouteIndex` so it re-measures on scroll, add a test, push a fast-forward and run **one more** visual-baselines dispatch. Only box/1440 and coin-flip/1440 should change. Then you commit." and "A. Baseline as is". Tim replied:

```
B
```

**Reply 2** (post-option-B checkpoint: commit the 15 PNGs, `git rm -r` the clix-cli and clix-website folders, push to ci/11-17, then reply "re-baselined" or name a wrong shot). Tim replied:

```
pushed
```

No shot was named as wrong in either reply.

## CI evidence

| Run | Kind | Head | Result |
|-----|------|------|--------|
| 41360775963 | CI push | 4c757d1 | Lint and Type Check, Unit Tests, Build Application, Security Audit, E2E Tests success; Visual Regression failure (expected slugs) |
| 41362194482 | CI push | 395f893 (CI fix) | same: every non-visual job success, Visual Regression failure (expected slugs) |
| 41362320008 | visual-baselines dispatch (suite visual, update_mode changed) | ci/11-17 @ 395f893 | success; artifact compared, 15 PNGs |
| 41365055838 | CI push | 56c11bf (RouteIndex fix) | every non-visual job success, Visual Regression failure (expected slugs) |
| 41366534214 | visual-baselines dispatch (the extra one, Tim's option B) | ci/11-17 @ 56c11bf | success; versus 41362320008 only box/1440 and coin-flip/1440 changed |
| 41367381672 attempt 1 | CI push | e511d7a (Tim) | all jobs success (Visual Regression job 125030321602, E2E 125030321639) |
| 41367381672 attempt 2 | CI re-run (the one approved re-run) | e511d7a (Tim) | all jobs success (Visual Regression job 125035271320) |

Dependency Review is skipped on push runs (pull-request only).

## Tim's baseline commit

- `TIM_BASELINE_SHA=e511d7a445a5a557b598bebe3df550174ffe1453`, author tlex-web <old2shatterhand@gmail.com>. HEAD, `git reflog` HEAD@{0} and `git ls-remote origin refs/heads/ci/11-17` all agree.
- `check-snapshot-commit.mjs --some --allow-deletions --allow projects --allow box --allow coin-flip --allow roadmap --allow home`: `snapshot-commit: OK (21 changed)`, exit 0.
- Added (6): box/{375,768,1440}-reduced-visual-dark-linux.png, coin-flip/{375,768,1440}-reduced-visual-dark-linux.png
- Modified (9): projects/{375,768,1440}, roadmap/{375,768,1440}, home/{375,768,1440} (all `-reduced-visual-dark-linux.png`; the home change is the About sentence, D-33)
- Deleted (6): clix-cli/{375,768,1440} and clix-website/{375,768,1440}. All deletions sit under clix-cli/ or clix-website/ (D-22).
- Every other slug (photos, photos-grid, photos-carousel, photo, lightbox, contact, offline, not-found) was unchanged in both artifacts.

## Task Commits

1. **Task 1: Push ci/11-17, CI, dispatch and compare.** `395f893` (test: hide native video controls in visual shots), `176eb82` (docs: STATE at the checkpoint)
2. **Task 2 (option B, Tim-approved): RouteIndex fix.** `2fadace` (test, RED), `69bd7ab` (fix, GREEN), `56c11bf` (test, e2e), `43f87ba` (docs: STATE)
2. **Task 2 (Tim): baseline commit.** `e511d7a` (test, authored and pushed by Tim)
3. **Task 3: Verify, CI twice, ratchet.** `b9ec33f` (chore: raise the test-count ratchet after Phase 11, GUARD-03)

**Plan metadata:** the docs(11-17) commit that adds this SUMMARY.

## Files Created/Modified

- `e2e/visual/hide-canvas.css`: hides `video::-webkit-media-controls` in visual shots
- `e2e/visual/README.md`: one Rules line for the hidden controls
- `components/projects/RouteIndex.tsx`: a passive scroll handler re-measures each section against the 80 px to 40 % band
- `components/projects/__tests__/RouteIndex.test.tsx`: the RED test for the stale stage
- `e2e/case-study-page.spec.ts`: the sweep then scrollTo(0, 0) leaves no `aria-current`
- `scripts/guards/test-count.baseline.json`: 1300 -> 1749
- PNGs under `e2e/visual/routes.spec.ts-snapshots/`: Tim's commit only

## Decisions Made

- Hide the UA media controls instead of masking the Demo region, so the poster stays under review. 8 captures over 4 loads were byte-identical locally.
- Option B (Tim): fix RouteIndex before baselining instead of baselining a stale current stage and re-baselining in Phase 12.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Nondeterministic coin-flip Demo poster in visual shots**
- **Found during:** Task 1 (risk flagged by 11-16)
- **Issue:** Chromium's native media controls draw a loading arc over the poster of the `preload="none"` Demo `<video>` at a different rotation on every load (3 distinct hashes over 4 loads, a 72 x 70 px diff box). It lives in the UA shadow DOM, so `animations: 'disabled'` cannot freeze it and the coin-flip baselines would never match run to run.
- **Fix:** `hide-canvas.css` (the visual stylePath) adds `video::-webkit-media-controls { display: none !important; }`. No other route renders a `<video>`.
- **Files modified:** e2e/visual/hide-canvas.css, e2e/visual/README.md
- **Verification:** local captures byte-identical; CI Visual Regression passed twice on Tim's commit
- **Committed in:** 395f893 (fast-forward pushed to ci/11-17 under the 11-02 approval)

**2. [Tim-approved, option B] RouteIndex kept a stale current stage after a jump to the top**
- **Found during:** Task 1 review (box/1440 and coin-flip/1440 showed the last section current at the top of the page)
- **Issue:** The IntersectionObserver reports only intersection changes. After the visual `settle()` sweep, `scrollTo(0, 0)` changed only the last section's state, so the sections stayed marked 'above' and the last one stayed current.
- **Fix:** the passive scroll handler re-measures each section's live box against the same band and re-applies 11-14's rule (first section in the band, else the last one above it, the last one at the page end). State is set only when the current section changes. Smooth scroll and motion are unchanged.
- **Files modified:** components/projects/RouteIndex.tsx, components/projects/__tests__/RouteIndex.test.tsx, e2e/case-study-page.spec.ts
- **Verification:** RED then GREEN unit test, new e2e, push run 41365055838 non-visual jobs green, extra dispatch 41366534214 changed only box/1440 and coin-flip/1440
- **Committed in:** 2fadace, 69bd7ab, 56c11bf. Tim approved the extra dispatch (Reply 1 "B").

---

**Total deviations:** 2 (1 Rule 1 CI fix, 1 Tim-approved product fix)
**Impact on plan:** Both were needed for deterministic, correct baselines. The extra dispatch was used under Tim's explicit "B", and the single CI re-run was used in Task 3 as planned. There were no force pushes, no pushes to the phase branch or main, and no PNG commits by Claude.

## Issues Encountered

- E2E Tests on run 41367381672 attempt 1 took about 20 minutes (the production build with one worker). It passed, so there was nothing to fix.

## Acceptance checks (Task 3)

- `node -e "...b.total>=1349&&b.recordedAt>='2026-11-01'..."`: exit 0 (total 1749, recordedAt 2026-11-02)
- `npm run guard:tests`: `test-count: jest 1289 + e2e 460 = 1749`, `test-count: OK`
- `git grep -n -i -E "clix|cli_x|cli-x" -- app components lib data ':!components/Footer.tsx'`: no output, exit 1
- `git grep -l -i -E "clix|cli_x|cli-x" -- e2e`: only `e2e/case-study.spec.ts`
- Two green Visual Regression results on Tim's commit: run 41367381672 attempts 1 and 2

## Deploy note

The service worker serves cached HTML stale-while-revalidate, so a returning visitor may see the old /projects or /roadmap once after deploy. The old CLI_X URLs (/projects/clix-cli, /projects/clix-website) become designed 404s with no redirect (D-22).

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

Phase 11 is ready for phase verification. Phase 12 carry-overs (record, not done here):

- **Roadmap data (11-08 Q3 rule):** record Phase 11's completion date in `data/roadmap.ts` (phase 11 `completed`, phase 12 possibly `in-progress`) and move `surveyedAt`, both with Tim's confirmation
- **README:** drop the CLI_X rows (`README_CLIX.md`, `README_CLIX_WEBSITE.md`, lines 222-223), the deleted `HologramTerminal*` entries (lines 194-195), `components/RoadmapFilters.tsx` (line 201) and the v1 `RoadmapItem` description (line 333)
- **Dead code:** delete the unimported legacy `components/Footer.tsx`, which still links 'CLI_X Tool' and 'CLI_X Website' to the removed routes (lines 65-66)
- **Dev-server-only flakes:** `e2e/shell.spec.ts` attribution test times out at `/projects/box` under parallel dev load (a `test.slow()` or per-route timeout would harden it); `/projects/no-such-slug` returned 500 once under dev `--repeat-each=4`. Production and CI are unaffected.
- **Open design notes for Tim:** the Zmutt end point of the coin-flip profile (11-04 D4), the plain-anchor choice for Next steps rows (11-13 Deviation 1), and the coin-flip Demo controls bar covering the HEADS label on the poster for real visitors (11-16; hidden only in visual shots)
- The ratchet commit and this SUMMARY stay on the local phase branch (not pushed)

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-02*
