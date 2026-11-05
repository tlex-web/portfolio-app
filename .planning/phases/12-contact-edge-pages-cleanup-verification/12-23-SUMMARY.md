---
phase: 12-contact-edge-pages-cleanup-verification
plan: 23
subsystem: testing
tags: [playwright, webkit, ci, github-actions, fail-on-flaky-tests, view-transitions, cross-engine]
status: complete

requires:
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-02 always-present webkit project and D-17 loopback CSP (local WebKit loads the site); 12-19 the 28 local WebKit failures; 12-20, 12-21, 12-22 round-3 lists (all none); 12-01 ci.push yes"
provides:
  - "CI E2E Tests runs chromium, firefox and webkit with --fail-on-flaky-tests on every push"
  - "e2e/helpers/engine.ts: per-platform WebKit focus conventions (tabReachesLinks, clickFocusesButtons, pressButton)"
  - "Per-platform WebKit exclusion tags (@needs-tab-to-links, @no-win-webkit, @no-linux-webkit), each with a reason comment"
  - "PhotoViewer keeps the shown photo's document title through WebKit's late head writes"
  - "Three-engine CI green on 147bc82 (run 41571031827), 0 flaky; no round 3"
affects: [12-24, milestone-audit]

actuals:
  tokens: 20200
  tasks: 3
  commits: 6
plan_head_before: f3e2dad8cd04704490aaccf65f899e7de4f8b9fe
plan_head_after: 84f4be39ee373472c3d900ead6d68796b1d8594e

tech-stack:
  added: []
  patterns:
    - "WebKit focus conventions are per platform: Safari's (Tab skips links, a click does not focus a button) on Windows and macOS, GTK's on Linux; specs branch through e2e/helpers/engine.ts, never on browserName alone"
    - "Engine- and platform-scoped exclusion is a title tag dropped by the webkit project's grepInvert (built per process.platform in playwright.config.ts), with a reason comment above the title; never test.skip"

key-files:
  created:
    - e2e/helpers/engine.ts
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-23-TRIAGE.md
  modified:
    - .github/workflows/ci.yml
    - playwright.config.ts
    - components/photos/PhotoViewer.tsx
    - e2e/shell.spec.ts
    - e2e/photos-lightbox.spec.ts
    - e2e/photos-carousel.spec.ts
    - e2e/photos-sweep.spec.ts
    - e2e/photos.spec.ts
    - e2e/projects.spec.ts
    - e2e/home-ascent.spec.ts
    - e2e/case-study.spec.ts
    - e2e/keyboard.spec.ts
    - e2e/contact-form.spec.ts
    - e2e/demo-clip.spec.ts
    - .planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md
    - .planning/phases/10-photography/deferred-items.md

key-decisions:
  - "WebKit exclusions are platform-aware tags (@needs-tab-to-links, @no-win-webkit, @no-linux-webkit) instead of @chromium-only, because Linux WebKit (CI) and Windows WebKit (local) fail different tests and Firefox and Chromium must keep every one"
  - "Safari focus conventions (Tab skips links, a click does not focus a button) apply to WebKit off Linux only; Linux WebKit walks every link stop, so keyboard.spec and contact-form.spec now check those steps in CI"
  - "The WinCairo history-Back crash during the lightbox open's View Transition is a Playwright Windows WebKit defect (no site-free repro, Linux WebKit passes all 12), so those tests are dropped on Windows WebKit only and real Safari checks the path in 12-24"
  - "The late-title race is a real site bug in WebKit and was fixed in PhotoViewer (head MutationObserver), not tagged"
  - "timeout-minutes stays 60: the three-engine job ran 36.5-36.6 min, under the plan's 50-minute line"

requirements-completed: [VERIFY-03, VERIFY-02, VERIFY-04]

coverage:
  - id: D1
    description: "CI E2E step runs --project=chromium --project=firefox --project=webkit --fail-on-flaky-tests, retries unchanged"
    requirement: VERIFY-03
    verification:
      - kind: other
        ref: "grep -c -- '--project=webkit' .github/workflows/ci.yml -> 1; grep -c -- '--fail-on-flaky-tests' .github/workflows/ci.yml -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full suite green in Chromium, Firefox and WebKit in CI on one commit with 0 flaky, including the View Transitions specs and e2e/no-webgl.spec.ts"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "CI run 41571031827 on 147bc82 E2E Tests: 1363 passed (chromium 501, firefox 432, webkit 430), 0 flaky; node scripts/ci/check-visual-run.mjs --sha 147bc82df5ad68488e74c57342a0572b217b634a --job 'E2E Tests' -> PASS"
        status: pass
    human_judgment: false
  - id: D3
    description: "Local Windows WebKit run green: PW_PROD=1 npx playwright test --project=webkit 417 passed, 0 failed, 0 flaky (432 listed, 15 excluded on win32); e2e/no-webgl.spec.ts 4/4"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test --project=webkit (fresh build at 147bc82, Windows)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every WebKit exclusion tag (17) carries a reason comment above the title and a triage row; no .skip/.only/.fixme; Firefox and Chromium keep every tagged test"
    requirement: VERIFY-03
    verification:
      - kind: other
        ref: "grep -rnE '\\.(skip|only|fixme)\\(' e2e -> none; grep -B1 per tagged title shows a 12-23 triage comment on each of the 17"
        status: pass
    human_judgment: false
  - id: D5
    description: "PhotoViewer re-applies the shown photo's title through WebKit's late head writes"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts photo page Next (document title): Windows WebKit 10/10 serial after the fix (4/10 before); green in all three engines in CI run 41571031827"
        status: pass
    human_judgment: false
  - id: D6
    description: "No round 3: Visual Regression green on 147bc82, all round-3 lists none; Tim's reply quoted"
    verification:
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 147bc82df5ad68488e74c57342a0572b217b634a --job 'Visual Regression' -> PASS (run 41571031827)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Real Safari: the history-Back path right after opening a photo, a quick Next right after a photo page loads, and the D-19 real-Safari pass"
    verification: []
    human_judgment: true
    rationale: "Playwright's WebKit is not Safari (A8): the WinCairo crash path and the late-title race need real Safari on macOS or iOS; Tim's UAT in 12-24 (D-19)"

duration: 1h 41m
completed: 2026-11-03
---

# Phase 12 Plan 23: WebKit in CI and Cross-Engine Triage Summary

**CI now runs Chromium, Firefox and WebKit with `--fail-on-flaky-tests`, green on 147bc82 (run 41571031827: 501 + 432 + 430, 0 flaky). The 28-plus WebKit failures were sorted test by test into Safari focus conventions (handled in `e2e/helpers/engine.ts`), per-platform Playwright WebKit defects (17 reasoned tags) and one real site race (the PhotoViewer title fix). No round 3.**

## Performance

- **Duration:** 1h 41m of execution (2026-11-03T02:12Z to 03:53Z, the triage commit); the plan then waited at the Task 3 checkpoint for Tim's reply, closed at 2026-11-03T09:50Z
- **Started:** 2026-11-03T02:12Z
- **Completed:** 2026-11-03T09:50Z
- **Tasks:** 3 (2 auto, 1 blocking-human checkpoint)
- **Files modified:** 16 in the code and triage commits (15 code/config, 1 triage doc), plus 2 deferred lists and this SUMMARY

## Accomplishments

- WebKit is a permanent CI engine, and a test that passes only on a retry now fails the run (D-18; retries unchanged).
- Re-check of the old "Linux WebKit known issues" note against Playwright 1.64 (A8): stale. Playwright's WebKit behaves as two engines for this suite, so every convention and exclusion is per platform.
- Three CI rounds on ci/12-23, the last two green with 0 flaky; the job takes about 36.5 minutes, so `timeout-minutes` stays 60.
- One real WebKit site bug fixed (the document title lost on a quick Next step), not tagged.
- No round 3. Tim's reply is quoted below.

## Task Commits

1. **Task 1: WebKit in the CI command, flaky runs fail, local WebKit triage**: `28f141d` (ci), `4dc1f1d` (test), `3af9d44` (test), `aeb3d0f` (fix), `147bc82` (test)
2. **Task 2: Three-engine CI run, Linux WebKit triage, round 3 if needed**: `84f4be3` (docs, triage table and CI rounds); the Linux triage commits are `3af9d44`, `aeb3d0f` and `147bc82` above
3. **Task 3: Tim confirms no round 3**: no commit (checkpoint reply)

**Plan metadata:** the final `docs(12-23)` commit that holds this SUMMARY

Pushes: plain pushes of ci/12-23 under the 12-01 ci.push answer (`yes: plain pushes only, never force, of ci/12-NN branches`); origin ci/12-23 = 147bc82. `84f4be3` and the metadata commit stay local.

## A8: Linux WebKit vs Windows WebKit (Playwright 1.64)

The old config note ("Linux WebKit known issues with client-side navigation, form validation, modals and WebGL") is stale. Linux WebKit in CI ran the whole suite with 12 failures, none of them navigation, forms, modals or WebGL. But Playwright's WebKit is two different engines for this suite:

| Behaviour | Windows WebKit (WinCairo, local) | Linux WebKit (GTK, CI) |
|-----------|----------------------------------|------------------------|
| Tab onto links | never (Safari default) | yes |
| Mouse click focuses a button | no (focus goes to `<main tabindex="-1">`) | yes |
| History Back while the lightbox open's View Transition commit settles | page crash | fine |
| `page.route` sees `<video>` MP4 requests | no (0 seen) | yes |
| `preload="none"` MP4 not requested before play | honoured | not honoured (GStreamer fetches it) |
| Late `<title>` writes after the photo viewer appears | ~350 ms | not observed |

So the focus conventions live in `e2e/helpers/engine.ts` as "WebKit off Linux" (Windows and macOS follow Safari's conventions), and every exclusion is per platform. Real Safari is Tim's UAT check (D-19, 12-24); see "Safari UAT items for 12-24" below.

## Triage table

| # | Test | Engine / platform | Cause | Fix or exclusion (reason) | Touched file |
|---|------|-------------------|-------|---------------------------|--------------|
| 1 | shell.spec Shell landmarks x8 (Tab to skip link) | WebKit, Windows | Tab never lands on a link (Safari default) | test: off Linux, focus the skip link directly; Enter-to-main still asserted | e2e/shell.spec.ts |
| 2 | shell.spec mobile menu (Tab into rows) | WebKit, Windows | same | test: focus the first row directly; Escape-to-button still asserted | e2e/shell.spec.ts |
| 3 | photos-lightbox photo-page menu keeps its keys (Tab into menu) | WebKit, Windows | same | test: focus the first menu link directly | e2e/photos-lightbox.spec.ts |
| 4 | home-ascent keyboard focus on a card | WebKit, Windows | same | test: focus the card link directly; centring still asserted | e2e/home-ascent.spec.ts |
| 5 | photos.spec Map Tab reaches the four waypoint links | WebKit, Windows | same; every step is Tab onto a link | tag `@needs-tab-to-links` (webkit off Linux only; Linux WebKit, Chromium, Firefox keep it) | e2e/photos.spec.ts, playwright.config.ts |
| 6 | projects.spec Tab reaches each panel title link | WebKit, Windows | same | tag `@needs-tab-to-links` | e2e/projects.spec.ts |
| 7 | keyboard.spec x10 (link walks, lightbox by keyboard, summary link, 404 links) | WebKit, Linux | spec assumed every WebKit drops link stops; Linux WebKit Tabs to links | test: `walk` and the branches use `tabReachesLinks`, so Linux WebKit walks every stop and opens the lightbox by keyboard | e2e/keyboard.spec.ts |
| 8 | contact-form Tab from register into panel (mailto step) | WebKit, Linux (passed, coverage) | same assumption | test: mailto step uses `tabReachesLinks` (Linux WebKit now checks it) | e2e/contact-form.spec.ts |
| 9 | photos-lightbox three Next presses (focus) | WebKit, Windows | a click does not focus a button (macOS convention) | test: `pressButton` (focus + Enter off Linux) so "focus stays on Next" is still asserted | e2e/photos-lightbox.spec.ts |
| 10 | photos-lightbox arrow keys step, disabled Previous keeps focus | WebKit, Windows | same | test: `pressButton` | e2e/photos-lightbox.spec.ts |
| 11 | photos-lightbox photo page Next (focus, title) | WebKit, Windows | same; then a real site race (row 17) | test: `pressButton` | e2e/photos-lightbox.spec.ts |
| 12 | photos-carousel stepper never advances (Next keeps focus) | WebKit, Windows | same | test: `pressButton` | e2e/photos-carousel.spec.ts |
| 13 | photos.spec 375 switcher "focus kept" | WebKit, Windows | same; the click and scroll are the point | test: focus assertion only where a click focuses (`clickFocusesButtons`) | e2e/photos.spec.ts |
| 14 | case-study releasing Pause with the pointer over the terminal | WebKit, Windows | same; the pointer is the point | test: focus assertion guarded by `clickFocusesButtons` | e2e/case-study.spec.ts |
| 15 | photos-lightbox a click zooms at the point | WebKit, Windows | test oracle: WebKit shows an 8 px classic scrollbar only once zoomed, so the zoomed viewport's centre is 4 px left of the fitted photo's; the site keeps the clicked pixel under the pointer exactly (560 + 720 = 1280 = 2560 / 2) | test: assert the photo pixel under the pointer, all engines (9/9) | e2e/photos-lightbox.spec.ts |
| 16 | 12 lightbox and photo tests that go Back from the grid soon after opening (photos-lightbox x10 incl. Escape twice from zoomed, photos-sweep E5, photos.spec Back to Grid) | WebKit, Windows | `page.goBack: Page crashed`, or the page closes on a router close: WinCairo crashes on history Back while the open's View-Transition-wrapped commit settles. Crash 3/3 with Desktop Safari and no settle; 0/3 with `startViewTransition` removed, 0/3 under reduced motion, 0/3 100 ms after `skipTransition()`; still 3/3 with every `view-transition-name` stripped; no site-free repro (pushState + VT + modal dialog, removed or closed). Escape-twice-from-zoomed crashed in 1 of 2 full Windows runs. Linux WebKit passes all 12 in CI | tag `@no-win-webkit` (Windows webkit project only) | e2e/photos-lightbox.spec.ts, e2e/photos-sweep.spec.ts, e2e/photos.spec.ts, playwright.config.ts |
| 17 | photos-lightbox photo page Next: document title | WebKit, Windows (site race) | WebKit rewrites the route's `<title>` for ~350 ms after the viewer appears; a step in that window lost its title (probe 6/6, test 4/10 serial) | **site fix**: a head MutationObserver re-applies the shown photo's title while the URL names it (probe 0/8, test 10/10; leaving by nav, Escape and close keeps the next page's title in all engines) | components/photos/PhotoViewer.tsx |
| 18 | demo-clip a clip that fails to load (E18) | WebKit, Windows | Windows WebKit loads media outside `page.route` (canPlayType "probably", 0 MP4 requests seen), so nothing is aborted | tag `@no-win-webkit`; Linux WebKit passes it in CI | e2e/demo-clip.spec.ts |
| 19 | demo-clip no MP4 request before play; reduced-motion same attributes | WebKit, Linux | Linux WebKit's GStreamer backend fetches the MP4 despite `preload="none"` (the attribute is asserted and present) | tag `@no-linux-webkit`; Windows WebKit, Chromium, Firefox keep the check | e2e/demo-clip.spec.ts |

Row 16 is corrected here from the triage file, which read "13 ... photos-lightbox x11": the tagged titles are 10 in photos-lightbox, 1 in photos-sweep and 1 in photos.spec (12), and with demo-clip E18 that makes the 13 `@no-win-webkit` tags. 12-23-TRIAGE.md is corrected in the same commit.

**Tags added: 17**, each with a reason comment on the line above the title:

| Tag | Count | Where | Dropped by |
|-----|-------|-------|------------|
| `@needs-tab-to-links` | 2 | photos.spec (Map waypoint Tab order), projects.spec (panel title Tab) | webkit project on win32 and darwin |
| `@no-win-webkit` | 13 | photos-lightbox x10, photos-sweep E5, photos.spec Back to Grid, demo-clip E18 | webkit project on win32 |
| `@no-linux-webkit` | 2 | demo-clip preload-none request check, reduced-motion same attributes | webkit project on linux |

No `@chromium-only` was added; no `.skip(`, `.only(` or `.fixme(`; retries unchanged. Firefox and Chromium keep every tagged test. Excluded per platform: Windows webkit 15, Linux webkit 2, macOS webkit 2.

**Final local run** (Windows, fresh build at 147bc82): `PW_PROD=1 npx playwright test --project=webkit` 417 passed, 0 failed, 0 flaky (432 listed, 15 excluded); e2e/no-webgl.spec.ts 4/4 inside it. Jest 102 suites / 1658 tests; lint and type-check exit 0.

## CI rounds

ci/12-23, plain pushes under the 12-01 ci.push "yes", Linux, 1 worker, `--fail-on-flaky-tests`. Per-engine counts come from the listings (the CI reporter prints dots): chromium 501, firefox 432, webkit 432 at 28f141d and 430 after the two `@no-linux-webkit` tags.

| Round | Commit | Run | E2E | chromium | firefox | webkit | flaky | Visual Regression | Other jobs |
|-------|--------|-----|-----|----------|---------|--------|-------|-------------------|------------|
| 1 | 28f141d (CI command only) | 41565046890 | fail, 1353 passed, 12 failed (39.3 min) | 501/501 | 432/432 | 420/432 | 0 | success | success |
| 2 | 3af9d44 (platform-aware triage) | 41569725056 | success, 1363 passed (35.0 min tests, 36.5 min job) | 501/501 | 432/432 | 430/430 | 0 | success | success |
| 3 | 147bc82 (title fix, final code commit) | 41571031827 | success, 1363 passed (35.2 min tests, 36.6 min job) | 501/501 | 432/432 | 430/430 | 0 | success | success |

The job stays under the 50-minute line, so `timeout-minutes` stays 60. No `gh run rerun` was used. At close-out, `node scripts/ci/check-visual-run.mjs --sha 147bc82df5ad68488e74c57342a0572b217b634a --job "E2E Tests"` and `--job "Visual Regression"` both print PASS (run 41571031827), and `git ls-remote origin refs/heads/ci/12-23` prints 147bc82df5ad68488e74c57342a0572b217b634a.

## Round 3

**no round 3: Visual Regression green on 147bc82df5ad68488e74c57342a0572b217b634a (run 41571031827)**

The round-3 lists of 12-20, 12-21 and 12-22 are all "none", and this plan's list is none too: the only site change, `components/photos/PhotoViewer.tsx`, sets `document.title`, so no pixel on any visual slug moves. No PNG was downloaded, copied or staged (`git diff --cached --name-only` lists no PNG).

Tim's literal reply, 2026-11-03, at the Task 3 checkpoint:

> No round 3

## Files Created/Modified

- `.github/workflows/ci.yml`: the E2E step runs chromium, firefox and webkit with `--fail-on-flaky-tests`
- `playwright.config.ts`: `WEBKIT_PLATFORM_TAGS` and `WEBKIT_INVERT` (per-platform webkit grepInvert), webkit comment cites D-18
- `e2e/helpers/engine.ts` (new): `tabReachesLinks`, `clickFocusesButtons`, `pressButton`
- `components/photos/PhotoViewer.tsx`: head MutationObserver re-applies the shown photo's title while the URL names it
- `e2e/shell.spec.ts`, `e2e/home-ascent.spec.ts`, `e2e/keyboard.spec.ts`, `e2e/contact-form.spec.ts`: Tab-to-link steps follow the platform convention
- `e2e/photos-lightbox.spec.ts`, `e2e/photos-carousel.spec.ts`, `e2e/case-study.spec.ts`, `e2e/photos.spec.ts`: click-focus steps use `pressButton` or a guarded assertion; zoom oracle; `@no-win-webkit` / `@needs-tab-to-links` tags
- `e2e/photos-sweep.spec.ts`, `e2e/projects.spec.ts`, `e2e/demo-clip.spec.ts`: tags with reason comments
- `.planning/phases/12-contact-edge-pages-cleanup-verification/12-23-TRIAGE.md`: the triage, A8 and CI rounds (copied above)
- `.planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md`, `.planning/phases/10-photography/deferred-items.md`: executor outcomes for the rows 12-23 owns

## Decisions Made

See `key-decisions` in the frontmatter. In short: per-platform tags instead of `@chromium-only`; Safari focus conventions only off Linux; the WinCairo crash excluded on Windows WebKit only, with real Safari checking the path; the title race fixed in the site; `timeout-minutes` unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Platform-aware WebKit tags instead of `@chromium-only`**
- **Found during:** Task 1 (local triage), confirmed in Task 2 (CI round 1)
- **Issue:** the plan's only tag was `@chromium-only`, which would also drop the test from Firefox and from both WebKit platforms. CI round 1 showed Linux WebKit passes every Windows-only failure and fails 12 different tests, so one engine-wide tag would have hidden passing coverage.
- **Fix:** three webkit-only tags read by a per-`process.platform` grepInvert in `playwright.config.ts`; Firefox and Chromium keep every test; each tag has a reason comment and a table row (T-12-39 mitigation kept).
- **Files modified:** playwright.config.ts, the tagged specs
- **Verification:** CI run 41571031827 green (webkit 430/430 on Linux); local Windows webkit 417 passed with 15 excluded
- **Committed in:** 4dc1f1d (first as `@no-webkit`), 3af9d44 (renamed and split per platform), 147bc82

**2. [Rule 3 - Blocking] grepInvert tags, never `test.skip`**
- **Found during:** Task 1
- **Issue:** a per-platform skip inside the test would be the obvious mechanism, but `scripts/guards/test-count.mjs` rejects any `.skip(` (07-12 decision), and the plan forbids `.skip(`.
- **Fix:** exclusions live only in the webkit project's grepInvert, driven by title tags.
- **Files modified:** playwright.config.ts
- **Verification:** `grep -rnE '\.(skip|only|fixme)\(' e2e` finds nothing
- **Committed in:** 4dc1f1d, 3af9d44

**3. [Rule 1 - Bug] One non-visual site fix without loading ui-ux-pro-max**
- **Found during:** Task 1 (row 17)
- **Issue:** the plan says UI fixes load ui-ux-pro-max first. The title race fix changes only `document.title` (no markup, style or pixel), so it is not UI work in that sense and the skill was not loaded.
- **Fix:** head MutationObserver in `components/photos/PhotoViewer.tsx`, active only while the URL names the shown photo.
- **Files modified:** components/photos/PhotoViewer.tsx
- **Verification:** Windows WebKit test 10/10 serial (4/10 before), probe 0/8 (6/6 before); leaving by nav, Escape and close keeps the next page's title in all engines; CI green; Visual Regression unchanged
- **Committed in:** aeb3d0f

**4. [Process] A patch-script splice was caught before commit**
- **Found during:** Task 1
- **Issue:** a scripted multi-file spec edit spliced text into the wrong place.
- **Fix:** caught in the diff review before staging and fixed there; no commit ever contained it.
- **Files modified:** none beyond the task's own spec edits
- **Verification:** the committed diffs pass lint, type-check and the full local and CI runs
- **Committed in:** n/a (never committed)

---

**Total deviations:** 4 (2 Rule 3, 1 Rule 1, 1 process note)
**Impact on plan:** the tag mechanism differs from the plan's wording, but its intent is met more closely: nothing is hidden behind a retry, a skip or an unexplained tag, and Firefox and Chromium lose no coverage. No scope creep beyond the one site fix the triage found.

## Issues Encountered

**Still open, not WebKit** (observed, not reproduced in CI):

- `photos-lightbox` "Tab and Shift+Tab, 12 presses each" failed once in Chromium during a local three-engine parallel run (after Tab 1), then passed 10/10 alone. Local load only so far.
- `photos-lightbox` "open nav menu keeps its keys" failed once in Windows WebKit under `--repeat-each=3` (Menu button not refocused after Escape), then 10/10 parallel and 10/10 serial.
- 12-21's two Firefox one-offs (`photos-lightbox.spec.ts:246` Loading photo, `shell.spec.ts:56` teardown protocol error): neither recurred in the three CI runs (firefox 432/432 each, 0 flaky). Outcome recorded in deferred-items.md.

With `--fail-on-flaky-tests` in CI, any of these that recurs there now fails the run and surfaces by itself.

## Safari UAT items for 12-24

Playwright's WebKit is not Safari (A8), so these go to Tim's D-19 real-Safari check (macOS and/or iOS):

1. **The D-19 real-Safari pass** (12-24 item (a)): nav and menu, the Home ascent, the lightbox (open, arrows, Escape), View Transitions between Photographs and a photo, and the contact register.
2. **Back right after opening a photo** (the WinCairo crash path, row 16): on /photos Grid, open a photo and press browser Back at once; also Escape and Close straight after opening. Expected: the lightbox closes, the URL returns to the grid, the page stays alive and focus returns to the tile.
3. **A quick Next right after a photo page loads** (the title fix, row 17): load a photo page directly, press Next immediately. Expected: the tab title names the photo now shown, and leaving the photo (nav link, Escape, close) shows the next page's title.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 12-24 can verify on the CI head: `git ls-remote origin refs/heads/ci/12-23` = 147bc82df5ad68488e74c57342a0572b217b634a, with no round-3 commit; E2E Tests (three engines), Visual Regression, Unit Tests and Lint and Type Check green in run 41571031827.
- VERIFY-02, VERIFY-03 and VERIFY-04 stay Pending in REQUIREMENTS.md: `requirements.ready-ids` blocks all three because 12-24 also declares them and has no SUMMARY yet.
- Local HEAD carries `84f4be3` and this plan's metadata commit on top of 147bc82, unpushed.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- Files: FOUND `e2e/helpers/engine.ts`, `.github/workflows/ci.yml`, `playwright.config.ts`, `components/photos/PhotoViewer.tsx`, `12-23-TRIAGE.md`, `12-23-SUMMARY.md`
- Commits on this branch (`git merge-base --is-ancestor`): FOUND 28f141d, 4dc1f1d, 3af9d44, aeb3d0f, 147bc82, 84f4be3; `gsd-tools check evaluation-scope --plan 12-23 --commits-only` resolves them (status resolved)
- Commit ledger: `git rev-list --count f3e2dad..84f4be3` = 6
- Task 1 criteria: `grep -c -- "--project=webkit" .github/workflows/ci.yml` = 1, `grep -c -- "--fail-on-flaky-tests"` = 1; 17 tags added, each with a reason comment on the line above; final local WebKit run 417 passed recorded with every touched file
- Task 2 criteria: green E2E Tests run 41571031827 on 147bc82 with chromium 501, firefox 432, webkit 430, 0 flaky (`check-visual-run.mjs` PASS at close-out); "no round 3: Visual Regression green on 147bc82df5ad68488e74c57342a0572b217b634a" recorded; `git diff --cached --name-only` lists 0 PNG
- Task 3 criteria: Tim's literal reply "No round 3" quoted; no baseline commit exists
- No `.skip(`, `.only(`, `.fixme(` in e2e; retries unchanged; origin ci/12-23 = 147bc82df5ad68488e74c57342a0572b217b634a
