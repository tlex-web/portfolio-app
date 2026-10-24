---
phase: 08-data-terrain-pipeline
plan: 11
subsystem: data
tags: [editorial, photos, copy-approval, visual-regression, playwright, baselines, ci]

requires:
  - phase: 08-10
    provides: Tim's literal "approve" reply to the 08-10 Task 3 copy review (copy, slugs, tags, season rule, Riffelsee pin); data/photos/editorial.ts; data/landscapes.ts legacy bridge
provides:
  - data/photos/editorial.ts header records the decision ("Copy and slugs decided by Tim at the 08-10 copy review; see 08-10-SUMMARY.md"); copy and slugs unchanged from 08-10
  - photos/* visual baselines (375, 768, 1440 reduced, dark Linux) re-baselined by Tim in their own commit (c0f2418), separate from the 08-13 footer re-baseline
  - Green CI on the re-baselined commit (Visual Regression, E2E, Unit, Lint and Type Check, Build, Security Audit)
affects: [08-12, 08-13, phase 10 /photos grid rebuild (GalleryGrid "1 hotspots" plural), phase 10 /photos/[slug] routes]

actuals:
  tokens: 175
  tasks: 2
  commits: 2
plan_head_before: d331b92b836a06c5a65773b843c7da2488d1fa7d
plan_head_after: c0f241811e79cf132e410624c5a204cf0b315bfa

tech-stack:
  added: []
  patterns:
    - "Approve-as-drafted copy reviews still land a commit: the only change is the JSDoc line naming where the decision is recorded"
    - "Plan-scoped re-baseline: executor pushes ci/08-NN, dispatches visual-baselines.yml (update_mode=changed), blob-compares, copies only the expected PNGs; Tim commits and pushes them"

key-files:
  created: []
  modified:
    - data/photos/editorial.ts
    - e2e/visual/routes.spec.ts-snapshots/photos/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos/1440-reduced-visual-dark-linux.png

key-decisions:
  - "Tim's 08-10 reply was 'approve', so 08-11 applies no copy, slug, tag, pin or season edits and does not regenerate data/generated/photos.ts"
  - "Tim committed the three photos PNGs exactly as downloaded (c0f2418, literal reply: pushed), i.e. option A by action: the GalleryGrid '1 hotspots' plural is not fixed in Phase 08 and is carried to Phase 10, where the /photos grid is rebuilt"

patterns-established:
  - "When a checkpoint offers options and the human resolves it by action, the SUMMARY records the literal reply and names the option the action implies, rather than claiming an explicit choice"

requirements-completed: [DATA-03, DATA-04]

coverage:
  - id: D1
    description: "data/photos/editorial.ts carries exactly the copy and slugs Tim approved at 08-10, with the decision recorded in its header"
    requirement: DATA-03
    verification:
      - kind: other
        ref: "grep -c \"08-10 copy review\" data/photos/editorial.ts (= 1)"
        status: pass
      - kind: other
        ref: "npm run photos:build -- --check"
        status: pass
      - kind: unit
        ref: "npx jest --silent (27 suites, 374 tests)"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/photos.spec.ts --project=chromium (6/6)"
        status: pass
    human_judgment: false
  - id: D2
    description: "photos/* baselines (375, 768, 1440 reduced) re-baselined in a commit of their own containing only photos PNGs, made by Tim"
    requirement: DATA-04
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow photos (snapshot-commit: OK (3 changed))"
        status: pass
    human_judgment: false
  - id: D3
    description: "CI green on the re-baselined commit c0f2418 (Visual Regression, E2E, Unit, Lint and Type Check)"
    requirement: DATA-04
    verification:
      - kind: automated_ui
        ref: "node scripts/ci/check-visual-run.mjs --sha c0f2418 --wait 30 (PASS https://github.com/tlex-web/portfolio-app/actions/runs/40124210374/job/120962040009)"
        status: pass
      - kind: e2e
        ref: "node scripts/ci/check-visual-run.mjs --sha c0f2418 --job \"E2E Tests\" --wait 30 (PASS https://github.com/tlex-web/portfolio-app/actions/runs/40124210374/job/120962040072)"
        status: pass
    human_judgment: false

duration: 47min
completed: 2026-10-24
status: complete
---

# Phase 08 Plan 11: Photo Copy Decision and Photos Re-baseline Summary

**Tim's "approve" from 08-10 recorded in data/photos/editorial.ts (no copy or slug edits), and the three /photos visual baselines re-baselined by Tim in their own commit with all of CI green on c0f2418**

## Performance

- **Duration:** 47 min (wall clock, including the wait for Tim's PNG commit)
- **Started:** 2026-10-24T18:31:03Z
- **Completed:** 2026-10-24T19:18:54Z
- **Tasks:** 2
- **Files modified:** 4 (1 source comment by Claude, 3 PNGs by Tim)

## Accomplishments

- Recorded Tim's 08-10 decision in the editorial data. His reply was "approve", so nothing else changed: no copy, slug, tag, season or pin edits and no photos.ts regeneration.
- Re-baselined photos/375, photos/768 and photos/1440 (reduced, dark, Linux) in a commit of their own. Claude downloaded and compared the PNGs; Tim committed and pushed them.
- CI on Tim's commit is green: Visual Regression, E2E Tests, Unit Tests, Lint and Type Check, Build Application and Security Audit passed (Dependency Review skipped, as on every branch push).

## Task Commits

1. **Task 1: Record Tim's 08-10 decision in the editorial data** - `aca4405` (feat) `feat(08-11): apply Tim's copy review (D-05, D-07)`
2. **Task 2: Re-baseline photos/* in its own commit** - `c0f2418` (test, authored and pushed by Tim, tlex-web) `test(08-11): re-baseline photos for the corrected copy`

**Plan metadata:** recorded in the docs commits that follow this SUMMARY.

## Files Created/Modified

- `data/photos/editorial.ts` - JSDoc header only: "Status: draft pending Tim's approval at 08-10 Task 3" replaced with "Copy and slugs decided by Tim at the 08-10 copy review; see 08-10-SUMMARY.md"; the D-07 slug-URL note is kept.
- `e2e/visual/routes.spec.ts-snapshots/photos/1440-reduced-visual-dark-linux.png` - 723,919 B to 724,064 B (blob cc291fe to e317b21), committed by Tim
- `e2e/visual/routes.spec.ts-snapshots/photos/375-reduced-visual-dark-linux.png` - 495,545 B to 495,385 B (blob 09b1c7d to 08e4883), committed by Tim
- `e2e/visual/routes.spec.ts-snapshots/photos/768-reduced-visual-dark-linux.png` - 569,665 B to 569,459 B (blob 04fdbd9 to c90c81b), committed by Tim

## Task 1: the 08-10 edits, checked item by item

08-10-SUMMARY.md records Tim's literal reply to the 08-10 Task 3 copy review as `approve`, with no edit list. So the edits to apply were:

| Item | Tim's 08-10 decision | Applied in 08-11 |
|------|----------------------|------------------|
| Copy (titles, alts, locations, stories, annotations) | approve as drafted | no change |
| Slugs (matterhorn-from-zermatt, gornerschlucht-waterfall, matterhorn-glacier-trail, riffelsee-reflection) | approve as drafted | no change |
| Subject tags | approve as drafted | no change |
| Season rule (meteorological) | approve as drafted | no change; `seasonOf` untouched |
| Riffelsee pin (45.9837 N, 7.7623 E, r 100 m, approximate) | approve as drafted | no change; corrections.json untouched; no photos.ts regeneration |
| Header line naming the decision | required by the plan | added (`grep -c "08-10 copy review"` = 1) |

Checks before the push: `photos:build -- --check` OK; lint 0 errors, 54 warnings (photos:build, photos:derive and served-images OK); type-check clean; Jest 27 suites, 374 tests; `e2e/photos.spec.ts` chromium 6/6, run twice (the first run logged the known cold-compile browser error from 08-10, the second was clean).

## Task 2: re-baseline and CI evidence

1. `git ls-remote origin refs/heads/ci/08-11` was empty, so `git push origin HEAD:refs/heads/ci/08-11` (plain, no force) created it at aca4405f0ac0a594794b59af03327574a7521f53.
2. CI on aca4405 ([run 40121224840](https://github.com/tlex-web/portfolio-app/actions/runs/40121224840)): Visual Regression failed as expected ([job 120952971195](https://github.com/tlex-web/portfolio-app/actions/runs/40121224840/job/120952971195)), 6 failed and 66 passed. All six failures were `photos @375/@768/@1440 reduced` in visual-dark and visual-light (light compares against the same dark PNGs), which was the expected set. Unit, E2E, Lint and Type Check, Build and Security Audit passed; Dependency Review was skipped.
3. Baseline run ([40121230478](https://github.com/tlex-web/portfolio-app/actions/runs/40121230478)): headBranch ci/08-11 and headSha aca4405 confirmed before waiting; it succeeded. The artifact (36 `-linux.png`, no wrapper folder) was downloaded to a fresh scratchpad directory. Blob compare against HEAD: 3 changed, 33 identical, 0 unexpected.
4. Visual review: only the hotspot badges changed (2/2/2/3 became 1/1/2/2), matching the changes 08-10 predicted. Titles and locations appear only on hover, and nothing overflows at 375.
5. Claude copied the three changed PNGs into `e2e/visual/routes.spec.ts-snapshots/photos/` and did not commit them.
6. Tim committed the three PNGs as c0f2418 and pushed ci/08-11. His literal reply:

    pushed

7. Verification on resume:
   - HEAD = c0f241811e79cf132e410624c5a204cf0b315bfa (reflog HEAD@{0} "commit: test(08-11): re-baseline photos for the corrected copy"); author tlex-web; the commit touches exactly the 3 photos PNGs.
   - `git ls-remote origin refs/heads/ci/08-11` = c0f241811e79cf132e410624c5a204cf0b315bfa.
   - `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow photos` printed `snapshot-commit: OK (3 changed)` and exited 0.
   - `node scripts/ci/check-visual-run.mjs --sha c0f2418… --wait 30`: PASS ([job 120962040009](https://github.com/tlex-web/portfolio-app/actions/runs/40124210374/job/120962040009)), exit 0.
   - `node scripts/ci/check-visual-run.mjs --sha c0f2418… --job "E2E Tests" --wait 30`: PASS ([job 120962040072](https://github.com/tlex-web/portfolio-app/actions/runs/40124210374/job/120962040072)), exit 0.
   - CI [run 40124210374](https://github.com/tlex-web/portfolio-app/actions/runs/40124210374): headBranch ci/08-11, headSha c0f2418…, conclusion success. Lint and Type Check, Security Audit, Visual Regression, Unit Tests, E2E Tests and Build Application succeeded; Dependency Review was skipped.

## Decisions Made

- The approve case means the Task 1 commit holds only the decision line, as the plan specified.
- Before Tim committed, Claude found a plural bug: the grid badge reads "1 hotspots" on two photos. It offered two options: A (commit the PNGs now and fix the plural in Phase 10, where the /photos grid is rebuilt) or B (fix it now and re-baseline again; the orchestrator recommended B). Tim did not type "A" or "B". He committed the three PNGs exactly as downloaded and replied "pushed", which is option A by action. The plural fix is therefore not done here.

## Deviations from Plan

None - plan executed exactly as written. Tim's resume reply was "pushed" rather than the plan's "re-baselined" signal; the verification commands above confirm the same end state.

## Issues Encountered

- **Grid badge plural ("1 hotspots"), carried to Phase 10.** `components/GalleryGrid.tsx:60` always prints `{n} hotspots`, and `components/__tests__/GalleryGrid.test.tsx:83` asserts the literal `'1 hotspots'`. Since the 08-10 copy, two photos have one hotspot, so the committed photos baselines show "1 hotspots". This is not fixed here (Tim chose A by action). Fix it in the Phase 10 GalleryGrid rebuild by updating the component and test together and re-baselining photos/*. It is recorded as a pending todo in STATE.md.
- Out of scope and untouched: the explanation copy for command 4 (`pkill -f chrome`) in `data/projects.ts` is still waiting on Tim's answer and is not part of this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 7 is done. Next is 08-12.
- 08-13 still owns the footer re-baseline, which stays separate from this photos commit (RESEARCH Pitfall 7).
- ci/08-11 is a scratch branch at c0f2418. Nothing has been pushed to the phase branch or main.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED

- FOUND: data/photos/editorial.ts (contains "08-10 copy review")
- FOUND: e2e/visual/routes.spec.ts-snapshots/photos/{375,768,1440}-reduced-visual-dark-linux.png
- FOUND: aca4405 (ancestor of HEAD)
- FOUND: c0f2418 (HEAD)
- check-snapshot-commit --some --allow photos: exit 0; check-visual-run (Visual Regression, E2E Tests): exit 0
