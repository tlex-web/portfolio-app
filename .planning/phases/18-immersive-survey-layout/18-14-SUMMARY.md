---
phase: 18-immersive-survey-layout
plan: 14
subsystem: testing
tags: [visual-regression, re-baseline, d-24, d-21, region-pages, webkit, has-selector, ci]
status: complete

requires:
  - phase: 18-05
    provides: "D-24 round 2 baselines in Tim's commit c24568d, so round 3 builds on the final footer and the sources shots"
  - phase: 18-08
    provides: "Region sequence in map collars and the header slot that the top, mid and end shots frame"
  - phase: 18-10
    provides: "Plate key list and list-plate sync (the :has() CSS that CI WebKit exposed)"
  - phase: 18-11
    provides: "Sheet margins that the plate shots frame"
  - phase: 18-12
    provides: "Altimeter rail with data-rail-current, the positive settle signal of every region shot from 768 px"
provides:
  - "D-24 round 3 of 5: 24 region viewport shots (D-21 as amended at 18-14), committed by Tim as 894435985ff4dc496ba12708f0cc6c9ceb4265be"
  - "REGION_SHOTS in e2e/visual/routes.spec.ts: positions chosen from data (mid = floor((N - 1) / 2) of regionPhotoViews('zermatt')), rail, hero-contour and relief waits, viewport shots only"
  - "Copy mode forced in every visual test (an init script removes navigator.share and canShare)"
  - "The lightbox shot opens from the Zermatt sequence (same photo, byte-identical PNGs)"
  - "WebKit-safe plate sync CSS: one :has() per state (2325d0a), with a unit test that forbids :has(...:is( / :where("
  - "CI OK success on Tim's commit (run 45672001635, attempt 1, no re-run); check-visual-run PASS; check-snapshot-commit --some --allow region OK (24 changed)"
affects: [18-15, 18-16, 18-19, 18-20, 18-22, 18-23, 18-25, 18-27, 18-28, 18-29]

actuals:
  tokens: 5350     # chars/4 over the text diff 9726505..8944359 (21,398 chars, PNGs excluded); the 24 PNGs are Tim's
  tasks: 3
  commits: 6       # git rev-list --count 9726505..8944359 = 6: five agent commits (cf0b3a1, 2325d0a, 0ba60ea, 7740326, fcff66d) and Tim's PNG commit; the metadata commit follows
plan_head_before: 97265055ee9421e376601e762157c14a936878cb
plan_head_after: 894435985ff4dc496ba12708f0cc6c9ceb4265be

tech-stack:
  added: []
  patterns:
    - "A visual shot that depends on scroll position waits on a positive signal the page publishes (data-rail-current), not on a timeout"
    - "WebKit :has() invalidation: never put :is()/:where() inside :has() for a state the targets do not share; emit one :has() per state"
    - "A plan that adds positions after a dispatch dispatches again and proves the earlier shots byte-identical across both artifacts (a determinism check)"

key-files:
  created:
    - "e2e/visual/routes.spec.ts-snapshots/region/{zermatt-top,zermatt-plate,zermatt-mid,zermatt-end,ortler-top,ortler-plate,saalfelden-top,saalfelden-plate}-{375,768,1440}-visual-dark-linux.png (24, Tim's commit 8944359)"
  modified:
    - "e2e/visual/routes.spec.ts (REGION_SHOTS, PLATE_FIGURE, copy-mode beforeEach, region hero-contour wait in settle, relief wait for the plate position, lightbox opened from /photos/regions/zermatt, D-22 comment)"
    - "e2e/visual/README.md (region shots, 76 tests per scheme)"
    - "lib/photos/plate-layout.ts (syncRules: one :has() anchor per state)"
    - "lib/__tests__/plate-layout.test.ts (three-anchor form pinned, :has(...:is( forbidden)"
    - ".planning/phases/18-immersive-survey-layout/18-CONTEXT.md (D-21 amended 2026-11-25)"
    - ".planning/phases/18-immersive-survey-layout/deferred-items.md (overview :has() split; Windows WebKit Tab tags)"

key-decisions:
  - "18-14: D-24 round 3 (region pages) re-baselined: 24 new region PNGs, 52 identical, 0 changed; Tim committed them as 8944359"
  - "18-14: D-21 amended (Tim, 'Add plate shots now'): a plate position for all three regions (24 region PNGs, not 15) and one extra visual-baselines dispatch in 18-14"
  - "18-14: WebKit :has() invalidation does not look inside :is(); the plate sync emits one :has() per state (2325d0a, Tim: 'Diagnose locally, then fix'); the overview's same pattern is deferred to the plan that renders overviewCss"

requirements-completed: []  # REGION-02..05 stay Pending: 18-29 closes them (sibling plans also carry them)

coverage:
  - id: D1
    description: "24 region viewport shots (D-21 as amended) baselined and passing in CI on Tim's commit"
    requirement: "REGION-02"
    verification:
      - kind: automated_ui
        ref: "e2e/visual/routes.spec.ts region <id>-<pos> @<w> reduced (CI run 45672001635, Visual Regression 152 passed)"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 894435985ff4dc496ba12708f0cc6c9ceb4265be --wait 30"
        status: pass
    human_judgment: false
  - id: D2
    description: "Plate badges follow key-row hover in WebKit (one :has() per state)"
    requirement: "REGION-02"
    verification:
      - kind: unit
        ref: "lib/__tests__/plate-layout.test.ts"
        status: pass
      - kind: e2e
        ref: "e2e/photos-region.spec.ts:1031 hovering key row 2 marks its badge accent (CI webkit, run 45672001635)"
        status: pass
    human_judgment: false

metrics:
  duration: "about 2 h 47 min wall clock (15:41Z to 18:28Z 2026-11-25), including five CI runs, two dispatches, an Actions outage and the wait for Tim's commit"
  completed: 2026-11-25
---

# Phase 18 Plan 14: D-24 re-baseline round 3 (region pages) Summary

The three region pages are now in the visual suite as 24 viewport shots, 900 px high with reduced motion. Zermatt has top, plate, mid and end shots, and Ortler and Saalfelden each have top and plate. Every position is chosen from data and settles on a positive signal: the rail's `data-rail-current`, the plate's own hero-contour SVG, and the decoded relief image. Every visual test now runs in copy mode, and the lightbox shot opens the same photo from the Zermatt sequence instead of the grid.

CI on ci/18-14 first exposed a WebKit-only failure from 18-10: the plate badges did not follow key-row hover. Tim chose to diagnose it locally. The cause is that WebKit does not invalidate `:has()` through `:is()` on a hover change, and 2325d0a fixes it.

The plates were not visible in any of the first 15 shots. Tim chose to add a plate position, which amended D-21 to 24 PNGs and allowed a second dispatch. The second artifact held 24 new PNGs, and the other 52 were byte-identical. The 15 round-A shots were byte-identical across the two dispatches.

Tim committed the 24 PNGs as `894435985ff4dc496ba12708f0cc6c9ceb4265be` and pushed them to ci/18-14. On that commit CI OK concluded success on the first attempt, check-visual-run printed PASS and check-snapshot-commit --some --allow region exited 0. **The agent committed no PNG.**

## Progress

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Region shots, copy mode, contour wait, lightbox opener; local gate; push ci/18-14 (tracer) | Done | cf0b3a1; fix 2325d0a; docs 0ba60ea; re-trigger 7740326; plate shots fcff66d. CI runs 45648612139, 45661298142, 45667131664 |
| 2 | Dispatch, download, byte compare, copy only the new region PNGs | Done (twice, the second authorized by Tim) | none (Claude commits no PNG); dispatches 45665012575 and 45670115431 |
| 3 | Tim reviews, commits and pushes; agent verifies CI on his commit | Done: Tim replied "pushed" | 8944359 (Tim's, author tlex-web); CI run 45672001635 |

## Task 1: spec change, local gate, ci/18-14

- Preconditions (checked 15:41Z): `git ls-remote origin refs/heads/ci/18-14` printed nothing. c24568d (Tim's 18-05 PNG commit) and 48963a9 are ancestors of HEAD 9726505.
- Data (scratch `tools-18-14/slug.cjs`): `regionPhotoViews('zermatt')` has N = 7 views: matterhorn-from-zermatt, gornerschlucht-waterfall, matterhorn-glacier-trail, riffelsee-reflection, butterfly-on-a-thistle, mirrored-snow-peaks and matterhorn-wrapped-in-cloud.
  - The mid index is floor(6/2) = 3, which is riffelsee-reflection with rail 4.
  - Ortler and Saalfelden have 2 views each.
  - photoViews[0] (the grid's first tile) is matterhorn-from-zermatt = `SLUGS.matterhornFromZermatt`.
- Commit **cf0b3a1** `test(18-14): region page viewport shots from data, copy mode everywhere, lightbox opened from the Zermatt sequence` (routes.spec.ts and README):
  - On a page with `[data-plate-sheet]`, `settle` waits for the resource named in the plate's own mask that matches `/\/terrain\/(?:[a-z]+-)?contours-hero\.[0-9a-f]{10}\.svg$/`.
  - Rail waits from 768: top 1, mid index+1 (4) and end N (7). The plan asked for the mid wait only. The top and end waits were added so every position settles on a positive signal.
  - check-snapshot-commit --none: OK (0 changed).
- `--list` (visual-dark): 67 tests in total, with 15 region titles and 3 lightbox tests. The first verify passed.
- Local run (PW_PROD=1 PW_REUSE=1, which never writes snapshots): all 18 region and lightbox tests reached `toHaveScreenshot` and failed only on the missing win32 snapshot. So every settle, contour and rail wait passes locally.
- Local gate: lint 0 (test-count scan OK), type-check 0, jest 129 suites / 2,613 tests pass. Acceptance greps: REGION_SHOTS 3, view=grid 1.
- Push: `git push origin HEAD:refs/heads/ci/18-14`, a new branch with a plain push.

### CI run 45648612139 (headSha cf0b3a1, push, created 15:46:11Z)

https://github.com/tlex-web/portfolio-app/actions/runs/45648612139

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 15:46:14 | 15:46:19 | 0.1 |
| Dependency Review | skipped | 15:46:12 | 15:46:11 | 0 |
| Security Audit | success | 15:46:21 | 15:47:24 | 1.1 |
| Unit Tests | success | 15:46:21 | 15:48:13 | 1.9 |
| Lint and Type Check | success | 15:46:21 | 15:49:10 | 2.8 |
| Build Application | success | 15:49:13 | 15:50:01 | 0.8 |
| Visual Regression | failure (expected) | 15:46:22 | 15:51:50 | 5.5 |
| E2E Tests (chromium) | success | 15:46:21 | 16:03:23 | 17.0 (17m02s) |
| E2E Tests (firefox) | success | 15:46:22 | 16:01:41 | 15.3 (15m19s) |
| E2E Tests (webkit) | **failure** | 15:46:23 | 16:02:36 | 16.2 (16m13s) |
| CI OK | failure | 16:03:26 | 16:03:35 | 0.2 |

- Visual Regression: 30 failed and 104 passed. All 30 failures are "A snapshot doesn't exist" for the 15 region titles, in both visual-dark and visual-light. Every existing shot passes, including the lightbox from its new opener and everything under the copy-mode beforeEach.
- E2E: chromium 700 passed and firefox 599 passed. Webkit had 603 passed and **1 failed on every try**: `photos-region.spec.ts:1031` "hovering key row 2 marks its badge accent". At line 1049 it expected `lab(79.776398 -26.0144 -21.345699)` (the accent) and received `lab(93.072304 0.225216 3.04791)` (the ink).
- D-26: the longest leg was chromium at 17m02s.

### WebKit hover-sync failure: diagnosis and fix (2325d0a)

- **Not caused by 18-14.** This plan changes only the visual spec and its README, and the visual spec does not run in the webkit project. The test and the CSS come from 18-10 (ce5d58d). 18-10 ran its e2e locally on Chromium and Firefox only, and this was the first CI run after c24568d. Because the failure repeated on all 3 tries, it is not a flake, so no re-run was used. The tracer gate halted before any dispatch.
- **Tim's answer:** "Diagnose locally, then fix (Recommended)".
- `npx playwright install webkit` installed webkit-2388. It is a browser download with no package change, and git status stayed clean.
- **Reproduced on Windows WebKit** at line 1049, with the same received value as CI.
- **Probe** (scratch `tools-18-14/wk-probe.cjs` on `next start -p 3017`, hovering key row 2 at 1440):
  - The row matches `:hover`, the root matches `:has(row:hover)`, and `badge.matches(<sync selector>)` is **true**. Yet both badges stay ink at 0 ms and at 600 ms. A forced restyle (an inline style write) starts the accent transition. After the pointer leaves, the badges stay stale the other way.
  - `transition: none !important` gives the same staleness, so the 150 ms transition is not the cause.
  - Adding any plain `[data-plate-root]:has(row:hover) …` rule makes both badges reach the accent and return to ink.
- **Root cause:** WebKit's `:has()` invalidation for `:hover` does not look inside `:is()`. The selector matches, but a hover change on the row never restyles the non-hovered elements it targets. The row's own fill and accent bar looked right only because the row itself is hovered.
- **Fix: commit 2325d0a** `fix(18-10): one :has() per state in the plate sync so WebKit restyles the badges on row hover`.
  - `syncRules` in `lib/photos/plate-layout.ts` now emits three anchors for the same four rules: `:has(row:hover)`, `:has(row:focus-visible)` and `:has(badge:hover)`. Specificity and design are unchanged.
  - It was written test-first. `lib/__tests__/plate-layout.test.ts` pins the three-anchor form and forbids `:has(…:is(` and `:where(`: RED before the fix, GREEN (41/41) after.
- Local verify on a prod build: photos-region.spec in chromium, firefox and webkit gave 310 passed and 5 failed. All 5 failures are webkit at `toBeFocused()` after a Tab onto a link (lines 967, 1010, 1064, 1105 and 1252), which is Windows WebKit's Tab behaviour; CI Linux WebKit passes them. The hover test (1031) passes in WebKit.
- Gates: type-check 0, lint 0, jest 129 suites / 2,613 tests, and check-snapshot-commit OK (0 changed).
- **Client JS unchanged at 1,864,179 B** (`rm -rf .next/static && npm run build`). 2325d0a changes server-rendered CSS only. The phase cap is 1,855,841 B, so client JS stays 8,338 B over; per Tim, the overage is tracked to 18-25. service-worker.js was restored.
- **0ba60ea** `docs(18-14): defer the overview :has() split and the Windows WebKit Tab tags` logs both items in deferred-items.md:
  1. `lib/photos/overview-layout.ts:924` has the same `:has(row:is(:hover,:focus-visible))` form. No route renders overviewCss yet, so it is deferred to the plan that wires it in.
  2. The five region e2e rows that need the `@needs-tab-to-links` tag on Windows and macOS WebKit, deferred to 18-29 or the next plan that edits the spec.
- Fast-forward push cf0b3a1..0ba60ea.
- **Actions outage:** no run was queued for 0ba60ea. githubstatus.com reported Actions in partial outage from about 16:22Z and fully operational again from 16:36Z, so the push event was dropped. Running `gh workflow run ci.yml` is outside D-23. Instead, the empty commit **7740326** `chore(18-14): re-trigger CI; the push of 0ba60ea fell in a GitHub Actions outage` was fast-forward pushed at 17:06Z.

### CI run 45661298142 (headSha 7740326, push, created 17:07:09Z)

https://github.com/tlex-web/portfolio-app/actions/runs/45661298142

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 17:07:12 | 17:07:20 | 0.1 |
| Dependency Review | skipped | 17:07:10 | 17:07:10 | 0 |
| Security Audit | success | 17:07:23 | 17:08:20 | 1.0 |
| Unit Tests | success | 17:07:23 | 17:09:13 | 1.8 |
| Lint and Type Check | success | 17:07:23 | 17:09:59 | 2.6 |
| Build Application | success | 17:10:02 | 17:11:26 | 1.4 |
| Visual Regression | failure (expected) | 17:07:23 | 17:11:34 | 4.2 |
| E2E Tests (chromium) | success | 17:07:23 | 17:23:58 | 16.6 (16m35s) |
| E2E Tests (firefox) | success | 17:07:23 | 17:21:19 | 13.9 (13m56s) |
| E2E Tests (webkit) | **success** | 17:07:23 | 17:25:58 | 18.6 (18m35s) |
| CI OK | failure (Visual only) | 17:26:01 | 17:26:07 | 0.1 |

- E2E: chromium 700 passed, firefox 599 passed and webkit **604 passed** (on cf0b3a1 it was 603 plus 1 failure). No re-run.
- Visual Regression: 30 failed and 104 passed. The failures are exactly the 15 region titles in both schemes. The fix is pixel-neutral at rest.
- D-26: the longest leg was webkit at 18m35s. The Task 1 tracer gate passed.

## Task 2, round A: the declared dispatch

- Dispatched at 17:27:47Z with `gh workflow run visual-baselines.yml --ref ci/18-14 -f suite=visual -f update_mode=changed`. This is run **45665012575**: headBranch ci/18-14, headSha 7740326c4fab4bdbec7e04c3c5e0836ab09f2e75, event workflow_dispatch, all confirmed before waiting. It succeeded in 3.2 min. https://github.com/tlex-web/portfolio-app/actions/runs/45665012575
- The artifact was downloaded into a new, empty scratchpad directory (67 files) and compared by a script kept outside it: `files=67 changed=0 identical=52 new=15 nonLinux=0 missingFromArtifact=0`, `VERDICT: OK (15 declared new, all others identical)`. lightbox/, box/ and coin-flip/ were 3 identical each.
- Only the 15 new region PNGs were copied, and `cmp` matched each copy to the artifact. Nothing was staged.
- **Gap against D-21:** D-21 says the top shot shows "header and plate". At 900 px the cover fills the frame, so no top shot shows a plate. This was raised to Tim at the checkpoint.

## Plate shots (Tim: "Add plate shots now (Recommended)")

- Tim's answer added a `plate` position for all three regions (9 more PNGs, 24 in all). It also authorized fast-forward pushes to ci/18-14 and **one more** visual-baselines dispatch in 18-14, beyond D-23's one.
- The round-A copies were deleted first (none was ever tracked), so round B's compare started from an empty region/.
- Geometry probe (scratch `tools-18-14/plate-geom.cjs`; server stopped afterwards): centring `figure:has(> [data-plate-sheet])` frames the sheet and margin at every width. At 1440 it frames the whole facts and plate block. The rail reads 1 at this position.
- **Commit fcff66d** `test(18-14): region plate shots for all three regions, D-21 amended (24 region PNGs)`:
  - REGION_SHOTS gains the plate entries. The plate shot also polls the relief `<img>` for `complete && naturalWidth > 0` and awaits `decode()`. This runs only for `pos === 'plate'`, so the 15 round-A tests run unchanged code.
  - The README now says 24 region PNGs and 76 tests per scheme.
  - **18-CONTEXT D-21 is amended "2026-11-25 (Tim, at 18-14)".**
  - check-snapshot-commit --none OK.
- `--list`: 76 tests, with 24 region titles. Locally, 9/9 plate tests reached `toHaveScreenshot`. Gate: lint 0, type-check 0, jest 129 / 2,613.
- Fast-forward push 7740326..fcff66d at 17:39:52Z.

### CI run 45667131664 (headSha fcff66d, push, created 17:39:53Z)

https://github.com/tlex-web/portfolio-app/actions/runs/45667131664

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 17:39:57 | 17:40:03 | 0.1 |
| Dependency Review | skipped | 17:39:54 | 17:39:54 | 0 |
| Security Audit | success | 17:40:06 | 17:41:04 | 1.0 |
| Unit Tests | success | 17:40:06 | 17:41:34 | 1.5 |
| Lint and Type Check | success | 17:40:06 | 17:42:56 | 2.8 |
| Build Application | success | 17:42:59 | 17:44:38 | 1.7 |
| Visual Regression | failure (expected) | 17:40:06 | 17:45:40 | 5.6 |
| E2E Tests (chromium) | success | 17:40:06 | 17:56:42 | 16.6 (16m36s) |
| E2E Tests (firefox) | success | 17:40:06 | 17:51:59 | 11.9 (11m53s) |
| E2E Tests (webkit) | success | 17:40:06 | 17:55:46 | 15.7 (15m40s) |
| CI OK | failure (Visual only) | 17:56:45 | 17:56:49 | 0.1 |

- E2E: chromium 700, firefox 599 and webkit 604 passed. No re-run.
- Visual Regression: 48 failed and 104 passed. The failures are exactly the 24 region titles in both schemes, with 0 non-region failures.
- D-26: the longest leg was chromium at 16m36s.

## Task 2, round B: the second dispatch (Tim's answer)

- Dispatched at 17:57:14Z. This is run **45670115431**: headBranch ci/18-14, headSha fcff66dc73cd699b8a721598f9df46e02d2c995e, event workflow_dispatch, confirmed before waiting. It succeeded in 4.0 min. https://github.com/tlex-web/portfolio-app/actions/runs/45670115431
- Compare (76 files): `changed=0 identical=52 new=24 nonLinux=0 missingFromArtifact=0`, `VERDICT: OK (24 declared new, all others identical)`. lightbox/, box/ and coin-flip/ were 3 identical each.
- **Determinism:** `ROUND-A: 15 files, 15 byte-identical, 0 differ`. Each of the 15 round-A shots is byte-identical across the two independent dispatches.
- Only the 24 region PNGs were copied and `cmp`-verified. The Task 2 verify, in its 24-name form with `-uall`, passed. Nothing was staged.
- **Dispatches in this plan: two** (45665012575 and 45670115431). The second was the one Tim allowed.

### Per-shot table (the 24 new baselines)

| Shot | 375 | 768 | 1440 |
|------|-----|-----|------|
| zermatt-top | header, title on 2 lines, data line, Copy link (full width), full-bleed cover, caption, start of Facts | header row with Copy link on the right, cover, caption, Facts, Wikipedia | header; the cover fills to 880 px (caption below the fold) |
| zermatt-plate | facts tail, full-bleed sheet with pins 1-7 (4 hollow dashed), 5 and 6 on one dot, badge 2 displaced with a short leader, wrapped margin, "Map" at the bottom | facts tail cut by the header, sheet 576 px, pins 1-7, margin on 3 lines, "Map" at the bottom | whole block: Facts and the 7-row key list on the left, sheet with pins 1-7 on the right, margin |
| zermatt-mid | Riffelsee figure "4 / 7", parts of neighbours 3 and 5, no rail | Riffelsee in its collar, rail 2,760 m current | Riffelsee in its collar, rail 2,760 m current |
| zermatt-end | "7 / 7" caption, copyright, Next region sign (Ortler), All regions, contour band, footer | same, rail tail 1,617 m | same, rail tail 1,617 m |
| ortler-top | portrait cover pillarboxed, caption, Facts, sliver of the plate's top | header, cover, caption, Facts | header, portrait cover pillarboxed |
| ortler-plate | "Facts" heading cut by the header, sheet with pins 1 and 2 hollow dashed, margin (WGS84 extent), "Map" at the bottom | fact tail, sheet, 2 hollow pins, margin | whole block: Facts, Map with 2 rows ("approx."), sheet, margin |
| saalfelden-top | full-bleed cover, caption "ground 880 m approx.", Facts | header, cover, caption, Facts | header, cover |
| saalfelden-plate | second fact, sheet, the two approximate dots almost touch, badges displaced along a diagonal with leaders, margin (Sep 2025, ALS DTM, BEV, CC BY 4.0) | same pair with leaders, margin | whole block: 2 facts, Map with 2 rows, sheet, margin |

- No shot has an overlap, clipped text or an empty image. Relief and contours are drawn in all 9 plate shots. The rail mark sits on the centred figure at 768 and 1440.
- The 10 px strip on the right at 375 is the CI renderer's scrollbar gutter, the same as in the existing photo/375 baseline.
- Two notes were shown to Tim, neither a defect:
  1. At 768 (all three regions) and in ortler-375, the line above the sheet is cut by the sticky header's lower edge.
  2. Saalfelden's two dashed dots nearly touch, because the data positions are close.

## Task 3: Tim's commit and CI on it

- Tim's reply to the checkpoint was "pushed", taken as the "re-baselined" resume signal.
- **Tim's commit: `894435985ff4dc496ba12708f0cc6c9ceb4265be`**, "test(18): add region page baselines (REGION-02..05, D-21)", author tlex-web. It holds exactly 24 files, all `e2e/visual/routes.spec.ts-snapshots/region/*-visual-dark-linux.png`.
- `git rev-parse HEAD` = `git ls-remote origin refs/heads/ci/18-14` = 894435985ff4dc496ba12708f0cc6c9ceb4265be.
- **The agent committed no PNG.** Its five commits (cf0b3a1, 2325d0a, 0ba60ea, 7740326 and fcff66d) contain 0 .png files, and check-snapshot-commit --none reported "OK (0 changed)" for each. The only other agent commit is this SUMMARY's metadata commit, which the agent does not push.

### CI run 45672001635 (headSha 8944359, push, created 18:08:13Z)

https://github.com/tlex-web/portfolio-app/actions/runs/45672001635

| Job | Conclusion | Start (UTC) | End (UTC) | Minutes |
|-----|-----------|-------------|-----------|---------|
| Classify changes | success | 18:08:17 | 18:08:26 | 0.2 |
| Dependency Review | skipped | 18:08:14 | 18:08:14 | 0 |
| Security Audit | success | 18:08:28 | 18:09:30 | 1.0 |
| Unit Tests | success | 18:08:28 | 18:10:50 | 2.4 |
| Lint and Type Check | success | 18:08:29 | 18:12:02 | 3.6 |
| Build Application | success | 18:12:04 | 18:13:24 | 1.3 |
| Visual Regression | **success** | 18:08:29 | 18:14:08 | 5.7 |
| E2E Tests (chromium) | success | 18:08:28 | 18:25:40 | 17.2 (17m12s) |
| E2E Tests (firefox) | success | 18:08:28 | 18:19:42 | 11.2 (11m14s) |
| E2E Tests (webkit) | success | 18:08:28 | 18:26:47 | 18.3 (18m19s) |
| CI OK | **success** | 18:26:50 | 18:26:55 | 0.1 |

- Attempt 1, with no re-run. The WebKit B8 flake did not recur.
- Visual Regression: **152 passed** (3.9 min), which is the 76 shots in each of visual-dark and visual-light.
- E2E: chromium 700 passed (15.3 min), firefox 599 passed (9.8 min) and webkit 604 passed (16.7 min).
- **D-26:** across all four CI runs on ci/18-14, the longest leg was webkit at 18m35s (run 45661298142). That is under the 35-minute trip-wire, so no shard or matrix proposal is needed.

### Checks on Tim's commit

```
$ node scripts/ci/check-visual-run.mjs --sha 894435985ff4dc496ba12708f0cc6c9ceb4265be --wait 30
PASS https://github.com/tlex-web/portfolio-app/actions/runs/45672001635/job/139409612315
exit=0

$ node scripts/ci/check-snapshot-commit.mjs --sha 894435985ff4dc496ba12708f0cc6c9ceb4265be --some --allow region
snapshot-commit: OK (24 changed)
exit=0
```

Run URL: https://github.com/tlex-web/portfolio-app/actions/runs/45672001635

## Client JS

The build gave **1,864,179 B** (measured after 2325d0a with `rm -rf .next/static && npm run build`). That is unchanged, because 2325d0a is server CSS only and the other commits are test, doc and PNG changes. The phase cap is 1,855,841 B, so client JS stays 8,338 B over. Tim tracks the overage to 18-25.

## Deviations from Plan

### Auto-fixed and Tim-directed Issues

**1. [Rule 1 - Bug, product; Tim-directed] WebKit plate badges ignored key-row hover**
- **Found during:** Task 1 (CI run 45648612139, webkit, 3 of 3 tries)
- **Issue:** WebKit does not invalidate `:has()` through `:is()` on a hover change, so the badges stayed ink.
- **Fix:** `syncRules` emits one `:has()` per state, and a unit test forbids `:has(…:is(` and `:where(`. Tim chose "Diagnose locally, then fix (Recommended)".
- **Files modified:** lib/photos/plate-layout.ts, lib/__tests__/plate-layout.test.ts
- **Verification:** reproduced and fixed on local WebKit 2388; CI webkit 604 passed on 7740326, fcff66d and 8944359; Visual Regression 104 passed on 7740326 (pixel-neutral)
- **Commit:** 2325d0a

**2. [Rule 3 - Blocking] Empty commit to re-trigger CI after an Actions outage**
- The push of 0ba60ea fell in a GitHub Actions partial outage and no run was queued. `gh workflow run ci.yml` is outside D-23, so the empty commit 7740326 was fast-forward pushed instead.

**3. [Scope addition, Tim-directed] Plate position, D-21 amended, second dispatch**
- At the Task 3 checkpoint, Tim chose "Add plate shots now (Recommended)": 9 more shots (24 in all), the D-21 amendment in 18-CONTEXT and one extra dispatch (45670115431). Commit fcff66d. The plan's "15" counts now read 24.

**4. [Spec addition] Rail waits for the top and end positions too**
- The plan asked for the mid rail wait only. The top (1) and end (N) waits were added so every position settles on a positive signal (T-18-32).

**5. [Plan verify] Task 2's porcelain check needs `-uall`** for a new folder (the same as 18-05).

D-23 scope as extended by Tim: one new branch ci/18-14 with a plain push and four fast-forward pushes (0ba60ea, 7740326, fcff66d and Tim's 8944359). There were two dispatches, the second authorized by Tim. Nothing was force-pushed or re-run, the agent committed no PNG, and neither the phase branch nor main was pushed.

## Deferred items (logged in deferred-items.md by 0ba60ea)

- `lib/photos/overview-layout.ts:924`: the same `:has(row:is(:hover,:focus-visible))` pattern. Split it before overviewCss is rendered, update overview-layout.test.ts (line 672) and add the `:has(...:is(` guard.
- Five 18-10 region e2e rows (photos-region.spec.ts lines 967, 1010, 1064, 1105 and 1252) need the `@needs-tab-to-links` tag for Windows and macOS WebKit. This affects local runs only, not CI. Deferred to 18-29 or the next plan that edits the spec.

## Notes for later rounds

- Round 4 builds on 8944359, which has region/* in the baseline set (76 shots per scheme).
- The photos-grid and photos-carousel entries stay until 18-22/18-28, where they are removed with their PNGs (D-22). The region shots are their rewrite.
- Adding a Zermatt photo moves zermatt-end (and zermatt-mid if N changes the floor index). The plate shots move with any pin or margin change.
- Run CI on a plan's interactive CSS before the plan closes. The 18-10 WebKit fault went unseen across three plans.

## Self-Check: PASSED

- This SUMMARY exists at `.planning/phases/18-immersive-survey-layout/18-14-SUMMARY.md`.
- cf0b3a1, 2325d0a, 0ba60ea, 7740326, fcff66d and 8944359 are ancestors of HEAD, and `git rev-list --count 9726505..8944359` = 6.
- Tim's commit lists 24 paths, all under `e2e/visual/routes.spec.ts-snapshots/region/`. The agent's five commits contain 0 PNGs.
- No stubs. There is no new threat surface beyond T-18-31..T-18-33: the CSS fix changes only selectors on existing server CSS.
