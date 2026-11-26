---
phase: 18-immersive-survey-layout
plan: 28
subsystem: visual-baselines
tags: [region-01, photo-06, d-22, d-23, d-24, d-26, guard-03, visual-regression, tracer]
status: complete

requires:
  - phase: 18-27
    provides: "MapSheet retired; the settle() hero-contour wait already lists only [data-ascent-stage]"
  - phase: 18-22
    provides: "the /photos overview header and region list (no Map/Grid/Carousel switcher)"
  - phase: 18-23
    provides: "the overview sheet, margin and region plates (placement fix 3ad297b)"
  - phase: 18-14
    provides: "the D-21 region shots that succeed photos-grid and photos-carousel (D-22 comment)"
provides:
  - "e2e/visual/routes.spec.ts: ROUTES without photos-grid and photos-carousel; settle() waits for the overview contour SVG when [data-overview-sheet] is present"
  - "Tim's fc16583: photos/{375,768,1440}-reduced re-baselined, the six photos-grid/photos-carousel PNGs deleted"
  - "D-24 round 5 of 5 (cause: overview) closed: no orphan baseline remains"
affects: [18-29]

actuals:
  tokens: 1632     # chars/4 over the text diff 0bc1257..HEAD (6,526 chars; the PNG changes in fc16583 are binary and Tim's)
  tasks: 3
  commits: 2       # measured: git rev-list --count 0bc1257..HEAD before the SUMMARY commit (56662e6 agent, fc16583 Tim)
plan_head_before: 0bc125708e47b3e48f16d659e2f3daa9204c8594
plan_head_after: fc16583135b56e440b3f16e8ed9af8ecf731a43c

tech-stack:
  added: []
  patterns:
    - "A retired visual route leaves ROUTES in the agent's commit and its PNGs leave in Tim's commit, checked by check-snapshot-commit --some --allow <dir> --allow-deletions"

key-files:
  created: []
  modified:
    - e2e/visual/routes.spec.ts
    - e2e/visual/README.md
    - e2e/visual/routes.spec.ts-snapshots/photos/375-reduced-visual-dark-linux.png  # Tim, fc16583
    - e2e/visual/routes.spec.ts-snapshots/photos/768-reduced-visual-dark-linux.png  # Tim, fc16583
    - e2e/visual/routes.spec.ts-snapshots/photos/1440-reduced-visual-dark-linux.png # Tim, fc16583
  deleted:  # all by Tim, fc16583
    - e2e/visual/routes.spec.ts-snapshots/photos-grid/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos-grid/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos-grid/1440-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos-carousel/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos-carousel/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos-carousel/1440-reduced-visual-dark-linux.png

key-decisions:
  - "18-28: the photos-grid entries map to region zermatt-mid and the photos-carousel entries to region zermatt-top at the same widths, following 18-14's D-22 comment"
  - "18-28: settle() waits for /terrain/overview-contours-<id>.<hash10>.svg only when [data-overview-sheet] is on the page, so no other route's wait changes"

requirements-completed: []  # REGION-01 and PHOTO-06 are also claimed by 18-29; REQUIREMENTS.md keeps them Pending (18-22 convention)

duration: 40min agent work (16:59Z-17:39Z) plus Tim's review and the CI wait on fc16583
completed: 2026-11-26
---

# Phase 18 Plan 28: Overview Re-baseline and Retired View Baselines Summary

**D-24 round 5 of 5 is closed. The `/photos` overview (18-22 header and list, 18-23 sheet and margin, placement fix 3ad297b) is re-baselined on its own in Tim's commit `fc16583`. The same commit deletes the six photos-grid and photos-carousel PNGs, whose entries the agent removed from the visual ROUTES in `56662e6`; their successors are 18-14's region shots. `settle()` now waits for the overview's contour SVG. The dispatch artifact differed from HEAD only in the three photos shots, and CI on `fc16583` is green.**

## Performance

- **Duration:** about 40 min of agent work for Tasks 1-2 (16:59:02Z to 17:39Z). Tim reviewed and pushed fc16583, and its CI ran 17:48:50Z to 18:13:34Z.
- **Started:** 2026-11-26T16:59:02Z
- **Completed:** 2026-11-26T18:13:34Z (CI OK on fc16583)
- **Tasks:** 3 (Task 1 tracer, Task 2 dispatch and compare, Task 3 Tim's commit verified)
- **Commits:** 2 since plan_head_before 0bc1257: `56662e6` (agent) and `fc16583` (Tim)
- **Files:** agent 2 modified (routes.spec.ts, README.md). Tim: 3 PNGs modified, 6 PNGs deleted.

## Accomplishments

- `e2e/visual/routes.spec.ts`: ROUTES no longer has `photos-grid` or `photos-carousel`. The D-22 comment names their 18-14 successors. `settle()` waits for a resource matching `/\/terrain\/overview-contours-[a-z0-9-]+\.[0-9a-f]{10}\.svg$/` when `[data-overview-sheet]` is on the page. The `[data-map-mark]` part of the hero-contour condition was already gone (18-27 removed it), so only `[data-ascent-stage]` remains. Afterwards, `grep -c "view=grid"` = 0 and `grep -c data-overview-sheet` = 1.
- `e2e/visual/README.md`: the route list, the unzip folder list and the `--allow` example are updated.
- The visual-dark listing went from 76 to 70 tests: photos-grid and photos-carousel are gone, and photos @375/768/1440 are still there.
- D-24 round 5 (cause: overview) is closed. The dispatch artifact differs from HEAD only in `photos/{375,768,1440}-reduced`.
- Tim's `fc16583` re-baselines those three shots and deletes the six retired PNGs. CI OK concluded success on it.

## Retired visual entries and successors (GUARD-03, R_e2e 6)

| Retired test (Tim deleted the PNG in fc16583) | Successor (18-14, D-22 comment) |
|---|---|
| photos-grid @375 reduced (`photos-grid/375-reduced-visual-dark-linux.png`) | region zermatt-mid @375 reduced (`region/zermatt-mid-375`) |
| photos-grid @768 reduced (`photos-grid/768-reduced-visual-dark-linux.png`) | region zermatt-mid @768 reduced (`region/zermatt-mid-768`) |
| photos-grid @1440 reduced (`photos-grid/1440-reduced-visual-dark-linux.png`) | region zermatt-mid @1440 reduced (`region/zermatt-mid-1440`) |
| photos-carousel @375 reduced (`photos-carousel/375-reduced-visual-dark-linux.png`) | region zermatt-top @375 reduced (`region/zermatt-top-375`) |
| photos-carousel @768 reduced (`photos-carousel/768-reduced-visual-dark-linux.png`) | region zermatt-top @768 reduced (`region/zermatt-top-768`) |
| photos-carousel @1440 reduced (`photos-carousel/1440-reduced-visual-dark-linux.png`) | region zermatt-top @1440 reduced (`region/zermatt-top-1440`) |

At plan start (0bc1257) the allowance listing found 6 declared e2e rows, which matches the pinned R_e2e 6. Start counts: jest 2802, e2e 857, total 3659.

## GUARD-03 count gate (in order)

1. The start file `.test-count-18-28-start.tmp` was present.
2. `npm run guard:tests:scan`: scan OK.
3. End record: `test-count: jest 2802 + e2e 851 = 3653` (Jest 129/129 suites, 2802/2802 passed).
4. and 5. The jest and e2e lines:

```
jest 2802 -> 2802 (allowance 0, floor 2802)
e2e 857 -> 851 (allowance 6, floor 851)
```

6. `npm run guard:tests`: `jest 2802 + e2e 851 = 3653 (baseline 3024)` OK.

## Local gate (Task 1)

- `npm run lint` exited 0 and `npm run type-check` exited 0. `check-snapshot-commit --none` covered the 28 commits e0c8e3a..56662e6 with 0 failures.
- `PW_PROD=1 npx playwright test` with photos, photos-sweep, keyboard, photos-region, audit, no-webgl, seo and shell, in Chromium and Firefox: **592 passed, 1 failed (3.0 min)**. The failure is the known local-only Firefox `/offline` axe row (`frame.evaluate: Page crashed`). It also fails on the base sources, and CI Firefox passes it. I left it alone. `public/service-worker.js` was restored and port 3000 was free afterwards.
- **Client JS: 1,827,607 B** in 21 files, the same as 18-27 and 28,234 B under the 1,855,841 B cap.

## CI runs on ci/18-28 (D-26: every E2E leg)

### Run 45865093264 (headSha 56662e6, push, attempt 1): expected red on the overview shots only

https://github.com/tlex-web/portfolio-app/actions/runs/45865093264

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 17:08:18 | 17:08:25 | 0.1 |
| Dependency Review | skipped | | | 0 |
| Security Audit | success | 17:08:28 | 17:09:33 | 1.1 |
| Unit Tests | success | 17:08:28 | 17:10:03 | 1.6 |
| Lint and Type Check | success | 17:08:28 | 17:11:51 | 3.4 |
| Build Application | success | 17:11:54 | 17:12:49 | 0.9 |
| Visual Regression | failure (expected: 6 failed, 134 passed; only `photos @375/@768/@1440 reduced` in each scheme) | 17:08:28 | 17:14:03 | 5.6 |
| E2E Tests (chromium) | success, 789 passed (14.5m) | 17:08:28 | 17:24:37 | 16.2 |
| E2E Tests (firefox) | success, 692 passed (12.6m) | 17:08:28 | 17:22:47 | 14.3 |
| E2E Tests (webkit) | success, 695 passed (24.0m) | 17:08:28 | 17:34:09 | 25.7 |
| CI OK | failure (Visual only) | 17:34:12 | 17:34:18 | 0.1 |

The Visual diffs were 375x1608 to 375x1974 (419,784 px, 0.57), 768x1751 to 768x2135 (1,000,562 px, 0.62) and 1440x1627 to 1440x1590 (575,821 px, 0.25). 140 = 70 x 2 schemes, so the six retired entries were gone from both. No re-run.

### Run 45870865613 (headSha fc16583, Tim's commit, push, attempt 1): green

https://github.com/tlex-web/portfolio-app/actions/runs/45870865613

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 17:48:53 | 17:48:59 | 0.1 |
| Dependency Review | skipped | | | 0 |
| Security Audit | success | 17:49:01 | 17:49:13 | 0.2 |
| Unit Tests | success | 17:49:01 | 17:50:41 | 1.7 |
| Lint and Type Check | success | 17:49:02 | 17:50:49 | 1.8 |
| Build Application | success | 17:50:51 | 17:51:35 | 0.7 |
| Visual Regression | success, 140 passed (3.6m) | 17:49:01 | 17:53:28 | 4.5 |
| E2E Tests (chromium) | success, 789 passed (16.1m) | 17:49:02 | 18:06:06 | 17.1 |
| E2E Tests (firefox) | success, 692 passed (16.1m) | 17:49:01 | 18:06:00 | 17.0 |
| E2E Tests (webkit) | success, 695 passed (23.5m) | 17:49:01 | 18:13:26 | 24.4 |
| CI OK | **success** | 18:13:29 | 18:13:34 | 0.1 |

No re-run was used: attempt 1 succeeded, and no leg reported a flaky test (`--fail-on-flaky-tests`).

### D-26 summary

| Run | chromium | firefox | webkit |
|-----|----------|---------|--------|
| 45865093264 (56662e6) | 16.2 | 14.3 | 25.7 |
| 45870865613 (fc16583) | 17.1 | 17.0 | 24.4 |

The longest leg was webkit at 25.7 min. No leg reached the 35 min trip-wire, so no shard proposal is needed.

## Task 2: the declared dispatch and byte compare

- At 17:35:19Z I ran `gh workflow run visual-baselines.yml --ref ci/18-28 -f suite=visual -f update_mode=changed`, which became run **45869004528**. Before waiting I confirmed headBranch `ci/18-28`, headSha `56662e6158a0cce73d4f1ff1a1e29abbad6d14f2` and event `workflow_dispatch`. It concluded success (Update baselines took 2.5 min). https://github.com/tlex-web/portfolio-app/actions/runs/45869004528
- I downloaded the artifact into a new, empty scratchpad directory and compared it with a script kept outside that directory: `files=76 changed=3 identical=73 new=0 nonLinux=0 missingFromArtifact=0`, `VERDICT: OK (3 declared changed, all others identical)`.
- Identical, by folder: home 12, region 24, photo 3, lightbox 3, sources 3, box 3, coin-flip 3, contact 3, not-found 3, offline 3, projects 3, roadmap 3, menu 1. photos-grid 3 and photos-carousel 3 came back unchanged from the checkout and were not copied. Only photos 3 changed.
- I copied only the three photos PNGs into the working tree, each `cmp`-matched to the artifact. I staged nothing, committed nothing and deleted nothing.

### Per-shot table (old baseline: the v2.0 Zermatt map sheet with the Map/Grid/Carousel switcher)

| Shot | Size old -> new | First diff row / identical rows at bottom | What changed | Cause |
|------|-----------------|-------------------------------------------|--------------|-------|
| photos/375-reduced | 375x1608 -> 375x1974 | 100 / 886 | Kicker "3 regions · 11 photographs · 2016-2026". Full-bleed Alps sheet with contours, compact numbered markers 1-3 (1 N of its site, 3 NE) and five summit triangles (no labels at this width). The margin (contours every 1,000 m, extent, last surveyed 2021, Source Copernicus DEM GLO-90, summits). h2 Regions with three rows. | 18-22, 18-23, 3ad297b |
| photos/768-reduced | 768x1751 -> 768x2135 | 100 / 607 | Same header. Plates: Zermatt at its pinned diagonal fallback (NE of marker 1), Ortler E of 2, Saalfelden E of 3. Summit labels, the margin, and the region list below the sheet. | same |
| photos/1440-reduced | 1440x1627 -> 1440x1590 | 100 / 554 | No switcher. Sheet in the left column with plates E/W of their own markers and summit labels, margin below, region list in the right column. | same |

In every shot the site header (first 100 rows) and the footer are byte-identical. No marker, plate or label overlaps another, and the numbers run 1-3 west to east.

## Task 3: Tim's commit, verified

- Tim's commit is **`fc16583135b56e440b3f16e8ed9af8ecf731a43c`**, "test(18): re-baseline the overview and retire the view baselines (REGION-01, PHOTO-06, D-22, D-24)", author tlex-web. He pushed it to ci/18-28.
- Re-checked: `git rev-parse HEAD` = `git ls-remote origin refs/heads/ci/18-28` = fc16583135b56e440b3f16e8ed9af8ecf731a43c.
- `git show --name-status fc16583` lists exactly 9 files. It modifies `photos/{1440,375,768}-reduced-visual-dark-linux.png` and deletes the six retired PNGs listed in the mapping table above, `photos-grid/{1440,375,768}-reduced-visual-dark-linux.png` and `photos-carousel/{1440,375,768}-reduced-visual-dark-linux.png`. Nothing else is in it.
- `node scripts/ci/check-snapshot-commit.mjs --sha fc16583135b56e440b3f16e8ed9af8ecf731a43c --some --allow photos --allow-deletions` printed `snapshot-commit: OK (9 changed)` and exited 0.
- `node scripts/ci/check-visual-run.mjs --sha fc16583135b56e440b3f16e8ed9af8ecf731a43c --wait 30` printed `PASS https://github.com/tlex-web/portfolio-app/actions/runs/45870865613/job/140085682610` and exited 0.
- CI run 45870865613 has **CI OK success** on attempt 1 (table above).
- **The agent staged, committed, deleted and pushed no PNG.** The three re-baselined PNGs and the six deletions are all in Tim's commit fc16583.

## D-23 ledger

- I created ci/18-28 with a plain push of 56662e6. There was one dispatch (45869004528), no re-run, no fix push and no force-push. The phase branch and main were not pushed. The only push after that was Tim's fast-forward to fc16583. The close-out made no push and no dispatch.

## Task Commits

1. **Task 1: retire photos-grid/photos-carousel visual entries, overview contour settle wait**: `56662e6` (test)
2. **Task 2: dispatch and compare**: no commit (the PNGs were left for Tim)
3. **Task 3: Tim's re-baseline and deletions**: `fc16583` (test, Tim)

## Decisions Made

- Successor mapping follows 18-14's D-22 comment: grid maps to zermatt-mid and carousel to zermatt-top, at the same widths.
- The overview contour wait applies only when `[data-overview-sheet]` is present, so settle() behaves as before on every other route.

## Deviations from Plan

None. The plan said to "replace the `[data-map-mark]` part of the hero-contour condition", but 18-27 had already removed it (the condition is `[data-ascent-stage]` only), so Task 1 added only the overview wait. The plan's intent was met. The pre-existing prettier dirt in routes.spec.ts (line 40 and around 350) was left untouched.

## Issues Encountered

- The local-only Firefox `/offline` axe "Page crashed" flake (see Local gate). It is environmental, and CI Firefox passed it in both runs.

## Known Stubs

None.

## User Setup Required

None.

## Left for 18-29

- D-24 rounds 1-5 are complete. The visual suite holds 70 entries per scheme (140 tests), and no orphan baseline remains. photos-grid/ and photos-carousel/ are gone from the snapshot tree.
- REGION-01 and PHOTO-06 stay Pending in REQUIREMENTS.md. 18-29 still claims both, so its ledger marks them.
- The `.test-count-18-28-*.tmp` files are gitignored.

## Self-Check: PASSED

- e2e/visual/routes.spec.ts: FOUND, contains `data-overview-sheet`
- photos-grid/ and photos-carousel/ PNGs: absent at HEAD (deleted in fc16583)
- Commits 56662e6 and fc16583: FOUND in HEAD's history
- CI 45870865613: CI OK success. check-visual-run PASS. check-snapshot-commit (photos + deletions) exit 0.
