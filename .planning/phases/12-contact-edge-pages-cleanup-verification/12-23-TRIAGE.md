# 12-23 WebKit triage (copied into 12-23-SUMMARY.md)

Inputs: 12-19's "Local round-level gate" list (28 Windows WebKit failures), the first local
`PW_PROD=1 npx playwright test --project=webkit` run of this plan (Windows, fresh build at
28f141d: 400 passed, 32 failed), and the first three-engine CI run on Linux (run 41565046890 at
28f141d: 1353 passed, 12 failed, 0 flaky; every failure WebKit).

## A8: Linux WebKit vs Windows WebKit (Playwright 1.64)

The old config note ("Linux WebKit known issues with client-side navigation, form validation,
modals and WebGL") is stale. Linux WebKit in CI ran the whole suite with 12 failures, none of them
navigation, forms, modals or WebGL. But Playwright's WebKit is two different engines for this
suite:

| Behaviour | Windows WebKit (WinCairo, local) | Linux WebKit (GTK, CI) |
|-----------|----------------------------------|------------------------|
| Tab onto links | never (Safari default) | yes |
| Mouse click focuses a button | no (focus goes to `<main tabindex="-1">`) | yes |
| History Back while the lightbox open's View Transition commit settles | page crash | fine |
| `page.route` sees `<video>` MP4 requests | no (0 seen) | yes |
| `preload="none"` MP4 not requested before play | honoured | not honoured (GStreamer fetches it) |
| Late `<title>` writes after the photo viewer appears | ~350 ms | not observed |

So the focus conventions live in `e2e/helpers/engine.ts` as "WebKit off Linux" (Windows and macOS
follow Safari's conventions), and every exclusion is per platform. Real Safari is Tim's UAT check
(D-19, 12-24); add: open a photo from the grid and press Back at once (the WinCairo crash path),
and a quick Next right after a photo page loads (the title fix).

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

Counts: tags added 17 (2 `@needs-tab-to-links`, 13 `@no-win-webkit`, 2 `@no-linux-webkit`), each
with a reason comment above the title; no `@chromium-only` added; no `.skip(`, `.only(`, `.fixme(`;
retries unchanged. Firefox keeps every tagged test. Excluded per platform: Windows webkit 15,
Linux webkit 2, macOS webkit 2.

Final local run (Windows, fresh build at 147bc82): `PW_PROD=1 npx playwright test --project=webkit`
417 passed, 0 failed, 0 flaky (432 listed, 15 excluded); e2e/no-webgl.spec.ts 4/4 inside it.
Jest 102 suites / 1658 tests; lint and type-check exit 0.

## CI rounds (ci/12-23, plain pushes under the 12-01 ci.push "yes", Linux, 1 worker, --fail-on-flaky-tests)

Per-engine counts come from the listings (the CI reporter prints dots): chromium 501, firefox 432,
webkit 432 at 28f141d and 430 after the two `@no-linux-webkit` tags.

| Round | Commit | Run | E2E | chromium | firefox | webkit | flaky | Visual Regression | Other jobs |
|-------|--------|-----|-----|----------|---------|--------|-------|-------------------|------------|
| 1 | 28f141d (CI command only) | 41565046890 | fail, 1353 passed, 12 failed (39.3 min) | 501/501 | 432/432 | 420/432 | 0 | success | success |
| 2 | 3af9d44 (platform-aware triage) | 41569725056 | success, 1363 passed (35.0 min tests, 36.5 min job) | 501/501 | 432/432 | 430/430 | 0 | success | success |
| 3 | 147bc82 (title fix, final code commit) | 41571031827 | success, 1363 passed (35.2 min tests, 36.6 min job) | 501/501 | 432/432 | 430/430 | 0 | success | success |

The job stays under the 50-minute line, so `timeout-minutes` stays 60. No `gh run rerun` was used.
`node scripts/ci/check-visual-run.mjs --sha 147bc82 --job "E2E Tests"` prints PASS. This triage
file is a planning-only commit on top of 147bc82 and is not pushed.

No round 3: Visual Regression green on 147bc82df5ad68488e74c57342a0572b217b634a (run 41571031827),
and the round-3 lists of 12-20, 12-21, 12-22 and this plan are all "none".

## Not WebKit (observed, open)

- `photos-lightbox` "Tab and Shift+Tab, 12 presses each" failed once in Chromium during a local
  three-engine parallel run (after Tab 1), then passed 10/10 alone. Local load only so far.
- `photos-lightbox` "open nav menu keeps its keys" failed once in Windows WebKit under
  `--repeat-each=3` (Menu button not refocused after Escape), then 10/10 parallel and 10/10 serial.
- 12-21's two Firefox one-offs (deferred-items, owner 12-23): neither recurred in CI runs below.

## Round 3 expected diffs

none (the only site change, `components/photos/PhotoViewer.tsx`, sets `document.title`; no pixel
on any visual slug moves)
