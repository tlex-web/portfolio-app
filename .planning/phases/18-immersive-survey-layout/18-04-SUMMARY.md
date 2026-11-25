---
phase: 18-immersive-survey-layout
plan: 04
subsystem: testing
tags: [visual-regression, re-baseline, d-24, footer, ci]
status: complete

requires:
  - phase: 18-03
    provides: "Footer Source row on every route (short swissALTIRegio credit + All data sources), the cause of this round"
  - phase: 18-01
    provides: "Green ci/18-01 run, the og pin (option A) and the B8 WebKit flake classification"
provides:
  - "D-24 round 1 of 5: the 36 full-page route shots {home, photos, photos-grid, photos-carousel, photo, projects, box, coin-flip, roadmap, contact, offline, not-found}/{375,768,1440}-reduced re-baselined for the footer Source row, committed by Tim as 48963a968e16bf242f15306b790665449fe8193d"
  - "Byte proof that the 13 undeclared shots (9 Home ascent, 3 lightbox, 1 menu) are identical in the dispatch artifact"
  - "CI OK success on Tim's commit (run 45601152533, attempt 2 after the one allowed re-run for the WebKit B8 flake); check-visual-run PASS; check-snapshot-commit --some OK (36 changed)"
affects: [18-05, 18-14, 18-20, 18-28, 18-29]

actuals:
  tokens: 0        # no text diff: the plan's only change is Tim's 36 PNGs (binary); the agent wrote only this SUMMARY
  tasks: 3
  commits: 1       # git rev-list --count 64a5da6..48963a9 = 1, Tim's PNG commit; the agent made no task commit; the metadata commit follows
plan_head_before: 64a5da65f34b533711216fb5edc06bb28a1da654
plan_head_after: 48963a968e16bf242f15306b790665449fe8193d

tech-stack:
  added: []
  patterns:
    - "One cause per re-baseline round: the declared set is fixed in the plan, the dispatch artifact is blob-compared to HEAD, and only changed declared PNGs are copied"
    - "A height-only change is localized by comparing both top-aligned and bottom-aligned, then a per-pixel check above the changed band"

key-files:
  created: []
  modified:
    - "e2e/visual/routes.spec.ts-snapshots/{home,photos,photos-grid,photos-carousel,photo,projects,box,coin-flip,roadmap,contact,offline,not-found}/{375,768,1440}-reduced-visual-dark-linux.png (36 files, Tim's commit 48963a9)"

key-decisions:
  - "18-04: D-24 round 1 (footer Source row) re-baselined alone: 36 declared full-page shots changed, 13 undeclared identical, 0 new; Tim committed them as 48963a9"
  - "18-04: WebKit B8 flake recurred on Tim's PNG-only commit (run 45601152533 attempt 1); the one allowed re-run passed"
  - "18-04: two 1/255 anti-aliasing diffs above the footer (home/375 card corners, photo/375 row 123) shown to Tim and accepted with his commit"

requirements-completed: []  # REGION-06 stays Pending: 18-05, 18-11, 18-23 and 18-29 also carry it, and the sheet-margin half is not built yet

metrics:
  duration: "about 1 h of agent execution over three sessions (00:55Z to 11:50Z 2026-11-25), most of it waiting on CI and the dispatch, plus the wait for Tim's commit"
  completed: 2026-11-25
---

# Phase 18 Plan 04: D-24 re-baseline round 1 (footer Source row) Summary

The footer Source row from 18-03 is re-baselined on its own. CI on ci/18-04 failed only on the 36 declared full-page shots. One `visual-baselines` dispatch produced 49 PNGs: the 36 declared shots changed (each 252 px shorter at 375 and 92 px shorter at 768 and 1440, with the change inside the footer band), and the 13 undeclared shots are byte-identical. Tim reviewed the 36 PNGs, committed them as `48963a968e16bf242f15306b790665449fe8193d` and pushed to ci/18-04. On that commit CI OK concluded success, check-visual-run printed PASS and check-snapshot-commit --some with the twelve --allow folders exited 0. **The agent committed no PNG.**

## Progress

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Local gate, push ci/18-04, CI red only on the declared set (tracer) | Done | none (no source change); CI run 45522283246 on 64a5da6 |
| 2 | One dispatch, download, blob compare, copy only changed declared PNGs | Done | none (Claude commits no PNG); dispatch run 45524859021 |
| 3 | Tim reviews, commits and pushes the PNGs; agent verifies CI on his commit | Done: Tim replied "pushed" | 48963a9 (Tim's, author tlex-web) |

## Task 1: local gate, ci/18-04 and the pre-baseline CI run

- Tip: `64a5da65f34b533711216fb5edc06bb28a1da654` (64a5da6, docs(18-07)). ci/18-04 was a new branch, pushed plain (no force). `git ls-remote origin refs/heads/ci/18-04` matched `git rev-parse HEAD`.
- Local gate on the unchanged tip, 2026-11-25:
  - `npm run lint`: exit 0, including the guards (served-images OK, test-count scan OK).
  - `npm run type-check`: exit 0 (tsc over the app, jest and e2e configs).
  - Jest: 124 suites, 2,484 tests, exit 0.
  - `node scripts/ci/check-snapshot-commit.mjs --sha <sha> --none` for all 22 commits in f93a888..64a5da6 (1458653 through 64a5da6): each printed `snapshot-commit: OK (0 changed)`, exit 0.

### CI run 45522283246 (headSha 64a5da6)

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 00:59:01 | 00:59:07 | 0.1 |
| Dependency Review | skipped | 00:58:59 | 00:58:59 | 0 |
| Security Audit | success | 00:59:10 | 01:00:18 | 1.1 |
| Unit Tests | success | 00:59:10 | 01:01:20 | 2.2 |
| Lint and Type Check | success | 00:59:09 | 01:01:29 | 2.3 |
| Build Application | success | 01:01:32 | 01:02:14 | 0.7 |
| Visual Regression | failure (expected) | 00:59:09 | 01:04:01 | 4.9 |
| E2E Tests (chromium) | success | 00:59:10 | 01:12:24 | 13.2 (13m14s) |
| E2E Tests (firefox) | success | 00:59:10 | 01:09:17 | 10.1 (10m07s) |
| E2E Tests (webkit) | success | 00:59:10 | 01:18:10 | 19.0 (19m00s) |
| CI OK | failure (caused only by Visual Regression) | 01:18:13 | 01:18:17 | 0.1 |

- Visual Regression: 72 failed, 26 passed.
  - The 72 failures are exactly the 36 declared `<route> @<width> reduced` tests (routes.spec.ts:146) for home, photos, photos-grid, photos-carousel, photo, projects, box, coin-flip, roadmap, contact, offline and not-found at 375, 768 and 1440, each in both projects (visual-dark and visual-light; visual-light compares against the visual-dark PNGs).
  - No failing title lies outside the set.
  - The 26 passes are the 13 undeclared shots (9 Home ascent, 3 lightbox, 1 menu), each in both projects.
- D-26: the longest leg is webkit at 19m00s, under the 35-minute trip-wire.
- Tracer gate: `<verify>` passed (headSha = tip; E2E legs and Unit Tests success), so the dispatch could proceed.

## Task 2: the one declared dispatch, download and blob compare

- Dispatch, the only one (D-23): `visual-baselines.yml` run 45524859021 ("Update visual baselines", suite visual, update_mode changed), event workflow_dispatch, headBranch `ci/18-04`, headSha `64a5da65f34b533711216fb5edc06bb28a1da654` (= HEAD), created 2026-11-25T01:19:14Z, conclusion success. https://github.com/tlex-web/portfolio-app/actions/runs/45524859021 . `gh run list --workflow visual-baselines.yml --branch ci/18-04` lists only this run.
- Downloaded with `gh run download 45524859021 -n visual-baselines` into a new, empty scratchpad directory (`dl-18-04`), never into the repo. The artifact has no wrapper folder: 49 files, all `<route>/<file>-linux.png`.
- Compared by a script kept outside the download directory (`tools-18-04/compare.cjs`, `git hash-object --no-filters` against `HEAD:e2e/visual/routes.spec.ts-snapshots/<path>`).
- **Result: files 49, changed 36, identical 13, new 0, missing from artifact 0.** Every changed shot is in the declared set; no shot outside it changed or is new.

### Per-shot table

| Route | Width | Shot | Status | Old size → new size |
|-------|-------|------|--------|---------------------|
| home | 375 | reduced | changed | 375x5586 → 375x5334 |
| home | 768 | reduced | changed | 768x5232 → 768x5140 |
| home | 1440 | reduced | changed | 1440x5109 → 1440x5017 |
| photos | 375 | reduced | changed | 375x1860 → 375x1608 |
| photos | 768 | reduced | changed | 768x1843 → 768x1751 |
| photos | 1440 | reduced | changed | 1440x1719 → 1440x1627 |
| photos-grid | 375 | reduced | changed | 375x2632 → 375x2380 |
| photos-grid | 768 | reduced | changed | 768x1770 → 768x1678 |
| photos-grid | 1440 | reduced | changed | 1440x1809 → 1440x1717 |
| photos-carousel | 375 | reduced | changed | 375x2051 → 375x1799 |
| photos-carousel | 768 | reduced | changed | 768x1791 → 768x1699 |
| photos-carousel | 1440 | reduced | changed | 1440x1667 → 1440x1575 |
| photo | 375 | reduced | changed | 375x1918 → 375x1666 |
| photo | 768 | reduced | changed | 768x1774 → 768x1682 |
| photo | 1440 | reduced | changed | 1440x1650 → 1440x1558 |
| projects | 375 | reduced | changed | 375x2613 → 375x2361 |
| projects | 768 | reduced | changed | 768x2207 → 768x2115 |
| projects | 1440 | reduced | changed | 1440x1819 → 1440x1727 |
| box | 375 | reduced | changed | 375x6045 → 375x5793 |
| box | 768 | reduced | changed | 768x4691 → 768x4599 |
| box | 1440 | reduced | changed | 1440x4300 → 1440x4208 |
| coin-flip | 375 | reduced | changed | 375x5304 → 375x5052 |
| coin-flip | 768 | reduced | changed | 768x3993 → 768x3901 |
| coin-flip | 1440 | reduced | changed | 1440x3723 → 1440x3631 |
| roadmap | 375 | reduced | changed | 375x3212 → 375x2960 |
| roadmap | 768 | reduced | changed | 768x2770 → 768x2678 |
| roadmap | 1440 | reduced | changed | 1440x2548 → 1440x2456 |
| contact | 375 | reduced | changed | 375x2653 → 375x2401 |
| contact | 768 | reduced | changed | 768x2407 → 768x2315 |
| contact | 1440 | reduced | changed | 1440x1829 → 1440x1737 |
| offline | 375 | reduced | changed | 375x2001 → 375x1749 |
| offline | 768 | reduced | changed | 768x1878 → 768x1786 |
| offline | 1440 | reduced | changed | 1440x1390 → 1440x1298 |
| not-found | 375 | reduced | changed | 375x1985 → 375x1733 |
| not-found | 768 | reduced | changed | 768x1758 → 768x1666 |
| not-found | 1440 | reduced | changed | 1440x1390 → 1440x1298 |
| home | 375 | ascent-start | identical | - |
| home | 375 | ascent-waypoint-2 | identical | - |
| home | 375 | ascent-summit | identical | - |
| home | 768 | ascent-start | identical | - |
| home | 768 | ascent-waypoint-2 | identical | - |
| home | 768 | ascent-summit | identical | - |
| home | 1440 | ascent-start | identical | - |
| home | 1440 | ascent-waypoint-2 | identical | - |
| home | 1440 | ascent-summit | identical | - |
| lightbox | 375 | - | identical | - |
| lightbox | 768 | - | identical | - |
| lightbox | 1440 | - | identical | - |
| menu | 375 | current-focus | identical | - |

### Where the changes are

- At a given width every changed shot is shorter by the same amount: 252 px at 375, 92 px at 768 and 1440. That is the long multi-source reference leaving the footer.
- Top-aligned, the first differing row in every changed shot is the new height minus 205. Bottom-aligned, the first difference is 144 rows up. So the change sits inside the footer band, between the Source row and the copyright rule.
- A per-pixel check above the footer band found 0 differing pixels in 34 of the 36 shots. The two exceptions cannot be seen:
  - `home/375`: 10 pixels at x 16-17, rows 664-666, 677-679 and 728-729, the rounded left corners of the Home section cards (Photography / Engineering). Max channel difference 1/255.
  - `photo/375`: 5 pixels on row 123, x 117-157, along the edge of a control box near the top. Max channel difference 1/255.
  - Both are anti-aliasing jitter; a 4x zoom of old and new looks identical. Tim was shown both and committed the PNGs anyway, so they are accepted.
- Viewed (old from HEAD, new from the artifact): contact 375 and 1440, home 375 and 1440. The old footer had "Source" followed by the long reference (swisstopo, TINITALY, DGM Österreich, Bayern, Baden-Württemberg, RGEAlti). The new footer has "Source", then "Contours derived from swissALTIRegio, swisstopo." with the link underlined, then "All data sources" on the next line. The copyright rule and "© 2026 Tim Lui. All rights reserved." are unchanged and moved up. Nothing above the Source row differs.

### Copy

- Only the 36 changed declared PNGs were copied into `e2e/visual/routes.spec.ts-snapshots/<route>/`, with no wrapper folder. Each copy matches its artifact file byte for byte (36/36 equal blob ids).
- Task 2 `<verify>`: exit 0. The working tree changed only declared `-reduced-visual-dark-linux.png` paths.
- Nothing staged, nothing committed by the agent.

## Task 3: Tim's commit and CI on it

- Tim's reply to the checkpoint: "pushed" (taken as the "re-baselined" resume signal).
- **Tim's commit: `48963a968e16bf242f15306b790665449fe8193d`**, "test(18): re-baseline full-page shots for the footer Source row (REGION-06, D-16)", author tlex-web. It has exactly 36 files, all `e2e/visual/routes.spec.ts-snapshots/<route>/<w>-reduced-visual-dark-linux.png` in the declared set (0 insertions, 0 deletions; binary only).
- `git rev-parse HEAD` = `git ls-remote origin refs/heads/ci/18-04` = 48963a968e16bf242f15306b790665449fe8193d.
- **The agent committed no PNG.** It staged, committed and pushed nothing in this plan. The only commit the agent makes is this SUMMARY's metadata commit, on the phase branch, which it does not push.

### CI run 45601152533 (headSha 48963a9, event push)

https://github.com/tlex-web/portfolio-app/actions/runs/45601152533

| Job | Attempt 1 | Attempt 2 (failed jobs re-run) | Start → end (UTC) | Minutes |
|-----|-----------|--------------------------------|-------------------|---------|
| Classify changes | success | (kept) | 11:05:35 → 11:05:42 | 0.1 |
| Dependency Review | skipped | skipped | 11:05:33 | 0 |
| Security Audit | success | (kept) | 11:05:45 → 11:06:38 | 0.9 |
| Unit Tests | success | (kept) | 11:05:44 → 11:08:04 | 2.3 |
| Lint and Type Check | success | (kept) | 11:05:45 → 11:09:14 | 3.5 |
| Visual Regression | **success** | (kept) | 11:05:44 → 11:09:17 | 3.6 |
| Build Application | success | (kept) | 11:09:17 → 11:10:59 | 1.7 |
| E2E Tests (chromium) | success | (kept) | 11:05:45 → 11:21:43 | 16.0 (15m58s) |
| E2E Tests (firefox) | success | (kept) | 11:05:44 → 11:18:28 | 12.7 (12m44s) |
| E2E Tests (webkit), attempt 1 | failure (B8 flake) | - | 11:05:45 → 11:26:41 | 20.9 (20m56s) |
| E2E Tests (webkit), attempt 2 | - | success | 11:27:42 → 11:43:54 | 16.2 (16m12s) |
| CI OK | failure (only from webkit) | **success** | 11:43:57 → 11:44:02 | 0.1 |

- **The one allowed re-run, recorded.** Attempt 1's webkit leg had 1 failure, 522 passed (19.1 min of tests). The failure was `[webkit] e2e/home-modes.spec.ts:610:7 › Home modes (HOME-02, HOME-07, HOME-08) › B8: rail tick labels keep 4.5:1 at every stop › B8: poster at 1440 x 900, every waypoint stop and the summit`, which timed out at 30 s in `locator.scrollIntoViewIfNeeded` (first try, retry 1) and `page.evaluate` (retry 2).
  - This is the WebKit B8 flake that 18-01 classified (failed in 45445770986, passed in 45506802759).
  - Tim's commit changes only 36 PNGs, which no functional spec reads, so it cannot cause a functional failure.
  - `gh run rerun 45601152533 --failed` re-ran webkit only. It passed in 16m12s, and CI OK concluded success on attempt 2. No other re-run, push or dispatch was made.
  - Failed log: scratchpad `18-04-webkit-failed.log`.
- D-26: the longest leg is webkit attempt 1 at 20m56s, under the 35-minute trip-wire. Every leg on both CI runs of ci/18-04 is under 21 minutes, so no shard or matrix proposal is needed.
- Visual Regression passed on attempt 1 against Tim's PNGs, so every route at all three widths now matches the new baselines in both projects.

### Checks on Tim's commit

```
$ node scripts/ci/check-visual-run.mjs --sha 48963a968e16bf242f15306b790665449fe8193d --wait 30
PASS https://github.com/tlex-web/portfolio-app/actions/runs/45601152533/job/139160180958
exit=0

$ node scripts/ci/check-snapshot-commit.mjs --sha 48963a968e16bf242f15306b790665449fe8193d --some --allow home --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow projects --allow box --allow coin-flip --allow roadmap --allow contact --allow offline --allow not-found
snapshot-commit: OK (36 changed)
exit=0
```

Run URL: https://github.com/tlex-web/portfolio-app/actions/runs/45601152533

## Client JS

Unchanged at **1,861,272 B**, the figure 18-07 left. The phase cap is 1,855,841 B, so it stays 5,431 B over. This plan changes no source. Tim chose to track the overage and decide at 18-25.

## Deviations from Plan

None. The plan ran as written. Three notes:
- CI on Tim's commit needed the one re-run the plan allows: the WebKit B8 flake on attempt 1, success on attempt 2 (recorded above).
- The resume signal was "pushed" rather than "re-baselined". The orchestrator checked Tim's commit (SHA, author, the 36 declared paths) and the remote ref before resuming.
- The two 1/255 anti-aliasing diffs above the footer (home/375, photo/375) were outside the "footer only" expectation in Task 2. They were flagged to Tim rather than stopping the plan, because they cannot be seen. Tim accepted them by committing.

## Notes for later rounds

- Round 2 is 18-05 (/sources). Its base is 48963a9, so the footer change is already in every baseline.
- The bottom-aligned compare and the per-pixel check above the changed band (scratchpad `tools-18-04/compare.cjs` and `region.cjs`) localized a height-only change cleanly; later rounds can reuse the method.
- Sub-visible 1/255 jitter on rounded corners can appear in a full-page shot whose height changed. Flag it to Tim with coordinates instead of treating it as a regression.

## Self-Check: PASSED

- This SUMMARY exists at `.planning/phases/18-immersive-survey-layout/18-04-SUMMARY.md`.
- 64a5da6 (plan base) and 48963a9 (Tim's commit) are ancestors of HEAD; `git log 64a5da6..HEAD` holds only Tim's commit before the metadata commit.
- Tim's commit lists 36 paths, 0 of them outside the declared `-reduced-visual-dark-linux.png` set.
- No stubs (no source change), no new threat surface beyond T-18-10..T-18-12.
