---
phase: 18-immersive-survey-layout
plan: 05
subsystem: testing
tags: [visual-regression, re-baseline, d-24, sources, srcset, ci]
status: complete

requires:
  - phase: 18-04
    provides: "D-24 round 1 (footer Source row) baselines in Tim's commit 48963a9, so /sources is baselined with the final footer"
  - phase: 18-08
    provides: "Region page sequence head row ('Skip to next region') and the 18-08 region e2e that exposed the portrait srcset under-fetch"
provides:
  - "D-24 round 2 of 5: /sources baselined alone as sources/{375,768,1440}-reduced-visual-dark-linux.png, committed by Tim as c24568d4c7ff5df51c46bbab1b50bf8503987ef4"
  - "The visual photo shot pinned by data to the one Zermatt view with a film line (Pitfall 8), with an exactly-one guard"
  - "srcset w descriptors equal to each derivative's pixel width (portraits no longer under-fetched at DPR 2), resolving the 18-08 deferred item that was planned for 18-19"
  - "shell.spec allows the region page's 'Skip to next region' link (pinned to 1 on /photos/regions/*, 0 elsewhere)"
  - "CI OK success on Tim's commit (run 45625611396, attempt 1, no re-run); check-visual-run PASS; check-snapshot-commit --some --allow sources OK (3 changed)"
affects: [18-11, 18-14, 18-19, 18-20, 18-23, 18-27, 18-28, 18-29]

actuals:
  tokens: 2900     # chars/4 over the text diff 7726167..c24568d (11,447 chars, PNGs excluded); the 3 PNGs are Tim's
  tasks: 3
  commits: 4       # git rev-list --count 7726167..c24568d = 4: three agent task commits (51e5972, 0a50450, 97091e8) and Tim's PNG commit; the metadata commit follows
plan_head_before: 772616797f207ba3bc93d91c5b0679407e7911fd
plan_head_after: c24568d4c7ff5df51c46bbab1b50bf8503987ef4

tech-stack:
  added: []
  patterns:
    - "A new-route round emulates update_mode=missing: dispatch with 'changed', then require exactly the declared new PNGs and byte-identity for every other PNG"
    - "A visual shot that picks its subject from data selects by a property unique by construction (the film line) and throws unless exactly one view matches"
    - "srcset w descriptors are the file's pixel width, never the long edge"

key-files:
  created:
    - "e2e/visual/routes.spec.ts-snapshots/sources/{375,768,1440}-reduced-visual-dark-linux.png (Tim's commit c24568d)"
  modified:
    - "e2e/visual/routes.spec.ts (sources route, film-scan selector over regionPhotoViews('zermatt'))"
    - "e2e/visual/README.md (photo selector line, sources slug, per-scheme count 52)"
    - "e2e/shell.spec.ts (region 'Skip to next region' allowance)"
    - "lib/photos/view-model.ts (imageSet writes v.width)"
    - "lib/__tests__/photos-view-model.test.ts (descriptor = pixel width, portrait present)"
    - ".planning/phases/18-immersive-survey-layout/deferred-items.md (18-08 srcset item marked resolved in 18-05)"

key-decisions:
  - "18-05: D-24 round 2 (/sources) re-baselined alone: 3 new, 49 identical, 0 changed; Tim committed the 3 PNGs as c24568d"
  - "18-05: the visual photo shot is chosen as the single Zermatt view with a film line, not the first approximate view (Pitfall 8); photo/* proved byte-identical"
  - "18-05: srcset w descriptors use the file's pixel width (97091e8), pulled forward from 18-19 because CI webkit runs at DPR 2 and no baselined srcset changes; Tim was told and did not object"

requirements-completed: []  # REGION-06 stays Pending: 18-11, 18-23 and 18-29 also carry it, and the sheet-margin half is not built yet

metrics:
  duration: "about 2 h wall clock (12:24Z to 14:25Z 2026-11-25), including four CI runs, the dispatch and the wait for Tim's commit"
  completed: 2026-11-25
---

# Phase 18 Plan 05: D-24 re-baseline round 2 (/sources) Summary

The /sources page joins the visual suite and is baselined on its own, and the photo-page shot is now pinned by data to the Zermatt film scan. CI on ci/18-05 first exposed two faults from 18-08, a stale shell.spec allow-list and a real portrait srcset under-fetch in WebKit at DPR 2. Each was fixed in its own pixel-neutral commit and pushed fast-forward. The one `visual-baselines` dispatch produced 52 PNGs: the 3 declared sources shots were new and the other 49 were byte-identical. Tim reviewed the three PNGs, committed them as `c24568d4c7ff5df51c46bbab1b50bf8503987ef4` and pushed to ci/18-05. On that commit CI OK concluded success on the first attempt, check-visual-run printed PASS and check-snapshot-commit --some --allow sources exited 0. **The agent committed no PNG.**

## Progress

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Sources route + film-scan selector, local gate, push ci/18-05, CI red only on the 3 sources shots (tracer) | Done | 51e5972, plus fixes 0a50450 and 97091e8; CI runs 45613887521, 45617794644, 45619051575 |
| 2 | One dispatch, download, blob compare, copy the 3 new PNGs | Done | none (Claude commits no PNG); dispatch run 45622077291 |
| 3 | Tim reviews, commits and pushes the PNGs; agent verifies CI on his commit | Done: Tim replied "pushed" | c24568d (Tim's, author tlex-web) |

## Task 1: spec change, local gate, ci/18-05

- Preconditions (checked 12:24Z): `git ls-remote origin refs/heads/ci/18-05` printed nothing; 48963a9 (Tim's 18-04 PNG commit) is an ancestor of HEAD.
- Selector proof before the edit (scratch jiti script `tools-18-05/slug.cjs`):
  - old key `buildPhotoViews().find(v => v.approximate)` gives `riffelsee-reflection`
  - new key `regionPhotoViews('zermatt').filter(v => v.strip.filmLine !== null)` gives [`riffelsee-reflection`] (exactly one)
  - In today's input the only approximate light-table view and the only film-line view are the same photo. The four other approximate photos (Saalfelden x2, Ortler x2) are in the published set, per 18-RESEARCH Pitfall 8. So the change is pixel-neutral by construction, and Task 2's byte compare confirms it.
- Commit **51e5972** `test(18-05): add the /sources route to the visual suite and pin the photo shot to the Zermatt film scan`:
  - e2e/visual/routes.spec.ts: the `buildPhotoViews` import is replaced by `regionPhotoViews`, with an exactly-one guard; `['sources', '/sources']` follows roadmap.
  - e2e/visual/README.md: the photo selector line, `sources` in the slug list, and the per-scheme count 48 to 52 (it was already stale at 49 because of the menu shot).
  - check-snapshot-commit --sha HEAD --none: `snapshot-commit: OK (0 changed)`.
- `npx playwright test e2e/visual/routes.spec.ts --project=visual-dark --list`: exit 0, "Total: 52 tests in 1 file", with `sources @375 reduced`, `sources @768 reduced` and `sources @1440 reduced` listed (routes.spec.ts:159). Acceptance greps: `view.approximate` 0, `filmLine` 1, `'/sources'` 1.
- Local gate: `npm run lint` exit 0 (served-images and test-count scan OK); `npm run type-check` exit 0.
- Push: `git push origin HEAD:refs/heads/ci/18-05`, a new branch, plain push (no force). ls-remote = 51e5972fa1770c35e63149e755f6ab1ef2944edf = HEAD.

### CI run 45613887521 (headSha 51e5972, event push, created 12:27:12Z)

https://github.com/tlex-web/portfolio-app/actions/runs/45613887521

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 12:27:16 | 12:27:23 | 0.1 |
| Dependency Review | skipped | 12:27:13 | 12:27:13 | 0 |
| Security Audit | success | 12:27:26 | 12:28:15 | 0.8 |
| Unit Tests | success | 12:27:26 | 12:29:43 | 2.3 |
| Lint and Type Check | success | 12:27:26 | 12:30:52 | 3.4 |
| Build Application | success | 12:30:56 | 12:31:53 | 1.0 |
| Visual Regression | failure (expected) | 12:27:26 | 12:31:37 | 4.2 |
| E2E Tests (chromium) | failure | 12:27:27 | 12:42:11 | 14.7 (14m44s) |
| E2E Tests (firefox) | failure | 12:27:26 | 12:37:58 | 10.5 (10m32s) |
| E2E Tests (webkit) | failure | 12:27:26 | 12:49:40 | 22.2 (22m14s) |
| CI OK | failure | 12:49:43 | 12:49:47 | 0.1 |

- Visual Regression: 6 failed, 98 passed. The 6 are exactly `sources @{375,768,1440} reduced` (routes.spec.ts:159) in visual-dark and visual-light, each "A snapshot doesn't exist at .../sources/<w>-reduced-visual-dark-linux.png". The 98 passes are the 49 existing shots in both projects, photo/* included, so the film-scan selector moved no pixel. As expected.
- E2E chromium: 1 failed, 643 passed (13.0 min). Firefox: 1 failed, 542 passed (9.1 min). In both, on every try: `e2e/shell.spec.ts:76:5 › Shell landmarks › /photos/regions/zermatt: one shell, skip link first, current page Photographs`. `getByRole('link', { name: /skip to/i })` expected 1, got 2.
- E2E webkit: 4 failed, 544 passed (20.5 min):
  1. `home-modes.spec.ts:610:7` B8 poster at 1440 x 900 (the known WebKit B8 flake)
  2. `photos-region.spec.ts:569:7` Region sequence, /photos/regions/ortler at 1440: "meadow-stream-below-the-peaks at 1440: the file is at least 965.33 px wide. Expected >= 965, Received 768" (every try)
  3. `photos-region.spec.ts:627:7` Region header slot, /photos/regions/ortler at 1440: "ortler cover at 1440: the file is at least 917.33 px wide. Expected >= 917, Received 768" (every try)
  4. the same shell.spec region skip-link failure
- D-26: longest leg webkit 22m14s, under 35.

### Diagnosis 1: shell.spec skip-link count (fixed in 0a50450)

- 18-08 (8d30564) added the sequence head row's "Skip to next region" link, as 18-UI-SPEC Contract 2 requires (and the copy table, line 568). shell.spec.ts allowed only Home's "Skip to the summit" besides the global "Skip to main content". So the product was right and the spec's allow-list was stale. 18-08 had not run the E2E suite in CI.
- Commit **0a50450** `test(18-05): allow the region page's "Skip to next region" link in the shell landmark counts`: the spec names the link exactly, pins it to 1 on /photos/regions/* and 0 elsewhere, and the /skip to/i total is 1 + Home cue + region cue. Test-only and pixel-neutral; check-snapshot-commit --none OK (0 changed). Local chromium: shell.spec 41/41 passed. Lint 0, type-check 0. Fast-forward pushed 51e5972..0a50450.

### Diagnosis 2: WebKit Ortler @1440 under-fetch (fixed in 97091e8)

- The webkit project uses `devices['Desktop Safari']`, deviceScaleFactor 2: the report's failure screenshots are 2880x1800. Chromium and Firefox run at DPR 1.
- Measured locally in Chromium and Firefox at 1440 (scratch `tools-18-05/measure.cjs`): the Ortler cover paints 459 px wide in a 1088x612 slot, and the sequence figure paints 483 px. At DPR 2 that is 917 and 965 px, exactly the failing "need".
- `imageSet` (lib/photos/view-model.ts:203-204) wrote `${v.longEdge}w`. The Ortler photos are 3:4 portraits: the "1024" file is 768 px wide (webp VP8X and AVIF ispe both 768), and "1600" is 1200 px wide. For a 917/965 px need, WebKit picks the "1024w" candidate (it claims 1024 px, at least the need) and gets a 768 px file. This is a real under-fetch, not a test artefact.
- This is the deferred item 18-08 logged ("Portrait srcset descriptors overstate the file width", for 18-19). The deferral rested on two premises, and both were wrong:
  - "DPR 1, the width every local and CI project uses": the CI webkit project runs at DPR 2.
  - "The fix changes srcsets on baselined pages": the only portrait in the published set is `meadow-stream-below-the-peaks` (scratch `tools-18-05/orient.cjs`), which renders only on region pages, and region pages are not baselined. /photos (map, grid, carousel), the photo page and the lightbox render `photoViews`, the four landscape light-table views; /offline is a text catalog. For every one of their 16 variants `width === longEdge` (scratch `tools-18-05/neutral.cjs`: "longEdge!=width: 0"), so every baselined srcset string stays byte-identical.
- So it is a pixel-neutral functional fix, the case the plan's Task 1 action allows. It was not caused by 18-05: the failing tests and the code are 18-08's.
- Commit **97091e8** `fix(18-05): srcset w descriptors are the file's pixel width, so portraits are not under-fetched`:
  - lib/photos/view-model.ts `imageSet`: `${v.width}w`.
  - lib/__tests__/photos-view-model.test.ts: a new test checks that every published tile and stage descriptor equals the derivative's pixel width and that the set holds a portrait. RED first ("...-640.13968b6ab4.avif 480w" expected, "640w" received), then GREEN.
  - deferred-items.md: the 18-08 item is marked resolved in 18-05.
  - Jest 126 suites / 2,525 tests pass; lint 0; type-check 0; check-snapshot-commit --none OK (0 changed).
  - Local e2e: photos-region.spec `-g regions/ortler`, chromium and firefox, 16/16 passed.
  - Chromium emulating DPR 2 at 1440 (scratch `tools-18-05/dpr2.cjs`): cover need 918, sequence need 966; both now take `-1600` (descriptor 1200w, file 1200 px).
- Fast-forward pushed 0a50450..97091e8 at 12:59Z. **97091e8 is the only product change in this plan**, and it resolves the 18-08 deferred item that was planned for 18-19.

### CI run 45617794644 (headSha 0a50450, the shell fix; event push, created 12:51:29Z)

https://github.com/tlex-web/portfolio-app/actions/runs/45617794644

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 12:51:32 | 12:51:39 | 0.1 |
| Dependency Review | skipped | 12:51:30 | 12:51:29 | 0 |
| Security Audit | success | 12:51:42 | 12:52:00 | 0.3 |
| Unit Tests | success | 12:51:42 | 12:53:13 | 1.5 |
| Lint and Type Check | success | 12:51:42 | 12:54:01 | 2.3 |
| Build Application | success | 12:54:04 | 12:54:59 | 0.9 |
| Visual Regression | failure (expected) | 12:51:42 | 12:55:37 | 3.9 |
| E2E Tests (chromium) | success | 12:51:42 | 13:08:02 | 16.3 (16m20s) |
| E2E Tests (firefox) | success | 12:51:42 | 13:05:10 | 13.5 (13m28s) |
| E2E Tests (webkit) | failure | 12:51:42 | 13:08:49 | 17.1 (17m07s) |
| CI OK | failure | 13:08:53 | 13:08:58 | 0.1 |

- Visual Regression: the same 6 sources failures (3 shots x 2 projects), 98 passed.
- chromium 644 passed; firefox 543 passed. The shell fix holds in every engine.
- webkit: 2 failed, 546 passed (15.4 min). The two failures are photos-region.spec.ts:569 and :627 for /photos/regions/ortler at 1440, as expected on this pre-fix SHA. The B8 flake did not recur.
- D-26: longest leg webkit 17m07s.

### CI run 45619051575 (headSha 97091e8, the descriptor fix; event push, created 12:59:27Z): the tracer gate run

https://github.com/tlex-web/portfolio-app/actions/runs/45619051575

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 12:59:30 | 12:59:37 | 0.1 |
| Dependency Review | skipped | 12:59:28 | 12:59:28 | 0 |
| Security Audit | success | 12:59:40 | 12:59:59 | 0.3 |
| Unit Tests | success | 12:59:40 | 13:01:22 | 1.7 |
| Lint and Type Check | success | 12:59:40 | 13:02:18 | 2.6 |
| Build Application | success | 13:02:21 | 13:03:06 | 0.8 |
| Visual Regression | failure (expected) | 12:59:39 | 13:02:58 | 3.3 |
| E2E Tests (chromium) | success | 12:59:40 | 13:13:18 | 13.6 (13m38s) |
| E2E Tests (firefox) | success | 12:59:40 | 13:11:19 | 11.7 (11m39s) |
| E2E Tests (webkit) | success | 12:59:40 | 13:16:49 | 17.2 (17m09s) |
| CI OK | failure (only from Visual Regression) | 13:16:52 | 13:16:56 | 0.1 |

- Visual Regression: 6 failed, 98 passed. The failing titles are exactly the three `sources @<w> reduced` in visual-dark and visual-light, all 6 "A snapshot doesn't exist". So the descriptor fix moved no existing baseline either.
- E2E: chromium 644 passed, firefox 543 passed, webkit 548 passed, with no failure and no flake. Ortler @1440 passes in WebKit at DPR 2.
- D-26: longest leg webkit 17m09s.
- Tracer gate (Task 1 `<verify>`): the listing check (3 sources tests) passed; the CI check passed on this run ("all E2E + Unit success" = true). ls-remote ci/18-05 = HEAD = 97091e8ce3425b748bf36341d761177a4c9c3d0c. No re-run was used.

## Task 2: the one declared dispatch, download and blob compare

- Dispatch, the only one (D-23): `gh workflow run visual-baselines.yml --ref ci/18-05 -f suite=visual -f update_mode=changed`. Before it, `gh run list --workflow visual-baselines.yml --branch ci/18-05` listed 0 runs.
- **Run 45622077291** ("Update visual baselines"), event workflow_dispatch, **headBranch `ci/18-05`, headSha `97091e8ce3425b748bf36341d761177a4c9c3d0c`** (= HEAD, checked before waiting), created 2026-11-25T13:17:33Z. Job "Update baselines" ran 13:17:37 to 13:19:55 (2.3 min), conclusion success. https://github.com/tlex-web/portfolio-app/actions/runs/45622077291
- Downloaded with `gh run download 45622077291 -n visual-baselines` into the new, empty scratchpad directory `dl-18-05`, never into the repo. There is no wrapper folder: 52 files, all `<route>/<file>-linux.png`.
- Compared with scratch `tools-18-05/compare.cjs`, kept outside the download directory. It is round 1's script with DECLARED = `sources/(375|768|1440)-reduced-visual-dark-linux.png` and a verdict line, and it uses `git hash-object --no-filters` against `HEAD:e2e/visual/routes.spec.ts-snapshots/<path>`.
- **Result: files 52, changed 0, identical 49, new 3, non-Linux 0, missing from artifact 0. "VERDICT: OK (3 declared new, all others identical)".** photo/* is identical, so the film-scan selector is pixel-neutral. All 49 existing shots are identical, so the shell and descriptor fixes are pixel-neutral too.
- Copied only the three new files into `e2e/visual/routes.spec.ts-snapshots/sources/`. Each copy is blob-equal to its artifact file (f33dcea9c6 / 7ad3b63712 / cbbc163a0c for 375 / 768 / 1440).
- Nothing was staged. No agent commit contains a PNG: `git log --name-only` over 51e5972, 0a50450 and 97091e8 shows 0 .png files, and check-snapshot-commit --none reported "OK (0 changed)" for each.

### Per-shot table (dispatch artifact vs HEAD 97091e8)

| Route | Width | Shot | Status | New size |
|-------|-------|------|--------|----------|
| sources | 375 | reduced | new | 375x3300 |
| sources | 768 | reduced | new | 768x2750 |
| sources | 1440 | reduced | new | 1440x2626 |
| box | 375 | reduced | identical | - |
| box | 768 | reduced | identical | - |
| box | 1440 | reduced | identical | - |
| coin-flip | 375 | reduced | identical | - |
| coin-flip | 768 | reduced | identical | - |
| coin-flip | 1440 | reduced | identical | - |
| contact | 375 | reduced | identical | - |
| contact | 768 | reduced | identical | - |
| contact | 1440 | reduced | identical | - |
| home | 375 | ascent-start | identical | - |
| home | 375 | ascent-summit | identical | - |
| home | 375 | ascent-waypoint-2 | identical | - |
| home | 375 | reduced | identical | - |
| home | 768 | ascent-start | identical | - |
| home | 768 | ascent-summit | identical | - |
| home | 768 | ascent-waypoint-2 | identical | - |
| home | 768 | reduced | identical | - |
| home | 1440 | ascent-start | identical | - |
| home | 1440 | ascent-summit | identical | - |
| home | 1440 | ascent-waypoint-2 | identical | - |
| home | 1440 | reduced | identical | - |
| lightbox | 375 | - | identical | - |
| lightbox | 768 | - | identical | - |
| lightbox | 1440 | - | identical | - |
| menu | 375 | current-focus | identical | - |
| not-found | 375 | reduced | identical | - |
| not-found | 768 | reduced | identical | - |
| not-found | 1440 | reduced | identical | - |
| offline | 375 | reduced | identical | - |
| offline | 768 | reduced | identical | - |
| offline | 1440 | reduced | identical | - |
| photo | 375 | reduced | identical | - |
| photo | 768 | reduced | identical | - |
| photo | 1440 | reduced | identical | - |
| photos | 375 | reduced | identical | - |
| photos | 768 | reduced | identical | - |
| photos | 1440 | reduced | identical | - |
| photos-carousel | 375 | reduced | identical | - |
| photos-carousel | 768 | reduced | identical | - |
| photos-carousel | 1440 | reduced | identical | - |
| photos-grid | 375 | reduced | identical | - |
| photos-grid | 768 | reduced | identical | - |
| photos-grid | 1440 | reduced | identical | - |
| projects | 375 | reduced | identical | - |
| projects | 768 | reduced | identical | - |
| projects | 1440 | reduced | identical | - |
| roadmap | 375 | reduced | identical | - |
| roadmap | 768 | reduced | identical | - |
| roadmap | 1440 | reduced | identical | - |

### The three new baselines

- All three widths show the nav (the Menu button at 375), h1 "Data sources" over a rule, and the Contract 7 intro draft ("The maps on this site are drawn from three elevation models. ...").
- Three entries in order, each with Credit / Licence / Changes / Used on:
  - swissALTIRegio: the full verbatim multi-source credit (`site.attribution.terrain`: swisstopo; TINITALY; DGM Österreich; Bayern; Baden-Württemberg; RGEAlti), the licence link "swisstopo terms of use for free geodata and geoservices (OGD)" with the external icon, and Changes "Cut to each map's extent at its native 10 m grid; contours every 100 m and a hillshade derived; modified." Used on: Zermatt, Switzerland and Ortler, Italy as links, plus "The footer of every page" as plain text.
  - BEV ALS DTM: the credit with its DOI, the licence link CC BY 4.0, Changes plus the Edition 15 September 2025 line, and Used on Saalfelden, Austria.
  - Copernicus DEM GLO-90: notice and liability as two paragraphs, the licence link "Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open", Changes "Resampled to a coarser grid covering the Alps; contours every 1,000 m derived; modified.", and Used on Alps overview.
- The footer is round 1's: the contour band, Tim Lui / Developer & photographer, GitHub / LinkedIn / Email, the Zermatt – Matterhorn legend, "Source: Contours derived from swissALTIRegio, swisstopo." then "All data sources", and the © line.
- Points shown to Tim, all as specified: at 375 the RGEAlti URL breaks mid-word ("telecharge/ment5m"), which is Contract 7's `wrap-anywhere` on the credit; at 375 the swissALTIRegio licence link wraps to two lines, with the external icon at the right end of the line. The content column is `max-w-prose`, so at 1440 the right half of the page is empty.

## Task 3: Tim's commit and CI on it

- Tim's reply to the checkpoint: "pushed" (taken as the "re-baselined" resume signal). He was told that 97091e8 pulls the srcset-descriptor fix forward from 18-19 and was invited to object; he did not.
- **Tim's commit: `c24568d4c7ff5df51c46bbab1b50bf8503987ef4`**, "test(18): add /sources baselines (REGION-06, D-20)", author tlex-web. It holds exactly 3 files, `e2e/visual/routes.spec.ts-snapshots/sources/{375,768,1440}-reduced-visual-dark-linux.png` (new, 211,183 / 244,997 / 265,002 bytes; binary only).
- `git rev-parse HEAD` = `git ls-remote origin refs/heads/ci/18-05` = c24568d4c7ff5df51c46bbab1b50bf8503987ef4.
- **The agent committed no PNG.** Its three task commits (51e5972, 0a50450, 97091e8) hold no PNG, and the only other agent commit is this SUMMARY's metadata commit on the phase branch, which the agent does not push.

### CI run 45625611396 (headSha c24568d, event push, created 13:38:11Z)

https://github.com/tlex-web/portfolio-app/actions/runs/45625611396

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 13:38:14 | 13:38:22 | 0.1 |
| Dependency Review | skipped | 13:38:12 | 13:38:12 | 0 |
| Security Audit | success | 13:38:24 | 13:38:42 | 0.3 |
| Unit Tests | success | 13:38:24 | 13:39:54 | 1.5 |
| Lint and Type Check | success | 13:38:24 | 13:41:14 | 2.8 |
| Build Application | success | 13:41:16 | 13:42:01 | 0.8 |
| Visual Regression | **success** | 13:38:24 | 13:41:46 | 3.4 |
| E2E Tests (chromium) | success | 13:38:24 | 13:52:10 | 13.8 (13m46s) |
| E2E Tests (firefox) | success | 13:38:24 | 13:51:43 | 13.3 (13m19s) |
| E2E Tests (webkit) | success | 13:38:24 | 13:55:09 | 16.8 (16m45s) |
| CI OK | **success** | 13:55:12 | 13:55:15 | 0.1 |

- Attempt 1, no re-run. Visual Regression 104 passed (2.2 min): 52 shots in each of visual-dark and visual-light. E2E chromium 644 passed (12.6 min), firefox 543 passed (12.4 min), webkit 548 passed (15.8 min). The WebKit B8 flake did not recur.
- D-26: longest leg webkit 16m45s. Across all four CI runs on ci/18-05 the longest leg is webkit 22m14s (run 45613887521), under the 35-minute trip-wire, so no shard or matrix proposal is needed.

### Checks on Tim's commit

```
$ node scripts/ci/check-visual-run.mjs --sha c24568d4c7ff5df51c46bbab1b50bf8503987ef4 --wait 30
PASS https://github.com/tlex-web/portfolio-app/actions/runs/45625611396/job/139244964809
exit=0

$ node scripts/ci/check-snapshot-commit.mjs --sha c24568d4c7ff5df51c46bbab1b50bf8503987ef4 --some --allow sources
snapshot-commit: OK (3 changed)
exit=0
```

Run URL: https://github.com/tlex-web/portfolio-app/actions/runs/45625611396

## Client JS

Measured once on c24568d (`rm -rf .next/static && npm run build`, byte sum of `.next/static/chunks/**/*.js`, 25 files, then `git restore public/service-worker.js`): **1,861,681 B**. That is unchanged from the 1,861,681 B 18-08 left: 97091e8 changes one template string in `imageSet`, and the other commits are test, doc and PNG only. The phase cap is 1,855,841 B, so it stays 5,840 B over. Tim tracks the overage to 18-25.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, test] shell.spec rejected the region page's "Skip to next region" link**
- **Found during:** Task 1 (CI run 45613887521, all three engines)
- **Issue:** shell.spec.ts allowed only Home's "Skip to the summit" besides the global skip link, so 18-08's UI-SPEC-mandated "Skip to next region" failed /photos/regions/zermatt.
- **Fix:** name the link exactly, pin it to 1 on /photos/regions/* and 0 elsewhere, and count the /skip to/i total from both cues.
- **Files modified:** e2e/shell.spec.ts
- **Commit:** 0a50450

**2. [Rule 1 - Bug, product] Portrait srcset descriptors under-fetched at DPR 2**
- **Found during:** Task 1 (CI run 45613887521, webkit, every try)
- **Issue:** `imageSet` wrote the long edge as the `w` descriptor, so WebKit (DPR 2) took the 768 px "1024w" Ortler file for a 917/965 px need, failing two 18-08 e2e tests.
- **Fix:** write `v.width`; a unit test pins every published descriptor to the file's pixel width. Pixel-neutral, as shown by Visual Regression (98 passed on 97091e8) and the byte compare (49 identical). This resolves the 18-08 deferred item early, because both premises of that deferral were wrong (CI webkit runs at DPR 2; the fix touches no baselined srcset). It is the plan's "functional fault, own pixel-neutral commit, fast-forward push" case.
- **Files modified:** lib/photos/view-model.ts, lib/__tests__/photos-view-model.test.ts, .planning/phases/18-immersive-survey-layout/deferred-items.md
- **Commit:** 97091e8

**3. [Doc] README per-scheme count 48 to 52**
- It was already stale (49 with the menu shot), and the sources route made it 52. Commit 51e5972.

**4. [Plan verify] Task 2's `git status --porcelain` check needs `-uall` for a new folder**
- For a new untracked folder, `git status --porcelain` prints the single line `?? e2e/visual/routes.spec.ts-snapshots/sources/`, so the per-file grep counts 0 and the check exits non-zero even when the files are right. With `git status --porcelain -uall` it passed: exactly the three sources PNGs and nothing else.

D-23 scope kept: new branch ci/18-05 with a plain push plus two fast-forward fix pushes, one dispatch, no force, no re-run, no PNG committed by the agent, and neither the phase branch nor main pushed.

## Notes for later rounds

- Round 3 builds on c24568d, so sources/* and the round-1 footer are in every baseline.
- The photo shot is now independent of `approximate`; 18-27 can retire the light table without moving photo/*, as long as exactly one Zermatt view keeps a film line (the guard throws otherwise).
- The CI webkit project runs at DPR 2. Any later "DPR 1 everywhere" assumption about image fetching is wrong for WebKit.
- Run the E2E suite in CI before a plan's SUMMARY when it adds UI that existing specs count (the 18-08 skip-link lesson).

## Self-Check: PASSED

- This SUMMARY exists at `.planning/phases/18-immersive-survey-layout/18-05-SUMMARY.md`.
- 51e5972, 0a50450, 97091e8 and c24568d are ancestors of HEAD; `git rev-list --count 7726167..c24568d` = 4.
- Tim's commit lists 3 paths, all under `e2e/visual/routes.spec.ts-snapshots/sources/`; the agent's three commits contain 0 PNGs.
- No stubs. No new threat surface beyond T-18-13..T-18-15; the srcset change only alters which existing public derivative a browser selects.
